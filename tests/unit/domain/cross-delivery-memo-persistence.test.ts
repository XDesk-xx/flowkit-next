import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createMemo,
  dismissMemo,
  getMemo,
  listOpenMemos,
  MEMOS_RELATIVE_PATH,
  promoteMemo,
  readMemos,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";

const OWNER_A = `owner:${"a".repeat(64)}`;
const OWNER_B = `owner:${"b".repeat(64)}`;

async function repo(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "flowkit-memo-"));
}

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
    sourceRef: "owner-input:memo-persistence-test",
    scope: [memoId],
    ...overrides,
  };
}

function input(memoId: string) {
  return {
    memoId,
    title: `Title ${memoId}`,
    note: `Note ${memoId}`,
    source: null,
  } as const;
}

async function canonicalText(root: string): Promise<string> {
  return readFile(path.join(root, MEMOS_RELATIVE_PATH), "utf8");
}

test("missing memos.json reads as empty without creating a file", async () => {
  const root = await repo();
  assert.deepEqual(await readMemos(root), { formatVersion: 1, memos: [] });
  await assert.rejects(stat(path.join(root, MEMOS_RELATIVE_PATH)), {
    code: "ENOENT",
  });
});

test("create writes one canonical document and sorts by memoId", async () => {
  const root = await repo();
  await createMemo(root, input("memo-z"), authority("create-memo", "memo-z"));
  await createMemo(root, input("memo-a"), authority("create-memo", "memo-a"));

  const document = await readMemos(root);
  assert.deepEqual(
    document.memos.map((memo) => memo.memoId),
    ["memo-a", "memo-z"],
  );
  assert.match(await canonicalText(root), /"formatVersion": 1/);
  await assert.rejects(stat(path.join(root, ".flowkit", "runs")), {
    code: "ENOENT",
  });
  assert.equal((await getMemo(root, "memo-a"))?.state, "open");
  assert.equal(await getMemo(root, "missing"), null);
});

test("listOpen returns only open records in canonical order", async () => {
  const root = await repo();
  await createMemo(root, input("memo-c"), authority("create-memo", "memo-c"));
  await createMemo(root, input("memo-a"), authority("create-memo", "memo-a"));
  await createMemo(root, input("memo-b"), authority("create-memo", "memo-b"));
  await dismissMemo(root, "memo-b", authority("dismiss-memo", "memo-b"));
  await promoteMemo(
    root,
    "memo-c",
    { deliveryId: "delivery-two", changeId: "change-two" },
    authority("promote-memo", "memo-c", {
      ref: OWNER_B,
      deliveryId: "delivery-two",
      changeId: "change-two",
    }),
  );
  assert.deepEqual(
    (await listOpenMemos(root)).map((memo) => memo.memoId),
    ["memo-a"],
  );
});

test("invalid existing document fails closed and is never repaired", async () => {
  const root = await repo();
  const target = path.join(root, MEMOS_RELATIVE_PATH);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, '{"formatVersion":1,"memos":[],"extra":true}\n');
  const before = await readFile(target, "utf8");
  await assert.rejects(readMemos(root), /Invalid Memo document/);
  await assert.rejects(
    createMemo(root, input("memo-one"), authority("create-memo", "memo-one")),
    /Invalid Memo document/,
  );
  assert.equal(await readFile(target, "utf8"), before);
});

test("duplicate create and rejected terminal mutation leave bytes unchanged", async () => {
  const root = await repo();
  await createMemo(
    root,
    input("memo-one"),
    authority("create-memo", "memo-one"),
  );
  const beforeDuplicate = await canonicalText(root);
  await assert.rejects(
    createMemo(root, input("memo-one"), authority("create-memo", "memo-one")),
    /already exists/,
  );
  assert.equal(await canonicalText(root), beforeDuplicate);

  await dismissMemo(
    root,
    "memo-one",
    authority("dismiss-memo", "memo-one", { ref: OWNER_B }),
  );
  const beforeTerminal = await canonicalText(root);
  await assert.rejects(
    dismissMemo(root, "memo-one", authority("dismiss-memo", "memo-one")),
    /rejected/,
  );
  assert.equal(await canonicalText(root), beforeTerminal);
});

test("promotion only records caller target and never creates target artifacts", async () => {
  const root = await repo();
  await createMemo(
    root,
    input("memo-one"),
    authority("create-memo", "memo-one"),
  );
  const target = { deliveryId: "future-delivery", changeId: "future-change" };
  const promoted = await promoteMemo(
    root,
    "memo-one",
    target,
    authority("promote-memo", "memo-one", {
      ref: OWNER_B,
      deliveryId: target.deliveryId,
      changeId: target.changeId,
    }),
  );
  assert.deepEqual(promoted.resolution, {
    kind: "promoted",
    targetDeliveryId: target.deliveryId,
    targetChangeId: target.changeId,
    ownerAuthorityRef: OWNER_B,
  });
  await assert.rejects(stat(path.join(root, "openspec")), { code: "ENOENT" });
});

test("failed target binding leaves canonical Memo document unchanged", async () => {
  const root = await repo();
  await createMemo(
    root,
    input("memo-one"),
    authority("create-memo", "memo-one"),
  );
  const before = await canonicalText(root);
  await assert.rejects(
    promoteMemo(
      root,
      "memo-one",
      { deliveryId: "future-delivery", changeId: "future-change" },
      authority("promote-memo", "memo-one", {
        deliveryId: "future-delivery",
        changeId: "different-change",
      }),
    ),
    /rejected/,
  );
  assert.equal(await canonicalText(root), before);
});
