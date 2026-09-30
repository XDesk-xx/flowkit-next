import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { executeOrdinaryGit } from "../../../src/cli/support-git.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
import { writeDurableRun } from "../../../src/domain/run-result-persistence.js";
import { contextFixture } from "./action-context-fixture.js";

const run = promisify(execFile);
async function git(root: string, ...args: string[]) {
  return (
    await run("git", args, { cwd: root, windowsHide: true })
  ).stdout.trim();
}

test("fixed checkpoint requires the matching Owner operation and commits only scoped paths", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flowkit-support-git-"));
  const remote = await fs.mkdtemp(
    path.join(os.tmpdir(), "flowkit-support-remote-"),
  );
  try {
    await git(remote, "init", "--bare");
    await git(root, "init", "-b", "delivery/test-git");
    await git(root, "config", "user.name", "Flowkit Test");
    await git(root, "config", "user.email", "flowkit@example.invalid");
    await fs.writeFile(path.join(root, "base.txt"), "base\n");
    await git(root, "add", "base.txt");
    await git(root, "commit", "-m", "base");
    const before = await git(root, "rev-parse", "HEAD");
    const deliveryId = "test-git-delivery";
    const relative = `openspec/delivery-groups/${deliveryId}.yaml`;
    await fs.mkdir(path.join(root, "openspec/delivery-groups"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(root, relative),
      `id: ${deliveryId}\nchanges:\n  - id: first-change\n    state: planned\n    dependsOn: []\n`,
    );
    const ownerAuthority = {
      ref: `owner:${"a".repeat(64)}`,
      decision: "authorize-checkpoint",
      deliveryId,
      sourceRef: "test:owner-git",
      scope: ["checkpoint"],
    };
    const gitRequest = {
      targetRoot: root,
      node: "delivery-start",
      deliveryId,
      changeId: null,
      ownerSourceRef: ownerAuthority.sourceRef,
      expectedBranch: "delivery/test-git",
      operation: {
        kind: "create-new",
        paths: [relative],
        commitMessage: `delivery(${deliveryId}): start scoped content`,
        commitShape: { parents: [before], count: 1 },
      },
    };
    const request = {
      repositoryRoot: root,
      flowkitHome: root,
      deliveryId,
      ownerAuthority,
      gitRequest,
    };
    const denied = await executeOrdinaryGit(
      "git checkpoint",
      { ...request, ownerAuthority: { ...ownerAuthority, scope: ["wrong"] } },
      loadManagerInstallation(),
    );
    assert.equal(denied.status, "incomplete");
    assert.equal(await git(root, "rev-parse", "HEAD"), before);
    const outcome = await executeOrdinaryGit(
      "git checkpoint",
      request,
      loadManagerInstallation(),
    );
    assert.equal(outcome.status, "completed", JSON.stringify(outcome));
    assert.equal(
      await git(root, "show", "--pretty=format:", "--name-only", "HEAD"),
      relative,
    );
    const commit = await git(root, "rev-parse", "HEAD");
    await git(root, "remote", "add", "origin", remote);
    const pushAuthority = {
      ...ownerAuthority,
      ref: `owner:${"b".repeat(64)}`,
      decision: "authorize-push",
      sourceRef: "test:owner-push",
      scope: ["push"],
    };
    const push = await executeOrdinaryGit(
      "git push",
      {
        ...request,
        ownerAuthority: pushAuthority,
        gitRequest: {
          ...gitRequest,
          ownerSourceRef: pushAuthority.sourceRef,
          operation: {
            kind: "push",
            localCommit: commit,
            remote: "origin",
            targetRef: "refs/heads/delivery/test-git",
          },
        },
      },
      loadManagerInstallation(),
    );
    assert.equal(push.status, "completed", JSON.stringify(push));
    assert.equal(
      await git(remote, "rev-parse", "refs/heads/delivery/test-git"),
      commit,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await fs.rm(remote, { recursive: true, force: true });
  }
});

test("Change push accepts its own Owner fact and ready checkpoint policy", async () => {
  const fixture = await contextFixture();
  const root = fixture.repositoryRoot;
  const remote = await fs.mkdtemp(
    path.join(os.tmpdir(), "flowkit-change-push-"),
  );
  try {
    await fixture.manifest("delivery-one", "change-one", "completed");
    await fixture.observe([]);
    const actions = [
      "explore",
      "review-explore",
      "propose",
      "review-propose",
      "apply",
      "review-apply",
      "archive",
    ] as const;
    let previousRunId: string | null = null;
    for (const [index, actionId] of actions.entries()) {
      const occurrence = { date: "20261001", sequence: index + 1, actionId };
      const runId = `20261001-${String(index + 1).padStart(3, "0")}-${actionId}`;
      const actionIdentity = {
        deliveryId: "delivery-one",
        changeId: "change-one",
        actionId,
      };
      const reviewer = actionId.startsWith("review-");
      await writeDurableRun(
        {
          repositoryRoot: root,
          deliveryId: "delivery-one",
          changeId: "change-one",
          changeStartSequence: 1,
          occurrence,
        },
        {
          actionMarkdown: "# synthetic push fixture\n",
          context: {
            runId,
            occurrence,
            actionIdentity,
            role: reviewer ? "reviewer" : "author",
            lifecycleState: "terminal",
            ownerAuthority: null,
            previousRunId,
          },
          result: {
            runId,
            actionIdentity,
            authorConclusion: reviewer ? null : "PASS",
            reviewerVerdict: reviewer ? "approved" : null,
            verificationVerdict: null,
            nextBoundary: null,
            facts: {},
          },
        },
      );
      previousRunId = runId;
    }
    await git(root, "init", "-b", "delivery/test-change");
    await git(root, "config", "user.name", "Flowkit Test");
    await git(root, "config", "user.email", "flowkit@example.invalid");
    await fs.writeFile(path.join(root, "tracked.txt"), "tracked\n");
    await git(root, "add", "tracked.txt");
    await git(root, "commit", "-m", "fixture");
    const commit = await git(root, "rev-parse", "HEAD");
    await git(remote, "init", "--bare");
    await git(root, "remote", "add", "origin", remote);
    const ownerAuthority = {
      ref: `owner:${"e".repeat(64)}`,
      decision: "authorize-push",
      deliveryId: "delivery-one",
      changeId: "change-one",
      sourceRef: "test:change-push",
      scope: ["push"],
    };
    const gitRequest = {
      targetRoot: root,
      node: "change-checkpoint",
      deliveryId: "delivery-one",
      changeId: "change-one",
      ownerSourceRef: ownerAuthority.sourceRef,
      expectedBranch: "delivery/test-change",
      operation: {
        kind: "push",
        localCommit: commit,
        remote: "origin",
        targetRef: "refs/heads/delivery/test-change",
      },
    };
    const request = {
      repositoryRoot: root,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
      ownerAuthority,
      gitRequest,
    };
    for (const rejectedAuthority of [
      { ...ownerAuthority, scope: ["checkpoint"] },
      { ...ownerAuthority, sourceRef: "test:other-source" },
    ]) {
      const denied = await executeOrdinaryGit(
        "git push",
        { ...request, ownerAuthority: rejectedAuthority },
        fixture.installation,
      );
      assert.equal(denied.status, "incomplete");
      assert.equal(
        await git(
          remote,
          "rev-parse",
          "--verify",
          "refs/heads/delivery/test-change",
        ).catch(() => "missing"),
        "missing",
      );
    }
    const pushed = await executeOrdinaryGit(
      "git push",
      request,
      fixture.installation,
    );
    assert.equal(pushed.status, "completed", JSON.stringify(pushed));
    assert.equal(
      await git(remote, "rev-parse", "refs/heads/delivery/test-change"),
      commit,
    );
  } finally {
    await fixture.cleanup();
    await fs.rm(remote, { recursive: true, force: true });
  }
});
