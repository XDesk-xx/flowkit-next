import { createHash } from "node:crypto";

import {
  deriveApplicableCheckCandidateRef,
  isApplicableCheckFact,
  isApplicableCheckPlanInput,
  isApplicableCheckPriorFact,
  isApplicableCheckReuseEligible,
  resolveApplicableChecksInDeclaredOrder,
  type ApplicableCheckDeclaration,
  type ApplicableCheckFact,
  type ApplicableCheckPriorFact,
  type ResolvedApplicableCheck,
} from "./applicable-check-execution.js";
import type { OwnerAuthorityFact } from "./authority.js";
import {
  formDeliveryOperationPackage,
  isDeliveryFullTestOperationFacts,
  isDeliveryOperationPackage,
  isFormalFullTestAuthorityForDelivery,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryOperationPackage,
  type DeliveryFullTestOperationPackage,
} from "./delivery-operation-execution.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import { executeExactApplicableCheckProcess } from "../internal/applicable-check-process.js";

export interface DeliveryFullTestPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly ownerAuthority: OwnerAuthorityFact;
  readonly checks: readonly ApplicableCheckDeclaration[];
}

export interface DeliveryFullTestExecutionRecord {
  readonly executionRef: string;
  readonly candidateRef: string;
  readonly checks: readonly ApplicableCheckFact[];
}

export type DeliveryFullTestInvocationFailureReason =
  | "package-formation-rejected"
  | "guidance-drift-rejected"
  | "prior-facts-rejected";

export interface DeliveryFullTestInvocationFailure {
  readonly status: "failed";
  readonly reason: DeliveryFullTestInvocationFailureReason;
  readonly record: null;
}

export interface DeliveryFullTestInvocationCandidateDrift {
  readonly status: "stopped-candidate-drift";
  readonly operationPackage: DeliveryOperationPackage;
  readonly record: null;
}

export interface DeliveryFullTestInvocationTerminal {
  readonly status: "terminal";
  readonly operationPackage: DeliveryOperationPackage;
  readonly verdict: "passed" | "failed";
  readonly record: DeliveryFullTestExecutionRecord;
}

export type DeliveryFullTestInvocationOutcome =
  | DeliveryFullTestInvocationFailure
  | DeliveryFullTestInvocationCandidateDrift
  | DeliveryFullTestInvocationTerminal;

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
): value is DeliveryFullTestPreparationInput {
  if (
    !isRecord(value) ||
    !hasExactlyFields(value, ["deliveryId", "ownerAuthority", "checks"])
  ) {
    return false;
  }
  return (
    isSemanticId(value.deliveryId) &&
    isFormalFullTestAuthorityForDelivery(
      value.ownerAuthority,
      value.deliveryId,
    ) &&
    isApplicableCheckPlanInput({ checks: value.checks })
  );
}

function cloneCheck(check: ResolvedApplicableCheck): ResolvedApplicableCheck {
  return {
    checkId: check.checkId,
    program: check.program,
    args: [...check.args],
    configRefs: [...check.configRefs],
    toolRefs: [...check.toolRefs],
    environmentRefs: [...check.environmentRefs],
    checkRef: check.checkRef,
  };
}

function packageHashMaterial(
  operationPackage: DeliveryOperationPackage,
): unknown {
  if (
    !isDeliveryOperationPackage(operationPackage) ||
    operationPackage.operationId !== "delivery-full-test" ||
    !isDeliveryFullTestOperationFacts(operationPackage.operationFacts)
  ) {
    return null;
  }
  return {
    deliveryId: operationPackage.deliveryId,
    operationId: operationPackage.operationId,
    ownerAuthority: operationPackage.ownerAuthority,
    operationFacts: {
      candidateRef: operationPackage.operationFacts.candidateRef,
      orderedChecks:
        operationPackage.operationFacts.orderedChecks.map(cloneCheck),
    },
    guidanceRef: operationPackage.guidanceRef,
  };
}

export function deriveDeliveryFullTestExecutionRef(
  operationPackage: unknown,
): string | null {
  if (
    !isRecord(operationPackage) ||
    !hasExactlyFields(operationPackage, [
      "deliveryId",
      "operationId",
      "ownerAuthority",
      "operationFacts",
      "guidanceRef",
    ])
  ) {
    return null;
  }
  const material = packageHashMaterial(
    operationPackage as unknown as DeliveryOperationPackage,
  );
  if (material === null) return null;
  const digest = createHash("sha256")
    .update("flowkit-delivery-full-test-execution\0")
    .update(JSON.stringify(material))
    .digest("hex");
  return `full-test-execution:sha256:${digest}`;
}

