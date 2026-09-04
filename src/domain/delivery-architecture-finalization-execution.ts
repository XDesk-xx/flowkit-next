import {
  deriveApplicableCheckCandidateRef,
  isApplicableCheckFact,
} from "./applicable-check-execution.js";
import {
  deriveDeliveryFullTestExecutionRef,
  type DeliveryFullTestInvocationTerminal,
} from "./delivery-full-test-execution.js";
import {
  formDeliveryOperationPackage,
  isDeliveryFullTestOperationFacts,
  isDeliveryOperationPackage,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryArchitectureFinalizationOperationPackage,
} from "./delivery-operation-execution.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import {
  architectureContentSha256,
  architectureSystemViewPrestate,
  fixedDeliveryArchitecturePaths,
  readArchitectureInputContext,
  revalidateArchitectureFinalizationPrestate,
  validateAndMaterializeArchitectureFinalizationOutputs,
} from "../internal/delivery-architecture-finalization-artifacts.js";

const FULL_TEST_EXECUTION_REF_PATTERN =
  /^full-test-execution:sha256:[0-9a-f]{64}$/;

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

function isTrustedPassedFullTestOutcome(
  value: unknown,
  deliveryId: DeliveryId,
): value is DeliveryFullTestInvocationTerminal {
  if (
    !isRecord(value) ||
    value.status !== "terminal" ||
    value.verdict !== "passed"
  ) {
    return false;
  }
  const operationPackage = value.operationPackage;
  const record = value.record;
  if (
    !isDeliveryOperationPackage(operationPackage) ||
    operationPackage.operationId !== "delivery-full-test" ||
    operationPackage.deliveryId !== deliveryId ||
    !isDeliveryFullTestOperationFacts(operationPackage.operationFacts) ||
    !isRecord(record) ||
    !hasExactlyFields(record, ["executionRef", "candidateRef", "checks"]) ||
    typeof record.executionRef !== "string" ||
    !FULL_TEST_EXECUTION_REF_PATTERN.test(record.executionRef) ||
    record.executionRef !==
      deriveDeliveryFullTestExecutionRef(operationPackage) ||
    record.candidateRef !== operationPackage.operationFacts.candidateRef ||
    !Array.isArray(record.checks) ||
    record.checks.length !==
      operationPackage.operationFacts.orderedChecks.length
  ) {
    return false;
  }

  return record.checks.every((fact, index) => {
    if (!isApplicableCheckFact(fact)) return false;
    const expected = operationPackage.operationFacts.orderedChecks[index];
    return (
      fact.checkId === expected.checkId &&
      fact.checkRef === expected.checkRef &&
      (fact.status === "passed" || fact.status === "reused-passed")
    );
  });
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

export interface DeliveryArchitectureClosureOutputRef {
  readonly artifact: string;
  readonly contentSha256: string;
  readonly bytes: number;
}

export interface DeliveryArchitectureFinalizationClosureRecord {
  readonly verifiedCandidateRef: string;
  readonly fullTestExecutionRef: string;
  readonly outputs: {
    readonly actualArchitectureRef: DeliveryArchitectureClosureOutputRef;
    readonly currentToActualCompareRef: DeliveryArchitectureClosureOutputRef;
    readonly plannedToActualCompareRef: DeliveryArchitectureClosureOutputRef;
    readonly workflowRef: DeliveryArchitectureClosureOutputRef;
    readonly lifecycleRef: DeliveryArchitectureClosureOutputRef;
    readonly dataFlowRef: DeliveryArchitectureClosureOutputRef;
  };
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

  let derived: unknown;
  try {
    derived = await deriveOutputs({
      operationPackage,
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

  return {
    status: "terminal",
    operationPackage,
    record: {
      verifiedCandidateRef:
        operationPackage.operationFacts.verifiedCandidateRef,
      fullTestExecutionRef:
        operationPackage.operationFacts.fullTestExecutionRef,
      outputs: materialized.outputs,
    },
  };
}
