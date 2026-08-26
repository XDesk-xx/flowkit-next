import assert from "node:assert/strict";
import test from "node:test";

import {
  admitActionResult,
  formActionPackage,
  invokeSingleAction,
  type ActionIdentity,
  type CurrentAction,
  type RunContextRecord,
  type RunOccurrence,
  type RunResultRecord,
} from "../../../src/domain/index.js";

const deliveryId = "20260824-01-foundation-lifecycle-kernel";
const changeId = "establish-single-action-execution-terminal-boundary";

const applyIdentity: ActionIdentity = {
  deliveryId,
  changeId,
  actionId: "apply",
};
const reviewIdentity: ActionIdentity = {
  deliveryId,
  changeId,
  actionId: "review-apply",
};

function occurrence(
  sequence: number,
  actionId: "apply" | "review-apply",
): RunOccurrence {
  return { date: "20260826", sequence, actionId };
}

function runId(sequence: number, actionId: "apply" | "review-apply"): string {
  return `20260826-${String(sequence).padStart(3, "0")}-${actionId}`;
}

function context(
  sequence: number,
  identity: ActionIdentity = applyIdentity,
): RunContextRecord {
  return {
    runId: runId(sequence, identity.actionId as "apply" | "review-apply"),
    occurrence: occurrence(
      sequence,
      identity.actionId as "apply" | "review-apply",
    ),
    actionIdentity: identity,
    role: identity.actionId === "review-apply" ? "reviewer" : "author",
    lifecycleState: "prepared",
    ownerAuthority: null,
    previousRunId: null,
  };
}

function result(
  sequence: number,
  identity: ActionIdentity = applyIdentity,
  options: Partial<RunResultRecord> = {},
): RunResultRecord {
  const reviewer = identity.actionId === "review-apply";
  return {
    runId: runId(sequence, identity.actionId as "apply" | "review-apply"),
    actionIdentity: identity,
    authorConclusion: reviewer ? null : "PASS",
    reviewerVerdict: reviewer ? "approved" : null,
    verificationVerdict: null,
    nextBoundary: reviewer ? "archive" : "review-apply",
    facts: { stable: true },
    ...options,
  };
}

function prepared(identity: ActionIdentity = applyIdentity): CurrentAction {
  return { identity, state: "prepared" };
}

function terminal(identity: ActionIdentity = applyIdentity): CurrentAction {
  return { identity, state: "terminal" };
}

test("internally prepares an empty slot and completes one invocation", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    null,
    applyIdentity,
    context(54),
    (actionPackage) => {
      calls += 1;
      assert.equal(actionPackage.lifecycleState, "prepared");
      return result(54);
    },
  );

  assert.equal(calls, 1);
  assert.equal(outcome.status, "terminal");
  assert.deepEqual(outcome.currentAction, terminal());
  assert.equal(outcome.nextBoundary, "review-apply");
});

test("reuses exact prepared A without duplicate prepare", async () => {
  const current = prepared();
  const outcome = await invokeSingleAction(
    current,
    { ...applyIdentity },
    context(54),
    () => result(54),
  );

  assert.equal(outcome.status, "terminal");
  assert.equal(current.state, "prepared");
});

test("prepares a different target after terminal but rejects a different target over prepared", async () => {
  const afterTerminal = await invokeSingleAction(
    terminal(reviewIdentity),
    applyIdentity,
    context(54),
    () => result(54),
  );
  assert.equal(afterTerminal.status, "terminal");

  let calls = 0;
  const rejected = await invokeSingleAction(
    prepared(reviewIdentity),
    applyIdentity,
    context(54),
    () => {
      calls += 1;
      return result(54);
    },
  );
  assert.equal(rejected.status, "failed");
  assert.equal(rejected.reason, "entry-rejected");
  assert.equal(calls, 0);
});

test("package formation failure invokes host callback zero times", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    prepared(),
    applyIdentity,
    context(54, reviewIdentity),
    () => {
      calls += 1;
      return result(54);
    },
  );

  assert.equal(outcome.status, "failed");
  assert.equal(outcome.reason, "package-formation-rejected");
  assert.deepEqual(outcome.currentAction, prepared());
  assert.equal(calls, 0);
});

test("callback failure preserves prepared Action and stops", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    prepared(),
    applyIdentity,
    context(54),
    () => {
      calls += 1;
      throw new Error("host failed");
    },
  );

  assert.equal(calls, 1);
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.reason, "execution-failed");
  assert.deepEqual(outcome.currentAction, prepared());
});

test("admission failure leaves exact Action prepared and executes callback only once", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    prepared(),
    applyIdentity,
    context(54),
    () => {
      calls += 1;
      return result(55);
    },
  );

  assert.equal(calls, 1);
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.reason, "result-admission-rejected");
  assert.deepEqual(outcome.currentAction, prepared());
});

test("later invocation reuses same prepared A with a new Run occurrence", async () => {
  const current = prepared();

  const first = await invokeSingleAction(
    current,
    applyIdentity,
    context(54),
    () => result(55),
  );
  assert.equal(first.status, "failed");
  assert.deepEqual(first.currentAction, current);

  const stalePackage = formActionPackage(current, context(54))!;
  assert.equal(
    admitActionResult(
      stalePackage,
      current,
      occurrence(55, "apply"),
      result(54),
    ),
    null,
  );

  let secondCalls = 0;
  const second = await invokeSingleAction(
    current,
    applyIdentity,
    context(55),
    () => {
      secondCalls += 1;
      return result(55);
    },
  );
  assert.equal(secondCalls, 1);
  assert.equal(second.status, "terminal");
  assert.deepEqual(second.currentAction, terminal());
});

test("successful invocation preserves opaque nextBoundary and never executes a second callback", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    prepared(),
    applyIdentity,
    context(54),
    () => {
      calls += 1;
      return result(54, applyIdentity, { nextBoundary: "review-apply" });
    },
  );

  assert.equal(calls, 1);
  assert.equal(outcome.status, "terminal");
  assert.equal(outcome.nextBoundary, "review-apply");
});
