import { createHash } from "node:crypto";

import { deriveApplicableCheckCandidateRef } from "./applicable-check-execution.js";
import {
  isTrustedPassedFullTestOutcome,
  type DeliveryFullTestInvocationTerminal,
} from "./delivery-full-test-execution.js";
import {
  formDeliveryOperationPackage,
  isDeliveryOperationPackage,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryArchitectureFinalizationOperationPackage,
} from "./delivery-operation-execution.js";
import type {
  DeliveryArchitectureClosureOutputRef,
  DeliveryArchitectureFinalizationClosureRecord,
} from "./delivery-architecture-finalization-identity.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import {
  ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS,
  architectureContentSha256,
  architectureSystemViewPrestate,
  fixedDeliveryArchitecturePaths,
  readArchitectureInputContext,
  revalidateArchitectureFinalizationPrestate,
  validateAndMaterializeArchitectureFinalizationOutputs,
} from "../internal/delivery-architecture-finalization-artifacts.js";

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

export interface DeliveryArchitectureFinalizationPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly fullTestOutcome: DeliveryFullTestInvocationTerminal;
}

function isPreparationInput(
  value: unknown,
): value is DeliveryArchitectureFinalizationPreparationInput {
  return (
    isRecord(value) &&
    hasExactlyFields(value, ["deliveryId", "fullTestOutcome"]) &&
    isSemanticId(value.deliveryId) &&
    isTrustedPassedFullTestOutcome(value.fullTestOutcome, value.deliveryId)
  );
}

export async function prepareDeliveryArchitectureFinalizationOperationPackage(
  repositoryRoot: unknown,
  input: unknown,
): Promise<DeliveryArchitectureFinalizationOperationPackage | null> {
  if (
    typeof repositoryRoot !== "string" ||
    repositoryRoot.length === 0 ||
    !isPreparationInput(input)
  ) {
    return null;
  }

  const [candidateRef, context, guidanceRef] = await Promise.all([
    deriveApplicableCheckCandidateRef(repositoryRoot),
    readArchitectureInputContext(repositoryRoot, input.deliveryId),
    resolveDeliveryGuidanceRef(
      repositoryRoot,
      "delivery-architecture-finalization",
    ),
  ]);
  if (candidateRef === null || context === null || guidanceRef === null) {
    return null;
  }

  const passedCandidateRef = input.fullTestOutcome.record.candidateRef;
  if (candidateRef !== passedCandidateRef) return null;

  const paths = fixedDeliveryArchitecturePaths(input.deliveryId);
  const formed = formDeliveryOperationPackage(
    input.deliveryId,
    "delivery-architecture-finalization",
    null,
    {
      verifiedCandidateRef: passedCandidateRef,
      fullTestExecutionRef: input.fullTestOutcome.record.executionRef,
      currentArchitectureRef: {
        artifact: paths.current,
        contentSha256: architectureContentSha256(context.currentArchitecture),
      },
      plannedArchitectureRef: {
        artifact: paths.planned,
        contentSha256: architectureContentSha256(context.plannedArchitecture),
      },
      systemViewPrestate: architectureSystemViewPrestate(context),
    },
    guidanceRef,
  );
  return formed?.operationId === "delivery-architecture-finalization"
    ? formed
    : null;
}

export interface DeliveryArchitectureMaterializeOutput {
  readonly intent: "materialize";
  readonly content: string;
}

export interface DeliveryArchitecturePreserveOutput {
  readonly intent: "preserve-existing";
}

export type DeliveryArchitectureSystemViewOutput =
  DeliveryArchitectureMaterializeOutput | DeliveryArchitecturePreserveOutput;

export interface DeliveryArchitectureFinalizationDerivedOutputs {
  readonly actualArchitecture: DeliveryArchitectureMaterializeOutput;
  readonly currentToActualCompare: DeliveryArchitectureMaterializeOutput;
  readonly plannedToActualCompare: DeliveryArchitectureMaterializeOutput;
  readonly workflow: DeliveryArchitectureSystemViewOutput;
  readonly lifecycle: DeliveryArchitectureSystemViewOutput;
  readonly dataFlow: DeliveryArchitectureSystemViewOutput;
}

