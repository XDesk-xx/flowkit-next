import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  runCheckpoint,
  runPush,
  type GitHostRequest,
} from "../../../src/domain/git-workflow-host.js";
import {
  gitBytes,
  readGitPosition,
  readPendingPaths,
} from "../../../src/internal/git-checkpoint-scope.js";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-effects-"));
  await gitBytes(root, ["init", "-b", "main"]);
  await gitBytes(root, ["config", "user.name", "Test"]);
  await gitBytes(root, ["config", "user.email", "test@example.invalid"]);
  await writeFile(path.join(root, "a.txt"), "a");
  const request: GitHostRequest = {
    targetRoot: root,
    node: "delivery-start",
    deliveryId: "test-delivery",
    changeId: null,
    ownerSourceRef: "test:synthetic-owner",
    expectedBranch: "main",
    operation: {
      kind: "create-new",
      paths: ["a.txt"],
      commitMessage: "first",
      commitShape: null,
    },
  };
  return { root, request };
}

test("post-stage index drift is incomplete with confirmed stage effect, without commit or unstage", async () => {
  const { root, request } = await fixture();
  try {
    let reads = 0;
    const outcome = await runCheckpoint(request, async () => {
      if (++reads === 3) {
        await writeFile(path.join(root, "b.txt"), "other actor");
        await gitBytes(root, ["add", "--", "b.txt"]);
      }
      return { request };
    });
    assert.equal(outcome.status, "incomplete");
    assert.equal(outcome.phase, "stage");
    assert.equal(outcome.effect, "confirmed");
    assert.equal((await readGitPosition(root)).head, null);
    assert.deepEqual(await readPendingPaths(root), ["a.txt", "b.txt"]);
    assert.equal(
      await readFile(path.join(root, "b.txt"), "utf8"),
      "other actor",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Change checkpoint consumes existing evaluator and source, never a Final", async () => {
  const { root, request } = await fixture();
  try {
    const change: GitHostRequest = {
      ...request,
      node: "change-checkpoint",
      changeId: "test-change",
    };
    assert.equal(
      (await runCheckpoint(change, async () => ({ request: change }))).effect,
      "none",
    );
    const result = await runCheckpoint(change, async (source) => ({
      request: change,
      checkpointAuthorization: {
        policyDecision: { kind: "ready-checkpoint-evaluation" },
        deliveryId: change.deliveryId,
        changeId: change.changeId!,
        ownerAuthority: {
          ref: "owner:" + "a".repeat(64),
          decision: "authorize-checkpoint",
          deliveryId: change.deliveryId,
          changeId: change.changeId!,
          sourceRef: source,
          scope: ["checkpoint"],
        },
      },
    }));
    assert.equal(result.status, "completed", JSON.stringify(result));
    const push: GitHostRequest = {
      ...request,
      operation: {
        kind: "push",
        localCommit: result.observed.checkpointCommit!,
        remote: "missing",
        targetRef: "refs/heads/main",
      },
    };
    const incomplete = await runPush(push, async () => ({ request: push }));
    assert.equal(incomplete.status, "incomplete");
    assert.equal(
      incomplete.observed.checkpointCommit,
      result.observed.checkpointCommit,
    );
    assert.equal(incomplete.observed.remoteCommit, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
