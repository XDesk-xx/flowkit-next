import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { observeOpenSpecChangeStatus } from "../domain/openspec-observation.js";
import type {
  DurableRunRecord,
  JsonObject,
} from "../domain/run-result-persistence.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import type { ActionTarget, FinishRequest } from "./action-request.js";
import { blocked } from "./action-error.js";
import { candidateGitProjection } from "../internal/candidate-git-bytes.js";

export async function checkArtifactHashes(
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

export async function checkPlanningArtifactHashes(
  target: ActionTarget,
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
      "Exact planning artifact hashes required",
    );
  const prefix = `openspec/changes/${target.changeId}/`;
  for (const relative of Object.keys(hashes)) {
    const tail = relative.startsWith(prefix)
      ? relative.slice(prefix.length)
      : "";
    if (
      !["proposal.md", "design.md", "tasks.md"].includes(tail) &&
      !/^specs\/(?:[^/.][^/]*\/)+spec\.md$/u.test(tail)
    )
      blocked("artifact-hash-invalid", `Wrong planning path: ${relative}`);
  }
  await checkArtifactHashes(target.repositoryRoot, hashes);
}

function isExploreAction(actionId: string): boolean {
  return actionId === "explore" || actionId === "revise-explore";
}

async function checkExploreArtifact(
  target: ActionTarget,
  facts: JsonObject,
  allowLegacy: boolean,
): Promise<void> {
  const expected = `openspec/changes/${target.changeId}/explore.md`;
  const hasPath = Object.hasOwn(facts, "exploreArtifact");
  const hasHash = Object.hasOwn(facts, "exploreSha256");
  if (hasPath !== hasHash)
    blocked("explore-artifact-missing", "Explore artifact identity is partial");

  const hashes = facts.artifactHashes;
  const hashMap =
    typeof hashes === "object" && hashes !== null && !Array.isArray(hashes)
      ? hashes
      : null;
  const entries = Object.entries(hashMap ?? {}).filter(([relative]) =>
    relative.endsWith("/explore.md"),
  );
  if (
    entries.length > 1 ||
    (entries.length === 1 && entries[0][0] !== expected)
  )
    blocked("explore-artifact-invalid", "Explore artifact path is ambiguous");

  let artifact: unknown = facts.exploreArtifact;
  let hash: unknown = facts.exploreSha256;
  if (!hasPath) {
    if (!allowLegacy || entries.length !== 1)
      blocked(
        "explore-artifact-missing",
        "Exact Explore artifact identity required",
      );
    [artifact, hash] = entries[0];
  } else if (entries.length === 1 && entries[0][1] !== hash) {
    blocked("explore-artifact-invalid", "Explore artifact hashes conflict");
  }
  if (artifact !== expected || typeof hash !== "string")
    blocked("explore-artifact-invalid", "Wrong Explore artifact identity");
  await checkArtifactHashes(target.repositoryRoot, { [expected]: hash });
}

export async function checkExploreResultOnFinish(
  request: FinishRequest,
  actionId: string,
  result: { authorConclusion: string | null; facts: JsonObject },
): Promise<void> {
  if (
    request.terminal &&
    isExploreAction(actionId) &&
    result.authorConclusion === "PASS"
  )
    await checkExploreArtifact(request, result.facts, false);
}

export async function checkExplorePredecessorForReview(
  target: ActionTarget,
  predecessor: DurableRunRecord,
): Promise<void> {
  const { context, result } = predecessor;
  if (
    context.lifecycleState !== "terminal" ||
    context.role !== "author" ||
    !isExploreAction(context.actionIdentity.actionId) ||
    result.authorConclusion !== "PASS" ||
    result.actionIdentity.deliveryId !== target.deliveryId ||
    result.actionIdentity.changeId !== target.changeId
  )
    blocked("review-input-invalid", "Exact successful Explore Run required");
  await checkExploreArtifact(target, result.facts, true);
}

export async function checkResultArtifactsOnFinish(
  request: FinishRequest,
  actionId: string,
  result: {
    authorConclusion: string | null;
    facts: JsonObject;
  },
  installation: ManagerInstallation,
): Promise<JsonObject | null> {
  await checkExploreResultOnFinish(request, actionId, result);
  if (!request.terminal || result.authorConclusion !== "PASS") return null;
  const hashes = result.facts.artifactHashes;
  if (actionId === "propose" || actionId === "revise-propose") {
    const status = await observeOpenSpecChangeStatus({
      repositoryRoot: request.repositoryRoot,
      flowkitHome: request.flowkitHome,
      changeId: request.changeId,
      installation,
    });
    if (!status.isPlanningComplete)
      blocked("planning-incomplete", "OpenSpec planning is incomplete");
    if (typeof hashes !== "object" || hashes === null || Array.isArray(hashes))
      blocked("artifact-hashes-missing", "Exact planning hashes required");
    for (const name of ["proposal.md", "design.md", "tasks.md"])
      if (
        !Object.hasOwn(hashes, `openspec/changes/${request.changeId}/${name}`)
      )
        blocked(
          "artifact-hashes-missing",
          `Required planning hash missing: ${name}`,
        );
    await checkPlanningArtifactHashes(request, hashes);
  }
  if (actionId === "apply" || actionId === "revise-apply") {
    await checkArtifactHashes(request.repositoryRoot, hashes);
  }
  if (
    ![
      "explore",
      "revise-explore",
      "propose",
      "revise-propose",
      "apply",
      "revise-apply",
    ].includes(actionId)
  )
    return null;
  const candidates = isExploreAction(actionId)
    ? {
        ...((hashes as JsonObject) ?? {}),
        [String(result.facts.exploreArtifact)]: result.facts.exploreSha256,
      }
    : (hashes as JsonObject);
  const projection = await candidateGitProjection(
    request.repositoryRoot,
    candidates,
    result.facts.candidateGit,
  );
  return JSON.parse(JSON.stringify(projection)) as JsonObject;
}
