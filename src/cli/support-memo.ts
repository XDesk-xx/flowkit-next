import { isDeepStrictEqual } from "node:util";
import {
  createMemo,
  dismissMemo,
  getMemo,
  promoteMemo,
  readMemos,
} from "../domain/cross-delivery-memo-persistence.js";
import {
  createMemoRecord,
  dismissMemoRecord,
  isMemoSource,
  promoteMemoRecord,
  type CreateMemoInput,
  type MemoPromotionTarget,
} from "../domain/cross-delivery-memo.js";
import { isSemanticId } from "../domain/identity.js";
import { isOwnerAuthorityFact } from "../domain/authority.js";
import type { SupportCommand } from "./support-request.js";

export async function executeMemoCommand(
  command: SupportCommand,
  request: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const root = request.repositoryRoot as string;
  if (command === "memo list")
    return {
      status: "completed",
      effect: "none",
      memos: (await readMemos(root)).memos,
    };
  if (command === "memo get") {
    const memo = await getMemo(root, request.memoId as string);
    return { status: "completed", effect: "none", memo };
  }
  const authority = request.ownerAuthority;
  if (!isOwnerAuthorityFact(authority))
    return {
      status: "incomplete",
      effect: "none",
      reason: "owner-authority-invalid",
    };
  let expected;
  let effect: "none" | "unknown" = "none";
  try {
    if (command === "memo create") {
      const memo = request.memo;
      if (
        typeof memo !== "object" ||
        memo === null ||
        Array.isArray(memo) ||
        Object.keys(memo).sort().join() !== "memoId,note,source,title" ||
        !isSemanticId((memo as CreateMemoInput).memoId) ||
        typeof (memo as CreateMemoInput).title !== "string" ||
        typeof (memo as CreateMemoInput).note !== "string" ||
        !isMemoSource((memo as CreateMemoInput).source)
      )
        throw new Error("memo-input-invalid");
      const input = memo as CreateMemoInput;
      if (
        input.source &&
        (authority.deliveryId !== input.source.deliveryId ||
          ("changeId" in input.source &&
            authority.changeId !== input.source.changeId))
      )
        throw new Error("memo-source-mismatch");
      expected = createMemoRecord(input, authority);
      if (expected === null) throw new Error("memo-authority-invalid");
      if (await getMemo(root, input.memoId)) throw new Error("memo-id-exists");
      effect = "unknown";
      await createMemo(root, input, authority);
    } else if (command === "memo promote") {
      const target = request.target;
      if (
        typeof target !== "object" ||
        target === null ||
        Array.isArray(target) ||
        Object.keys(target).sort().join() !== "changeId,deliveryId" ||
        !isSemanticId((target as MemoPromotionTarget).deliveryId) ||
        !isSemanticId((target as MemoPromotionTarget).changeId)
      )
        throw new Error("memo-target-invalid");
      expected = promoteMemoRecord(
        await getMemo(root, request.memoId as string),
        target as MemoPromotionTarget,
        authority,
      );
      if (expected === null) throw new Error("memo-promotion-invalid");
      effect = "unknown";
      expected = await promoteMemo(
        root,
        request.memoId as string,
        target as MemoPromotionTarget,
        authority,
      );
    } else if (command === "memo dismiss") {
      expected = dismissMemoRecord(
        await getMemo(root, request.memoId as string),
        authority,
      );
      if (expected === null) throw new Error("memo-dismissal-invalid");
      effect = "unknown";
      expected = await dismissMemo(root, request.memoId as string, authority);
    } else throw new Error("memo-command-invalid");
    const actual = await getMemo(root, expected.memoId);
    if (!isDeepStrictEqual(actual, expected))
      throw new Error("memo-readback-mismatch");
    return { status: "completed", effect: "written", memo: actual };
  } catch (error) {
    return {
      status: "incomplete",
      effect,
      reason: error instanceof Error ? error.message : "memo-write-failed",
    };
  }
}
