import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const repo = process.cwd();
const out = path.resolve(process.argv[2]);
assert.ok(out.includes(path.join("proof", "20260909-031-review-explore") + path.sep));
const root = path.join(out, "isolated-project");
await mkdir(root);
const moduleAt = p => import(pathToFileURL(path.join(repo, p)).href);
const candidate = await moduleAt("src/internal/applicable-check-candidate.ts");
const processApi = await moduleAt("src/internal/applicable-check-process.ts");
const full = await moduleAt("src/domain/delivery-full-test-execution.ts");
const observations = [], gitCommands = [];
async function put(relative, bytes) {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}
function git(args, allowNonzero = false) {
  const r = spawnSync("git", ["-c", "core.longpaths=true", ...args], { cwd: root, encoding: null, windowsHide: true });
  assert.equal(r.error, undefined);
  gitCommands.push({ args, exitCode: r.status, stdout: r.stdout.toString(), stderr: r.stderr.toString() });
  if (!allowNonzero) assert.equal(r.status, 0, r.stderr.toString());
  return r;
}
git(["init", "-q"]);
git(["config", "user.name", "Reviewer isolated fixture"]);
git(["config", "user.email", "fixture@example.invalid"]);
await put("src/main.txt", "source\n");
await put(".gitattributes", await readFile(".gitattributes"));
git(["add", "src/main.txt", ".gitattributes"]);
git(["commit", "-qm", "synthetic review fixture"]);
await put("src/optional.txt", "input A\n");
const before = await candidate.deriveApplicableCheckCandidateManifest(root);
assert.ok(before.some(x => x.path === "src/optional.txt"));
const bytesBefore = await readFile(path.join(root, "src/optional.txt"));
await put(".git/info/exclude", "src/optional.txt\n");
const hidden = await candidate.deriveApplicableCheckCandidateManifest(root);
assert.equal(hidden.some(x => x.path === "src/optional.txt"), false);
assert.deepEqual(await readFile(path.join(root, "src/optional.txt")), bytesBefore);
const hiddenBefore = await candidate.deriveApplicableCheckCandidateRef(root);
await put("src/optional.txt", "input B\n");
assert.equal(await candidate.deriveApplicableCheckCandidateRef(root), hiddenBefore);
git(["add", "-f", "src/optional.txt"]);
const tracked = await candidate.deriveApplicableCheckCandidateManifest(root);
assert.equal(tracked.some(x => x.path === "src/optional.txt"), true);
observations.push({ case: "Git visibility", observed: "ignore rule alone drops unchanged product; ignored product byte change is invisible; force-tracking restores inclusion" });
const oldRef = await candidate.deriveApplicableCheckCandidateRef(root);
await put(".flowkit/artifacts/sample/full-test/one/stdout.txt", Buffer.from("raw  \r\n\r\n"));
const withArtifact = await candidate.deriveApplicableCheckCandidateRef(root);
assert.notEqual(oldRef, withArtifact);
await put(".flowkit/runs/sample/001-example/20260909-001-explore/action.md", "# synthetic history\n");
assert.equal(await candidate.deriveApplicableCheckCandidateRef(root), withArtifact);
observations.push({ case: "Process material", observed: "raw artifact changes old candidate; Run descriptor does not" });
await put(".flowkit/artifacts/sample/proof/input.bin", Buffer.from("fixture data  \r\n\r\n"));
await put(".flowkit/artifacts/sample/proof/audit.mjs", "// immutable synthetic method\n\n");
assert.equal(git(["diff", "--check"], true).status, 0);
git(["add", ".flowkit/artifacts"]);
const whitespace = git(["diff", "--cached", "--check"], true);
assert.equal(whitespace.status, 2);
const diagnostic = whitespace.stdout.toString();
assert.ok(diagnostic.includes("input.bin"));
assert.ok(diagnostic.includes("audit.mjs"));
assert.equal(diagnostic.includes("stdout.txt:"), false);
observations.push({ case: "Whitespace scope", observed: "staged necessary input/method blocked while raw stdout exception works", diagnostic });
const outcome = await processApi.executeExactApplicableCheckProcess(root, process.execPath, ["-e", "process.stdout.write('stdout');process.stderr.write('stderr')"]);
assert.equal(outcome.status, "passed");
assert.equal("stdout" in outcome, false);
assert.equal("stderr" in outcome, false);
observations.push({ case: "Process output retention", observed: outcome });
const deliveryId = "synthetic-review-delivery";
const input = {
  deliveryId,
  ownerAuthority: { ref: "owner:" + "c".repeat(64), decision: "authorize-formal-full-test", deliveryId, sourceRef: "fixture:not-real-owner-authority", scope: ["delivery-full-test"] },
  checks: [{ checkId: "fixed", program: process.execPath, args: ["-e", "process.exit(0)"], configRefs: [], toolRefs: ["tool:synthetic-node"], environmentRefs: [] }]
};
const first = await full.invokeDeliveryFullTestOperation(root, input);
const second = await full.invokeDeliveryFullTestOperation(root, input);
assert.equal(first.status, "terminal");
assert.equal(first.verdict, "passed");
assert.equal(second.status, "terminal");
assert.equal(second.verdict, "passed");
assert.equal(first.record.executionRef, second.record.executionRef);
const failed = await full.invokeDeliveryFullTestOperation(root, { ...input, checks: [{ ...input.checks[0], args: ["-e", "process.exit(9)"] }] });
assert.equal(failed.verdict, "failed");
assert.equal(full.isTrustedPassedFullTestOutcome(first, deliveryId), true);
observations.push({ case: "Execution identity/current selection", observed: "two actual same-input calls share executionRef; validator still accepts old object after separately declared failing check", limitation: "pure outcome validation is not current-attempt selection; no actual Final executed or claimed bypass" });
const plain = path.join(out, "plain-non-git-project");
await mkdir(plain);
assert.equal(await candidate.deriveApplicableCheckCandidateRef(plain), null);
const noGit = await full.invokeDeliveryFullTestOperation(plain, input);
assert.equal(noGit.reason, "package-formation-rejected");
observations.push({ case: "Non-Git target", observed: noGit });
async function explicitScope() {
  const files = ["src/main.txt", "src/optional.txt"];
  const h = createHash("sha256");
  for (const file of files) {
    const bytes = await readFile(path.join(root, file));
    h.update(JSON.stringify([file, bytes.length])).update(bytes);
  }
  return h.digest("hex");
}
const scoped = await explicitScope();
await put(".gitignore", "src/\n");
await put(".flowkit/artifacts/sample/full-test/one/extra.stdout.txt", "more observations\r\n");
await put("architecture/view.json", "{}\n");
assert.equal(await explicitScope(), scoped);
await put("src/optional.txt", "input C\n");
assert.notEqual(await explicitScope(), scoped);
observations.push({ case: "Bounded filesystem scope feasibility", observed: "Git ignore/history/presentation do not affect declared regular input digest; product change does", limitation: "not a production config, scanner, sandbox or implementation acceptance" });
await writeFile(path.join(out, "observations.json"), JSON.stringify({ synthetic: true, observations, gitCommands, formalFullTestExecuted: false, repositoryGitMutation: false, fixtureGitMutation: true }, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ synthetic: true, observations }, null, 2));
