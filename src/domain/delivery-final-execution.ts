import {
  loadManagerInstallation,
  type ManagerInstallation,
} from "../internal/manager-installation.js";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  formDeliveryOperationPackage,
  isDeliveryOperationPackage,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryFinalOperationPackage,
} from "./delivery-operation-execution.js";
import { isDeliveryFinalAuthorityForDelivery } from "./delivery-final-operation.js";
import {
  readDeliveryChangeCompletions,
  isCompletionSource,
  type ReadDeliveryRequiredEvidence,
} from "../internal/delivery-required-evidence-source.js";
export type { ReadDeliveryRequiredEvidence } from "../internal/delivery-required-evidence-source.js";
import { isDeepStrictEqual } from "node:util";
import {
  isDeliveryFinalizationRecord,
  type DeliveryFinalizationRecord,
} from "./delivery-finalization.js";
export {
  deriveDeliveryFinalizationRef,
  readDeliveryFinalization,
  isDeliveryFinalizationRecord,
} from "./delivery-finalization.js";
export type {
  DeliveryFinalizationRecord,
  DeliveryFinalizationLinks,
  DeliveryFinalizationObservation,
} from "./delivery-finalization.js";
import { readCurrentDeliveryFullTest } from "../internal/full-test-current.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import { observeOpenSpecActiveChanges } from "./openspec-observation.js";
import {
  readDeliveryFinalCoordinationPrestate,
  revalidateDeliveryFinalCoordinationPrestate,
  writeDeliveryFinalCoordinationClosure,
} from "../internal/delivery-final-coordination.js";

export interface DeliveryFinalPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly ownerAuthority: DeliveryFinalOperationPackage["ownerAuthority"];
  readonly flowkitHome: string;
}

export interface DeliveryFinalExecutionReady {
  readonly status: "ready";
}

export interface DeliveryFinalExecutionCorrectionRequired {
  readonly status: "correction-required";
  readonly reason: string;
}

export type DeliveryFinalExecutionResult =
  DeliveryFinalExecutionReady | DeliveryFinalExecutionCorrectionRequired;

export interface DeliveryFinalExecutionInput {
  readonly operationPackage: DeliveryFinalOperationPackage;
  readonly guidance: Buffer;
}

export type DeliveryFinalExecute = (
  input: DeliveryFinalExecutionInput,
) => DeliveryFinalExecutionResult | Promise<DeliveryFinalExecutionResult>;

export type DeliveryFinalInvocationFailureReason =
  | "package-formation-rejected"
  | "guidance-drift-rejected"
  | "execution-result-rejected"
  | "coordination-materialization-rejected"
  | "completion-source-unavailable"
  | "content-validation-failed"
  | "confirmation-publication-failed"
  | "confirmation-readback-failed";

export interface DeliveryFinalInvocationFailure {
  readonly status: "failed";
  readonly reason: DeliveryFinalInvocationFailureReason;
  readonly mutationStatus: "not-written" | "written-unconfirmed" | "unknown";
  readonly record: null;
  readonly completionChangeId?: string;
}

export interface DeliveryFinalInvocationCorrectionRequired {
  readonly status: "correction-required";
  readonly reason: string;
  readonly operationPackage: DeliveryFinalOperationPackage;
  readonly record: null;
}

export interface DeliveryFinalInvocationTerminal {
  readonly status: "terminal";
  readonly operationPackage: DeliveryFinalOperationPackage;
  readonly record: DeliveryFinalizationRecord;
}

export type DeliveryFinalInvocationOutcome =
  | DeliveryFinalInvocationFailure
  | DeliveryFinalInvocationCorrectionRequired
  | DeliveryFinalInvocationTerminal;

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

function isPreparationInput(
  value: unknown,
): value is DeliveryFinalPreparationInput {
  return (
    isRecord(value) &&
    hasExactlyFields(value, ["deliveryId", "ownerAuthority", "flowkitHome"]) &&
    isSemanticId(value.deliveryId) &&
    isDeliveryFinalAuthorityForDelivery(
      value.ownerAuthority,
      value.deliveryId,
    ) &&
    typeof value.flowkitHome === "string" &&
    value.flowkitHome.length > 0
  );
}

