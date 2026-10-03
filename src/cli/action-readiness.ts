import { execFile } from "node:child_process";
import {
  cp,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual, promisify } from "node:util";
import { resolveManagedTool } from "../domain/managed-tool-resolution.js";
import {
  parseRunOccurrenceId,
  readDurableRun,
  type DurableRunRecord,
} from "../domain/run-result-persistence.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { openSpecArchiveDate } from "../internal/openspec-archive-date.js";
import {
  fullTestPath,
  resolveFullTestProgram,
} from "../internal/full-test-input.js";
import { resolveActionContext } from "./action-context.js";
import {
  checkArtifactHashes,
  checkExplorePredecessorForReview,
  checkPlanningArtifactHashes,
} from "./action-artifact-hashes.js";
import { checkDeclaredProofs } from "./action-proof.js";
import type { ActionTarget, StartRequest } from "./action-request.js";
import { blocked } from "./action-error.js";
import { readCoordinationManifest } from "./trusted-change-coordination.js";
import {
  assertReviewBinding,
  checkReviewCandidate,
} from "./review-candidate.js";
import { effectiveRecord, runMaterialLocation } from "./run-effective-facts.js";
import { uniqueRunGroup } from "../internal/proof-path-owner.js";
import {
  archiveDiagnosticAttempt,
  recordArchiveDependencySnapshot,
  runArchiveProcess,
} from "../internal/archive-process.js";
import {
  archiveChildEnvironment,
  assertArchiveSourceFiles,
  copyArchiveDependencies,
  dependencyInputHashes,
} from "../internal/archive-dependency-snapshot.js";
import {
  affectedSpecHashes,
  directoryHashes,
} from "../internal/archive-file-identities.js";
import { resolveActionGuidanceRef } from "../domain/action-guidance-execution.js";
import {
  configuredArchiveChecks,
  optionalTargetJson,
} from "./archive-check-selection.js";

