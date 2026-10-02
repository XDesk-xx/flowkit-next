import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import type { ActionTarget, FinishRequest } from "./action-request.js";
import { blocked } from "./action-error.js";

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

export async function checkPlanningResultOnFinish(
  request: FinishRequest,
  actionId: string,
  result: {
    authorConclusion: string | null;
    facts: { artifactHashes?: unknown };
  },
): Promise<void> {
  if (
    request.terminal &&
    (actionId === "propose" || actionId === "revise-propose") &&
    result.authorConclusion === "PASS"
  )
    await checkPlanningArtifactHashes(request, result.facts.artifactHashes);
}
