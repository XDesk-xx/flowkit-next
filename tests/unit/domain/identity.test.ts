import assert from "node:assert/strict";
import test from "node:test";

import {
  STANDARD_ACTIONS,
  asChangeId,
  asDeliveryId,
  getChangeId,
  isSemanticId,
  isStandardActionId,
  type ChangeIdentityView,
} from "../../../src/domain/index.js";

test("accepts current canonical Delivery and Change semantic ids", () => {
  assert.equal(
    asDeliveryId("20260824-01-foundation-lifecycle-kernel"),
    "20260824-01-foundation-lifecycle-kernel",
  );
  assert.equal(
    asChangeId("establish-lifecycle-authority-and-identity-contracts"),
    "establish-lifecycle-authority-and-identity-contracts",
  );
});

test("rejects malformed semantic ids without normalization or aliases", () => {
  const invalid = [
    "",
    "Foundation",
    "change_id",
    "change.id",
    "change/id",
    "change\\id",
    " change",
    "change ",
    "-change",
    "change-",
    "change--id",
    "a".repeat(129),
  ];
  for (const value of invalid) assert.equal(isSemanticId(value), false, value);
  assert.equal(asChangeId(" Change-Id "), null);
});

test("recognizes exactly the ten Standard Action identities", () => {
  assert.equal(STANDARD_ACTIONS.length, 10);
  for (const action of STANDARD_ACTIONS)
    assert.equal(isStandardActionId(action), true);
  for (const action of ["review", "finalize", "apply-now", "PROPOSE"]) {
    assert.equal(isStandardActionId(action), false);
  }
});

test("Change identity lookup depends only on semantic id, not group metadata", () => {
  const a: ChangeIdentityView = { id: "same-change", group: "foundation" };
  const b: ChangeIdentityView = { id: "same-change", group: "execution" };
  assert.equal(getChangeId(a), "same-change");
  assert.equal(getChangeId(b), "same-change");
  assert.deepEqual(Object.keys(a).sort(), ["group", "id"]);
  assert.equal("key" in a, false);
});
