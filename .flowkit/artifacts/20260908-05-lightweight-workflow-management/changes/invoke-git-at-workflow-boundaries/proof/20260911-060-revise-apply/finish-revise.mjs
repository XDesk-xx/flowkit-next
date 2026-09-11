import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const deliveryId = "20260908-05-lightweight-workflow-management", changeId = "invoke-git-at-workflow-boundaries", runId = "20260911-060-revise-apply";
const group = `.flowkit/runs/${deliveryId}/006-${changeId}`;
const runRoot = path.join(group, runId);
const context = JSON.parse(await fs.readFile(path.join(runRoot, "context.json"), "utf8"));
assert.deepEqual((await fs.readdir(runRoot)).sort(), ["action.md", "context.json"]);
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true }).trim();
assert.equal(git("rev-parse", "HEAD"), context.repositoryHead);
assert.equal(git("branch", "--show-current"), `delivery/${deliveryId}`);
async function ref(file) {
  const bytes = await fs.readFile(file);
  return { path: path.relative(root, path.resolve(file)).replaceAll("\\", "/"), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
async function verify(reference) {
  const actual = await ref(reference.path); assert.equal(actual.bytes, reference.bytes); assert.equal(actual.sha256, reference.sha256);
}
const reviewPath = `${group}/20260911-059-review-apply/result.json`;
const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
assert.equal(review.verdict, "changes-requested"); assert.equal(review.nextBoundary, "revise-apply");
for (const r of [review.reviewedResult, review.acceptedProposalReview, review.reviewedPayload, review.reviewReport]) await verify(r);
const baseline = JSON.parse(await fs.readFile(review.reviewedPayload.path, "utf8"));
const expected = ["src/domain/git-workflow-host.ts", "src/internal/git-checkpoint-scope.ts", "src/internal/git-checkpoint-execution.ts",
  "src/internal/delivery-repository-integration-failure.ts", "src/domain/delivery-repository-integration-execution.ts"].sort();
const changed = [];
for (const prior of baseline.files) if ((await ref(prior.path)).sha256 !== prior.sha256) changed.push(prior.path);
assert.deepEqual(changed.sort(), expected);
const checkIds = JSON.parse(await fs.readFile("config/verification/full-test.json", "utf8")).checks.map(c => c.checkId);
const checks = [];
for (const label of ["before", "after", "pack", "packed-example", "openspec-strict", "linux-container", ...["win-final", "linux-final"].flatMap(prefix => checkIds.map(id => prefix + "-" + id))]) {
  const directory = path.join(proof, label);
  const record = JSON.parse(await fs.readFile(path.join(directory, "command.json"), "utf8"));
  assert.equal(record.exitCode, label === "before" ? 1 : 0, label);
  for (const name of ["stdout", "stderr"]) {
    const actual = await ref(path.join(directory, name + ".txt"));
    assert.equal(actual.sha256, record[name].sha256); assert.equal(actual.bytes, record[name].bytes);
  }
  checks.push({ label, exitCode: record.exitCode });
}
const counts = {};
for (const prefix of ["win-final", "linux-final"]) {
  counts[prefix] = {};
  for (const [id, total] of [["domain", 324], ["acceptance", 7], ["entropy-tests", 7]]) {
    const text = await fs.readFile(path.join(proof, prefix + "-" + id, "stdout.txt"), "utf8");
    assert.match(text, new RegExp("# pass " + total + "(?:\\r?\\n|$)")); assert.match(text, /# fail 0(?:\r?\n|$)/);
    counts[prefix][id] = total;
  }
}
const linux = JSON.parse(await fs.readFile(path.join(proof, "linux-source.json"), "utf8"));
for (const file of linux.files) assert.equal((await ref(file.artifact)).sha256, file.contentSha256, file.artifact);
const lines = [];
async function scan(directory) {
  for (const name of await fs.readdir(directory)) {
    const file = path.join(directory, name);
    if ((await fs.lstat(file)).isDirectory()) await scan(file);
    else if (/\.(ts|mjs)$/.test(name)) {
      const text = await fs.readFile(file, "utf8"); const count = text.split("\n").length - Number(text.endsWith("\n"));
      assert.ok(count <= 650, `${file}: ${count}`); lines.push({ path: file.replaceAll("\\", "/"), lines: count });
    }
  }
}
await scan("src"); await scan("tests");
const audit = { status: "passed", checks, counts, linuxSourceFilesMatchCurrent: linux.files.length,
  regression: { before: { passed: 0, failed: 3 }, after: { passed: 3, failed: 0 }, additionalPendingStateAndStageDrift: "included in both current domain suites" },
  lineGate: { limit: 650, files: lines.length, largest: lines.sort((a,b) => b.lines-a.lines).slice(0,5) },
  changeScopeSince058: expected, proposalAndHistoryUnchanged: true, formalD05FullTest: false };
await fs.writeFile(path.join(proof, "verification-audit.json"), JSON.stringify(audit, null, 2) + "\n", { flag: "wx" });
const payload = { repositoryHead: context.repositoryHead, ancestorPayload: review.reviewedPayload, previousReview: await ref(reviewPath),
  files: await Promise.all([...expected, "tests/unit/domain/git-host-review-regressions.test.ts"].map(ref)), removedPaths: [] };
await fs.writeFile(path.join(proof, "payload.json"), JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
const evidence = [];
async function inventory(directory) {
  for (const name of (await fs.readdir(directory)).sort()) {
    const file = path.join(directory, name);
    if ((await fs.lstat(file)).isDirectory()) await inventory(file); else evidence.push(await ref(file));
  }
}
await inventory(proof);
await fs.writeFile(path.join(proof, "evidence-index.json"), JSON.stringify({ deliveryId, changeId, runId, files: evidence }, null, 2) + "\n", { flag: "wx" });
const result = { kind: "external-orchestrator-revise-apply-result", executionMode: "independent-bootstrap", canonicalFlowkitRuntimeRun: false,
  role: "author", action: "revise-apply", deliveryId, changeId, projectOrdinal: 38, runId, previousRunId: context.previousRunId,
  status: "terminal", authorConclusion: "completed", startedAt: context.startedAt, completedAt: new Date().toISOString(),
  correctedFindings: context.findings, previousReview: await ref(reviewPath),
  revisionReport: await ref(path.join(proof, "revision-report.md")), verification: await ref(path.join(proof, "verification-audit.json")),
  payload: await ref(path.join(proof, "payload.json")), evidenceIndex: await ref(path.join(proof, "evidence-index.json")),
  ownerDecisionsRelevant: context.ownerDecisionsRelevant, blockingUnknowns: [], removedPaths: [],
  boundary: { independentReviewerVerdict: null, proposalChanged: false, historicalRunsChanged: false, currentRepositoryGitMutation: false, formalD05FullTest: false },
  nextBoundary: "review-apply", stop: true };
await fs.writeFile(path.join(runRoot, "result.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
assert.deepEqual(JSON.parse(await fs.readFile(path.join(runRoot, "result.json"), "utf8")), result);
assert.deepEqual((await fs.readdir(runRoot)).sort(), ["action.md", "context.json", "result.json"]);
console.log(JSON.stringify({ result: await ref(path.join(runRoot, "result.json")), status: "recorded-and-read-back", findings: result.correctedFindings, counts, lineGate: audit.lineGate, nextBoundary: result.nextBoundary, stop: true }));
