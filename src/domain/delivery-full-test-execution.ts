import { deriveDeliveryFullTestExecutionRef } from "../internal/full-test-result.js";
import { randomUUID } from "node:crypto";
import {
  loadManagerInstallation,
  type ManagerInstallation,
} from "../internal/manager-installation.js";
import {
  isPlainRecord,
  hasExactlyFields,
} from "../internal/applicable-check-identity.js";
import {
  readFullTestInput,
  FullTestInputError,
} from "../internal/full-test-input.js";
import {
  attemptRoot,
  ensureFullTestDirectory,
  saveFullTestJson,
  readFullTestJson,
  readFullTestCoordination,
  publishFullTestAttempt,
} from "../internal/full-test-storage.js";
import {
  executeFullTestCheck,
  type FullTestCheckResult,
} from "../internal/full-test-process.js";
import { readCurrentDeliveryFullTest } from "../internal/full-test-current.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import type { OwnerAuthorityFact } from "./authority.js";
import {
  formDeliveryOperationPackage,
  isFormalFullTestAuthorityForDelivery,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryFullTestOperationPackage,
} from "./delivery-operation-execution.js";

export interface DeliveryFullTestPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly ownerAuthority: OwnerAuthorityFact;
}
export interface DeliveryFullTestExecutionRecord {
  readonly projectId: string;
  readonly deliveryId: string;
  readonly attemptId: string;
  readonly executionRef: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly configRef: string;
  readonly inputRef: string;
  readonly status: "passed" | "failed";
  readonly failureReasons: readonly string[];
  readonly checks: readonly FullTestCheckResult[];
}
export interface DeliveryFullTestInvocationTerminal {
  readonly status: "terminal";
  readonly operationPackage: DeliveryFullTestOperationPackage;
  readonly verdict: "passed" | "failed";
  readonly record: DeliveryFullTestExecutionRecord;
}
export interface DeliveryFullTestInvocationFailure {
  readonly status: "failed";
  readonly reason: string;
  readonly record: null;
}
export type DeliveryFullTestInvocationFailureReason = string;
export type DeliveryFullTestInvocationOutcome =
  DeliveryFullTestInvocationFailure | DeliveryFullTestInvocationTerminal;

