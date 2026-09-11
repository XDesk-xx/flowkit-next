import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const repository = process.cwd();
const proof = path.resolve(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260911-059-review-apply");
const scratchParent = path.join(repository, ".tmp");
fs.mkdirSync(scratchParent, { recursive: true });
const scratch = fs.mkdtempSync(path.join(scratchParent, "d05-059-review-git-"));
process.env.TMP = scratch; process.env.TEMP = scratch; process.env.TMPDIR = scratch;
const { runCheckpoint, runPush } = await import(pathToFileURL(path.join(repository, "src/domain/git-workflow-host.ts")));
const { runIntegration } = await import(pathToFileURL(path.join(repository, "src/domain/git-workflow-integration-host.ts")));
const { makeFixture } = await import(pathToFileURL(path.join(repository, "tests/unit/domain/delivery-integration-fixture.ts")));
const commands = [];
const ref = p => { const b = fs.readFileSync(p); return { path: path.relative(repository, p).replaceAll("\\", "/"), bytes: b.length, sha256: createHash("sha256").update(b).digest("hex") }; };
function git(root, ...args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync("git", args, { cwd: root, windowsHide: true, encoding: "buffer" });
  const name = "native-" + String(commands.length + 1).padStart(2, "0");
  const stdoutPath = path.join(proof, name + ".stdout.txt"), stderrPath = path.join(proof, name + ".stderr.txt");
  fs.writeFileSync(stdoutPath, result.stdout ?? Buffer.alloc(0), { flag: "wx" });
  fs.writeFileSync(stderrPath, result.stderr ?? Buffer.alloc(0), { flag: "wx" });
  commands.push({ program: "git", args, cwd: root, startedAt, completedAt: new Date().toISOString(), exitCode: result.status, error: result.error?.message ?? null, stdout: ref(stdoutPath), stderr: ref(stderrPath) });
  assert.equal(result.status, 0, args.join(" ") + ": " + result.stderr);
  return result.stdout.toString("utf8").trim();
}
function fixture(name, content = "base\n") {
  const root = path.join(scratch, name); fs.mkdirSync(root);
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Reviewer Fixture");
  git(root, "config", "user.email", "reviewer@example.invalid");
  fs.writeFileSync(path.join(root, "a.txt"), content);
  git(root, "add", "--", "a.txt"); git(root, "commit", "-m", "fixture base");
  return root;
}
function request(targetRoot, operation) {
  return { targetRoot, node: "delivery-start", deliveryId: "review-fixture", changeId: null, ownerSourceRef: "test:059-synthetic-owner", expectedBranch: "main", operation };
}
const observations = [];
{
  const root = fixture("follow-tags");
  const bare = path.join(scratch, "follow-tags.git"); fs.mkdirSync(bare); git(bare, "init", "--bare");
  git(root, "remote", "add", "origin", bare);
  git(root, "tag", "-a", "not-authorized", "-m", "fixture tag outside requested ref");
  git(root, "config", "push.followTags", "true");
  const commit = git(root, "rev-parse", "HEAD");
  const input = request(root, { kind: "push", localCommit: commit, remote: "origin", targetRef: "refs/heads/main" });
  const beforeRefs = git(bare, "for-each-ref", "--format=%(refname)");
  const outcome = await runPush(input, async source => source === input.ownerSourceRef ? { request: input } : null);
  const afterRefs = git(bare, "for-each-ref", "--format=%(refname)").split("\n");
  observations.push({ case: "push-follow-tags-expands-ref-scope", fixtureRoot: root, authorizedOperation: input.operation, beforeRefs, afterRefs, outcome, unauthorizedTagPublished: afterRefs.includes("refs/tags/not-authorized") });
}
{
  const lines = Array.from({ length: 30 }, (_, i) => "line-" + (i + 1));
  const root = fixture("pending-merge", lines.join("\n") + "\n");
  git(root, "checkout", "-b", "topic");
  const topic = [...lines]; topic[1] = "topic-line";
  fs.writeFileSync(path.join(root, "a.txt"), topic.join("\n") + "\n");
  git(root, "add", "--", "a.txt"); git(root, "commit", "-m", "fixture topic");
  git(root, "checkout", "main");
  const main = [...lines]; main[28] = "main-line";
  fs.writeFileSync(path.join(root, "a.txt"), main.join("\n") + "\n");
  git(root, "add", "--", "a.txt"); git(root, "commit", "-m", "fixture main");
  git(root, "merge", "--no-ff", "--no-commit", "topic");
  const beforeHead = git(root, "rev-parse", "HEAD"), mergeHead = git(root, "rev-parse", "MERGE_HEAD");
  const input = request(root, { kind: "create-new", paths: ["a.txt"], commitMessage: "ordinary checkpoint only", commitShape: null });
  const outcome = await runCheckpoint(input, async source => source === input.ownerSourceRef ? { request: input } : null);
  const afterHead = git(root, "rev-parse", "HEAD"), parents = git(root, "show", "-s", "--format=%P", "HEAD").split(" ");
  observations.push({ case: "ordinary-checkpoint-completes-pending-merge", fixtureRoot: root, authorizedOperation: input.operation, beforeHead, mergeHead, afterHead, parents, mergeHeadStillExists: fs.existsSync(path.join(root, ".git/MERGE_HEAD")), outcome });
}
{
  const f = await makeFixture();
  git(f.root, "add", "."); git(f.root, "commit", "-m", "fixture existing checkpoint");
  const commit = git(f.root, "rev-parse", "HEAD");
  const operation = { kind: "reuse-existing", checkpointCommit: commit };
  const input = { targetRoot: f.root, node: "repository-integration", deliveryId: f.input.deliveryId, changeId: null, ownerSourceRef: f.input.ownerAuthority.sourceRef, expectedBranch: f.input.deliveryBranch, operation };
  const source = f.integrationSource(operation); let reads = 0, accepted = false;
  const outcome = await runIntegration(input, {
    input: { ...f.input, checkpointOperation: operation },
    readOwner: async () => ({ request: input }),
    readIntegrationSource: { readAuthorization: async () => { if (++reads === 3) throw Error("fixture authority no longer available before acceptance"); return source.readAuthorization(f.input.ownerAuthority.ref); }, readAcceptance: source.readAcceptance },
    performAcceptance: async () => { accepted = true; return { status: "repository-acceptance-complete" }; }
  });
  observations.push({ case: "reused-checkpoint-lost-before-acceptance", fixtureRoot: f.root, knownCheckpoint: commit, actualHead: git(f.root, "rev-parse", "HEAD"), sourceReads: reads, acceptanceCalled: accepted, outcome });
}
const output = { kind: "independent-review-apply-adversarial-observations", node: process.version, platform: process.platform, checkedAt: new Date().toISOString(), scratchRoot: scratch, fixtureGitOnly: true, authoritiesAndFinalAreSynthetic: true, noNetwork: true, productionSourceUnmodified: true, observations, commands };
fs.writeFileSync(path.join(proof, "adversarial-observations.json"), JSON.stringify(output, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ observations, nativeCommands: commands.length, evidence: ref(path.join(proof, "adversarial-observations.json")) }, null, 2));
