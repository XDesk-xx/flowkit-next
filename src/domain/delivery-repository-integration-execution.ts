import {
  loadManagerInstallation,
  type ManagerInstallation,
} from "../internal/manager-installation.js";
import { deriveDeliveryRepositoryIntegrationRef } from "../internal/delivery-repository-integration-ref.js";
export { deriveDeliveryRepositoryIntegrationRef } from "../internal/delivery-repository-integration-ref.js";

import {
  formDeliveryOperationPackage,
  isDeliveryOperationPackage,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryRepositoryIntegrationOperationPackage,
} from "./delivery-operation-execution.js";
import { readDeliveryFinalization } from "./delivery-finalization.js";
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
  validateRepositoryIntegrationAcceptance,
  validateRepositoryIntegrationAuthorization,
  type ReadRepositoryIntegrationSource,
} from "../internal/delivery-repository-integration-source.js";
export type { ReadRepositoryIntegrationSource } from "../internal/delivery-repository-integration-source.js";

export interface DeliveryRepositoryIntegrationPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly ownerAuthority: DeliveryRepositoryIntegrationOperationPackage["ownerAuthority"];
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
  readonly gitEffects?: {
    readonly observedHead: string | null;
    readonly observedTargetMainCommit: string | null;
  };
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

async function observePreparationFacts(
  repositoryRoot: string,
  input: DeliveryRepositoryIntegrationPreparationInput,
): Promise<DeliveryRepositoryIntegrationOperationFacts | null> {
  const final = await readDeliveryFinalization(
    repositoryRoot,
    input.deliveryId,
  );
  if (final.status !== "completed") return null;
  const finalRecord = final.record;

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

async function failure(
  reason: DeliveryRepositoryIntegrationFailureReason,
  mutation?: { root: string; target: string },
): Promise<DeliveryRepositoryIntegrationFailure> {
  if (!mutation) return { status: "failed", reason, record: null };
  return {
    status: "failed",
    reason,
    record: null,
    gitEffects: {
      observedHead: await observeGitHead(mutation.root),
      observedTargetMainCommit: await resolveGitCommit(
        mutation.root,
        mutation.target,
      ),
    },
  };
}

export function isDeliveryRepositoryIntegrationRecord(
  value: unknown,
): value is DeliveryRepositoryIntegrationRecord {
  return (
    isRecord(value) &&
    hasExactlyFields(value, [
      "repositoryIntegrationRef",
      "deliveryFinalizationRef",
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
    typeof value.deliveryFinalizationRef === "string" &&
    /^delivery-finalization:sha256:[0-9a-f]{64}$/.test(
      value.deliveryFinalizationRef,
    ) &&
    typeof value.preIntegrationHead === "string" &&
    GIT_COMMIT_PATTERN.test(value.preIntegrationHead) &&
    typeof value.finalCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.finalCommit) &&
    typeof value.targetMainPreIntegrationCommit === "string" &&
    GIT_COMMIT_PATTERN.test(value.targetMainPreIntegrationCommit) &&
    typeof value.targetMainRef === "string" &&
    value.targetMainRef.startsWith("refs/heads/") &&
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
    !isDeliveryOperationPackage(operationPackage) ||
    operationPackage.operationId !== "delivery-repository-integration" ||
    !isRecord(operationPackage.operationFacts) ||
    value.deliveryFinalizationRef !==
      operationPackage.operationFacts.deliveryFinalizationRef ||
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
  readIntegrationSource: ReadRepositoryIntegrationSource,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryRepositoryIntegrationOutcome> {
  if (
    typeof repositoryRoot !== "string" ||
    !isPreparationInput(input) ||
    typeof performRepositoryAcceptance !== "function" ||
    typeof readIntegrationSource !== "object"
  ) {
    return failure("package-formation-rejected");
  }
  const operationPackage =
    await prepareDeliveryRepositoryIntegrationOperationPackage(
      repositoryRoot,
      input,
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

  const confirmed = await readDeliveryFinalization(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  if (
    confirmed.status !== "completed" ||
    confirmed.record.deliveryFinalizationRef !==
      operationPackage.operationFacts.deliveryFinalizationRef
  )
    return failure("pre-integration-drift-rejected");

  let mutation: { root: string; target: string } | undefined;
  let finalCommit: string;
  if (
    operationPackage.operationFacts.checkpointOperation.kind === "create-new"
  ) {
    if (typeof commitFinal !== "function") {
      return failure("package-formation-rejected", mutation);
    }
    let commitResult: unknown;
    try {
      mutation = {
        root: repositoryRoot,
        target: operationPackage.operationFacts.targetMainRef,
      };
      commitResult = await commitFinal({
        operationPackage: callbackPackage,
        guidance: Buffer.from(guidance),
      });
    } catch {
      return failure("final-commit-rejected", mutation);
    }
    if (!isCommitResult(commitResult))
      return failure("final-commit-rejected", mutation);
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
      return failure("final-commit-rejected", mutation);
    finalCommit = observed;
  } else {
    const checkpoint =
      operationPackage.operationFacts.checkpointOperation.checkpointCommit;
    if ((await resolveGitCommit(repositoryRoot, checkpoint)) !== checkpoint) {
      return failure("final-commit-rejected", mutation);
    }
    finalCommit = checkpoint;
  }
  if (
    !(await isGitIndexAndWorktreeClean(repositoryRoot)) ||
    (await resolveGitCommit(
      repositoryRoot,
      operationPackage.operationFacts.targetMainRef,
    )) !== operationPackage.operationFacts.targetMainPreIntegrationCommit
  )
    return failure("final-commit-rejected", mutation);

  let providerResult: unknown;
  const beforeAcceptance = await readDeliveryFinalization(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  if (
    beforeAcceptance.status !== "completed" ||
    beforeAcceptance.record.deliveryFinalizationRef !==
      operationPackage.operationFacts.deliveryFinalizationRef
  )
    return failure("repository-acceptance-rejected", mutation);
  try {
    const providerPackage = formDeliveryOperationPackage(
      operationPackage.deliveryId,
      operationPackage.operationId,
      operationPackage.ownerAuthority,
      operationPackage.operationFacts,
      operationPackage.guidanceRef,
    );
    if (providerPackage?.operationId !== "delivery-repository-integration") {
      return failure("repository-acceptance-rejected", mutation);
    }
    mutation = {
      root: repositoryRoot,
      target: operationPackage.operationFacts.targetMainRef,
    };
    providerResult = await performRepositoryAcceptance({
      operationPackage: providerPackage,
      guidance: Buffer.from(guidance),
      finalCommit,
    });
  } catch {
    return failure("repository-acceptance-rejected", mutation);
  }
  if (!isProviderResult(providerResult)) {
    return failure("repository-acceptance-rejected", mutation);
  }

  const acceptedMainCommit = await resolveGitCommit(
    repositoryRoot,
    operationPackage.operationFacts.targetMainRef,
  );
  if (acceptedMainCommit === null) {
    return failure("repository-acceptance-rejected", mutation);
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
    return failure("repository-acceptance-rejected", mutation);
  }
  const repositoryIntegrationRef = deriveDeliveryRepositoryIntegrationRef(
    operationPackage,
    finalCommit,
    acceptedMainCommit,
  );
  if (repositoryIntegrationRef === null)
    return failure("repository-acceptance-rejected", mutation);
  const record: DeliveryRepositoryIntegrationRecord = {
    repositoryIntegrationRef,
    deliveryFinalizationRef:
      operationPackage.operationFacts.deliveryFinalizationRef,
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
    : failure("repository-acceptance-rejected", mutation);
}
