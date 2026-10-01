import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { requireNewManagedEvidenceBytes } from "../../../src/internal/managed-evidence-checkpoint.js";
import { executeScopedCheckpoint } from "../../../src/internal/git-checkpoint-execution.js";
import { readCandidateRunChain } from "../../../src/internal/git-index-run-chain.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

const deliveryId = "delivery-one";
const changeId = "change-one";
const group = `.flowkit/runs/${deliveryId}/001-${changeId}`;
const proofRunId = "20260924-005-apply";
const proofPath = `.flowkit/artifacts/${deliveryId}/changes/${changeId}/proof/${proofRunId}/proof.txt`;
const proof = Buffer.from("fixture proof\r\n");
const proofRef = () => ({
  path: proofPath,
  bytes: proof.length,
  sha256: createHash("sha256").update(proof).digest("hex"),
  deliveryId,
  changeId,
  runId: proofRunId,
  purpose: "fixture",
});

function record(
  sequence: number,
  actionId: string,
  parent: FixtureRecord | null = null,
): FixtureRecord {
  const runId = `20260924-${String(sequence).padStart(3, "0")}-${actionId}`;
  const actionIdentity = { deliveryId, changeId, actionId };
  const reviewer = actionId.startsWith("review-");
  return {
    actionMarkdown: "# Fixture Run\n",
    context: {
      runId,
      occurrence: { date: "20260924", sequence, actionId },
      actionIdentity,
      role: reviewer ? "reviewer" : "author",
      lifecycleState: "terminal",
      ownerAuthority: null,
      previousRunId: parent?.context.runId ?? null,
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
  };
}
type FixtureRecord = {
  actionMarkdown: string;
  context: Record<string, any>;
  result: Record<string, any>;
};

async function saveRecord(
  root: string,
  entry: FixtureRecord,
  stage: boolean,
): Promise<string[]> {
  const base = `${group}/${entry.context.runId}`;
  const paths = [
    `${base}/action.md`,
    `${base}/context.json`,
    `${base}/result.json`,
  ];
  await mkdir(path.join(root, base), { recursive: true });
  await writeFile(path.join(root, paths[0]!), entry.actionMarkdown);
  await writeFile(
    path.join(root, paths[1]!),
    JSON.stringify(entry.context) + "\n",
  );
  await writeFile(
    path.join(root, paths[2]!),
    JSON.stringify(entry.result) + "\n",
  );
  if (stage) await gitBytes(root, ["add", "--", ...paths]);
  return paths;
}

async function fixture(kind: "correction" | "continuation", stageChild = true) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-prepared-checkpoint-"),
  );
  await gitBytes(root, ["init", "-b", "main"]);
  await gitBytes(root, ["config", "user.name", "Fixture"]);
  await gitBytes(root, ["config", "user.email", "fixture@example.invalid"]);
  await writeFile(
    path.join(root, ".gitattributes"),
    "* text=auto eol=lf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
  );
  const explore = record(1, "explore");
  const reviewExplore = record(2, "review-explore", explore);
  const propose = record(3, "propose", reviewExplore);
  const reviewPropose = record(4, "review-propose", propose);
  for (const item of [explore, reviewExplore, propose, reviewPropose])
    await saveRecord(root, item, true);
  await gitBytes(root, ["add", ".gitattributes"]);
  await gitBytes(root, ["commit", "-m", "fixture-base"]);
  const apply = record(5, "apply", reviewPropose);
  apply.context.lifecycleState = "prepared";
  apply.result.authorConclusion = null;
  apply.result.facts = { proofRefs: [proofRef()] };
  const ownerPaths = await saveRecord(root, apply, true);
  const next = record(
    6,
    kind === "correction" ? "revise-propose" : "apply",
    apply,
  );
  if (kind === "correction")
    next.context.ownerAuthority = {
      ref: `owner:${"a".repeat(64)}`,
      decision: "revise-action",
      deliveryId,
      changeId,
      sourceRef: "fixture-owner-correction",
      scope: ["revise-propose"],
    };
  const childPaths = await saveRecord(root, next, stageChild);
  await mkdir(path.dirname(path.join(root, proofPath)), { recursive: true });
  await writeFile(path.join(root, proofPath), proof);
  await gitBytes(root, ["add", "--", proofPath]);
  return { root, apply, next, ownerPaths, childPaths };
}

