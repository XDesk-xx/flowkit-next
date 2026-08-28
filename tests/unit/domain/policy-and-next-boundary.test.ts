import assert from "node:assert/strict";
import test from "node:test";

import {
  POLICY_BLOCKED_REASONS,
  evaluatePolicyAndNextBoundary,
  type CurrentAction,
  type RunContextRecord,
  type RunResultRecord,
  type StandardActionId,
} from "../../../src/domain/index.js";

const DELIVERY = "delivery-one";
const CHANGE = "policy-change";

const reviewerActions = new Set<StandardActionId>([
  "review-explore",
  "review-propose",
  "review-apply",
]);

function current(
  actionId: StandardActionId,
  state: "prepared" | "terminal",
): CurrentAction {
  return {
    identity: { deliveryId: DELIVERY, changeId: CHANGE, actionId },
    state,
  };
}

function terminalPair(
  actionId: StandardActionId,
  sequence: number,
  values: {
    authorConclusion?: string | null;
    reviewerVerdict?: string | null;
    nextBoundary?: string | null;
  } = {},
): { context: RunContextRecord; result: RunResultRecord } {
  const runId = `20260827-${String(sequence).padStart(3, "0")}-${actionId}`;
  const identity = {
    deliveryId: DELIVERY,
    changeId: CHANGE,
    actionId,
  } as const;
  return {
    context: {
      runId,
      occurrence: { date: "20260827", sequence, actionId },
      actionIdentity: identity,
      role: reviewerActions.has(actionId) ? "reviewer" : "author",
      lifecycleState: "terminal",
      ownerAuthority: null,
      previousRunId: null,
    },
    result: {
      runId,
      actionIdentity: identity,
      authorConclusion: values.authorConclusion ?? null,
      reviewerVerdict: values.reviewerVerdict ?? null,
      verificationVerdict: null,
      nextBoundary: values.nextBoundary ?? null,
      facts: {},
    },
  };
}

function activeTerminal(
  actionId: StandardActionId,
  sequence: number,
  values: Parameters<typeof terminalPair>[2],
) {
  const pair = terminalPair(actionId, sequence, values);
  return {
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeState: "active",
    currentAction: current(actionId, "terminal"),
    terminalRunContext: pair.context,
    terminalResult: pair.result,
    ownerCorrection: null,
  };
}

test("exports a closed blocked-reason catalog", () => {
  assert.deepEqual(POLICY_BLOCKED_REASONS, [
    "invalid-policy-input",
    "change-not-active",
    "archive-completion-state-mismatch",
    "terminal-result-missing-or-mismatched",
    "unrecognized-or-unsuccessful-author-outcome",
    "unrecognized-reviewer-verdict",
    "reported-boundary-conflict",
    "owner-authority-required",
    "owner-authority-rejected",
    "unsupported-owner-correction",
    "action-boundary-not-enterable",
  ]);
});

test("starts active empty Change at explore and reuses exact prepared Action", () => {
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeState: "active",
      currentAction: null,
      terminalRunContext: null,
      terminalResult: null,
    }),
    { kind: "ready-action", actionId: "explore" },
  );

  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeState: "active",
      currentAction: current("propose", "prepared"),
      terminalRunContext: null,
      terminalResult: null,
    }),
    { kind: "ready-action", actionId: "propose" },
  );
});

test("implements all twelve normal terminal transitions", () => {
  const cases: Array<{
    action: StandardActionId;
    authorConclusion?: string;
    reviewerVerdict?: string;
    next: StandardActionId;
  }> = [
    { action: "explore", authorConclusion: "PASS", next: "review-explore" },
    {
      action: "revise-explore",
      authorConclusion: "PASS",
      next: "review-explore",
    },
    { action: "propose", authorConclusion: "PASS", next: "review-propose" },
    {
      action: "revise-propose",
      authorConclusion: "PASS",
      next: "review-propose",
    },
    { action: "apply", authorConclusion: "PASS", next: "review-apply" },
    { action: "revise-apply", authorConclusion: "PASS", next: "review-apply" },
    { action: "review-explore", reviewerVerdict: "approved", next: "propose" },
    {
      action: "review-explore",
      reviewerVerdict: "changes-requested",
      next: "revise-explore",
    },
    { action: "review-propose", reviewerVerdict: "approved", next: "apply" },
    {
      action: "review-propose",
      reviewerVerdict: "changes-requested",
      next: "revise-propose",
    },
    { action: "review-apply", reviewerVerdict: "approved", next: "archive" },
    {
      action: "review-apply",
      reviewerVerdict: "changes-requested",
      next: "revise-apply",
    },
  ];

  cases.forEach((entry, index) => {
    assert.deepEqual(
      evaluatePolicyAndNextBoundary(
        activeTerminal(entry.action, index + 1, {
          authorConclusion: entry.authorConclusion,
          reviewerVerdict: entry.reviewerVerdict,
          nextBoundary: entry.next,
        }),
      ),
      { kind: "ready-action", actionId: entry.next },
      entry.action,
    );
  });
});

