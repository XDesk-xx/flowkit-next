import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const output = path.resolve(process.argv[2]);
assert.ok(output.startsWith(path.join(repo, ".flowkit", "artifacts") + path.sep));
const domain = await import(pathToFileURL(path.join(repo, "src/domain/index.ts")).href);
const { readSelectedRunChain } = await import(pathToFileURL(path.join(repo, "src/cli/current-run-chain.ts")).href);
const { loadManagerInstallation } = await import(pathToFileURL(path.join(repo, "src/internal/manager-installation.ts")).href);
const md = await readFile("skills/actions/explore/SKILL.md", "utf8");
const blocks = [...md.matchAll(/```js\r?\n(\/\/ agent-[\s\S]*?)```/g)].map(m => m[1]);
assert.equal(blocks.length, 3);
const how = await import("data:text/javascript;base64," + Buffer.from(blocks.join("\n") + "\nexport { currentForExecution, startRecord, finishRecord };").toString("base64"));
const observations = [];
function fixture(root, changeId = "cache", sequence = 1, previousRunId = null) {
  const identity = { deliveryId: "review-fixture", changeId, actionId: "explore" };
  const occurrence = { date: "20260908", sequence, actionId: "explore" };
  const runId = domain.formatRunOccurrenceId(occurrence);
  return {
    identity,
    input: { repositoryRoot: root, deliveryId: identity.deliveryId, changeId, changeStartSequence: 1, occurrence },
    context: { runId, occurrence, actionIdentity: identity, role: "author", lifecycleState: "prepared", ownerAuthority: null, previousRunId },
    result: { runId, actionIdentity: identity, authorConclusion: "PASS", reviewerVerdict: null, verificationVerdict: null, nextBoundary: "review-explore", facts: { synthetic: true, purpose: "Reviewer isolated contract probe; not real Author or Review" } }
  };
}
async function put(root, changeId) {
  const f = fixture(root, changeId);
  await domain.writeDurableRun(f.input, { actionMarkdown: "# Synthetic fixture\n", context: { ...f.context, lifecycleState: "terminal" }, result: f.result });
}
const groups = path.join(output, "group-fixture");
await mkdir(groups);
const selected = fixture(groups).input;
await put(groups, "repair-cache");
await put(groups, "update-repair-cache");
await mkdir(path.join(groups, ".flowkit/runs/review-fixture/check-cache"));
assert.equal((await readSelectedRunChain(selected)).current, null);
observations.push({ case: "other canonical/bootstrap suffixes with exact target absent", outcome: "explicit empty history" });
await put(groups, "cache");
await put(groups, "2026-cache");
for (const id of ["cache", "repair-cache", "update-repair-cache", "2026-cache"]) {
  assert.equal((await readSelectedRunChain(fixture(groups, id).input)).current.context.actionIdentity.changeId, id);
}
observations.push({ case: "four valid overlapping Change identities", outcome: "each exact chain selected" });
for (const [label, names] of [
  ["malformed", ["01-cache"]],
  ["zero", ["000-cache"]],
  ["duplicate", ["001-cache", "009-cache"]],
  ["mixed", ["001-cache", "cache"]],
  ["partial", ["001-cache"]],
]) {
  const root = path.join(output, label);
  for (const name of names) await mkdir(path.join(root, ".flowkit/runs/review-fixture", name), { recursive: true });
  if (label === "partial") {
    const dir = path.join(root, ".flowkit/runs/review-fixture/001-cache/20260908-001-explore");
    await mkdir(dir);
    await writeFile(path.join(dir, "action.md"), "# Synthetic start only\n", { flag: "wx" });
  }
  await assert.rejects(readSelectedRunChain(fixture(root).input), error => {
    assert.equal(error.kind, ["duplicate", "mixed"].includes(label) ? "context-ambiguous" : "run-chain-invalid");
    return true;
  });
  observations.push({ case: label + " selected group", outcome: "fail closed" });
}
const root = path.join(output, "prepared-fixture");
await mkdir(root);
const first = fixture(root);
const guidance = await domain.resolveActionGuidanceRef(loadManagerInstallation(), "explore");
assert.ok(guidance);
const initial = how.currentForExecution(domain, null, first.identity);
assert.ok(initial);
assert.equal(domain.transitionCurrentAction(initial, { type: "prepare", identity: first.identity }), null);
for (const wrong of [
  { ...first.identity, deliveryId: "other" }, { ...first.identity, changeId: "other" }, { ...first.identity, actionId: "propose" }
]) assert.equal(how.currentForExecution(domain, initial, wrong), null);
assert.equal(how.currentForExecution(domain, { ...initial, unexpected: true }, first.identity), null);
assert.equal(how.currentForExecution(domain, { ...initial, state: "terminal" }, first.identity), null);
const nextIdentity = { ...first.identity, actionId: "review-explore" };
assert.deepEqual(how.currentForExecution(domain, { ...initial, state: "terminal" }, nextIdentity), domain.transitionCurrentAction({ ...initial, state: "terminal" }, { type: "prepare", identity: nextIdentity }));
observations.push({ case: "HOW current establishment controls", outcome: "exact reuse only; kernel duplicate prepare unchanged; malformed/wrong prepared and same terminal rejected" });
const held1 = await how.startRecord(domain, first.input, initial, first.context, guidance, true);
const failed = { ...first.result, authorConclusion: null, nextBoundary: null };
await how.finishRecord(domain, held1, failed, true, false);
const names = ["action.md", "context.json", "result.json"];
const oldBytes = await Promise.all(names.map(name => readFile(path.join(held1.directory, name))));
const chain1 = await readSelectedRunChain(first.input);
const previous = { identity: chain1.current.context.actionIdentity, state: chain1.current.context.lifecycleState };
assert.deepEqual(domain.evaluatePolicyAndNextBoundary({ ...first.identity, changeState: "active", currentAction: previous, terminalRunContext: null, terminalResult: null }), { kind: "ready-action", actionId: "explore" });
// This is an explicitly selected second synthetic execution, never automatic retry.
const current = how.currentForExecution(domain, previous, first.identity);
assert.equal(current, previous);
const second = fixture(root, "cache", 2, first.context.runId);
const held2 = await how.startRecord(domain, second.input, current, second.context, guidance, true);
assert.notEqual(held1.actionPackage.runId, held2.actionPackage.runId);
await how.finishRecord(domain, held2, second.result, true);
assert.equal((await readSelectedRunChain(second.input)).current.context.runId, second.context.runId);
assert.deepEqual(await Promise.all(names.map(name => readFile(path.join(held1.directory, name)))), oldBytes);
await assert.rejects(how.startRecord(domain, second.input, current, second.context, guidance, true), /sequence already exists/);
assert.deepEqual((await readdir(held2.directory)).sort(), names.sort());
observations.push({ case: "prepared failure to explicit new execution", outcome: "new exact package/occurrence terminalizes and is selected; old bytes preserved; duplicate occurrence rejected" });
await writeFile(path.join(output, "probe.json"), JSON.stringify({ synthetic: true, candidateReviewApplyHowReadOrExecuted: false, observations }, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ synthetic: true, observations }, null, 2));
