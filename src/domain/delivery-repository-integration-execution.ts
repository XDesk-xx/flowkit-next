import {
  loadManagerInstallation,
  type ManagerInstallation,
} from "../internal/manager-installation.js";
import { deriveDeliveryRepositoryIntegrationRef } from "../internal/delivery-repository-integration-ref.js";
import { createHash } from "node:crypto";
export { deriveDeliveryRepositoryIntegrationRef } from "../internal/delivery-repository-integration-ref.js";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  deriveApplicableCheckCandidateRef,
  deriveApplicableCheckObjectCandidateRef,
} from "./applicable-check-execution.js";
import {
  formDeliveryOperationPackage,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryRepositoryIntegrationOperationPackage,
} from "./delivery-operation-execution.js";
import {
  isDeliveryFinalizationRecordForPackage,
  type DeliveryFinalInvocationTerminal,
} from "./delivery-final-execution.js";
import {
  cloneDeliveryRepositoryIntegrationOperationFacts,
  isDeliveryCheckpointOperation,
  isRepositoryIntegrationAuthorityForDelivery,
  type DeliveryCheckpointOperation,
  type DeliveryRepositoryIntegrationOperationFacts,
} from "./delivery-repository-integration-operation.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import {
  countGitCommits,
  isGitIndexAndWorktreeClean,
  observeGitParents,
  observeGitBranch,
  observeGitHead,
  resolveGitCommit,
} from "../internal/delivery-repository-integration-git.js";
import {
  revalidateDeliveryRequiredEvidenceAtObject,
  revalidateDeliveryRequiredEvidenceSource,
  type ReadDeliveryRequiredEvidence,
} from "../internal/delivery-required-evidence-source.js";
import {
  validateRepositoryIntegrationAcceptance,
  validateRepositoryIntegrationAuthorization,
  type ReadRepositoryIntegrationSource,
} from "../internal/delivery-repository-integration-source.js";
export type { ReadRepositoryIntegrationSource } from "../internal/delivery-repository-integration-source.js";

export interface DeliveryRepositoryIntegrationPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly ownerAuthority: DeliveryRepositoryIntegrationOperationPackage["ownerAuthority"];
  readonly deliveryFinalOutcome: DeliveryFinalInvocationTerminal;
  readonly deliveryBranch: string;
  readonly targetMainRef: string;
  readonly acceptedBaseCommit: string;
  readonly checkpointOperation: DeliveryCheckpointOperation;
}

export interface DeliveryRepositoryIntegrationExecutionInput {
  readonly operationPackage: DeliveryRepositoryIntegrationOperationPackage;
  readonly guidance: Buffer;
}

export interface DeliveryRepositoryIntegrationCommitResult {
  readonly status: "committed";
}

export interface DeliveryRepositoryIntegrationProviderResult {
  readonly status: "repository-acceptance-complete";
  readonly auditRef?: string;
}

export type DeliveryRepositoryIntegrationCommit = (
  input: DeliveryRepositoryIntegrationExecutionInput,
) => unknown | Promise<unknown>;

export type DeliveryRepositoryIntegrationProviderMechanics = (
  input: DeliveryRepositoryIntegrationExecutionInput & {
    readonly finalCommit: string;
  },
) => unknown | Promise<unknown>;

export interface DeliveryRepositoryIntegrationRecord {
  readonly repositoryIntegrationRef: string;
  readonly deliveryFinalizationRef: string;
  readonly finalizedCandidateRef: string;
  readonly preIntegrationHead: string;
  readonly checkpointOperation: DeliveryCheckpointOperation;
  readonly finalCommit: string;
  readonly targetMainRef: string;
  readonly targetMainPreIntegrationCommit: string;
  readonly acceptedMainCommit: string;
  readonly nextDeliveryBase: string;
}

export type DeliveryRepositoryIntegrationFailureReason =
  | "package-formation-rejected"
  | "guidance-drift-rejected"
  | "pre-integration-drift-rejected"
  | "final-commit-rejected"
  | "repository-acceptance-rejected"
  | "accepted-main-content-rejected";

export interface DeliveryRepositoryIntegrationFailure {
  readonly status: "failed";
  readonly reason: DeliveryRepositoryIntegrationFailureReason;
  readonly record: null;
}

