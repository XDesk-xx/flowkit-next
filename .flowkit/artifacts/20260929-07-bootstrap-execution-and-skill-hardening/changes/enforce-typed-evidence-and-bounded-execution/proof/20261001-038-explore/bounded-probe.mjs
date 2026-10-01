import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { checkDeclaredProofs } from "../src/cli/action-proof.ts";

const root = process.cwd();
const run = promisify(execFile);
const commit = "50f483b1c36284d325882d831e6e7b65dc1c825e";
const deliveryId = "20260929-07-bootstrap-execution-and-skill-hardening";
const changeId = "converge-owned-skills-on-supported-commands";
const runId = "20261001-037-archive";
const result = JSON.parse(await readFile(path.join(root, ".flowkit/runs", deliveryId,
  `027-${changeId}`, runId, "result.json"), "utf8"));
const target = { repositoryRoot: root, flowkitHome: path.join(process.env.USERPROFILE, ".flowkit"),
  deliveryId, changeId };
assert.equal(result.facts.proofRefs.length, 23);
await checkDeclaredProofs(target, runId, []);
await checkDeclaredProofs(target, runId, result.facts.proofRefs.slice(0, 1));

const { stdout: changed } = await run("git", ["diff-tree", "--no-commit-id", "--name-only", "-r", "-z", commit],
  { cwd: root, encoding: "buffer", windowsHide: true });
const paths = changed.toString("utf8").split("\0").filter(Boolean);
assert.equal(paths.length, 202);
const fixture = await mkdtemp(path.join(root, ".tmp", "d07-d-path-argv-"));
await run("git", ["init", "-b", "main", fixture], { cwd: root, windowsHide: true });
for (const relative of paths) {
  const absolute = path.join(fixture, ...relative.split("/"));
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, "fixture\n", { flag: "wx" });
}
let longArgsError = null;
try {
  await run("git", ["add", "--", ...paths.map((name) => `:(literal)${name}`)],
    { cwd: fixture, windowsHide: true });
} catch (error) {
  longArgsError = error.code ?? String(error);
}
const pathspecFile = path.join(fixture, "paths.nul");
await writeFile(pathspecFile, Buffer.from(paths.join("\0") + "\0"), { flag: "wx" });
await run("git", ["--literal-pathspecs", "add", "--pathspec-from-file=paths.nul", "--pathspec-file-nul"],
  { cwd: fixture, windowsHide: true });
const { stdout: staged } = await run("git", ["diff", "--cached", "--name-only", "-z"],
  { cwd: fixture, encoding: "buffer", windowsHide: true });
const stagedPaths = staged.toString("utf8").split("\0").filter(Boolean);
assert.deepEqual(stagedPaths, paths);
process.stdout.write(JSON.stringify({
  sourceCommit: commit, proofRunId: runId, actualProofFiles: 23,
  emptyProofRefsAccepted: true, oneOf23ProofRefsAccepted: true,
  pathCount: paths.length, longArgsError,
  nulPathspecStaged: stagedPaths.length,
  fixtureScope: ".tmp isolated Git repository",
}) + "\n");
