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

function event(type: "prepare" | "terminal", identity: ActionIdentity) {
  return { type, identity } as const;
}

test("accepts exactly prepared and terminal lifecycle states", () => {
  assert.deepEqual(ACTION_LIFECYCLE_STATES, ["prepared", "terminal"]);
  for (const state of ACTION_LIFECYCLE_STATES) {
    assert.equal(isActionLifecycleState(state), true);
  }
  for (const state of [
    "resumed",
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

test("validates canonical ActionIdentity and CurrentAction without normalization", () => {
  assert.equal(isActionIdentity(identityA), true);
  assert.equal(isCurrentAction(current(identityA, "prepared")), true);
  assert.equal(isCurrentAction(current(identityA, "terminal")), true);
  assert.equal(
    isCurrentAction({ identity: identityA, state: "resumed" }),
    false,
  );
  assert.equal(isActionIdentity({ ...identityA, actionId: "execute" }), false);
  assert.equal(isActionIdentity({ ...identityA, runId: "run-1" }), false);
});

test("prepares an empty slot and terminalizes the exact prepared Action", () => {
  const prepared = transitionCurrentAction(null, event("prepare", identityA));
  assert.deepEqual(prepared, current(identityA, "prepared"));
  assert.deepEqual(
    transitionCurrentAction(prepared, event("terminal", { ...identityA })),
    current(identityA, "terminal"),
  );
});

test("rejects removed resume events and malformed lifecycle inputs", () => {
  assert.equal(
    transitionCurrentAction(current(identityA, "prepared"), {
      type: "resume",
      identity: identityA,
    }),
    null,
  );
  assert.equal(
    transitionCurrentAction(
      { identity: identityA, state: "resumed" },
      event("terminal", identityA),
    ),
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
});

test("rejects duplicate or replacement prepare over a prepared Action", () => {
  const preparedA = current(identityA, "prepared");
  assert.equal(
    transitionCurrentAction(preparedA, event("prepare", identityA)),
    null,
  );
  assert.equal(
    transitionCurrentAction(preparedA, event("prepare", identityB)),
    null,
  );
});

test("rejects terminal from empty or identity mismatch", () => {
  assert.equal(
    transitionCurrentAction(null, event("terminal", identityA)),
    null,
  );
  assert.equal(
    transitionCurrentAction(
      current(identityA, "prepared"),
      event("terminal", identityB),
    ),
    null,
  );
});

test("keeps terminal absorbing for same identity", () => {
  const terminalA = current(identityA, "terminal");
  assert.equal(
    transitionCurrentAction(terminalA, event("terminal", identityA)),
    null,
  );
  assert.equal(
    transitionCurrentAction(terminalA, event("prepare", identityA)),
    null,
  );
});

test("allows terminal replacement only for a different canonical identity", () => {
  const terminalA = current(identityA, "terminal");
  assert.deepEqual(
    transitionCurrentAction(terminalA, event("prepare", identityB)),
    current(identityB, "prepared"),
  );
});

test("uses semantic equality and remains pure", () => {
  const preparedA = current(identityA, "prepared");
  const terminalA = event("terminal", { ...identityA });
  const beforeCurrent = structuredClone(preparedA);
  const beforeEvent = structuredClone(terminalA);

  const accepted = transitionCurrentAction(preparedA, terminalA);
  assert.deepEqual(accepted, current(identityA, "terminal"));
  assert.deepEqual(preparedA, beforeCurrent);
  assert.deepEqual(terminalA, beforeEvent);
  assert.notEqual(accepted, preparedA);
});

test("encodes structural lifecycle only, not Policy or authority", async () => {
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
});