export interface DeliveryArchitectureFinalizationDerivationReady {
  readonly status: "ready";
  readonly outputs: DeliveryArchitectureFinalizationDerivedOutputs;
}

export interface DeliveryArchitectureFinalizationDerivationCorrectionRequired {
  readonly status: "correction-required";
  readonly reason: string;
}

export type DeliveryArchitectureFinalizationDerivationResult =
  | DeliveryArchitectureFinalizationDerivationReady
  | DeliveryArchitectureFinalizationDerivationCorrectionRequired;

export interface DeliveryArchitectureFinalizationDerivationInput {
  readonly operationPackage: DeliveryArchitectureFinalizationOperationPackage;
  readonly currentArchitecture: string;
  readonly plannedArchitecture: string;
  readonly workflow: string | null;
  readonly lifecycle: string | null;
  readonly dataFlow: string | null;
}

export type DeliveryArchitectureFinalizationDerive = (
  input: DeliveryArchitectureFinalizationDerivationInput,
) =>
  | DeliveryArchitectureFinalizationDerivationResult
  | Promise<DeliveryArchitectureFinalizationDerivationResult>;

function isMaterializeOutput(
  value: unknown,
): value is DeliveryArchitectureMaterializeOutput {
  return (
    isRecord(value) &&
    hasExactlyFields(value, ["intent", "content"]) &&
    value.intent === "materialize" &&
    typeof value.content === "string" &&
    value.content.length > 0
  );
}

function isSystemViewOutput(
  value: unknown,
): value is DeliveryArchitectureSystemViewOutput {
  if (!isRecord(value)) return false;
  if (value.intent === "materialize") return isMaterializeOutput(value);
  return (
    value.intent === "preserve-existing" && hasExactlyFields(value, ["intent"])
  );
}

function isDerivedOutputs(
  value: unknown,
): value is DeliveryArchitectureFinalizationDerivedOutputs {
  return (
    isRecord(value) &&
    hasExactlyFields(value, [
      "actualArchitecture",
      "currentToActualCompare",
      "plannedToActualCompare",
      "workflow",
      "lifecycle",
      "dataFlow",
    ]) &&
    isMaterializeOutput(value.actualArchitecture) &&
    isMaterializeOutput(value.currentToActualCompare) &&
    isMaterializeOutput(value.plannedToActualCompare) &&
    isSystemViewOutput(value.workflow) &&
    isSystemViewOutput(value.lifecycle) &&
    isSystemViewOutput(value.dataFlow)
  );
}

function isDerivationResult(
  value: unknown,
): value is DeliveryArchitectureFinalizationDerivationResult {
  if (!isRecord(value)) return false;
  if (value.status === "ready") {
    return (
      hasExactlyFields(value, ["status", "outputs"]) &&
      isDerivedOutputs(value.outputs)
    );
  }
  return (
    value.status === "correction-required" &&
    hasExactlyFields(value, ["status", "reason"]) &&
    typeof value.reason === "string" &&
    value.reason.length > 0
  );
}

type DeliveryArchitectureFinalizationClosureMaterial = Omit<
  DeliveryArchitectureFinalizationClosureRecord,
  "architectureFinalizationRef"
>;

const ARCHITECTURE_FINALIZATION_REF_PATTERN =
  /^architecture-finalization:sha256:[0-9a-f]{64}$/;
const CANDIDATE_REF_PATTERN = /^candidate:sha256:[0-9a-f]{64}$/;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const CLOSURE_OUTPUT_FIELDS = ["artifact", "contentSha256", "bytes"] as const;
const CLOSURE_OUTPUT_NAMES = [
  "actualArchitectureRef",
  "currentToActualCompareRef",
  "plannedToActualCompareRef",
  "workflowRef",
  "lifecycleRef",
  "dataFlowRef",
] as const;

