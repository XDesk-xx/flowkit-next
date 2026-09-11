import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  runCheckpoint,
  runPush,
  type GitHostRequest,
  type ReadGitHostAuthority,
} from "../../../src/domain/git-workflow-host.js";
import {
  gitBytes,
  gitText,
  readIndexFingerprint,
} from "../../../src/internal/git-checkpoint-scope.js";

test("ordinary host: source binding, scoped first commit, dirty reuse, independent bare push", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-host-"));
  const remote = await mkdtemp(path.join(tmpdir(), "flowkit-remote-"));
  try {
    await gitBytes(root, ["init", "-b", "main"]);
    await gitBytes(root, ["config", "user.name", "Test"]);
    await gitBytes(root, ["config", "user.email", "test@example.invalid"]);
    await writeFile(path.join(root, "中文 文件.txt"), "first");
    await writeFile(path.join(root, "unrelated.txt"), "preserve");
    const request: GitHostRequest = {
      targetRoot: root,
      node: "delivery-start",
      deliveryId: "test-delivery",
      changeId: null,
      ownerSourceRef: "test:synthetic-owner",
      expectedBranch: "main",
      operation: {
        kind: "create-new",
        paths: ["中文 文件.txt"],
        commitMessage: "first",
        commitShape: null,
      },
    };
    // Synthetic fixture capability; not a real Owner decision.
    const read: ReadGitHostAuthority = async (source) =>
      source === request.ownerSourceRef ? { request } : null;
    assert.equal(
      (await runCheckpoint(request, async () => null)).effect,
      "none",
    );
    assert.equal(
      (await runCheckpoint({ ...request, targetRoot: remote }, read)).status,
      "incomplete",
    );
    await gitBytes(root, ["add", "--", "unrelated.txt"]);
    const index = await readIndexFingerprint(root);
    const rejected = await runCheckpoint(request, read);
    assert.match(rejected.reason!, /范围外 staged/);
    assert.equal(rejected.effect, "none");
    assert.equal(await readIndexFingerprint(root), index);
    // Fixture explicitly resets its own synthetic staging; the host did not.
    await gitBytes(root, ["rm", "--cached", "--", "unrelated.txt"]);
    const committed = await runCheckpoint(request, read);
    assert.equal(committed.status, "completed", JSON.stringify(committed));
    const commit = committed.observed.checkpointCommit!;
    assert.equal(
      await readFile(path.join(root, "unrelated.txt"), "utf8"),
      "preserve",
    );
    await gitBytes(root, ["add", "--", "unrelated.txt"]);
    const staged = await readIndexFingerprint(root);
    const reuse: GitHostRequest = {
      ...request,
      operation: { kind: "reuse-existing", checkpointCommit: commit },
    };
    assert.equal(
      (await runCheckpoint(reuse, async () => ({ request: reuse }))).status,
      "completed",
    );
    assert.equal(await readIndexFingerprint(root), staged);
    await gitBytes(remote, ["init", "--bare"]);
    await gitBytes(root, ["remote", "add", "origin", remote]);
    const push: GitHostRequest = {
      ...request,
      operation: {
        kind: "push",
        localCommit: commit,
        remote: "origin",
        targetRef: "refs/heads/main",
      },
    };
    const published = await runPush(push, async () => ({ request: push }));
    assert.equal(published.status, "completed", JSON.stringify(published));
    assert.equal(published.observed.remoteCommit, commit);
    assert.equal(
      await gitText(remote, ["rev-parse", "refs/heads/main"]),
      commit,
    );
    assert.equal(await readIndexFingerprint(root), staged);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(remote, { recursive: true, force: true });
  }
});