function isPreparationInput(
  value: unknown,
): value is DeliveryFullTestPreparationInput {
  return (
    isPlainRecord(value) &&
    hasExactlyFields(value, ["deliveryId", "ownerAuthority"]) &&
    isSemanticId(value.deliveryId) &&
    isFormalFullTestAuthorityForDelivery(value.ownerAuthority, value.deliveryId)
  );
}
export {
  deriveDeliveryFullTestExecutionRef,
  isTrustedPassedFullTestOutcome,
} from "../internal/full-test-result.js";
async function prepareFullTestPackage(
  repositoryRoot: unknown,
  input: unknown,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryFullTestOperationPackage | null> {
  if (
    typeof repositoryRoot !== "string" ||
    !repositoryRoot ||
    !isPreparationInput(input)
  )
    return null;
  let stage = "project.read:.flowkit/project.json";
  try {
    const project = await readFullTestJson(
      repositoryRoot,
      ".flowkit/project.json",
    );
    if (!isPlainRecord(project) || !isSemanticId(project.projectId))
      return null;
    stage = "delivery.coordination";
    const coordination = await readFullTestCoordination(
      repositoryRoot,
      input.deliveryId,
    );
    if (coordination.state !== "active") return null;
    const selected = await readFullTestInput(repositoryRoot);
    stage = "manager.guidance";
    const guidance = await resolveDeliveryGuidanceRef(
      installation,
      "delivery-full-test",
    );
    const formed = formDeliveryOperationPackage(
      input.deliveryId,
      "delivery-full-test",
      input.ownerAuthority,
      {
        attemptId: randomUUID(),
        configRef: selected.configRef,
        inputRef: selected.inputRef,
        orderedChecks: selected.orderedChecks,
      },
      guidance,
    );
    return formed?.operationId === "delivery-full-test" ? formed : null;
  } catch (error) {
    if (error instanceof FullTestInputError) throw error;
    const code = (error as NodeJS.ErrnoException)?.code;
    throw new Error(
      stage +
        ": " +
        (typeof code === "string" && /^[A-Z_]+$/.test(code)
          ? code
          : "invalid-or-unreadable"),
    );
  }
}
export async function prepareDeliveryFullTestOperationPackage(
  repositoryRoot: unknown,
  input: unknown,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryFullTestOperationPackage | null> {
  try {
    return await prepareFullTestPackage(repositoryRoot, input, installation);
  } catch {
    return null;
  }
}
export async function invokeDeliveryFullTestOperation(
  repositoryRoot: unknown,
  input: unknown,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryFullTestInvocationOutcome> {
  const fail = (reason: string): DeliveryFullTestInvocationFailure => ({
    status: "failed",
    reason,
    record: null,
  });
  let operationPackage;
  try {
    operationPackage = await prepareFullTestPackage(
      repositoryRoot,
      input,
      installation,
    );
  } catch (error) {
    return fail(
      "preparation-rejected: " +
        (error instanceof Error ? error.message : "invalid-preparation"),
    );
  }
  if (operationPackage === null || typeof repositoryRoot !== "string")
    return fail("package-formation-rejected");
  try {
    if (
      (await readExactDeliveryGuidance(
        installation,
        operationPackage.guidanceRef,
      )) === null
    )
      return fail("guidance-drift-rejected");
    const facts = operationPackage.operationFacts;
    const initial = await readFullTestCoordination(
      repositoryRoot,
      operationPackage.deliveryId,
    );
    // The Agent reports current/partial via the reader before explicitly invoking again.
    // This authorized invocation starts new work, never fills in the previous attempt.
    const project = await readFullTestJson(
      repositoryRoot,
      ".flowkit/project.json",
    );
    if (!isPlainRecord(project) || !isSemanticId(project.projectId))
      return fail("project-identity-invalid");
    const relative = attemptRoot(operationPackage.deliveryId, facts.attemptId);
    await ensureFullTestDirectory(repositoryRoot, relative, true);
    const startedAt = new Date().toISOString();
    const start = {
      projectId: project.projectId,
      deliveryId: operationPackage.deliveryId,
      attemptId: facts.attemptId,
      startedAt,
      ownerAuthority: operationPackage.ownerAuthority,
      guidanceRef: operationPackage.guidanceRef,
      configRef: facts.configRef,
      inputRef: facts.inputRef,
      orderedChecks: facts.orderedChecks,
    };
    await saveFullTestJson(repositoryRoot, relative + "/start.json", start);
    await publishFullTestAttempt(
      repositoryRoot,
      operationPackage.deliveryId,
      initial.bytes,
      facts.attemptId,
      "pending",
    );
    const published = await readFullTestCoordination(
      repositoryRoot,
      operationPackage.deliveryId,
    );
    const checks: FullTestCheckResult[] = [];
    const failureReasons: string[] = [];
    let stop = false;
    for (const check of facts.orderedChecks) {
      if (!stop) {
        const current = await readFullTestInput(repositoryRoot);
        if (current.inputRef !== facts.inputRef) {
          failureReasons.push("test-input-drift");
          stop = true;
        }
      }
      if (stop) {
        checks.push({
          checkId: check.checkId,
          checkRef: check.checkRef,
          status: "not-executed",
          reason: "attempt-stopped",
          command: null,
        });
        continue;
      }
      const result = await executeFullTestCheck(
        repositoryRoot,
        relative,
        check,
      );
      checks.push(result);
      if (result.status !== "passed")
        failureReasons.push(check.checkId + ":" + result.status);
    }
    if ((await readFullTestInput(repositoryRoot)).inputRef !== facts.inputRef)
      failureReasons.push("test-input-drift");
    const record: DeliveryFullTestExecutionRecord = {
      projectId: project.projectId,
      deliveryId: operationPackage.deliveryId,
      attemptId: facts.attemptId,
      executionRef: deriveDeliveryFullTestExecutionRef(operationPackage)!,
      startedAt,
      finishedAt: new Date().toISOString(),
      configRef: facts.configRef,
      inputRef: facts.inputRef,
      status: failureReasons.length ? "failed" : "passed",
      failureReasons,
      checks,
    };
    await saveFullTestJson(repositoryRoot, relative + "/result.json", record);
    await publishFullTestAttempt(
      repositoryRoot,
      operationPackage.deliveryId,
      published.bytes,
      facts.attemptId,
      record.status,
    );
    if (
      record.status === "passed" &&
      (
        await readCurrentDeliveryFullTest(
          repositoryRoot,
          operationPackage.deliveryId,
        )
      ).status !== "passed"
    )
      return fail("saved-result-readback-invalid");
    return {
      status: "terminal",
      operationPackage,
      verdict: record.status,
      record,
    };
  } catch (error) {
    return fail(
      "attempt-incomplete: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}