async function readProjectId(repositoryRoot: string): Promise<string | null> {
  try {
    const value = JSON.parse(
      await readFile(
        path.join(repositoryRoot, ".flowkit", "project.json"),
        "utf8",
      ),
    ) as unknown;
    return isRecord(value) && isSemanticId(value.projectId)
      ? value.projectId
      : null;
  } catch {
    return null;
  }
}

export async function prepareDeliveryFinalOperationPackage(
  repositoryRoot: unknown,
  input: unknown,
  readRequiredEvidence: unknown,
  installation: ManagerInstallation = loadManagerInstallation(),
  onCompletionRejected?: (changeId: string) => void,
): Promise<DeliveryFinalOperationPackage | null> {
  if (
    typeof repositoryRoot !== "string" ||
    repositoryRoot.length === 0 ||
    !isPreparationInput(input)
  ) {
    return null;
  }
  const current = await readCurrentDeliveryFullTest(
    repositoryRoot,
    input.deliveryId,
  );
  if (current.status !== "passed") return null;
  const fullTestOutcome = current.outcome;
  const coordination = await readDeliveryFinalCoordinationPrestate(
    repositoryRoot,
    input.deliveryId,
  );
  if (coordination === null) return null;
  const projectId = await readProjectId(repositoryRoot);
  if (projectId === null) return null;
  const changeCompletions = await readDeliveryChangeCompletions(
    readRequiredEvidence,
    {
      repositoryRoot,
      projectId,
      deliveryId: input.deliveryId,
      changeIds: coordination.completedRequiredChangeIds,
    },
    onCompletionRejected,
  );
  if (changeCompletions === null) return null;

  try {
    const activeChanges = await observeOpenSpecActiveChanges({
      repositoryRoot,
      flowkitHome: input.flowkitHome,
    });
    if (activeChanges.changeIds.length !== 0) return null;
  } catch {
    return null;
  }
  const guidanceRef = await resolveDeliveryGuidanceRef(
    installation,
    "delivery-final",
  );
  if (guidanceRef === null) return null;

  const formed = formDeliveryOperationPackage(
    input.deliveryId,
    "delivery-final",
    input.ownerAuthority,
    {
      verifiedCandidateRef: fullTestOutcome.record.inputRef,
      fullTestExecutionRef: fullTestOutcome.record.executionRef,
      coordinationPrestateRef: coordination.ref,
      completedRequiredChangeIds: coordination.completedRequiredChangeIds,
      projectId,
      fullTestAttempt: fullTestOutcome.record.attemptId,
      changeCompletions,
    },
    guidanceRef,
  );
  return formed?.operationId === "delivery-final" ? formed : null;
}

function isExecutionResult(
  value: unknown,
): value is DeliveryFinalExecutionResult {
  if (!isRecord(value)) return false;
  if (value.status === "ready") {
    return hasExactlyFields(value, ["status"]);
  }
  return (
    value.status === "correction-required" &&
    hasExactlyFields(value, ["status", "reason"]) &&
    typeof value.reason === "string" &&
    value.reason.length > 0
  );
}

