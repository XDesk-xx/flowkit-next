import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Synthetic structural proof only: these fixtures never supply D05 authority.
const repo = process.cwd();
const out = path.resolve(process.argv[2]);
const fromSource = name => import(pathToFileURL(path.join(repo, name)).href);
const persistence = await fromSource("src/domain/run-result-persistence.ts");
const chain = await fromSource("src/cli/current-run-chain.ts");
const admission = await fromSource("src/domain/action-package-result-admission.ts");
const checks = [];
const deliveryId = "synthetic-review-delivery";
const changeId = "synthetic-review-change";
function record(sequence, actionId, previousRunId = null, verdict = "PASS") {
  const role = actionId.startsWith("review-") ? "reviewer" : "author";
  const occurrence = { date: "20260908", sequence, actionId };
  const runId = persistence.formatRunOccurrenceId(occurrence);
  const actionIdentity = { deliveryId, changeId, actionId };
  return {
    actionMarkdown: "# Synthetic record, not actual Action or Reviewer authority\n",
    context: { runId, occurrence, actionIdentity, role, lifecycleState: "terminal", ownerAuthority: null, previousRunId },
    result: { runId, actionIdentity, authorConclusion: role === "author" ? verdict : null,
      reviewerVerdict: role === "reviewer" ? verdict : null, verificationVerdict: null,
      nextBoundary: null, facts: { syntheticFixture: true } },
  };
}
const rootRecord = record(1, "explore");
const reviewRecord = record(2, "review-explore", rootRecord.context.runId, "changes-requested");
const reviseRecord = record(3, "revise-explore", reviewRecord.context.runId);
const repositoryRoot = path.join(out, "canonical-fixture");
const selection = { repositoryRoot, deliveryId, changeId };
const address = r => ({ ...selection, changeStartSequence: 1, occurrence: r.context.occurrence });
for (const r of [rootRecord, reviewRecord, reviseRecord]) {
  await persistence.writeDurableRun(address(r), r);
  assert.deepEqual(await persistence.readDurableRun(address(r)), r);
}
const history = await chain.readSelectedRunChain(selection);
assert.equal(history.current.context.runId, reviseRecord.context.runId);
assert.deepEqual(chain.policyForRecord(history.current, { deliveryId, changeId, changeState: "active" }),
  { kind: "ready-action", actionId: "review-explore" });
checks.push("Independent record production/readback and Policy review/revise linkage without action transport");

const preparedContext = { ...rootRecord.context, lifecycleState: "prepared" };
const current = { identity: rootRecord.context.actionIdentity, state: "prepared" };
// A synthetic GuidanceRef tests closed fields only; no candidate Skill is read or executed.
const actionPackage = admission.formActionPackage(current, preparedContext,
  { path: "skills/actions/explore/SKILL.md", contentSha256: "a".repeat(64) });
assert.ok(actionPackage);
assert.deepEqual(admission.admitActionResult(actionPackage, current, preparedContext.occurrence, rootRecord.result), rootRecord.result);
assert.equal(admission.admitActionResult(actionPackage, current, preparedContext.occurrence,
  { ...rootRecord.result, reviewerVerdict: "approved" }), null);
checks.push("Existing package/admission functions are independent of transport and reject wrong outcome Role");

const wrongRole = structuredClone(reviewRecord);
wrongRole.context.role = "author";
assert.throws(() => chain.resolveRunChain([rootRecord, wrongRole]), /Wrong Role/);
const fork = record(4, "review-explore", rootRecord.context.runId, "approved");
assert.throws(() => chain.resolveRunChain([rootRecord, reviewRecord, fork]), /fork/i);
checks.push("Wrong Role and fork rejected");

const prepared = record(4, "review-explore", reviseRecord.context.runId);
prepared.context.lifecycleState = "prepared";
prepared.result.reviewerVerdict = null;
assert.equal(persistence.isRunContextRecord(prepared.context), true);
assert.equal(persistence.isRunResultRecord(prepared.result), true);
assert.throws(() => chain.resolveRunChain([rootRecord, reviewRecord, reviseRecord, prepared]), /Incomplete prepared failure/);
checks.push("Known gap confirmed: new reader imposes invocationFailure on legacy-valid prepared fields; Explore explicitly schedules removal/reassessment");

const partialAddress = persistence.buildRunAddress(address(prepared));
await fs.mkdir(partialAddress.runDirectory);
await fs.writeFile(path.join(partialAddress.runDirectory, "action.md"),
  "# Synthetic interruption; no Result was produced\n", { flag: "wx" });
await assert.rejects(chain.readSelectedRunChain(selection), /Incomplete Run record/);
checks.push("Partial newest occurrence fails closed instead of selecting older PASS");

const bootstrapRoot = path.join(out, "bootstrap-fixture");
const bootstrapDir = path.join(bootstrapRoot, ".flowkit", "runs", deliveryId, changeId, rootRecord.context.runId);
await fs.mkdir(bootstrapDir, { recursive: true });
const marked = { kind: "external-orchestrator-synthetic-record", canonicalFlowkitRuntimeRun: false,
  executionMode: "independent-bootstrap", deliveryId, changeId, runId: rootRecord.context.runId };
await fs.writeFile(path.join(bootstrapDir, "action.md"), "# Synthetic bootstrap\n", { flag: "wx" });
for (const name of ["context.json", "result.json"])
  await fs.writeFile(path.join(bootstrapDir, name), JSON.stringify(marked) + "\n", { flag: "wx" });
const bootstrap = await chain.readSelectedRunChain({ ...selection, repositoryRoot: bootstrapRoot });
assert.equal(bootstrap.kind, "bootstrap-history");
assert.equal(bootstrap.current, null);
checks.push("Marked bootstrap is observation only, not canonical continuation");
console.log(JSON.stringify({ kind: "synthetic-explore-proof", checks,
  limitation: "Not new product acceptance, actual agent HOW execution, independent fixture Review, or D05 lifecycle invocation." }, null, 2));
