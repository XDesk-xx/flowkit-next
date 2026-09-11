import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
const root = process.cwd();
const target = await fs.mkdtemp(path.join(root, ".tmp/d05-058-conflict-"));
const host = await import(pathToFileURL(path.join(root, "dist/domain/git-workflow-host.js")));
const scope = await import(pathToFileURL(path.join(root, "dist/internal/git-checkpoint-scope.js")));
function git(args, expected = 0) {
  const result = spawnSync("git", args, { cwd: target, encoding: "buffer", windowsHide: true });
  console.log(JSON.stringify({ target, args, exitCode: result.status }));
  process.stdout.write(result.stdout); process.stderr.write(result.stderr); assert.equal(result.status, expected);
}
git(["init", "-b", "main"]); git(["config", "user.name", "Conflict fixture"]); git(["config", "user.email", "fixture@example.invalid"]);
await fs.writeFile(path.join(target, "a.txt"), "base\n"); git(["add", "a.txt"]); git(["commit", "-m", "base"]);
git(["checkout", "-b", "other"]); await fs.writeFile(path.join(target, "a.txt"), "other\n"); git(["commit", "-am", "other"]);
git(["checkout", "main"]); await fs.writeFile(path.join(target, "a.txt"), "main\n"); git(["commit", "-am", "main"]); git(["merge", "other"], 1);
const before = await scope.readIndexFingerprint(target);
const request = { targetRoot: target, node: "delivery-start", deliveryId: "fixture", changeId: null, ownerSourceRef: "test:synthetic-conflict", expectedBranch: "main",
  operation: { kind: "create-new", paths: ["a.txt"], commitMessage: "must not commit", commitShape: null } };
const outcome = await host.runCheckpoint(request, async () => ({ request }));
assert.equal(outcome.status, "incomplete"); assert.equal(outcome.effect, "none"); assert.match(outcome.reason, /未合并/);
assert.equal(await scope.readIndexFingerprint(target), before);
console.log(JSON.stringify({ status: "passed", outcome, preservedIndex: before, fixtureOnly: true }));
