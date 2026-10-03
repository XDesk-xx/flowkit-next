import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { gitBytes } from "./git-checkpoint-scope.js";

export interface CheckpointCandidateTree {
  readonly entries: ReadonlyMap<string, { mode: string; objectId: string }>;
  readonly read: (relative: string) => Promise<Buffer | null>;
}

/** Current index plus only explicitly authorized writes/deletions; no temporary staging. */
export async function checkpointCandidateTree(
  root: string,
  paths: readonly string[] = [],
  commit: string | null = null,
): Promise<CheckpointCandidateTree> {
  const listing = await gitBytes(
    root,
    commit === null
      ? ["ls-files", "--stage", "-z"]
      : ["ls-tree", "-r", "-z", commit],
  );
  const text = listing.toString("utf8");
  if (!Buffer.from(text).equals(listing) || (text && !text.endsWith("\0")))
    throw Error("Candidate tree path encoding invalid");
  const entries = new Map<string, { mode: string; objectId: string }>();
  for (const line of text ? text.slice(0, -1).split("\0") : []) {
    const match =
      commit === null
        ? /^(\d{6}) ([0-9a-f]{40,64}) 0\t(.+)$/.exec(line)
        : /^(\d{6}) (?:blob|commit) ([0-9a-f]{40,64})\t(.+)$/.exec(line);
    if (match === null || entries.has(match[3]))
      throw Error("Candidate tree conflict or invalid entry");
    entries.set(match[3], { mode: match[1], objectId: match[2] });
  }
  const overrides = new Map<string, Buffer>();
  for (const relative of paths) {
    const file = path.join(root, ...relative.split("/"));
    const stat = await lstat(file).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (stat === null) {
      entries.delete(relative);
      continue;
    }
    if (!stat.isFile() || stat.isSymbolicLink())
      throw Error(`Candidate tree authorized path not regular: ${relative}`);
    const bytes = await readFile(file);
    overrides.set(relative, bytes);
    entries.set(relative, { mode: "100644", objectId: "projected-raw" });
  }
  return {
    entries,
    read: async (relative) => {
      const entry = entries.get(relative);
      if (entry === undefined) return null;
      if (!["100644", "100755"].includes(entry.mode))
        throw Error(`Candidate tree evidence not regular: ${relative}`);
      return (
        overrides.get(relative) ??
        gitBytes(root, ["cat-file", "blob", entry.objectId])
      );
    },
  };
}
