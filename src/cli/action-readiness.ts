import { execFile } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { resolveManagedTool } from "../domain/managed-tool-resolution.js";
import type { DurableRunRecord } from "../domain/run-result-persistence.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";

import { resolveActionContext } from "./action-context.js";
import {
  archiveReviewSource,
  readSelectedRunChain,
} from "./current-run-chain.js";
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

import { readProjectOrdinal } from "./project-ordinal.js";
export { readProjectOrdinal } from "./project-ordinal.js";

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
    await readProjectOrdinal(request, action === "explore", installation);
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
    action === "review-apply"
  ) {
    await readableFiles(root, ["proposal.md", "design.md", "tasks.md"]);
  }
  if (action === "apply" || action === "revise-apply")
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
    if (request.applicableChecks !== undefined)
      blocked(
        "archive-request-migration",
        "Archive version 2 does not accept applicableChecks",
        packageRunId,
      );
    const history = await readSelectedRunChain(request);
    if (history.kind !== "canonical" || predecessor === null)
      blocked(
        "archive-review-invalid",
        "Canonical Archive predecessor required",
        packageRunId,
      );
    const { review } = archiveReviewSource(history.records, predecessor);
    await archiveReadiness(request, review, installation);
  }
  return "ready";
}

export async function archiveReadiness(
  request: StartRequest,
  review: DurableRunRecord,
  _installation: ManagerInstallation,
) {
  void _installation;
  const author = await effectiveRecord(
    request,
    (await runMaterialLocation(request, review.context.previousRunId!)).record,
  );
  const effectiveReview = await effectiveRecord(request, review);
  assertReviewBinding(author, effectiveReview.result.facts);
  await checkReviewCandidate(request, author, effectiveReview.result.facts);
  await checkDeclaredProofs(
    request,
    review.context.runId,
    effectiveReview.result.facts.proofRefs ?? [],
  );
  return { author, review: effectiveReview };
}