async function withFixture(
  kind: "correction" | "continuation",
  stageChild: boolean,
  run: (value: Awaited<ReturnType<typeof fixture>>) => Promise<void>,
) {
  const value = await fixture(kind, stageChild);
  try {
    await run(value);
  } finally {
    assert.ok(
      value.root.startsWith(
        path.join(os.tmpdir(), "flowkit-prepared-checkpoint-"),
      ),
    );
    await rm(value.root, { recursive: true, force: true });
  }
}

async function updateIndexInfo(root: string, input: string): Promise<void> {
  const child = spawn("git", ["update-index", "--index-info"], {
    cwd: root,
    windowsHide: true,
    stdio: ["pipe", "ignore", "pipe"],
  });
  let error = "";
  child.stderr.on("data", (bytes: Buffer) => {
    error += bytes.toString("utf8");
  });
  child.stdin.end(input);
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  assert.equal(code, 0, error);
}

test("candidate index admits prepared proof with Owner correction", async () => {
  await withFixture("correction", true, async ({ root, apply, next }) => {
    const chain = await readCandidateRunChain(root, deliveryId, changeId);
    assert.equal(chain.records.length, 6);
    assert.equal(chain.tip.context.runId, next.context.runId);
    assert.equal(
      chain.records.find((r) => r.context.runId === proofRunId)?.context
        .lifecycleState,
      "prepared",
    );
    await requireNewManagedEvidenceBytes(root);
    assert.equal(
      (
        await readFile(
          path.join(root, `${group}/${proofRunId}/context.json`),
          "utf8",
        )
      ).includes('"lifecycleState":"prepared"'),
      true,
    );
    assert.equal(apply.context.lifecycleState, "prepared");
  });
});

test("candidate index admits same-Action continuation and rejects worktree-only successor", async () => {
  await withFixture("continuation", true, async ({ root, next }) => {
    assert.equal(
      (await readCandidateRunChain(root, deliveryId, changeId)).tip.context
        .runId,
      next.context.runId,
    );
    await requireNewManagedEvidenceBytes(root);
  });
  await withFixture("continuation", false, async ({ root, next }) => {
    assert.equal(
      (
        await readFile(
          path.join(root, `${group}/${next.context.runId}/result.json`),
        )
      ).length > 0,
      true,
    );
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /prepared chain invalid/,
    );
    assert.equal(
      (
        await gitBytes(root, [
          "diff",
          "--cached",
          "--name-only",
          "--",
          proofPath,
        ])
      )
        .toString("utf8")
        .trim(),
      proofPath,
    );
  });
});

test("candidate reader rejects incomplete, duplicate, illegal and fake prepared chains", async () => {
  await withFixture(
    "correction",
    true,
    async ({ root, apply, next, childPaths }) => {
      await gitBytes(root, ["rm", "--cached", "--", childPaths[0]!]);
      await assert.rejects(
        readCandidateRunChain(root, deliveryId, changeId),
        /Incomplete candidate Run/,
      );
      await gitBytes(root, ["add", "--", childPaths[0]!]);
      const duplicate = `.flowkit/runs/${deliveryId}/002-${changeId}/${next.context.runId}/action.md`;
      await mkdir(path.dirname(path.join(root, duplicate)), {
        recursive: true,
      });
      await writeFile(path.join(root, duplicate), "# duplicate\n");
      await gitBytes(root, ["add", "--", duplicate]);
      await assert.rejects(
        readCandidateRunChain(root, deliveryId, changeId),
        /ambiguous/,
      );
      await gitBytes(root, ["rm", "--cached", "--", duplicate]);
      next.context.ownerAuthority = null;
      await writeFile(
        path.join(root, childPaths[1]!),
        JSON.stringify(next.context) + "\n",
      );
      await gitBytes(root, ["add", "--", childPaths[1]!]);
      await assert.rejects(
        readCandidateRunChain(root, deliveryId, changeId),
        /Illegal Policy edge/,
      );
      next.context.ownerAuthority = {
        ref: `owner:${"a".repeat(64)}`,
        decision: "revise-action",
        deliveryId,
        changeId,
        sourceRef: "fixture-owner-correction",
        scope: ["revise-propose"],
      };
      await writeFile(
        path.join(root, childPaths[1]!),
        JSON.stringify(next.context) + "\n",
      );
      await gitBytes(root, ["add", "--", childPaths[1]!]);
      const fork = record(7, "revise-propose", apply);
      fork.context.ownerAuthority = next.context.ownerAuthority;
      const forkPaths = await saveRecord(root, fork, true);
      await assert.rejects(
        readCandidateRunChain(root, deliveryId, changeId),
        /fork/,
      );
      await gitBytes(root, ["rm", "--cached", "--", ...forkPaths]);
      apply.result.authorConclusion = "PASS";
      const ownerResult = `${group}/${proofRunId}/result.json`;
      await writeFile(
        path.join(root, ownerResult),
        JSON.stringify(apply.result) + "\n",
      );
      await gitBytes(root, ["add", "--", ownerResult]);
      await assert.rejects(
        readCandidateRunChain(root, deliveryId, changeId),
        /Incomplete prepared failure/,
      );
    },
  );
});

