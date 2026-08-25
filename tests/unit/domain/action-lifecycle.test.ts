import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTION_LIFECYCLE_STATES,
  isActionIdentity,
  isActionLifecycleState,
  isCurrentAction,
  transitionCurrentAction,
  type ActionIdentity,
  type CurrentAction,
} from "../../../src/domain/index.js";

const identityA: ActionIdentity = {
  deliveryId: "20260824-01-foundation-lifecycle-kernel",
  changeId: "establish-action-lifecycle-domain-contract",
  actionId: "apply",
};

const identityB: ActionIdentity = {
  deliveryId: "20260824-01-foundation-lifecycle-kernel",
  changeId: "establish-action-lifecycle-domain-contract",
  actionId: "review-apply",
};

function current(
  identity: ActionIdentity,
  state: CurrentAction["state"],
): CurrentAction {
  return { identity, state };
}

function event(
  type: "prepare" | "resume" | "terminal",
  identity: ActionIdentity,
) {
  return { type, identity } as const;
}

test("accepts exactly the closed Action lifecycle state literals", () => {
  assert.deepEqual(ACTION_LIFECYCLE_STATES, [
    "prepared",
    "resumed",
    "terminal",
  ]);
  for (const state of ACTION_LIFECYCLE_STATES) {
    assert.equal(isActionLifecycleState(state), true);
  }
  for (const state of [
    "pending",
    "running",
    "completed",
    "PREPARED",
    "",
    1,
    null,
  ]) {
    assert.equal(isActionLifecycleState(state), false);
  }
});

test("validates canonical ActionIdentity without normalization or extra identity", () => {
  assert.equal(isActionIdentity(identityA), true);
  assert.equal(
    isActionIdentity({
      ...identityA,
      deliveryId: " Delivery-Id ",
    }),
    false,
  );
  assert.equal(
    isActionIdentity({
      ...identityA,
      changeId: "Change_Id",
    }),
    false,
  );
  assert.equal(isActionIdentity({ ...identityA, actionId: "execute" }), false);
  assert.equal(isActionIdentity({ ...identityA, runId: "run-1" }), false);
  assert.equal(
    isActionIdentity({ deliveryId: identityA.deliveryId, actionId: "apply" }),
    false,
  );
});

test("validates CurrentAction as exactly canonical identity plus lifecycle state", () => {
  assert.equal(isCurrentAction(current(identityA, "prepared")), true);
  assert.equal(isCurrentAction(current(identityA, "resumed")), true);
  assert.equal(isCurrentAction(current(identityA, "terminal")), true);
  assert.equal(
    isCurrentAction({ identity: identityA, state: "running" }),
    false,
  );
  assert.equal(
    isCurrentAction({ identity: identityA, state: "prepared", extra: true }),
    false,
  );
});

test("uses semantic field equality rather than object reference identity", () => {
  const copyA: ActionIdentity = JSON.parse(
    JSON.stringify(identityA),
  ) as ActionIdentity;
  assert.notEqual(copyA, identityA);
  assert.deepEqual(copyA, identityA);

  assert.deepEqual(
    transitionCurrentAction(
      current(identityA, "prepared"),
      event("resume", copyA),
    ),
    current(identityA, "resumed"),
  );
  assert.deepEqual(
    transitionCurrentAction(
      current(identityA, "resumed"),
      event("terminal", copyA),
    ),
    current(identityA, "terminal"),
  );
});

test("implements the accepted prepare/resume/terminal transition matrix", () => {
  assert.deepEqual(
    transitionCurrentAction(null, event("prepare", identityA)),
    current(identityA, "prepared"),
  );
  assert.deepEqual(
    transitionCurrentAction(
      current(identityA, "prepared"),
      event("resume", identityA),
    ),
    current(identityA, "resumed"),
  );
  assert.deepEqual(
    transitionCurrentAction(
      current(identityA, "resumed"),
      event("resume", identityA),
    ),
    current(identityA, "resumed"),
  );
  assert.deepEqual(
    transitionCurrentAction(
      current(identityA, "prepared"),
      event("terminal", identityA),
    ),
    current(identityA, "terminal"),
  );
  assert.deepEqual(
    transitionCurrentAction(
      current(identityA, "resumed"),
      event("terminal", identityA),
    ),
    current(identityA, "terminal"),
  );
});

