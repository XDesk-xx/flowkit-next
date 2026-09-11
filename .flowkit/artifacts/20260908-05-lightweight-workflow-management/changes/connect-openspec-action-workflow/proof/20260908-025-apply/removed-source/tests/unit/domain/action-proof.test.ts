import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  parseActionProofFacts,
  proofRoot,
  validateActionProof,
} from "../../../src/internal/action-proof.js";
import type {
  RunResultRecord,
  JsonObject,
} from "../../../src/domain/run-result-persistence.js";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-proof-"));
  const repositoryRoot = path.join(root, "target");
  await mkdir(repositoryRoot);
  const actionIdentity = {
    deliveryId: "delivery-one",
    changeId: "change-one",
    actionId: "explore" as const,
  };
  const runId = "20260908-001-explore";
  const relative = `${proofRoot(actionIdentity, runId)}/stdout.txt`;
  const file = path.join(repositoryRoot, relative);
  await mkdir(path.dirname(file), { recursive: true });
  const bytes = Buffer.from("raw bytes  \r\n\t\r\n");
  await writeFile(file, bytes, { flag: "wx" });
  const ref = {
    path: relative,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    deliveryId: actionIdentity.deliveryId,
    changeId: actionIdentity.changeId,
    runId,
    purpose: "raw fixture output",
  };
  const result: RunResultRecord = {
    runId,
    actionIdentity,
    authorConclusion: "PASS",
    reviewerVerdict: null,
    verificationVerdict: null,
    nextBoundary: null,
    facts: {
      proofRefs: [ref],
      handoff: {
        summary: "Fixture",
        ownerDecisions: [
          { sourceRef: "owner-fixture", summary: "Retain necessary material" },
        ],
        evidenceRefs: [{ sourceRunId: runId, path: relative }],
      },
      verification: { status: "fixture-only" },
    },
  };
  return {
    root,
    repositoryRoot,
    file,
    relative,
    ref,
    result,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
test("raw Buffer proof survives disposable tmp and existing facts remain intact", async () => {
  const f = await fixture();
  try {
    await mkdir(path.join(f.repositoryRoot, ".tmp"));
    await rm(path.join(f.repositoryRoot, ".tmp"), { recursive: true });
    const before = JSON.stringify(f.result);
    assert.equal(
      (await validateActionProof(f.repositoryRoot, f.result, [])).evidenceRefs
        .length,
      1,
    );
    assert.equal(JSON.stringify(f.result), before);
    await assert.rejects(
      writeFile(f.file, "overwrite", { flag: "wx" }),
      /EEXIST/,
    );
  } finally {
    await f.cleanup();
  }
});

test("unreadable proof is rejected where native POSIX permissions apply", async () => {
  const f = await fixture();
  try {
    if (process.platform === "win32" || process.getuid?.() === 0) {
      // Windows/root do not provide the POSIX unreadability fixture; no EACCES claim.
      assert.equal(
        (await validateActionProof(f.repositoryRoot, f.result, [])).proofRefs
          .length,
        1,
      );
      return;
    }
    await chmod(f.file, 0);
    await assert.rejects(
      validateActionProof(f.repositoryRoot, f.result, []),
      /unreadable/,
    );
  } finally {
    await chmod(f.file, 0o600);
    await f.cleanup();
  }
});
test("proof rejects missing, changed bytes, wrong ownership and conflicting declarations", async () => {
  const f = await fixture();
  try {
    for (const change of [
      { sha256: "0".repeat(64) },
      { bytes: 99 },
      { changeId: "other-change" },
      { path: "../escape" },
      { path: f.file },
      { path: f.relative + "/../stdout.txt" },
    ]) {
      await assert.rejects(
        validateActionProof(
          f.repositoryRoot,
          {
            ...f.result,
            facts: { ...f.result.facts, proofRefs: [{ ...f.ref, ...change }] },
          },
          [],
        ),
      );
    }
    await assert.rejects(
      validateActionProof(
        f.repositoryRoot,
        {
          ...f.result,
          facts: {
            ...f.result.facts,
            proofRefs: [f.ref, { ...f.ref, purpose: "conflict" }],
          },
        },
        [],
      ),
      /Conflicting/,
    );
    await rm(f.file);
    await assert.rejects(
      validateActionProof(f.repositoryRoot, f.result, []),
      /unreadable/,
    );
    await mkdir(f.file);
    await assert.rejects(
      validateActionProof(f.repositoryRoot, f.result, []),
      /regular file/,
    );
  } finally {
    await f.cleanup();
  }
});
test("parent junction escape cannot become target-owned proof", async () => {
  const f = await fixture();
  try {
    const outside = path.join(f.root, "outside");
    await mkdir(outside);
    await writeFile(path.join(outside, "stdout.txt"), "raw bytes  \r\n\t\r\n");
    await rm(path.dirname(f.file), { recursive: true });
    await symlink(
      outside,
      path.dirname(f.file),
      process.platform === "win32" ? "junction" : "dir",
    );
    await assert.rejects(
      validateActionProof(f.repositoryRoot, f.result, []),
      /unreadable/,
    );
  } finally {
    await f.cleanup();
  }
});
test("closed material fields, reserved failure and overall JSON limits", async () => {
  const f = await fixture();
  try {
    for (const facts of [
      {},
      {
        ...f.result.facts,
        invocationFailure: { kind: "fake", stage: "execution" },
      },
      { ...f.result.facts, huge: "x".repeat(65536) },
      { ...f.result.facts, handoff: { summary: "missing keys" } },
    ]) {
      assert.throws(() => parseActionProofFacts(facts as JsonObject));
    }
    const without = {
      ...f.result,
      facts: {
        proofRefs: [],
        handoff: {
          summary: "Nothing produced",
          ownerDecisions: [],
          evidenceRefs: [],
        },
      },
    };
    await rm(path.join(f.repositoryRoot, ".flowkit"), { recursive: true });
    assert.deepEqual(
      (await validateActionProof(f.repositoryRoot, without, [])).proofRefs,
      [],
    );
  } finally {
    await f.cleanup();
  }
});
test("handoff consumes only explicitly related files, not unrelated old proof", async () => {
  const f = await fixture();
  try {
    const unrelated = {
      ...f.ref,
      path: f.relative.replace("stdout.txt", "missing.txt"),
    };
    const prior = {
      ...f.result,
      facts: { ...f.result.facts, proofRefs: [f.ref, unrelated] },
    };
    assert.equal(
      (await validateActionProof(f.repositoryRoot, prior, [], false))
        .evidenceRefs.length,
      1,
    );
    await assert.rejects(
      validateActionProof(f.repositoryRoot, prior, []),
      /unreadable/,
    );
  } finally {
    await f.cleanup();
  }
});