function isClosureOutputRef(
  value: unknown,
): value is DeliveryArchitectureClosureOutputRef {
  return (
    isRecord(value) &&
    hasExactlyFields(value, CLOSURE_OUTPUT_FIELDS) &&
    typeof value.artifact === "string" &&
    value.artifact.length > 0 &&
    typeof value.contentSha256 === "string" &&
    SHA256_HEX_PATTERN.test(value.contentSha256) &&
    typeof value.bytes === "number" &&
    Number.isSafeInteger(value.bytes) &&
    value.bytes > 0
  );
}

function isClosureMaterial(
  value: unknown,
  operationPackage: DeliveryArchitectureFinalizationOperationPackage,
): value is DeliveryArchitectureFinalizationClosureMaterial {
  if (
    !isRecord(value) ||
    !hasExactlyFields(value, [
      "verifiedCandidateRef",
      "fullTestExecutionRef",
      "outputs",
      "architectureMaterializedCandidateRef",
    ]) ||
    value.verifiedCandidateRef !==
      operationPackage.operationFacts.verifiedCandidateRef ||
    value.fullTestExecutionRef !==
      operationPackage.operationFacts.fullTestExecutionRef ||
    typeof value.architectureMaterializedCandidateRef !== "string" ||
    !CANDIDATE_REF_PATTERN.test(value.architectureMaterializedCandidateRef) ||
    !isRecord(value.outputs) ||
    !hasExactlyFields(value.outputs, CLOSURE_OUTPUT_NAMES)
  ) {
    return false;
  }
  const outputs = value.outputs;
  const paths = fixedDeliveryArchitecturePaths(operationPackage.deliveryId);
  const expectedArtifacts = [
    paths.actual,
    paths.currentToActual,
    paths.plannedToActual,
    ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.workflow,
    ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.lifecycle,
    ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.dataFlow,
  ];
  return CLOSURE_OUTPUT_NAMES.every((name, index) => {
    const ref = outputs[name];
    return isClosureOutputRef(ref) && ref.artifact === expectedArtifacts[index];
  });
}

function cloneClosureOutputRef(
  ref: DeliveryArchitectureClosureOutputRef,
): DeliveryArchitectureClosureOutputRef {
  return {
    artifact: ref.artifact,
    contentSha256: ref.contentSha256,
    bytes: ref.bytes,
  };
}

function architectureFinalizationHashMaterial(
  operationPackage: DeliveryArchitectureFinalizationOperationPackage,
  record: DeliveryArchitectureFinalizationClosureMaterial,
): unknown {
  return {
    deliveryId: operationPackage.deliveryId,
    operationId: operationPackage.operationId,
    ownerAuthority: null,
    operationFacts: {
      verifiedCandidateRef:
        operationPackage.operationFacts.verifiedCandidateRef,
      fullTestExecutionRef:
        operationPackage.operationFacts.fullTestExecutionRef,
      currentArchitectureRef: {
        artifact:
          operationPackage.operationFacts.currentArchitectureRef.artifact,
        contentSha256:
          operationPackage.operationFacts.currentArchitectureRef.contentSha256,
      },
      plannedArchitectureRef: {
        artifact:
          operationPackage.operationFacts.plannedArchitectureRef.artifact,
        contentSha256:
          operationPackage.operationFacts.plannedArchitectureRef.contentSha256,
      },
      systemViewPrestate: {
        workflowSha256:
          operationPackage.operationFacts.systemViewPrestate.workflowSha256,
        lifecycleSha256:
          operationPackage.operationFacts.systemViewPrestate.lifecycleSha256,
        dataFlowSha256:
          operationPackage.operationFacts.systemViewPrestate.dataFlowSha256,
      },
    },
    guidanceRef: {
      path: operationPackage.guidanceRef.path,
      contentSha256: operationPackage.guidanceRef.contentSha256,
    },
    record: {
      verifiedCandidateRef: record.verifiedCandidateRef,
      fullTestExecutionRef: record.fullTestExecutionRef,
      outputs: {
        actualArchitectureRef: cloneClosureOutputRef(
          record.outputs.actualArchitectureRef,
        ),
        currentToActualCompareRef: cloneClosureOutputRef(
          record.outputs.currentToActualCompareRef,
        ),
        plannedToActualCompareRef: cloneClosureOutputRef(
          record.outputs.plannedToActualCompareRef,
        ),
        workflowRef: cloneClosureOutputRef(record.outputs.workflowRef),
        lifecycleRef: cloneClosureOutputRef(record.outputs.lifecycleRef),
        dataFlowRef: cloneClosureOutputRef(record.outputs.dataFlowRef),
      },
      architectureMaterializedCandidateRef:
        record.architectureMaterializedCandidateRef,
    },
  };
}

