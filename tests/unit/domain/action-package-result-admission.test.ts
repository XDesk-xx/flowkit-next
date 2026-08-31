import assert from "node:assert/strict";
import test from "node:test";

import {
  STANDARD_ACTIONS,
  admitActionResult,
  canonicalActionGuidancePath,
  expectedExecutionRoleForAction,
  formActionPackage,
  isActionPackage,
  type ActionGuidanceRef,
  type ActionIdentity,
  type CurrentAction,
  type RunContextRecord,
  type RunOccurrence,
  type RunResultRecord,
  type StandardActionId,
} from "../../../src/domain/index.js";

const deliveryId = "20260824-01-foundation-lifecycle-kernel";
const changeId = "establish-action-package-and-result-admission";

function identity(actionId: StandardActionId): ActionIdentity {
  return { deliveryId, changeId, actionId };
}

function occurrence(
  sequence: number,
  actionId: StandardActionId,
): RunOccurrence {
  return { date: "20260826", sequence, actionId };
}

function runId(sequence: number, actionId: StandardActionId): string {
  return `20260826-${String(sequence).padStart(3, "0")}-${actionId}`;
}

function currentAction(
  actionId: StandardActionId,
  state: CurrentAction["state"] = "prepared",
): CurrentAction {
  return { identity: identity(actionId), state };
}

function context(
  sequence: number,
  actionId: StandardActionId,
  options: Partial<RunContextRecord> = {},
): RunContextRecord {
  return {
    runId: runId(sequence, actionId),
    occurrence: occurrence(sequence, actionId),
    actionIdentity: identity(actionId),
    role: expectedExecutionRoleForAction(actionId)!,
    lifecycleState: "prepared",
    ownerAuthority: null,
    previousRunId: null,
    ...options,
  };
}

function guidanceRef(
  actionId: StandardActionId,
  contentSha256 = "a".repeat(64),
): ActionGuidanceRef {
  return {
    path: canonicalActionGuidancePath(actionId)!,
    contentSha256,
  };
}

function result(
  sequence: number,
  actionId: StandardActionId,
  options: Partial<RunResultRecord> = {},
): RunResultRecord {
  const reviewer = expectedExecutionRoleForAction(actionId) === "reviewer";
  return {
    runId: runId(sequence, actionId),
    actionIdentity: identity(actionId),
    authorConclusion: reviewer ? null : "PASS",
    reviewerVerdict: reviewer ? "approved" : null,
    verificationVerdict: null,
    nextBoundary: reviewer ? "apply" : "review-apply",
    facts: { stable: true },
    ...options,
  };
}

test("maps every Standard Action to one closed execution role", () => {
  const reviewerActions = new Set<StandardActionId>([
    "review-explore",
    "review-propose",
    "review-apply",
  ]);

  for (const actionId of STANDARD_ACTIONS) {
    assert.equal(
      expectedExecutionRoleForAction(actionId),
      reviewerActions.has(actionId) ? "reviewer" : "author",
    );
  }
  assert.equal(expectedExecutionRoleForAction("verify"), null);
});

test("forms a minimal prepared package from exact current facts", () => {
  const current = currentAction("apply");
  const currentContext = context(46, "apply", {
    previousRunId: "20260826-045-review-propose",
  });
  const formed = formActionPackage(
    current,
    currentContext,
    guidanceRef("apply"),
  );

  assert.notEqual(formed, null);
  assert.equal(isActionPackage(formed), true);
  assert.equal(formed!.runId, currentContext.runId);
  assert.deepEqual(formed!.occurrence, currentContext.occurrence);
  assert.deepEqual(formed!.actionIdentity, current.identity);
  assert.equal(formed!.role, "author");
  assert.equal(formed!.lifecycleState, "prepared");
  assert.equal(formed!.previousRunId, currentContext.previousRunId);
  assert.deepEqual(formed!.guidanceRef, guidanceRef("apply"));
});

test("formation rejects terminal, removed resumed, null, identity, state or role mismatch", () => {
  const exact = currentAction("apply");
  const exactContext = context(46, "apply");

  assert.equal(
    formActionPackage(
      currentAction("apply", "terminal"),
      exactContext,
      guidanceRef("apply"),
    ),
    null,
  );
  assert.equal(
    formActionPackage(
      exact,
      { ...exactContext, lifecycleState: null },
      guidanceRef("apply"),
    ),
    null,
  );
  assert.equal(
    formActionPackage(
      exact,
      {
        ...exactContext,
        actionIdentity: identity("revise-apply"),
      },
      guidanceRef("apply"),
    ),
    null,
  );
  assert.equal(
    formActionPackage(
      exact,
      { ...exactContext, lifecycleState: "resumed" },
      guidanceRef("apply"),
    ),
    null,
  );
  assert.equal(
    formActionPackage(
      exact,
      { ...exactContext, role: "reviewer" },
      guidanceRef("apply"),
    ),
    null,
  );
});

