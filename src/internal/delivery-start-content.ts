import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { isSemanticId } from "../domain/identity.js";
import type { DeliveryPlanningReference } from "../domain/delivery-operation-execution.js";
import { deriveApplicableCheckCandidateRef } from "../domain/applicable-check-execution.js";
import { compareUtf8 } from "./applicable-check-material.js";
import {
  hasExactlyFields,
  isPlainRecord,
  isSafeText,
} from "./applicable-check-identity.js";
import {
  isEvidenceArtifactRef,
  type EvidenceArtifactRef,
} from "./delivery-required-evidence.js";

export interface DeliveryStartValidation {
  readonly sourceRef: string;
  readonly artifacts: readonly EvidenceArtifactRef[];
}

export interface DeliveryStartContentCompletion {
  readonly projectId: string;
  readonly deliveryId: string;
  readonly acceptedBaseCommit: string;
  readonly planningReference: DeliveryPlanningReference;
  readonly outputs: readonly EvidenceArtifactRef[];
  readonly candidateRef: string;
  readonly validation: DeliveryStartValidation;
}

export interface DeliveryStartValidatedSurface {
  readonly status: "validated";
  readonly validation: DeliveryStartValidation;
}

export interface DeliveryStartValidationMaterial {
  readonly projectId: string;
  readonly deliveryId: string;
  readonly acceptedBaseCommit: string;
  readonly planningReference: DeliveryPlanningReference;
  readonly outputs: readonly EvidenceArtifactRef[];
  readonly sourceRef: string;
  readonly outcomeJson: Uint8Array;
  readonly artifacts: readonly {
    readonly artifact: string;
    readonly bytes: Uint8Array;
  }[];
}

type DeliveryStartCheckId =
  | "git-start-prestate"
  | "openspec-delivery-manifest"
  | "archify-current"
  | "archify-planned"
  | "archify-current-to-planned"
  | "content-receipt";

interface DeliveryStartCheckOutcome {
  readonly checkId: DeliveryStartCheckId;
  readonly tool: "git" | "openspec" | "archify" | "flowkit";
  readonly exitCode: 0;
  readonly inputs: readonly string[];
  readonly outputArtifacts: readonly string[];
}

export type ReadDeliveryStartValidation = (
  sourceRef: string,
) => DeliveryStartValidationMaterial | Promise<DeliveryStartValidationMaterial>;

const HASH = /^[0-9a-f]{64}$/;

function fixedOutputs(deliveryId: string): string[] {
  const architecture = `architecture/${deliveryId}/json`;
  return [
    `openspec/delivery-groups/${deliveryId}.yaml`,
    `${architecture}/current.architecture.json`,
    `${architecture}/planned.architecture.json`,
    `${architecture}/current-to-planned.compare.json`,
  ];
}

export function isDeliveryStartValidatedSurface(
  value: unknown,
): value is DeliveryStartValidatedSurface {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, ["status", "validation"]) ||
    value.status !== "validated"
  )
    return false;
  const validation = value.validation;
  if (
    !isPlainRecord(validation) ||
    !hasExactlyFields(validation, ["sourceRef", "artifacts"]) ||
    !isSafeText(validation.sourceRef) ||
    !isDenseArtifactRefArray(validation.artifacts)
  )
    return false;
  const artifacts = validation.artifacts as EvidenceArtifactRef[];
  return (
    artifacts.length > 0 &&
    artifacts.every(
      (entry, index) =>
        index === 0 ||
        compareUtf8(artifacts[index - 1].artifact, entry.artifact) < 0,
    )
  );
}

async function readRegularArtifact(
  root: string,
  artifact: string,
): Promise<EvidenceArtifactRef | null> {
  try {
    const canonicalRoot = await realpath(root);
    const target = path.resolve(canonicalRoot, ...artifact.split("/"));
    if (!target.startsWith(`${canonicalRoot}${path.sep}`)) return null;
    const stat = await lstat(target);
    if (!stat.isFile() || stat.isSymbolicLink()) return null;
    const bytes = await readFile(target);
    return {
      artifact,
      contentSha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    };
  } catch {
    return null;
  }
}

