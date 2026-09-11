import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const repo = process.cwd();
const out = path.join(import.meta.dirname, process.argv[2] ?? "attempt-01");
fs.mkdirSync(out);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const text = file => fs.readFileSync(file, "utf8");
const ref = file => { const bytes = fs.readFileSync(file); return { path: file, bytes: bytes.length, sha256: hash(bytes) }; };
const change = "openspec/changes/connect-openspec-action-workflow";
const runs = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow";
const authorProof = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-023-revise-propose";
const result = json(runs + "/20260908-023-revise-propose/result.json");
const context = json(runs + "/20260908-023-revise-propose/context.json");
const approved = json(runs + "/20260908-022-review-explore/result.json");
assert.equal(result.previousRunId, "20260908-022-review-explore");
assert.equal(result.nextBoundary, "review-propose");
assert.equal(approved.verdict, "approved");
assert.equal(approved.nextBoundary, "revise-propose");
const refs = [];
function verify(expected) {
  const actual = ref(expected.path);
  assert.equal(actual.sha256, expected.sha256, expected.path);
  if (expected.bytes !== undefined) assert.equal(actual.bytes, expected.bytes, expected.path);
  refs.push(actual);
}
[...result.artifacts, ...result.evidence, context.acceptedReview, context.acceptedExplore,
  approved.reviewedResult, approved.reviewedExplore, result.planChecks.strictValidation.stdout].forEach(verify);
const summary = json(authorProof + "/attempt-02/summary.json");
for (const command of summary.results) Object.values(command.streams).forEach(verify);
const baseline = json(authorProof + "/baseline.json");
baseline.protected.forEach(verify);
assert.equal(baseline.protected.length, result.planChecks.protectedFiles);
for (const previous of baseline.plans)
  verify({ ...previous, path: previous.path.replace(change, authorProof + "/prior-plan") });
assert.equal(fs.existsSync(runs + "/20260908-019-apply/result.json"), false);
const count = { plans: result.artifacts.length, modifiedRequirements: 0, addedRequirements: 0, scenarios: 0 };
for (const artifact of result.artifacts) {
  const body = text(artifact.path);
  assert.equal(/\r|\uFFFD|[\t ]+\n/.test(body), false, artifact.path);
  assert.ok(body.endsWith("\n") && !body.endsWith("\n\n"), artifact.path);
  if (!artifact.path.includes("/specs/")) continue;
  const canonical = text(artifact.path.replace(change + "/specs/", "openspec/specs/"));
  let mode;
  const seen = new Set();
  for (const line of body.split("\n")) {
    if (/^## (MODIFIED|ADDED) Requirements$/.test(line)) mode = line;
    if (line.startsWith("#### Scenario: ")) count.scenarios++;
    if (!line.startsWith("### Requirement: ")) continue;
    assert.equal(seen.has(line), false, artifact.path + ": duplicate " + line);
    seen.add(line);
    if (mode === "## MODIFIED Requirements") {
      assert.ok(canonical.split(/\r?\n/).includes(line), artifact.path + ": missing " + line);
      count.modifiedRequirements++;
    } else {
      assert.equal(canonical.split(/\r?\n/).includes(line), false, artifact.path + ": already exists " + line);
      count.addedRequirements++;
    }
  }
}
const tasks = text(change + "/tasks.md");
count.checkedTasks = (tasks.match(/^- \[x\]/gm) ?? []).length;
count.uncheckedTasks = (tasks.match(/^- \[ \]/gm) ?? []).length;
assert.equal(count.checkedTasks, result.taskState.checked);
assert.equal(count.uncheckedTasks, result.taskState.unchecked);
const sourceFiles = ["src/domain/run-result-persistence.ts", "src/domain/action-package-result-admission.ts",
  "src/domain/single-action-execution.ts", "src/domain/policy-and-next-boundary.ts", "src/cli/current-run-chain.ts"];
const inputs = [...result.artifacts.map(item => item.path), ...sourceFiles,
  runs + "/20260908-023-revise-propose/context.json", runs + "/20260908-023-revise-propose/result.json",
  ".agents/skills/review-propose/SKILL.md"].map(ref);
const runtime = "C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
const commands = [
  ["version", process.execPath, [runtime, "--version"]],
  ["strict", process.execPath, [runtime, "validate", "connect-openspec-action-workflow", "--strict"]],
  ["status", process.execPath, [runtime, "status", "--change", "connect-openspec-action-workflow", "--json"]],
  ["diff-check", "git", ["diff", "--check", "HEAD"]],
  ["policy-probe", process.execPath, ["--import", "tsx", path.join(import.meta.dirname, "policy-probe.mjs")]],
];
const executions = commands.map(([name, executable, args]) => {
  const startedAt = new Date().toISOString();
  const value = spawnSync(executable, args, { cwd: repo, maxBuffer: 2 * 1024 * 1024 });
  const streams = {};
  for (const stream of ["stdout", "stderr"]) {
    const file = path.join(out, name + "." + stream + ".txt");
    fs.writeFileSync(file, value[stream] ?? Buffer.alloc(0), { flag: "wx" });
    streams[stream] = ref(path.relative(repo, file).replaceAll("\\", "/"));
  }
  return { name, executable, args, cwd: repo, startedAt, finishedAt: new Date().toISOString(),
    exitCode: value.status, error: value.error?.message ?? null, streams };
});
const changed = inputs.filter(item => ref(item.path).sha256 !== item.sha256);
const output = { kind: "independent-review-propose-check", recordedAt: new Date().toISOString(),
  count, verifiedRefs: refs, sourceInputs: inputs, authorProtectedFiles: baseline.protected.length,
  priorApplyIncomplete: true, executions, changed,
  limit: "Structural/reference and existing-contract checks only; not revised Agent recording implementation acceptance or Full Test." };
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(output, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ count, verifiedRefs: refs.length, changed,
  executions: executions.map(({ name, exitCode, error }) => ({ name, exitCode, error })) }));
process.exitCode = changed.length || executions.some(value => value.exitCode !== 0) ? 1 : 0;
