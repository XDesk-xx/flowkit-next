import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
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
  readIndexFingerprint,
  readGitPosition,
  readPendingPaths,
} from "../../../src/internal/git-checkpoint-scope.js";
import { executeScopedCheckpoint } from "../../../src/internal/git-checkpoint-execution.js";

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

test("failed exact staging reports unknown effect without retrying or clearing index", async () => {
  const { root, request } = await fixture();
  try {
    const missing: GitHostRequest = {
      ...request,
      operation: {
        kind: "create-new",
        paths: ["missing.txt"],
        commitMessage: "missing",
        commitShape: null,
      },
    };
    const before = await readIndexFingerprint(root);
    const outcome = await runCheckpoint(missing, async () => ({
      request: missing,
    }));
    assert.equal(outcome.status, "incomplete");
    assert.equal(outcome.phase, "stage");
    assert.equal(outcome.effect, "unknown");
    assert.equal(outcome.observed.checkpointCommit, null);
    assert.equal(await readIndexFingerprint(root), before);
    assert.deepEqual(await readPendingPaths(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stdin error waits for the single stage child to finish before authoritative readback", async () => {
  const { root } = await fixture();
  const original = childProcess.execFile;
  let addCalls = 0;
  let childComplete = false;
  let complete!: () => void;
  const completed = new Promise<void>((resolve) => {
    complete = resolve;
  });
  Object.defineProperty(childProcess, "execFile", {
    configurable: true,
    writable: true,
    value: (...args: unknown[]) => {
      const [program, argv, , callback] = args;
      if (
        program === "git" &&
        Array.isArray(argv) &&
        argv.includes("--pathspec-from-file=-")
      ) {
        addCalls++;
        const stdin = new EventEmitter() as EventEmitter & { end: () => void };
        stdin.end = () => {
          queueMicrotask(() =>
            stdin.emit(
              "error",
              Object.assign(new Error("injected EPIPE"), { code: "EPIPE" }),
            ),
          );
          setTimeout(
            () =>
              original(
                "git",
                ["add", "--", "a.txt"],
                { cwd: root, windowsHide: true },
                (error) => {
                  childComplete = true;
                  (callback as (error: Error) => void)(
                    error ?? Error("injected nonzero response"),
                  );
                  complete();
                },
              ),
            100,
          );
        };
        return { stdin };
      }
      return Reflect.apply(original, childProcess, args);
    },
  });
  syncBuiltinESMExports();
  try {
    const outcome = await executeScopedCheckpoint(
      root,
      "main",
      {
        kind: "create-new",
        paths: ["a.txt"],
        commitMessage: "fixture",
        commitShape: null,
      },
      async () => true,
    );
    const completeAtReturn = childComplete;
    const indexAtReturn = await readPendingPaths(root);
    await completed;
    assert.equal(completeAtReturn, true);
    assert.deepEqual(indexAtReturn, ["a.txt"]);
    assert.deepEqual(await readPendingPaths(root), indexAtReturn);
    assert.equal(outcome.status, "incomplete");
    assert.equal(outcome.phase, "stage");
    assert.equal(outcome.effect, "confirmed");
    assert.equal(outcome.observed.checkpointCommit, null);
    assert.equal(addCalls, 1);
  } finally {
    Object.defineProperty(childProcess, "execFile", {
      configurable: true,
      writable: true,
      value: original,
    });
    syncBuiltinESMExports();
    await rm(root, { recursive: true, force: true });
  }
});

test("commit failure preserves confirmed staged paths and does not claim a checkpoint", async () => {
  const { root, request } = await fixture();
  try {
    await gitBytes(root, ["config", "user.name", ""]);
    await gitBytes(root, ["config", "user.email", ""]);
    await gitBytes(root, ["config", "user.useConfigOnly", "true"]);
    const outcome = await runCheckpoint(request, async () => ({ request }));
    assert.equal(outcome.status, "incomplete");
    assert.equal(outcome.phase, "commit");
    assert.equal(outcome.effect, "confirmed");
    assert.equal(outcome.observed.checkpointCommit, null);
    assert.deepEqual(await readPendingPaths(root), ["a.txt"]);
    assert.equal((await readGitPosition(root)).head, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("nonzero commit response reads back the exact created object without retry", async () => {
  const { root, request } = await fixture();
  try {
    await writeFile(
      path.join(root, ".git", "hooks", "pre-commit"),
      "#!/bin/sh\ngit -c core.hooksPath=/dev/null commit -m first >/dev/null 2>&1\nexit 23\n",
    );
    await chmod(path.join(root, ".git", "hooks", "pre-commit"), 0o755);
    const outcome = await runCheckpoint(request, async () => ({ request }));
    assert.equal(outcome.status, "incomplete");
    assert.equal(outcome.phase, "commit");
    assert.equal(outcome.effect, "confirmed");
    assert.ok(outcome.observed.checkpointCommit);
    assert.equal(
      outcome.observed.checkpointCommit,
      (await readGitPosition(root)).head,
    );
    assert.deepEqual(await readPendingPaths(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("readback rejects a committed object with the wrong authorized shape", async () => {
  const { root, request } = await fixture();
  try {
    const wrongShape: GitHostRequest = {
      ...request,
      operation: {
        kind: "create-new",
        paths: ["a.txt"],
        commitMessage: "first",
        commitShape: { parents: [], count: 2 },
      },
    };
    const outcome = await runCheckpoint(wrongShape, async () => ({
      request: wrongShape,
    }));
    assert.equal(outcome.status, "incomplete");
    assert.equal(outcome.phase, "readback");
    assert.equal(outcome.observed.checkpointCommit, null);
    assert.equal(outcome.effect, "confirmed");
    assert.ok((await readGitPosition(root)).head);
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
