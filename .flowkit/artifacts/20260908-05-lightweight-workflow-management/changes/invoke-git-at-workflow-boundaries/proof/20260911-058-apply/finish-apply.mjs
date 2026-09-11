import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const proof = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const deliveryId = "20260908-05-lightweight-workflow-management";
const changeId = "invoke-git-at-workflow-boundaries";
const runId = "20260911-058-apply";
const group = `.flowkit/runs/${deliveryId}/006-${changeId}`;
const runRoot = path.join(root, group, runId);
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
assert.equal(git("rev-parse", "HEAD").trim(), "a0edb690d7208a3b81855e30a31dbc175f060a93");
assert.equal(git("branch", "--show-current").trim(), `delivery/${deliveryId}`);
assert.deepEqual((await fs.readdir(runRoot)).sort(), ["action.md", "context.json"]);
const context = JSON.parse(await fs.readFile(path.join(runRoot, "context.json"), "utf8"));
assert.equal(context.previousRunId, "20260911-057-review-propose");
const review = JSON.parse(await fs.readFile(context.acceptedReview, "utf8"));
assert.equal(review.verdict, "approved"); assert.equal(review.nextBoundary, "apply");
const observation = JSON.parse(await fs.readFile(path.join(proof, "openspec-all-done/stdout.txt"), "utf8"));
assert.equal(observation.state, "all_done"); assert.equal(observation.progress.complete, 17); assert.equal(observation.progress.remaining, 0);
const audit = JSON.parse(await fs.readFile(path.join(proof, "verification-audit.json"), "utf8"));
assert.equal(audit.status, "passed"); assert.equal(audit.checks.length, 18);
async function ref(file) {
  const bytes = await fs.readFile(file);
  return { path: path.relative(root, path.resolve(file)).replaceAll("\\", "/"), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
const source = JSON.parse(await fs.readFile(path.join(proof, "linux-source.json"), "utf8"));
for (const file of source.files) {
  const current = await ref(file.artifact);
  assert.equal(current.sha256, file.contentSha256, file.artifact);
}
for (const { check } of audit.checks) {
  const directory = path.join(proof, check);
  const command = JSON.parse(await fs.readFile(path.join(directory, "command.json"), "utf8"));
  assert.equal(command.exitCode, 0);
  for (const stream of ["stdout", "stderr"]) {
    const current = await ref(path.join(directory, stream + ".txt"));
    assert.equal(current.bytes, command[stream].bytes); assert.equal(current.sha256, command[stream].sha256);
  }
}
for (const check of ["pack", "packed-example", "supplemental", "conflict-check", "openspec-strict", "openspec-all-done", "linux-container-retry"]) {
  const command = JSON.parse(await fs.readFile(path.join(proof, check, "command.json"), "utf8")); assert.equal(command.exitCode, 0, check);
}
const changes = [...new Set([...git("diff", "--name-only", "-z").split("\0"), ...git("ls-files", "--others", "--exclude-standard", "-z").split("\0")])]
  .filter(p => p && !p.startsWith(".flowkit/")).sort();
assert.ok(changes.every(p => p === "AGENTS.md" || p.startsWith("skills/") || p.startsWith("src/") || p.startsWith("tests/") ||
  p.startsWith(`openspec/changes/${changeId}/`) || p === `openspec/delivery-groups/${deliveryId}.yaml`));
const payload = { repositoryHead: context.repositoryHead, files: await Promise.all(changes.map(ref)), removals: [],
  ancestorContinuity: [context.acceptedReview, `${group}/20260911-056-propose/result.json`, `${group}/20260909-055-review-explore/result.json`, `${group}/20260909-054-explore/context.json`],
  note: "Cumulative current worktree plus exact retrievable uncommitted ancestors. Manifest and planning were already present before Apply; only tasks completion changed in planning." };
await fs.writeFile(path.join(proof, "payload.json"), JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
const evidence = [];
async function inventory(dir) {
  for (const name of (await fs.readdir(dir)).sort()) {
    const file = path.join(dir, name);
    if ((await fs.lstat(file)).isDirectory()) await inventory(file);
    else evidence.push(await ref(file));
  }
}
await inventory(proof);
await fs.writeFile(path.join(proof, "evidence-index.json"), JSON.stringify({ deliveryId, changeId, runId, files: evidence }, null, 2) + "\n", { flag: "wx" });
const result = { kind: "external-orchestrator-apply-result", canonicalFlowkitRuntimeRun: false, executionMode: "independent-bootstrap", role: "author", action: "apply",
  deliveryId, changeId, projectOrdinal: 38, runId, previousRunId: context.previousRunId,
  status: "terminal", authorConclusion: "completed", startedAt: context.startedAt, completedAt: new Date().toISOString(),
  acceptedReview: await ref(context.acceptedReview), tasks: { total: 17, completed: 17, remaining: 0 },
  implementationReport: await ref(path.join(proof, "implementation-report.md")), verification: await ref(path.join(proof, "verification-audit.json")),
  payload: await ref(path.join(proof, "payload.json")), evidenceIndex: await ref(path.join(proof, "evidence-index.json")),
  verificationSummary: { windows: { checksPassed: 9, domain: 320, acceptance: 7, entropy: 7 }, linuxX64: { checksPassed: 9, domain: 320, acceptance: 7, entropy: 7 },
    packedSplitRoot: "passed", partialEffectsAndRemoteMismatch: "passed", realIndexConflict: "passed", openSpecStrict: "passed", applicableLineGate: "passed", formalD05FullTest: false },
  ownerDecisionsRelevant: context.ownerDecisionsRelevant, blockingUnknowns: [], removedPaths: [],
  boundary: { independentReviewerVerdict: null, archiveExecuted: false, currentRepositoryGitMutation: false, candidateManagesD05: false },
  nextBoundary: "review-apply", stop: true };
await fs.writeFile(path.join(runRoot, "result.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
assert.deepEqual(JSON.parse(await fs.readFile(path.join(runRoot, "result.json"), "utf8")), result);
assert.deepEqual((await fs.readdir(runRoot)).sort(), ["action.md", "context.json", "result.json"]);
console.log(JSON.stringify({ status: "recorded-and-read-back", result: await ref(path.join(runRoot, "result.json")), tasks: result.tasks, nextBoundary: result.nextBoundary, stop: true }));
