import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { gitBytes } from "./git-checkpoint-scope.js";
import { createHash } from "node:crypto";
import {
  candidateGitProjection,
  ordinaryGitFileModes,
  verifyCachedCandidateRules,
} from "./candidate-git-bytes.js";
import type { CandidateGit } from "./candidate-git-facts.js";

export interface CheckpointCandidateTree {
  readonly entries: ReadonlyMap<string, { mode: string; objectId: string }>;
  readonly read: (relative: string) => Promise<Buffer | null>;
  readonly validateRules: (cached?: boolean) => Promise<void>;
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
  const hashes: Record<string, string> = {};
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
    hashes[relative] = createHash("sha256").update(bytes).digest("hex");
  }
  let projection: CandidateGit | undefined;
  let modes: Record<string, string> = {};
  if (Object.keys(hashes).length) {
    projection = await candidateGitProjection(root, hashes);
    modes = await ordinaryGitFileModes(
      root,
      Object.fromEntries(
        Object.entries(projection.files).map(([file, identity]) => [
          file,
          identity.indexBasis,
        ]),
      ),
    );
    for (const [relative, identity] of Object.entries(projection.files)) {
      const raw = overrides.get(relative)!;
      overrides.set(
        relative,
        identity.conversion === "identity"
          ? raw
          : Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n")),
      );
      entries.set(relative, {
        mode: modes[relative],
        objectId: identity.blobOid,
      });
    }
  }
  const read = async (relative: string) => {
    const entry = entries.get(relative);
    if (entry === undefined) return null;
    if (!["100644", "100755"].includes(entry.mode))
      throw Error(`Candidate tree evidence not regular: ${relative}`);
    return (
      overrides.get(relative) ??
      gitBytes(root, ["cat-file", "blob", entry.objectId])
    );
  };
  const attributes = new Set<string>();
  for (const relative of paths) {
    const parts = relative.split("/");
    for (let i = 0; i < parts.length; i++)
      attributes.add([...parts.slice(0, i), ".gitattributes"].join("/"));
  }
  for (const relative of attributes) {
    const raw = await readFile(path.join(root, ...relative.split("/"))).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      },
    );
    const stored = await read(relative);
    if (
      raw !== null &&
      (stored === null ||
        !Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n")).equals(
          Buffer.from(stored.toString("utf8").replace(/\r\n/g, "\n")),
        ))
    )
      throw Error(
        `Worktree attributes missing or different in candidate tree: ${relative}`,
      );
    if (
      raw === null &&
      stored === null &&
      (
        await gitBytes(root, [
          "--literal-pathspecs",
          "ls-files",
          "--stage",
          "--",
          relative,
        ])
      ).length
    )
      throw Error(
        `Attribute deletion cannot be projected read-only: ${relative}`,
      );
  }
  return {
    entries,
    read,
    validateRules: async (cached = false) => {
      if (!projection) return;
      await candidateGitProjection(root, hashes, projection);
      const currentModes = await ordinaryGitFileModes(
        root,
        Object.fromEntries(
          Object.entries(projection.files).map(([file, identity]) => [
            file,
            identity.indexBasis,
          ]),
        ),
      );
      if (
        Object.entries(modes).some(
          ([file, mode]) => currentModes[file] !== mode,
        )
      )
        throw Error("Candidate executable mode drift");
      if (cached) await verifyCachedCandidateRules(root, projection);
    },
  };
}
