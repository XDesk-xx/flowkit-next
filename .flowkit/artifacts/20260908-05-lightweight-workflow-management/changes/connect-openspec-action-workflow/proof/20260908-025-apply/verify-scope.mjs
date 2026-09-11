import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";
const root = import.meta.dirname;
const hash = b => createHash("sha256").update(b).digest("hex");
const baseline = JSON.parse(fs.readFileSync(path.join(root, "baseline.json")));
for (const ref of baseline.protected) assert.equal(hash(fs.readFileSync(ref.path)), ref.sha256, ref.path);
for (const ref of baseline.removedSources) {
  assert.equal(fs.existsSync(ref.path), false, ref.path);
  assert.equal(hash(fs.readFileSync(path.join(root, "removed-source", ref.path))), ref.sha256);
}
const manifestPath = "openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml";
const before = fs.readFileSync(path.join(root, "prior-manifest.yaml"), "utf8");
const after = fs.readFileSync(manifestPath, "utf8");
const priorLines = before.split(/\r?\n/), nextLines = after.split(/\r?\n/);
assert.equal(priorLines.length, nextLines.length);
const altered = priorLines.flatMap((line, i) => line === nextLines[i] ? [] : [{ line: i + 1, before: line, after: nextLines[i] }]);
assert.deepEqual(altered.map(item => item.line), [22, 63, 70]);
const a = parse(before), b = parse(after);
b.scope.included = a.scope.included;
const selected = "connect-openspec-action-workflow";
const oldChange = a.changes.find(change => change.id === selected);
const newChange = b.changes.find(change => change.id === selected);
newChange.goal = oldChange.goal;
newChange.outputs[0] = oldChange.outputs[0];
assert.deepEqual(b, a);
const run = args => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim().split(/\r?\n/).filter(Boolean);
};
const changed = [...new Set([...run(["diff", "--name-only", "HEAD"]), ...run(["ls-files", "--others", "--exclude-standard"])])];
const sized = changed.filter(name => /^(src|tests)\/.*\.(ts|mjs)$/.test(name) && fs.existsSync(name)).map(name => ({
  path: name, lines: fs.readFileSync(name, "utf8").split("\n").length - 1,
}));
for (const item of sized) assert.ok(item.lines <= 650, JSON.stringify(item));
const gitCheck = spawnSync("git", ["diff", "--check", "HEAD"], { encoding: "utf8" });
assert.equal(gitCheck.status, 0, gitCheck.stdout + gitCheck.stderr);
const result = { protectedFiles: baseline.protected.length, exactRemovals: baseline.removedSources,
  manifestOnlyChangedLines: altered, sourceTestGate: { limit: 650, includesBlankAndCommentLines: true, files: sized },
  noGitMutation: true, status: "PASS" };
fs.writeFileSync(path.join(root, "scope-verification.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ protected: result.protectedFiles, removals: result.exactRemovals.length,
  manifestLines: altered.map(item => item.line), files: sized.length, maxLines: Math.max(...sized.map(item => item.lines)), status: "PASS" }));
