import assert from "node:assert/strict";
import test from "node:test";

import {
  STANDARD_ACTIONS,
  admitActionResult,
  expectedExecutionRoleForAction,
  formActionPackage,
  isActionPackage,
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

test("forms minimal prepared and resumed packages from exact current facts", () => {
  for (const state of ["prepared", "resumed"] as const) {
    const current = currentAction("apply", state);
    const currentContext = context(46, "apply", {
      lifecycleState: state,
      previousRunId: "20260826-045-review-propose",
    });
    const formed = formActionPackage(current, currentContext);

    assert.notEqual(formed, null);
    assert.equal(isActionPackage(formed), true);
    assert.equal(formed!.runId, currentContext.runId);
    assert.deepEqual(formed!.occurrence, currentContext.occurrence);
    assert.deepEqual(formed!.actionIdentity, current.identity);
    assert.equal(formed!.role, "author");
    assert.equal(formed!.lifecycleState, state);
    assert.equal(formed!.previousRunId, currentContext.previousRunId);
  }
});

test("formation fails closed for terminal, null, identity, state or role mismatch", () => {
  const exact = currentAction("apply", "prepared");
  const exactContext = context(46, "apply");

  assert.equal(
    formActionPackage(currentAction("apply", "terminal"), exactContext),
    null,
  );
  assert.equal(
    formActionPackage(exact, { ...exactContext, lifecycleState: null }),
    null,
  );
  assert.equal(
    formActionPackage(exact, {
      ...exactContext,
      actionIdentity: identity("revise-apply"),
    }),
    null,
  );
  assert.equal(
    formActionPackage(exact, { ...exactContext, lifecycleState: "resumed" }),
    null,
  );
  assert.equal(
    formActionPackage(exact, { ...exactContext, role: "reviewer" }),
    null,
  );
});

test("ActionPackage validator rejects terminal and role-invalid packages", () => {
  assert.equal(isActionPackage(context(46, "apply")), true);
  assert.equal(
    isActionPackage(context(46, "apply", { lifecycleState: "terminal" })),
    false,
  );
  assert.equal(
    isActionPackage(context(46, "apply", { role: "reviewer" })),
    false,
  );
});

test("admits exact prepared and resumed results and preserves opaque nextBoundary", () => {
  for (const state of ["prepared", "resumed"] as const) {
    const current = currentAction("apply", state);
    const runOccurrence = occurrence(46, "apply");
    const actionPackage = formActionPackage(
      current,
      context(46, "apply", { lifecycleState: state }),
    )!;
    const candidate = result(46, "apply", { nextBoundary: "review-apply" });

    assert.equal(
      admitActionResult(actionPackage, current, runOccurrence, candidate),
      candidate,
    );
    assert.equal(candidate.nextBoundary, "review-apply");
    assert.equal(current.state, state);
  }
});

test("rejects stale prepared-to-resumed package without changing Action identity", () => {
  const prepared = currentAction("apply", "prepared");
  const stalePackage = formActionPackage(prepared, context(46, "apply"))!;
  const resumed = currentAction("apply", "resumed");

  assert.equal(
    admitActionResult(
      stalePackage,
      resumed,
      occurrence(46, "apply"),
      result(46, "apply"),
    ),
    null,
  );
});

test("rejects stale prior occurrence of the same Standard Action", () => {
  const current = currentAction("review-explore", "prepared");
  const stalePackage = formActionPackage(
    current,
    context(37, "review-explore"),
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
  const current = currentAction("apply", "prepared");
  const actionPackage = formActionPackage(current, context(46, "apply"))!;

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
  const authorPackage = formActionPackage(authorCurrent, context(46, "apply"))!;
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
    const actionPackage = formActionPackage(current, context(46, actionId))!;
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