export interface DeliveryRepositoryIntegrationTerminal {
  readonly status: "terminal";
  readonly operationPackage: DeliveryRepositoryIntegrationOperationPackage;
  readonly record: DeliveryRepositoryIntegrationRecord;
}

export type DeliveryRepositoryIntegrationOutcome =
  DeliveryRepositoryIntegrationFailure | DeliveryRepositoryIntegrationTerminal;

const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const REPOSITORY_INTEGRATION_REF_PATTERN =
  /^repository-integration:sha256:[0-9a-f]{64}$/;

function sameCheckpointOperation(
  left: DeliveryCheckpointOperation,
  right: DeliveryCheckpointOperation,
): boolean {
  return (
    left.kind === right.kind &&
    (left.kind === "create-new" ||
      (right.kind === "reuse-existing" &&
        left.checkpointCommit === right.checkpointCommit))
  );
}

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
): value is DeliveryRepositoryIntegrationPreparationInput {
  return (
    isRecord(value) &&
    hasExactlyFields(value, [
      "deliveryId",
      "ownerAuthority",
      "deliveryFinalOutcome",
      "deliveryBranch",
      "targetMainRef",
      "acceptedBaseCommit",
      "checkpointOperation",
    ]) &&
    isSemanticId(value.deliveryId) &&
    isRepositoryIntegrationAuthorityForDelivery(
      value.ownerAuthority,
      value.deliveryId,
    ) &&
    typeof value.deliveryBranch === "string" &&
    value.deliveryBranch.length > 0 &&
    typeof value.targetMainRef === "string" &&
    value.targetMainRef.startsWith("refs/heads/") &&
    typeof value.acceptedBaseCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.acceptedBaseCommit) &&
    isDeliveryCheckpointOperation(value.checkpointOperation)
  );
}

function trustedFinalOutcome(
  value: unknown,
  deliveryId: DeliveryId,
): value is DeliveryFinalInvocationTerminal {
  return (
    isRecord(value) &&
    value.status === "terminal" &&
    isRecord(value.operationPackage) &&
    value.operationPackage.operationId === "delivery-final" &&
    value.operationPackage.deliveryId === deliveryId &&
    isDeliveryFinalizationRecordForPackage(value.record, value.operationPackage)
  );
}

async function exactCoordinationRefStillMatches(
  repositoryRoot: string,
  input: DeliveryFinalInvocationTerminal,
): Promise<boolean> {
  const ref = input.record.coordinationRef;
  try {
    const bytes = await readFile(
      path.join(repositoryRoot, ...ref.artifact.split("/")),
    );
    return (
      bytes.length === ref.bytes &&
      createHash("sha256").update(bytes).digest("hex") === ref.contentSha256
    );
  } catch {
    return false;
  }
}

async function observePreparationFacts(
  repositoryRoot: string,
  input: DeliveryRepositoryIntegrationPreparationInput,
): Promise<DeliveryRepositoryIntegrationOperationFacts | null> {
  if (!trustedFinalOutcome(input.deliveryFinalOutcome, input.deliveryId)) {
    return null;
  }
  if (
    !(await exactCoordinationRefStillMatches(
      repositoryRoot,
      input.deliveryFinalOutcome,
    ))
  ) {
    return null;
  }
  const finalRecord = input.deliveryFinalOutcome.record;
  const currentCandidate =
    await deriveApplicableCheckCandidateRef(repositoryRoot);
  if (currentCandidate !== finalRecord.finalizedCandidateRef) return null;

  const [head, branch, targetMainCommit, acceptedBaseCommit] =
    await Promise.all([
      observeGitHead(repositoryRoot),
      observeGitBranch(repositoryRoot),
      resolveGitCommit(repositoryRoot, input.targetMainRef),
      resolveGitCommit(repositoryRoot, input.acceptedBaseCommit),
    ]);
  if (
    head === null ||
    branch !== input.deliveryBranch ||
    targetMainCommit === null ||
    acceptedBaseCommit !== input.acceptedBaseCommit
  ) {
    return null;
  }

  return {
    deliveryFinalizationRef: finalRecord.deliveryFinalizationRef,
    finalizedCandidateRef: finalRecord.finalizedCandidateRef,
    preIntegrationHead: head,
    checkpointOperation: input.checkpointOperation,
    deliveryBranch: branch,
    targetMainRef: input.targetMainRef,
    targetMainPreIntegrationCommit: targetMainCommit,
    acceptedBaseCommit: input.acceptedBaseCommit,
  };
}

