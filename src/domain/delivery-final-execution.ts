import {
  loadManagerInstallation,
  type ManagerInstallation,
} from "../internal/manager-installation.js";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { deriveApplicableCheckCandidateRef } from "./applicable-check-execution.js";
import {
  formDeliveryOperationPackage,
  isDeliveryOperationPackage,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryFinalOperationPackage,
} from "./delivery-operation-execution.js";
import {
  isDeliveryCoordinationRef,
  isDeliveryFinalAuthorityForDelivery,
} from "./delivery-final-operation.js";
import {
  cloneDeliveryRequiredEvidence,
  isDeliveryRequiredEvidence,
} from "../internal/delivery-required-evidence.js";
import {
  deriveDeliveryRequiredEvidenceFromSource,
  type ReadDeliveryRequiredEvidence,
} from "../internal/delivery-required-evidence-source.js";
export type { ReadDeliveryRequiredEvidence } from "../internal/delivery-required-evidence-source.js";
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

export interface DeliveryFinalizationRecord {
  readonly deliveryFinalizationRef: string;
  readonly verifiedCandidateRef: string;
  readonly fullTestExecutionRef: string;
  readonly coordinationRef: {
    readonly artifact: string;
    readonly contentSha256: string;
    readonly bytes: number;
  };
  readonly finalizedCandidateRef: string;
}

export type DeliveryFinalInvocationFailureReason =
  | "package-formation-rejected"
  | "guidance-drift-rejected"
  | "execution-result-rejected"
  | "coordination-materialization-rejected"
  | "finalized-candidate-rejected";

