import { isOwnerAuthorityFact, type OwnerAuthorityFact } from "./authority.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import { isHashRef } from "../internal/applicable-check-identity.js";

const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const DELIVERY_FINALIZATION_REF_PATTERN =
  /^delivery-finalization:sha256:[0-9a-f]{64}$/;
const BRANCH_PATTERN =
  /^(?![./])(?!.*\.\.)(?!.*\s)(?!.*~)(?!.*\^)(?!.*:)(?!.*\?)(?!.*\*)(?!.*\[)(?!.*\\)[!-~]{1,240}$/;
const TARGET_MAIN_REF_PATTERN = /^refs\/heads\/[!-~]{1,240}$/;

export interface DeliveryRepositoryIntegrationOperationFacts {
  readonly deliveryFinalizationRef: string;
  readonly finalizedCandidateRef: string;
  readonly preIntegrationHead: string;
  readonly checkpointOperation: DeliveryCheckpointOperation;
  readonly deliveryBranch: string;
  readonly targetMainRef: string;
  readonly targetMainPreIntegrationCommit: string;
  readonly acceptedBaseCommit: string;
}

export type DeliveryCheckpointOperation =
  | { readonly kind: "create-new" }
  | { readonly kind: "reuse-existing"; readonly checkpointCommit: string };

const FACT_FIELDS = [
  "deliveryFinalizationRef",
  "finalizedCandidateRef",
  "preIntegrationHead",
  "checkpointOperation",
  "deliveryBranch",
  "targetMainRef",
  "targetMainPreIntegrationCommit",
  "acceptedBaseCommit",
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

export function isDeliveryCheckpointOperation(
  value: unknown,
): value is DeliveryCheckpointOperation {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  if (value.kind === "create-new") return hasExactlyFields(value, ["kind"]);
  return (
    value.kind === "reuse-existing" &&
    hasExactlyFields(value, ["kind", "checkpointCommit"]) &&
    typeof value.checkpointCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.checkpointCommit)
  );
}

export function isDeliveryRepositoryIntegrationOperationFacts(
  value: unknown,
): value is DeliveryRepositoryIntegrationOperationFacts {
  return (
    isRecord(value) &&
    hasExactlyFields(value, FACT_FIELDS) &&
    typeof value.deliveryFinalizationRef === "string" &&
    DELIVERY_FINALIZATION_REF_PATTERN.test(value.deliveryFinalizationRef) &&
    isHashRef(value.finalizedCandidateRef, "candidate") &&
    typeof value.preIntegrationHead === "string" &&
    GIT_COMMIT_PATTERN.test(value.preIntegrationHead) &&
    isDeliveryCheckpointOperation(value.checkpointOperation) &&
    typeof value.deliveryBranch === "string" &&
    BRANCH_PATTERN.test(value.deliveryBranch) &&
    !value.deliveryBranch.endsWith(".") &&
    !value.deliveryBranch.endsWith(".lock") &&
    typeof value.targetMainRef === "string" &&
    TARGET_MAIN_REF_PATTERN.test(value.targetMainRef) &&
    !value.targetMainRef.endsWith(".lock") &&
    typeof value.targetMainPreIntegrationCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.targetMainPreIntegrationCommit) &&
    typeof value.acceptedBaseCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.acceptedBaseCommit)
  );
}

export function isRepositoryIntegrationAuthorityForDelivery(
  value: unknown,
  deliveryId: unknown,
): value is OwnerAuthorityFact {
  return (
    isSemanticId(deliveryId) &&
    isOwnerAuthorityFact(value) &&
    value.deliveryId === deliveryId &&
    value.changeId === undefined &&
    value.decision === "authorize-repository-integration" &&
    value.scope.length === 1 &&
    value.scope[0] === "delivery-repository-integration"
  );
}

export function cloneDeliveryRepositoryIntegrationOperationFacts(
  facts: DeliveryRepositoryIntegrationOperationFacts,
): DeliveryRepositoryIntegrationOperationFacts {
  return {
    ...facts,
    checkpointOperation:
      facts.checkpointOperation.kind === "create-new"
        ? { kind: "create-new" }
        : {
            kind: "reuse-existing",
            checkpointCommit: facts.checkpointOperation.checkpointCommit,
          },
  };
}

export function repositoryIntegrationFactsBelongToDelivery(
  value: unknown,
  deliveryId: DeliveryId,
): value is DeliveryRepositoryIntegrationOperationFacts {
  return (
    isSemanticId(deliveryId) &&
    isDeliveryRepositoryIntegrationOperationFacts(value)
  );
}
