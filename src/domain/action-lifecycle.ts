import {
  isSemanticId,
  isStandardActionId,
  type ChangeId,
  type DeliveryId,
  type StandardActionId,
} from "./identity.js";

export const ACTION_LIFECYCLE_STATES = [
  "prepared",
  "resumed",
  "terminal",
] as const;

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

export type ActionLifecycleEvent =
  | { readonly type: "prepare"; readonly identity: ActionIdentity }
  | { readonly type: "resume"; readonly identity: ActionIdentity }
  | { readonly type: "terminal"; readonly identity: ActionIdentity };

const IDENTITY_FIELDS = ["deliveryId", "changeId", "actionId"] as const;
const CURRENT_ACTION_FIELDS = ["identity", "state"] as const;
const EVENT_FIELDS = ["type", "identity"] as const;

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

  return (
    value.type === "prepare" ||
    value.type === "resume" ||
    value.type === "terminal"
  );
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

  if (current.state === "terminal") return null;
  if (!sameActionIdentity(current.identity, event.identity)) return null;

  if (event.type === "resume") {
    return nextCurrentAction(event.identity, "resumed");
  }

  if (event.type === "terminal") {
    return nextCurrentAction(event.identity, "terminal");
  }

  return null;
}
