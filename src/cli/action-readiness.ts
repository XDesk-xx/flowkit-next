import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  cp,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
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
import {
  fullTestPath,
  fullTestRelative,
  resolveFullTestProgram,
} from "../internal/full-test-input.js";
import { resolveActionContext } from "./action-context.js";
import { checkDeclaredProofs } from "./action-proof.js";
import type { ActionTarget, StartRequest } from "./action-request.js";
import { blocked } from "./action-error.js";
import { readCoordinationManifest } from "./trusted-change-coordination.js";

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
async function checkArtifactHashes(
  root: string,
  hashes: unknown,
): Promise<void> {
  if (
    typeof hashes !== "object" ||
    hashes === null ||
    Array.isArray(hashes) ||
    Object.keys(hashes).length === 0
  )
    blocked(
      "artifact-hashes-missing",
      "Exact candidate artifact hashes required",
    );
  for (const [relative, expected] of Object.entries(hashes)) {
    if (
      !relative ||
      relative.includes("\\") ||
      relative
        .split("/")
        .some((part) => !part || part === "." || part === "..") ||
      typeof expected !== "string" ||
      !/^[0-9a-f]{64}$/.test(expected)
    )
      blocked("artifact-hash-invalid", "Invalid candidate artifact identity");
    let file = await realpath(root);
    for (const segment of relative.split("/")) {
      file = path.join(file, segment);
      if ((await lstat(file)).isSymbolicLink())
        blocked(
          "artifact-hash-invalid",
          `Candidate artifact is linked: ${relative}`,
        );
    }
    if (!(await lstat(file)).isFile())
      blocked(
        "artifact-hash-invalid",
        `Candidate artifact is not regular: ${relative}`,
      );
    if (
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex") !== expected
    )
      blocked("artifact-drift", `Candidate artifact changed: ${relative}`);
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
    const artifact = predecessor.result.facts.exploreArtifact;
    const hash = predecessor.result.facts.exploreSha256;
    if (typeof artifact !== "string" || typeof hash !== "string")
      blocked(
        "explore-artifact-missing",
        "Exact Explore artifact identity required",
        packageRunId,
      );
    await checkArtifactHashes(request.repositoryRoot, { [artifact]: hash });
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
    await checkArtifactHashes(root, predecessor.result.facts.artifactHashes);
  }
  if (action === "review-apply" && predecessor !== null) {
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

type ArchiveCheck =
  | { readonly kind: "script"; readonly id: string; readonly runner: string }
  | {
      readonly kind: "configured-command";
      readonly id: string;
      readonly program: string;
      readonly args: readonly string[];
      readonly cwd: string;
    };

async function optionalTargetJson(
  root: string,
  relative: string,
): Promise<unknown> {
  const file = path.join(root, ...relative.split("/"));
  const stat = await lstat(file).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (stat === null) return null;
  if (!stat.isFile() || stat.isSymbolicLink())
    blocked(
      "archive-check-unconfigured",
      `Invalid target check config: ${relative}`,
    );
  try {
    return JSON.parse(
      await readFile(await fullTestPath(root, relative), "utf8"),
    );
  } catch {
    blocked(
      "archive-check-unconfigured",
      `Unreadable target check config: ${relative}`,
    );
  }
}

async function configuredArchiveChecks(
  request: StartRequest,
): Promise<ArchiveCheck[]> {
  const packageValue = await optionalTargetJson(
    request.repositoryRoot,
    "package.json",
  );
  const scripts =
    typeof packageValue === "object" &&
    packageValue !== null &&
    "scripts" in packageValue &&
    typeof packageValue.scripts === "object" &&
    packageValue.scripts !== null &&
    !Array.isArray(packageValue.scripts)
      ? (packageValue.scripts as Record<string, unknown>)
      : {};
  const managerValue =
    typeof packageValue === "object" &&
    packageValue !== null &&
    "packageManager" in packageValue &&
    typeof packageValue.packageManager === "string"
      ? packageValue.packageManager
      : undefined;
  const declaredManager =
    managerValue === undefined
      ? undefined
      : /^([a-z][a-z0-9-]*)@[^\s]+$/.exec(managerValue)?.[1];
  if (managerValue !== undefined && declaredManager === undefined)
    blocked("archive-check-unconfigured", "Invalid target packageManager");
  const runner = declaredManager ?? "npm";
  const fullTestValue = await optionalTargetJson(
    request.repositoryRoot,
    "config/verification/full-test.json",
  );
  const configured =
    typeof fullTestValue === "object" &&
    fullTestValue !== null &&
    "checks" in fullTestValue &&
    Array.isArray(fullTestValue.checks)
      ? (fullTestValue.checks as unknown[])
      : [];
  const selected: ArchiveCheck[] = [];
  for (const declared of request.applicableChecks ?? []) {
    const script = scripts[declared.id];
    const matches = configured.filter(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "checkId" in entry &&
        entry.checkId === declared.id,
    );
    if (matches.length > 1 || (typeof script === "string" && matches.length))
      blocked(
        "archive-check-unconfigured",
        `Ambiguous archive check: ${declared.id}`,
      );
    if (typeof script === "string" && script.trim()) {
      selected.push({ kind: "script", id: declared.id, runner });
      continue;
    }
    const match = matches[0];
    if (
      typeof match !== "object" ||
      match === null ||
      !("program" in match) ||
      typeof match.program !== "string" ||
      !match.program ||
      [...match.program].some((char) => char.charCodeAt(0) < 32) ||
      !("args" in match) ||
      !Array.isArray(match.args) ||
      !match.args.every(
        (arg) => typeof arg === "string" && !arg.includes("\0"),
      ) ||
      !("cwd" in match) ||
      !fullTestRelative(match.cwd, true)
    )
      blocked(
        "archive-check-unconfigured",
        `Unconfigured archive check: ${declared.id}`,
      );
    selected.push({
      kind: "configured-command",
      id: declared.id,
      program: match.program,
      args: match.args as string[],
      cwd: match.cwd,
    });
  }
  return selected;
}

async function archiveReadiness(
  request: StartRequest,
  review: DurableRunRecord,
  installation: ManagerInstallation,
): Promise<void> {
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
  const author = await readDurableRun({
    repositoryRoot: request.repositoryRoot,
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeStartSequence,
    occurrence: priorOccurrence,
  });
  if (
    author.context.role !== "author" ||
    author.context.lifecycleState !== "terminal" ||
    author.result.authorConclusion !== "PASS" ||
    review.result.facts.reviewedRunId !== author.context.runId
  )
    blocked(
      "archive-candidate-unbound",
      "Review is not bound to exact Author candidate",
    );
  const hashes = author.result.facts.artifactHashes;
  if (
    typeof hashes !== "object" ||
    hashes === null ||
    Array.isArray(hashes) ||
    Object.keys(hashes).length === 0
  )
    blocked(
      "archive-candidate-unbound",
      "Author candidate has no exact artifact hashes",
    );
  for (const [relative, hash] of Object.entries(hashes)) {
    if (
      !relative ||
      relative.includes("\\") ||
      relative
        .split("/")
        .some((part) => !part || part === "." || part === "..") ||
      typeof hash !== "string" ||
      !/^[0-9a-f]{64}$/.test(hash)
    )
      blocked("archive-candidate-invalid", "Invalid candidate file identity");
    let file = await realpath(request.repositoryRoot);
    for (const segment of relative.split("/")) {
      file = path.join(file, segment);
      if ((await lstat(file)).isSymbolicLink())
        blocked("archive-candidate-invalid", "Candidate path is linked");
    }
    if (!(await lstat(file)).isFile())
      blocked("archive-candidate-invalid", "Candidate file missing");
    if (
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex") !== hash
    )
      blocked(
        "archive-candidate-drift",
        `Reviewed candidate changed: ${relative}`,
      );
  }
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
  const targetName = `${new Date().toISOString().slice(0, 10)}-${String(exact.projectOrdinal).padStart(3, "0")}-${request.changeId}`;
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
  const scratch = await mkdtemp(path.join(tmpdir(), "flowkit-archive-"));
  if (
    path.dirname(scratch) !== tmpdir() ||
    !path.basename(scratch).startsWith("flowkit-archive-")
  )
    blocked("archive-scratch-invalid", "Unsafe archive scratch directory");
  try {
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
      await cp(
        path.join(request.repositoryRoot, name),
        path.join(scratch, name),
        { recursive: true, force: false },
      );
    }
    const modules = await lstat(
      path.join(request.repositoryRoot, "node_modules"),
    ).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    });
    if (modules?.isDirectory())
      await symlink(
        path.join(request.repositoryRoot, "node_modules"),
        path.join(scratch, "node_modules"),
        "junction",
      );
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
      await exec(
        process.execPath,
        [tool.entrypoint, "archive", request.changeId, "--yes", "--json"],
        { cwd: scratch, timeout: 120_000 },
      );
    } catch {
      blocked(
        "archive-convergence-failed",
        "Isolated OpenSpec canonical convergence failed",
      );
    }
    const defaultTarget = path.join(
      scratch,
      "openspec",
      "changes",
      "archive",
      `${new Date().toISOString().slice(0, 10)}-${request.changeId}`,
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
        await exec(program, args, {
          cwd,
          shell: check.kind === "script" && process.platform === "win32",
          timeout: 300_000,
          maxBuffer: 16 * 1024 * 1024,
        });
      } catch {
        blocked(
          "archive-check-failed",
          `Post-convergence check failed: ${check.id}`,
        );
      }
    }
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
