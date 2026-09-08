import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  deriveDeliveryFullTestExecutionRef,
  formDeliveryOperationPackage,
  resolveApplicableChecksInDeclaredOrder,
  type DeliveryFullTestInvocationTerminal,
  type ReadDeliveryRequiredEvidence,
} from "../../../src/domain/index.js";
import type { RequiredChangeClosureMaterial } from "../../../src/internal/delivery-required-evidence-source.js";

export function acceptedEvidenceOutcomes(deliveryId: string): {
  readonly fullTest: DeliveryFullTestInvocationTerminal;
} {
  const candidateRef = `candidate:sha256:${"1".repeat(64)}`;
  const checks = resolveApplicableChecksInDeclaredOrder({
    checks: [
      {
        checkId: "fixture-check",
        program: "node",
        args: ["--version"],
        configRefs: ["config:fixture"],
        toolRefs: ["tool:node"],
        environmentRefs: ["environment:test"],
      },
    ],
  });
  assert.notEqual(checks, null);
  const fullTestPackage = formDeliveryOperationPackage(
    deliveryId,
    "delivery-full-test",
    {
      ref: `owner:${"a".repeat(64)}`,
      decision: "authorize-formal-full-test",
      deliveryId,
      sourceRef: "test:full-test-authority",
      scope: ["delivery-full-test"],
    },
    { candidateRef, orderedChecks: checks! },
    {
      path: "skills/delivery/full-test/SKILL.md",
      contentSha256: "2".repeat(64),
    },
  );
  assert.equal(fullTestPackage?.operationId, "delivery-full-test");
  if (fullTestPackage?.operationId !== "delivery-full-test") {
    throw new Error("invalid Full Test fixture");
  }
  const executionRef = deriveDeliveryFullTestExecutionRef(fullTestPackage);
  assert.notEqual(executionRef, null);
  const fullTest: DeliveryFullTestInvocationTerminal = {
    status: "terminal",
    operationPackage: fullTestPackage,
    verdict: "passed",
    record: {
      executionRef: executionRef!,
      candidateRef,
      checks: checks!.map((check) => ({
        checkId: check.checkId,
        checkRef: check.checkRef,
        status: "passed",
        exitCode: 0,
        signal: null,
      })),
    },
  };

  return { fullTest };
}

export function evidenceSourceFor(
  repositoryRoot: string,
  deliveryId: string,
  closures: readonly RequiredChangeClosureMaterial[],
  outcomes: ReturnType<typeof acceptedEvidenceOutcomes>,
): ReadDeliveryRequiredEvidence {
  const fullTestOutcome = Buffer.from(`${JSON.stringify(outcomes.fullTest)}\n`);
  return {
    readChangeClosure: async ({
      projectId,
      deliveryId: requested,
      changeId,
    }) => {
      if (projectId !== "flowkit-next" || requested !== deliveryId) {
        throw new Error("wrong evidence identity");
      }
      const closure = closures.find((entry) => entry.changeId === changeId);
      if (closure === undefined) throw new Error("unknown Change");
      return {
        ...closure,
        runs: await Promise.all(
          closure.runs.map(async (run) => {
            const target = path.join(
              repositoryRoot,
              ...run.artifactRoot.split("/"),
            );
            return {
              runId: run.runId,
              artifactRoot: run.artifactRoot,
              actionMarkdown: await readFile(path.join(target, "action.md")),
              contextJson: await readFile(path.join(target, "context.json")),
              resultJson: await readFile(path.join(target, "result.json")),
              admission: run.admission,
            };
          }),
        ),
      };
    },
    readFullTest: ({ projectId, deliveryId: requested, executionRef }) => {
      if (
        projectId !== "flowkit-next" ||
        requested !== deliveryId ||
        executionRef !== outcomes.fullTest.record.executionRef
      )
        throw new Error("wrong Full Test request");
      return {
        sourceRef: "test:full-test-source",
        outcomeJson: Buffer.from(fullTestOutcome),
        artifacts: [
          { artifact: "full-test/outcome.json", bytes: fullTestOutcome },
        ],
      };
    },
  };
}
