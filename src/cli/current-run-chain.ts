import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { expectedExecutionRoleForAction } from "../domain/action-package-result-admission.js";
import { evaluatePolicyAndNextBoundary } from "../domain/policy-and-next-boundary.js";
import {
  isRunSequence,
  listChangeRunHistory,
  parseRunOccurrenceId,
  type DurableRunRecord,
} from "../domain/run-result-persistence.js";
import type { ChangeId, DeliveryId } from "../domain/identity.js";
import { readCoordinationManifest } from "./trusted-change-coordination.js";
import { readDescriptor } from "./action-descriptor.js";
import { isSafeArchiveFailure } from "../domain/archive-outcome.js";

export function recordChangeState(
  record: DurableRunRecord,
): "active" | "completed" {
  return record.context.actionIdentity.actionId === "archive" &&
    record.result.authorConclusion === "PASS"
    ? "completed"
    : "active";
}

/** Resolve only the selected immutable parent chain, never a directory-time guess. */
export function archiveReviewSource(
  records: readonly DurableRunRecord[],
  predecessor: DurableRunRecord,
) {
  const byId = new Map(records.map((record) => [record.context.runId, record]));
  if (byId.size !== records.length)
    invalid("Duplicate Archive source identity");
  const visited = new Set<string>();
  let review = predecessor;
  while (review.context.actionIdentity.actionId === "archive") {
    if (
      visited.has(review.context.runId) ||
      review.context.lifecycleState !== "terminal" ||
      review.context.role !== "author" ||
      !isSafeArchiveFailure(review.result)
    )
      invalid("Unsafe or ambiguous Archive source chain");
    visited.add(review.context.runId);
    const parentId = review.context.previousRunId;
    const parent = parentId === null ? undefined : byId.get(parentId);
    if (
      !parent ||
      review.context.occurrence.sequence !==
        parent.context.occurrence.sequence + 1 ||
      parent.context.actionIdentity.deliveryId !==
        review.context.actionIdentity.deliveryId ||
      parent.context.actionIdentity.changeId !==
        review.context.actionIdentity.changeId ||
      records.filter((record) => record.context.previousRunId === parentId)
        .length !== 1
    )
      invalid("Missing parent, fork, or wrong Archive source target");
    review = parent;
  }
  if (
    review.context.actionIdentity.actionId !== "review-apply" ||
    review.context.lifecycleState !== "terminal" ||
    review.context.role !== "reviewer" ||
    review.result.reviewerVerdict !== "approved"
  )
    invalid("Approved Archive Review source missing");
  const author =
    review.context.previousRunId === null
      ? undefined
      : byId.get(review.context.previousRunId);
  if (
    !author ||
    author.context.lifecycleState !== "terminal" ||
    author.context.role !== "author" ||
    !["apply", "revise-apply"].includes(
      author.context.actionIdentity.actionId,
    ) ||
    author.result.authorConclusion !== "PASS" ||
    (review.result.facts.reviewedRunId !== undefined &&
      review.result.facts.reviewedRunId !== author.context.runId) ||
    author.context.actionIdentity.deliveryId !==
      review.context.actionIdentity.deliveryId ||
    author.context.actionIdentity.changeId !==
      review.context.actionIdentity.changeId ||
    review.context.occurrence.sequence !==
      author.context.occurrence.sequence + 1
  )
    invalid("Archive direct Author source missing or mismatched");
  return { review, author };
}

/** A completion consumer must validate the final PASS edge as well as failed ancestors. */
export function archiveCompletionSource(
  records: readonly DurableRunRecord[],
  archive: DurableRunRecord,
) {
  const parent = records.find(
    (record) => record.context.runId === archive.context.previousRunId,
  );
  if (
    archive.context.actionIdentity.actionId !== "archive" ||
    archive.context.lifecycleState !== "terminal" ||
    archive.context.role !== "author" ||
    archive.result.authorConclusion !== "PASS" ||
    !parent ||
    archive.context.occurrence.sequence !==
      parent.context.occurrence.sequence + 1 ||
    archive.context.actionIdentity.deliveryId !==
      parent.context.actionIdentity.deliveryId ||
    archive.context.actionIdentity.changeId !==
      parent.context.actionIdentity.changeId ||
    records.filter(
      (record) => record.context.previousRunId === parent.context.runId,
    ).length !== 1
  )
    invalid("Invalid or forked current Archive completion edge");
  return archiveReviewSource(records, parent);
}

export class ActionContextError extends Error {
  constructor(
    readonly kind:
      | "context-ambiguous"
      | "context-inconsistent"
      | "context-missing"
      | "run-chain-invalid",
    message: string,
    readonly candidates: readonly {
      deliveryId: string;
      changeId: string;
    }[] = [],
    readonly inspectLocator: {
      command: "action inspect";
      repositoryRoot: string;
      deliveryId: string;
      changeId: string;
      runId: string;
    } | null = null,
  ) {
    super(message);
    this.name = "ActionContextError";
  }
}

