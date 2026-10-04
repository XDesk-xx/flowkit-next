import { isDeepStrictEqual } from "node:util";
import type {
  DurableRunRecord,
  JsonObject,
} from "../domain/run-result-persistence.js";
import type { ActionTarget } from "./action-request.js";
import {
  checkArtifactHashes,
  checkExplorePredecessorForReview,
  checkPlanningArtifactHashes,
} from "./action-artifact-hashes.js";
import {
  assertCandidateGitBytes,
  candidateGitProjection,
} from "../internal/candidate-git-bytes.js";
import { blocked } from "./action-error.js";
import { checkDeclaredProofs } from "./action-proof.js";

export function assertReviewBinding(
  author: DurableRunRecord | null,
  facts: JsonObject,
) {
  if (
    author === null ||
    author.context.role !== "author" ||
    author.context.lifecycleState !== "terminal" ||
    author.result.authorConclusion !== "PASS" ||
    facts.reviewedRunId !== author.context.runId ||
    (Object.hasOwn(facts, "reviewedAuthorRunId") &&
      facts.reviewedAuthorRunId !== author.context.runId) ||
    (Object.hasOwn(facts, "artifactHashes") &&
      !isDeepStrictEqual(
        facts.artifactHashes,
        author.result.facts.artifactHashes,
      )) ||
    (Object.hasOwn(facts, "candidateGit") &&
      !isDeepStrictEqual(facts.candidateGit, author.result.facts.candidateGit))
  )
    blocked(
      "review-candidate-unbound",
      `Review must bind exact direct terminal Author ${author?.context.runId ?? "missing"}; aliases/candidate must agree`,
    );
  return author;
}
export async function checkReviewCandidate(
  target: ActionTarget,
  author: DurableRunRecord | null,
  facts: JsonObject,
) {
  author = assertReviewBinding(author, facts);
  await checkDeclaredProofs(
    target,
    author.context.runId,
    author.result.facts.proofRefs ?? [],
  );
  const action = author.context.actionIdentity.actionId;
  if (action === "explore" || action === "revise-explore")
    await checkExplorePredecessorForReview(target, author);
  else if (action === "propose" || action === "revise-propose")
    await checkPlanningArtifactHashes(
      target,
      author.result.facts.artifactHashes,
    );
  else {
    await checkArtifactHashes(
      target.repositoryRoot,
      author.result.facts.artifactHashes,
    );
  }
  const hashes = (author.result.facts.artifactHashes ?? {}) as JsonObject;
  const candidates =
    action === "explore" || action === "revise-explore"
      ? {
          ...hashes,
          [String(
            author.result.facts.exploreArtifact ??
              `openspec/changes/${target.changeId}/explore.md`,
          )]:
            author.result.facts.exploreSha256 ??
            hashes[`openspec/changes/${target.changeId}/explore.md`],
        }
      : hashes;
  if (author.result.facts.candidateGit !== undefined)
    await candidateGitProjection(
      target.repositoryRoot,
      candidates,
      author.result.facts.candidateGit,
    );
  else
    for (const relative of Object.keys(candidates))
      await assertCandidateGitBytes(target.repositoryRoot, relative);
}
