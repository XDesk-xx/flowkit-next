import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import {
  buildRunAddress,
  parseRunOccurrenceId,
  readDurableRun,
  type DurableRunRecord,
} from "../domain/run-result-persistence.js";
import {
  hasExactlyFields,
  isMaterialRef,
  isPlainRecord,
} from "./applicable-check-identity.js";
import { fullTestPath, fullTestDigest } from "./full-test-input.js";
import {
  isEvidenceArtifactRef,
  type EvidenceArtifactRef,
} from "./delivery-required-evidence.js";

/** Host-owned accepted terminal selection, never caller request JSON.
 * Host resolves ambiguity/unfinished tips in the selected Change, not by max id.
 * Refs originate at acceptance, not by signing current bytes at Final time.
 */
export interface AcceptedCompletionRun {
  readonly runId: string;
  readonly changeStartSequence: number;
  readonly sourceRef: string;
  readonly artifacts: readonly EvidenceArtifactRef[];
}
export interface RequiredChangeClosureMaterial {
  readonly projectId: string;
  readonly deliveryId: string;
  readonly changeId: string;
  readonly archive: AcceptedCompletionRun;
  readonly reviewApply: AcceptedCompletionRun;
}
export interface ReadDeliveryRequiredEvidence {
  readonly readChangeClosure: (request: {
    readonly projectId: string;
    readonly deliveryId: string;
    readonly changeId: string;
  }) => RequiredChangeClosureMaterial | Promise<RequiredChangeClosureMaterial>;
}
export interface DeliveryChangeCompletion {
  readonly changeId: string;
  readonly archiveRunId: string;
  readonly reviewApplyRunId: string;
  readonly archiveResultRef: EvidenceArtifactRef;
  readonly reviewResultRef: EvidenceArtifactRef;
}
export function isDeliveryChangeCompletion(
  value: unknown,
): value is DeliveryChangeCompletion {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, [
      "changeId",
      "archiveRunId",
      "reviewApplyRunId",
      "archiveResultRef",
      "reviewResultRef",
    ])
  )
    return false;
  return (
    typeof value.changeId === "string" &&
    typeof value.archiveRunId === "string" &&
    parseRunOccurrenceId(value.archiveRunId)?.actionId === "archive" &&
    typeof value.reviewApplyRunId === "string" &&
    parseRunOccurrenceId(value.reviewApplyRunId)?.actionId === "review-apply" &&
    isEvidenceArtifactRef(value.archiveResultRef) &&
    isEvidenceArtifactRef(value.reviewResultRef)
  );
}
export function completionBelongsToDelivery(
  value: DeliveryChangeCompletion,
  deliveryId: string,
): boolean {
  const pattern =
    /^\.flowkit\/runs\/([^/]+)\/(\d{3,})-([^/]+)\/([^/]+)\/result\.json$/;
  const archive = pattern.exec(value.archiveResultRef.artifact);
  const review = pattern.exec(value.reviewResultRef.artifact);
  return (
    archive !== null &&
    review !== null &&
    archive[1] === deliveryId &&
    review[1] === deliveryId &&
    archive[2] === review[2] &&
    archive[3] === value.changeId &&
    review[3] === value.changeId &&
    archive[4] === value.archiveRunId &&
    review[4] === value.reviewApplyRunId
  );
}
export function isCompletionSource(
  value: unknown,
): value is ReadDeliveryRequiredEvidence {
  return (
    isPlainRecord(value) &&
    hasExactlyFields(value, ["readChangeClosure"]) &&
    typeof value.readChangeClosure === "function"
  );
}
async function acceptedRun(
  root: string,
  deliveryId: string,
  changeId: string,
  selected: AcceptedCompletionRun,
): Promise<{
  record: DurableRunRecord;
  resultRef: EvidenceArtifactRef;
} | null> {
  if (
    !isPlainRecord(selected) ||
    !hasExactlyFields(selected, [
      "runId",
      "changeStartSequence",
      "sourceRef",
      "artifacts",
    ]) ||
    !isMaterialRef(selected.sourceRef) ||
    typeof selected.runId !== "string"
  )
    return null;
  const occurrence = parseRunOccurrenceId(selected.runId);
  if (occurrence === null) return null;
  const input = {
    repositoryRoot: root,
    deliveryId,
    changeId,
    changeStartSequence: selected.changeStartSequence,
    occurrence,
  };
  const address = buildRunAddress(input);
  if (
    address === null ||
    !Array.isArray(selected.artifacts) ||
    selected.artifacts.length !== 3
  )
    return null;
  const relative = path
    .relative(address.repositoryRoot, address.runDirectory)
    .split(path.sep)
    .join("/");
  const names = ["action.md", "context.json", "result.json"];
  const bytes: Buffer[] = [];
  for (const [index, name] of names.entries()) {
    const ref = selected.artifacts[index];
    if (!isEvidenceArtifactRef(ref) || ref.artifact !== relative + "/" + name)
      return null;
    const content = await readFile(await fullTestPath(root, ref.artifact));
    if (
      content.length !== ref.bytes ||
      fullTestDigest(content) !== ref.contentSha256
    )
      return null;
    bytes.push(content);
  }
  const record = await readDurableRun(input);
  if (
    record === null ||
    record.actionMarkdown !== bytes[0].toString("utf8") ||
    !isDeepStrictEqual(record.context, JSON.parse(bytes[1].toString("utf8"))) ||
    !isDeepStrictEqual(record.result, JSON.parse(bytes[2].toString("utf8")))
  )
    return null;
  return { record, resultRef: { ...selected.artifacts[2] } };
}
export async function readDeliveryChangeCompletions(
  source: unknown,
  expected: {
    repositoryRoot: string;
    projectId: string;
    deliveryId: string;
    changeIds: readonly string[];
  },
  onRejected?: (changeId: string) => void,
): Promise<readonly DeliveryChangeCompletion[] | null> {
  if (!isCompletionSource(source)) return null;
  const completions: DeliveryChangeCompletion[] = [];
  let currentChangeId: string | undefined;
  const reject = () => {
    if (currentChangeId !== undefined) onRejected?.(currentChangeId);
    return null;
  };
  try {
    for (const changeId of expected.changeIds) {
      currentChangeId = changeId;
      const selected = await source.readChangeClosure({
        projectId: expected.projectId,
        deliveryId: expected.deliveryId,
        changeId,
      });
      if (
        !isPlainRecord(selected) ||
        !hasExactlyFields(selected, [
          "projectId",
          "deliveryId",
          "changeId",
          "archive",
          "reviewApply",
        ]) ||
        selected.projectId !== expected.projectId ||
        selected.deliveryId !== expected.deliveryId ||
        selected.changeId !== changeId
      )
        return reject();
      const archive = await acceptedRun(
        expected.repositoryRoot,
        expected.deliveryId,
        changeId,
        selected.archive,
      );
      const review = await acceptedRun(
        expected.repositoryRoot,
        expected.deliveryId,
        changeId,
        selected.reviewApply,
      );
      if (
        archive === null ||
        review === null ||
        archive.record.context.actionIdentity.actionId !== "archive" ||
        archive.record.context.role !== "author" ||
        archive.record.result.authorConclusion !== "PASS" ||
        review.record.context.actionIdentity.actionId !== "review-apply" ||
        review.record.context.role !== "reviewer" ||
        review.record.result.reviewerVerdict !== "approved" ||
        archive.record.context.previousRunId !== review.record.context.runId ||
        selected.archive.changeStartSequence !==
          selected.reviewApply.changeStartSequence
      )
        return reject();
      completions.push({
        changeId,
        archiveRunId: selected.archive.runId,
        reviewApplyRunId: selected.reviewApply.runId,
        archiveResultRef: archive.resultRef,
        reviewResultRef: review.resultRef,
      });
    }
    return completions;
  } catch {
    return reject();
  }
}