function hashArchitectureFinalizationMaterial(
  operationPackage: DeliveryArchitectureFinalizationOperationPackage,
  record: DeliveryArchitectureFinalizationClosureMaterial,
): string {
  const digest = createHash("sha256")
    .update("flowkit-delivery-architecture-finalization\0")
    .update(
      JSON.stringify(
        architectureFinalizationHashMaterial(operationPackage, record),
      ),
    )
    .digest("hex");
  return `architecture-finalization:sha256:${digest}`;
}

export function deriveDeliveryArchitectureFinalizationRef(
  operationPackage: unknown,
  record: unknown,
): string | null {
  if (
    !isDeliveryOperationPackage(operationPackage) ||
    operationPackage.operationId !== "delivery-architecture-finalization" ||
    !isRecord(record) ||
    !hasExactlyFields(record, [
      "architectureFinalizationRef",
      "verifiedCandidateRef",
      "fullTestExecutionRef",
      "outputs",
      "architectureMaterializedCandidateRef",
    ]) ||
    typeof record.architectureFinalizationRef !== "string" ||
    !ARCHITECTURE_FINALIZATION_REF_PATTERN.test(
      record.architectureFinalizationRef,
    )
  ) {
    return null;
  }
  const material = {
    verifiedCandidateRef: record.verifiedCandidateRef,
    fullTestExecutionRef: record.fullTestExecutionRef,
    outputs: record.outputs,
    architectureMaterializedCandidateRef:
      record.architectureMaterializedCandidateRef,
  };
  return isClosureMaterial(material, operationPackage)
    ? hashArchitectureFinalizationMaterial(operationPackage, material)
    : null;
}

export interface DeliveryArchitectureFinalizationInvocationInput extends DeliveryArchitectureFinalizationPreparationInput {
  readonly flowkitHome: string;
}

export type DeliveryArchitectureFinalizationFailureReason =
  | "package-formation-rejected"
  | "guidance-drift-rejected"
  | "derived-result-rejected"
  | "derived-validation-rejected"
  | "managed-archify-rejected";

export interface DeliveryArchitectureFinalizationFailure {
  readonly status: "failed";
  readonly reason: DeliveryArchitectureFinalizationFailureReason;
  readonly record: null;
}

export interface DeliveryArchitectureFinalizationCorrectionRequired {
  readonly status: "correction-required";
  readonly reason: string;
  readonly operationPackage: DeliveryArchitectureFinalizationOperationPackage;
  readonly record: null;
}

export interface DeliveryArchitectureFinalizationTerminal {
  readonly status: "terminal";
  readonly operationPackage: DeliveryArchitectureFinalizationOperationPackage;
  readonly record: DeliveryArchitectureFinalizationClosureRecord;
}

export type DeliveryArchitectureFinalizationOutcome =
  | DeliveryArchitectureFinalizationFailure
  | DeliveryArchitectureFinalizationCorrectionRequired
  | DeliveryArchitectureFinalizationTerminal;

function failure(
  reason: DeliveryArchitectureFinalizationFailureReason,
): DeliveryArchitectureFinalizationFailure {
  return { status: "failed", reason, record: null };
}

function correction(
  operationPackage: DeliveryArchitectureFinalizationOperationPackage,
  reason: string,
): DeliveryArchitectureFinalizationCorrectionRequired {
  return {
    status: "correction-required",
    reason,
    operationPackage,
    record: null,
  };
}

