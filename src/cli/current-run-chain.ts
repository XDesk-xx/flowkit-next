import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { expectedExecutionRoleForAction } from "../domain/action-package-result-admission.js";
import { evaluatePolicyAndNextBoundary } from "../domain/policy-and-next-boundary.js";
import {
  isRunSequence,
  listChangeRunHistory,
  type DurableRunRecord,
} from "../domain/run-result-persistence.js";
import type { ChangeId, DeliveryId } from "../domain/identity.js";

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
    changeState: string;
    ownerCorrection?: unknown;
  },
) {
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
        changeState:
          context.actionIdentity.actionId === "archive"
            ? "completed"
            : "active",
      });
      if (
        own.kind === "blocked" &&
        !(
          context.role === "author" &&
          result.authorConclusion === "FAIL" &&
          result.nextBoundary === null
        )
      )
        invalid(`Invalid terminal outcome: ${context.runId}`);
    }
    const parentId = context.previousRunId;
    if (parentId === null) continue;
    const parent = byId.get(parentId);
    if (!parent || children.has(parentId))
      invalid(`Missing parent or fork: ${context.runId}`);
    if (
      parent.context.actionIdentity.deliveryId !==
        context.actionIdentity.deliveryId ||
      parent.context.actionIdentity.changeId !== context.actionIdentity.changeId
    )
      invalid(`Cross-target parent: ${context.runId}`);
    const input = {
      ...context.actionIdentity,
      changeState:
        parent.context.actionIdentity.actionId === "archive"
          ? "completed"
          : "active",
    };
    let boundary = policyForRecord(parent, input);
    if (
      (boundary.kind !== "ready-action" ||
        boundary.actionId !== context.actionIdentity.actionId) &&
      context.ownerAuthority !== null
    ) {
      boundary = policyForRecord(parent, {
        ...input,
        ownerCorrection: {
          requestedAction: context.actionIdentity.actionId,
          authority: context.ownerAuthority,
        },
      });
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
    invalid(error instanceof Error ? error.message : "Run history read failed");
  }
  if (records.length === 0) invalid("Empty canonical Run group");
  return {
    kind: "canonical" as const,
    changeStartSequence: sequence,
    records,
    current: resolveRunChain(records),
  };
}
