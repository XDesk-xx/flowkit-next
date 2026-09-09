import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
const root = process.cwd(), own = path.dirname(fileURLToPath(import.meta.url));
const base = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/decouple-full-test-from-repository-tracking/proof/";
const runBase = ".flowkit/runs/20260908-05-lightweight-workflow-management/004-decouple-full-test-from-repository-tracking/";
const manifest = "openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml";
const json = p => JSON.parse(fs.readFileSync(p, "utf8"));
const refs = new Map();
function ref(p) {
  const full = path.resolve(root, p);
  assert.ok(full.startsWith(root + path.sep), p);
  assert.ok(fs.lstatSync(full).isFile(), p);
  assert.equal(fs.realpathSync(full), full, p);
  const b = fs.readFileSync(full);
  const r = { path: p.replaceAll("\\", "/"), bytes: b.length, sha256: createHash("sha256").update(b).digest("hex") };
  refs.set(r.path, r); return r;
}
function walk(v) {
  if (!v || typeof v !== "object") return;
  if (v.path && v.sha256) {
    const got = ref(v.path);
    assert.equal(got.sha256, v.sha256, v.path);
    if (v.bytes !== undefined) assert.equal(got.bytes, v.bytes, v.path);
  }
  for (const child of Object.values(v)) if (child && typeof child === "object") walk(child);
}
const authorPath = runBase + "20260909-030-explore/result.json";
const author = json(authorPath);
walk(author); ref(authorPath);
assert.equal(author.verdict, "PASS");
assert.equal(author.nextBoundary, "review-explore");
assert.equal(author.previousRunId, null);
assert.equal(author.executionMode, "independent-bootstrap");
assert.equal(author.canonicalFlowkitRuntimeRun, false);
assert.equal(author.projectOrdinal, 36);
const context = json(runBase + "20260909-030-explore/context.json");
assert.equal(context.ownerSourceRef, author.ownerActivation.sourceRef);
assert.equal(context.runId, author.runId);
assert.deepEqual(fs.readdirSync(runBase + author.runId).sort(), ["action.md", "context.json", "result.json"]);
assert.deepEqual(fs.readdirSync("openspec/changes/decouple-full-test-from-repository-tracking").sort(), [".openspec.yaml", "explore.md"]);
assert.equal(fs.existsSync(".flowkit/runs/20260908-05-lightweight-workflow-management/decouple-full-test-from-repository-tracking"), false);
const old = parse(execFileSync("git", ["show", "HEAD:" + manifest], { encoding: "utf8" }));
const current = parse(fs.readFileSync(manifest, "utf8"));
const selected = current.changes.find(c => c.id === author.changeId);
assert.equal(selected.state, "active"); assert.equal(selected.projectOrdinal, 36);
for (const id of selected.dependsOn) assert.equal(current.changes.find(c => c.id === id).state, "completed");
const decisions = current.ownerDecisions.filter(d => d.changeId === author.changeId && d.decision === "activate-change");
assert.deepEqual(decisions, [author.ownerActivation]);
selected.state = "planned"; delete selected.projectOrdinal;
current.ownerDecisions = current.ownerDecisions.filter(d => d !== decisions[0]);
assert.deepEqual(current, old);
assert.deepEqual(execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }).trim().split("\n"), [manifest]);
const ownRelative = path.relative(root, own).replaceAll("\\", "/");
const allowed = [ownRelative + "/", base + "20260909-030-explore/", runBase, "openspec/changes/decouple-full-test-from-repository-tracking/"];
const untracked = execFileSync("git", ["-c", "core.longpaths=true", "ls-files", "--others", "--exclude-standard", "-z"], { encoding: "utf8", maxBuffer: 20000000 }).split("\0").filter(Boolean);
assert.ok(untracked.every(p => allowed.some(prefix => p.startsWith(prefix))));
const commandRecords = [];
for (const label of ["probe", "scope-probe", "readback"]) {
  const p = base + "20260909-030-explore/" + label + "/command.json";
  const cmd = json(p); ref(p); walk(cmd);
  assert.equal(cmd.exitCode, 0); assert.equal(cmd.error, null);
  assert.ok(Date.parse(cmd.startedAt) <= Date.parse(cmd.finishedAt));
  commandRecords.push({ path: p, exitCode: cmd.exitCode, startedAt: cmd.startedAt, finishedAt: cmd.finishedAt });
}
const oldObservation = json(base + "20260909-030-explore/probe/stdout.txt");
assert.equal(oldObservation.gitVisibility.sameProductBytesDifferentSelection, true);
assert.notEqual(oldObservation.artifactDrift.beforeArtifact, oldObservation.artifactDrift.afterArtifact);
assert.equal(oldObservation.whitespace.stagedExit, 2);
assert.equal(oldObservation.attempts.passed.verdict, "passed");
assert.equal(oldObservation.attempts.failed.verdict, "failed");
assert.equal(oldObservation.attempts.passed.record.executionRef, oldObservation.attempts.failed.record.executionRef);
assert.equal(oldObservation.attempts.reused.record.checks[0].status, "reused-passed");
const archivePath = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow/20260908-029-archive/result.json";
const archive = json(archivePath); ref(archivePath);
assert.equal(archive.verdict, "PASS");
assert.equal(author.previousDeliveryRun, "connect-openspec-action-workflow/" + archive.runId);
walk(archive.reviewedResult); walk(archive.specSync); walk(archive.pathChanges);
const final = json(path.join(own, "attempt-02/summary.json"));
assert.ok(final.commands.every(c => c.exitCode === 0));
for (const attempt of ["attempt-01", "attempt-02"]) { const p = path.join(own, attempt, "summary.json"); ref(path.relative(root, p)); walk(json(p)); }
const observations = json(path.join(own, "attempt-02/observations.json"));
assert.equal(observations.observations.length, 7);
assert.equal(observations.repositoryGitMutation, false);
assert.equal(observations.formalFullTestExecuted, false);
const status = json(path.join(own, "attempt-02/openspec-status.stdout.txt"));
assert.equal(status.changeName, author.changeId);
assert.equal(path.resolve(status.planningHome.root), root);
assert.equal(status.isPlanningComplete, false);
assert.equal(fs.readFileSync(path.join(own, "attempt-02/openspec-version.stdout.txt"), "utf8").trim(), "1.10.0");
for (const name of ["audit.mjs", "probe.mjs", "capture.mjs", "attempt-02/observations.json"]) ref(path.relative(root, path.join(own, name)));
for (const p of ["flowkit-next-delivery-change-plan.md", "flowkit-next-d05-decoupling-analysis.md", ".agents/skills/review-explore/SKILL.md", ".gitattributes", "config/tools/toolchain.lock.json"]) ref(p);
const result = { checkedAt: new Date().toISOString(), verifiedReferences: refs.size, references: [...refs.values()], authorCommands: commandRecords, manifestOnlyAuthorizedActivationAndOrdinal: true, sourceTestsSkillsUnchanged: true, noProposalYet: true, currentGroupOwnerCorrectionPreserved: true, prerequisiteArchiveAndSyncedSpecsVerified: true, independentObservations: observations.observations, exactOpenSpecVersion: "1.10.0", exactOpenSpecTargetReadback: true, gitDiffCheck: true, scopeDrift: "NONE", limits: "Windows synthetic Explore proof and source inspection only. No Linux/implementation acceptance, actual Delivery Full Test/Final or candidate review-explore HOW." };
fs.writeFileSync(path.join(own, "audit.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ ...result, references: undefined }, null, 2));
