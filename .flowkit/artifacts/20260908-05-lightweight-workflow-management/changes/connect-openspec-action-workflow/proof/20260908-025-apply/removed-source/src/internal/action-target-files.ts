import { lstat, mkdir, realpath } from "node:fs/promises";
import path from "node:path";

export function isCanonicalTargetPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !/[\\:]/.test(value) &&
    !Array.from(value).some((character) => character.charCodeAt(0) < 32) &&
    !path.posix.isAbsolute(value) &&
    value
      .split("/")
      .every(
        (part) =>
          part.length > 0 &&
          part !== "." &&
          part !== ".." &&
          !/[ .]$/.test(part),
      )
  );
}

/** Bounded to Action Run/proof paths; no project scanning or recovery. */
export async function actionTargetPath(
  repositoryRoot: string,
  relative: string,
  createParents = false,
): Promise<string> {
  if (!isCanonicalTargetPath(relative))
    throw new Error("Noncanonical target path");
  const root = await realpath(repositoryRoot);
  let current = root;
  const parts = relative.split("/");
  for (const part of parts.slice(0, -1)) {
    current = path.join(current, part);
    if (createParents) {
      try {
        await mkdir(current);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
    const resolved = await realpath(current);
    const inside = path.relative(root, resolved);
    if (
      path.isAbsolute(inside) ||
      inside === ".." ||
      inside.startsWith(`..${path.sep}`)
    )
      throw new Error("Target parent escapes repository");
    if (!(await lstat(resolved)).isDirectory())
      throw new Error("Target parent is not a directory");
  }
  return path.join(current, parts.at(-1)!);
}
