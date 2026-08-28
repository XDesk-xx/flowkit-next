import {
  isOwnerAuthorityFact,
  isOwnerAuthorityRef,
  type OwnerAuthorityFact,
} from "./authority.js";
import {
  isSemanticId,
  type ChangeId,
  type DeliveryId,
  type SemanticId,
} from "./identity.js";
import { parseRunOccurrenceId } from "./run-result-persistence.js";

export type MemoState = "open" | "promoted" | "dismissed";

export type MemoSource =
  | null
  | { readonly deliveryId: DeliveryId }
  | { readonly deliveryId: DeliveryId; readonly changeId: ChangeId }
  | {
      readonly deliveryId: DeliveryId;
      readonly changeId: ChangeId;
      readonly runId: string;
    };

export interface PromotedMemoResolution {
  readonly kind: "promoted";
  readonly targetDeliveryId: DeliveryId;
  readonly targetChangeId: ChangeId;
  readonly ownerAuthorityRef: string;
}

export interface DismissedMemoResolution {
  readonly kind: "dismissed";
  readonly ownerAuthorityRef: string;
}

export type MemoResolution =
  null | PromotedMemoResolution | DismissedMemoResolution;

export interface ProjectMemo {
  readonly memoId: SemanticId;
  readonly state: MemoState;
  readonly title: string;
  readonly note: string;
  readonly source: MemoSource;
  readonly createdByOwnerAuthorityRef: string;
  readonly resolution: MemoResolution;
}

export interface ProjectMemosDocument {
  readonly formatVersion: 1;
  readonly memos: readonly ProjectMemo[];
}

export interface CreateMemoInput {
  readonly memoId: SemanticId;
  readonly title: string;
  readonly note: string;
  readonly source: MemoSource;
}

export interface MemoPromotionTarget {
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
}

const MEMO_FIELDS = [
  "memoId",
  "state",
  "title",
  "note",
  "source",
  "createdByOwnerAuthorityRef",
  "resolution",
] as const;
const DOCUMENT_FIELDS = ["formatVersion", "memos"] as const;
const DELIVERY_SOURCE_FIELDS = ["deliveryId"] as const;
const CHANGE_SOURCE_FIELDS = ["deliveryId", "changeId"] as const;
const RUN_SOURCE_FIELDS = ["deliveryId", "changeId", "runId"] as const;
const PROMOTED_RESOLUTION_FIELDS = [
  "kind",
  "targetDeliveryId",
  "targetChangeId",
  "ownerAuthorityRef",
] as const;
const DISMISSED_RESOLUTION_FIELDS = ["kind", "ownerAuthorityRef"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === fields.length &&
    fields.every((field) => Object.hasOwn(value, field))
  );
}

export function isMemoSource(value: unknown): value is MemoSource {
  if (value === null) return true;
  if (!isRecord(value)) return false;

  if (hasExactlyFields(value, DELIVERY_SOURCE_FIELDS)) {
    return isSemanticId(value.deliveryId);
  }
  if (hasExactlyFields(value, CHANGE_SOURCE_FIELDS)) {
    return isSemanticId(value.deliveryId) && isSemanticId(value.changeId);
  }
  if (hasExactlyFields(value, RUN_SOURCE_FIELDS)) {
    return (
      isSemanticId(value.deliveryId) &&
      isSemanticId(value.changeId) &&
      parseRunOccurrenceId(value.runId) !== null
    );
  }
  return false;
}

function isMemoResolution(value: unknown): value is MemoResolution {
  if (value === null) return true;
  if (!isRecord(value)) return false;

  if (value.kind === "promoted") {
    return (
      hasExactlyFields(value, PROMOTED_RESOLUTION_FIELDS) &&
      isSemanticId(value.targetDeliveryId) &&
      isSemanticId(value.targetChangeId) &&
      isOwnerAuthorityRef(value.ownerAuthorityRef)
    );
  }
  if (value.kind === "dismissed") {
    return (
      hasExactlyFields(value, DISMISSED_RESOLUTION_FIELDS) &&
      isOwnerAuthorityRef(value.ownerAuthorityRef)
    );
  }
  return false;
}