export function policyForRecord(
  record: DurableRunRecord | null,
  input: {
    deliveryId: DeliveryId;
    changeId: ChangeId;
    changeState: string | null;
    ownerCorrection?: unknown;
  },
) {
  if (
    record?.context.lifecycleState === "terminal" &&
    record.context.actionIdentity.actionId === "archive" &&
    (record.result.facts.archiveOutcome as { kind?: string } | undefined)
      ?.kind === "partial"
  )
    return { kind: "blocked", reason: "archive-recovery-required" } as const;
  return evaluatePolicyAndNextBoundary({
    deliveryId: input.deliveryId,
    changeId: input.changeId,
    changeState: input.changeState,
    ...(Object.hasOwn(input, "ownerCorrection")
      ? { ownerCorrection: input.ownerCorrection }
      : {}),
    currentAction:
      record === null
        ? null
        : {
            identity: record.context.actionIdentity,
            state: record.context.lifecycleState,
          },
    terminalRunContext:
      record?.context.lifecycleState === "terminal" ? record.context : null,
    terminalResult:
      record?.context.lifecycleState === "terminal" ? record.result : null,
    ...(record?.context.lifecycleState === "prepared" &&
    input.ownerCorrection !== undefined
      ? {
          preparedCurrentRunId: record.context.runId,
          preparedRunContext: record.context,
          preparedResult: record.result,
        }
      : {}),
  });
}

function invalid(message: string): never {
  throw new ActionContextError("run-chain-invalid", message);
}

export function resolveRunChain(
  records: readonly DurableRunRecord[],
): DurableRunRecord | null {
  if (records.length === 0) return null;
  const byId = new Map(records.map((record) => [record.context.runId, record]));
  const sequences = new Set(
    records.map((record) => record.context.occurrence.sequence),
  );
  if (byId.size !== records.length || sequences.size !== records.length)
    invalid("Duplicate Run identity or sequence");
  const roots = records.filter(
    (record) => record.context.previousRunId === null,
  );
  if (
    roots.length !== 1 ||
    roots[0].context.actionIdentity.actionId !== "explore"
  )
    invalid("Expected one initial Explore root");
  const children = new Map<string, DurableRunRecord>();
  for (const record of records) {
    const { context, result } = record;
    if (
      context.role !==
      expectedExecutionRoleForAction(context.actionIdentity.actionId)
    )
      invalid(`Wrong Role: ${context.runId}`);
    if (context.lifecycleState === null)
      invalid(`Missing lifecycle: ${context.runId}`);
    if (
      result.verificationVerdict !== null ||
      (context.role === "author"
        ? result.reviewerVerdict !== null
        : result.authorConclusion !== null)
    )
      invalid(`Wrong outcome Role: ${context.runId}`);
    if (context.lifecycleState === "prepared") {
      if (
        [
          result.authorConclusion,
          result.reviewerVerdict,
          result.verificationVerdict,
          result.nextBoundary,
        ].some((value) => value !== null)
      )
        invalid(`Incomplete prepared failure: ${context.runId}`);
    } else {
      const own = policyForRecord(record, {
        ...context.actionIdentity,
        changeState: recordChangeState(record),
      });
      if (
        own.kind === "blocked" &&
        !(
          context.role === "author" &&
          result.authorConclusion === "FAIL" &&
          result.nextBoundary === null
        ) &&
        !(
          context.role === "reviewer" &&
          result.reviewerVerdict === "rejected" &&
          result.nextBoundary === null &&
          own.reason === "review-rejected"
        )
      )
        invalid(`Invalid terminal outcome: ${context.runId}`);
    }
    const parentId = context.previousRunId;
    if (parentId === null) continue;
    const parent = byId.get(parentId);
    if (!parent || children.has(parentId))
      invalid(`Missing parent or fork: ${context.runId}`);
    if (context.occurrence.sequence !== parent.context.occurrence.sequence + 1)
      invalid(`Nonconsecutive Change sequence: ${context.runId}`);
    if (
      parent.context.actionIdentity.deliveryId !==
        context.actionIdentity.deliveryId ||
      parent.context.actionIdentity.changeId !== context.actionIdentity.changeId
    )
      invalid(`Cross-target parent: ${context.runId}`);
    const input = {
      ...context.actionIdentity,
      changeState: recordChangeState(parent),
    };
    const preparedReviseSuccessor =
      parent.context.lifecycleState === "prepared" &&
      context.actionIdentity.actionId.startsWith("revise-") &&
      parent.context.actionIdentity.actionId ===
        context.actionIdentity.actionId;
    const correctionInput = {
      ...input,
      ownerCorrection: {
        requestedAction: context.actionIdentity.actionId,
        authority: context.ownerAuthority,
      },
    };
    // Reuse READY describes the parent; a new same-revise occurrence needs its own correction.
    let boundary = policyForRecord(
      parent,
      preparedReviseSuccessor ? correctionInput : input,
    );
    if (
      !preparedReviseSuccessor &&
      (boundary.kind !== "ready-action" ||
        boundary.actionId !== context.actionIdentity.actionId) &&
      context.ownerAuthority !== null
    ) {
      boundary = policyForRecord(parent, correctionInput);
    }
    if (
      boundary.kind !== "ready-action" ||
      boundary.actionId !== context.actionIdentity.actionId
    )
      invalid(`Illegal Policy edge: ${parentId} -> ${context.runId}`);
    children.set(parentId, record);
  }
  const visited = new Set<string>();
  let tip = roots[0];
  while (true) {
    if (visited.has(tip.context.runId)) invalid("Run cycle");
    visited.add(tip.context.runId);
    const child = children.get(tip.context.runId);
    if (!child) break;
    tip = child;
  }
  if (visited.size !== records.length) invalid("Disconnected Run history");
  return tip;
}

