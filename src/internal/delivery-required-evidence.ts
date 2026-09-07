import { compareUtf8 } from "./applicable-check-material.js";
import {
  hasExactlyFields,
  isPlainRecord,
  isSafeText,
} from "./applicable-check-identity.js";
import { isSemanticId } from "../domain/identity.js";

export interface EvidenceArtifactRef {
  readonly artifact: string;
  readonly contentSha256: string;
  readonly bytes: number;
}

export interface RequiredRunEvidence {
  readonly runId: string;
  readonly artifacts: readonly EvidenceArtifactRef[];
}

export interface RequiredChangeClosureEvidence {
  readonly changeId: string;
  readonly archiveRunId: string;
  readonly reviewApplyRunId: string;
  readonly runs: readonly RequiredRunEvidence[];
}

export interface RequiredExternalEvidence {
  readonly executionRef?: string;
  readonly architectureFinalizationRef?: string;
  readonly sourceRef: string;
  readonly artifacts: readonly EvidenceArtifactRef[];
}

export interface DeliveryRequiredEvidence {
  readonly projectId: string;
  readonly deliveryId: string;
  readonly changeClosures: readonly RequiredChangeClosureEvidence[];
  readonly fullTest: RequiredExternalEvidence & {
    readonly executionRef: string;
  };
  readonly architecture: RequiredExternalEvidence & {
    readonly architectureFinalizationRef: string;
  };
}

const HASH = /^[0-9a-f]{64}$/;
const RUN_ID = /^\d{8}-\d{3}-[a-z0-9][a-z0-9-]*$/;
const FULL_TEST_REF = /^full-test-execution:sha256:[0-9a-f]{64}$/;
const ARCHITECTURE_REF = /^architecture-finalization:sha256:[0-9a-f]{64}$/;

export function isEvidenceArtifactRef(
  value: unknown,
): value is EvidenceArtifactRef {
  return (
    isPlainRecord(value) &&
    hasExactlyFields(value, ["artifact", "contentSha256", "bytes"]) &&
    isSafeText(value.artifact) &&
    !value.artifact.includes("..") &&
    HASH.test(value.contentSha256 as string) &&
    Number.isSafeInteger(value.bytes) &&
    (value.bytes as number) > 0
  );
}

function isSortedArtifacts(
  value: unknown,
): value is readonly EvidenceArtifactRef[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isEvidenceArtifactRef) &&
    value.every(
      (item, index) =>
        index === 0 ||
        compareUtf8(value[index - 1].artifact, item.artifact) < 0,
    )
  );
}

function isRunEvidence(value: unknown): value is RequiredRunEvidence {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, ["runId", "artifacts"]) ||
    typeof value.runId !== "string" ||
    !RUN_ID.test(value.runId) ||
    !isSortedArtifacts(value.artifacts)
  )
    return false;
  const names = value.artifacts.map((item) => item.artifact.split("/").at(-1));
  return (
    names.length === 3 &&
    names[0] === "action.md" &&
    names[1] === "context.json" &&
    names[2] === "result.json"
  );
}

function isChangeClosure(
  value: unknown,
): value is RequiredChangeClosureEvidence {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, [
      "changeId",
      "archiveRunId",
      "reviewApplyRunId",
      "runs",
    ]) ||
    !isSemanticId(value.changeId) ||
    typeof value.archiveRunId !== "string" ||
    !RUN_ID.test(value.archiveRunId) ||
    typeof value.reviewApplyRunId !== "string" ||
    !RUN_ID.test(value.reviewApplyRunId) ||
    !Array.isArray(value.runs) ||
    !value.runs.every(isRunEvidence)
  )
    return false;
  const runs = value.runs as RequiredRunEvidence[];
  return (
    runs.length > 0 &&
    runs.every(
      (run, index) =>
        index === 0 || compareUtf8(runs[index - 1].runId, run.runId) < 0,
    ) &&
    runs.some((run) => run.runId === value.archiveRunId) &&
    runs.some((run) => run.runId === value.reviewApplyRunId)
  );
}

function isFullTest(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    hasExactlyFields(value, ["executionRef", "sourceRef", "artifacts"]) &&
    typeof value.executionRef === "string" &&
    FULL_TEST_REF.test(value.executionRef) &&
    isSafeText(value.sourceRef) &&
    isSortedArtifacts(value.artifacts)
  );
}

function isArchitecture(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    hasExactlyFields(value, [
      "architectureFinalizationRef",
      "sourceRef",
      "artifacts",
    ]) &&
    typeof value.architectureFinalizationRef === "string" &&
    ARCHITECTURE_REF.test(value.architectureFinalizationRef) &&
    isSafeText(value.sourceRef) &&
    isSortedArtifacts(value.artifacts)
  );
}

export function isDeliveryRequiredEvidence(
  value: unknown,
): value is DeliveryRequiredEvidence {
  return (
    isPlainRecord(value) &&
    hasExactlyFields(value, [
      "projectId",
      "deliveryId",
      "changeClosures",
      "fullTest",
      "architecture",
    ]) &&
    isSemanticId(value.projectId) &&
    isSemanticId(value.deliveryId) &&
    Array.isArray(value.changeClosures) &&
    value.changeClosures.length > 0 &&
    value.changeClosures.every(isChangeClosure) &&
    isFullTest(value.fullTest) &&
    isArchitecture(value.architecture)
  );
}

export function cloneDeliveryRequiredEvidence(
  value: DeliveryRequiredEvidence,
): DeliveryRequiredEvidence {
  const cloneArtifact = (
    artifact: EvidenceArtifactRef,
  ): EvidenceArtifactRef => ({
    artifact: artifact.artifact,
    contentSha256: artifact.contentSha256,
    bytes: artifact.bytes,
  });
  return {
    projectId: value.projectId,
    deliveryId: value.deliveryId,
    changeClosures: value.changeClosures.map((closure) => ({
      changeId: closure.changeId,
      archiveRunId: closure.archiveRunId,
      reviewApplyRunId: closure.reviewApplyRunId,
      runs: closure.runs.map((run) => ({
        runId: run.runId,
        artifacts: run.artifacts.map(cloneArtifact),
      })),
    })),
    fullTest: {
      executionRef: value.fullTest.executionRef,
      sourceRef: value.fullTest.sourceRef,
      artifacts: value.fullTest.artifacts.map(cloneArtifact),
    },
    architecture: {
      architectureFinalizationRef:
        value.architecture.architectureFinalizationRef,
      sourceRef: value.architecture.sourceRef,
      artifacts: value.architecture.artifacts.map(cloneArtifact),
    },
  };
}