export function isProjectMemo(value: unknown): value is ProjectMemo {
  if (!isRecord(value) || !hasExactlyFields(value, MEMO_FIELDS)) return false;
  if (!isSemanticId(value.memoId)) return false;
  if (
    value.state !== "open" &&
    value.state !== "promoted" &&
    value.state !== "dismissed"
  ) {
    return false;
  }
  if (typeof value.title !== "string" || typeof value.note !== "string") {
    return false;
  }
  if (!isMemoSource(value.source)) return false;
  if (!isOwnerAuthorityRef(value.createdByOwnerAuthorityRef)) return false;
  if (!isMemoResolution(value.resolution)) return false;

  switch (value.state) {
    case "open":
      return value.resolution === null;
    case "promoted":
      return value.resolution?.kind === "promoted";
    case "dismissed":
      return value.resolution?.kind === "dismissed";
  }
}

export function isProjectMemosDocument(
  value: unknown,
): value is ProjectMemosDocument {
  if (!isRecord(value) || !hasExactlyFields(value, DOCUMENT_FIELDS)) {
    return false;
  }
  if (value.formatVersion !== 1 || !Array.isArray(value.memos)) return false;
  if (!value.memos.every(isProjectMemo)) return false;
  for (let index = 1; index < value.memos.length; index += 1) {
    if (value.memos[index - 1].memoId >= value.memos[index].memoId) {
      return false;
    }
  }
  return true;
}

function hasExactMemoAuthority(
  authority: unknown,
  decision: "create-memo" | "promote-memo" | "dismiss-memo",
  memoId: SemanticId,
): authority is OwnerAuthorityFact {
  return (
    isOwnerAuthorityFact(authority) &&
    authority.decision === decision &&
    authority.scope.length === 1 &&
    authority.scope[0] === memoId
  );
}

function isCreateMemoInput(value: unknown): value is CreateMemoInput {
  if (!isRecord(value)) return false;
  const fields = ["memoId", "title", "note", "source"] as const;
  return (
    hasExactlyFields(value, fields) &&
    isSemanticId(value.memoId) &&
    typeof value.title === "string" &&
    typeof value.note === "string" &&
    isMemoSource(value.source)
  );
}

export function createMemoRecord(
  input: unknown,
  authority: unknown,
): ProjectMemo | null {
  if (!isCreateMemoInput(input)) return null;
  if (!hasExactMemoAuthority(authority, "create-memo", input.memoId)) {
    return null;
  }
  return {
    memoId: input.memoId,
    state: "open",
    title: input.title,
    note: input.note,
    source: input.source,
    createdByOwnerAuthorityRef: authority.ref,
    resolution: null,
  };
}

export function promoteMemoRecord(
  memo: unknown,
  target: unknown,
  authority: unknown,
): ProjectMemo | null {
  if (!isProjectMemo(memo) || memo.state !== "open") return null;
  if (
    !isRecord(target) ||
    !hasExactlyFields(target, ["deliveryId", "changeId"]) ||
    !isSemanticId(target.deliveryId) ||
    !isSemanticId(target.changeId)
  ) {
    return null;
  }
  if (!hasExactMemoAuthority(authority, "promote-memo", memo.memoId)) {
    return null;
  }
  if (
    authority.deliveryId !== target.deliveryId ||
    authority.changeId !== target.changeId
  ) {
    return null;
  }
  return {
    ...memo,
    state: "promoted",
    resolution: {
      kind: "promoted",
      targetDeliveryId: target.deliveryId,
      targetChangeId: target.changeId,
      ownerAuthorityRef: authority.ref,
    },
  };
}

export function dismissMemoRecord(
  memo: unknown,
  authority: unknown,
): ProjectMemo | null {
  if (!isProjectMemo(memo) || memo.state !== "open") return null;
  if (!hasExactMemoAuthority(authority, "dismiss-memo", memo.memoId)) {
    return null;
  }
  return {
    ...memo,
    state: "dismissed",
    resolution: {
      kind: "dismissed",
      ownerAuthorityRef: authority.ref,
    },
  };
}
