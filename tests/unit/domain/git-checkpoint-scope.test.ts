import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  gitBytes,
  gitText,
  readPendingPaths,
  requireIndexScope,
  requireGitRoot,
  readGitPosition,
  verifyCheckpointObjects,
} from "../../../src/internal/git-checkpoint-scope.js";

test("native Git NUL scope supports unborn, Chinese/spaces, delete and rename endpoints", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-scope-"));
  try {
    await gitBytes(root, ["init", "-b", "main"]);
    await gitBytes(root, ["config", "user.name", "Test"]);
    await gitBytes(root, ["config", "user.email", "test@example.invalid"]);
    await requireGitRoot(root);
    assert.equal((await readGitPosition(root)).head, null);
    await writeFile(path.join(root, "中文 文件.txt"), "data");
    await gitBytes(root, ["add", "--", ":(literal)中文 文件.txt"]);
    assert.deepEqual(await readPendingPaths(root), ["中文 文件.txt"]);
    await assert.rejects(requireIndexScope(root, ["other"]), /范围外 staged/);
    await gitBytes(root, ["commit", "-m", "first"]);
    const before = await gitText(root, ["rev-parse", "HEAD"]);
    assert.equal(
      await verifyCheckpointObjects(root, null, before, {
        kind: "create-new",
        paths: ["中文 文件.txt"],
        commitMessage: "first",
        commitShape: null,
      }),
      true,
    );
    await gitBytes(root, ["mv", "--", "中文 文件.txt", "new file.txt"]);
    assert.deepEqual((await readPendingPaths(root)).sort(), [
      "new file.txt",
      "中文 文件.txt",
    ]);
    await gitBytes(root, ["commit", "-m", "rename"]);
    const after = await gitText(root, ["rev-parse", "HEAD"]);
    assert.equal(
      await verifyCheckpointObjects(root, before, after, {
        kind: "create-new",
        paths: ["new file.txt"],
        commitMessage: "rename",
        commitShape: null,
      }),
      false,
    );
    await gitBytes(root, ["rm", "--", "new file.txt"]);
    assert.deepEqual(await readPendingPaths(root), ["new file.txt"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
