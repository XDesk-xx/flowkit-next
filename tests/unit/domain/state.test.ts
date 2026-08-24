import assert from "node:assert/strict";
import test from "node:test";

import {
  CHANGE_STATES,
  DELIVERY_STATES,
  isChangeState,
  isDeliveryState,
} from "../../../src/domain/index.js";

test("accepts exactly the closed Delivery structural state literals", () => {
  assert.deepEqual(DELIVERY_STATES, ["active", "completed", "cancelled"]);
  for (const state of DELIVERY_STATES)
    assert.equal(isDeliveryState(state), true);
  for (const state of ["planned", "terminal", "ACTIVE", ""])
    assert.equal(isDeliveryState(state), false);
});

test("accepts exactly the closed Change structural state literals", () => {
  assert.deepEqual(CHANGE_STATES, [
    "planned",
    "active",
    "completed",
    "cancelled",
  ]);
  for (const state of CHANGE_STATES) assert.equal(isChangeState(state), true);
  for (const state of ["prepared", "resumed", "terminal", "ACTIVE", ""]) {
    assert.equal(isChangeState(state), false);
  }
});

test("state module does not expose Action lifecycle transition machinery", async () => {
  const state = await import("../../../src/domain/state.js");
  assert.equal("canTransition" in state, false);
  assert.equal("ACTION_STATES" in state, false);
});
