import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";
const load = file => import(pathToFileURL(path.resolve(file)).href);
const { evaluatePolicyAndNextBoundary } = await load("src/domain/policy-and-next-boundary.ts");
const { transitionCurrentAction } = await load("src/domain/action-lifecycle.ts");
const { formActionPackage, admitActionResult } = await load("src/domain/action-package-result-admission.ts");
const deliveryId = "synthetic-plan-review";
const changeId = "synthetic-contract";
const examples = [];
function example(actionId, role, verdict, state = "terminal") {
  const actionIdentity = { deliveryId, changeId, actionId };
  const occurrence = { date: "20260908", sequence: 1, actionId };
  const runId = "20260908-001-" + actionId;
  const context = { runId, occurrence, actionIdentity, role, lifecycleState: state,
    ownerAuthority: null, previousRunId: null };
  const result = { runId, actionIdentity, authorConclusion: role === "author" ? verdict : null,
    reviewerVerdict: role === "reviewer" ? verdict : null, verificationVerdict: null,
    nextBoundary: null, facts: { syntheticFixture: true } };
  const currentAction = { identity: actionIdentity, state };
  const decision = evaluatePolicyAndNextBoundary({ deliveryId, changeId, changeState: "active",
    currentAction, terminalRunContext: state === "terminal" ? context : null,
    terminalResult: state === "terminal" ? result : null });
  return { context, result, currentAction, decision };
}
for (const [action, role, verdict, expected] of [
  ["revise-propose", "author", "PASS", { kind: "ready-action", actionId: "review-propose" }],
  ["review-propose", "reviewer", "approved", { kind: "ready-action", actionId: "apply" }],
  ["review-propose", "reviewer", "changes-requested", { kind: "ready-action", actionId: "revise-propose" }],
  ["apply", "author", "FAIL", { kind: "blocked", reason: "unrecognized-or-unsuccessful-author-outcome" }],
]) {
  const value = example(action, role, verdict);
  assert.deepEqual(value.decision, expected);
  examples.push({ action, role, verdict, decision: value.decision });
}
const prepared = example("apply", "author", null, "prepared");
assert.deepEqual(prepared.decision, { kind: "ready-action", actionId: "apply" });
examples.push({ action: "apply", state: "prepared", noTransportFailureKey: true, decision: prepared.decision });
// Synthetic GuidanceRef exercises shape only. No product Skill is read/executed.
const packageValue = formActionPackage(prepared.currentAction, prepared.context,
  { path: "skills/actions/apply/SKILL.md", contentSha256: "a".repeat(64) });
assert.ok(packageValue);
const completed = { ...prepared.result, authorConclusion: "PASS" };
assert.deepEqual(admitActionResult(packageValue, prepared.currentAction, prepared.context.occurrence, completed), completed);
assert.equal(admitActionResult(packageValue, prepared.currentAction, prepared.context.occurrence,
  { ...completed, reviewerVerdict: "approved" }), null);
assert.equal(transitionCurrentAction(prepared.currentAction,
  { type: "terminal", identity: prepared.context.actionIdentity }).state, "terminal");
assert.equal(transitionCurrentAction(prepared.currentAction,
  { type: "terminal", identity: { ...prepared.context.actionIdentity, changeId: "wrong-change" } }), null);
console.log(JSON.stringify({ kind: "synthetic-existing-contract-check", examples,
  exactAdmissionAndTransition: true, limit: "Pure existing-contract examples, not Agent HOW acceptance or Reviewer/Owner authority." }, null, 2));
