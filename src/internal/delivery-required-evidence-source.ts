import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { isDeepStrictEqual } from "node:util";

import {
  buildRunAddress,
  hasMatchingRunLinkage,
  isRunContextRecord,
  isRunResultRecord,
  parseRunOccurrenceId,
  type RunContextRecord,
  type RunResultRecord,
} from "../domain/run-result-persistence.js";
import {
  admitActionResult,
  formActionPackage,
  type ActionPackage,
} from "../domain/action-package-result-admission.js";
import { compareUtf8 } from "./applicable-check-material.js";
import { isTrustedPassedFullTestOutcome } from "../domain/delivery-full-test-execution.js";
import { isSafeText } from "./applicable-check-identity.js";
import {
  cloneDeliveryRequiredEvidence,
  isDeliveryRequiredEvidence,
  type DeliveryRequiredEvidence,
  type EvidenceArtifactRef,
} from "./delivery-required-evidence.js";

export interface EvidenceArtifactMaterial {
  readonly artifact: string;
  readonly bytes: Uint8Array;
}

export interface RequiredRunMaterial {
  readonly runId: string;
  readonly artifactRoot: string;
  readonly actionMarkdown: Uint8Array;
  readonly contextJson: Uint8Array;
  readonly resultJson: Uint8Array;
  readonly admission: {
    readonly sourceRef: string;
    readonly contextSha256: string;
    readonly resultSha256: string;
    readonly guidanceRef: ActionPackage["guidanceRef"];
  };
}

export interface RequiredChangeClosureMaterial {
  readonly changeId: string;
  readonly archiveRunId: string;
  readonly reviewApplyRunId: string;
  readonly runs: readonly RequiredRunMaterial[];
}

export interface ExternalEvidenceMaterial {
  readonly sourceRef: string;
  readonly outcomeJson: Uint8Array;
  readonly artifacts: readonly EvidenceArtifactMaterial[];
}

export interface ReadDeliveryRequiredEvidence {
  readonly readChangeClosure: (request: {
    readonly projectId: string;
    readonly deliveryId: string;
    readonly changeId: string;
  }) => RequiredChangeClosureMaterial | Promise<RequiredChangeClosureMaterial>;
  readonly readFullTest: (request: {
    readonly projectId: string;
    readonly deliveryId: string;
    readonly executionRef: string;
  }) => ExternalEvidenceMaterial | Promise<ExternalEvidenceMaterial>;
}

interface ParsedRunMaterial {
  readonly material: RequiredRunMaterial;
  readonly context: RunContextRecord;
  readonly result: RunResultRecord;
}

const execFileAsync = promisify(execFile);
const COMMIT = /^[0-9a-f]{40}$/;

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function artifactRef(artifact: string, bytes: Uint8Array): EvidenceArtifactRef {
  return { artifact, contentSha256: digest(bytes), bytes: bytes.byteLength };
}

function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown;
  } catch {
    return null;
  }
}

function parseRun(
  material: RequiredRunMaterial,
  deliveryId: string,
): ParsedRunMaterial | null {
  if (
    material.actionMarkdown.byteLength === 0 ||
    material.actionMarkdown.byteLength > 65_536
  )
    return null;
  const context = parseJson(material.contextJson);
  const result = parseJson(material.resultJson);
  if (
    !isRunContextRecord(context) ||
    !isRunResultRecord(result) ||
    !hasMatchingRunLinkage(context, result) ||
    context.runId !== material.runId ||
    context.actionIdentity.deliveryId !== deliveryId
  )
    return null;

  const occurrence = parseRunOccurrenceId(material.runId);
  const rootMatch = /^\.flowkit\/runs\/[^/]+\/(\d{3})-[^/]+\/[^/]+$/.exec(
    material.artifactRoot,
  );
  if (occurrence === null || rootMatch === null) return null;
  const controlledAddress = buildRunAddress({
    repositoryRoot: path.resolve("delivery-required-evidence-source"),
    deliveryId,
    changeId: context.actionIdentity.changeId,
    changeStartSequence: Number(rootMatch[1]),
    occurrence,
  });
  if (controlledAddress === null) return null;
  const controlledRoot = path
    .relative(controlledAddress.repositoryRoot, controlledAddress.runDirectory)
    .split(path.sep)
    .join("/");
  if (material.artifactRoot !== controlledRoot) return null;

  const admission = material.admission;
  if (
    admission === null ||
    typeof admission !== "object" ||
    !isSafeText(admission.sourceRef) ||
    admission.contextSha256 !== digest(material.contextJson) ||
    admission.resultSha256 !== digest(material.resultJson)
  )
    return null;
  const currentAction = {
    identity: context.actionIdentity,
    state: "prepared" as const,
  };
  const actionPackage = formActionPackage(
    currentAction,
    context,
    admission.guidanceRef,
  );
  if (
    actionPackage === null ||
    admitActionResult(
      actionPackage,
      currentAction,
      context.occurrence,
      result,
    ) === null
  )
    return null;
  return { material, context, result };
}

