import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { executeScopedCheckpoint } from "../../../src/internal/git-checkpoint-execution.js";
import { requireNewManagedEvidenceBytes } from "../../../src/internal/managed-evidence-checkpoint.js";
import {
  gitBytes,
  gitText,
  readIndexFingerprint,
} from "../../../src/internal/git-checkpoint-scope.js";
import {
  proofOwnerFromSegment,
  uniqueRunGroup,
} from "../../../src/internal/proof-path-owner.js";

test("proof group resolves only a unique matching Run", () => {
  assert.equal(
    uniqueRunGroup(["001-change-one"], "change-one"),
    "001-change-one",
  );
  assert.deepEqual(
    proofOwnerFromSegment(["001-change-one"], "001-change-one"),
    {
      runGroup: "001-change-one",
      changeId: "change-one",
    },
  );
  assert.deepEqual(proofOwnerFromSegment(["001-change-one"], "change-one"), {
    runGroup: "001-change-one",
    changeId: "change-one",
  });
  assert.throws(
    () => proofOwnerFromSegment(["001-change-one"], "002-change-one"),
    /not unique/,
  );
  assert.throws(
    () => uniqueRunGroup(["001-change-one", "002-change-one"], "change-one"),
    /not uniquely present/,
  );
  assert.throws(
    () =>
      proofOwnerFromSegment(
        ["001-change-one", "002-change-one"],
        "001-change-one",
      ),
    /not uniquely present/,
  );
});

