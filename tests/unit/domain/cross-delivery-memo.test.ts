import assert from "node:assert/strict";
import test from "node:test";

import {
  createMemoRecord,
  dismissMemoRecord,
  evaluatePolicyAndNextBoundary,
  isProjectMemo,
  isProjectMemosDocument,
  promoteMemoRecord,
  type OwnerAuthorityFact,
  type ProjectMemo,
} from "../../../src/domain/index.js";

const OWNER_A = `owner:${"a".repeat(64)}`;
const OWNER_B = `owner:${"b".repeat(64)}`;

function authority(
  decision: string,
  memoId: string,
  overrides: Partial<OwnerAuthorityFact> = {},
): OwnerAuthorityFact {
  return {
    ref: OWNER_A,
    decision,
    deliveryId: "delivery-one",
    changeId: "change-one",
    sourceRef: "owner-input:memo-test",
    scope: [memoId],
    ...overrides,
  };
}

function openMemo(memoId = "memo-one"): ProjectMemo {
  return {
    memoId,
    state: "open",
    title: "A concern",
    note: "Observed now; intentionally deferred from formal scope.",
    source: null,
    createdByOwnerAuthorityRef: OWNER_A,
    resolution: null,
  };
}

test("accepts closed Memo records with null, Delivery, Change, and Run provenance", () => {
  const sources = [
    null,
    { deliveryId: "delivery-one" },
    { deliveryId: "delivery-one", changeId: "change-one" },
    {
      deliveryId: "delivery-one",
      changeId: "change-one",
      runId: "20260827-070-explore",
    },
  ] as const;

  for (const source of sources) {
    assert.equal(isProjectMemo({ ...openMemo(), source }), true);
  }
});

test("rejects incoherent provenance, unknown fields, and malformed run ids", () => {
  assert.equal(
    isProjectMemo({ ...openMemo(), source: { changeId: "change-one" } }),
    false,
  );
  assert.equal(
    isProjectMemo({
      ...openMemo(),
      source: { deliveryId: "delivery-one", runId: "20260827-070-explore" },
    }),
    false,
  );
  assert.equal(
    isProjectMemo({
      ...openMemo(),
      source: {
        deliveryId: "delivery-one",
        changeId: "change-one",
        runId: "2026-070-explore",
      },
    }),
    false,
  );
  assert.equal(isProjectMemo({ ...openMemo(), extra: true }), false);
});

test("enforces exact state-resolution consistency", () => {
  assert.equal(
    isProjectMemo({
      ...openMemo(),
      resolution: { kind: "dismissed", ownerAuthorityRef: OWNER_A },
    }),
    false,
  );
  assert.equal(
    isProjectMemo({
      ...openMemo(),
      state: "promoted",
      resolution: {
        kind: "promoted",
        targetDeliveryId: "delivery-two",
        targetChangeId: "change-two",
        ownerAuthorityRef: OWNER_B,
      },
    }),
    true,
  );
  assert.equal(
    isProjectMemo({
      ...openMemo(),
      state: "dismissed",
      resolution: { kind: "dismissed", ownerAuthorityRef: OWNER_B },
    }),
    true,
  );
});

test("rejects duplicate or non-canonical Memo document ordering", () => {
  assert.equal(
    isProjectMemosDocument({
      formatVersion: 1,
      memos: [openMemo("memo-a"), openMemo("memo-b")],
    }),
    true,
  );
  assert.equal(
    isProjectMemosDocument({
      formatVersion: 1,
      memos: [openMemo("memo-b"), openMemo("memo-a")],
    }),
    false,
  );
  assert.equal(
    isProjectMemosDocument({
      formatVersion: 1,
      memos: [openMemo("memo-a"), openMemo("memo-a")],
    }),
    false,
  );
  assert.equal(
    isProjectMemosDocument({ formatVersion: 1, memos: [], extra: true }),
    false,
  );
});

test("creates only with exact create-memo authority and exact single memo scope", () => {
  const input = {
    memoId: "memo-one",
    title: "A concern",
    note: "Keep this for later.",
    source: null,
  } as const;
  const created = createMemoRecord(input, authority("create-memo", "memo-one"));
  assert.deepEqual(created, {
    ...openMemo(),
    note: "Keep this for later.",
  });
  assert.equal(
    createMemoRecord(input, authority("dismiss-memo", "memo-one")),
    null,
  );
  assert.equal(
    createMemoRecord(input, {
      ...authority("create-memo", "memo-one"),
      scope: ["memo-one", "memo-two"],
    }),
    null,
  );
  assert.equal(createMemoRecord(input, null), null);
});

test("promotes only an open Memo to the exact authority-bound target", () => {
  const memo = openMemo();
  const target = { deliveryId: "delivery-two", changeId: "change-two" };
  const promoteAuthority = authority("promote-memo", memo.memoId, {
    ref: OWNER_B,
    deliveryId: target.deliveryId,
    changeId: target.changeId,
  });
  assert.deepEqual(promoteMemoRecord(memo, target, promoteAuthority), {
    ...memo,
    state: "promoted",
    resolution: {
      kind: "promoted",
      targetDeliveryId: "delivery-two",
      targetChangeId: "change-two",
      ownerAuthorityRef: OWNER_B,
    },
  });
  assert.equal(
    promoteMemoRecord(memo, target, {
      ...promoteAuthority,
      changeId: "other-change",
    }),
    null,
  );
});

test("dismisses only open Memo and terminal states cannot transition again", () => {
  const memo = openMemo();
  const dismissed = dismissMemoRecord(
    memo,
    authority("dismiss-memo", memo.memoId, { ref: OWNER_B }),
  );
  assert.deepEqual(dismissed, {
    ...memo,
    state: "dismissed",
    resolution: { kind: "dismissed", ownerAuthorityRef: OWNER_B },
  });
  assert.equal(
    dismissMemoRecord(dismissed, authority("dismiss-memo", memo.memoId)),
    null,
  );
  assert.equal(
    promoteMemoRecord(
      dismissed,
      { deliveryId: "delivery-two", changeId: "change-two" },
      authority("promote-memo", memo.memoId, {
        deliveryId: "delivery-two",
        changeId: "change-two",
      }),
    ),
    null,
  );
});

test("Memo is not a Policy fact and does not change legal boundary", () => {
  const facts = {
    deliveryId: "delivery-one",
    changeId: "change-one",
    changeState: "active",
    currentAction: null,
    terminalRunContext: null,
    terminalResult: null,
  } as const;
  assert.deepEqual(evaluatePolicyAndNextBoundary(facts), {
    kind: "ready-action",
    actionId: "explore",
  });
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({ ...facts, memos: [openMemo()] }),
    { kind: "blocked", reason: "invalid-policy-input" },
  );
});
