import { isHashRef } from "../internal/applicable-check-identity.js";
import type { DeliveryId } from "./identity.js";

export interface DeliveryArchitectureArtifactRef {
  readonly artifact: string;
  readonly contentSha256: string;
}

export interface DeliveryArchitectureSystemViewPrestate {
  readonly workflowSha256: string | null;
  readonly lifecycleSha256: string | null;
  readonly dataFlowSha256: string | null;
}

export interface DeliveryArchitectureFinalizationOperationFacts {
  readonly verifiedCandidateRef: string;
  readonly fullTestExecutionRef: string;
  readonly currentArchitectureRef: DeliveryArchitectureArtifactRef;
  readonly plannedArchitectureRef: DeliveryArchitectureArtifactRef;
  readonly systemViewPrestate: DeliveryArchitectureSystemViewPrestate;
}

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const ARTIFACT_PATTERN = /^[!-~]{1,512}$/;
const FULL_TEST_EXECUTION_REF_PATTERN =
  /^full-test-execution:sha256:[0-9a-f]{64}$/;
const ARTIFACT_REF_FIELDS = ["artifact", "contentSha256"] as const;
const SYSTEM_VIEW_PRESTATE_FIELDS = [
  "workflowSha256",
  "lifecycleSha256",
  "dataFlowSha256",
] as const;
const FINALIZATION_FACT_FIELDS = [
  "verifiedCandidateRef",
  "fullTestExecutionRef",
  "currentArchitectureRef",
  "plannedArchitectureRef",
  "systemViewPrestate",
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

export function isDeliveryArchitectureArtifactRef(
  value: unknown,
): value is DeliveryArchitectureArtifactRef {
  return (
    isRecord(value) &&
    hasExactlyFields(value, ARTIFACT_REF_FIELDS) &&
    typeof value.artifact === "string" &&
    ARTIFACT_PATTERN.test(value.artifact) &&
    !value.artifact.includes("..") &&
    typeof value.contentSha256 === "string" &&
    SHA256_HEX_PATTERN.test(value.contentSha256)
  );
}

export function isDeliveryArchitectureSystemViewPrestate(
  value: unknown,
): value is DeliveryArchitectureSystemViewPrestate {
  if (
    !isRecord(value) ||
    !hasExactlyFields(value, SYSTEM_VIEW_PRESTATE_FIELDS)
  ) {
    return false;
  }
  return [
    value.workflowSha256,
    value.lifecycleSha256,
    value.dataFlowSha256,
  ].every(
    (entry) =>
      entry === null ||
      (typeof entry === "string" && SHA256_HEX_PATTERN.test(entry)),
  );
}

export function isDeliveryArchitectureFinalizationOperationFacts(
  value: unknown,
): value is DeliveryArchitectureFinalizationOperationFacts {
  return (
    isRecord(value) &&
    hasExactlyFields(value, FINALIZATION_FACT_FIELDS) &&
    isHashRef(value.verifiedCandidateRef, "candidate") &&
    typeof value.fullTestExecutionRef === "string" &&
    FULL_TEST_EXECUTION_REF_PATTERN.test(value.fullTestExecutionRef) &&
    isDeliveryArchitectureArtifactRef(value.currentArchitectureRef) &&
    isDeliveryArchitectureArtifactRef(value.plannedArchitectureRef) &&
    isDeliveryArchitectureSystemViewPrestate(value.systemViewPrestate)
  );
}

export function isArchitectureFinalizationFactsForDelivery(
  value: unknown,
  deliveryId: DeliveryId,
): value is DeliveryArchitectureFinalizationOperationFacts {
  const prefix = `architecture/${deliveryId}/json`;
  return (
    isDeliveryArchitectureFinalizationOperationFacts(value) &&
    value.currentArchitectureRef.artifact ===
      `${prefix}/current.architecture.json` &&
    value.plannedArchitectureRef.artifact ===
      `${prefix}/planned.architecture.json`
  );
}

export function cloneArchitectureFinalizationFacts(
  facts: DeliveryArchitectureFinalizationOperationFacts,
): DeliveryArchitectureFinalizationOperationFacts {
  return {
    verifiedCandidateRef: facts.verifiedCandidateRef,
    fullTestExecutionRef: facts.fullTestExecutionRef,
    currentArchitectureRef: { ...facts.currentArchitectureRef },
    plannedArchitectureRef: { ...facts.plannedArchitectureRef },
    systemViewPrestate: { ...facts.systemViewPrestate },
  };
}