test("rejects prepare over any non-terminal current Action", () => {
  for (const state of ["prepared", "resumed"] as const) {
    assert.equal(
      transitionCurrentAction(
        current(identityA, state),
        event("prepare", identityA),
      ),
      null,
    );
    assert.equal(
      transitionCurrentAction(
        current(identityA, state),
        event("prepare", identityB),
      ),
      null,
    );
  }
});

test("rejects empty resume/terminal and non-terminal identity mismatch", () => {
  assert.equal(transitionCurrentAction(null, event("resume", identityA)), null);
  assert.equal(
    transitionCurrentAction(null, event("terminal", identityA)),
    null,
  );

  for (const state of ["prepared", "resumed"] as const) {
    assert.equal(
      transitionCurrentAction(
        current(identityA, state),
        event("resume", identityB),
      ),
      null,
    );
    assert.equal(
      transitionCurrentAction(
        current(identityA, state),
        event("terminal", identityB),
      ),
      null,
    );
  }
});

test("keeps terminal absorbing for the same or mismatched terminal/resume target", () => {
  const terminalA = current(identityA, "terminal");
  for (const target of [identityA, identityB]) {
    assert.equal(
      transitionCurrentAction(terminalA, event("resume", target)),
      null,
    );
    assert.equal(
      transitionCurrentAction(terminalA, event("terminal", target)),
      null,
    );
  }
  assert.equal(
    transitionCurrentAction(terminalA, event("prepare", identityA)),
    null,
  );
});

test("allows atomic terminal replacement only for a different canonical semantic identity", () => {
  const terminalA = current(identityA, "terminal");
  assert.deepEqual(
    transitionCurrentAction(terminalA, event("prepare", identityB)),
    current(identityB, "prepared"),
  );

  const differentChange: ActionIdentity = {
    ...identityA,
    changeId: "another-change",
  };
  assert.deepEqual(
    transitionCurrentAction(terminalA, event("prepare", differentChange)),
    current(differentChange, "prepared"),
  );
});

test("rejects malformed current/event input without normalization", () => {
  assert.equal(
    transitionCurrentAction(undefined, event("prepare", identityA)),
    null,
  );
  assert.equal(
    transitionCurrentAction(
      { identity: identityA, state: "running" },
      event("prepare", identityB),
    ),
    null,
  );
  assert.equal(
    transitionCurrentAction(null, {
      type: "prepare",
      identity: { ...identityA, actionId: "APPLY" },
    }),
    null,
  );
  assert.equal(
    transitionCurrentAction(null, {
      type: "prepare",
      identity: identityA,
      extra: true,
    }),
    null,
  );
  assert.equal(
    transitionCurrentAction(null, { type: "start", identity: identityA }),
    null,
  );
});

test("is pure and does not mutate accepted or rejected inputs", () => {
  const currentA = current(identityA, "prepared");
  const resumeA = event("resume", identityA);
  const beforeCurrent = structuredClone(currentA);
  const beforeEvent = structuredClone(resumeA);

  const accepted = transitionCurrentAction(currentA, resumeA);
  assert.deepEqual(currentA, beforeCurrent);
  assert.deepEqual(resumeA, beforeEvent);
  assert.notEqual(accepted, currentA);
  assert.notEqual(accepted?.identity, currentA.identity);

  const prepareB = event("prepare", identityB);
  const beforeRejectedEvent = structuredClone(prepareB);
  assert.equal(transitionCurrentAction(currentA, prepareB), null);
  assert.deepEqual(currentA, beforeCurrent);
  assert.deepEqual(prepareB, beforeRejectedEvent);
});

test("provides structural legality only and encodes no authority or Standard Action next ordering", async () => {
  const lifecycle = await import("../../../src/domain/action-lifecycle.js");
  for (const forbiddenApi of [
    "OwnerAuthorityFact",
    "reviewVerdict",
    "verification",
    "openspecStatus",
    "eligible",
    "nextAction",
  ]) {
    assert.equal(forbiddenApi in lifecycle, false);
  }

  const terminalReview = current(
    { ...identityA, actionId: "review-propose" },
    "terminal",
  );
  const structurallyDifferentButNotPolicyDerived: ActionIdentity = {
    ...identityA,
    actionId: "explore",
  };
  assert.deepEqual(
    transitionCurrentAction(
      terminalReview,
      event("prepare", structurallyDifferentButNotPolicyDerived),
    ),
    current(structurallyDifferentButNotPolicyDerived, "prepared"),
  );

  assert.equal(
    transitionCurrentAction(null, {
      ...event("prepare", identityA),
      ownerAuthority: { decision: "authorize-apply" },
    }),
    null,
  );
});