const exec = promisify(execFile);
async function strictValidate(
  target: ActionTarget,
  installation: ManagerInstallation,
): Promise<void> {
  const tool = await resolveManagedTool({
    installation,
    flowkitHome: target.flowkitHome,
    toolId: "openspec",
  });
  try {
    await exec(
      process.execPath,
      [tool.entrypoint, "validate", target.changeId, "--strict"],
      { cwd: target.repositoryRoot, timeout: 120_000 },
    );
  } catch {
    blocked(
      "openspec-validation-failed",
      "Exact OpenSpec strict validation failed",
    );
  }
}
async function readableFiles(
  root: string,
  names: readonly string[],
): Promise<void> {
  for (const name of names) {
    const stat = await lstat(path.join(root, name));
    if (!stat.isFile() || stat.isSymbolicLink())
      blocked(
        "planning-artifact-invalid",
        `Invalid planning artifact: ${name}`,
      );
    await readFile(path.join(root, name));
  }
}
export async function readProjectOrdinal(
  target: ActionTarget,
  allowUnassigned = false,
): Promise<number> {
  const { parse } = await import("yaml");
  const manifestRoot = path.join(
    target.repositoryRoot,
    "openspec",
    "delivery-groups",
  );
  const ordinals = new Set<number>();
  let selected: number | null = null;
  for (const file of await readdir(manifestRoot)) {
    if (!file.endsWith(".yaml")) continue;
    const document = parse(
      await readFile(path.join(manifestRoot, file), "utf8"),
    ) as { changes?: { id?: unknown; projectOrdinal?: unknown }[] };
    if (!Array.isArray(document?.changes))
      blocked(
        "project-ordinal-invalid",
        "Delivery manifest lacks Change entries",
      );
    for (const change of document.changes) {
      const value = change.projectOrdinal;
      if (value === undefined) continue;
      if (
        typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value < 1 ||
        ordinals.has(value)
      )
        blocked(
          "project-ordinal-invalid",
          "Project ordinal is malformed or duplicated",
        );
      ordinals.add(value);
      if (file === `${target.deliveryId}.yaml` && change.id === target.changeId)
        selected = value;
    }
  }
  if (selected === null && allowUnassigned && ordinals.size > 0)
    return Math.max(...ordinals) + 1;
  if (selected === null)
    blocked(
      "project-ordinal-invalid",
      "Exact Change has no assigned project ordinal or durable baseline",
    );
  return selected;
}
export async function packageReadiness(
  request: StartRequest,
  packageRunId: string,
  predecessor: DurableRunRecord | null,
  installation: ManagerInstallation,
): Promise<"ready"> {
  const root = path.join(
    request.repositoryRoot,
    "openspec",
    "changes",
    request.changeId,
  );
  const action = request.actionId;
  if (
    request.ownerAuthority !== undefined &&
    predecessor?.result.reviewerVerdict === "rejected"
  ) {
    const review = await effectiveRecord(request, predecessor);
    if (review.context.previousRunId === null)
      blocked(
        "review-candidate-unbound",
        "Rejected Review has no direct Author",
      );
    const author = await effectiveRecord(
      request,
      (await runMaterialLocation(request, review.context.previousRunId!))
        .record,
    );
    assertReviewBinding(author, review.result.facts);
  }
  if (
    predecessor !== null &&
    (action.startsWith("review-") || action === "archive")
  )
    predecessor = await effectiveRecord(request, predecessor);
  if (
    action === "explore" ||
    action === "revise-explore" ||
    action === "archive"
  ) {
    const manifest = await readCoordinationManifest(
      request.repositoryRoot,
      request.deliveryId,
    );
    const entry = manifest.changes.find(
      (change) => change.id === request.changeId,
    );
    if (!entry || entry.state !== "active")
      blocked(
        "coordination-not-active",
        "Exact Change is not active",
        packageRunId,
      );
    // The ordinal is coordination data; never infer it from Run numbering.
    await readProjectOrdinal(request, action === "explore");
  }
  if (
    action === "review-explore" ||
    action === "review-propose" ||
    action === "review-apply"
  ) {
    if (
      predecessor?.context.role !== "author" ||
      predecessor.context.lifecycleState !== "terminal" ||
      predecessor.result.authorConclusion !== "PASS"
    )
      blocked(
        "review-input-invalid",
        "Exact terminal Author candidate required",
        packageRunId,
      );
  }
  if (action === "review-explore" && predecessor !== null) {
    await checkExplorePredecessorForReview(request, predecessor);
    await checkDeclaredProofs(
      request,
      predecessor.context.runId,
      predecessor.result.facts.proofRefs ?? [],
    );
  }
  if (
    action === "review-propose" ||
    action === "apply" ||
    action === "revise-apply" ||
    action === "review-apply" ||
    action === "archive"
  ) {
    await readableFiles(root, ["proposal.md", "design.md", "tasks.md"]);
  }
  if (action === "apply" || action === "revise-apply" || action === "archive")
    await strictValidate(request, installation);
  if (["review-propose", "apply", "revise-apply"].includes(action)) {
    const observed = await resolveActionContext(request, installation);
    if (!observed.openSpec.exactChange?.isPlanningComplete)
      blocked(
        "planning-incomplete",
        "OpenSpec planning is incomplete",
        packageRunId,
      );
  }
  if (action === "review-propose" && predecessor !== null) {
    await checkPlanningArtifactHashes(
      request,
      predecessor.result.facts.artifactHashes,
    );
  }
  if (action === "review-apply" && predecessor !== null) {
    await checkReviewCandidate(request, predecessor, {
      reviewedRunId: predecessor.context.runId,
    });
    await checkArtifactHashes(
      request.repositoryRoot,
      predecessor.result.facts.artifactHashes,
    );
    await checkDeclaredProofs(
      request,
      predecessor.context.runId,
      predecessor.result.facts.proofRefs ?? [],
    );
  }
  if (action === "archive") {
    if (
      predecessor?.context.actionIdentity.actionId !== "review-apply" ||
      predecessor.result.reviewerVerdict !== "approved"
    )
      blocked(
        "archive-review-invalid",
        "Accepted review-apply required",
        packageRunId,
      );
    await archiveReadiness(request, predecessor, installation);
  }
  return "ready";
}

