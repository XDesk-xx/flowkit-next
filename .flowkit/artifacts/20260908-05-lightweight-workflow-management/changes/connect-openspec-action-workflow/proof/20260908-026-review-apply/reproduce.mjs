import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const repo = process.cwd();
const out = path.resolve(process.argv[2]);
const source = file => import(pathToFileURL(path.join(repo, file)).href);
const domain = await source("src/domain/index.ts");
const chain = await source("src/cli/current-run-chain.ts");
const { loadManagerInstallation } = await source("src/internal/manager-installation.ts");
const { loadHow } = await source("tests/unit/domain/agent-how-fixture.ts");
const observations = [];
function record(changeId, sequence = 1, lifecycleState = "terminal") {
  const actionIdentity = { deliveryId: "review-fixture", changeId, actionId: "explore" };
  const occurrence = { date: "20260908", sequence, actionId: "explore" };
  const runId = domain.formatRunOccurrenceId(occurrence);
  return {
    actionMarkdown: "# Synthetic Reviewer counterexample, not a real Action\n",
    context: { runId, occurrence, actionIdentity, role: "author", lifecycleState,
      ownerAuthority: null, previousRunId: null },
    result: { runId, actionIdentity, authorConclusion: lifecycleState === "terminal" ? "PASS" : null,
      reviewerVerdict: null, verificationVerdict: null, nextBoundary: null,
      facts: { syntheticFixture: true } },
  };
}
async function persist(root, item) {
  return domain.writeDurableRun({ repositoryRoot: root, deliveryId: "review-fixture",
    changeId: item.context.actionIdentity.changeId, changeStartSequence: 1,
    occurrence: item.context.occurrence }, item);
}
async function observe(label, input) {
  try {
    const value = await chain.readSelectedRunChain(input);
    observations.push({ label, kind: value.kind, currentRun: value.current?.context.runId ?? null });
    return value;
  } catch (error) {
    observations.push({ label, errorKind: error.kind, message: error.message });
    return error;
  }
}
const suffixRoot = path.join(out, "suffix-target");
await fs.mkdir(suffixRoot);
const input = { repositoryRoot: suffixRoot, deliveryId: "review-fixture", changeId: "feature" };
const initial = await observe("empty selected history before unrelated group", input);
assert.equal(initial.current, null);
await persist(suffixRoot, record("improve-feature"));
const foreignOnly = await observe("valid improve-feature exists but feature remains empty", input);
assert.equal(foreignOnly.kind, "run-chain-invalid");
assert.match(foreignOnly.message, /Invalid Run group prefix/);
await persist(suffixRoot, record("feature"));
const both = await observe("both exact feature and distinct improve-feature have valid records", input);
assert.equal(both.kind, "context-ambiguous");
assert.match(both.message, /Multiple Run groups/);
const controlRoot = path.join(out, "non-suffix-control");
await fs.mkdir(controlRoot);
await persist(controlRoot, record("feature"));
await persist(controlRoot, record("different-change"));
const control = await observe("control with unrelated non-suffix Change", { ...input, repositoryRoot: controlRoot });
assert.equal(control.current.context.actionIdentity.changeId, "feature");

const retryRoot = path.join(out, "prepared-target");
await fs.mkdir(retryRoot);
const previous = record("retry-feature", 1, "prepared");
await persist(retryRoot, previous);
const current = { identity: previous.context.actionIdentity, state: "prepared" };
const decision = domain.evaluatePolicyAndNextBoundary({
  deliveryId: "review-fixture", changeId: "retry-feature", changeState: "active",
  currentAction: current, terminalRunContext: null, terminalResult: null,
});
assert.deepEqual(decision, { kind: "ready-action", actionId: "explore" });
const nextOccurrence = { ...previous.context.occurrence, sequence: 2 };
const nextContext = { ...previous.context, occurrence: nextOccurrence,
  runId: domain.formatRunOccurrenceId(nextOccurrence), previousRunId: previous.context.runId };
const nextInput = { repositoryRoot: retryRoot, deliveryId: "review-fixture", changeId: "retry-feature",
  changeStartSequence: 1, occurrence: nextOccurrence };
// Follow the explicit current HOW preparation step, then execute only Explore's fixture code.
const currentFromPublishedStep = domain.transitionCurrentAction(current,
  { type: "prepare", identity: current.identity });
assert.equal(currentFromPublishedStep, null);
const guidance = await domain.resolveActionGuidanceRef(loadManagerInstallation(), "explore");
const how = await loadHow("explore");
await assert.rejects(how.startRecord(domain, nextInput, currentFromPublishedStep, nextContext, guidance, true),
  /invalid package\/Role/);
const address = domain.buildRunAddress(nextInput);
await assert.rejects(fs.stat(address.runDirectory), { code: "ENOENT" });
assert.deepEqual(await domain.readDurableRun({ ...nextInput, occurrence: previous.context.occurrence }), previous);
// Control: existing prepared identity is reusable; only occurrence changes.
assert.ok(domain.formActionPackage(current, nextContext, guidance));
const held = await how.startRecord(domain, nextInput, current, nextContext, guidance, true);
assert.equal(held.actionPackage.runId, nextContext.runId);
observations.push({ label: "prepared retry HOW contradicts unchanged kernel", decision,
  publishedPrepareReturned: currentFromPublishedStep, actual: "startRecord rejected invalid package/Role before new occurrence",
  control: "reusing exact prepared CurrentAction forms a valid new package and starts new occurrence",
  oldOccurrenceUnchanged: true });
await fs.writeFile(path.join(out, "counterexamples.json"), JSON.stringify({
  kind: "independent-synthetic-counterexamples", observations,
  limit: "Synthetic source-level checks only, no D05 candidate lifecycle invocation or independent fixture Review."
}, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ reproduced: ["suffix-group-selection", "prepared-retry-how"], observations }, null, 2));