export interface DeliveryFinalInvocationFailure {
  readonly status: "failed";
  readonly reason: DeliveryFinalInvocationFailureReason;
  readonly record: null;
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

const CANDIDATE_REF_PATTERN = /^candidate:sha256:[0-9a-f]{64}$/;
const DELIVERY_FINALIZATION_REF_PATTERN =
  /^delivery-finalization:sha256:[0-9a-f]{64}$/;

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
  const requiredEvidence = await deriveDeliveryRequiredEvidenceFromSource(
    readRequiredEvidence,
    {
      repositoryRoot,
      projectId,
      deliveryId: input.deliveryId,
      changeIds: coordination.completedRequiredChangeIds,
      fullTestExecutionRef: fullTestOutcome.record.executionRef,
      fullTestOutcome: fullTestOutcome,
    },
  );
  if (
    requiredEvidence === null ||
    !isDeliveryRequiredEvidence(requiredEvidence)
  )
    return null;

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
      requiredEvidence,
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

function finalizationHashMaterial(
  operationPackage: DeliveryFinalOperationPackage,
  coordinationRef: DeliveryFinalizationRecord["coordinationRef"],
  finalizedCandidateRef: string,
): unknown {
  return {
    deliveryId: operationPackage.deliveryId,
    operationId: operationPackage.operationId,
    ownerAuthority: {
      ref: operationPackage.ownerAuthority.ref,
      decision: operationPackage.ownerAuthority.decision,
      deliveryId: operationPackage.ownerAuthority.deliveryId,
      sourceRef: operationPackage.ownerAuthority.sourceRef,
      scope: [...operationPackage.ownerAuthority.scope],
    },
    operationFacts: {
      verifiedCandidateRef:
        operationPackage.operationFacts.verifiedCandidateRef,
      fullTestExecutionRef:
        operationPackage.operationFacts.fullTestExecutionRef,
      coordinationPrestateRef: {
        artifact:
          operationPackage.operationFacts.coordinationPrestateRef.artifact,
        contentSha256:
          operationPackage.operationFacts.coordinationPrestateRef.contentSha256,
        bytes: operationPackage.operationFacts.coordinationPrestateRef.bytes,
      },
      completedRequiredChangeIds: [
        ...operationPackage.operationFacts.completedRequiredChangeIds,
      ],
      requiredEvidence: cloneDeliveryRequiredEvidence(
        operationPackage.operationFacts.requiredEvidence,
      ),
    },
    guidanceRef: {
      path: operationPackage.guidanceRef.path,
      contentSha256: operationPackage.guidanceRef.contentSha256,
    },
    coordinationRef: {
      artifact: coordinationRef.artifact,
      contentSha256: coordinationRef.contentSha256,
      bytes: coordinationRef.bytes,
    },
    finalizedCandidateRef,
  };
}

export function deriveDeliveryFinalizationRef(
  operationPackage: unknown,
  coordinationRef: unknown,
  finalizedCandidateRef: unknown,
): string | null {
  if (
    !isDeliveryOperationPackage(operationPackage) ||
    operationPackage.operationId !== "delivery-final" ||
    !isDeliveryCoordinationRef(coordinationRef) ||
    coordinationRef.artifact !==
      `openspec/delivery-groups/${operationPackage.deliveryId}.yaml` ||
    typeof finalizedCandidateRef !== "string" ||
    !CANDIDATE_REF_PATTERN.test(finalizedCandidateRef)
  ) {
    return null;
  }
  const digest = createHash("sha256")
    .update("flowkit-delivery-finalization\0")
    .update(
      JSON.stringify(
        finalizationHashMaterial(
          operationPackage,
          coordinationRef,
          finalizedCandidateRef,
        ),
      ),
    )
    .digest("hex");
  return `delivery-finalization:sha256:${digest}`;
}

export function isDeliveryFinalizationRecordForPackage(
  value: unknown,
  operationPackage: unknown,
): value is DeliveryFinalizationRecord {
  if (
    !isRecord(value) ||
    !hasExactlyFields(value, [
      "deliveryFinalizationRef",
      "verifiedCandidateRef",
      "fullTestExecutionRef",
      "coordinationRef",
      "finalizedCandidateRef",
    ]) ||
    typeof value.deliveryFinalizationRef !== "string" ||
    !DELIVERY_FINALIZATION_REF_PATTERN.test(value.deliveryFinalizationRef) ||
    !isDeliveryOperationPackage(operationPackage) ||
    operationPackage.operationId !== "delivery-final" ||
    value.verifiedCandidateRef !==
      operationPackage.operationFacts.verifiedCandidateRef ||
    value.fullTestExecutionRef !==
      operationPackage.operationFacts.fullTestExecutionRef
  ) {
    return false;
  }
  return (
    deriveDeliveryFinalizationRef(
      operationPackage,
      value.coordinationRef,
      value.finalizedCandidateRef,
    ) === value.deliveryFinalizationRef
  );
}

function failure(
  reason: DeliveryFinalInvocationFailureReason,
): DeliveryFinalInvocationFailure {
  return { status: "failed", reason, record: null };
}

export async function invokeDeliveryFinalOperation(
  repositoryRoot: unknown,
  input: unknown,
  execute: DeliveryFinalExecute,
  readRequiredEvidence: ReadDeliveryRequiredEvidence,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryFinalInvocationOutcome> {
  if (
    typeof execute !== "function" ||
    typeof readRequiredEvidence !== "object" ||
    readRequiredEvidence === null
  ) {
    return failure("package-formation-rejected");
  }
  const operationPackage = await prepareDeliveryFinalOperationPackage(
    repositoryRoot,
    input,
    readRequiredEvidence,
    installation,
  );
  if (operationPackage === null || typeof repositoryRoot !== "string") {
    return failure("package-formation-rejected");
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

  const coordinationRef = await writeDeliveryFinalCoordinationClosure(
    repositoryRoot,
    operationPackage,
  );
  if (coordinationRef === null) {
    return failure("coordination-materialization-rejected");
  }
  const currentAfter = await readCurrentDeliveryFullTest(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  if (
    currentAfter.status !== "passed" ||
    currentAfter.outcome.record.executionRef !==
      operationPackage.operationFacts.fullTestExecutionRef
  )
    return failure("finalized-candidate-rejected");
  const finalizedCandidateRef =
    await deriveApplicableCheckCandidateRef(repositoryRoot);
  if (finalizedCandidateRef === null) {
    return failure("finalized-candidate-rejected");
  }
  const deliveryFinalizationRef = deriveDeliveryFinalizationRef(
    operationPackage,
    coordinationRef,
    finalizedCandidateRef,
  );
  if (deliveryFinalizationRef === null) {
    return failure("finalized-candidate-rejected");
  }
  const record: DeliveryFinalizationRecord = {
    deliveryFinalizationRef,
    verifiedCandidateRef: operationPackage.operationFacts.verifiedCandidateRef,
    fullTestExecutionRef: operationPackage.operationFacts.fullTestExecutionRef,
    coordinationRef,
    finalizedCandidateRef,
  };
  return isDeliveryFinalizationRecordForPackage(record, operationPackage)
    ? { status: "terminal", operationPackage, record }
    : failure("finalized-candidate-rejected");
}
