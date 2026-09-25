import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  ActionContextError,
  readSelectedRunChain,
  resolveRunChain,
} from "../../../src/cli/current-run-chain.js";
import {
  formatRunOccurrenceId,
  writeDurableRun,
  type DurableRunRecord,
  type RunOccurrence,
} from "../../../src/domain/run-result-persistence.js";

function record(
  sequence: number,
  actionId: RunOccurrence["actionId"],
  parent: DurableRunRecord | null = null,
): DurableRunRecord {
  const occurrence = { date: "20260908", sequence, actionId };
  const runId = formatRunOccurrenceId(occurrence)!;
  const actionIdentity = {
    deliveryId: "delivery-one",
    changeId: "change-one",
    actionId,
  };
  const reviewer = actionId.startsWith("review-");
  return {
    actionMarkdown: "# Real fixture, not independent Review evidence\n",
    context: {
      runId,
      occurrence,
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

test("chain tip follows Policy links, not sequence or input ordering", () => {
  const first = record(9, "explore");
  const review = record(4, "review-explore", first);
  const proposal = record(2, "propose", review);
  assert.equal(resolveRunChain([proposal, first, review]), proposal);
  assert.equal(resolveRunChain([]), null);
});

test("reject disconnected higher root, fork, missing parent, cycle, duplicate sequence and Role", () => {
  const first = record(1, "explore");
  const review = record(2, "review-explore", first);
  const bad = [
    [first, review, record(999, "explore")],
    [first, review, record(3, "review-explore", first)],
    [review],
    [first, record(3, "propose", first)],
    [first, record(1, "review-explore", first)],
    [
      first,
      { ...review, context: { ...review.context, role: "author" as const } },
    ],
    [
      {
        ...first,
        context: { ...first.context, previousRunId: review.context.runId },
      },
      review,
    ],
  ];
  for (const records of bad)
    assert.throws(() => resolveRunChain(records), ActionContextError);
});

test("Owner correction uses existing Policy and rejects wrong authority", () => {
  const first = record(1, "explore");
  const correction = record(2, "revise-explore", first);
  assert.throws(() => resolveRunChain([first, correction]), ActionContextError);
  const authorized = {
    ...correction,
    context: {
      ...correction.context,
      ownerAuthority: {
        ref: `owner:${"a".repeat(64)}`,
        decision: "revise-action",
        deliveryId: "delivery-one",
        changeId: "change-one",
        sourceRef: "fixture-owner-input",
        scope: ["revise-explore"],
      },
    },
  };
  assert.equal(resolveRunChain([first, authorized]), authorized);
  assert.throws(
    () =>
      resolveRunChain([
        first,
        {
          ...authorized,
          context: {
            ...authorized.context,
            ownerAuthority: {
              ...authorized.context.ownerAuthority,
              scope: ["revise-propose"],
            },
          },
        },
      ]),
    ActionContextError,
  );
});

test("complete prepared failure retries same Action with a new occurrence", () => {
  const root = record(1, "explore");
  const failure = {
    ...root,
    context: { ...root.context, lifecycleState: "prepared" as const },
    result: {
      ...root.result,
      authorConclusion: null,
      facts: { reason: "actual work did not complete" },
    },
  };
  const retry = record(2, "explore", failure);
  assert.equal(resolveRunChain([retry, failure]), retry);
  assert.throws(
    () => resolveRunChain([failure, record(3, "review-explore", failure)]),
    ActionContextError,
  );
  assert.throws(
    () =>
      resolveRunChain([
        { ...failure, result: { ...failure.result, authorConclusion: "PASS" } },
      ]),
    ActionContextError,
  );
});

test("LP 089 shaped prepared Apply accepts one Owner-linked revise tip without changing the predecessor", () => {
  const explore = record(85, "explore");
  const reviewExplore = record(86, "review-explore", explore);
  const propose = record(87, "propose", reviewExplore);
  const reviewPropose = record(88, "review-propose", propose);
  const apply = record(89, "apply", reviewPropose);
  const prepared = {
    ...apply,
    context: { ...apply.context, lifecycleState: "prepared" as const },
    result: {
      ...apply.result,
      authorConclusion: null,
      nextBoundary: null,
      facts: { implementationPerformed: true, uiCheckpoint: "pending" },
    },
  };
  const before = JSON.stringify(prepared);
  const history = [explore, reviewExplore, propose, reviewPropose, prepared];
  for (const target of [
    "revise-apply",
    "revise-propose",
    "revise-explore",
  ] as const) {
    const child = record(90, target, prepared);
    const corrected = {
      ...child,
      context: {
        ...child.context,
        ownerAuthority: {
          ref: `owner:${"a".repeat(64)}`,
          decision: "revise-action" as const,
          deliveryId: "delivery-one",
          changeId: "change-one",
          sourceRef: "fixture-owner-correction",
          scope: [target],
        },
      },
    };
    assert.equal(resolveRunChain([...history, corrected]), corrected);
    assert.equal(JSON.stringify(prepared), before);
    assert.throws(
      () => resolveRunChain([...history, child]),
      ActionContextError,
    );
    assert.throws(
      () =>
        resolveRunChain([...history, corrected, record(91, target, prepared)]),
      ActionContextError,
    );
    assert.throws(
      () =>
        resolveRunChain([
          ...history,
          {
            ...corrected,
            context: {
              ...corrected.context,
              previousRunId: reviewPropose.context.runId,
            },
          },
        ]),
      ActionContextError,
    );
  }
});

test("canonical disk history reads selected group only and keeps partial visible", async () => {
  const repositoryRoot = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-chain-"),
  );
  const input = {
    repositoryRoot,
    deliveryId: "delivery-one",
    changeId: "change-one",
  };
  try {
    assert.equal((await readSelectedRunChain(input)).current, null);
    const first = record(1, "explore");
    const review = record(2, "review-explore", first);
    for (const item of [first, review])
      await writeDurableRun(
        {
          ...input,
          changeStartSequence: 7,
          occurrence: item.context.occurrence,
        },
        item,
      );
    await mkdir(
      path.join(
        repositoryRoot,
        ".flowkit",
        "runs",
        "delivery-one",
        "999-other-change",
        "garbage",
      ),
      { recursive: true },
    );
    const resolved = await readSelectedRunChain(input);
    assert.equal(resolved.current?.context.runId, review.context.runId);
    assert.equal(resolved.changeStartSequence, 7);
    await mkdir(
      path.join(
        repositoryRoot,
        ".flowkit",
        "runs",
        "delivery-one",
        "007-change-one",
        "20260908-003-propose",
      ),
    );
    await assert.rejects(readSelectedRunChain(input), /Incomplete Run record/);
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("explicit bootstrap history is display-only; mixed and unmarked groups rejected", async () => {
  const repositoryRoot = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-bootstrap-chain-"),
  );
  const input = {
    repositoryRoot,
    deliveryId: "delivery-one",
    changeId: "change-one",
  };
  const base = path.join(repositoryRoot, ".flowkit", "runs", "delivery-one");
  const dir = path.join(base, "change-one", "20260908-015-explore");
  try {
    await mkdir(dir, { recursive: true });
    const marker = {
      ...input,
      runId: "20260908-015-explore",
      kind: "external-orchestrator-explore",
      canonicalFlowkitRuntimeRun: false,
      executionMode: "independent-bootstrap",
    };
    await writeFile(path.join(dir, "action.md"), "# Bootstrap\n");
    for (const name of ["context.json", "result.json"])
      await writeFile(path.join(dir, name), JSON.stringify(marker));
    assert.equal((await readSelectedRunChain(input)).kind, "bootstrap-history");
    for (const invalidText of ["{", "null", "[]"]) {
      await writeFile(path.join(dir, "result.json"), invalidText);
      await assert.rejects(readSelectedRunChain(input), ActionContextError);
    }
    await rm(path.join(dir, "result.json"));
    await assert.rejects(
      readSelectedRunChain(input),
      /Incomplete or invalid bootstrap record/,
    );
    await writeFile(path.join(dir, "result.json"), "{}");
    await assert.rejects(readSelectedRunChain(input), /Unmarked bootstrap/);
    await mkdir(path.join(base, "001-change-one"));
    await assert.rejects(readSelectedRunChain(input), /Multiple Run groups/);
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("actual terminal Author FAIL stays current rather than reusing prior PASS", () => {
  const initial = record(1, "explore");
  const review = record(2, "review-explore", initial);
  const failed = record(3, "propose", review);
  const outcome = {
    ...failed,
    result: { ...failed.result, authorConclusion: "FAIL" },
  };
  assert.equal(resolveRunChain([initial, review, outcome]), outcome);
});
