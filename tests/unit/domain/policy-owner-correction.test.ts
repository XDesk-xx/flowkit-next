import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluatePolicyAndNextBoundary,
  type OwnerAuthorityFact,
  type RunContextRecord,
  type RunResultRecord,
  type StandardActionId,
} from "../../../src/domain/index.js";

const DELIVERY = "delivery-one";
const CHANGE = "policy-change";

function authority(requestedAction: StandardActionId): OwnerAuthorityFact {
  return {
    ref: `owner:${"a".repeat(64)}`,
    decision: "revise-action",
    deliveryId: DELIVERY,
    changeId: CHANGE,
    sourceRef: "owner-input:policy-correction",
    scope: [requestedAction],
  };
}

function normalFor(actionId: StandardActionId): {
  authorConclusion: string | null;
  reviewerVerdict: string | null;
  nextBoundary: StandardActionId;
} {
  switch (actionId) {
    case "explore":
    case "revise-explore":
      return {
        authorConclusion: "PASS",
        reviewerVerdict: null,
        nextBoundary: "review-explore",
      };
    case "review-explore":
      return {
        authorConclusion: null,
        reviewerVerdict: "approved",
        nextBoundary: "propose",
      };
    case "propose":
    case "revise-propose":
      return {
        authorConclusion: "PASS",
        reviewerVerdict: null,
        nextBoundary: "review-propose",
      };
    case "review-propose":
      return {
        authorConclusion: null,
        reviewerVerdict: "approved",
        nextBoundary: "apply",
      };
    case "apply":
    case "revise-apply":
      return {
        authorConclusion: "PASS",
        reviewerVerdict: null,
        nextBoundary: "review-apply",
      };
    case "review-apply":
      return {
        authorConclusion: null,
        reviewerVerdict: "approved",
        nextBoundary: "archive",
      };
    case "archive":
      return {
        authorConclusion: "PASS",
        reviewerVerdict: null,
        nextBoundary: "archive",
      };
  }
}

function terminalFacts(actionId: StandardActionId, sequence: number) {
  const normal = normalFor(actionId);
  const runId = `20260827-${String(sequence).padStart(3, "0")}-${actionId}`;
  const identity = {
    deliveryId: DELIVERY,
    changeId: CHANGE,
    actionId,
  } as const;
  const context: RunContextRecord = {
    runId,
    occurrence: { date: "20260827", sequence, actionId },
    actionIdentity: identity,
    role: actionId.startsWith("review-") ? "reviewer" : "author",
    lifecycleState: "terminal",
    ownerAuthority: null,
    previousRunId: null,
  };
  const result: RunResultRecord = {
    runId,
    actionIdentity: identity,
    authorConclusion: normal.authorConclusion,
    reviewerVerdict: normal.reviewerVerdict,
    verificationVerdict: null,
    nextBoundary: normal.nextBoundary,
    facts: {},
  };
  return { normal, context, result };
}

function withCorrection(
  actionId: StandardActionId,
  requestedAction: StandardActionId,
  sequence: number,
  correctionAuthority: unknown = authority(requestedAction),
) {
  const { context, result } = terminalFacts(actionId, sequence);
  return {
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeState: "active",
    currentAction: {
      identity: { deliveryId: DELIVERY, changeId: CHANGE, actionId },
      state: "terminal",
    },
    terminalRunContext: context,
    terminalResult: result,
    ownerCorrection: {
      requestedAction,
      authority: correctionAuthority,
    },
  };
}

test("allows the fifteen reached-stage Owner corrections that lifecycle can enter", () => {
  const stages: Array<[StandardActionId[], StandardActionId[]]> = [
    [["explore", "revise-explore", "review-explore"], ["revise-explore"]],
    [
      ["propose", "revise-propose", "review-propose"],
      ["revise-propose", "revise-explore"],
    ],
    [
      ["apply", "revise-apply", "review-apply"],
      ["revise-apply", "revise-propose", "revise-explore"],
    ],
  ];
  let sequence = 100;
  let readyCount = 0;
  let sameReviseBlocked = 0;

  for (const [currentActions, requestedActions] of stages) {
    for (const currentAction of currentActions) {
      for (const requestedAction of requestedActions) {
        const decision = evaluatePolicyAndNextBoundary(
          withCorrection(currentAction, requestedAction, sequence++),
        );
        if (currentAction === requestedAction) {
          assert.deepEqual(decision, {
            kind: "blocked",
            reason: "action-boundary-not-enterable",
          });
          sameReviseBlocked += 1;
        } else {
          assert.deepEqual(decision, {
            kind: "ready-action",
            actionId: requestedAction,
          });
          readyCount += 1;
        }
      }
    }
  }

  assert.equal(readyCount, 15);
  assert.equal(sameReviseBlocked, 3);
});