export async function prepareDeliveryRepositoryIntegrationOperationPackage(
  repositoryRoot: unknown,
  input: unknown,
  readRequiredEvidence: unknown,
  readIntegrationSource: unknown,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryRepositoryIntegrationOperationPackage | null> {
  if (
    typeof repositoryRoot !== "string" ||
    repositoryRoot.length === 0 ||
    !isPreparationInput(input)
  ) {
    return null;
  }
  const facts = await observePreparationFacts(repositoryRoot, input);
  if (facts === null) return null;
  if (
    !(await validateRepositoryIntegrationAuthorization(readIntegrationSource, {
      ownerAuthority: input.ownerAuthority,
      deliveryId: input.deliveryId,
      deliveryBranch: facts.deliveryBranch,
      targetMainRef: facts.targetMainRef,
      targetMainPreIntegrationCommit: facts.targetMainPreIntegrationCommit,
      preIntegrationHead: facts.preIntegrationHead,
      acceptedBaseCommit: facts.acceptedBaseCommit,
      checkpointOperation: facts.checkpointOperation,
    }))
  )
    return null;
  if (
    !(await revalidateDeliveryRequiredEvidenceSource(
      input.deliveryFinalOutcome.operationPackage.operationFacts
        .requiredEvidence,
      readRequiredEvidence,
      repositoryRoot,
    ))
  )
    return null;
  const guidanceRef = await resolveDeliveryGuidanceRef(
    installation,
    "delivery-repository-integration",
  );
  if (guidanceRef === null) return null;
  const formed = formDeliveryOperationPackage(
    input.deliveryId,
    "delivery-repository-integration",
    input.ownerAuthority,
    facts,
    guidanceRef,
  );
  return formed?.operationId === "delivery-repository-integration"
    ? formed
    : null;
}

function exactPackageEqual(
  left: DeliveryRepositoryIntegrationOperationPackage,
  right: DeliveryRepositoryIntegrationOperationPackage,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isCommitResult(
  value: unknown,
): value is DeliveryRepositoryIntegrationCommitResult {
  return (
    isRecord(value) &&
    hasExactlyFields(value, ["status"]) &&
    value.status === "committed"
  );
}

function isProviderResult(
  value: unknown,
): value is DeliveryRepositoryIntegrationProviderResult {
  if (!isRecord(value) || value.status !== "repository-acceptance-complete") {
    return false;
  }
  const keys = Object.keys(value);
  if (keys.some((key) => key !== "status" && key !== "auditRef")) return false;
  return (
    !Object.hasOwn(value, "auditRef") ||
    (typeof value.auditRef === "string" && value.auditRef.length > 0)
  );
}

function failure(
  reason: DeliveryRepositoryIntegrationFailureReason,
): DeliveryRepositoryIntegrationFailure {
  return { status: "failed", reason, record: null };
}

export function isDeliveryRepositoryIntegrationRecord(
  value: unknown,
): value is DeliveryRepositoryIntegrationRecord {
  return (
    isRecord(value) &&
    hasExactlyFields(value, [
      "repositoryIntegrationRef",
      "deliveryFinalizationRef",
      "finalizedCandidateRef",
      "preIntegrationHead",
      "checkpointOperation",
      "finalCommit",
      "targetMainRef",
      "targetMainPreIntegrationCommit",
      "acceptedMainCommit",
      "nextDeliveryBase",
    ]) &&
    typeof value.repositoryIntegrationRef === "string" &&
    REPOSITORY_INTEGRATION_REF_PATTERN.test(value.repositoryIntegrationRef) &&
    isDeliveryCheckpointOperation(value.checkpointOperation) &&
    typeof value.acceptedMainCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.acceptedMainCommit) &&
    value.nextDeliveryBase === value.acceptedMainCommit
  );
}

export function isDeliveryRepositoryIntegrationRecordForPackage(
  value: unknown,
  operationPackage: unknown,
): value is DeliveryRepositoryIntegrationRecord {
  if (
    !isDeliveryRepositoryIntegrationRecord(value) ||
    !isRecord(operationPackage) ||
    operationPackage.operationId !== "delivery-repository-integration" ||
    !isRecord(operationPackage.operationFacts) ||
    value.deliveryFinalizationRef !==
      operationPackage.operationFacts.deliveryFinalizationRef ||
    value.finalizedCandidateRef !==
      operationPackage.operationFacts.finalizedCandidateRef ||
    value.preIntegrationHead !==
      operationPackage.operationFacts.preIntegrationHead ||
    !isDeliveryCheckpointOperation(
      operationPackage.operationFacts.checkpointOperation,
    ) ||
    !sameCheckpointOperation(
      value.checkpointOperation,
      operationPackage.operationFacts.checkpointOperation,
    ) ||
    value.targetMainRef !== operationPackage.operationFacts.targetMainRef ||
    value.targetMainPreIntegrationCommit !==
      operationPackage.operationFacts.targetMainPreIntegrationCommit
  ) {
    return false;
  }
  return (
    deriveDeliveryRepositoryIntegrationRef(
      operationPackage as unknown as DeliveryRepositoryIntegrationOperationPackage,
      value.finalCommit,
      value.acceptedMainCommit,
    ) === value.repositoryIntegrationRef
  );
}

export async function invokeDeliveryRepositoryIntegrationOperation(
  repositoryRoot: unknown,
  input: unknown,
  commitFinal: DeliveryRepositoryIntegrationCommit | undefined,
  performRepositoryAcceptance: DeliveryRepositoryIntegrationProviderMechanics,
  readRequiredEvidence: ReadDeliveryRequiredEvidence,
  readIntegrationSource: ReadRepositoryIntegrationSource,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryRepositoryIntegrationOutcome> {
  if (
    typeof repositoryRoot !== "string" ||
    !isPreparationInput(input) ||
    typeof performRepositoryAcceptance !== "function" ||
    typeof readRequiredEvidence !== "object" ||
    typeof readIntegrationSource !== "object"
  ) {
    return failure("package-formation-rejected");
  }
  const operationPackage =
    await prepareDeliveryRepositoryIntegrationOperationPackage(
      repositoryRoot,
      input,
      readRequiredEvidence,
      readIntegrationSource,
      installation,
    );
  if (operationPackage === null) return failure("package-formation-rejected");

  const guidance = await readExactDeliveryGuidance(
    installation,
    operationPackage.guidanceRef,
  );
  if (guidance === null) return failure("guidance-drift-rejected");

  const revalidated =
    await prepareDeliveryRepositoryIntegrationOperationPackage(
      repositoryRoot,
      input,
      readRequiredEvidence,
      readIntegrationSource,
      installation,
    );
  if (
    revalidated === null ||
    !exactPackageEqual(revalidated, operationPackage)
  ) {
    return failure("pre-integration-drift-rejected");
  }

  const callbackPackage = formDeliveryOperationPackage(
    operationPackage.deliveryId,
    operationPackage.operationId,
    operationPackage.ownerAuthority,
    operationPackage.operationFacts,
    operationPackage.guidanceRef,
  );
  if (callbackPackage?.operationId !== "delivery-repository-integration") {
    return failure("package-formation-rejected");
  }

  let finalCommit: string;
  if (
    operationPackage.operationFacts.checkpointOperation.kind === "create-new"
  ) {
    if (typeof commitFinal !== "function") {
      return failure("package-formation-rejected");
    }
    let commitResult: unknown;
    try {
      commitResult = await commitFinal({
        operationPackage: callbackPackage,
        guidance: Buffer.from(guidance),
      });
    } catch {
      return failure("final-commit-rejected");
    }
    if (!isCommitResult(commitResult)) return failure("final-commit-rejected");
    const observed = await observeGitHead(repositoryRoot);
    if (
      observed === null ||
      observed === operationPackage.operationFacts.preIntegrationHead ||
      JSON.stringify(await observeGitParents(repositoryRoot, observed)) !==
        JSON.stringify([operationPackage.operationFacts.preIntegrationHead]) ||
      (await countGitCommits(
        repositoryRoot,
        operationPackage.operationFacts.preIntegrationHead,
        observed,
      )) !== 1
    )
      return failure("final-commit-rejected");
    finalCommit = observed;
  } else {
    const checkpoint =
      operationPackage.operationFacts.checkpointOperation.checkpointCommit;
    if ((await resolveGitCommit(repositoryRoot, checkpoint)) !== checkpoint) {
      return failure("final-commit-rejected");
    }
    finalCommit = checkpoint;
  }
  if (
    !(await isGitIndexAndWorktreeClean(repositoryRoot)) ||
    (await deriveApplicableCheckCandidateRef(repositoryRoot)) !==
      operationPackage.operationFacts.finalizedCandidateRef ||
    (await deriveApplicableCheckObjectCandidateRef(
      repositoryRoot,
      finalCommit,
    )) !== operationPackage.operationFacts.finalizedCandidateRef ||
    (await resolveGitCommit(
      repositoryRoot,
      operationPackage.operationFacts.targetMainRef,
    )) !== operationPackage.operationFacts.targetMainPreIntegrationCommit
  )
    return failure("final-commit-rejected");

  let providerResult: unknown;
  try {
    const providerPackage = formDeliveryOperationPackage(
      operationPackage.deliveryId,
      operationPackage.operationId,
      operationPackage.ownerAuthority,
      operationPackage.operationFacts,
      operationPackage.guidanceRef,
    );
    if (providerPackage?.operationId !== "delivery-repository-integration") {
      return failure("repository-acceptance-rejected");
    }
    providerResult = await performRepositoryAcceptance({
      operationPackage: providerPackage,
      guidance: Buffer.from(guidance),
      finalCommit,
    });
  } catch {
    return failure("repository-acceptance-rejected");
  }
  if (!isProviderResult(providerResult)) {
    return failure("repository-acceptance-rejected");
  }

  const acceptedMainCommit = await resolveGitCommit(
    repositoryRoot,
    operationPackage.operationFacts.targetMainRef,
  );
  if (acceptedMainCommit === null) {
    return failure("repository-acceptance-rejected");
  }
  if (
    !(await validateRepositoryIntegrationAcceptance(readIntegrationSource, {
      ownerAuthority: operationPackage.ownerAuthority,
      deliveryId: operationPackage.deliveryId,
      targetMainRef: operationPackage.operationFacts.targetMainRef,
      targetMainPreIntegrationCommit:
        operationPackage.operationFacts.targetMainPreIntegrationCommit,
      checkpointOperation: operationPackage.operationFacts.checkpointOperation,
      finalCommit,
      acceptedMainCommit,
    }))
  ) {
    return failure("repository-acceptance-rejected");
  }
  if (
    (await deriveApplicableCheckObjectCandidateRef(
      repositoryRoot,
      acceptedMainCommit,
    )) !== operationPackage.operationFacts.finalizedCandidateRef ||
    !(await revalidateDeliveryRequiredEvidenceAtObject(
      repositoryRoot,
      acceptedMainCommit,
      input.deliveryFinalOutcome.operationPackage.operationFacts
        .requiredEvidence,
      readRequiredEvidence,
    ))
  ) {
    return failure("accepted-main-content-rejected");
  }

  const repositoryIntegrationRef = deriveDeliveryRepositoryIntegrationRef(
    operationPackage,
    finalCommit,
    acceptedMainCommit,
  );
  const record: DeliveryRepositoryIntegrationRecord = {
    repositoryIntegrationRef,
    deliveryFinalizationRef:
      operationPackage.operationFacts.deliveryFinalizationRef,
    finalizedCandidateRef:
      operationPackage.operationFacts.finalizedCandidateRef,
    preIntegrationHead: operationPackage.operationFacts.preIntegrationHead,
    checkpointOperation: cloneDeliveryRepositoryIntegrationOperationFacts(
      operationPackage.operationFacts,
    ).checkpointOperation,
    finalCommit,
    targetMainRef: operationPackage.operationFacts.targetMainRef,
    targetMainPreIntegrationCommit:
      operationPackage.operationFacts.targetMainPreIntegrationCommit,
    acceptedMainCommit,
    nextDeliveryBase: acceptedMainCommit,
  };
  return isDeliveryRepositoryIntegrationRecordForPackage(
    record,
    operationPackage,
  )
    ? { status: "terminal", operationPackage, record }
    : failure("repository-acceptance-rejected");
}
