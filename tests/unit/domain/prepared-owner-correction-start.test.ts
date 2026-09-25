import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  policyForRecord,
  readSelectedRunChain,
} from "../../../src/cli/current-run-chain.js";
import { startPreparedOwnerCorrectionRun } from "../../../src/cli/prepared-owner-correction-start.js";
import {
  buildRunAddress,
  formatRunOccurrenceId,
  resolveActionGuidanceRef,
  writeDurableRun,
  type DurableRunRecord,
  type RunOccurrence,
} from "../../../src/domain/index.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import { contextFixture } from "./action-context-fixture.js";

const deliveryId = "delivery-one";
const changeId = "change-one";

function record(
  sequence: number,
  actionId: RunOccurrence["actionId"],
  parent: DurableRunRecord | null,
): DurableRunRecord {
  const occurrence = { date: "20260924", sequence, actionId };
  const runId = formatRunOccurrenceId(occurrence)!;
  const actionIdentity = { deliveryId, changeId, actionId };
  const reviewer = actionId.startsWith("review-");
  return {
    actionMarkdown: `# Fixture ${runId}\n`,
    context: {
      runId,
      occurrence,
      actionIdentity,
      role: reviewer ? "reviewer" : "author",
      lifecycleState: actionId === "apply" ? "prepared" : "terminal",
      ownerAuthority: null,
      previousRunId: parent?.context.runId ?? null,
    },
    result: {
      runId,
      actionIdentity,
      authorConclusion: reviewer || actionId === "apply" ? null : "PASS",
      reviewerVerdict: reviewer ? "approved" : null,
      verificationVerdict: null,
      nextBoundary: null,
      facts:
        actionId === "apply"
          ? { implementationPerformed: true, uiCheckpoint: "pending" }
          : {},
    },
  };
}

async function fixture() {
  const context = await contextFixture();
  const { repositoryRoot, flowkitHome, installation } = context;
  await gitBytes(repositoryRoot, ["init"]);
  await writeFile(
    path.join(repositoryRoot, ".gitattributes"),
    ".flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
  );
  const records: DurableRunRecord[] = [];
  for (const [index, actionId] of [
    "explore",
    "review-explore",
    "propose",
    "review-propose",
    "apply",
  ].entries()) {
    const item = record(
      index + 1,
      actionId as RunOccurrence["actionId"],
      records.at(-1) ?? null,
    );
    records.push(item);
    await writeDurableRun(
      {
        repositoryRoot,
        deliveryId,
        changeId,
        changeStartSequence: 1,
        occurrence: item.context.occurrence,
      },
      item,
    );
  }
  const input = {
    repositoryRoot,
    deliveryId,
    changeId,
    changeStartSequence: 1,
    occurrence: {
      date: "20260924",
      sequence: 6,
      actionId: "revise-propose" as const,
    },
  };
  const authority = {
    ref: `owner:${"a".repeat(64)}`,
    decision: "revise-action" as const,
    deliveryId,
    changeId,
    sourceRef: "fixture-owner-input",
    scope: ["revise-propose"],
  };
  const guidanceRef = await resolveActionGuidanceRef(
    installation,
    "revise-propose",
  );
  assert.ok(guidanceRef);
  const oldDirectory = buildRunAddress({
    ...input,
    occurrence: records.at(-1)!.context.occurrence,
  })!.runDirectory;
  const oldBytes = await Promise.all(
    ["action.md", "context.json", "result.json"].map((name) =>
      readFile(path.join(oldDirectory, name)),
    ),
  );
  const proofPath = path.join(
    repositoryRoot,
    ".flowkit",
    "artifacts",
    deliveryId,
    "changes",
    changeId,
    "proof",
    records.at(-1)!.context.runId,
    "ui-state.json",
  );
  await mkdir(path.dirname(proofPath), { recursive: true });
  const proofBytes = Buffer.from('{"humanCheckpointPerformed":false}\n');
  await writeFile(proofPath, proofBytes);
  return {
    repositoryRoot,
    flowkitHome,
    installation,
    observe: context.observe,
    manifest: context.manifest,
    records,
    input,
    authority,
    guidanceRef,
    oldDirectory,
    oldBytes,
    proofPath,
    proofBytes,
    cleanup: context.cleanup,
  };
}

