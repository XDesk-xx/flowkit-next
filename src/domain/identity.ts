export type SemanticId = string;
export type DeliveryId = SemanticId;
export type ChangeId = SemanticId;
export type ChangeGroup = string;

const SEMANTIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SEMANTIC_ID_LENGTH = 128;

export function isSemanticId(value: unknown): value is SemanticId {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= MAX_SEMANTIC_ID_LENGTH &&
    SEMANTIC_ID_PATTERN.test(value)
  );
}

export function asDeliveryId(value: unknown): DeliveryId | null {
  return isSemanticId(value) ? value : null;
}

export function asChangeId(value: unknown): ChangeId | null {
  return isSemanticId(value) ? value : null;
}

export const STANDARD_ACTIONS = [
  "explore",
  "review-explore",
  "revise-explore",
  "propose",
  "review-propose",
  "revise-propose",
  "apply",
  "review-apply",
  "revise-apply",
  "archive",
] as const;

export type StandardActionId = (typeof STANDARD_ACTIONS)[number];

export function isStandardActionId(value: unknown): value is StandardActionId {
  return (
    typeof value === "string" &&
    (STANDARD_ACTIONS as readonly string[]).includes(value)
  );
}

export interface ChangeIdentityView {
  readonly id: ChangeId;
  readonly group?: ChangeGroup;
}

export function getChangeId(change: ChangeIdentityView): ChangeId {
  return change.id;
}
