import { isOwnerAuthorityFact, type OwnerAuthorityFact } from "./authority.js";
import { isSemanticId, type DeliveryId } from "./identity.js";

const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const DELIVERY_FINALIZATION_REF_PATTERN =
  /^delivery-finalization:sha256:[0-9a-f]{64}$/;
const BRANCH_PATTERN =
  /^(?![./])(?!.*\.\.)(?!.*\s)(?!.*~)(?!.*\^)(?!.*:)(?!.*\?)(?!.*\*)(?!.*\[)(?!.*\\)[!-~]{1,240}$/;
const TARGET_MAIN_REF_PATTERN = /^refs\/heads\/[!-~]{1,240}$/;

export interface DeliveryRepositoryIntegrationOperationFacts {
  readonly deliveryFinalizationRef: string;
  readonly preIntegrationHead: string;
  readonly checkpointOperation: DeliveryCheckpointOperation;
  readonly deliveryBranch: string;
  readonly targetMainRef: string;
  readonly targetMainPreIntegrationCommit: string;
  readonly acceptedBaseCommit: string;
}

export type DeliveryCheckpointOperation =
  | {
      readonly kind: "create-new";
      readonly paths: readonly string[];
      readonly commitMessage: string;
      readonly commitShape: {
        readonly parents: readonly string[];
        readonly count: number;
      } | null;
    }
  | { readonly kind: "reuse-existing"; readonly checkpointCommit: string };

const FACT_FIELDS = [
  "deliveryFinalizationRef",
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
  if (value.kind === "create-new") {
    const shape = value.commitShape;
    return (
      hasExactlyFields(value, [
        "kind",
        "paths",
        "commitMessage",
        "commitShape",
      ]) &&
      Array.isArray(value.paths) &&
      value.paths.length > 0 &&
      value.paths.every(
        (p, i, paths) => isExactGitPath(p) && (i === 0 || paths[i - 1] < p),
      ) &&
      typeof value.commitMessage === "string" &&
      value.commitMessage.trim().length > 0 &&
      !/[\r\n\0]/.test(value.commitMessage) &&
      (shape === null ||
        (isRecord(shape) &&
          hasExactlyFields(shape, ["parents", "count"]) &&
          Array.isArray(shape.parents) &&
          shape.parents.every(
            (p) => typeof p === "string" && GIT_COMMIT_PATTERN.test(p),
          ) &&
          new Set(shape.parents).size === shape.parents.length &&
          Number.isSafeInteger(shape.count) &&
          (shape.count as number) > 0))
    );
  }
  return (
    value.kind === "reuse-existing" &&
    hasExactlyFields(value, ["kind", "checkpointCommit"]) &&
    typeof value.checkpointCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.checkpointCommit)
  );
}

export function isExactGitPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !/[\\:\0\r\n*?[\]]/.test(value) &&
    value
      .split("/")
      .every(
        (part) =>
          part !== "" &&
          part !== "." &&
          part !== ".." &&
          part.toLowerCase() !== ".git",
      )
  );
}

export function cloneCheckpointOperation(
  operation: DeliveryCheckpointOperation,
): DeliveryCheckpointOperation {
  return operation.kind === "reuse-existing"
    ? { kind: "reuse-existing", checkpointCommit: operation.checkpointCommit }
    : {
        kind: "create-new",
        paths: [...operation.paths],
        commitMessage: operation.commitMessage,
        commitShape:
          operation.commitShape === null
            ? null
            : {
                parents: [...operation.commitShape.parents],
                count: operation.commitShape.count,
              },
      };
}

export function sameCheckpointOperation(
  left: unknown,
  right: unknown,
): boolean {
  return (
    isDeliveryCheckpointOperation(left) &&
    isDeliveryCheckpointOperation(right) &&
    JSON.stringify(cloneCheckpointOperation(left)) ===
      JSON.stringify(cloneCheckpointOperation(right))
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
    checkpointOperation: cloneCheckpointOperation(facts.checkpointOperation),
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
