import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const repo = process.cwd();
const proof = path.relative(repo, import.meta.dirname).replaceAll("\\", "/");
const out = path.join(import.meta.dirname, process.argv[2] ?? "attempt-01");
fs.mkdirSync(out);
const sha = b => createHash("sha256").update(b).digest("hex");
const json = p => JSON.parse(fs.readFileSync(p, "utf8"));
const ref = p => { const b = fs.readFileSync(p); return { path: p, bytes: b.length, sha256: sha(b) }; };
const runRoot = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow";
const priorProof = proof.replace("022-review-explore", "021-revise-explore");
const sourceResult = json(runRoot + "/20260908-021-revise-explore/result.json");
const verified = [];
function verify(item) {
  const actual = ref(item.path);
  assert.equal(actual.sha256, item.sha256, item.path);
  if (item.bytes !== undefined) assert.equal(actual.bytes, item.bytes, item.path);
  verified.push(actual);
}
sourceResult.evidence.forEach(verify);
const previous = json(runRoot + "/20260908-020-revise-explore/result.json");
// Prior mutable Explore is superseded by 021, not a currently-consumed source.
previous.evidence.filter(item => item.path !== "openspec/changes/connect-openspec-action-workflow/explore.md").forEach(verify);
for (const attempt of ["attempt-01", "attempt-02"]) {
  const summary = json(priorProof + "/" + attempt + "/summary.json");
  for (const command of summary.results)
    for (const stream of Object.values(command.streams)) verify(stream);
}
const inspected = json(priorProof + "/attempt-02/source-inspection.json");
for (const source of inspected) {
  verify(source);
  const current = fs.readFileSync(source.path, "utf8").split(/\r?\n/).map((line, i) => (i + 1) + ": " + line).join("\n");
  assert.equal(current, source.numberedSource, source.path);
}
const summary021 = json(priorProof + "/attempt-02/summary.json");
const drift = summary021.inputs.filter(item => ref(item.path).sha256 !== item.sha256);
assert.deepEqual(drift.map(item => item.path), ["openspec/changes/connect-openspec-action-workflow/explore.md"]);
assert.deepEqual(fs.readdirSync(runRoot + "/20260908-019-apply").sort(), ["action.md", "context.json"]);
const inputs = [
  runRoot + "/20260908-021-revise-explore/action.md",
  runRoot + "/20260908-021-revise-explore/context.json",
  runRoot + "/20260908-021-revise-explore/result.json",
  runRoot + "/20260908-020-revise-explore/context.json",
  runRoot + "/20260908-020-revise-explore/result.json",
  ".agents/skills/review-explore/SKILL.md",
  "src/domain/action-package-result-admission.ts",
  "src/domain/policy-and-next-boundary.ts",
  "src/cli/action-context.ts",
  ...inspected.map(item => item.path),
].map(ref);
const runtime = "C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
const commands = [
  ["version", process.execPath, [runtime, "--version"]],
  ["status", process.execPath, [runtime, "status", "--change", "connect-openspec-action-workflow", "--json"]],
  ["kernel-diff", "git", ["diff", "HEAD", "--", "src/domain/run-result-persistence.ts", "src/domain/single-action-execution.ts", "src/domain/policy-and-next-boundary.ts"]],
  ["diff-check", "git", ["diff", "--check", "HEAD"]],
  ["bounded-probe", process.execPath, ["--import", "tsx", path.join(import.meta.dirname, "probe.mjs"), out]],
];
const results = commands.map(([name, executable, args]) => {
  const startedAt = new Date().toISOString();
  const r = spawnSync(executable, args, { cwd: repo, maxBuffer: 4 * 1024 * 1024 });
  const streams = {};
  for (const stream of ["stdout", "stderr"]) {
    const file = path.join(out, name + "." + stream + ".txt");
    fs.writeFileSync(file, r[stream] ?? Buffer.alloc(0), { flag: "wx" });
    streams[stream] = ref(path.relative(repo, file).replaceAll("\\", "/"));
  }
  return { name, executable, args, cwd: repo, startedAt, finishedAt: new Date().toISOString(),
    exitCode: r.status, error: r.error?.message ?? null, streams };
});
const changed = inputs.filter(item => ref(item.path).sha256 !== item.sha256);
const summary = { kind: "independent-review-explore-proof", recordedAt: new Date().toISOString(),
  verifiedRefs: verified, sourceInputs: inputs, authorProtectedInputs: summary021.inputs.length,
  authorizedExploreChangeOnly: true, priorApplyStillIncomplete: true, results, changed,
  limit: "Bounded source/structural evidence only, not actual D05 candidate execution, new implementation acceptance or Full Test." };
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ verifiedRefs: verified.length, changed, results: results.map(({ name, exitCode, error }) => ({ name, exitCode, error })) }));
process.exitCode = changed.length || results.some(r => r.exitCode !== 0) ? 1 : 0;
