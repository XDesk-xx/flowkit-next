import assert from "node:assert/strict";
import test from "node:test";

import {
  asOwnerAuthorityFact,
  hasExplicitOwnerAuthorityFact,
  isActionExecutionRole,
  isActorRole,
  isAuthoritySource,
  isOwnerAuthorityFact,
} from "../../../src/domain/index.js";

const baseFact = {
  ref: `owner:${"a".repeat(64)}`,
  decision: "authorize-apply",
  deliveryId: "20260824-01-foundation-lifecycle-kernel",
  changeId: "establish-lifecycle-authority-and-identity-contracts",
  sourceRef: "owner-input:2026-08-24:authorize-apply",
  scope: ["apply"],
} as const;

test("separates actor roles, execution roles, and verification authority", () => {
  assert.equal(isActorRole("owner"), true);
  assert.equal(isActionExecutionRole("owner"), false);
  assert.equal(isActionExecutionRole("author"), true);
  assert.equal(isActionExecutionRole("reviewer"), true);
  assert.equal(isActorRole("verification"), false);
  assert.equal(isAuthoritySource("verification"), true);
});

test("accepts canonical Change-scoped and Delivery-scoped Owner authority facts", () => {
  assert.equal(isOwnerAuthorityFact(baseFact), true);
  const { changeId: _ignored, ...deliveryScoped } = baseFact;
  assert.equal(isOwnerAuthorityFact(deliveryScoped), true);
  assert.deepEqual(asOwnerAuthorityFact(baseFact), baseFact);
});

test("rejects missing required fields, null changeId, extra fields, and malformed refs", () => {
  const { sourceRef: _missing, ...withoutSourceRef } = baseFact;
  assert.equal(isOwnerAuthorityFact(withoutSourceRef), false);
  assert.equal(isOwnerAuthorityFact({ ...baseFact, changeId: null }), false);
  assert.equal(isOwnerAuthorityFact({ ...baseFact, extra: true }), false);
  assert.equal(
    isOwnerAuthorityFact({ ...baseFact, ref: `OWNER:${"a".repeat(64)}` }),
    false,
  );
  assert.equal(
    isOwnerAuthorityFact({ ...baseFact, ref: `owner:${"A".repeat(64)}` }),
    false,
  );
  assert.equal(isOwnerAuthorityFact({ ...baseFact, ref: "owner:abc" }), false);
});

test("rejects non-canonical sourceRef and scope without repairing them", () => {
  assert.equal(
    isOwnerAuthorityFact({ ...baseFact, sourceRef: "contains space" }),
    false,
  );
  assert.equal(
    isOwnerAuthorityFact({ ...baseFact, sourceRef: "line\nbreak" }),
    false,
  );
  assert.equal(isOwnerAuthorityFact({ ...baseFact, scope: [] }), false);
  assert.equal(
    isOwnerAuthorityFact({ ...baseFact, scope: ["apply", "apply"] }),
    false,
  );
  assert.equal(
    isOwnerAuthorityFact({ ...baseFact, scope: ["propose", "apply"] }),
    false,
  );
  assert.equal(isOwnerAuthorityFact({ ...baseFact, scope: ["Apply"] }), false);
  assert.equal(
    isOwnerAuthorityFact({
      ...baseFact,
      scope: Array.from({ length: 33 }, (_, i) => `s${i}`),
    }),
    false,
  );
});

test("accepts structurally valid future decision/scope without granting Policy eligibility", () => {
  const futureFact = {
    ...baseFact,
    decision: "future-decision",
    scope: ["future-scope"],
  };
  assert.equal(isOwnerAuthorityFact(futureFact), true);
  // Foundation validation only proves wire shape. It exposes no Policy eligibility API.
  assert.equal("eligible" in futureFact, false);
});

test("Review, Verification, or terminal facts do not implicitly create Owner authority", () => {
  assert.equal(hasExplicitOwnerAuthorityFact({ verdict: "approved" }), false);
  assert.equal(
    hasExplicitOwnerAuthorityFact({ verification: "passed" }),
    false,
  );
  assert.equal(
    hasExplicitOwnerAuthorityFact({ executionStatus: "completed" }),
    false,
  );
  assert.equal(hasExplicitOwnerAuthorityFact(baseFact), true);
});
