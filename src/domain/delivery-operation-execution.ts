import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { isOwnerAuthorityFact, type OwnerAuthorityFact } from "./authority.js";
import { isSemanticId, type DeliveryId } from "./identity.js";

export const DELIVERY_OPERATIONS = [
  "delivery-start",
  "delivery-full-test",
  "delivery-architecture-finalization",
  "delivery-final",
  "delivery-repository-integration",
] as const;

export type DeliveryOperationId = (typeof DELIVERY_OPERATIONS)[number];

export function isDeliveryOperationId(
  value: unknown,
): value is DeliveryOperationId {
  return (
    typeof value === "string" &&
    (DELIVERY_OPERATIONS as readonly string[]).includes(value)
  );
}

const DELIVERY_GUIDANCE_PATHS: Readonly<Record<DeliveryOperationId, string>> = {
  "delivery-start": "skills/delivery/start/SKILL.md",
  "delivery-full-test": "skills/delivery/full-test/SKILL.md",
  "delivery-architecture-finalization":
    "skills/delivery/architecture-finalization/SKILL.md",
  "delivery-final": "skills/delivery/final/SKILL.md",
  "delivery-repository-integration":
    "skills/delivery/repository-integration/SKILL.md",
};

export function canonicalDeliveryGuidancePath(
  operationId: unknown,
): string | null {
  if (!isDeliveryOperationId(operationId)) return null;
  return DELIVERY_GUIDANCE_PATHS[operationId];
}

export interface DeliveryGuidanceRef {
  readonly path: string;
  readonly contentSha256: string;
}

const GUIDANCE_REF_FIELDS = ["path", "contentSha256"] as const;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const ARTIFACT_PATTERN = /^[!-~]{1,512}$/;

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

function operationIdFromCanonicalGuidancePath(
  value: unknown,
): DeliveryOperationId | null {
  if (typeof value !== "string") return null;
  for (const operationId of DELIVERY_OPERATIONS) {
    if (DELIVERY_GUIDANCE_PATHS[operationId] === value) return operationId;
  }
  return null;
}

export function isDeliveryGuidanceRef(
  value: unknown,
): value is DeliveryGuidanceRef {
  if (!isRecord(value) || !hasExactlyFields(value, GUIDANCE_REF_FIELDS)) {
    return false;
  }
  return (
    operationIdFromCanonicalGuidancePath(value.path) !== null &&
    typeof value.contentSha256 === "string" &&
    SHA256_HEX_PATTERN.test(value.contentSha256)
  );
}

export function isDeliveryGuidanceRefForOperation(
  value: unknown,
  operationId: unknown,
): value is DeliveryGuidanceRef {
  const expectedPath = canonicalDeliveryGuidancePath(operationId);
  return (
    expectedPath !== null &&
    isDeliveryGuidanceRef(value) &&
    value.path === expectedPath
  );
}

async function canonicalGuidanceEntry(
  repositoryRoot: string,
  relativePath: string,
): Promise<{ readonly path: string; readonly bytes: Buffer } | null> {
  try {
    const canonicalRoot = await realpath(repositoryRoot);
    const expectedPath = path.join(canonicalRoot, ...relativePath.split("/"));
    const entry = await lstat(expectedPath);
    if (!entry.isFile() || entry.isSymbolicLink()) return null;

    const resolvedPath = await realpath(expectedPath);
    if (resolvedPath !== expectedPath) return null;

    return { path: expectedPath, bytes: await readFile(expectedPath) };
  } catch {
    return null;
  }
}

export async function resolveDeliveryGuidanceRef(
  repositoryRoot: unknown,
  operationId: unknown,
): Promise<DeliveryGuidanceRef | null> {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    return null;
  }

  const relativePath = canonicalDeliveryGuidancePath(operationId);
  if (relativePath === null) return null;
  const entry = await canonicalGuidanceEntry(repositoryRoot, relativePath);
  if (entry === null) return null;

  return {
    path: relativePath,
    contentSha256: createHash("sha256").update(entry.bytes).digest("hex"),
  };
}

export async function readExactDeliveryGuidance(
  repositoryRoot: unknown,
  guidanceRef: unknown,
): Promise<Buffer | null> {
  if (
    typeof repositoryRoot !== "string" ||
    repositoryRoot.length === 0 ||
    !isDeliveryGuidanceRef(guidanceRef)
  ) {
    return null;
  }

  const entry = await canonicalGuidanceEntry(repositoryRoot, guidanceRef.path);
  if (entry === null) return null;
  const contentSha256 = createHash("sha256").update(entry.bytes).digest("hex");
  return contentSha256 === guidanceRef.contentSha256 ? entry.bytes : null;
}

export interface DeliveryPlanningReference {
  readonly artifact: string;
  readonly contentSha256: string;
}

const PLANNING_REFERENCE_FIELDS = ["artifact", "contentSha256"] as const;

export function isDeliveryPlanningReference(
  value: unknown,
): value is DeliveryPlanningReference {
  if (!isRecord(value) || !hasExactlyFields(value, PLANNING_REFERENCE_FIELDS)) {
    return false;
  }
  return (
    typeof value.artifact === "string" &&
    ARTIFACT_PATTERN.test(value.artifact) &&
    !value.artifact.includes("..") &&
    typeof value.contentSha256 === "string" &&
    SHA256_HEX_PATTERN.test(value.contentSha256)
  );
}

