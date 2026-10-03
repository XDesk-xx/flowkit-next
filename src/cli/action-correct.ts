import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { assertManagedEvidenceGitBytes } from "../internal/managed-evidence-git.js";
import { assertCandidateGitBytes } from "../internal/candidate-git-bytes.js";
import { checkArtifactHashes } from "./action-artifact-hashes.js";
import { resolveActionContext } from "./action-context.js";
import { blocked } from "./action-error.js";
import { ActionCommandError } from "./action-error.js";
import type { CorrectRequest } from "./action-request.js";
import {
  checkCorrectionConsumer,
  readEffectiveRun,
  runMaterialLocation,
  validateCorrectionAdditions,
  type RunCorrection,
} from "./run-effective-facts.js";

export async function correctAction(
  request: CorrectRequest,
  installation: ManagerInstallation,
) {
  const selected = (await resolveActionContext(request, installation)).selected;
  if (
    selected?.changeState !== "active" ||
    selected.history.kind !== "canonical"
  )
    blocked(
      "correction-target-invalid",
      "Active canonical Change required",
      request.runId,
    );
  const tip = selected.history.current;
  const location = await runMaterialLocation(request, request.runId);
  const original = location.record;
  if (
    tip === null ||
    original.context.lifecycleState !== "terminal" ||
    request.role !== original.context.role ||
    !(
      tip.context.runId === request.runId ||
      (request.role === "author" &&
        tip.context.role === "reviewer" &&
        tip.context.lifecycleState === "terminal" &&
        tip.context.previousRunId === request.runId)
    ) ||
    !isDeepStrictEqual(request.expectedRunHashes, location.originalHashes)
  )
    blocked(
      "correction-run-invalid",
      "Exact terminal original/Role/current consumer required",
      request.runId,
    );
  const correction: RunCorrection = {
    formatVersion: 1,
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    runId: request.runId,
    role: request.role,
    originalHashes: location.originalHashes,
    ownerAuthority: request.ownerAuthority,
    additions: request.additions,
    candidateEvidenceRef: request.candidateEvidenceRef,
    createdAt: new Date().toISOString(),
  };
  await validateCorrectionAdditions(request, original, correction);
  if (request.role === "author") {
    await checkArtifactHashes(
      request.repositoryRoot,
      request.additions.artifactHashes,
    );
    for (const relative of Object.keys(
      request.additions.artifactHashes as object,
    ))
      await assertCandidateGitBytes(request.repositoryRoot, relative);
  }
  const directory = path.dirname(
    path.join(request.repositoryRoot, location.correctionPath),
  );
  const names = await readdir(directory).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    },
  );
  if (names !== null) {
    const view = await readEffectiveRun(request, request.runId);
    const existing = JSON.parse(
      await readFile(
        path.join(request.repositoryRoot, location.correctionPath),
        "utf8",
      ),
    ) as RunCorrection;
    if (
      !isDeepStrictEqual(
        { ...existing, createdAt: correction.createdAt },
        correction,
      )
    )
      blocked(
        "correction-conflict",
        "Existing correction differs; original bytes retained",
        request.runId,
      );
    return {
      kind: "action-correct",
      effect: "confirmed",
      runId: request.runId,
      duplicate: true,
      correctionRef: view.correctionRef,
    };
  }
  // Existing Review reuse needs declared candidate proof before the first append.
  // A subsequently admitted Review can omit its optional map; its finish checks the effective Author.
  if (request.role === "author")
    await checkCorrectionConsumer(
      request,
      original,
      { ...original.result.facts, ...request.additions },
      location.group,
      true,
    );
  await assertManagedEvidenceGitBytes(
    request.repositoryRoot,
    location.correctionPath,
  );
  // Check the exact original again immediately before the sole create-once write.
  if (
    !isDeepStrictEqual(
      (await runMaterialLocation(request, request.runId)).originalHashes,
      location.originalHashes,
    )
  )
    blocked(
      "correction-original-drift",
      "Original Run changed before correction",
      request.runId,
    );
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(request.repositoryRoot, location.correctionPath),
      JSON.stringify(correction, null, 2) + "\n",
      { flag: "wx" },
    );
    const view = await readEffectiveRun(request, request.runId);
    return {
      kind: "action-correct",
      effect: "confirmed",
      runId: request.runId,
      duplicate: false,
      correctionRef: view.correctionRef,
    };
  } catch (error) {
    throw new ActionCommandError(
      "correction-write-unconfirmed",
      "written-unconfirmed",
      request.runId,
      `Preserve ${location.correctionPath}; ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