export async function invokeDeliveryArchitectureFinalizationOperation(
  repositoryRoot: unknown,
  input: unknown,
  deriveOutputs: DeliveryArchitectureFinalizationDerive,
): Promise<DeliveryArchitectureFinalizationOutcome> {
  if (
    typeof repositoryRoot !== "string" ||
    repositoryRoot.length === 0 ||
    !isRecord(input) ||
    !hasExactlyFields(input, [
      "deliveryId",
      "fullTestOutcome",
      "flowkitHome",
    ]) ||
    typeof input.flowkitHome !== "string" ||
    input.flowkitHome.length === 0 ||
    typeof deriveOutputs !== "function"
  ) {
    return failure("package-formation-rejected");
  }

  const operationPackage =
    await prepareDeliveryArchitectureFinalizationOperationPackage(
      repositoryRoot,
      {
        deliveryId: input.deliveryId,
        fullTestOutcome: input.fullTestOutcome,
      },
    );
  if (operationPackage === null) return failure("package-formation-rejected");

  const guidanceBytes = await readExactDeliveryGuidance(
    repositoryRoot,
    operationPackage.guidanceRef,
  );
  if (guidanceBytes === null) return failure("guidance-drift-rejected");

  const context = await revalidateArchitectureFinalizationPrestate(
    repositoryRoot,
    operationPackage,
  );
  if (context === null) {
    return correction(operationPackage, "stale-or-mismatched-prestate");
  }

  const callbackPackage = formDeliveryOperationPackage(
    operationPackage.deliveryId,
    operationPackage.operationId,
    null,
    operationPackage.operationFacts,
    operationPackage.guidanceRef,
  );
  if (
    callbackPackage === null ||
    callbackPackage.operationId !== "delivery-architecture-finalization"
  ) {
    return failure("package-formation-rejected");
  }

  let derived: unknown;
  try {
    derived = await deriveOutputs({
      operationPackage: callbackPackage,
      currentArchitecture: context.currentArchitecture.toString("utf8"),
      plannedArchitecture: context.plannedArchitecture.toString("utf8"),
      workflow: context.workflow?.toString("utf8") ?? null,
      lifecycle: context.lifecycle?.toString("utf8") ?? null,
      dataFlow: context.dataFlow?.toString("utf8") ?? null,
    });
  } catch {
    return failure("derived-result-rejected");
  }
  if (!isDerivationResult(derived)) return failure("derived-result-rejected");
  if (derived.status === "correction-required") {
    return correction(operationPackage, derived.reason);
  }

  const contextAfterDerivation =
    await revalidateArchitectureFinalizationPrestate(
      repositoryRoot,
      operationPackage,
    );
  if (contextAfterDerivation === null) {
    return correction(operationPackage, "repository-changed-during-derivation");
  }

  const materialized =
    await validateAndMaterializeArchitectureFinalizationOutputs(
      repositoryRoot,
      input.flowkitHome,
      operationPackage,
      contextAfterDerivation,
      derived.outputs,
    );
  if (materialized.status === "prestate-drift") {
    return correction(
      operationPackage,
      "repository-changed-before-materialization",
    );
  }
  if (materialized.status !== "ok") {
    return failure(materialized.status);
  }

  const architectureMaterializedCandidateRef =
    await deriveApplicableCheckCandidateRef(repositoryRoot);
  if (architectureMaterializedCandidateRef === null) {
    return failure("derived-validation-rejected");
  }
  const recordMaterial: DeliveryArchitectureFinalizationClosureMaterial = {
    verifiedCandidateRef: operationPackage.operationFacts.verifiedCandidateRef,
    fullTestExecutionRef: operationPackage.operationFacts.fullTestExecutionRef,
    outputs: materialized.outputs,
    architectureMaterializedCandidateRef,
  };
  const architectureFinalizationRef = hashArchitectureFinalizationMaterial(
    operationPackage,
    recordMaterial,
  );

  return {
    status: "terminal",
    operationPackage,
    record: {
      architectureFinalizationRef,
      ...recordMaterial,
    },
  };
}