export interface DeliveryStartOperationFacts {
  readonly acceptedBaseCommit: string;
  readonly planningReference: DeliveryPlanningReference;
}

const DELIVERY_START_FACT_FIELDS = [
  "acceptedBaseCommit",
  "planningReference",
] as const;

export function isDeliveryStartOperationFacts(
  value: unknown,
): value is DeliveryStartOperationFacts {
  if (
    !isRecord(value) ||
    !hasExactlyFields(value, DELIVERY_START_FACT_FIELDS)
  ) {
    return false;
  }
  return (
    typeof value.acceptedBaseCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.acceptedBaseCommit) &&
    isDeliveryPlanningReference(value.planningReference)
  );
}

export function isDeliveryStartAuthorityForDelivery(
  value: unknown,
  deliveryId: unknown,
): value is OwnerAuthorityFact {
  return (
    isSemanticId(deliveryId) &&
    isOwnerAuthorityFact(value) &&
    value.deliveryId === deliveryId &&
    value.changeId === undefined &&
    value.decision === "create-delivery" &&
    value.scope.includes("delivery-start")
  );
}

export function hasDeliveryStartCommitAuthority(
  value: unknown,
  deliveryId: unknown,
): value is OwnerAuthorityFact {
  return (
    isDeliveryStartAuthorityForDelivery(value, deliveryId) &&
    value.scope.includes("single-delivery-start-fixed-point-commit")
  );
}

export interface DeliveryOperationPackage {
  readonly deliveryId: DeliveryId;
  readonly operationId: DeliveryOperationId;
  readonly ownerAuthority: OwnerAuthorityFact | null;
  readonly operationFacts: DeliveryStartOperationFacts;
  readonly guidanceRef: DeliveryGuidanceRef;
}

const DELIVERY_OPERATION_PACKAGE_FIELDS = [
  "deliveryId",
  "operationId",
  "ownerAuthority",
  "operationFacts",
  "guidanceRef",
] as const;

export function isDeliveryOperationPackage(
  value: unknown,
): value is DeliveryOperationPackage {
  if (
    !isRecord(value) ||
    !hasExactlyFields(value, DELIVERY_OPERATION_PACKAGE_FIELDS)
  ) {
    return false;
  }

  if (!isSemanticId(value.deliveryId)) return false;
  if (!isDeliveryOperationId(value.operationId)) return false;
  if (
    !isDeliveryGuidanceRefForOperation(value.guidanceRef, value.operationId)
  ) {
    return false;
  }

  switch (value.operationId) {
    case "delivery-start":
      return (
        isDeliveryStartOperationFacts(value.operationFacts) &&
        isDeliveryStartAuthorityForDelivery(
          value.ownerAuthority,
          value.deliveryId,
        )
      );
    case "delivery-full-test":
    case "delivery-architecture-finalization":
    case "delivery-final":
    case "delivery-repository-integration":
      return false;
  }
}

function clonePlanningReference(
  reference: DeliveryPlanningReference,
): DeliveryPlanningReference {
  return {
    artifact: reference.artifact,
    contentSha256: reference.contentSha256,
  };
}

function cloneStartFacts(
  facts: DeliveryStartOperationFacts,
): DeliveryStartOperationFacts {
  return {
    acceptedBaseCommit: facts.acceptedBaseCommit,
    planningReference: clonePlanningReference(facts.planningReference),
  };
}

function cloneAuthority(authority: OwnerAuthorityFact): OwnerAuthorityFact {
  return {
    ref: authority.ref,
    decision: authority.decision,
    deliveryId: authority.deliveryId,
    ...(authority.changeId === undefined
      ? {}
      : { changeId: authority.changeId }),
    sourceRef: authority.sourceRef,
    scope: [...authority.scope],
  };
}

function cloneGuidanceRef(ref: DeliveryGuidanceRef): DeliveryGuidanceRef {
  return { path: ref.path, contentSha256: ref.contentSha256 };
}

export function formDeliveryOperationPackage(
  deliveryId: unknown,
  operationId: unknown,
  ownerAuthority: unknown,
  operationFacts: unknown,
  guidanceRef: unknown,
): DeliveryOperationPackage | null {
  if (!isSemanticId(deliveryId) || operationId !== "delivery-start") {
    return null;
  }
  if (!isDeliveryStartOperationFacts(operationFacts)) return null;
  if (!isDeliveryStartAuthorityForDelivery(ownerAuthority, deliveryId)) {
    return null;
  }
  if (!isDeliveryGuidanceRefForOperation(guidanceRef, operationId)) {
    return null;
  }

  const candidate: DeliveryOperationPackage = {
    deliveryId,
    operationId,
    ownerAuthority: cloneAuthority(ownerAuthority),
    operationFacts: cloneStartFacts(operationFacts),
    guidanceRef: cloneGuidanceRef(guidanceRef),
  };
  return isDeliveryOperationPackage(candidate) ? candidate : null;
}
