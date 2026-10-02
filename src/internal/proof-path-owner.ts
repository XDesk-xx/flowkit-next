import { lstat } from "node:fs/promises";
import path from "node:path";

function runGroupChangeId(name: string): string | null {
  const match = /^([0-9]{3,})-(.+)$/u.exec(name);
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) &&
    sequence > 0 &&
    String(sequence).padStart(3, "0") === match[1]
    ? match[2]
    : null;
}

export function uniqueRunGroup(
  names: readonly string[],
  changeId: string,
): string {
  const matches = names.filter((name) => runGroupChangeId(name) === changeId);
  if (matches.length !== 1)
    throw new Error("Proof Run is not uniquely present");
  return matches[0]!;
}

export function proofOwnerFromSegment(
  names: readonly string[],
  segment: string,
): { runGroup: string; changeId: string } {
  const matches = names.flatMap((runGroup) => {
    const changeId = runGroupChangeId(runGroup);
    return changeId !== null && (segment === runGroup || segment === changeId)
      ? [{ runGroup, changeId }]
      : [];
  });
  if (matches.length !== 1) throw new Error("Proof Run owner is not unique");
  const owner = matches[0]!;
  if (uniqueRunGroup(names, owner.changeId) !== owner.runGroup)
    throw new Error("Proof Run owner is not unique");
  return owner;
}

export function proofDirectoryCandidates(
  deliveryId: string,
  changeId: string,
  runGroup: string,
  runId: string,
): readonly [string, string] {
  const prefix = `.flowkit/artifacts/${deliveryId}/changes/`;
  return [
    `${prefix}${runGroup}/proof/${runId}`,
    `${prefix}${changeId}/proof/${runId}`,
  ];
}

async function controlledDirectoryExists(
  root: string,
  relative: string,
): Promise<boolean> {
  let current = root;
  for (const segment of relative.split("/")) {
    current = path.join(current, segment);
    const entry = await lstat(current).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (entry === null) return false;
    if (entry.isSymbolicLink() || !entry.isDirectory())
      throw new Error("Linked or non-directory proof path");
  }
  return true;
}

export async function selectedProofDirectory(
  root: string,
  candidates: readonly [string, string],
): Promise<string | null> {
  const [numbered, semantic] = await Promise.all(
    candidates.map(async (relative) => ({
      relative,
      exists: await controlledDirectoryExists(root, relative),
    })),
  );
  return selectProofDirectory(candidates, [numbered.exists, semantic.exists]);
}

export function selectProofDirectory(
  candidates: readonly [string, string],
  exists: readonly [boolean, boolean],
): string | null {
  const [numbered, semantic] = exists;
  if (numbered && semantic)
    throw new Error("Both proof directories exist for one Run");
  return numbered ? candidates[0] : semantic ? candidates[1] : null;
}
