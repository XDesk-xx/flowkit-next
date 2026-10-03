import path from "node:path";
import { gitText } from "./git-checkpoint-scope.js";

/** Read-only comparison; never normalizes a candidate or writes a Git object. */
export async function assertCandidateGitBytes(root: string, relative: string) {
  const file = path.join(root, ...relative.split("/"));
  const raw = await gitText(root, ["hash-object", "--no-filters", "--", file]);
  const filtered = await gitText(root, [
    "hash-object",
    `--path=${relative}`,
    "--",
    file,
  ]);
  if (!/^[0-9a-f]{40,64}$/.test(raw) || raw !== filtered)
    throw Error(`Candidate raw/Git-filtered bytes differ: ${relative}`);
}
