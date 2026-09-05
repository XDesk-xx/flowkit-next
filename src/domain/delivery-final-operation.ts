import { isOwnerAuthorityFact, type OwnerAuthorityFact } from "./authority.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import {
  hasNoDuplicates,
  isHashRef,
} from "../internal/applicable-check-identity.js";

export interface DeliveryCoordinationRef {
  readonly artifact: string;
  readonly contentSha256: string;
  readonly bytes: number;
}

export interface DeliveryFinalOperationFacts {
  readonly verifiedCandidateRef: string;
  readonly fullTestExecutionRef: string;
  readonly architectureFinalizationRef: string;
  readonly architectureMaterializedCandidateRef: string;
  readonly coordinationPrestateRef: DeliveryCoordinationRef;
  readonly completedRequiredChangeIds: readonly string[];
}

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const FULL_TEST_EXECUTION_REF_PATTERN =
  /^full-test-execution:sha256:[0-9a-f]{64}$/;
const ARCHITECTURE_FINALIZATION_REF_PATTERN =
  /^architecture-finalization:sha256:[0-9a-f]{64}$/;
const COORDINATION_REF_FIELDS = ["artifact", "contentSha256", "bytes"] as const;
const FINAL_FACT_FIELDS = [
  "verifiedCandidateRef",
  "fullTestExecutionRef",
  "architectureFinalizationRef",
  "architectureMaterializedCandidateRef",
  "coordinationPrestateRef",
  "completedRequiredChangeIds",
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
  return (
    isRecord(value) &&
    hasExactlyFields(value, FINAL_FACT_FIELDS) &&
    isHashRef(value.verifiedCandidateRef, "candidate") &&
    typeof value.fullTestExecutionRef === "string" &&
    FULL_TEST_EXECUTION_REF_PATTERN.test(value.fullTestExecutionRef) &&
    typeof value.architectureFinalizationRef === "string" &&
    ARCHITECTURE_FINALIZATION_REF_PATTERN.test(
      value.architectureFinalizationRef,
    ) &&
    isHashRef(value.architectureMaterializedCandidateRef, "candidate") &&
    isDeliveryCoordinationRef(value.coordinationPrestateRef) &&
    Array.isArray(value.completedRequiredChangeIds) &&
    value.completedRequiredChangeIds.length > 0 &&
    value.completedRequiredChangeIds.every(isSemanticId) &&
    hasNoDuplicates(value.completedRequiredChangeIds)
  );
}

export function isDeliveryFinalOperationFactsForDelivery(
  value: unknown,
  deliveryId: DeliveryId,
): value is DeliveryFinalOperationFacts {
  return (
    isDeliveryFinalOperationFacts(value) &&
    value.coordinationPrestateRef.artifact ===
      `openspec/delivery-groups/${deliveryId}.yaml`
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
    verifiedCandidateRef: facts.verifiedCandidateRef,
    fullTestExecutionRef: facts.fullTestExecutionRef,
    architectureFinalizationRef: facts.architectureFinalizationRef,
    architectureMaterializedCandidateRef:
      facts.architectureMaterializedCandidateRef,
    coordinationPrestateRef: {
      artifact: facts.coordinationPrestateRef.artifact,
      contentSha256: facts.coordinationPrestateRef.contentSha256,
      bytes: facts.coordinationPrestateRef.bytes,
    },
    completedRequiredChangeIds: [...facts.completedRequiredChangeIds],
  };
}