export async function readSelectedRunChain(input: {
  repositoryRoot: string;
  deliveryId: DeliveryId;
  changeId: ChangeId;
}) {
  const root = path.join(
    input.repositoryRoot,
    ".flowkit",
    "runs",
    input.deliveryId,
  );
  let entries: Dirent[];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    entries = [];
  }
  const matching = entries.filter(
    (entry) =>
      entry.name === input.changeId ||
      /^\d+-(.+)$/.exec(entry.name)?.[1] === input.changeId,
  );
  if (matching.length > 1)
    throw new ActionContextError(
      "context-ambiguous",
      `Multiple Run groups for ${input.changeId}`,
    );
  if (matching.length === 0)
    return {
      kind: "canonical" as const,
      changeStartSequence: 1,
      records: [],
      current: null,
    };
  const group = matching[0];
  if (!group.isDirectory()) invalid(`Invalid Run group: ${group.name}`);
  if (group.name === input.changeId) {
    const groupRoot = path.join(root, group.name);
    const runs = await readdir(groupRoot, { withFileTypes: true });
    if (runs.length === 0) invalid("Empty unmarked bootstrap group");
    for (const entry of runs) {
      if (!entry.isDirectory())
        invalid(`Invalid bootstrap occurrence: ${entry.name}`);
      for (const name of ["context.json", "result.json"]) {
        let record: Record<string, unknown>;
        try {
          record = JSON.parse(
            await readFile(path.join(groupRoot, entry.name, name), "utf8"),
          ) as Record<string, unknown>;
        } catch {
          invalid(
            `Incomplete or invalid bootstrap record: ${entry.name}/${name}`,
          );
        }
        if (
          record === null ||
          typeof record !== "object" ||
          Array.isArray(record) ||
          record.canonicalFlowkitRuntimeRun !== false ||
          record.executionMode !== "independent-bootstrap" ||
          record.deliveryId !== input.deliveryId ||
          record.changeId !== input.changeId ||
          record.runId !== entry.name ||
          typeof record.kind !== "string" ||
          !record.kind.startsWith("external-orchestrator-")
        )
          invalid(`Unmarked bootstrap history: ${entry.name}`);
      }
      try {
        await readFile(path.join(groupRoot, entry.name, "action.md"));
      } catch {
        invalid(`Incomplete bootstrap descriptor: ${entry.name}`);
      }
    }
    return {
      kind: "bootstrap-history" as const,
      changeStartSequence: null,
      records: [],
      current: null,
    };
  }
  const prefix = group.name.slice(0, -(input.changeId.length + 1));
  const sequence = Number(prefix);
  if (!isRunSequence(sequence) || String(sequence).padStart(3, "0") !== prefix)
    invalid(`Invalid Run group prefix: ${group.name}`);
  let records;
  try {
    records = await listChangeRunHistory({
      ...input,
      changeStartSequence: sequence,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Run history read failed";
    const runId = /^Incomplete Run record: (.+)$/.exec(message)?.[1];
    throw new ActionContextError(
      "run-chain-invalid",
      message,
      [],
      runId && parseRunOccurrenceId(runId) !== null
        ? { command: "action inspect", ...input, runId }
        : null,
    );
  }
  if (records.length === 0) invalid("Empty canonical Run group");
  if (
    Math.min(...records.map((record) => record.context.occurrence.sequence)) !==
    sequence
  )
    invalid(`Run group start mismatch: ${group.name}`);
  return {
    kind: "canonical" as const,
    changeStartSequence: sequence,
    records,
    current: resolveRunChain(records),
  };
}

export async function deliveryRunOccupancy(input: {
  repositoryRoot: string;
  deliveryId: DeliveryId;
  changeId: ChangeId;
}) {
  const manifest = await readCoordinationManifest(
    input.repositoryRoot,
    input.deliveryId,
  );
  if (manifest.id !== input.deliveryId) invalid("Delivery identity mismatch");
  const known = new Set(manifest.changes.map((change) => change.id));
  if (known.size !== manifest.changes.length || !known.has(input.changeId))
    invalid("Delivery Change identities are ambiguous");

  const root = path.join(
    input.repositoryRoot,
    ".flowkit",
    "runs",
    input.deliveryId,
  );
  let entries: Dirent[];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    entries = [];
  }
  const sequences: number[] = [];
  const groups = new Set<string>();
  for (const entry of entries) {
    const changeId = known.has(entry.name)
      ? entry.name
      : /^\d+-(.+)$/.exec(entry.name)?.[1];
    if (!entry.isDirectory() || !changeId || !known.has(changeId))
      invalid(`Unknown Delivery Run group: ${entry.name}`);
    if (groups.has(changeId))
      invalid(`Multiple Delivery Run groups: ${changeId}`);
    groups.add(changeId);
    if (changeId === input.changeId) continue;
    // An incomplete occurrence is occupied, but cannot authorize another start.
    const directory = path.join(root, entry.name);
    const occurrences = await readdir(directory, { withFileTypes: true });
    for (const item of occurrences) {
      const occurrence = parseRunOccurrenceId(item.name);
      if (!item.isDirectory() || occurrence === null)
        invalid(`Unknown Delivery Run occurrence: ${entry.name}/${item.name}`);
      const runDirectory = path.join(directory, item.name);
      const files = (await readdir(runDirectory)).sort().join(",");
      if (files !== "action.md,context.json,result.json") {
        const { descriptor } = await readDescriptor(runDirectory);
        if (
          descriptor.preparedContext.runId !== item.name ||
          descriptor.preparedContext.actionIdentity.deliveryId !==
            input.deliveryId ||
          descriptor.preparedContext.actionIdentity.changeId !== changeId ||
          descriptor.repositoryRoot !== input.repositoryRoot
        )
          invalid(`Invalid partial occupancy: ${entry.name}/${item.name}`);
        invalid(
          `Unresolved partial occupancy (${occurrence.sequence}): ${entry.name}/${item.name}`,
        );
      }
    }
    const history = await readSelectedRunChain({ ...input, changeId });
    if (history.kind !== "canonical")
      invalid(`Noncanonical Delivery Run group: ${entry.name}`);
    const own = history.records.map(
      (record) => record.context.occurrence.sequence,
    );
    if (own.length === 0 || Math.min(...own) !== history.changeStartSequence)
      invalid(
        `Run group start differs from its canonical sequence: ${entry.name}`,
      );
    sequences.push(...own);
  }
  sequences.sort((a, b) => a - b);
  const warnings: string[] = [];
  for (let index = 1; index < sequences.length; index += 1) {
    if (sequences[index] !== sequences[index - 1] + 1)
      if (warnings.length === 0)
        warnings.push(
          "Historical cross-Change sequence overlap or gap; bytes preserved",
        );
  }
  return { sequences, warnings };
}

export async function nextDeliveryRunSequence(input: {
  repositoryRoot: string;
  deliveryId: DeliveryId;
  changeId: ChangeId;
}): Promise<number> {
  const { sequences } = await deliveryRunOccupancy(input);
  const next = (sequences.at(-1) ?? 0) + 1;
  if (!isRunSequence(next)) invalid("Delivery Run sequence exhausted");
  return next;
}

export async function nextActionRunSequence(
  input: { repositoryRoot: string; deliveryId: DeliveryId; changeId: ChangeId },
  previous: DurableRunRecord | null,
): Promise<number> {
  if (previous === null) return nextDeliveryRunSequence(input);
  const next = previous.context.occurrence.sequence + 1;
  await assertDeliverySequenceAvailable(input, next);
  return next;
}

export async function assertDeliverySequenceAvailable(
  input: { repositoryRoot: string; deliveryId: DeliveryId; changeId: ChangeId },
  sequence: number,
) {
  if (!isRunSequence(sequence)) invalid("Delivery Run sequence exhausted");
  const { sequences } = await deliveryRunOccupancy(input);
  if (sequences.includes(sequence))
    invalid(`Delivery Run sequence occupied by another Change: ${sequence}`);
}
