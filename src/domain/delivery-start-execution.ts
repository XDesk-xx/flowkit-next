import {
  formDeliveryOperationPackage,
  hasDeliveryStartCommitAuthority,
  isDeliveryPlanningReference,
  isDeliveryStartAuthorityForDelivery,
  isDeliveryStartOperationFacts,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryStartOperationPackage,
  type DeliveryPlanningReference,
  type DeliveryStartOperationFacts,
} from "./delivery-operation-execution.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import type { OwnerAuthorityFact } from "./authority.js";

const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;

export interface DeliveryStartPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly operationFacts: DeliveryStartOperationFacts;
  readonly ownerAuthority: OwnerAuthorityFact;
}

export interface DeliveryStartObservedState {
  readonly headCommit: string;
  readonly workingTreeClean: boolean;
  readonly planningReference: DeliveryPlanningReference;
}

const OBSERVED_STATE_FIELDS = [
  "headCommit",
  "workingTreeClean",
  "planningReference",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function hasExactlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === fields.length &&
    fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
  );
}

export function isDeliveryStartObservedState(
  value: unknown,
): value is DeliveryStartObservedState {
  if (!isRecord(value) || !hasExactlyFields(value, OBSERVED_STATE_FIELDS)) {
    return false;
  }
  return (
    typeof value.headCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.headCommit) &&
    typeof value.workingTreeClean === "boolean" &&
    isDeliveryPlanningReference(value.planningReference)
  );
}

function samePlanningReference(
  a: DeliveryPlanningReference,
  b: DeliveryPlanningReference,
): boolean {
  return a.artifact === b.artifact && a.contentSha256 === b.contentSha256;
}

function isPreparationInput(
  value: unknown,
): value is DeliveryStartPreparationInput {
  if (!isRecord(value)) return false;
  if (
    !hasExactlyFields(value, ["deliveryId", "operationFacts", "ownerAuthority"])
  ) {
    return false;
  }
  return (
    isSemanticId(value.deliveryId) &&
    isDeliveryStartOperationFacts(value.operationFacts) &&
    isDeliveryStartAuthorityForDelivery(value.ownerAuthority, value.deliveryId)
  );
}

export type DeliveryStartObservationCallback = () => unknown | Promise<unknown>;

export async function prepareDeliveryStartOperationPackage(
  repositoryRoot: unknown,
  input: unknown,
  observe: DeliveryStartObservationCallback,
): Promise<DeliveryStartOperationPackage | null> {
  if (!isPreparationInput(input)) return null;

  let observed: unknown;
  try {
    observed = await observe();
  } catch {
    return null;
  }
  if (!isDeliveryStartObservedState(observed)) return null;
  if (!observed.workingTreeClean) return null;
  if (observed.headCommit !== input.operationFacts.acceptedBaseCommit) {
    return null;
  }
  if (
    !samePlanningReference(
      observed.planningReference,
      input.operationFacts.planningReference,
    )
  ) {
    return null;
  }

  const guidanceRef = await resolveDeliveryGuidanceRef(
    repositoryRoot,
    "delivery-start",
  );
  if (guidanceRef === null) return null;

  const formed = formDeliveryOperationPackage(
    input.deliveryId,
    "delivery-start",
    input.ownerAuthority,
    input.operationFacts,
    guidanceRef,
  );
  return formed?.operationId === "delivery-start" ? formed : null;
}

export interface DeliveryStartSurfaceValidation {
  readonly status: "validated";
}

export type DeliveryStartExecutionCallback = (
  operationPackage: DeliveryStartOperationPackage,
  guidanceBytes: Buffer,
) => unknown | Promise<unknown>;

export type DeliveryStartCommitCallback = (
  operationPackage: DeliveryStartOperationPackage,
) => unknown | Promise<unknown>;

export type DeliveryStartInvocationFailureReason =
  | "package-formation-rejected"
  | "guidance-drift-rejected"
  | "surface-validation-failed"
  | "commit-callback-missing"
  | "fixed-point-commit-rejected";

export interface DeliveryStartInvocationFailure {
  readonly status: "failed";
  readonly reason: DeliveryStartInvocationFailureReason;
  readonly fixedPointCommit: null;
}

export interface DeliveryStartInvocationStopped {
  readonly status: "stopped-before-commit";
  readonly operationPackage: DeliveryStartOperationPackage;
  readonly fixedPointCommit: null;
}

export interface DeliveryStartInvocationTerminal {
  readonly status: "terminal";
  readonly operationPackage: DeliveryStartOperationPackage;
  readonly fixedPointCommit: string;
}

export type DeliveryStartInvocationOutcome =
  | DeliveryStartInvocationFailure
  | DeliveryStartInvocationStopped
  | DeliveryStartInvocationTerminal;

function failure(
  reason: DeliveryStartInvocationFailureReason,
): DeliveryStartInvocationFailure {
  return { status: "failed", reason, fixedPointCommit: null };
}

function isSurfaceValidation(
  value: unknown,
): value is DeliveryStartSurfaceValidation {
  return (
    isRecord(value) &&
    hasExactlyFields(value, ["status"]) &&
    value.status === "validated"
  );
}

export async function invokeDeliveryStartOperation(
  repositoryRoot: unknown,
  input: unknown,
  observe: DeliveryStartObservationCallback,
  executeSurface: DeliveryStartExecutionCallback,
  commitFixedPoint?: DeliveryStartCommitCallback,
): Promise<DeliveryStartInvocationOutcome> {
  const operationPackage = await prepareDeliveryStartOperationPackage(
    repositoryRoot,
    input,
    observe,
  );
  if (operationPackage === null) {
    return failure("package-formation-rejected");
  }

  const guidanceBytes = await readExactDeliveryGuidance(
    repositoryRoot,
    operationPackage.guidanceRef,
  );
  if (guidanceBytes === null) {
    return failure("guidance-drift-rejected");
  }

  let surfaceResult: unknown;
  try {
    surfaceResult = await executeSurface(operationPackage, guidanceBytes);
  } catch {
    return failure("surface-validation-failed");
  }
  if (!isSurfaceValidation(surfaceResult)) {
    return failure("surface-validation-failed");
  }

  if (
    !hasDeliveryStartCommitAuthority(
      operationPackage.ownerAuthority,
      operationPackage.deliveryId,
    )
  ) {
    return {
      status: "stopped-before-commit",
      operationPackage,
      fixedPointCommit: null,
    };
  }

  if (commitFixedPoint === undefined) {
    return failure("commit-callback-missing");
  }

  let commit: unknown;
  try {
    commit = await commitFixedPoint(operationPackage);
  } catch {
    return failure("fixed-point-commit-rejected");
  }
  if (typeof commit !== "string" || !GIT_COMMIT_PATTERN.test(commit)) {
    return failure("fixed-point-commit-rejected");
  }

  return { status: "terminal", operationPackage, fixedPointCommit: commit };
}
