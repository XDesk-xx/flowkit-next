import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const repositoryRoot = process.cwd();
const work = path.resolve(".tmp/d05-055-review-git");
await fs.mkdir(work, { recursive: true });
process.env.TEMP = work; process.env.TMP = work; process.env.TMPDIR = work;
const mod = relative => import(pathToFileURL(path.join(repositoryRoot, relative)).href);
const { makeFixture, git } = await mod("tests/unit/domain/delivery-integration-fixture.ts");
const { fixtureInstallation } = await mod("tests/unit/domain/manager-installation-fixture.ts");
const { invokeDeliveryRepositoryIntegrationOperation: invoke } = await mod("src/domain/delivery-repository-integration-execution.ts");
const observations = [];
for (const mode of ["clean", "unrelated-untracked", "reuse-dirty", "two-commits", "out-of-scope-staged", "commit-response-lost", "provider-pending", "no-authority"]) {
  const f = await makeFixture();
  assert(path.resolve(f.root).startsWith(work + path.sep));
  let input = f.input, source = f.integrationSource();
  if (mode === "reuse-dirty") {
    await git(f.root, "add", "."); await git(f.root, "commit", "-m", "fixture existing checkpoint");
    const op = { kind: "reuse-existing", checkpointCommit: await git(f.root, "rev-parse", "HEAD") };
    input = { ...input, checkpointOperation: op }; source = f.integrationSource(op);
  }
  if (mode === "no-authority") input = { ...input, ownerAuthority: null };
  const note = path.join(f.root, "unrelated.txt");
  if (["unrelated-untracked", "reuse-dirty", "out-of-scope-staged"].includes(mode)) await fs.writeFile(note, "unrelated owner work\n");
  if (mode === "out-of-scope-staged") await git(f.root, "add", "unrelated.txt");
  const before = await git(f.root, "rev-parse", "HEAD");
  const manifestBefore = await fs.readFile(f.manifestPath);
  let commits = 0, providers = 0;
  const outcome = await invoke(f.root, input, async () => {
    commits++;
    // Explicit intended paths; unrelated pre-staged bytes reveal the missing host range check.
    await git(f.root, "add", "--", "product.txt", ".flowkit/project.json", "openspec", "skills");
    await git(f.root, "commit", "-m", "fixture authorized content");
    if (mode === "two-commits") {
      await fs.writeFile(path.join(f.root, "product.txt"), "second authorized step\n");
      await git(f.root, "add", "--", "product.txt");
      await git(f.root, "commit", "-m", "fixture second content commit");
    }
    if (mode === "commit-response-lost") throw Error("synthetic response loss after actual fixture commit");
    return { status: "committed" };
  }, async ({ finalCommit }) => {
    providers++;
    if (mode === "provider-pending") return { status: "pending", auditRef: "fixture:manual-handoff" };
    await git(f.root, "update-ref", "refs/heads/main", finalCommit);
    return { status: "repository-acceptance-complete" };
  }, source, fixtureInstallation(f.root));
  const after = await git(f.root, "rev-parse", "HEAD");
  const changed = await git(f.root, "diff", "--name-only", before, after);
  const status = await git(f.root, "status", "--porcelain=v1", "--untracked-files=all");
  assert((await fs.readFile(f.manifestPath)).equals(manifestBefore), "Git outcome must not rewrite Final");
  if (["clean", "out-of-scope-staged"].includes(mode)) assert.equal(outcome.status, "terminal");
  else {
    assert.equal(outcome.status, "failed");
    assert.equal(outcome.reason, mode === "no-authority" ? "package-formation-rejected" : mode === "provider-pending" ? "repository-acceptance-rejected" : "final-commit-rejected");
  }
  if (mode === "out-of-scope-staged") assert(changed.split("\n").includes("unrelated.txt"));
  if (["unrelated-untracked", "reuse-dirty"].includes(mode)) assert(status.includes("unrelated.txt"));
  if (["reuse-dirty", "no-authority"].includes(mode)) { assert.equal(commits, 0); assert.equal(before, after); }
  if (mode === "commit-response-lost") { assert.notEqual(before, after); assert.equal(commits, 1); assert.equal(providers, 0); assert.equal(outcome.gitEffects.observedHead, after); }
  observations.push({ mode, fixtureOnly: true, expectedCurrentBehaviorConfirmed: true, commits, providers, before, after, changed: changed.split("\n").filter(Boolean), remainingStatus: status, outcome });
  console.log(mode + ": " + outcome.status + ("reason" in outcome ? " / " + outcome.reason : ""));
}
const result = { sourceHead: "a0edb690d7208a3b81855e30a31dbc175f060a93", platform: process.platform, node: process.version, fixtureOnly: true, syntheticFinalAndAuthority: true, productionImplementationAcceptance: false, formalD05FullTest: false, observations };
await fs.writeFile(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260909-055-review-explore/observations.json", JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