function chainIsComplete(
  changeId: string,
  archiveRunId: string,
  reviewApplyRunId: string,
  runs: readonly ParsedRunMaterial[],
): boolean {
  const byId = new Map(runs.map((run) => [run.context.runId, run]));
  const archive = byId.get(archiveRunId);
  const review = byId.get(reviewApplyRunId);
  if (
    archive?.context.actionIdentity.actionId !== "archive" ||
    archive.context.actionIdentity.changeId !== changeId ||
    archive.context.role !== "author" ||
    archive.result.authorConclusion !== "PASS" ||
    review?.context.actionIdentity.actionId !== "review-apply" ||
    review.context.actionIdentity.changeId !== changeId ||
    review.context.role !== "reviewer" ||
    review.result.reviewerVerdict !== "approved"
  )
    return false;

  const visited = new Set<string>();
  let current: ParsedRunMaterial | undefined = archive;
  let reachedReview = false;
  while (current !== undefined) {
    if (visited.has(current.context.runId)) return false;
    visited.add(current.context.runId);
    if (current.context.runId === reviewApplyRunId) reachedReview = true;
    const previous = current.context.previousRunId;
    if (previous === null) break;
    current = byId.get(previous);
    if (current === undefined) return false;
  }
  return reachedReview && visited.size === runs.length;
}

function externalArtifacts(
  values: readonly EvidenceArtifactMaterial[],
): readonly EvidenceArtifactRef[] | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const seen = new Set<string>();
  const refs: EvidenceArtifactRef[] = [];
  for (const value of values) {
    if (
      typeof value?.artifact !== "string" ||
      value.artifact.length === 0 ||
      value.artifact.startsWith("/") ||
      value.artifact.includes("\\") ||
      value.artifact
        .split("/")
        .some(
          (part: string) => part.length === 0 || part === "." || part === "..",
        ) ||
      !(value.bytes instanceof Uint8Array) ||
      value.bytes.byteLength === 0 ||
      seen.has(value.artifact)
    )
      return null;
    seen.add(value.artifact);
    refs.push(artifactRef(value.artifact, value.bytes));
  }
  return refs.sort((left, right) => compareUtf8(left.artifact, right.artifact));
}

function containsExactOutcome(material: ExternalEvidenceMaterial): boolean {
  return (
    material.outcomeJson instanceof Uint8Array &&
    material.outcomeJson.byteLength > 0 &&
    Array.isArray(material.artifacts) &&
    material.artifacts.some(
      (artifact) =>
        artifact?.bytes instanceof Uint8Array &&
        Buffer.from(artifact.bytes).equals(Buffer.from(material.outcomeJson)),
    )
  );
}

function isTrustedSource(
  value: unknown,
): value is ReadDeliveryRequiredEvidence {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ReadDeliveryRequiredEvidence).readChangeClosure ===
      "function" &&
    typeof (value as ReadDeliveryRequiredEvidence).readFullTest === "function"
  );
}

