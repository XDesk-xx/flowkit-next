import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const root = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const host = await import(pathToFileURL(path.join(root, "dist/domain/git-workflow-host.js")));
const scope = await import(pathToFileURL(path.join(root, "dist/internal/git-checkpoint-scope.js")));
const operation = await import(pathToFileURL(path.join(root, "dist/domain/delivery-repository-integration-operation.js")));
const scratch = await fs.mkdtemp(path.join(root, ".tmp/d05-058-supplement-"));
const target = path.join(scratch, "target");
const remote = path.join(scratch, "remote.git");
await fs.mkdir(target); await fs.mkdir(remote);
const commands = [];
function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "buffer", windowsHide: true });
  commands.push({ args, cwd, status: r.status });
  process.stdout.write(r.stdout ?? Buffer.alloc(0)); process.stderr.write(r.stderr ?? Buffer.alloc(0));
  assert.equal(r.status, 0); return r.stdout.toString().trim();
}
git(target, "init", "-b", "main");
git(target, "config", "user.name", "Supplement fixture"); git(target, "config", "user.email", "fixture@example.invalid");
await fs.writeFile(path.join(target, "a.txt"), "base"); git(target, "add", "a.txt"); git(target, "commit", "-m", "base");
const base = git(target, "rev-parse", "HEAD");
git(remote, "init", "--bare"); git(target, "remote", "add", "origin", remote); git(target, "push", "origin", "main");
await fs.writeFile(path.join(target, "a.txt"), "next"); git(target, "add", "a.txt"); git(target, "commit", "-m", "next");
const next = git(target, "rev-parse", "HEAD");
// Real Git hook models a remote that changes its ref after accepting the push.
const hook = path.join(remote, "hooks/post-receive");
await fs.writeFile(hook, `#!/bin/sh\ngit update-ref refs/heads/main ${base}\n`, { mode: 0o755 });
const request = { targetRoot: target, node: "delivery-start", deliveryId: "fixture", changeId: null, ownerSourceRef: "test:synthetic-supplement", expectedBranch: "main",
  operation: { kind: "push", localCommit: next, remote: "origin", targetRef: "refs/heads/main" } };
const mismatch = await host.runPush(request, async () => ({ request }));
assert.equal(mismatch.status, "incomplete"); assert.equal(mismatch.phase, "readback");
assert.equal(mismatch.observed.remoteCommit, base); assert.equal(mismatch.observed.checkpointCommit, next);
assert.equal(mismatch.effect, "unknown");
await fs.unlink(hook); // Own fixture hook only; no user repository files.
git(target, "push", "origin", "main");
const stale = { ...request, operation: { ...request.operation, localCommit: base } };
const refused = await host.runPush(stale, async () => ({ request: stale }));
assert.equal(refused.status, "incomplete"); assert.equal(refused.phase, "publication");
assert.equal(refused.observed.remoteCommit, next); assert.equal(refused.observed.checkpointCommit, base);
await fs.mkdir(path.join(target, "directory"));
const create = { ...request, operation: { kind: "create-new", paths: ["directory"], commitMessage: "not a file", commitShape: null } };
const unsafe = await host.runCheckpoint(create, async () => ({ request: create }));
assert.equal(unsafe.status, "incomplete"); assert.equal(unsafe.effect, "none");
const substituted = await host.runCheckpoint({ ...create, operation: { ...create.operation, paths: ["a.txt"] } }, async () => ({ request: create }));
assert.equal(substituted.effect, "none"); assert.equal(substituted.status, "incomplete");
const ordered = { kind: "create-new", paths: ["a.txt"], commitMessage: "shape", commitShape: { parents: ["b".repeat(40), "a".repeat(40)], count: 2 } };
assert.deepEqual(operation.cloneCheckpointOperation(ordered).commitShape.parents, ordered.commitShape.parents);
await scope.requireIndexScope(target, ["a.txt"]); // Unchanged tracked files are not pending scope entries.
const reviewPath = ".flowkit/runs/20260908-05-lightweight-workflow-management/006-invoke-git-at-workflow-boundaries/20260911-057-review-propose/result.json";
const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
for (const ref of [...review.reviewedArtifacts, review.reviewedResult, review.acceptedExploreReview]) {
  const bytes = await fs.readFile(ref.path);
  assert.equal(bytes.length, ref.bytes); assert.equal(createHash("sha256").update(bytes).digest("hex"), ref.sha256);
}
const report = { status: "passed", mismatch, refused, unsafe, substituted, commands,
  acceptedProposalBytesVerified: review.reviewedArtifacts, source: "current build, synthetic bounded fixture permissions", formalD05FullTest: false };
await fs.writeFile(path.join(proof, "supplemental-checks.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(report));