test("formation rejects missing, malformed, and wrong-Action Guidance identity", () => {
  const exact = currentAction("apply");
  const exactContext = context(46, "apply");

  assert.equal(formActionPackage(exact, exactContext, null), null);
  assert.equal(
    formActionPackage(exact, exactContext, {
      path: "skills/actions/apply/SKILL.md",
      contentSha256: "not-a-sha",
    }),
    null,
  );
  assert.equal(
    formActionPackage(exact, exactContext, guidanceRef("review-apply")),
    null,
  );
});

test("ActionPackage validator accepts only the exact prepared Guidance-bound envelope", () => {
  const valid = {
    ...context(46, "apply"),
    guidanceRef: guidanceRef("apply"),
  };
  assert.equal(isActionPackage(valid), true);
  assert.equal(isActionPackage(context(46, "apply")), false);
  assert.equal(isActionPackage({ ...valid, unexpected: true }), false);
  assert.equal(
    isActionPackage({ ...valid, lifecycleState: "terminal" }),
    false,
  );
  assert.equal(isActionPackage({ ...valid, lifecycleState: "resumed" }), false);
  assert.equal(isActionPackage({ ...valid, role: "reviewer" }), false);
  assert.equal(
    isActionPackage({ ...valid, guidanceRef: guidanceRef("review-apply") }),
    false,
  );
  assert.equal(
    isActionPackage({
      ...valid,
      guidanceRef: { ...guidanceRef("apply"), contentSha256: "ABC" },
    }),
    false,
  );
});

test("admits exact prepared results and preserves opaque nextBoundary", () => {
  const current = currentAction("apply");
  const runOccurrence = occurrence(46, "apply");
  const actionPackage = formActionPackage(
    current,
    context(46, "apply"),
    guidanceRef("apply"),
  )!;
  const candidate = result(46, "apply", { nextBoundary: "review-apply" });

  assert.equal(
    admitActionResult(actionPackage, current, runOccurrence, candidate),
    candidate,
  );
  assert.equal(candidate.nextBoundary, "review-apply");
  assert.equal(current.state, "prepared");
});

test("rejects removed resumed current state at admission", () => {
  const current = currentAction("apply");
  const actionPackage = formActionPackage(
    current,
    context(46, "apply"),
    guidanceRef("apply"),
  )!;
  assert.equal(
    admitActionResult(
      actionPackage,
      { identity: identity("apply"), state: "resumed" },
      occurrence(46, "apply"),
      result(46, "apply"),
    ),
    null,
  );
});

test("rejects stale prior occurrence of the same Standard Action", () => {
  const current = currentAction("review-explore");
  const stalePackage = formActionPackage(
    current,
    context(37, "review-explore"),
    guidanceRef("review-explore"),
  )!;

  assert.equal(
    admitActionResult(
      stalePackage,
      current,
      occurrence(39, "review-explore"),
      result(37, "review-explore"),
    ),
    null,
  );
});

test("rejects wrong candidate Run or Action linkage", () => {
  const current = currentAction("apply");
  const actionPackage = formActionPackage(
    current,
    context(46, "apply"),
    guidanceRef("apply"),
  )!;

  assert.equal(
    admitActionResult(
      actionPackage,
      current,
      occurrence(46, "apply"),
      result(47, "apply"),
    ),
    null,
  );
  assert.equal(
    admitActionResult(actionPackage, current, occurrence(46, "apply"), {
      ...result(46, "apply"),
      actionIdentity: identity("revise-apply"),
    }),
    null,
  );
});

test("enforces Author and Reviewer outcome-slot ownership", () => {
  const authorCurrent = currentAction("apply");
  const authorPackage = formActionPackage(
    authorCurrent,
    context(46, "apply"),
    guidanceRef("apply"),
  )!;
  assert.notEqual(
    admitActionResult(
      authorPackage,
      authorCurrent,
      occurrence(46, "apply"),
      result(46, "apply"),
    ),
    null,
  );
  assert.equal(
    admitActionResult(
      authorPackage,
      authorCurrent,
      occurrence(46, "apply"),
      result(46, "apply", { reviewerVerdict: "approved" }),
    ),
    null,
  );

  const reviewerCurrent = currentAction("review-apply");
  const reviewerPackage = formActionPackage(
    reviewerCurrent,
    context(47, "review-apply"),
    guidanceRef("review-apply"),
  )!;
  assert.notEqual(
    admitActionResult(
      reviewerPackage,
      reviewerCurrent,
      occurrence(47, "review-apply"),
      result(47, "review-apply"),
    ),
    null,
  );
  assert.equal(
    admitActionResult(
      reviewerPackage,
      reviewerCurrent,
      occurrence(47, "review-apply"),
      result(47, "review-apply", { authorConclusion: "PASS" }),
    ),
    null,
  );
});

test("rejects formal Verification verdict from every Standard Action", () => {
  for (const actionId of STANDARD_ACTIONS) {
    const current = currentAction(actionId);
    const actionPackage = formActionPackage(
      current,
      context(46, actionId),
      guidanceRef(actionId),
    )!;
    assert.equal(
      admitActionResult(
        actionPackage,
        current,
        occurrence(46, actionId),
        result(46, actionId, { verificationVerdict: "PASS" }),
      ),
      null,
    );
  }
});
