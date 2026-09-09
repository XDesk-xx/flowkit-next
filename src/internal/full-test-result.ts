import {
  isPlainRecord,
  hasExactlyFields,
  hashReference,
} from "./applicable-check-identity.js";
import { isSemanticId, type DeliveryId } from "../domain/identity.js";
import {
  isDeliveryOperationPackage,
  formDeliveryOperationPackage,
} from "../domain/delivery-operation-execution.js";
import type { DeliveryFullTestInvocationTerminal } from "../domain/delivery-full-test-execution.js";

export function deriveDeliveryFullTestExecutionRef(
  value: unknown,
): string | null {
  if (
    !isDeliveryOperationPackage(value) ||
    value.operationId !== "delivery-full-test"
  )
    return null;
  const cloned = formDeliveryOperationPackage(
    value.deliveryId,
    value.operationId,
    value.ownerAuthority,
    value.operationFacts,
    value.guidanceRef,
  );
  return hashReference(
    "full-test-execution",
    "flowkit-delivery-full-test-execution",
    cloned,
  );
}
/** Structural validation only: current selection and disk integrity belong to the target reader. */
export function isTrustedPassedFullTestOutcome(
  value: unknown,
  deliveryId: DeliveryId,
): value is DeliveryFullTestInvocationTerminal {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, [
      "status",
      "operationPackage",
      "verdict",
      "record",
    ]) ||
    value.status !== "terminal" ||
    value.verdict !== "passed" ||
    !isDeliveryOperationPackage(value.operationPackage) ||
    value.operationPackage.operationId !== "delivery-full-test" ||
    value.operationPackage.deliveryId !== deliveryId ||
    !isPlainRecord(value.record)
  )
    return false;
  const record = value.record;
  const facts = value.operationPackage.operationFacts;
  if (
    !hasExactlyFields(record, [
      "projectId",
      "deliveryId",
      "attemptId",
      "executionRef",
      "startedAt",
      "finishedAt",
      "configRef",
      "inputRef",
      "status",
      "failureReasons",
      "checks",
    ]) ||
    !isSemanticId(record.projectId) ||
    record.deliveryId !== deliveryId ||
    record.attemptId !== facts.attemptId ||
    record.executionRef !==
      deriveDeliveryFullTestExecutionRef(value.operationPackage) ||
    record.configRef !== facts.configRef ||
    record.inputRef !== facts.inputRef ||
    record.status !== "passed" ||
    typeof record.startedAt !== "string" ||
    !Number.isFinite(Date.parse(record.startedAt)) ||
    typeof record.finishedAt !== "string" ||
    Date.parse(record.finishedAt) < Date.parse(record.startedAt) ||
    !Number.isFinite(Date.parse(record.finishedAt)) ||
    !Array.isArray(record.failureReasons) ||
    record.failureReasons.length !== 0 ||
    !Array.isArray(record.checks) ||
    record.checks.length !== facts.orderedChecks.length
  )
    return false;
  return record.checks.every(
    (check, index) =>
      isPlainRecord(check) &&
      hasExactlyFields(check, [
        "checkId",
        "checkRef",
        "status",
        "reason",
        "command",
      ]) &&
      check.checkId === facts.orderedChecks[index].checkId &&
      check.checkRef === facts.orderedChecks[index].checkRef &&
      check.status === "passed" &&
      check.reason === null &&
      isPlainRecord(check.command),
  );
}
