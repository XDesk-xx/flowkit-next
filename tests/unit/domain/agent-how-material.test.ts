import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadHow } from "./agent-how-fixture.js";
import { assertManagedEvidenceGitBytes } from "../../../src/domain/index.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

test("HOW material consumer validates ownership, bytes and regular contained paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-material-"));
  try {
    await gitBytes(root, ["init"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/artifacts/** -text\n",
    );
    const how = await loadHow();
    const identity = {
      deliveryId: "delivery-one",
      changeId: "change-one",
      runId: "20260908-001-explore",
    };
    const prefix = `.flowkit/artifacts/${identity.deliveryId}/changes/${identity.changeId}/proof/${identity.runId}`;
    const directory = path.join(root, prefix);
    await mkdir(directory, { recursive: true });
    const bytes = Buffer.from([0, 13, 10, 255, 65]);
    await writeFile(path.join(directory, "stdout.txt"), bytes);
    const ref = {
      ...identity,
      path: `${prefix}/stdout.txt`,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      purpose: "synthetic raw byte test",
    };
    assert.deepEqual(
      await how.checkProof(root, ref, identity, assertManagedEvidenceGitBytes),
      bytes,
    );
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/artifacts/** -text\n.flowkit/artifacts/**/stdout.txt text=auto\n",
    );
    await assert.rejects(
      how.checkProof(root, ref, identity, assertManagedEvidenceGitBytes),
      /stdout\.txt/,
    );
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/artifacts/** -text\n",
    );
    for (const bad of [
      { ...ref, bytes: 1 },
      { ...ref, sha256: "a".repeat(64) },
      { ...ref, runId: "other" },
      { ...ref, changeId: "other" },
      { ...ref, deliveryId: "other" },
      { ...ref, purpose: "" },
      { ...ref, path: `${prefix}/../stdout.txt` },
      { ...ref, path: `${prefix}\\stdout.txt` },
      { ...ref, path: `${prefix}/missing.txt` },
      { ...ref, path: path.join(root, prefix, "stdout.txt") },
    ])
      await assert.rejects(
        how.checkProof(root, bad, identity, assertManagedEvidenceGitBytes),
      );
    await mkdir(path.join(directory, "folder"));
    await assert.rejects(
      how.checkProof(
        root,
        { ...ref, path: `${prefix}/folder` },
        identity,
        assertManagedEvidenceGitBytes,
      ),
      /not regular/,
    );
    const outside = path.join(root, "outside");
    await mkdir(outside);
    await writeFile(path.join(outside, "stdout.txt"), bytes);
    await symlink(outside, path.join(directory, "linked"), "junction");
    await assert.rejects(
      how.checkProof(
        root,
        { ...ref, path: `${prefix}/linked/stdout.txt` },
        identity,
        assertManagedEvidenceGitBytes,
      ),
      /linked material/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
