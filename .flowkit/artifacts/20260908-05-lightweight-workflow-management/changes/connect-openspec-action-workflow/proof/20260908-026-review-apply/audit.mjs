import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse } from "yaml";
const repo = process.cwd();
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const ref = file => { const b = fs.readFileSync(file); return { path: file, bytes: b.length, sha256: hash(b) }; };
const runs = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow";
const authorProof = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-025-apply";
const result = json(runs + "/20260908-025-apply/result.json");
const approved = json(runs + "/20260908-024-review-propose/result.json");
const plan = json(approved.reviewedResult.path);
const verified = [];
function verify(expected) {
  const actual = ref(expected.path);
  assert.equal(actual.sha256, expected.sha256, expected.path);
  if (expected.bytes !== undefined) assert.equal(actual.bytes, expected.bytes, expected.path);
  verified.push(actual);
}
verify(result.approvedReview);
verify(approved.reviewedResult);
assert.equal(approved.verdict, "approved");
assert.equal(approved.nextBoundary, "apply");
assert.equal(result.previousRunId, approved.runId);
assert.equal(result.nextBoundary, "review-apply");
for (const item of [...result.artifacts, ...result.evidence]) verify(item);
const baseline = json(authorProof + "/baseline.json");
baseline.protected.forEach(verify);
for (const removed of result.exactRemovals) {
  assert.equal(fs.existsSync(removed.path), false, removed.path);
  verify({ ...removed, path: authorProof + "/removed-source/" + removed.path });
}
const commands = result.evidence.filter(item => item.path.endsWith("/command.json")).map(item => {
  const record = json(item.path);
  verify(record.stdout); verify(record.stderr);
  return { record: item.path, exitCode: record.exitCode, startedAt: record.startedAt,
    finishedAt: record.finishedAt, executable: record.executable, args: record.args };
});
const change = "openspec/changes/connect-openspec-action-workflow";
for (const item of plan.artifacts.filter(item => !item.path.endsWith("/tasks.md"))) verify(item);
const currentTasks = fs.readFileSync(change + "/tasks.md", "utf8");
const approvedTasksRef = plan.artifacts.find(item => item.path.endsWith("/tasks.md"));
// Only the original 19 unchecked markers changed, preserving task semantics.
const restoredTasks = currentTasks.split("\n").map(line =>
  /^- \[x\] (1\.1|3\.3) /.test(line) ? line : line.replace(/^- \[x\]/, "- [ ]")).join("\n");
assert.equal(hash(Buffer.from(restoredTasks)), approvedTasksRef.sha256);
const manifestPath = "openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml";
const beforeText = fs.readFileSync(authorProof + "/prior-manifest.yaml", "utf8");
const afterText = fs.readFileSync(manifestPath, "utf8");
const before = parse(beforeText), after = parse(afterText);
const oldSelected = before.changes.find(item => item.id === result.changeId);
const newSelected = after.changes.find(item => item.id === result.changeId);
const scopeChanges = after.scope.included.map((value, i) => ({ index: i, before: before.scope.included[i], after: value }))
  .filter(item => item.before !== item.after);
assert.equal(scopeChanges.length, 1);
after.scope.included[scopeChanges[0].index] = before.scope.included[scopeChanges[0].index];
newSelected.goal = oldSelected.goal;
newSelected.outputs[0] = oldSelected.outputs[0];
assert.deepEqual(after, before);
const expectedAfter = beforeText
  .replace(scopeChanges[0].before, scopeChanges[0].after)
  .replace(oldSelected.goal, parse(afterText).changes.find(item => item.id === result.changeId).goal)
  .replace(oldSelected.outputs[0], parse(afterText).changes.find(item => item.id === result.changeId).outputs[0]);
assert.equal(afterText, expectedAfter);
const sized = result.artifacts.filter(item => /^(src|tests)\/.*\.(ts|mjs)$/.test(item.path)).map(item => ({
  path: item.path, lines: fs.readFileSync(item.path, "utf8").split("\n").length - 1 }));
assert.ok(sized.every(item => item.lines <= 650));
assert.equal(fs.existsSync(runs + "/20260908-019-apply/result.json"), false);
const ownRoot = path.relative(repo, import.meta.dirname).replaceAll("\\", "/");
const evidence = json(ownRoot + "/attempt-02/counterexamples.json");
const output = { kind: "independent-apply-reference-scope-audit", recordedAt: new Date().toISOString(),
  verifiedRefs: verified, commandRecords: commands, protectedAuthorInputs: baseline.protected.length,
  exactRemovals: result.exactRemovals.length, approvedPlanBodiesPreserved: true,
  taskChangesAreCompletionMarkersOnly: true, manifestThreeStringEditsOnly: true,
  sourceTestGate: { limit: 650, files: sized.length, maxLines: Math.max(...sized.map(item => item.lines)) },
  priorApplyStillIncomplete: true, counterexamples: ref(ownRoot + "/attempt-02/counterexamples.json"),
  counterexampleGroups: 2, limit: "Valid references and Author test records do not negate the independently reproduced implementation/HOW defects." };
assert.equal(evidence.observations.length, 5);
fs.writeFileSync(path.join(import.meta.dirname, "audit.json"), JSON.stringify(output, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ verifiedRefs: verified.length, commandRecords: commands.length,
  protectedAuthorInputs: baseline.protected.length, removals: result.exactRemovals.length,
  planBodiesUnchanged: true, manifestThreeStringEditsOnly: true, sourceTestGate: output.sourceTestGate }));
