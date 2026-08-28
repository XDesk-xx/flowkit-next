import {
  isOwnerAuthorityFact,
  type OwnerAuthorityFact,
} from "../domain/authority.js";
import type { ChangeId, DeliveryId } from "../domain/identity.js";
import type { PolicyDecision } from "../domain/policy-and-next-boundary.js";

export type CheckpointAuthorizationReason =
  | "authorized"
  | "policy-not-ready"
  | "owner-authority-missing"
  | "owner-authority-mismatch";

export interface CheckpointAuthorization {
  readonly authorized: boolean;
  readonly reason: CheckpointAuthorizationReason;
}

export interface CheckpointAuthorizationInput {
  readonly policyDecision: PolicyDecision;
  readonly ownerAuthority: OwnerAuthorityFact | null;
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
}

export function evaluateCheckpointAuthorization(
  input: CheckpointAuthorizationInput,
): CheckpointAuthorization {
  if (input.policyDecision.kind !== "ready-checkpoint-evaluation") {
    return Object.freeze({
      authorized: false,
      reason: "policy-not-ready",
    });
  }
  if (input.ownerAuthority === null) {
    return Object.freeze({
      authorized: false,
      reason: "owner-authority-missing",
    });
  }
  if (
    !isOwnerAuthorityFact(input.ownerAuthority) ||
    input.ownerAuthority.decision !== "authorize-checkpoint" ||
    input.ownerAuthority.deliveryId !== input.deliveryId ||
    input.ownerAuthority.changeId !== input.changeId ||
    input.ownerAuthority.scope.length !== 1 ||
    input.ownerAuthority.scope[0] !== "checkpoint"
  ) {
    return Object.freeze({
      authorized: false,
      reason: "owner-authority-mismatch",
    });
  }
  return Object.freeze({
    authorized: true,
    reason: "authorized",
  });
}