export async function deriveDeliveryRequiredEvidenceFromSource(
  read: unknown,
  expected: {
    readonly projectId: string;
    readonly deliveryId: string;
    readonly changeIds: readonly string[];
    readonly fullTestExecutionRef: string;
    readonly fullTestOutcome?: unknown;
  },
): Promise<DeliveryRequiredEvidence | null> {
  if (!isTrustedSource(read)) return null;

  const changeClosures = [];
  for (let index = 0; index < expected.changeIds.length; index += 1) {
    let closure: RequiredChangeClosureMaterial;
    try {
      closure = await read.readChangeClosure({
        projectId: expected.projectId,
        deliveryId: expected.deliveryId,
        changeId: expected.changeIds[index],
      });
    } catch {
      return null;
    }
    if (
      closure?.changeId !== expected.changeIds[index] ||
      !Array.isArray(closure.runs)
    )
      return null;
    const parsed = closure.runs.map((run) =>
      parseRun(run, expected.deliveryId),
    );
    if (parsed.some((run) => run === null)) return null;
    const runs = parsed as ParsedRunMaterial[];
    runs.sort((left, right) =>
      compareUtf8(left.context.runId, right.context.runId),
    );
    if (
      !chainIsComplete(
        closure.changeId,
        closure.archiveRunId,
        closure.reviewApplyRunId,
        runs,
      )
    )
      return null;
    changeClosures.push({
      changeId: closure.changeId,
      archiveRunId: closure.archiveRunId,
      reviewApplyRunId: closure.reviewApplyRunId,
      runs: runs.map(({ material: run }) => ({
        runId: run.runId,
        artifacts: [
          artifactRef(`${run.artifactRoot}/action.md`, run.actionMarkdown),
          artifactRef(`${run.artifactRoot}/context.json`, run.contextJson),
          artifactRef(`${run.artifactRoot}/result.json`, run.resultJson),
        ],
      })),
    });
  }
  let fullTest: ExternalEvidenceMaterial;
  try {
    fullTest = await read.readFullTest({
      projectId: expected.projectId,
      deliveryId: expected.deliveryId,
      executionRef: expected.fullTestExecutionRef,
    });
  } catch {
    return null;
  }
  const fullTestOutcome = parseJson(fullTest.outcomeJson);
  if (
    !containsExactOutcome(fullTest) ||
    !isTrustedPassedFullTestOutcome(fullTestOutcome, expected.deliveryId) ||
    fullTestOutcome.record.executionRef !== expected.fullTestExecutionRef ||
    (expected.fullTestOutcome !== undefined &&
      !isDeepStrictEqual(fullTestOutcome, expected.fullTestOutcome))
  )
    return null;
  const fullTestArtifacts = externalArtifacts(fullTest.artifacts);
  if (fullTestArtifacts === null) return null;
  const evidence: DeliveryRequiredEvidence = {
    projectId: expected.projectId,
    deliveryId: expected.deliveryId,
    changeClosures,
    fullTest: {
      executionRef: expected.fullTestExecutionRef,
      sourceRef: fullTest.sourceRef,
      artifacts: fullTestArtifacts,
    },
  };
  return isDeliveryRequiredEvidence(evidence) ? evidence : null;
}

export async function revalidateDeliveryRequiredEvidenceSource(
  evidence: DeliveryRequiredEvidence,
  read: unknown,
): Promise<boolean> {
  if (!isDeliveryRequiredEvidence(evidence)) return false;
  const derived = await deriveDeliveryRequiredEvidenceFromSource(read, {
    projectId: evidence.projectId,
    deliveryId: evidence.deliveryId,
    changeIds: evidence.changeClosures.map((entry) => entry.changeId),
    fullTestExecutionRef: evidence.fullTest.executionRef,
  });
  return (
    derived !== null &&
    isDeepStrictEqual(
      cloneDeliveryRequiredEvidence(derived),
      cloneDeliveryRequiredEvidence(evidence),
    )
  );
}

async function readObjectBlob(
  repositoryRoot: string,
  commit: string,
  artifact: string,
): Promise<Buffer | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["cat-file", "blob", `${commit}:${artifact}`],
      {
        cwd: repositoryRoot,
        encoding: "buffer",
        windowsHide: true,
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    return Buffer.from(stdout);
  } catch {
    return null;
  }
}

export async function revalidateDeliveryRequiredEvidenceAtObject(
  repositoryRoot: string,
  commit: string,
  evidence: DeliveryRequiredEvidence,
  read: unknown,
): Promise<boolean> {
  if (
    !COMMIT.test(commit) ||
    !(await revalidateDeliveryRequiredEvidenceSource(evidence, read))
  ) {
    return false;
  }
  const projectBytes = await readObjectBlob(
    repositoryRoot,
    commit,
    ".flowkit/project.json",
  );
  const project = projectBytes === null ? null : parseJson(projectBytes);
  if (
    project === null ||
    typeof project !== "object" ||
    (project as { projectId?: unknown }).projectId !== evidence.projectId
  )
    return false;

  for (const closure of evidence.changeClosures) {
    for (const run of closure.runs) {
      for (const artifact of run.artifacts) {
        const bytes = await readObjectBlob(
          repositoryRoot,
          commit,
          artifact.artifact,
        );
        if (
          bytes === null ||
          bytes.byteLength !== artifact.bytes ||
          digest(bytes) !== artifact.contentSha256
        )
          return false;
      }
    }
  }
  return true;
}
