import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const proofRoot = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ? path.join(proofRoot, process.argv[2]) : proofRoot;
if (out !== proofRoot) fs.mkdirSync(out);
const change = "decouple-full-test-from-repository-tracking";
const base = "openspec/changes/" + change;
const group = ".flowkit/runs/20260908-05-lightweight-workflow-management/004-" + change;
const ref = (p) => {
  const bytes = fs.readFileSync(p);
  return { path: path.relative(root, p).replaceAll("\\", "/"), bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
};
const save = (name, value) => fs.writeFileSync(path.join(out, name),
  JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
const commands = [];
function run(id, program, args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(program, args, { cwd: root, encoding: null, maxBuffer: 16 * 1024 * 1024 });
  for (const stream of ["stdout", "stderr"]) {
    fs.writeFileSync(path.join(out, id + "." + stream + ".txt"), result[stream] ?? Buffer.alloc(0), { flag: "wx" });
  }
  const record = { id, program, args, cwd: root, startedAt, finishedAt: new Date().toISOString(),
    exitCode: result.status, signal: result.signal, error: result.error?.message ?? null,
    stdout: ref(path.join(out, id + ".stdout.txt")), stderr: ref(path.join(out, id + ".stderr.txt")) };
  save(id + ".command.json", record);
  commands.push(record);
  return result;
}
const cli = "C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
run("strict", process.execPath, [cli, "validate", change, "--strict"]);
const status = run("status", process.execPath, [cli, "status", "--change", change, "--json"]);
run("diff-check", "git", ["diff", "--check"]);
const caps = fs.readdirSync(base + "/specs").sort();
const scenarioPreservation = [];
for (const cap of caps) {
  const delta = fs.readFileSync(base + "/specs/" + cap + "/spec.md", "utf8").replaceAll("\r\n", "\n");
  const main = fs.readFileSync("openspec/specs/" + cap + "/spec.md", "utf8").replaceAll("\r\n", "\n");
  const modified = delta.split("## MODIFIED Requirements\n")[1]?.split(/^## /m)[0] ?? "";
  const blocks = (s) => [...s.matchAll(/^### Requirement: (.+)\n([\s\S]*?)(?=^### Requirement: |^## |$(?![\s\S]))/gm)];
  const original = new Map(blocks(main).map(m => [m[1], m[2]]));
  for (const m of blocks(modified)) {
    const old = original.get(m[1]);
    if (old === undefined) throw new Error("Missing canonical requirement: " + m[1]);
    const names = [...old.matchAll(/^#### Scenario: (.+)$/gm)].map(s => s[1]);
    const missing = names.filter(s => !m[2].includes("#### Scenario: " + s + "\n"));
    scenarioPreservation.push({ cap, requirement: m[1], preserved: names.length, missing });
    if (missing.length) throw new Error("Lost scenarios: " + missing.join(", "));
  }
}
const review = JSON.parse(fs.readFileSync(group + "/20260909-031-review-explore/result.json", "utf8"));
const unchangedInputs = [review.reviewedResult, review.reviewedExplore, review.coordinationAtReview].map(expected => {
  const actual = ref(expected.path);
  if (actual.sha256 !== expected.sha256 || actual.bytes !== expected.bytes) throw new Error("Reviewed input drift: " + expected.path);
  return actual;
});
const tasks = fs.readFileSync(base + "/tasks.md", "utf8");
const taskCount = [...tasks.matchAll(/^- \[ \] \d+\.\d+ /gm)].length;
if (taskCount !== 20 || /^- \[x\]/mi.test(tasks)) throw new Error("Unexpected tasks");
const parsedStatus = status.stdout?.length ? JSON.parse(status.stdout.toString("utf8")) : {};
const planningArtifacts = ["proposal.md", "design.md", "tasks.md", ...caps.map(c => "specs/" + c + "/spec.md")].map(p => ref(base + "/" + p));
const summary = { kind: "author-plan-verification", implementationAcceptance: false,
  commands, planningComplete: parsedStatus.isPlanningComplete === true,
  scenarioPreservation, unchangedInputs, taskCount, planningArtifacts,
  passed: commands.every(c => c.exitCode === 0 && c.error === null) && parsedStatus.isPlanningComplete === true };
save("verification.json", summary);
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
process.exitCode = summary.passed ? 0 : 1;
