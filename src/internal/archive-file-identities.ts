import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export type FileHashes = Readonly<Record<string, string>>;
export async function directoryHashes(
  root: string,
  relative: string,
): Promise<FileHashes | null> {
  const directory = path.join(root, ...relative.split("/"));
  const stat = await lstat(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (stat === null) return null;
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw Error(`Invalid archive directory: ${relative}`);
  const hashes: Record<string, string> = {};
  async function visit(directory: string, prefix: string) {
    for (const entry of (
      await readdir(directory, { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const suffix = prefix + entry.name;
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink())
        throw Error(`Linked archive input: ${relative}/${suffix}`);
      if (entry.isDirectory()) await visit(file, `${suffix}/`);
      else if (entry.isFile())
        hashes[suffix] = createHash("sha256")
          .update(await readFile(file))
          .digest("hex");
      else throw Error(`Invalid archive input: ${relative}/${suffix}`);
    }
  }
  await visit(directory, "");
  return hashes;
}
export async function affectedSpecHashes(
  root: string,
  sourceFiles: FileHashes,
) {
  const hashes: Record<string, string | null> = {};
  for (const suffix of Object.keys(sourceFiles)) {
    if (!/^specs\/(?:[^/]+\/)+spec\.md$/.test(suffix)) continue;
    const relative = `openspec/${suffix}`;
    const file = path.join(root, relative);
    const stat = await lstat(file).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (stat === null) hashes[relative] = null;
    else {
      if (!stat.isFile() || stat.isSymbolicLink())
        throw Error(`Invalid canonical spec: ${relative}`);
      hashes[relative] = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
    }
  }
  return hashes;
}
