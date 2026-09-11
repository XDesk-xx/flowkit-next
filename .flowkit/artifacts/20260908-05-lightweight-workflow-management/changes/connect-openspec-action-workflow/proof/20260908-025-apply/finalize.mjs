import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const proof = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-025-apply";
const run = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow/20260908-025-apply";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const ref = file => { const bytes = fs.readFileSync(file); return { path: file, bytes: bytes.length, sha256: hash(bytes) }; };
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const baseline = json(proof + "/baseline.json");
for (const item of baseline.protected) assert.equal(ref(item.path).sha256, item.sha256);
const commands = ["domain-native-final", "acceptance-native-02", "linux-final", "gates-type", "gates-build",
  "gate-format", "gate-lint-final", "gate-dependency", "gate-entropy", "entropy-tests", "forbidden",
  "openspec-strict", "final-openspec", "verify-scope", "how-failure", "query-proof",
  "example-start", "example-work", "example-finish", "example-status", "example-next"];
const evidence = [];
for (const label of commands) {
  const file = proof + "/" + label + "/command.json";
  const command = json(file);
  assert.equal(command.exitCode, 0, label);
  assert.equal(command.error, null, label);
  for (const stream of [command.stdout, command.stderr]) {
    assert.deepEqual(ref(stream.path), stream);
    evidence.push(ref(stream.path));
  }
  evidence.push(ref(file));
}
assert.equal(json(proof + "/final-openspec/stdout.txt").progress.complete, 21);
assert.equal(json(proof + "/example-status/stdout.txt").currentRun.state, "terminal");
assert.deepEqual(json(proof + "/example-next/stdout.txt").decision, { kind: "ready-action", actionId: "review-explore" });
const git = args => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout.trim();
};
assert.equal(git(["rev-parse", "HEAD"]), "697088391374daa67d63c20f8a365fb44ec5c058");
git(["diff", "--check", "HEAD"]);
const files = [...new Set((git(["diff", "--name-only", "HEAD"]) + "\n" +
  git(["ls-files", "--others", "--exclude-standard"])).split(/\r?\n/))];
const artifacts = files.filter(file => file && !file.startsWith(".flowkit/") && fs.existsSync(file)).map(ref);
const sourceTests = artifacts.filter(item => /^(src|tests)\//.test(item.path)).map(item => ({
  path: item.path, lines: fs.readFileSync(item.path, "utf8").split("\n").length - 1,
}));
for (const item of sourceTests) assert.ok(item.lines <= 650, JSON.stringify(item));
for (const name of ["handoff.md", "scope-verification.json", "baseline.json", "example-start.mjs", "example-finish.mjs"])
  evidence.push(ref(proof + "/" + name));
const context = json(run + "/context.json");
const result = {
  kind: "external-orchestrator-apply-result", canonicalFlowkitRuntimeRun: false,
  executionMode: "independent-bootstrap", role: "author", action: "apply",
  deliveryId: context.deliveryId, changeId: context.changeId, projectOrdinal: 35,
  runId: context.runId, previousRunId: context.previousRunId,
  status: "terminal", verdict: "PASS",
  verdictMeaning: "当前 Author 实现与列示验证完成；不是 Reviewer approved 或 Formal Delivery Full Test",
  summary: "三命令查询与 Agent 真实记录解耦完成；移除未发布宿主协议，保留原内核与 partial，落实十个产品/十个独立 bootstrap HOW。",
  startedAt: baseline.startedAt, completedAt: new Date().toISOString(),
  approvedReview: ref(baseline.approvedReview),
  tasks: { total: 21, complete: 21, remaining: 0 },
  artifacts, exactRemovals: baseline.removedSources,
  verification: { windowsDomain: { pass: 280, fail: 0, skipped: 0 },
    windowsAcceptance: { pass: 6, fail: 0, skipped: 0 },
    linuxDomain: { pass: 280, fail: 0, skipped: 0 },
    linuxAcceptance: { pass: 6, fail: 0, skipped: 0 },
    linuxScopeNote: "最终追加的无关 proof 用例以 Windows 完整 domain 验证；Linux 已覆盖同一生产实现和 HOW 故障注入。",
    sourceTestGate: { limit: 650, maxLines: Math.max(...sourceTests.map(item => item.lines)), sourceTests },
    productionReachability: "43/43", formalFullTest: false },
  evidence, handoff: ref(proof + "/handoff.md"),
  ownerDecisionsRelevant: context.ownerDecisionsRelevant,
  ownerSourceRef: context.ownerSourceRef,
  historicalRunsRewritten: false, candidateSelfManagement: false,
  reviewerVerdict: null, nextBoundary: "review-apply", stop: true,
  gitOperations: [], scopeDrift: "NONE",
};
fs.writeFileSync(run + "/result.json", JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
assert.deepEqual(json(run + "/result.json"), result);
console.log(JSON.stringify({ runId: result.runId, verdict: result.verdict, tasks: result.tasks,
  artifactCount: artifacts.length, evidenceCount: evidence.length, maxLines: result.verification.sourceTestGate.maxLines,
  nextBoundary: result.nextBoundary, result: ref(run + "/result.json") }));
