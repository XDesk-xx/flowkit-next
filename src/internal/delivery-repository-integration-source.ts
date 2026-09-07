import type { OwnerAuthorityFact } from "../domain/authority.js";
import {
  isDeliveryCheckpointOperation,
  type DeliveryCheckpointOperation,
} from "../domain/delivery-repository-integration-operation.js";

export interface RepositoryIntegrationAuthorizationMaterial {
  readonly sourceRef: string;
  readonly ownerAuthorityRef: string;
  readonly ownerAuthoritySourceRef: string;
  readonly deliveryId: string;
  readonly deliveryBranch: string;
  readonly targetMainRef: string;
  readonly targetMainPreIntegrationCommit: string;
  readonly preIntegrationHead: string;
  readonly acceptedBaseCommit: string;
  readonly checkpointOperation: DeliveryCheckpointOperation;
  readonly reuseCheckpointSourceRef: string | null;
}

export interface RepositoryIntegrationAcceptanceMaterial {
  readonly sourceRef: string;
  readonly ownerAuthorityRef: string;
  readonly deliveryId: string;
  readonly targetMainRef: string;
  readonly targetMainPreIntegrationCommit: string;
  readonly checkpointOperation: DeliveryCheckpointOperation;
  readonly finalCommit: string;
  readonly acceptedMainCommit: string;
}

export interface ReadRepositoryIntegrationSource {
  readonly readAuthorization: (
    ownerAuthorityRef: string,
  ) =>
    | RepositoryIntegrationAuthorizationMaterial
    | Promise<RepositoryIntegrationAuthorizationMaterial>;
  readonly readAcceptance: (
    ownerAuthorityRef: string,
  ) =>
    | RepositoryIntegrationAcceptanceMaterial
    | Promise<RepositoryIntegrationAcceptanceMaterial>;
}

interface ExpectedAuthorization {
  readonly ownerAuthority: OwnerAuthorityFact;
  readonly deliveryId: string;
  readonly deliveryBranch: string;
  readonly targetMainRef: string;
  readonly targetMainPreIntegrationCommit: string;
  readonly preIntegrationHead: string;
  readonly acceptedBaseCommit: string;
  readonly checkpointOperation: DeliveryCheckpointOperation;
}

interface ExpectedAcceptance {
  readonly ownerAuthority: OwnerAuthorityFact;
  readonly deliveryId: string;
  readonly targetMainRef: string;
  readonly targetMainPreIntegrationCommit: string;
  readonly checkpointOperation: DeliveryCheckpointOperation;
  readonly finalCommit: string;
  readonly acceptedMainCommit: string;
}

function isSafeSourceRef(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !/[\r\n]/.test(value);
}

function sameOperation(
  left: DeliveryCheckpointOperation,
  right: DeliveryCheckpointOperation,
): boolean {
  return (
    isDeliveryCheckpointOperation(left) &&
    isDeliveryCheckpointOperation(right) &&
    left.kind === right.kind &&
    (left.kind === "create-new" ||
      (right.kind === "reuse-existing" &&
        left.checkpointCommit === right.checkpointCommit))
  );
}

function isSource(value: unknown): value is ReadRepositoryIntegrationSource {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ReadRepositoryIntegrationSource).readAuthorization ===
      "function" &&
    typeof (value as ReadRepositoryIntegrationSource).readAcceptance ===
      "function"
  );
}

export async function validateRepositoryIntegrationAuthorization(
  read: unknown,
  expected: ExpectedAuthorization,
): Promise<boolean> {
  if (!isSource(read)) return false;
  let material: RepositoryIntegrationAuthorizationMaterial;
  try {
    material = await read.readAuthorization(expected.ownerAuthority.ref);
  } catch {
    return false;
  }
  return (
    isSafeSourceRef(material?.sourceRef) &&
    material.ownerAuthorityRef === expected.ownerAuthority.ref &&
    material.ownerAuthoritySourceRef === expected.ownerAuthority.sourceRef &&
    material.deliveryId === expected.deliveryId &&
    material.deliveryBranch === expected.deliveryBranch &&
    material.targetMainRef === expected.targetMainRef &&
    material.targetMainPreIntegrationCommit ===
      expected.targetMainPreIntegrationCommit &&
    material.preIntegrationHead === expected.preIntegrationHead &&
    material.acceptedBaseCommit === expected.acceptedBaseCommit &&
    sameOperation(material.checkpointOperation, expected.checkpointOperation) &&
    (material.checkpointOperation.kind === "reuse-existing"
      ? isSafeSourceRef(material.reuseCheckpointSourceRef)
      : material.reuseCheckpointSourceRef === null)
  );
}

export async function validateRepositoryIntegrationAcceptance(
  read: unknown,
  expected: ExpectedAcceptance,
): Promise<boolean> {
  if (!isSource(read)) return false;
  let material: RepositoryIntegrationAcceptanceMaterial;
  try {
    material = await read.readAcceptance(expected.ownerAuthority.ref);
  } catch {
    return false;
  }
  return (
    isSafeSourceRef(material?.sourceRef) &&
    material.ownerAuthorityRef === expected.ownerAuthority.ref &&
    material.deliveryId === expected.deliveryId &&
    material.targetMainRef === expected.targetMainRef &&
    material.targetMainPreIntegrationCommit ===
      expected.targetMainPreIntegrationCommit &&
    sameOperation(material.checkpointOperation, expected.checkpointOperation) &&
    material.finalCommit === expected.finalCommit &&
    material.acceptedMainCommit === expected.acceptedMainCommit
  );
}
