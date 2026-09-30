import { isDeepStrictEqual } from "node:util";
import { formDeliveryOperationPackage } from "../domain/delivery-operation-execution.js";
import {
  deriveDeliveryFullTestExecutionRef,
  isTrustedPassedFullTestOutcome,
} from "./full-test-result.js";
import {
  hasExactlyFields,
  isPlainRecord,
} from "./applicable-check-identity.js";
import {
  attemptRoot,
  fullTestArtifact,
  readFullTestJson,
} from "./full-test-storage.js";

/** Validate one saved attempt without changing or consulting the current selection. */
export async function readSavedFullTestAttempt(
  root: string,
  deliveryId: string,
  attemptId: string,
): Promise<"passed" | "failed"> {
  const base = attemptRoot(deliveryId, attemptId);
  const start = await readFullTestJson(root, base + "/start.json");
  const record = await readFullTestJson(root, base + "/result.json");
  const project = await readFullTestJson(root, ".flowkit/project.json");
  if (
    !isPlainRecord(start) ||
    !isPlainRecord(record) ||
    !isPlainRecord(project) ||
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
    start.projectId !== project.projectId ||
    start.deliveryId !== deliveryId ||
    start.attemptId !== attemptId ||
    record.projectId !== project.projectId ||
    record.deliveryId !== deliveryId ||
    record.attemptId !== attemptId ||
    record.startedAt !== start.startedAt ||
    (record.status !== "passed" && record.status !== "failed") ||
    typeof record.finishedAt !== "string" ||
    !Number.isFinite(Date.parse(record.finishedAt)) ||
    Date.parse(record.finishedAt) < Date.parse(String(start.startedAt)) ||
    !Array.isArray(record.failureReasons) ||
    !record.failureReasons.every((reason) => typeof reason === "string") ||
    (record.status === "failed" && record.failureReasons.length === 0) ||
    !Array.isArray(record.checks) ||
    !Array.isArray(start.orderedChecks) ||
    record.checks.length !== start.orderedChecks.length
  )
    throw new Error("attempt-record-invalid");
  const operationPackage = formDeliveryOperationPackage(
    deliveryId,
    "delivery-full-test",
    start.ownerAuthority,
    {
      attemptId,
      configRef: start.configRef,
      inputRef: start.inputRef,
      orderedChecks: start.orderedChecks,
    },
    start.guidanceRef,
  );
  if (
    operationPackage === null ||
    record.executionRef !==
      deriveDeliveryFullTestExecutionRef(operationPackage) ||
    (record.status === "passed" &&
      !isTrustedPassedFullTestOutcome(
        {
          status: "terminal",
          verdict: "passed",
          operationPackage,
          record,
        },
        deliveryId,
      ))
  )
    throw new Error("attempt-outcome-invalid");
  const verifyRef = async (value: unknown, relative: string) => {
    if (
      !isPlainRecord(value) ||
      value.artifact !== relative ||
      !isDeepStrictEqual(value, await fullTestArtifact(root, relative))
    )
      throw new Error("attempt-material-invalid");
  };
  await fullTestArtifact(root, base + "/start.json");
  await fullTestArtifact(root, base + "/result.json");
  for (const [index, check] of record.checks.entries()) {
    const expected = start.orderedChecks[index];
    if (
      !isPlainRecord(check) ||
      !isPlainRecord(expected) ||
      !hasExactlyFields(check, [
        "checkId",
        "checkRef",
        "status",
        "reason",
        "command",
      ]) ||
      check.checkId !== expected.checkId ||
      check.checkRef !== expected.checkRef
    )
      throw new Error("attempt-check-invalid");
    if (check.status === "not-executed") {
      if (
        check.command !== null ||
        check.reason !== "attempt-stopped" ||
        record.status !== "failed"
      )
        throw new Error("attempt-check-invalid");
      continue;
    }
    if (!["passed", "failed", "process-failed"].includes(String(check.status)))
      throw new Error("attempt-check-invalid");
    const prefix = base + "/checks/" + check.checkId;
    await verifyRef(check.command, prefix + "/command.json");
    const command = await readFullTestJson(root, prefix + "/command.json");
    if (
      !isPlainRecord(command) ||
      !hasExactlyFields(command, [
        "checkId",
        "checkRef",
        "program",
        "args",
        "cwd",
        "startedAt",
        "finishedAt",
        "exitCode",
        "signal",
        "processError",
        "saveError",
        "stdout",
        "stderr",
      ]) ||
      command.checkId !== check.checkId ||
      command.checkRef !== check.checkRef ||
      !isDeepStrictEqual(command.args, expected.args) ||
      command.cwd !== expected.cwd ||
      typeof command.program !== "string" ||
      !Number.isFinite(Date.parse(String(command.startedAt))) ||
      !Number.isFinite(Date.parse(String(command.finishedAt))) ||
      Date.parse(String(command.finishedAt)) <
        Date.parse(String(command.startedAt)) ||
      command.saveError !== null ||
      (check.status === "passed" &&
        (command.exitCode !== 0 ||
          command.signal !== null ||
          command.processError !== null))
    )
      throw new Error("attempt-command-invalid");
    await verifyRef(command.stdout, prefix + "/stdout.txt");
    await verifyRef(command.stderr, prefix + "/stderr.txt");
  }
  return record.status;
}
