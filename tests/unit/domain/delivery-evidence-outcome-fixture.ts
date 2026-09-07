import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  deriveDeliveryArchitectureFinalizationRef,
  deriveDeliveryFullTestExecutionRef,
  formDeliveryOperationPackage,
  resolveApplicableChecksInDeclaredOrder,
  type DeliveryArchitectureFinalizationTerminal,
  type DeliveryFullTestInvocationTerminal,
  type ReadDeliveryRequiredEvidence,
} from "../../../src/domain/index.js";
import type { RequiredChangeClosureMaterial } from "../../../src/internal/delivery-required-evidence-source.js";

export function acceptedEvidenceOutcomes(deliveryId: string): {
  readonly fullTest: DeliveryFullTestInvocationTerminal;
  readonly architecture: DeliveryArchitectureFinalizationTerminal;
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

  const prefix = `architecture/${deliveryId}/json`;
  const architecturePackage = formDeliveryOperationPackage(
    deliveryId,
    "delivery-architecture-finalization",
    null,
    {
      verifiedCandidateRef: candidateRef,
      fullTestExecutionRef: executionRef!,
      currentArchitectureRef: {
        artifact: `${prefix}/current.architecture.json`,
        contentSha256: "3".repeat(64),
      },
      plannedArchitectureRef: {
        artifact: `${prefix}/planned.architecture.json`,
        contentSha256: "4".repeat(64),
      },
      systemViewPrestate: {
        workflowSha256: null,
        lifecycleSha256: null,
        dataFlowSha256: null,
      },
    },
    {
      path: "skills/delivery/architecture-finalization/SKILL.md",
      contentSha256: "5".repeat(64),
    },
  );
  assert.equal(
    architecturePackage?.operationId,
    "delivery-architecture-finalization",
  );
  if (
    architecturePackage?.operationId !== "delivery-architecture-finalization"
  ) {
    throw new Error("invalid Architecture fixture");
  }
  const artifact = (name: string) => ({
    artifact: name,
    contentSha256: "6".repeat(64),
    bytes: 10,
  });
  const recordWithoutRef = {
    verifiedCandidateRef: candidateRef,
    fullTestExecutionRef: executionRef!,
    outputs: {
      actualArchitectureRef: artifact(`${prefix}/actual.architecture.json`),
      currentToActualCompareRef: artifact(
        `${prefix}/current-to-actual.compare.json`,
      ),
      plannedToActualCompareRef: artifact(
        `${prefix}/planned-to-actual.compare.json`,
      ),
      workflowRef: artifact("architecture/system/workflow.json"),
      lifecycleRef: artifact("architecture/system/lifecycle.json"),
      dataFlowRef: artifact("architecture/system/data-flow.json"),
    },
    architectureMaterializedCandidateRef: `candidate:sha256:${"7".repeat(64)}`,
  };
  const placeholder = {
    architectureFinalizationRef: `architecture-finalization:sha256:${"8".repeat(64)}`,
    ...recordWithoutRef,
  };
  const architectureFinalizationRef = deriveDeliveryArchitectureFinalizationRef(
    architecturePackage,
    placeholder,
  );
  assert.notEqual(architectureFinalizationRef, null);
  return {
    fullTest,
    architecture: {
      status: "terminal",
      operationPackage: architecturePackage,
      record: {
        architectureFinalizationRef: architectureFinalizationRef!,
        ...recordWithoutRef,
      },
    },
  };
}

export function evidenceSourceFor(
  repositoryRoot: string,
  deliveryId: string,
  closures: readonly RequiredChangeClosureMaterial[],
  outcomes: ReturnType<typeof acceptedEvidenceOutcomes>,
): ReadDeliveryRequiredEvidence {
  const fullTestOutcome = Buffer.from(`${JSON.stringify(outcomes.fullTest)}\n`);
  const architectureOutcome = Buffer.from(
    `${JSON.stringify(outcomes.architecture)}\n`,
  );
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
    readArchitecture: ({
      projectId,
      deliveryId: requested,
      architectureFinalizationRef,
    }) => {
      if (
        projectId !== "flowkit-next" ||
        requested !== deliveryId ||
        architectureFinalizationRef !==
          outcomes.architecture.record.architectureFinalizationRef
      )
        throw new Error("wrong Architecture request");
      return {
        sourceRef: "test:architecture-source",
        outcomeJson: Buffer.from(architectureOutcome),
        artifacts: [
          { artifact: "architecture/outcome.json", bytes: architectureOutcome },
        ],
      };
    },
  };
}