test("recognizes only completed exact Archive PASS as checkpoint evaluation", () => {
  const pair = terminalPair("archive", 20, {
    authorConclusion: "PASS",
    nextBoundary: "checkpoint",
  });
  const completed = {
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeState: "completed",
    currentAction: current("archive", "terminal"),
    terminalRunContext: pair.context,
    terminalResult: pair.result,
    ownerCorrection: null,
  };
  assert.deepEqual(evaluatePolicyAndNextBoundary(completed), {
    kind: "ready-checkpoint-evaluation",
  });
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      ...completed,
      terminalResult: { ...pair.result, nextBoundary: "apply" },
    }),
    { kind: "blocked", reason: "reported-boundary-conflict" },
  );
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({ ...completed, changeState: "active" }),
    { kind: "blocked", reason: "archive-completion-state-mismatch" },
  );
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      ...completed,
      changeState: "planned",
      currentAction: null,
      terminalRunContext: null,
      terminalResult: null,
    }),
    { kind: "blocked", reason: "change-not-active" },
  );
});

test("binds terminal outcome to exact current Run occurrence before reading it", () => {
  const fresh = terminalPair("review-explore", 31, {
    reviewerVerdict: "approved",
    nextBoundary: "propose",
  });
  const stale = terminalPair("review-explore", 30, {
    reviewerVerdict: "changes-requested",
    nextBoundary: "revise-explore",
  });
  const input = {
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeState: "active",
    currentAction: current("review-explore", "terminal"),
    terminalRunContext: fresh.context,
    terminalResult: fresh.result,
    ownerCorrection: null,
  };
  assert.deepEqual(evaluatePolicyAndNextBoundary(input), {
    kind: "ready-action",
    actionId: "propose",
  });
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({ ...input, terminalResult: stale.result }),
    { kind: "blocked", reason: "terminal-result-missing-or-mismatched" },
  );
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({ ...input, terminalRunContext: null }),
    { kind: "blocked", reason: "terminal-result-missing-or-mismatched" },
  );
});

test("blocks unsuccessful outcomes and reported handoff drift deterministically", () => {
  const authorFail = activeTerminal("apply", 40, {
    authorConclusion: "FAIL",
    nextBoundary: "review-apply",
  });
  assert.deepEqual(evaluatePolicyAndNextBoundary(authorFail), {
    kind: "blocked",
    reason: "unrecognized-or-unsuccessful-author-outcome",
  });

  const reviewerUnknown = activeTerminal("review-propose", 41, {
    reviewerVerdict: "maybe",
    nextBoundary: "apply",
  });
  assert.deepEqual(evaluatePolicyAndNextBoundary(reviewerUnknown), {
    kind: "blocked",
    reason: "unrecognized-reviewer-verdict",
  });

  const conflict = activeTerminal("explore", 42, {
    authorConclusion: "PASS",
    nextBoundary: "propose",
  });
  const first = evaluatePolicyAndNextBoundary(conflict);
  const second = evaluatePolicyAndNextBoundary(conflict);
  assert.deepEqual(first, {
    kind: "blocked",
    reason: "reported-boundary-conflict",
  });
  assert.deepEqual(second, first);
});

test("rejects malformed or contradictory raw Policy input without normalization", () => {
  const base = {
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeState: "active",
    currentAction: null,
    terminalRunContext: null,
    terminalResult: null,
  };
  assert.deepEqual(evaluatePolicyAndNextBoundary({ ...base, extra: true }), {
    kind: "blocked",
    reason: "invalid-policy-input",
  });
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({ ...base, changeState: "running" }),
    {
      kind: "blocked",
      reason: "invalid-policy-input",
    },
  );
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      ...base,
      currentAction: current("explore", "prepared"),
      terminalResult: terminalPair("explore", 50).result,
    }),
    { kind: "blocked", reason: "invalid-policy-input" },
  );
});
