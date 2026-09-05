import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { deriveApplicableCheckCandidateRef } from "./applicable-check-execution.js";
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
  isRepositoryIntegrationAuthorityForDelivery,
  type DeliveryRepositoryIntegrationOperationFacts,
} from "./delivery-repository-integration-operation.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import {
  countGitCommits,
  isGitAncestor,
  isGitIndexAndWorktreeClean,
  observeFirstParent,
  observeGitBranch,
  observeGitHead,
  observeGitTree,
  resolveGitCommit,
} from "../internal/delivery-repository-integration-git.js";

export interface DeliveryRepositoryIntegrationPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly ownerAuthority: DeliveryRepositoryIntegrationOperationPackage["ownerAuthority"];
  readonly deliveryFinalOutcome: DeliveryFinalInvocationTerminal;
  readonly deliveryBranch: string;
  readonly targetMainRef: string;
  readonly acceptedBaseCommit: string;
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
    GIT_COMMIT_PATTERN.test(value.acceptedBaseCommit)
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

  const [head, branch, targetMainCommit] = await Promise.all([
    observeGitHead(repositoryRoot),
    observeGitBranch(repositoryRoot),
    resolveGitCommit(repositoryRoot, input.targetMainRef),
  ]);
  if (
    head === null ||
    branch !== input.deliveryBranch ||
    targetMainCommit === null ||
    !(await isGitAncestor(repositoryRoot, input.acceptedBaseCommit, head)) ||
    !(await isGitAncestor(
      repositoryRoot,
      input.acceptedBaseCommit,
      targetMainCommit,
    ))
  ) {
    return null;
  }

  return {
    deliveryFinalizationRef: finalRecord.deliveryFinalizationRef,
    finalizedCandidateRef: finalRecord.finalizedCandidateRef,
    preIntegrationHead: head,
    deliveryBranch: branch,
    targetMainRef: input.targetMainRef,
    targetMainPreIntegrationCommit: targetMainCommit,
    acceptedBaseCommit: input.acceptedBaseCommit,
  };
}

export async function prepareDeliveryRepositoryIntegrationOperationPackage(
  repositoryRoot: unknown,
  input: unknown,
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
  const guidanceRef = await resolveDeliveryGuidanceRef(
    repositoryRoot,
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

export function deriveDeliveryRepositoryIntegrationRef(
  operationPackage: DeliveryRepositoryIntegrationOperationPackage,
  finalCommit: string,
  acceptedMainCommit: string,
): string {
  const digest = createHash("sha256")
    .update("flowkit-repository-integration\0")
    .update(
      JSON.stringify({
        deliveryId: operationPackage.deliveryId,
        deliveryFinalizationRef:
          operationPackage.operationFacts.deliveryFinalizationRef,
        finalizedCandidateRef:
          operationPackage.operationFacts.finalizedCandidateRef,
        preIntegrationHead: operationPackage.operationFacts.preIntegrationHead,
        finalCommit,
        targetMainRef: operationPackage.operationFacts.targetMainRef,
        targetMainPreIntegrationCommit:
          operationPackage.operationFacts.targetMainPreIntegrationCommit,
        acceptedMainCommit,
      }),
    )
    .digest("hex");
  return `repository-integration:sha256:${digest}`;
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
      "finalCommit",
      "targetMainRef",
      "targetMainPreIntegrationCommit",
      "acceptedMainCommit",
      "nextDeliveryBase",
    ]) &&
    typeof value.repositoryIntegrationRef === "string" &&
    REPOSITORY_INTEGRATION_REF_PATTERN.test(value.repositoryIntegrationRef) &&
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
  commitFinal: DeliveryRepositoryIntegrationCommit,
  performRepositoryAcceptance: DeliveryRepositoryIntegrationProviderMechanics,
): Promise<DeliveryRepositoryIntegrationOutcome> {
  if (
    typeof repositoryRoot !== "string" ||
    typeof commitFinal !== "function" ||
    typeof performRepositoryAcceptance !== "function"
  ) {
    return failure("package-formation-rejected");
  }
  const operationPackage =
    await prepareDeliveryRepositoryIntegrationOperationPackage(
      repositoryRoot,
      input,
    );
  if (operationPackage === null) return failure("package-formation-rejected");

  const guidance = await readExactDeliveryGuidance(
    repositoryRoot,
    operationPackage.guidanceRef,
  );
  if (guidance === null) return failure("guidance-drift-rejected");

  const revalidated =
    await prepareDeliveryRepositoryIntegrationOperationPackage(
      repositoryRoot,
      input,
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

  const finalCommit = await observeGitHead(repositoryRoot);
  if (
    finalCommit === null ||
    finalCommit === operationPackage.operationFacts.preIntegrationHead ||
    (await observeFirstParent(repositoryRoot, finalCommit)) !==
      operationPackage.operationFacts.preIntegrationHead ||
    (await countGitCommits(
      repositoryRoot,
      operationPackage.operationFacts.preIntegrationHead,
      finalCommit,
    )) !== 1 ||
    !(await isGitIndexAndWorktreeClean(repositoryRoot)) ||
    (await deriveApplicableCheckCandidateRef(repositoryRoot)) !==
      operationPackage.operationFacts.finalizedCandidateRef ||
    (await resolveGitCommit(
      repositoryRoot,
      operationPackage.operationFacts.targetMainRef,
    )) !== operationPackage.operationFacts.targetMainPreIntegrationCommit
  ) {
    return failure("final-commit-rejected");
  }

  let providerResult: unknown;
  try {
    providerResult = await performRepositoryAcceptance({
      operationPackage: callbackPackage,
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
  if (
    acceptedMainCommit === null ||
    !(await isGitAncestor(repositoryRoot, finalCommit, acceptedMainCommit))
  ) {
    return failure("repository-acceptance-rejected");
  }
  const [acceptedTree, finalTree] = await Promise.all([
    observeGitTree(repositoryRoot, acceptedMainCommit),
    observeGitTree(repositoryRoot, finalCommit),
  ]);
  if (
    acceptedTree === null ||
    finalTree === null ||
    acceptedTree !== finalTree
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