test("requires exact matching revise-action Owner authority", () => {
  const missing = withCorrection("explore", "revise-explore", 200, null);
  assert.deepEqual(evaluatePolicyAndNextBoundary(missing), {
    kind: "blocked",
    reason: "owner-authority-required",
  });

  const malformed = withCorrection("explore", "revise-explore", 201, {
    ref: "bad",
  });
  assert.deepEqual(evaluatePolicyAndNextBoundary(malformed), {
    kind: "blocked",
    reason: "owner-authority-rejected",
  });

  const wrongDecision = {
    ...authority("revise-explore"),
    decision: "authorize-apply",
  };
  assert.deepEqual(
    evaluatePolicyAndNextBoundary(
      withCorrection("explore", "revise-explore", 202, wrongDecision),
    ),
    { kind: "blocked", reason: "owner-authority-rejected" },
  );

  const wrongScope = {
    ...authority("revise-explore"),
    scope: ["revise-propose"],
  };
  assert.deepEqual(
    evaluatePolicyAndNextBoundary(
      withCorrection("explore", "revise-explore", 203, wrongScope),
    ),
    { kind: "blocked", reason: "owner-authority-rejected" },
  );
});

test("rejects forward skip, prepared switching, archive reopening and completed correction", () => {
  assert.deepEqual(
    evaluatePolicyAndNextBoundary(
      withCorrection("review-explore", "revise-propose", 210),
    ),
    { kind: "blocked", reason: "unsupported-owner-correction" },
  );

  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeState: "active",
      currentAction: {
        identity: {
          deliveryId: DELIVERY,
          changeId: CHANGE,
          actionId: "propose",
        },
        state: "prepared",
      },
      terminalRunContext: null,
      terminalResult: null,
      ownerCorrection: {
        requestedAction: "revise-explore",
        authority: authority("revise-explore"),
      },
    }),
    { kind: "blocked", reason: "unsupported-owner-correction" },
  );

  const archived = terminalFacts("archive", 211);
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeState: "completed",
      currentAction: {
        identity: {
          deliveryId: DELIVERY,
          changeId: CHANGE,
          actionId: "archive",
        },
        state: "terminal",
      },
      terminalRunContext: archived.context,
      terminalResult: { ...archived.result, nextBoundary: "checkpoint" },
      ownerCorrection: {
        requestedAction: "revise-apply",
        authority: authority("revise-apply"),
      },
    }),
    { kind: "blocked", reason: "unsupported-owner-correction" },
  );
});

test("reported-boundary conflict wins before a valid Owner correction", () => {
  const input = withCorrection("explore", "revise-explore", 220);
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      ...input,
      terminalResult: { ...input.terminalResult, nextBoundary: "propose" },
    }),
    { kind: "blocked", reason: "reported-boundary-conflict" },
  );
});

test("does not treat normal apply/archive readiness as Owner execution authority", () => {
  const reviewPropose = terminalFacts("review-propose", 230);
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeState: "active",
      currentAction: {
        identity: {
          deliveryId: DELIVERY,
          changeId: CHANGE,
          actionId: "review-propose",
        },
        state: "terminal",
      },
      terminalRunContext: reviewPropose.context,
      terminalResult: reviewPropose.result,
      ownerCorrection: null,
    }),
    { kind: "ready-action", actionId: "apply" },
  );

  const reviewApply = terminalFacts("review-apply", 231);
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeState: "active",
      currentAction: {
        identity: {
          deliveryId: DELIVERY,
          changeId: CHANGE,
          actionId: "review-apply",
        },
        state: "terminal",
      },
      terminalRunContext: reviewApply.context,
      terminalResult: reviewApply.result,
      ownerCorrection: null,
    }),
    { kind: "ready-action", actionId: "archive" },
  );
});