function exactPackageEqual(
  left: DeliveryFinalOperationPackage,
  right: DeliveryFinalOperationPackage,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function isDeliveryFinalizationRecordForPackage(
  value: unknown,
  operationPackage: unknown,
): value is DeliveryFinalizationRecord {
  return (
    isDeliveryFinalizationRecord(value) &&
    isDeliveryOperationPackage(operationPackage) &&
    operationPackage.operationId === "delivery-final" &&
    value.projectId === operationPackage.operationFacts.projectId &&
    value.deliveryId === operationPackage.deliveryId &&
    value.ownerAuthorityRef === operationPackage.ownerAuthority.ref &&
    value.sourceRef === operationPackage.ownerAuthority.sourceRef &&
    value.fullTestAttempt === operationPackage.operationFacts.fullTestAttempt &&
    value.verifiedCandidateRef ===
      operationPackage.operationFacts.verifiedCandidateRef &&
    value.fullTestExecutionRef ===
      operationPackage.operationFacts.fullTestExecutionRef
  );
}

function failure(
  reason: DeliveryFinalInvocationFailureReason,
  mutationStatus: DeliveryFinalInvocationFailure["mutationStatus"] = "not-written",
): DeliveryFinalInvocationFailure {
  return { status: "failed", reason, mutationStatus, record: null };
}

export async function invokeDeliveryFinalOperation(
  repositoryRoot: unknown,
  input: unknown,
  execute: DeliveryFinalExecute,
  readRequiredEvidence: ReadDeliveryRequiredEvidence,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryFinalInvocationOutcome> {
  if (!isCompletionSource(readRequiredEvidence))
    return failure("completion-source-unavailable");
  if (
    typeof execute !== "function" ||
    !isPreparationInput(input) ||
    typeof readRequiredEvidence !== "object" ||
    readRequiredEvidence === null
  ) {
    return failure("package-formation-rejected");
  }
  let completionChangeId: string | undefined;
  const operationPackage = await prepareDeliveryFinalOperationPackage(
    repositoryRoot,
    input,
    readRequiredEvidence,
    installation,
    (changeId) => {
      completionChangeId = changeId;
    },
  );
  if (operationPackage === null || typeof repositoryRoot !== "string") {
    const rejected = failure("package-formation-rejected");
    return completionChangeId === undefined
      ? rejected
      : { ...rejected, completionChangeId };
  }
  const guidanceBytes = await readExactDeliveryGuidance(
    installation,
    operationPackage.guidanceRef,
  );
  if (guidanceBytes === null) return failure("guidance-drift-rejected");
  const callbackPackage = formDeliveryOperationPackage(
    operationPackage.deliveryId,
    operationPackage.operationId,
    operationPackage.ownerAuthority,
    operationPackage.operationFacts,
    operationPackage.guidanceRef,
  );
  if (callbackPackage?.operationId !== "delivery-final") {
    return failure("package-formation-rejected");
  }

  let executionResult: unknown;
  try {
    executionResult = await execute({
      operationPackage: callbackPackage,
      guidance: Buffer.from(guidanceBytes),
    });
  } catch {
    return failure("execution-result-rejected");
  }
  if (!isExecutionResult(executionResult)) {
    return failure("execution-result-rejected");
  }
  if (executionResult.status === "correction-required") {
    return {
      status: "correction-required",
      reason: executionResult.reason,
      operationPackage,
      record: null,
    };
  }

  const revalidated = await prepareDeliveryFinalOperationPackage(
    repositoryRoot,
    input,
    readRequiredEvidence,
    installation,
  );
  if (
    revalidated === null ||
    !exactPackageEqual(revalidated, operationPackage) ||
    !(await revalidateDeliveryFinalCoordinationPrestate(
      repositoryRoot,
      operationPackage,
    ))
  ) {
    return {
      status: "correction-required",
      reason: "package-bound-prerequisite-drift",
      operationPackage,
      record: null,
    };
  }

  const revalidateRelated = async (): Promise<boolean> => {
    const facts = operationPackage.operationFacts;
    if ((await readProjectId(repositoryRoot)) !== facts.projectId) return false;
    const completions = await readDeliveryChangeCompletions(
      readRequiredEvidence,
      {
        repositoryRoot,
        projectId: facts.projectId,
        deliveryId: operationPackage.deliveryId,
        changeIds: facts.completedRequiredChangeIds,
      },
    );
    if (!isDeepStrictEqual(completions, facts.changeCompletions)) return false;
    try {
      const activeChanges = await observeOpenSpecActiveChanges({
        repositoryRoot,
        flowkitHome: input.flowkitHome,
      });
      if (activeChanges.changeIds.length !== 0) return false;
    } catch {
      return false;
    }
    if (
      (await readExactDeliveryGuidance(
        installation,
        operationPackage.guidanceRef,
      )) === null
    )
      return false;
    const current = await readCurrentDeliveryFullTest(
      repositoryRoot,
      operationPackage.deliveryId,
    );
    return (
      current.status === "passed" &&
      current.outcome.record.attemptId === facts.fullTestAttempt &&
      current.outcome.record.inputRef === facts.verifiedCandidateRef &&
      current.outcome.record.executionRef === facts.fullTestExecutionRef
    );
  };
  const written = await writeDeliveryFinalCoordinationClosure(
    repositoryRoot,
    operationPackage,
    revalidateRelated,
  );
  if (written.status !== "confirmed") {
    return failure(
      written.reason as DeliveryFinalInvocationFailureReason,
      written.mutationStatus,
    );
  }
  return { status: "terminal", operationPackage, record: written.record };
}
