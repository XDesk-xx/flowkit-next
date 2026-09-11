import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  runCheckpoint,
  runPush,
  type GitHostRequest,
} from "../../../src/domain/git-workflow-host.js";
import { runIntegration } from "../../../src/domain/git-workflow-integration-host.js";
import { readIndexFingerprint } from "../../../src/internal/git-checkpoint-scope.js";
import { makeFixture, git } from "./delivery-integration-fixture.js";

function request(
  targetRoot: string,
  operation: GitHostRequest["operation"],
): GitHostRequest {
  return {
    targetRoot,
    operation,
    node: "delivery-start",
    deliveryId: "test-delivery",
    changeId: null,
    ownerSourceRef: "test:synthetic-060-owner",
    expectedBranch: "main",
  };
}

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-review-regression-"));
  await git(root, "init", "-b", "main");
  await git(root, "config", "user.name", "Test");
  await git(root, "config", "user.email", "test@example.invalid");
  await writeFile(path.join(root, "a.txt"), "base\n");
  await git(root, "add", "a.txt");
  await git(root, "commit", "-m", "base");
  return root;
}

test("RA038-001: exact branch push does not inherit followTags or mutate configuration", async () => {
  const root = await fixture();
  try {
    const remote = path.join(root, "remote.git");
    await mkdir(remote);
    await git(remote, "init", "--bare");
    await git(root, "remote", "add", "origin", remote);
    await git(root, "tag", "-a", "not-authorized", "-m", "not authorized");
    await git(root, "config", "push.followTags", "true");
    const config = await readFile(path.join(root, ".git/config"));
    const commit = await git(root, "rev-parse", "HEAD");
    const input = request(root, {
      kind: "push",
      localCommit: commit,
      remote: "origin",
      targetRef: "refs/heads/main",
    });
    const outcome = await runPush(input, async () => ({ request: input }));
    assert.equal(outcome.status, "completed", JSON.stringify(outcome));
    assert.equal(
      await git(remote, "for-each-ref", "--format=%(refname)"),
      "refs/heads/main",
    );
    assert.deepEqual(await readFile(path.join(root, ".git/config")), config);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("RA038-002: ordinary null-shape checkpoint leaves a pending merge untouched", async () => {
  const root = await fixture();
  try {
    await git(root, "checkout", "-b", "topic");
    await writeFile(path.join(root, "topic.txt"), "topic\n");
    await git(root, "add", "topic.txt");
    await git(root, "commit", "-m", "topic");
    await git(root, "checkout", "main");
    await writeFile(path.join(root, "a.txt"), "main\n");
    await git(root, "commit", "-am", "main");
    await git(root, "merge", "--no-ff", "--no-commit", "topic");
    const head = await git(root, "rev-parse", "HEAD");
    const index = await readIndexFingerprint(root);
    const mergeHead = await readFile(path.join(root, ".git/MERGE_HEAD"));
    const input = request(root, {
      kind: "create-new",
      paths: ["a.txt", "topic.txt"],
      commitMessage: "ordinary only",
      commitShape: null,
    });
    const outcome = await runCheckpoint(input, async () => ({
      request: input,
    }));
    assert.equal(outcome.status, "incomplete", JSON.stringify(outcome));
    assert.equal(outcome.phase, "preflight");
    assert.equal(outcome.effect, "none");
    assert.equal(await git(root, "rev-parse", "HEAD"), head);
    assert.equal(await readIndexFingerprint(root), index);
    assert.deepEqual(
      await readFile(path.join(root, ".git/MERGE_HEAD")),
      mergeHead,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("RA038-003: verified reuse survives pre-acceptance source loss with no new mutation", async () => {
  const f = await makeFixture();
  try {
    await git(f.root, "add", ".");
    await git(f.root, "commit", "-m", "existing checkpoint");
    const commit = await git(f.root, "rev-parse", "HEAD");
    const operation = {
      kind: "reuse-existing" as const,
      checkpointCommit: commit,
    };
    const input: GitHostRequest = {
      ...request(f.root, operation),
      node: "repository-integration",
      deliveryId: f.input.deliveryId,
      expectedBranch: f.input.deliveryBranch,
      ownerSourceRef: f.input.ownerAuthority.sourceRef,
    };
    const source = f.integrationSource(operation);
    let reads = 0;
    let accepted = false;
    const outcome = await runIntegration(input, {
      input: { ...f.input, checkpointOperation: operation },
      readOwner: async () => ({ request: input }),
      readIntegrationSource: {
        readAuthorization: async () => {
          if (++reads === 3) throw Error("fixture source lost");
          return source.readAuthorization(f.input.ownerAuthority.ref);
        },
        readAcceptance: source.readAcceptance,
      },
      performAcceptance: () => {
        accepted = true;
        return { status: "repository-acceptance-complete" };
      },
    });
    assert.equal(outcome.status, "incomplete");
    assert.equal(accepted, false);
    assert.equal(outcome.observed.checkpointCommit, commit);
    assert.equal(outcome.phase, "acceptance");
    assert.equal(outcome.effect, "none");
    assert.equal(await git(f.root, "rev-parse", "HEAD"), commit);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("pending continuation states are preserved, reuse stays read-only, and stage-time arrival stops commit", async () => {
  const root = await fixture();
  try {
    const commit = await git(root, "rev-parse", "HEAD");
    const input = request(root, {
      kind: "create-new",
      paths: ["a.txt"],
      commitMessage: "ordinary",
      commitShape: null,
    });
    const index = await readIndexFingerprint(root);
    for (const name of [
      "CHERRY_PICK_HEAD",
      "REVERT_HEAD",
      "rebase-merge",
      "rebase-apply",
      "sequencer",
    ]) {
      const marker = path.join(root, ".git", name);
      if (name.endsWith("HEAD")) await writeFile(marker, commit + "\n");
      else await mkdir(marker);
      const outcome = await runCheckpoint(input, async () => ({
        request: input,
      }));
      assert.equal(outcome.effect, "none");
      assert.equal(outcome.status, "incomplete");
      assert.match(outcome.reason!, new RegExp(name));
      assert.equal(await readIndexFingerprint(root), index);
      const reuse = {
        ...input,
        operation: {
          kind: "reuse-existing" as const,
          checkpointCommit: commit,
        },
      };
      assert.equal(
        (await runCheckpoint(reuse, async () => ({ request: reuse }))).status,
        "completed",
      );
      await rm(marker, { recursive: true }); // Only this synthetic fixture marker.
    }
    await writeFile(path.join(root, "a.txt"), "changed\n");
    let reads = 0;
    const drift = await runCheckpoint(input, async () => {
      if (++reads === 3)
        await writeFile(path.join(root, ".git/MERGE_HEAD"), commit + "\n");
      return { request: input };
    });
    assert.equal(drift.status, "incomplete");
    assert.equal(drift.phase, "stage");
    assert.equal(drift.effect, "confirmed");
    assert.equal(await git(root, "rev-parse", "HEAD"), commit);
    assert.equal(
      await readFile(path.join(root, ".git/MERGE_HEAD"), "utf8"),
      commit + "\n",
    );
    assert.notEqual(await readIndexFingerprint(root), index);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
