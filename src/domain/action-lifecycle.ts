import {
  isSemanticId,
  isStandardActionId,
  type ChangeId,
  type DeliveryId,
  type StandardActionId,
} from "./identity.js";

export const ACTION_LIFECYCLE_STATES = ["prepared", "terminal"] as const;

export type ActionLifecycleState = (typeof ACTION_LIFECYCLE_STATES)[number];

export interface ActionIdentity {
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
  readonly actionId: StandardActionId;
}

export interface CurrentAction {
  readonly identity: ActionIdentity;
  readonly state: ActionLifecycleState;
}

export type CurrentActionSlot = CurrentAction | null;

export interface PreparedSupersessionBoundary {
  readonly kind: "ready-action";
  readonly actionId: StandardActionId;
}

export type ActionLifecycleEvent =
  | { readonly type: "prepare"; readonly identity: ActionIdentity }
  | { readonly type: "terminal"; readonly identity: ActionIdentity };

const IDENTITY_FIELDS = ["deliveryId", "changeId", "actionId"] as const;
const CURRENT_ACTION_FIELDS = ["identity", "state"] as const;
const EVENT_FIELDS = ["type", "identity"] as const;
const SUPERSESSION_BOUNDARY_FIELDS = ["kind", "actionId"] as const;
const PREPARED_AUTHOR_ACTIONS = new Set<StandardActionId>([
  "explore",
  "revise-explore",
  "propose",
  "revise-propose",
  "apply",
  "revise-apply",
]);
const REVISE_ACTIONS = new Set<StandardActionId>([
  "revise-explore",
  "revise-propose",
  "revise-apply",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === fields.length &&
    fields.every((key) => Object.hasOwn(value, key))
  );
}

export function isActionLifecycleState(
  value: unknown,
): value is ActionLifecycleState {
  return (
    typeof value === "string" &&
    (ACTION_LIFECYCLE_STATES as readonly string[]).includes(value)
  );
}

export function isActionIdentity(value: unknown): value is ActionIdentity {
  if (!isRecord(value) || !hasExactlyFields(value, IDENTITY_FIELDS))
    return false;

  return (
    isSemanticId(value.deliveryId) &&
    isSemanticId(value.changeId) &&
    isStandardActionId(value.actionId)
  );
}

export function isCurrentAction(value: unknown): value is CurrentAction {
  if (!isRecord(value) || !hasExactlyFields(value, CURRENT_ACTION_FIELDS)) {
    return false;
  }

  return (
    isActionIdentity(value.identity) && isActionLifecycleState(value.state)
  );
}

function isActionLifecycleEvent(value: unknown): value is ActionLifecycleEvent {
  if (!isRecord(value) || !hasExactlyFields(value, EVENT_FIELDS)) return false;
  if (!isActionIdentity(value.identity)) return false;

  return value.type === "prepare" || value.type === "terminal";
}

function sameActionIdentity(a: ActionIdentity, b: ActionIdentity): boolean {
  return (
    a.deliveryId === b.deliveryId &&
    a.changeId === b.changeId &&
    a.actionId === b.actionId
  );
}

function nextCurrentAction(
  identity: ActionIdentity,
  state: ActionLifecycleState,
): CurrentAction {
  return {
    identity: {
      deliveryId: identity.deliveryId,
      changeId: identity.changeId,
      actionId: identity.actionId,
    },
    state,
  };
}

export function transitionCurrentAction(
  current: unknown,
  event: unknown,
): CurrentAction | null {
  if (!isActionLifecycleEvent(event)) return null;

  if (current === null) {
    return event.type === "prepare"
      ? nextCurrentAction(event.identity, "prepared")
      : null;
  }

  if (!isCurrentAction(current)) return null;

  if (event.type === "prepare") {
    if (current.state !== "terminal") return null;
    if (sameActionIdentity(current.identity, event.identity)) return null;
    return nextCurrentAction(event.identity, "prepared");
  }

  if (current.state !== "prepared") return null;
  if (!sameActionIdentity(current.identity, event.identity)) return null;

  return nextCurrentAction(event.identity, "terminal");
}

/** Structural candidate only; the caller must independently establish Policy eligibility. */
export function supersedePreparedAction(
  current: unknown,
  target: unknown,
  boundary: unknown,
): CurrentAction | null {
  if (!isCurrentAction(current) || !isActionIdentity(target)) return null;
  if (
    !isRecord(boundary) ||
    !hasExactlyFields(boundary, SUPERSESSION_BOUNDARY_FIELDS) ||
    boundary.kind !== "ready-action" ||
    !isStandardActionId(boundary.actionId)
  ) {
    return null;
  }
  if (
    current.state !== "prepared" ||
    !PREPARED_AUTHOR_ACTIONS.has(current.identity.actionId) ||
    !REVISE_ACTIONS.has(target.actionId) ||
    current.identity.deliveryId !== target.deliveryId ||
    current.identity.changeId !== target.changeId ||
    sameActionIdentity(current.identity, target) ||
    boundary.actionId !== target.actionId
  ) {
    return null;
  }
  return nextCurrentAction(target, "prepared");
}
