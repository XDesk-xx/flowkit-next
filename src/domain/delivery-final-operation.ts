import { isFullTestRef } from "../internal/full-test-input.js";
import { isOwnerAuthorityFact, type OwnerAuthorityFact } from "./authority.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import { hasNoDuplicates } from "../internal/applicable-check-identity.js";
import {
  isDeliveryChangeCompletion,
  completionBelongsToDelivery,
  type DeliveryChangeCompletion,
} from "../internal/delivery-required-evidence-source.js";
import { isAttemptId } from "../internal/full-test-storage.js";

export interface DeliveryCoordinationRef {
  readonly artifact: string;
  readonly contentSha256: string;
  readonly bytes: number;
}

export interface DeliveryFinalOperationFacts {
  readonly projectId: string;
  readonly fullTestAttempt: string;
  readonly verifiedCandidateRef: string;
  readonly fullTestExecutionRef: string;
  readonly coordinationPrestateRef: DeliveryCoordinationRef;
  readonly completedRequiredChangeIds: readonly string[];
  readonly changeCompletions: readonly DeliveryChangeCompletion[];
}

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const FULL_TEST_EXECUTION_REF_PATTERN =
  /^full-test-execution:sha256:[0-9a-f]{64}$/;
const COORDINATION_REF_FIELDS = ["artifact", "contentSha256", "bytes"] as const;
const FINAL_FACT_FIELDS = [
  "projectId",
  "fullTestAttempt",
  "verifiedCandidateRef",
  "fullTestExecutionRef",
  "coordinationPrestateRef",
  "completedRequiredChangeIds",
  "changeCompletions",
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

export function isDeliveryCoordinationRef(
  value: unknown,
): value is DeliveryCoordinationRef {
  return (
    isRecord(value) &&
    hasExactlyFields(value, COORDINATION_REF_FIELDS) &&
    typeof value.artifact === "string" &&
    value.artifact.length > 0 &&
    !value.artifact.includes("..") &&
    typeof value.contentSha256 === "string" &&
    SHA256_HEX_PATTERN.test(value.contentSha256) &&
    typeof value.bytes === "number" &&
    Number.isSafeInteger(value.bytes) &&
    value.bytes > 0
  );
}

export function isDeliveryFinalOperationFacts(
  value: unknown,
): value is DeliveryFinalOperationFacts {
  if (!isRecord(value) || !hasExactlyFields(value, FINAL_FACT_FIELDS))
    return false;
  if (
    !Array.isArray(value.completedRequiredChangeIds) ||
    !Array.from(value.completedRequiredChangeIds).every(isSemanticId) ||
    !hasNoDuplicates(value.completedRequiredChangeIds) ||
    !Array.isArray(value.changeCompletions) ||
    !Array.from(value.changeCompletions).every(isDeliveryChangeCompletion)
  )
    return false;
  const changeIds = value.completedRequiredChangeIds as string[];
  return (
    changeIds.length > 0 &&
    isSemanticId(value.projectId) &&
    isAttemptId(value.fullTestAttempt) &&
    isFullTestRef(value.verifiedCandidateRef, "full-test-input") &&
    typeof value.fullTestExecutionRef === "string" &&
    FULL_TEST_EXECUTION_REF_PATTERN.test(value.fullTestExecutionRef) &&
    isDeliveryCoordinationRef(value.coordinationPrestateRef) &&
    value.changeCompletions.length === changeIds.length &&
    value.changeCompletions.every(
      (entry, index) => entry.changeId === changeIds[index],
    )
  );
}

export function isDeliveryFinalOperationFactsForDelivery(
  value: unknown,
  deliveryId: DeliveryId,
): value is DeliveryFinalOperationFacts {
  return (
    isDeliveryFinalOperationFacts(value) &&
    value.coordinationPrestateRef.artifact ===
      `openspec/delivery-groups/${deliveryId}.yaml` &&
    value.changeCompletions.every((entry) =>
      completionBelongsToDelivery(entry, deliveryId),
    )
  );
}

export function isDeliveryFinalAuthorityForDelivery(
  value: unknown,
  deliveryId: unknown,
): value is OwnerAuthorityFact {
  return (
    isSemanticId(deliveryId) &&
    isOwnerAuthorityFact(value) &&
    value.deliveryId === deliveryId &&
    value.changeId === undefined &&
    value.decision === "finalize-delivery" &&
    value.scope.length === 1 &&
    value.scope[0] === "delivery-final"
  );
}

export function cloneDeliveryFinalOperationFacts(
  facts: DeliveryFinalOperationFacts,
): DeliveryFinalOperationFacts {
  return {
    projectId: facts.projectId,
    fullTestAttempt: facts.fullTestAttempt,
    verifiedCandidateRef: facts.verifiedCandidateRef,
    fullTestExecutionRef: facts.fullTestExecutionRef,
    coordinationPrestateRef: {
      artifact: facts.coordinationPrestateRef.artifact,
      contentSha256: facts.coordinationPrestateRef.contentSha256,
      bytes: facts.coordinationPrestateRef.bytes,
    },
    completedRequiredChangeIds: [...facts.completedRequiredChangeIds],
    changeCompletions: facts.changeCompletions.map((entry) => ({
      ...entry,
      archiveResultRef: { ...entry.archiveResultRef },
      reviewResultRef: { ...entry.reviewResultRef },
    })),
  };
}

export type { EvidenceArtifactRef } from "../internal/delivery-required-evidence.js";