test("candidate reader rejects conflicted stage and index-only malformed identity", async () => {
  await withFixture(
    "continuation",
    true,
    async ({ root, childPaths, next }) => {
      const contextPath = childPaths[1]!;
      const stage = (
        await gitBytes(root, ["ls-files", "--stage", "--", contextPath])
      ).toString("utf8");
      const hash = /^100644 ([a-f0-9]{40,64}) 0\t/u.exec(stage)?.[1];
      assert.ok(hash);
      await updateIndexInfo(
        root,
        `0 ${"0".repeat(40)}\t${contextPath}\n100644 ${hash} 2\t${contextPath}\n`,
      );
      await assert.rejects(
        readCandidateRunChain(root, deliveryId, changeId),
        /Invalid Run index entry/,
      );
      await gitBytes(root, ["add", "--", contextPath]);
      next.context.runId = "20260924-999-apply";
      await writeFile(
        path.join(root, contextPath),
        JSON.stringify(next.context) + "\n",
      );
      await gitBytes(root, ["add", "--", contextPath]);
      await assert.rejects(
        readCandidateRunChain(root, deliveryId, changeId),
        /Invalid Run context record|linkage/,
      );
    },
  );
});

test("prepared proof rejects declaration and owner byte drift", async () => {
  await withFixture("correction", true, async ({ root, apply, ownerPaths }) => {
    apply.result.facts = { proofRefs: [] };
    await writeFile(
      path.join(root, ownerPaths[2]!),
      JSON.stringify(apply.result) + "\n",
    );
    await gitBytes(root, ["add", "--", ownerPaths[2]!]);
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /declaration missing or ambiguous/,
    );
    apply.result.facts = { proofRefs: [proofRef(), proofRef()] };
    await writeFile(
      path.join(root, ownerPaths[2]!),
      JSON.stringify(apply.result) + "\n",
    );
    await gitBytes(root, ["add", "--", ownerPaths[2]!]);
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /declaration missing or ambiguous/,
    );
    apply.result.facts = {
      proofRefs: [{ ...proofRef(), runId: "20260924-999-apply" }],
    };
    await writeFile(
      path.join(root, ownerPaths[2]!),
      JSON.stringify(apply.result) + "\n",
    );
    await gitBytes(root, ["add", "--", ownerPaths[2]!]);
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /declaration missing or ambiguous/,
    );
    apply.result.facts = {
      proofRefs: [{ ...proofRef(), sha256: "a".repeat(64) }],
    };
    await writeFile(
      path.join(root, ownerPaths[2]!),
      JSON.stringify(apply.result) + "\n",
    );
    await gitBytes(root, ["add", "--", ownerPaths[2]!]);
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /proof differs from Result/,
    );
    apply.result.facts = { proofRefs: [proofRef()] };
    await writeFile(
      path.join(root, ownerPaths[2]!),
      JSON.stringify(apply.result) + "\n",
    );
    await gitBytes(root, ["add", "--", ownerPaths[2]!]);
    await writeFile(
      path.join(root, ownerPaths[2]!),
      JSON.stringify({
        ...apply.result,
        facts: { proofRefs: [proofRef()], changed: true },
      }) + "\n",
    );
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /owner index bytes differ|index bytes differ/,
    );
  });
});

