import {
  loadManagerInstallation,
  type ManagerInstallation,
} from "../internal/manager-installation.js";
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
import {
  formDeliveryStartContentCompletion,
  isDeliveryStartValidatedSurface,
  type ReadDeliveryStartValidation,
  type DeliveryStartContentCompletion,
  type DeliveryStartValidatedSurface,
} from "../internal/delivery-start-content.js";
import {
  countGitCommits,
  isGitIndexAndWorktreeClean,
  observeGitParents,
  observeGitHead,
} from "../internal/delivery-repository-integration-git.js";
import { deriveApplicableCheckObjectCandidateRef } from "./applicable-check-execution.js";

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
  installation: ManagerInstallation = loadManagerInstallation(),
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
    installation,
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

export type DeliveryStartSurfaceValidation = DeliveryStartValidatedSurface;

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
  | "content-completion-rejected"
  | "commit-callback-missing"
  | "fixed-point-commit-rejected";

export interface DeliveryStartInvocationFailure {
  readonly status: "failed";
  readonly reason: DeliveryStartInvocationFailureReason;
  readonly fixedPointCommit: null;
  readonly contentCompletion: null;
}

export interface DeliveryStartInvocationStopped {
  readonly status: "terminal";
  readonly operationPackage: DeliveryStartOperationPackage;
  readonly fixedPointCommit: null;
  readonly contentCompletion: DeliveryStartContentCompletion;
}

export interface DeliveryStartInvocationTerminal {
  readonly status: "terminal";
  readonly operationPackage: DeliveryStartOperationPackage;
  readonly fixedPointCommit: string;
  readonly contentCompletion: DeliveryStartContentCompletion;
}

export type DeliveryStartInvocationOutcome =
  | DeliveryStartInvocationFailure
  | DeliveryStartInvocationStopped
  | DeliveryStartInvocationTerminal;

function failure(
  reason: DeliveryStartInvocationFailureReason,
): DeliveryStartInvocationFailure {
  return {
    status: "failed",
    reason,
    fixedPointCommit: null,
    contentCompletion: null,
  };
}

export async function invokeDeliveryStartOperation(
  repositoryRoot: unknown,
  input: unknown,
  observe: DeliveryStartObservationCallback,
  executeSurface: DeliveryStartExecutionCallback,
  readValidation: ReadDeliveryStartValidation,
  commitFixedPoint?: DeliveryStartCommitCallback,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryStartInvocationOutcome> {
  const operationPackage = await prepareDeliveryStartOperationPackage(
    repositoryRoot,
    input,
    observe,
    installation,
  );
  if (operationPackage === null) {
    return failure("package-formation-rejected");
  }

  const guidanceBytes = await readExactDeliveryGuidance(
    installation,
    operationPackage.guidanceRef,
  );
  if (guidanceBytes === null) {
    return failure("guidance-drift-rejected");
  }

  const revalidated = await prepareDeliveryStartOperationPackage(
    repositoryRoot,
    input,
    observe,
    installation,
  );
  if (
    revalidated === null ||
    JSON.stringify(revalidated) !== JSON.stringify(operationPackage)
  ) {
    return failure("package-formation-rejected");
  }

  const callbackPackage = formDeliveryOperationPackage(
    operationPackage.deliveryId,
    operationPackage.operationId,
    operationPackage.ownerAuthority,
    operationPackage.operationFacts,
    operationPackage.guidanceRef,
  );
  if (callbackPackage?.operationId !== "delivery-start") {
    return failure("package-formation-rejected");
  }

  let surfaceResult: unknown;
  try {
    surfaceResult = await executeSurface(
      callbackPackage,
      Buffer.from(guidanceBytes),
    );
  } catch {
    return failure("surface-validation-failed");
  }
  if (!isDeliveryStartValidatedSurface(surfaceResult)) {
    return failure("surface-validation-failed");
  }
  if (typeof repositoryRoot !== "string")
    return failure("content-completion-rejected");
  const contentCompletion = await formDeliveryStartContentCompletion(
    repositoryRoot,
    operationPackage.deliveryId,
    operationPackage.operationFacts.acceptedBaseCommit,
    operationPackage.operationFacts.planningReference,
    surfaceResult,
    readValidation,
  );
  if (contentCompletion === null) return failure("content-completion-rejected");

  if (
    !hasDeliveryStartCommitAuthority(
      operationPackage.ownerAuthority,
      operationPackage.deliveryId,
    )
  ) {
    return {
      status: "terminal",
      operationPackage,
      fixedPointCommit: null,
      contentCompletion,
    };
  }

  if (commitFixedPoint === undefined) {
    return failure("commit-callback-missing");
  }

  let preCommitState: unknown;
  try {
    preCommitState = await observe();
  } catch {
    return failure("fixed-point-commit-rejected");
  }
  if (
    !isDeliveryStartObservedState(preCommitState) ||
    preCommitState.headCommit !==
      operationPackage.operationFacts.acceptedBaseCommit ||
    !samePlanningReference(
      preCommitState.planningReference,
      operationPackage.operationFacts.planningReference,
    ) ||
    !hasDeliveryStartCommitAuthority(
      operationPackage.ownerAuthority,
      operationPackage.deliveryId,
    )
  ) {
    return failure("fixed-point-commit-rejected");
  }

  let commit: unknown;
  try {
    const commitPackage = formDeliveryOperationPackage(
      operationPackage.deliveryId,
      operationPackage.operationId,
      operationPackage.ownerAuthority,
      operationPackage.operationFacts,
      operationPackage.guidanceRef,
    );
    if (commitPackage?.operationId !== "delivery-start") {
      return failure("fixed-point-commit-rejected");
    }
    commit = await commitFixedPoint(commitPackage);
  } catch {
    return failure("fixed-point-commit-rejected");
  }
  if (typeof commit !== "string" || !GIT_COMMIT_PATTERN.test(commit)) {
    return failure("fixed-point-commit-rejected");
  }
  if (
    (await observeGitHead(repositoryRoot)) !== commit ||
    JSON.stringify(await observeGitParents(repositoryRoot, commit)) !==
      JSON.stringify([operationPackage.operationFacts.acceptedBaseCommit]) ||
    (await countGitCommits(
      repositoryRoot,
      operationPackage.operationFacts.acceptedBaseCommit,
      commit,
    )) !== 1 ||
    !(await isGitIndexAndWorktreeClean(repositoryRoot)) ||
    (await deriveApplicableCheckObjectCandidateRef(repositoryRoot, commit)) !==
      contentCompletion.candidateRef
  )
    return failure("fixed-point-commit-rejected");

  return {
    status: "terminal",
    operationPackage,
    fixedPointCommit: commit,
    contentCompletion,
  };
}

export type {
  DeliveryStartContentCompletion,
  ReadDeliveryStartValidation,
} from "../internal/delivery-start-content.js";