async function readProjectId(root: string): Promise<string | null> {
  try {
    const value = JSON.parse(
      await readFile(path.join(root, ".flowkit", "project.json"), "utf8"),
    ) as unknown;
    return isPlainRecord(value) && isSemanticId(value.projectId)
      ? value.projectId
      : null;
  } catch {
    return null;
  }
}

function sameArtifactRefs(left: unknown, right: unknown): boolean {
  return (
    isDenseArtifactRefArray(left) &&
    isDenseArtifactRefArray(right) &&
    left.length === right.length &&
    left.every(
      (entry, index) =>
        entry.artifact === right[index].artifact &&
        entry.contentSha256 === right[index].contentSha256 &&
        entry.bytes === right[index].bytes,
    )
  );
}

function isDenseArtifactRefArray(
  value: unknown,
): value is readonly EvidenceArtifactRef[] {
  if (!Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index) || !isEvidenceArtifactRef(value[index])) {
      return false;
    }
  }
  return true;
}

async function readTrustedValidation(
  read: unknown,
  sourceRef: string,
): Promise<DeliveryStartValidationMaterial | null> {
  if (typeof read !== "function") return null;
  try {
    const material = await (read as ReadDeliveryStartValidation)(sourceRef);
    return isPlainRecord(material) ? material : null;
  } catch {
    return null;
  }
}

function validationArtifactRefs(
  artifacts: DeliveryStartValidationMaterial["artifacts"],
): readonly EvidenceArtifactRef[] | null {
  if (!Array.isArray(artifacts) || artifacts.length === 0) return null;
  for (let index = 0; index < artifacts.length; index += 1) {
    if (!Object.hasOwn(artifacts, index)) return null;
  }
  const refs = artifacts.map((entry) => {
    if (
      !isPlainRecord(entry) ||
      !isSafeText(entry.artifact) ||
      !(entry.bytes instanceof Uint8Array) ||
      entry.bytes.byteLength === 0
    )
      return null;
    return {
      artifact: entry.artifact,
      contentSha256: createHash("sha256").update(entry.bytes).digest("hex"),
      bytes: entry.bytes.byteLength,
    };
  });
  if (refs.some((entry) => entry === null)) return null;
  const sorted = refs as EvidenceArtifactRef[];
  sorted.sort((left, right) => compareUtf8(left.artifact, right.artifact));
  return sorted.every(
    (entry, index) =>
      index === 0 || sorted[index - 1].artifact !== entry.artifact,
  )
    ? sorted
    : null;
}

function artifactInput(ref: EvidenceArtifactRef): string {
  return `${ref.artifact}@sha256:${ref.contentSha256}:${ref.bytes}`;
}

function expectedValidationChecks(
  acceptedBaseCommit: string,
  planningReference: DeliveryPlanningReference,
  outputs: readonly EvidenceArtifactRef[],
  validationArtifacts: readonly EvidenceArtifactRef[],
): readonly DeliveryStartCheckOutcome[] {
  const receipts = validationArtifacts.map((entry) => entry.artifact);
  const check = (
    checkId: DeliveryStartCheckId,
    tool: DeliveryStartCheckOutcome["tool"],
    inputs: readonly string[],
  ): DeliveryStartCheckOutcome => ({
    checkId,
    tool,
    exitCode: 0,
    inputs,
    outputArtifacts: receipts,
  });
  return [
    check("git-start-prestate", "git", [
      `commit:${acceptedBaseCommit}`,
      "working-tree:clean",
    ]),
    check("openspec-delivery-manifest", "openspec", [
      artifactInput(outputs[0]),
    ]),
    check("archify-current", "archify", [artifactInput(outputs[1])]),
    check("archify-planned", "archify", [artifactInput(outputs[2])]),
    check("archify-current-to-planned", "archify", [
      artifactInput(outputs[1]),
      artifactInput(outputs[2]),
      artifactInput(outputs[3]),
    ]),
    check("content-receipt", "flowkit", [
      `planning:${planningReference.artifact}@sha256:${planningReference.contentSha256}`,
      ...outputs.map(artifactInput),
    ]),
  ];
}