export function isTrustedPassedFullTestOutcome(
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
    !isRecord(record) ||
    !hasExactlyFields(record, ["executionRef", "candidateRef", "checks"]) ||
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

export async function prepareDeliveryFullTestOperationPackage(
  repositoryRoot: unknown,
  input: unknown,
): Promise<DeliveryFullTestOperationPackage | null> {
  if (
    typeof repositoryRoot !== "string" ||
    repositoryRoot.length === 0 ||
    !isPreparationInput(input)
  ) {
    return null;
  }

  const candidateRef = await deriveApplicableCheckCandidateRef(repositoryRoot);
  const orderedChecks = resolveApplicableChecksInDeclaredOrder({
    checks: input.checks,
  });
  const guidanceRef = await resolveDeliveryGuidanceRef(
    repositoryRoot,
    "delivery-full-test",
  );
  if (candidateRef === null || orderedChecks === null || guidanceRef === null) {
    return null;
  }

  const formed = formDeliveryOperationPackage(
    input.deliveryId,
    "delivery-full-test",
    input.ownerAuthority,
    { candidateRef, orderedChecks },
    guidanceRef,
  );
  return formed?.operationId === "delivery-full-test" ? formed : null;
}

function validatePriorFacts(
  checks: readonly ResolvedApplicableCheck[],
  priorFacts: readonly unknown[],
): Map<string, ApplicableCheckPriorFact> | null {
  const declaredIds = new Set(checks.map((check) => check.checkId));
  const byId = new Map<string, ApplicableCheckPriorFact>();
  for (const prior of priorFacts) {
    if (
      !isApplicableCheckPriorFact(prior) ||
      !declaredIds.has(prior.checkId) ||
      byId.has(prior.checkId)
    ) {
      return null;
    }
    byId.set(prior.checkId, prior);
  }
  return byId;
}

async function executeCheck(
  repositoryRoot: string,
  check: ResolvedApplicableCheck,
): Promise<ApplicableCheckFact> {
  const outcome = await executeExactApplicableCheckProcess(
    repositoryRoot,
    check.program,
    check.args,
  );
  return {
    checkId: check.checkId,
    checkRef: check.checkRef,
    status: outcome.status,
    exitCode: outcome.exitCode,
    signal: outcome.signal,
  };
}

function toPriorFacts(
  record: DeliveryFullTestExecutionRecord,
): ApplicableCheckPriorFact[] {
  return record.checks.map((fact) => ({
    candidateRef: record.candidateRef,
    checkId: fact.checkId,
    checkRef: fact.checkRef,
    status: fact.status,
  }));
}

export function priorFactsFromDeliveryFullTestRecord(
  record: unknown,
): readonly ApplicableCheckPriorFact[] | null {
  if (
    !isRecord(record) ||
    !hasExactlyFields(record, ["executionRef", "candidateRef", "checks"]) ||
    typeof record.executionRef !== "string" ||
    !/^full-test-execution:sha256:[0-9a-f]{64}$/.test(record.executionRef) ||
    typeof record.candidateRef !== "string" ||
    !/^candidate:sha256:[0-9a-f]{64}$/.test(record.candidateRef) ||
    !Array.isArray(record.checks) ||
    record.checks.length < 1 ||
    !record.checks.every(isApplicableCheckFact)
  ) {
    return null;
  }
  const candidate = record as unknown as DeliveryFullTestExecutionRecord;
  const prior = toPriorFacts(candidate);
  return prior.every(isApplicableCheckPriorFact) ? prior : null;
}

export async function invokeDeliveryFullTestOperation(
  repositoryRoot: unknown,
  input: unknown,
  priorFacts: readonly unknown[] = [],
): Promise<DeliveryFullTestInvocationOutcome> {
  const operationPackage = await prepareDeliveryFullTestOperationPackage(
    repositoryRoot,
    input,
  );
  if (
    operationPackage === null ||
    typeof repositoryRoot !== "string" ||
    operationPackage.operationId !== "delivery-full-test" ||
    !isDeliveryFullTestOperationFacts(operationPackage.operationFacts)
  ) {
    return {
      status: "failed",
      reason: "package-formation-rejected",
      record: null,
    };
  }

  const guidanceBytes = await readExactDeliveryGuidance(
    repositoryRoot,
    operationPackage.guidanceRef,
  );
  if (guidanceBytes === null) {
    return {
      status: "failed",
      reason: "guidance-drift-rejected",
      record: null,
    };
  }

  const priorById = validatePriorFacts(
    operationPackage.operationFacts.orderedChecks,
    priorFacts,
  );
  if (priorById === null) {
    return { status: "failed", reason: "prior-facts-rejected", record: null };
  }

  const facts: ApplicableCheckFact[] = [];
  for (const check of operationPackage.operationFacts.orderedChecks) {
    const prior = priorById.get(check.checkId);
    if (
      prior !== undefined &&
      isApplicableCheckReuseEligible(
        operationPackage.operationFacts.candidateRef,
        check,
        prior,
      )
    ) {
      facts.push({
        checkId: check.checkId,
        checkRef: check.checkRef,
        status: "reused-passed",
        exitCode: null,
        signal: null,
      });
      continue;
    }
    facts.push(await executeCheck(repositoryRoot, check));

    const candidateRefAfterExecutedCheck =
      await deriveApplicableCheckCandidateRef(repositoryRoot);
    if (
      candidateRefAfterExecutedCheck !==
      operationPackage.operationFacts.candidateRef
    ) {
      return {
        status: "stopped-candidate-drift",
        operationPackage,
        record: null,
      };
    }
  }

  const currentCandidateRef =
    await deriveApplicableCheckCandidateRef(repositoryRoot);
  if (currentCandidateRef !== operationPackage.operationFacts.candidateRef) {
    return {
      status: "stopped-candidate-drift",
      operationPackage,
      record: null,
    };
  }

  const executionRef = deriveDeliveryFullTestExecutionRef(operationPackage);
  if (executionRef === null) {
    return {
      status: "failed",
      reason: "package-formation-rejected",
      record: null,
    };
  }
  const record: DeliveryFullTestExecutionRecord = {
    executionRef,
    candidateRef: currentCandidateRef,
    checks: facts,
  };
  const verdict = facts.every(
    (fact) => fact.status === "passed" || fact.status === "reused-passed",
  )
    ? "passed"
    : "failed";
  return { status: "terminal", operationPackage, verdict, record };
}