export { configuredArchiveChecks } from "./archive-check-selection.js";
export async function archiveReadiness(
  request: StartRequest,
  review: DurableRunRecord,
  installation: ManagerInstallation,
  diagnostic?: { trigger: "start" | "archive"; runId: string | null },
) {
  const priorId = review.context.previousRunId;
  const priorOccurrence = parseRunOccurrenceId(priorId);
  if (priorOccurrence === null || !request.applicableChecks?.length)
    blocked(
      "archive-checks-missing",
      "Archive requires declared applicable verification",
    );
  const group = path.join(
    request.repositoryRoot,
    ".flowkit",
    "runs",
    request.deliveryId,
  );
  const names = (await readdir(group)).filter((name) =>
    name.endsWith(`-${request.changeId}`),
  );
  if (names.length !== 1)
    blocked("archive-run-group-invalid", "Archive has no unique Run group");
  const changeStartSequence = Number(
    names[0].slice(0, -(request.changeId.length + 1)),
  );
  const author = await effectiveRecord(
    request,
    await readDurableRun({
      repositoryRoot: request.repositoryRoot,
      deliveryId: request.deliveryId,
      changeId: request.changeId,
      changeStartSequence,
      occurrence: priorOccurrence,
    }),
  );
  await checkReviewCandidate(request, author, review.result.facts);
  const hashes = author.result.facts.artifactHashes;
  const manifestText = await readFile(
    path.join(
      request.repositoryRoot,
      "openspec",
      "delivery-groups",
      `${request.deliveryId}.yaml`,
    ),
    "utf8",
  );
  const { parse } = await import("yaml");
  const manifest = parse(manifestText) as {
    changes?: { id: string; state: string; projectOrdinal?: unknown }[];
  };
  const exact = manifest.changes?.find(
    (change) => change.id === request.changeId,
  );
  if (
    !exact ||
    exact.state !== "active" ||
    !Number.isSafeInteger(exact.projectOrdinal)
  )
    blocked(
      "archive-completion-unready",
      "Completion transition cannot be materialized",
    );
  const targetName = `${openSpecArchiveDate()}-${String(exact.projectOrdinal).padStart(3, "0")}-${request.changeId}`;
  try {
    await lstat(
      path.join(
        request.repositoryRoot,
        "openspec",
        "changes",
        "archive",
        targetName,
      ),
    );
    blocked("archive-target-collision", "Archive target already exists");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const checks = await configuredArchiveChecks(request);
  const sourcePath = `openspec/changes/${request.changeId}`;
  const sourceFiles = await directoryHashes(request.repositoryRoot, sourcePath);
  if (sourceFiles === null)
    blocked("archive-source-missing", "Archive source missing");
  const specsBefore = await affectedSpecHashes(
    request.repositoryRoot,
    sourceFiles,
  );
  const inputsBefore = await dependencyInputHashes(request.repositoryRoot);
  const runGroup = uniqueRunGroup(await readdir(group), request.changeId);
  const attempt = await archiveDiagnosticAttempt(
    request.repositoryRoot,
    request.deliveryId,
    runGroup,
    {
      repositoryRoot: request.repositoryRoot,
      deliveryId: request.deliveryId,
      changeId: request.changeId,
      trigger: diagnostic?.trigger ?? "start",
      runId: diagnostic?.runId ?? null,
      candidate: hashes,
      package: { name: installation.name, version: installation.version },
      reviewRunId: review.context.runId,
      guidanceRef: await resolveActionGuidanceRef(installation, "archive"),
    },
  );
  const scratch = await mkdtemp(path.join(tmpdir(), "flowkit-archive-"));
  if (
    path.dirname(scratch) !== tmpdir() ||
    !path.basename(scratch).startsWith("flowkit-archive-")
  )
    blocked("archive-scratch-invalid", "Unsafe archive scratch directory");
  try {
    const packageValue = (await optionalTargetJson(
      request.repositoryRoot,
      "package.json",
    )) as { packageManager?: string } | null;
    if (packageValue?.packageManager?.startsWith("pnpm@11.")) {
      const version = await runArchiveProcess(
        request.repositoryRoot,
        attempt,
        "source-pnpm-version",
        "pnpm",
        ["--version"],
        request.repositoryRoot,
        {
          timeout: 120_000,
          shell: process.platform === "win32",
          env: archiveChildEnvironment(false),
        },
      );
      const actual = (
        await readFile(
          path.join(request.repositoryRoot, version.command.stdout),
          "utf8",
        )
      ).trim();
      if (
        actual !==
        packageValue.packageManager.slice("pnpm@".length).split("+")[0]
      )
        blocked(
          "archive-package-manager-mismatch",
          `Expected ${packageValue.packageManager}, actual pnpm@${actual}; ${version.path}`,
        );
      await runArchiveProcess(
        request.repositoryRoot,
        attempt,
        "source-dependencies",
        "pnpm",
        [
          "--config.verify-deps-before-run=error",
          "exec",
          "--",
          process.execPath,
          "--version",
        ],
        request.repositoryRoot,
        {
          timeout: 120_000,
          shell: process.platform === "win32",
          env: archiveChildEnvironment(false),
        },
      );
    }
    const workspaceModules: string[] = [];
    for (const name of await readdir(request.repositoryRoot)) {
      if (
        [
          ".git",
          ".flowkit",
          ".tmp",
          "dist",
          "node_modules",
          "architecture",
        ].includes(name)
      )
        continue;
      workspaceModules.push(
        ...(
          await assertArchiveSourceFiles(
            path.join(request.repositoryRoot, name),
          )
        ).map((directory) => path.relative(request.repositoryRoot, directory)),
      );
      await cp(
        path.join(request.repositoryRoot, name),
        path.join(scratch, name),
        {
          recursive: true,
          force: false,
          filter: (file) => path.basename(file) !== "node_modules",
        },
      );
    }
    const mappings = await copyArchiveDependencies(
      request.repositoryRoot,
      scratch,
      workspaceModules,
    );
    if (
      !isDeepStrictEqual(
        inputsBefore,
        await dependencyInputHashes(request.repositoryRoot),
      )
    )
      blocked(
        "archive-dependency-drift",
        "Source dependency inputs changed during snapshot",
      );
    await recordArchiveDependencySnapshot(request.repositoryRoot, attempt, {
      sourceInputsBefore: inputsBefore,
      sourceInputsAfterCopy: await dependencyInputHashes(
        request.repositoryRoot,
      ),
      scratchInputs: await dependencyInputHashes(scratch),
      mappings,
    });
    if (
      !isDeepStrictEqual(
        await configuredArchiveChecks({ ...request, repositoryRoot: scratch }),
        checks,
      )
    )
      blocked(
        "archive-check-config-drift",
        "Copied target check config changed",
      );
    const tool = await resolveManagedTool({
      installation,
      flowkitHome: request.flowkitHome,
      toolId: "openspec",
    });
    try {
      await runArchiveProcess(
        request.repositoryRoot,
        attempt,
        "openspec-convergence",
        process.execPath,
        [tool.entrypoint, "archive", request.changeId, "--yes", "--json"],
        scratch,
        { timeout: 120_000, env: archiveChildEnvironment(true) },
      );
    } catch (error) {
      blocked(
        "archive-convergence-failed",
        `Isolated OpenSpec canonical convergence failed: ${String(error)}`,
      );
    }
    const defaultTarget = path.join(
      scratch,
      "openspec",
      "changes",
      "archive",
      `${openSpecArchiveDate()}-${request.changeId}`,
    );
    const converged = await lstat(defaultTarget).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    });
    if (!converged?.isDirectory())
      blocked(
        "archive-convergence-failed",
        "OpenSpec did not create exact archive target",
      );
    await rename(
      defaultTarget,
      path.join(path.dirname(defaultTarget), targetName),
    );
    for (const check of checks) {
      try {
        const cwd =
          check.kind === "configured-command"
            ? await fullTestPath(scratch, check.cwd)
            : scratch;
        const program =
          check.kind === "configured-command"
            ? await resolveFullTestProgram(cwd, check.program)
            : check.runner;
        const args =
          check.kind === "configured-command" ? check.args : ["run", check.id];
        await runArchiveProcess(
          request.repositoryRoot,
          attempt,
          `check-${check.id}`,
          program,
          args,
          cwd,
          {
            shell: check.kind === "script" && process.platform === "win32",
            timeout: 300_000,
            env: archiveChildEnvironment(true),
          },
        );
      } catch (error) {
        blocked(
          "archive-check-failed",
          `Post-convergence check failed: ${check.id}: ${String(error)}`,
        );
      }
    }
    if (
      !isDeepStrictEqual(
        inputsBefore,
        await dependencyInputHashes(request.repositoryRoot),
      )
    )
      blocked(
        "archive-dependency-drift",
        "Source dependency inputs changed during checks",
      );
    await checkReviewCandidate(request, author, review.result.facts);
    await checkDeclaredProofs(
      request,
      review.context.runId,
      review.result.facts.proofRefs ?? [],
    );
    if (
      !isDeepStrictEqual(
        sourceFiles,
        await directoryHashes(request.repositoryRoot, sourcePath),
      ) ||
      !isDeepStrictEqual(
        specsBefore,
        await affectedSpecHashes(request.repositoryRoot, sourceFiles),
      )
    )
      blocked(
        "archive-source-drift",
        "Source Change/spec input changed during checks",
      );
    if (
      !isDeepStrictEqual(
        sourceFiles,
        await directoryHashes(
          scratch,
          `openspec/changes/archive/${targetName}`,
        ),
      )
    )
      blocked(
        "archive-convergence-drift",
        "Archive changed source content or file set",
      );
    return {
      sourceFiles,
      specsBefore,
      specsAfter: await affectedSpecHashes(scratch, sourceFiles),
      diagnosticRef: attempt,
      dependencyMappings: mappings,
    };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