test("Owner corrected start rejects bad authority/readiness before writing and preserves old bytes", async () => {
  const f = await fixture();
  try {
    const targetDirectory = buildRunAddress(f.input)!.runDirectory;
    await assert.rejects(
      startPreparedOwnerCorrectionRun(
        f.installation,
        f.input,
        f.flowkitHome,
        { ...f.authority, scope: ["revise-explore"] },
        f.guidanceRef,
        () => "ready",
      ),
      /Policy rejected/,
    );
    await assert.rejects(
      startPreparedOwnerCorrectionRun(
        f.installation,
        f.input,
        f.flowkitHome,
        f.authority,
        f.guidanceRef,
        () => "blocked",
      ),
      /preparation blocked/,
    );
    await assert.rejects(readdir(targetDirectory), { code: "ENOENT" });
    assert.equal(
      (await readSelectedRunChain(f.input)).current?.context.runId,
      f.records.at(-1)!.context.runId,
    );
    for (const [index, name] of [
      "action.md",
      "context.json",
      "result.json",
    ].entries()) {
      assert.deepEqual(
        await readFile(path.join(f.oldDirectory, name)),
        f.oldBytes[index],
      );
    }
    assert.deepEqual(await readFile(f.proofPath), f.proofBytes);
  } finally {
    await f.cleanup();
  }
});

test("Owner corrected start requires active trusted coordination before writing", async () => {
  for (const state of ["missing", "cancelled", "contradictory"] as const) {
    const f = await fixture();
    try {
      if (state === "missing") {
        await rm(
          path.join(
            f.repositoryRoot,
            "openspec",
            "delivery-groups",
            `${deliveryId}.yaml`,
          ),
        );
      } else if (state === "cancelled") {
        await f.manifest(deliveryId, changeId, "cancelled");
      } else {
        await f.observe([]);
      }
      await assert.rejects(
        startPreparedOwnerCorrectionRun(
          f.installation,
          f.input,
          f.flowkitHome,
          f.authority,
          f.guidanceRef,
          () => "ready",
        ),
      );
      await assert.rejects(readdir(buildRunAddress(f.input)!.runDirectory), {
        code: "ENOENT",
      });
      for (const [index, name] of [
        "action.md",
        "context.json",
        "result.json",
      ].entries()) {
        assert.deepEqual(
          await readFile(path.join(f.oldDirectory, name)),
          f.oldBytes[index],
        );
      }
    } finally {
      await f.cleanup();
    }
  }
});

test("Owner corrected start rechecks coordination immediately before writing", async () => {
  const f = await fixture();
  try {
    await assert.rejects(
      startPreparedOwnerCorrectionRun(
        f.installation,
        f.input,
        f.flowkitHome,
        f.authority,
        f.guidanceRef,
        async () => {
          await f.manifest(deliveryId, changeId, "cancelled");
          return "ready" as const;
        },
      ),
      /preparation blocked/,
    );
    await assert.rejects(readdir(buildRunAddress(f.input)!.runDirectory), {
      code: "ENOENT",
    });
  } finally {
    await f.cleanup();
  }
});

test("Owner corrected start creates one linked partial then completed revise reaches Review", async () => {
  const f = await fixture();
  try {
    const digest = (bytes: Buffer) =>
      createHash("sha256").update(bytes).digest("hex");
    const originalDigests = f.oldBytes.map(digest);
    const held = await startPreparedOwnerCorrectionRun(
      f.installation,
      f.input,
      f.flowkitHome,
      f.authority,
      f.guidanceRef,
      () => "ready",
    );
    assert.deepEqual(await readdir(held.directory), ["action.md"]);
    assert.equal(
      held.preparedContext.previousRunId,
      f.records.at(-1)!.context.runId,
    );
    assert.deepEqual(held.preparedContext.ownerAuthority, f.authority);
    await assert.rejects(
      readSelectedRunChain(f.input),
      /Incomplete Run record/,
    );
    await writeFile(
      path.join(held.directory, "context.json"),
      `${JSON.stringify({ ...held.preparedContext, lifecycleState: "terminal" })}\n`,
      { flag: "wx" },
    );
    await assert.rejects(
      readSelectedRunChain(f.input),
      /Incomplete Run record/,
    );
    const result = {
      runId: held.preparedContext.runId,
      actionIdentity: held.preparedContext.actionIdentity,
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-propose",
      facts: {},
    };
    await writeFile(
      path.join(held.directory, "result.json"),
      `${JSON.stringify(result)}\n`,
      { flag: "wx" },
    );
    const selected = await readSelectedRunChain(f.input);
    assert.equal(selected.current?.context.runId, held.preparedContext.runId);
    assert.equal(selected.current?.result.nextBoundary, "review-propose");
    assert.deepEqual(
      policyForRecord(selected.current, {
        deliveryId,
        changeId,
        changeState: "active",
      }),
      { kind: "ready-action", actionId: "review-propose" },
    );
    assert.equal(selected.records.at(-2)?.result.authorConclusion, null);
    for (const [index, name] of [
      "action.md",
      "context.json",
      "result.json",
    ].entries()) {
      assert.equal(
        digest(await readFile(path.join(f.oldDirectory, name))),
        originalDigests[index],
      );
    }
    assert.deepEqual(await readFile(f.proofPath), f.proofBytes);
  } finally {
    await f.cleanup();
  }
});
