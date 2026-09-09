import { isDeepStrictEqual } from "node:util";
import { isSemanticId } from "../domain/identity.js";
import { formDeliveryOperationPackage } from "../domain/delivery-operation-execution.js";
import { isTrustedPassedFullTestOutcome } from "./full-test-result.js";
import type { DeliveryFullTestInvocationTerminal } from "../domain/delivery-full-test-execution.js";
import {
  isPlainRecord,
  hasExactlyFields,
} from "./applicable-check-identity.js";
import {
  readFullTestInput,
  fullTestRelative,
  resolveFullTestProgram,
  fullTestPath,
} from "./full-test-input.js";
import {
  attemptRoot,
  fullTestArtifact,
  readFullTestJson,
  readFullTestCoordination,
} from "./full-test-storage.js";
import type {
  EvidenceArtifactRef,
  DeliveryRequiredEvidence,
} from "./delivery-required-evidence.js";

export type CurrentFullTest =
  | {
      readonly status: "passed";
      readonly outcome: DeliveryFullTestInvocationTerminal;
      readonly evidence: DeliveryRequiredEvidence["fullTest"];
    }
  | {
      readonly status:
        "missing" | "incomplete" | "failed" | "invalid" | "stale";
      readonly reason: string;
    };
export async function readCurrentDeliveryFullTest(
  root: string,
  deliveryId: string,
): Promise<CurrentFullTest> {
  try {
    const current = await readFullTestCoordination(root, deliveryId);
    if (!current.attemptId)
      return { status: "missing", reason: "no-current-attempt" };
    const base = attemptRoot(deliveryId, current.attemptId);
    const start = await readFullTestJson(root, base + "/start.json");
    if (
      !isPlainRecord(start) ||
      !hasExactlyFields(start, [
        "projectId",
        "deliveryId",
        "attemptId",
        "startedAt",
        "ownerAuthority",
        "guidanceRef",
        "configRef",
        "inputRef",
        "orderedChecks",
      ]) ||
      start.deliveryId !== deliveryId ||
      start.attemptId !== current.attemptId
    )
      throw new Error("start identity mismatch");
    if (current.status === "pending")
      return { status: "incomplete", reason: "current-attempt-pending" };
    const project = await readFullTestJson(root, ".flowkit/project.json");
    if (
      !isPlainRecord(project) ||
      !isSemanticId(project.projectId) ||
      start.projectId !== project.projectId
    )
      throw new Error("project identity mismatch");
    const record = await readFullTestJson(root, base + "/result.json");
    if (
      !isPlainRecord(record) ||
      record.projectId !== project.projectId ||
      record.deliveryId !== deliveryId ||
      record.attemptId !== current.attemptId ||
      record.startedAt !== start.startedAt
    )
      throw new Error("result identity mismatch");
    if (current.status === "failed" && record.status === "failed")
      return { status: "failed", reason: "current-attempt-failed" };
    const operationPackage = formDeliveryOperationPackage(
      deliveryId,
      "delivery-full-test",
      start.ownerAuthority,
      {
        attemptId: start.attemptId,
        configRef: start.configRef,
        inputRef: start.inputRef,
        orderedChecks: start.orderedChecks,
      },
      start.guidanceRef,
    );
    const outcome = {
      status: "terminal",
      verdict: "passed",
      operationPackage,
      record,
    };
    if (
      current.status !== "passed" ||
      !isTrustedPassedFullTestOutcome(outcome, deliveryId)
    )
      throw new Error("invalid saved outcome");
    const artifacts: EvidenceArtifactRef[] = [
      await fullTestArtifact(root, base + "/start.json"),
      await fullTestArtifact(root, base + "/result.json"),
    ];
    async function verifyRef(
      value: unknown,
      expectedPath: string,
    ): Promise<void> {
      if (
        !isPlainRecord(value) ||
        value.artifact !== expectedPath ||
        !fullTestRelative(expectedPath) ||
        !isDeepStrictEqual(value, await fullTestArtifact(root, expectedPath))
      )
        throw new Error("artifact integrity mismatch");
      artifacts.push(value as unknown as EvidenceArtifactRef);
    }
    for (const check of outcome.record.checks) {
      const checkBase = base + "/checks/" + check.checkId;
      await verifyRef(check.command, checkBase + "/command.json");
      const command = await readFullTestJson(root, checkBase + "/command.json");
      const expected =
        outcome.operationPackage.operationFacts.orderedChecks.find(
          (c) => c.checkId === check.checkId,
        )!;
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
        typeof command.program !== "string" ||
        command.program !==
          (await resolveFullTestProgram(
            await fullTestPath(root, expected.cwd),
            expected.program,
          )) ||
        !isDeepStrictEqual(command.args, expected.args) ||
        command.cwd !== expected.cwd ||
        command.exitCode !== 0 ||
        command.signal !== null ||
        command.processError !== null ||
        command.saveError !== null ||
        typeof command.startedAt !== "string" ||
        typeof command.finishedAt !== "string" ||
        !Number.isFinite(Date.parse(command.startedAt)) ||
        !Number.isFinite(Date.parse(command.finishedAt)) ||
        Date.parse(command.finishedAt) < Date.parse(command.startedAt)
      )
        throw new Error("command/result mismatch");
      await verifyRef(command.stdout, checkBase + "/stdout.txt");
      await verifyRef(command.stderr, checkBase + "/stderr.txt");
    }
    const selected = await readFullTestInput(root);
    if (
      selected.inputRef !== record.inputRef ||
      selected.configRef !== record.configRef
    )
      return { status: "stale", reason: "test-input-drift" };
    if (
      !isDeepStrictEqual(
        selected.orderedChecks,
        outcome.operationPackage.operationFacts.orderedChecks,
      )
    )
      throw new Error("saved checks do not match selected input");
    const reread = await readFullTestCoordination(root, deliveryId);
    if (!reread.bytes.equals(current.bytes))
      throw new Error("current selection drift");
    return {
      status: "passed",
      outcome,
      evidence: {
        executionRef: outcome.record.executionRef,
        sourceRef: base,
        artifacts: artifacts.sort((a, b) =>
          Buffer.compare(Buffer.from(a.artifact), Buffer.from(b.artifact)),
        ),
      },
    };
  } catch (error) {
    return {
      status: "invalid",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
