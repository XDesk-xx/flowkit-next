import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const proof = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-027-revise-apply";
const run = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow/20260908-027-revise-apply";
const parent = path.dirname(run);
const sha = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const reviewPath = parent + "/20260908-026-review-apply/result.json";
const review = JSON.parse(fs.readFileSync(reviewPath));
assert.equal(review.verdict, "changes-requested");
assert.equal(review.nextBoundary, "revise-apply");
assert.equal(sha(review.reviewedResult.path), review.reviewedResult.sha256);
const previous = JSON.parse(fs.readFileSync(review.reviewedResult.path));
for (const ref of previous.artifacts) assert.equal(sha(ref.path), ref.sha256, ref.path);
const protectedFiles = [];
for (const dir of fs.readdirSync(parent)) for (const name of fs.readdirSync(parent + "/" + dir)) protectedFiles.push(parent + "/" + dir + "/" + name);
for (const base of ["src/domain", "openspec/changes/connect-openspec-action-workflow"]) {
  const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = dir + "/" + e.name; if (e.isDirectory()) walk(f); else protectedFiles.push(f); } }; walk(base);
}
protectedFiles.push("openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml");
const baseline = { startedAt: new Date().toISOString(), reviewedResult: review.reviewedResult,
  review: { path: reviewPath, sha256: sha(reviewPath) }, protectedFiles: protectedFiles.map(file => ({ path: file, sha256: sha(file) })),
  priorArtifacts: previous.artifacts };
fs.writeFileSync(proof + "/baseline.json", JSON.stringify(baseline, null, 2) + "\n", { flag: "wx" });
fs.mkdirSync(run);
fs.writeFileSync(run + "/action.md", "# Revise Apply\n\n依据 026-review-apply，修复 D05-RA026-001/002 及 AGENTS 三命令残留。独立 bootstrap，真实执行后形成 Result；不修改 Proposal、历史或 Git。\n\n开始：" + baseline.startedAt + "\n", { flag: "wx" });
fs.writeFileSync(run + "/context.json", JSON.stringify({ kind: "external-orchestrator-revise-apply-context",
  canonicalFlowkitRuntimeRun: false, executionMode: "independent-bootstrap", role: "author", action: "revise-apply",
  deliveryId: review.deliveryId, changeId: review.changeId, projectOrdinal: 35, runId: "20260908-027-revise-apply",
  previousRunId: review.runId, ownerInstruction: "根据最新run，revise", ownerSourceRef: "owner-input:2026-09-08:revise-after-026",
  findings: review.findings.map(f => f.id), proofRoot: proof, nextBoundaryAfterCompletion: "review-apply",
  ownerDecisionsRelevant: ["D05 独立 bootstrap，CLI 只读而 Agent 执行记录", "必要材料留在 target artifacts，.tmp 可丢弃，不重写历史", "单次修订后 STOP，不自动 Review/Archive/Git"],
}, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ run, startedAt: baseline.startedAt, verifiedPriorArtifacts: previous.artifacts.length }));
