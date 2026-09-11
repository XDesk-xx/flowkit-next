import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const p = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-027-revise-apply", r = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow/20260908-027-revise-apply";
const read = f => JSON.parse(fs.readFileSync(f));
const ref = f => { const bytes = fs.readFileSync(f); return { path: f, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }; };
const verified = read(p + "/verification.json");
const baseline = read(p + "/baseline.json");
const context = read(r + "/context.json");
assert.equal(verified.status, "PASS");
for (const item of [...baseline.protectedFiles, ...verified.changed, ...verified.evidence])
  assert.equal(ref(item.path).sha256, item.sha256, item.path);
const prior = read(baseline.reviewedResult.path);
const artifacts = [...new Set([...prior.artifacts.map(item => item.path), ...verified.changed.map(item => item.path)])].map(ref);
const result = {
  kind: "external-orchestrator-revise-apply-result", canonicalFlowkitRuntimeRun: false,
  executionMode: "independent-bootstrap", role: "author", action: "revise-apply",
  deliveryId: context.deliveryId, changeId: context.changeId, projectOrdinal: 35,
  runId: context.runId, previousRunId: context.previousRunId,
  status: "terminal", verdict: "PASS",
  verdictMeaning: "Author 已完成 finding 修正及本轮验证；不代表独立 Review approved 或 Delivery Full Test",
  summary: "修正 exact Change group 后缀误匹配与十个 HOW 的 same-prepared 复用，保留内核及历史边界。",
  findingsAddressed: ["D05-RA026-001", "D05-RA026-002"],
  nonBlockingObservationAddressed: "AGENTS 第4节已撤出旧 action 命令字样",
  previousReview: { ...baseline.review, bytes: fs.statSync(baseline.review.path).size },
  previousApply: baseline.reviewedResult,
  artifacts, revisionDelta: verified.changed, exactRemovals: [],
  inheritedRemovals: { sourceResult: baseline.reviewedResult, paths: prior.exactRemovals.map(item => item.path) },
  tasks: { total: 21, complete: 21, remaining: 0, planRewritten: false },
  verification: { windowsDomain: { pass: 284, fail: 0, skipped: 0 },
    windowsAcceptance: { pass: 6, fail: 0, skipped: 0 },
    linuxDomain: { pass: 284, fail: 0, skipped: 0 },
    linuxAcceptance: { pass: 6, fail: 0, skipped: 0 },
    sourceTestGate: verified.gate, protectedFilesUnchanged: verified.protectedFilesUnchanged },
  evidence: [...verified.evidence, ref(p + "/verification.json"), ref(p + "/baseline.json")],
  handoff: ref(p + "/handoff.md"), ownerSourceRef: context.ownerSourceRef,
  ownerDecisionsRelevant: context.ownerDecisionsRelevant,
  historicalRunsRewritten: false, kernelChanged: false, planChanged: false,
  candidateSelfManagement: false, scopeDrift: "NONE", reviewerVerdict: null,
  formalFullTestExecuted: false, archiveExecuted: false, gitOperations: [],
  startedAt: baseline.startedAt, completedAt: new Date().toISOString(),
  nextBoundary: "review-apply", stop: true,
};
fs.writeFileSync(r + "/result.json", JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
assert.deepEqual(read(r + "/result.json"), result);
console.log(JSON.stringify({ runId: result.runId, verdict: result.verdict, findingsAddressed: result.findingsAddressed,
  nextBoundary: result.nextBoundary, result: ref(r + "/result.json") }));