function hasSuccessfulCompleteOutcome(
  material: DeliveryStartValidationMaterial,
  acceptedBaseCommit: string,
  planningReference: DeliveryPlanningReference,
  outputs: readonly EvidenceArtifactRef[],
  validationArtifacts: readonly EvidenceArtifactRef[],
): boolean {
  if (
    !(material.outcomeJson instanceof Uint8Array) ||
    material.outcomeJson.byteLength === 0 ||
    !material.artifacts.some(
      (entry) =>
        entry?.bytes instanceof Uint8Array &&
        Buffer.from(entry.bytes).equals(Buffer.from(material.outcomeJson)),
    )
  )
    return false;
  let outcome: unknown;
  try {
    outcome = JSON.parse(Buffer.from(material.outcomeJson).toString("utf8"));
  } catch {
    return false;
  }
  if (
    !isPlainRecord(outcome) ||
    !hasExactlyFields(outcome, ["status", "checks"]) ||
    outcome.status !== "passed" ||
    !Array.isArray(outcome.checks)
  )
    return false;
  return isDeepStrictEqual(
    outcome.checks,
    expectedValidationChecks(
      acceptedBaseCommit,
      planningReference,
      outputs,
      validationArtifacts,
    ),
  );
}

export async function formDeliveryStartContentCompletion(
  repositoryRoot: string,
  deliveryId: string,
  acceptedBaseCommit: string,
  planningReference: DeliveryPlanningReference,
  surface: DeliveryStartValidatedSurface,
  readValidation: unknown,
): Promise<DeliveryStartContentCompletion | null> {
  const projectId = await readProjectId(repositoryRoot);
  if (projectId === null) return null;
  const outputs = await Promise.all(
    fixedOutputs(deliveryId).map((artifact) =>
      readRegularArtifact(repositoryRoot, artifact),
    ),
  );
  if (outputs.some((entry) => entry === null)) return null;
  const candidateRef = await deriveApplicableCheckCandidateRef(repositoryRoot);
  if (
    candidateRef === null ||
    !HASH.test(candidateRef.slice("candidate:sha256:".length))
  )
    return null;
  const validationMaterial = await readTrustedValidation(
    readValidation,
    surface.validation.sourceRef,
  );
  const validationArtifacts =
    validationMaterial === null
      ? null
      : validationArtifactRefs(validationMaterial.artifacts);
  if (
    validationMaterial === null ||
    validationArtifacts === null ||
    validationMaterial.projectId !== projectId ||
    validationMaterial.deliveryId !== deliveryId ||
    validationMaterial.acceptedBaseCommit !== acceptedBaseCommit ||
    validationMaterial.sourceRef !== surface.validation.sourceRef ||
    validationMaterial.planningReference?.artifact !==
      planningReference.artifact ||
    validationMaterial.planningReference?.contentSha256 !==
      planningReference.contentSha256 ||
    !sameArtifactRefs(
      validationMaterial.outputs,
      outputs as EvidenceArtifactRef[],
    ) ||
    !sameArtifactRefs(validationArtifacts, surface.validation.artifacts) ||
    !hasSuccessfulCompleteOutcome(
      validationMaterial,
      acceptedBaseCommit,
      planningReference,
      outputs as EvidenceArtifactRef[],
      validationArtifacts,
    )
  )
    return null;
  return {
    projectId,
    deliveryId,
    acceptedBaseCommit,
    planningReference: { ...planningReference },
    outputs: outputs as EvidenceArtifactRef[],
    candidateRef,
    validation: {
      sourceRef: validationMaterial.sourceRef,
      artifacts: validationArtifacts.map((entry) => ({ ...entry })),
    },
  };
}