for (const proofGroup of ["change-one", "001-change-one"])
  test(`new ${proofGroup} proof index bytes remain bound to terminal Result`, async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), "flowkit-evidence-index-"),
    );
    const proofPath = `.flowkit/artifacts/delivery-one/changes/${proofGroup}/proof/20260924-001-apply/proof.txt`;
    const resultPath =
      ".flowkit/runs/delivery-one/001-change-one/20260924-001-apply/result.json";
    const contextPath =
      ".flowkit/runs/delivery-one/001-change-one/20260924-001-apply/context.json";
    const original = Buffer.from("original\r\n");
    try {
      await gitBytes(root, ["init", "-b", "main"]);
      await gitBytes(root, ["config", "user.name", "Test"]);
      await gitBytes(root, ["config", "user.email", "test@example.invalid"]);
      await writeFile(
        path.join(root, ".gitattributes"),
        "* text=auto eol=lf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
      );
      await gitBytes(root, ["add", ".gitattributes"]);
      await gitBytes(root, ["commit", "-m", "base"]);
      await mkdir(path.dirname(path.join(root, proofPath)), {
        recursive: true,
      });
      await mkdir(path.dirname(path.join(root, resultPath)), {
        recursive: true,
      });
      await writeFile(path.join(root, proofPath), original);
      await writeFile(
        path.join(root, resultPath),
        JSON.stringify({
          runId: "20260924-001-apply",
          actionIdentity: {
            deliveryId: "delivery-one",
            changeId: "change-one",
            actionId: "apply",
          },
          authorConclusion: "PASS",
          reviewerVerdict: null,
          verificationVerdict: null,
          nextBoundary: "review-apply",
          facts: {
            proofRefs: [
              {
                path: proofPath,
                bytes: original.length,
                sha256: createHash("sha256").update(original).digest("hex"),
                deliveryId: "delivery-one",
                changeId: "change-one",
                runId: "20260924-001-apply",
                purpose: "fixture",
              },
            ],
          },
        }) + "\n",
      );
      await writeFile(
        path.join(root, contextPath),
        JSON.stringify({
          runId: "20260924-001-apply",
          occurrence: { date: "20260924", sequence: 1, actionId: "apply" },
          actionIdentity: {
            deliveryId: "delivery-one",
            changeId: "change-one",
            actionId: "apply",
          },
          role: "author",
          lifecycleState: "terminal",
          ownerAuthority: null,
          previousRunId: null,
        }) + "\n",
      );
      await gitBytes(root, ["add", "--", proofPath, resultPath, contextPath]);
      await requireNewManagedEvidenceBytes(root);
      const alternate =
        proofGroup === "change-one" ? "001-change-one" : "change-one";
      const alternateDirectory = path.join(
        root,
        ".flowkit/artifacts/delivery-one/changes",
        alternate,
        "proof/20260924-001-apply",
      );
      await mkdir(alternateDirectory, { recursive: true });
      await requireNewManagedEvidenceBytes(root);
      const alternatePath = path
        .relative(root, path.join(alternateDirectory, "other.txt"))
        .replaceAll("\\", "/");
      await writeFile(path.join(root, alternatePath), "alternate\n");
      await gitBytes(root, ["add", "--", alternatePath]);
      await rm(alternateDirectory, { recursive: true });
      await assert.rejects(
        requireNewManagedEvidenceBytes(root),
        /Run owner unavailable/,
      );
      await gitBytes(root, ["rm", "--cached", "--", alternatePath]);
      await requireNewManagedEvidenceBytes(root);
      const duplicateGroup = path.join(
        root,
        ".flowkit/runs/delivery-one/002-change-one",
      );
      await mkdir(duplicateGroup, { recursive: true });
      await requireNewManagedEvidenceBytes(root);
      const duplicateRunPath =
        ".flowkit/runs/delivery-one/002-change-one/20260924-002-explore/action.md";
      await mkdir(path.dirname(path.join(root, duplicateRunPath)), {
        recursive: true,
      });
      await writeFile(path.join(root, duplicateRunPath), "duplicate group\n");
      await gitBytes(root, ["add", "--", duplicateRunPath]);
      await assert.rejects(
        requireNewManagedEvidenceBytes(root),
        /Run owner unavailable/,
      );
      await rm(duplicateGroup, { recursive: true });
      await assert.rejects(
        requireNewManagedEvidenceBytes(root),
        /Run owner unavailable/,
      );
      await gitBytes(root, ["rm", "--cached", "--", duplicateRunPath]);
      await requireNewManagedEvidenceBytes(root);
      const admittedResult = await readFile(path.join(root, resultPath));
      const withoutRef = JSON.parse(admittedResult.toString("utf8"));
      withoutRef.facts.proofRefs = [];
      await writeFile(
        path.join(root, resultPath),
        JSON.stringify(withoutRef) + "\n",
      );
      await gitBytes(root, ["add", "--", resultPath]);
      await assert.rejects(
        requireNewManagedEvidenceBytes(root),
        /declaration missing or ambiguous/,
      );
      await writeFile(path.join(root, resultPath), admittedResult);
      await gitBytes(root, ["add", "--", resultPath]);

      await writeFile(path.join(root, proofPath), "changed\r\n");
      await gitBytes(root, ["add", "--", proofPath]);
      await assert.rejects(
        requireNewManagedEvidenceBytes(root),
        /proof differs from Result/,
      );
      const before = await gitText(root, ["rev-parse", "HEAD"]);
      const rejected = await executeScopedCheckpoint(
        root,
        "main",
        {
          kind: "create-new",
          paths: [proofPath, contextPath, resultPath],
          commitMessage: "fixture",
          commitShape: null,
        },
        async () => true,
      );
      assert.equal(rejected.status, "incomplete");
      assert.match(rejected.reason!, /proof differs from Result/);
      assert.equal(await gitText(root, ["rev-parse", "HEAD"]), before);
      assert.deepEqual(
        await gitBytes(root, ["show", `:${proofPath}`]),
        Buffer.from("changed\r\n"),
      );

      await writeFile(path.join(root, proofPath), original);
      await writeFile(
        path.join(root, ".gitattributes"),
        "* text=auto eol=lf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n.flowkit/artifacts/**/proof.txt text=auto\n",
      );
      await gitBytes(root, ["add", "--renormalize", "--", proofPath]);
      await assert.rejects(
        requireNewManagedEvidenceBytes(root),
        /index bytes differ/,
      );

      await writeFile(
        path.join(root, ".gitattributes"),
        "* text=auto eol=lf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
      );
      // Restored attributes must reapply conversion even when Git reuses unchanged file stat data.
      await gitBytes(root, ["add", "--renormalize", "--", proofPath]);
      assert.deepEqual(
        await gitBytes(root, ["show", `:${proofPath}`]),
        original,
      );
      await requireNewManagedEvidenceBytes(root);
      await gitBytes(root, ["commit", "-m", "evidence"]);
      await writeFile(
        path.join(root, proofPath),
        "historical worktree change\n",
      );
      await writeFile(path.join(root, "unrelated.txt"), "new\n");
      await gitBytes(root, ["add", "--", "unrelated.txt"]);
      await requireNewManagedEvidenceBytes(root);
      assert.deepEqual(
        await readFile(path.join(root, proofPath)),
        Buffer.from("historical worktree change\n"),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

test("checkpoint rejects an indexed legacy proof directory absent from worktree", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-index-dual-"));
  const runId = "20260924-001-apply";
  const runRoot = `.flowkit/runs/delivery-one/001-change-one/${runId}`;
  const semantic = `.flowkit/artifacts/delivery-one/changes/change-one/proof/${runId}/legacy.txt`;
  const numbered = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${runId}/new.txt`;
  const identity = {
    deliveryId: "delivery-one",
    changeId: "change-one",
    actionId: "apply",
  };
  const proofRef = (relative: string, bytes: Buffer) => ({
    path: relative,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    deliveryId: identity.deliveryId,
    changeId: identity.changeId,
    runId,
    purpose: "fixture",
  });
  try {
    await gitBytes(root, ["init", "-b", "main"]);
    await gitBytes(root, ["config", "user.name", "Test"]);
    await gitBytes(root, ["config", "user.email", "test@example.invalid"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    await mkdir(path.join(root, runRoot), { recursive: true });
    await mkdir(path.dirname(path.join(root, semantic)), { recursive: true });
    const legacyBytes = Buffer.from("legacy\r\n");
    await writeFile(path.join(root, semantic), legacyBytes);
    await writeFile(
      path.join(root, runRoot, "context.json"),
      JSON.stringify({
        runId,
        occurrence: { date: "20260924", sequence: 1, actionId: "apply" },
        actionIdentity: identity,
        role: "author",
        lifecycleState: "terminal",
        ownerAuthority: null,
        previousRunId: null,
      }) + "\n",
    );
    const resultPath = path.join(root, runRoot, "result.json");
    const result = {
      runId,
      actionIdentity: identity,
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-apply",
      facts: { proofRefs: [proofRef(semantic, legacyBytes)] },
    };
    await writeFile(resultPath, JSON.stringify(result) + "\n");
    await gitBytes(root, ["add", "--", ".gitattributes", semantic, runRoot]);
    await gitBytes(root, ["commit", "-m", "legacy proof"]);

    await rm(path.join(root, semantic));
    await mkdir(path.dirname(path.join(root, numbered)), { recursive: true });
    const newBytes = Buffer.from("new\r\n");
    await writeFile(path.join(root, numbered), newBytes);
    result.facts.proofRefs = [proofRef(numbered, newBytes)];
    await writeFile(resultPath, JSON.stringify(result) + "\n");
    await gitBytes(root, ["add", "--", numbered, runRoot]);
    assert.deepEqual(
      await gitBytes(root, ["show", `:${semantic}`]),
      legacyBytes,
    );
    await assert.rejects(readFile(path.join(root, semantic)), /ENOENT/);
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /Run owner unavailable/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("R100 destination is checked as a new managed proof before commit", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-evidence-rename-"),
  );
  const proofPath =
    ".flowkit/artifacts/delivery-one/changes/change-one/proof/20260924-001-apply/proof.txt";
  const runRoot =
    ".flowkit/runs/delivery-one/001-change-one/20260924-001-apply";
  const contextPath = runRoot + "/context.json";
  const resultPath = runRoot + "/result.json";
  const moved = Buffer.from("moved bytes\n");
  try {
    await gitBytes(root, ["init", "-b", "main"]);
    await gitBytes(root, ["config", "user.name", "Test"]);
    await gitBytes(root, ["config", "user.email", "test@example.invalid"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      "* text=auto eol=lf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    await writeFile(path.join(root, "old.txt"), moved);
    await gitBytes(root, ["add", "--", ".gitattributes", "old.txt"]);
    await gitBytes(root, ["commit", "-m", "base"]);
    const before = await gitText(root, ["rev-parse", "HEAD"]);
    await mkdir(path.dirname(path.join(root, proofPath)), { recursive: true });
    await mkdir(path.join(root, runRoot), { recursive: true });
    await gitBytes(root, ["mv", "--", "old.txt", proofPath]);
    assert.match(
      await gitText(root, ["diff", "--cached", "--name-status"]),
      /R100/,
    );
    const actionIdentity = {
      deliveryId: "delivery-one",
      changeId: "change-one",
      actionId: "apply",
    };
    await writeFile(
      path.join(root, contextPath),
      JSON.stringify({
        runId: "20260924-001-apply",
        occurrence: { date: "20260924", sequence: 1, actionId: "apply" },
        actionIdentity,
        role: "author",
        lifecycleState: "terminal",
        ownerAuthority: null,
        previousRunId: null,
      }) + "\n",
    );
    const result = {
      runId: "20260924-001-apply",
      actionIdentity,
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-apply",
      facts: { proofRefs: [] as object[] },
    };
    await writeFile(path.join(root, resultPath), JSON.stringify(result) + "\n");
    await gitBytes(root, ["add", "--", contextPath, resultPath]);
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /declaration missing or ambiguous/,
    );

    result.facts.proofRefs = [
      {
        path: proofPath,
        bytes: moved.length,
        sha256: "a".repeat(64),
        deliveryId: "delivery-one",
        changeId: "change-one",
        runId: "20260924-001-apply",
        purpose: "fixture",
      },
    ];
    await writeFile(path.join(root, resultPath), JSON.stringify(result) + "\n");
    await gitBytes(root, ["add", "--", resultPath]);
    assert.match(
      await gitText(root, ["diff", "--cached", "--name-status"]),
      /R100/,
    );
    const defaultAdded = await gitText(root, [
      "diff",
      "--cached",
      "--diff-filter=A",
      "--name-only",
    ]);
    assert.equal(defaultAdded.includes(proofPath), false);
    const exactAdded = await gitText(root, [
      "diff",
      "--cached",
      "--no-renames",
      "--diff-filter=A",
      "--name-only",
    ]);
    assert.ok(exactAdded.includes(proofPath));
    const indexBefore = await readIndexFingerprint(root);
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /proof differs from Result/,
    );
    assert.equal(await gitText(root, ["rev-parse", "HEAD"]), before);
    assert.equal(await readIndexFingerprint(root), indexBefore);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