test("committed prepared owner cannot be disguised as terminal by worktree drift", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-prepared-checkpoint-"),
  );
  try {
    await gitBytes(root, ["init", "-b", "main"]);
    await gitBytes(root, ["config", "user.name", "Fixture"]);
    await gitBytes(root, ["config", "user.email", "fixture@example.invalid"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      "* text=auto eol=lf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    const owner = record(1, "explore");
    const ownerRunId = owner.context.runId;
    const ownerProofPath = `.flowkit/artifacts/${deliveryId}/changes/${changeId}/proof/${ownerRunId}/proof.txt`;
    owner.context.lifecycleState = "prepared";
    owner.result.authorConclusion = null;
    owner.result.facts = {
      proofRefs: [{ ...proofRef(), path: ownerProofPath, runId: ownerRunId }],
    };
    const ownerPaths = await saveRecord(root, owner, true);
    await gitBytes(root, ["add", ".gitattributes"]);
    await gitBytes(root, ["commit", "-m", "prepared owner"]);
    const base = (await gitBytes(root, ["rev-parse", "HEAD"]))
      .toString("utf8")
      .trim();
    await mkdir(path.dirname(path.join(root, ownerProofPath)), {
      recursive: true,
    });
    await writeFile(path.join(root, ownerProofPath), proof);
    await gitBytes(root, ["add", "--", ownerProofPath]);
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /prepared chain invalid/,
    );
    await writeFile(
      path.join(root, ownerPaths[1]!),
      JSON.stringify({ ...owner.context, lifecycleState: "terminal" }) + "\n",
    );
    await writeFile(
      path.join(root, ownerPaths[2]!),
      JSON.stringify({
        ...owner.result,
        authorConclusion: "PASS",
        nextBoundary: "review-explore",
      }) + "\n",
    );
    await assert.rejects(
      requireNewManagedEvidenceBytes(root),
      /owner index bytes differ/,
    );
    const outcome = await executeScopedCheckpoint(
      root,
      "main",
      {
        kind: "create-new",
        paths: [ownerProofPath],
        commitMessage: "fixture proof",
        commitShape: null,
      },
      async () => true,
    );
    assert.equal(outcome.status, "incomplete");
    assert.match(outcome.reason!, /owner index bytes differ/);
    assert.equal(
      (await gitBytes(root, ["rev-parse", "HEAD"])).toString("utf8").trim(),
      base,
    );
    assert.equal(
      (
        await gitBytes(root, [
          "diff",
          "--cached",
          "--name-only",
          "--",
          ownerProofPath,
        ])
      )
        .toString("utf8")
        .trim(),
      ownerProofPath,
    );
  } finally {
    assert.ok(
      root.startsWith(path.join(os.tmpdir(), "flowkit-prepared-checkpoint-")),
    );
    await rm(root, { recursive: true, force: true });
  }
});

test("committed terminal owner still admits a proof-only checkpoint", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-prepared-checkpoint-"),
  );
  try {
    await gitBytes(root, ["init", "-b", "main"]);
    await gitBytes(root, ["config", "user.name", "Fixture"]);
    await gitBytes(root, ["config", "user.email", "fixture@example.invalid"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      "* text=auto eol=lf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    const owner = record(1, "explore");
    const ownerRunId = owner.context.runId;
    const ownerProofPath = `.flowkit/artifacts/${deliveryId}/changes/${changeId}/proof/${ownerRunId}/proof.txt`;
    owner.result.facts = {
      proofRefs: [{ ...proofRef(), path: ownerProofPath, runId: ownerRunId }],
    };
    await saveRecord(root, owner, true);
    await gitBytes(root, ["add", ".gitattributes"]);
    await gitBytes(root, ["commit", "-m", "terminal owner"]);
    await mkdir(path.dirname(path.join(root, ownerProofPath)), {
      recursive: true,
    });
    await writeFile(path.join(root, ownerProofPath), proof);
    await gitBytes(root, ["add", "--", ownerProofPath]);
    await requireNewManagedEvidenceBytes(root);
  } finally {
    assert.ok(
      root.startsWith(path.join(os.tmpdir(), "flowkit-prepared-checkpoint-")),
    );
    await rm(root, { recursive: true, force: true });
  }
});
