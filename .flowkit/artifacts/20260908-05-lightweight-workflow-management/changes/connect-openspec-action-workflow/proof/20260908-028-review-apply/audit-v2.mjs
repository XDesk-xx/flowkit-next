import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, lstatSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const base = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/";
const runs = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow/";
const json = file => JSON.parse(readFileSync(file, "utf8"));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const refs = new Map();
function ref(file) {
  const full = path.resolve(root, file);
  assert.ok(full.startsWith(root + path.sep), file);
  assert.ok(lstatSync(full).isFile(), file);
  assert.equal(realpathSync(full), full, file);
  const bytes = readFileSync(full);
  const value = { path: file.replaceAll("\\", "/"), bytes: bytes.length, sha256: digest(bytes) };
  refs.set(value.path, value);
  return value;
}
function check(value) {
  const got = ref(value.path);
  assert.equal(got.sha256, value.sha256, value.path);
  if (value.bytes !== undefined) assert.equal(got.bytes, value.bytes, value.path);
}
function walk(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.path === "string" && typeof value.sha256 === "string") check(value);
  for (const child of Object.values(value)) if (child && typeof child === "object") walk(child);
}
const author = json(runs + "20260908-027-revise-apply/result.json");
const prior = json(runs + "20260908-025-apply/result.json");
const review = json(runs + "20260908-026-review-apply/result.json");
const approval = json(runs + "20260908-024-review-propose/result.json");
const plan = json(runs + "20260908-023-revise-propose/result.json");
assert.equal(author.previousRunId, review.runId);
assert.equal(review.previousRunId, prior.runId);
assert.equal(prior.previousRunId, approval.runId);
assert.equal(approval.previousRunId, plan.runId);
assert.equal(approval.verdict, "approved");
assert.equal(review.verdict, "changes-requested");
assert.equal(author.nextBoundary, "review-apply");
assert.equal(author.verdict, "PASS");
walk(author);
for (const id of [23, 24, 25, 26, 27]) {
  const suffix = { 23: "revise-propose", 24: "review-propose", 25: "apply", 26: "review-apply", 27: "revise-apply" }[id];
  for (const name of ["action.md", "context.json", "result.json"]) ref(runs + "20260908-0" + id + "-" + suffix + "/" + name);
}
check(review.approvedProposalReview);
check(approval.reviewedResult);
for (const artifact of plan.artifacts) if (!artifact.path.endsWith("/tasks.md")) check(artifact);
for (const artifact of prior.artifacts) if (artifact.path.startsWith("openspec/changes/")) check(artifact);
assert.equal(existsSync(runs + "20260908-019-apply/result.json"), false);
const baseline = json(base + "20260908-027-revise-apply/baseline.json");
assert.deepEqual(baseline.priorArtifacts, prior.artifacts);
for (const item of baseline.protectedFiles) check(item);
const previous = new Map(prior.artifacts.map(item => [item.path, item]));
const current = new Map(author.artifacts.map(item => [item.path, item]));
for (const key of previous.keys()) assert.ok(current.has(key), "Unexpected lost artifact: " + key);
const delta = author.artifacts.filter(item => !previous.has(item.path) || previous.get(item.path).sha256 !== item.sha256);
assert.deepEqual(delta.map(x => x.path).sort(), author.revisionDelta.map(x => x.path).sort());
for (const item of author.inheritedRemovals.paths) assert.equal(existsSync(item), false, item);
for (const item of prior.exactRemovals) check({ ...item, path: base + "20260908-025-apply/removed-source/" + item.path });
const gate = author.artifacts.filter(item => /^(src|tests)\//.test(item.path)).map(item => {
  const text = readFileSync(item.path, "utf8");
  const lines = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  assert.ok(lines <= 650, item.path);
  return { path: item.path, lines };
});
const commands = [];
for (const item of author.evidence.filter(item => item.path.endsWith("/command.json"))) {
  const value = json(item.path);
  walk(value);
  assert.equal(value.exitCode, 0, item.path);
  assert.equal(value.error, null, item.path);
  assert.equal(value.signal, null, item.path);
  assert.ok(Date.parse(value.startedAt) <= Date.parse(value.finishedAt), item.path);
  commands.push({ path: item.path, executable: value.executable, args: value.args, startedAt: value.startedAt, finishedAt: value.finishedAt, exitCode: value.exitCode });
}
const log = name => readFileSync(base + "20260908-027-revise-apply/" + name + "/stdout.txt", "utf8");
assert.match(log("domain-windows"), /# pass 284\r?\n# fail 0/);
assert.match(log("domain-windows"), /# skipped 0/);
assert.match(log("acceptance-windows"), /# pass 6\r?\n# fail 0/);
assert.match(log("linux"), /# pass 284\r?\n# fail 0/);
assert.match(log("linux"), /# pass 6\r?\n# fail 0/);
ref(base + "20260908-027-revise-apply/linux.sh");
const newSource = readFileSync("src/cli/current-run-chain.ts", "utf8");
const oldExpression = 'entry.name.endsWith(' + String.fromCharCode(96) + '-$' + '{input.changeId}' + String.fromCharCode(96) + ')';
assert.equal(digest(Buffer.from(newSource.replace('/^\\d+-(.+)$/.exec(entry.name)?.[1] === input.changeId', oldExpression))), previous.get("src/cli/current-run-chain.ts").sha256, "Only exact group matching changed");
const agents = readFileSync("AGENTS.md", "utf8");
const tick = String.fromCharCode(96);
assert.ok(agents.includes("新产品 " + tick + "status / next / doctor" + tick));
assert.equal(agents.includes("status / next / doctor / action"), false);
for (const attempt of ["attempt-01", "attempt-02", "attempt-03"]) {
  const file = path.join(proof, attempt, "summary.json");
  ref(path.relative(root, file));
  walk(json(file));
}
const final = json(path.join(proof, "attempt-03/summary.json"));
assert.ok(final.commands.every(command => command.exitCode === 0));
assert.match(readFileSync(path.join(proof, "attempt-03/focused-tests.stdout.txt"), "utf8"), /# pass 23\r?\n# fail 0/);
assert.equal(readFileSync(path.join(proof, "attempt-03/openspec-version.stdout.txt"), "utf8").trim(), "1.10.0");
const probe = json(path.join(proof, "attempt-03/probe.json"));
assert.equal(probe.observations.length, 9);
assert.equal(probe.candidateReviewApplyHowReadOrExecuted, false);
const howIds = ["explore", "propose", "apply", "archive", "revise-explore", "revise-propose", "revise-apply", "review-explore", "review-propose"];
const helper = id => {
  const text = readFileSync("skills/actions/" + id + "/SKILL.md", "utf8");
  const match = /function currentForExecution[\s\S]*?\n}\n/.exec(text);
  assert.ok(match, id);
  return match[0];
};
const referenceHelper = helper("explore");
for (const id of howIds) assert.equal(helper(id), referenceHelper, id);
for (const name of ["probe.mjs", "probe-v2.mjs", "capture.mjs", "capture-v2.mjs", "audit.mjs", "audit-v2.mjs", "audit-capture.mjs", "attempt-03/probe.json"]) ref(path.relative(root, path.join(proof, name)));
const result = {
  checkedAt: new Date().toISOString(),
  verifiedReferences: refs.size, references: [...refs.values()],
  candidateArtifacts: author.artifacts.length, revisionDelta: delta,
  unchangedCandidateArtifacts: author.artifacts.length - delta.length,
  protectedFilesUnchanged: baseline.protectedFiles.length,
  approvedPlanUnchangedSince025: true, sixApprovedPlanBodiesUnchangedSince023: true,
  inheritedRemovalsAbsentAndBackupsValid: prior.exactRemovals.length,
  sourceMatchOnlyChange: true, agentsCurrentStaleCommandCorrected: true,
  sourceTestGate: { limit: 650, files: gate.length, maxLines: Math.max(...gate.map(x => x.lines)) },
  authorCurrentCommandsVerified: commands,
  authorCurrentTestLogSummaries: { windowsDomain: 284, windowsAcceptance: 6, linuxDomain: 284, linuxAcceptance: 6, failures: 0 },
  independentFocusedTests: { files: 7, pass: 23, fail: 0, skipped: 0 },
  independentProbeObservations: probe.observations,
  incomplete019StillPreserved: true,
  nineNonCurrentStageHowHelperBodiesMatch: true,
  auditMethodCorrection: "Original audit incorrectly assumed one exact AGENTS replacement reconstructs the entire unavailable prior text. Corrected audit checks the live full AGENTS/diff and removed stale command, not an unproven one-line byte delta; failure retained. No Author file changed.",
  reviewMethodCorrection: "attempt-01 sandbox EPERM; attempt-02 own probe wrongly supplied top-level actionId; original script/output preserved. probe-v2 asserts rejection of the wrong input and accepts exact Policy fields, all checks pass in attempt-03. No product fix or waiver.",
  limits: "Author full suite output/identity checked, not independently replayed. Candidate review-apply HOW not read as guidance or executed; whole-HOW tests not invoked. No actual D05 candidate lifecycle, Formal Full Test or Git mutation."
};
writeFileSync(path.join(proof, "audit.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ ...result, references: undefined, revisionDelta: delta.map(x => x.path), authorCurrentCommandsVerified: commands.length }, null, 2));
