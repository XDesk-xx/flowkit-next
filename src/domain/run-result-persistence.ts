import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  APPLICABLE_CHECK_FACTS_KEY,
  isApplicableCheckFactSet,
} from "../internal/applicable-check-facts.js";

import {
  isActionExecutionRole,
  isOwnerAuthorityFact,
  type ActionExecutionRole,
  type OwnerAuthorityFact,
} from "./authority.js";
import {
  isActionIdentity,
  isActionLifecycleState,
  type ActionIdentity,
  type ActionLifecycleState,
} from "./action-lifecycle.js";
import {
  isSemanticId,
  isStandardActionId,
  type ChangeId,
  type DeliveryId,
  type StandardActionId,
} from "./identity.js";

export const MAX_RUN_SEQUENCE = 999_999;
export const MAX_RUN_FACTS_JSON_BYTES = 65_536;

export interface RunOccurrence {
  readonly date: string;
  readonly sequence: number;
  readonly actionId: StandardActionId;
}

export interface RunAddressInput {
  readonly repositoryRoot: string;
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
  readonly changeStartSequence: number;
  readonly occurrence: RunOccurrence;
}

export interface RunAddress {
  readonly repositoryRoot: string;
  readonly changeRoot: string;
  readonly runDirectory: string;
  readonly runId: string;
}

export interface RunContextRecord {
  readonly runId: string;
  readonly occurrence: RunOccurrence;
  readonly actionIdentity: ActionIdentity;
  readonly role: ActionExecutionRole;
  readonly lifecycleState: ActionLifecycleState | null;
  readonly ownerAuthority: OwnerAuthorityFact | null;
  readonly previousRunId: string | null;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export interface RunResultRecord {
  readonly runId: string;
  readonly actionIdentity: ActionIdentity;
  readonly authorConclusion: string | null;
  readonly reviewerVerdict: string | null;
  readonly verificationVerdict: string | null;
  readonly nextBoundary: string | null;
  readonly facts: JsonObject;
}

export interface DurableRunRecord {
  readonly actionMarkdown: string;
  readonly context: RunContextRecord;
  readonly result: RunResultRecord;
}

const OCCURRENCE_FIELDS = ["date", "sequence", "actionId"] as const;
const CONTEXT_FIELDS = [
  "runId",
  "occurrence",
  "actionIdentity",
  "role",
  "lifecycleState",
  "ownerAuthority",
  "previousRunId",
] as const;
const RESULT_FIELDS = [
  "runId",
  "actionIdentity",
  "authorConclusion",
  "reviewerVerdict",
  "verificationVerdict",
  "nextBoundary",
  "facts",
] as const;
const RUN_ID_PATTERN = /^(\d{8})-(\d{3,})-(.+)$/;
const MAX_ACTION_MARKDOWN_BYTES = 65_536;
const MAX_OUTCOME_LENGTH = 128;
const MAX_JSON_DEPTH = 16;
const MAX_JSON_NODES = 1_024;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function hasExactlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === fields.length &&
    fields.every((field) => Object.hasOwn(value, field))
  );
}

function sameActionIdentity(a: ActionIdentity, b: ActionIdentity): boolean {
  return (
    a.deliveryId === b.deliveryId &&
    a.changeId === b.changeId &&
    a.actionId === b.actionId
  );
}

function sameRunOccurrence(a: RunOccurrence, b: RunOccurrence): boolean {
  return (
    a.date === b.date && a.sequence === b.sequence && a.actionId === b.actionId
  );
}

export function isRunSequence(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= MAX_RUN_SEQUENCE
  );
}

export function isCanonicalRunDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{8}$/.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];
  return day <= daysInMonth;
}

export function isRunOccurrence(value: unknown): value is RunOccurrence {
  if (!isRecord(value) || !hasExactlyFields(value, OCCURRENCE_FIELDS)) {
    return false;
  }
  return (
    isCanonicalRunDate(value.date) &&
    isRunSequence(value.sequence) &&
    isStandardActionId(value.actionId)
  );
}

function formatSequence(sequence: number): string {
  return String(sequence).padStart(3, "0");
}

export function formatRunOccurrenceId(
  occurrence: RunOccurrence,
): string | null {
  if (!isRunOccurrence(occurrence)) return null;
  return `${occurrence.date}-${formatSequence(occurrence.sequence)}-${occurrence.actionId}`;
}

export function parseRunOccurrenceId(value: unknown): RunOccurrence | null {
  if (typeof value !== "string") return null;
  const match = RUN_ID_PATTERN.exec(value);
  if (match === null) return null;

  const [, date, rawSequence, actionId] = match;
  const sequence = Number(rawSequence);
  const occurrence = { date, sequence, actionId };
  if (!isRunOccurrence(occurrence)) return null;
  if (formatSequence(sequence) !== rawSequence) return null;
  return occurrence;
}

export function buildRunAddress(input: RunAddressInput): RunAddress | null {
  if (
    typeof input.repositoryRoot !== "string" ||
    input.repositoryRoot.length === 0 ||
    !isSemanticId(input.deliveryId) ||
    !isSemanticId(input.changeId) ||
    !isRunSequence(input.changeStartSequence) ||
    !isRunOccurrence(input.occurrence)
  ) {
    return null;
  }

  const runId = formatRunOccurrenceId(input.occurrence);
  if (runId === null) return null;

  const repositoryRoot = path.resolve(input.repositoryRoot);
  const changeRoot = path.join(
    repositoryRoot,
    ".flowkit",
    "runs",
    input.deliveryId,
    `${formatSequence(input.changeStartSequence)}-${input.changeId}`,
  );
  const runDirectory = path.join(changeRoot, runId);

  if (
    path.dirname(runDirectory) !== changeRoot ||
    path.basename(runDirectory) !== runId
  ) {
    return null;
  }

  return { repositoryRoot, changeRoot, runDirectory, runId };
}

function isOutcomeValue(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" &&
      value.length >= 1 &&
      value.length <= MAX_OUTCOME_LENGTH &&
      !/[\u0000-\u001f\u007f]/.test(value))
  );
}

function isJsonValueInternal(
  value: unknown,
  depth: number,
  counter: { nodes: number },
): value is JsonValue {
  counter.nodes += 1;
  if (counter.nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) return false;

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValueInternal(item, depth + 1, counter));
  }

  if (!isRecord(value)) return false;
  return Object.values(value).every((item) =>
    isJsonValueInternal(item, depth + 1, counter),
  );
}

export function isJsonObject(value: unknown): value is JsonObject {
  if (!isRecord(value)) return false;
  const counter = { nodes: 0 };
  if (!isJsonValueInternal(value, 0, counter)) return false;
  try {
    return (
      Buffer.byteLength(JSON.stringify(value), "utf8") <=
      MAX_RUN_FACTS_JSON_BYTES
    );
  } catch {
    return false;
  }
}

export function isRunContextRecord(value: unknown): value is RunContextRecord {
  if (!isRecord(value) || !hasExactlyFields(value, CONTEXT_FIELDS)) {
    return false;
  }
  if (!isRunOccurrence(value.occurrence)) return false;
  if (!isActionIdentity(value.actionIdentity)) return false;
  if (!isActionExecutionRole(value.role)) return false;
  if (
    value.lifecycleState !== null &&
    !isActionLifecycleState(value.lifecycleState)
  ) {
    return false;
  }
  if (
    value.ownerAuthority !== null &&
    !isOwnerAuthorityFact(value.ownerAuthority)
  ) {
    return false;
  }
  if (
    value.previousRunId !== null &&
    parseRunOccurrenceId(value.previousRunId) === null
  ) {
    return false;
  }

  const expectedRunId = formatRunOccurrenceId(value.occurrence);
  if (expectedRunId === null || value.runId !== expectedRunId) return false;
  if (value.occurrence.actionId !== value.actionIdentity.actionId) return false;

  if (value.ownerAuthority !== null) {
    if (value.ownerAuthority.deliveryId !== value.actionIdentity.deliveryId) {
      return false;
    }
    if (
      value.ownerAuthority.changeId !== undefined &&
      value.ownerAuthority.changeId !== value.actionIdentity.changeId
    ) {
      return false;
    }
  }

  return true;
}

export function isRunResultRecord(value: unknown): value is RunResultRecord {
  if (!isRecord(value) || !hasExactlyFields(value, RESULT_FIELDS)) return false;
  if (!isActionIdentity(value.actionIdentity)) return false;

  const occurrence = parseRunOccurrenceId(value.runId);
  if (
    occurrence === null ||
    occurrence.actionId !== value.actionIdentity.actionId
  ) {
    return false;
  }
  if (!isOutcomeValue(value.authorConclusion)) return false;
  if (!isOutcomeValue(value.reviewerVerdict)) return false;
  if (!isOutcomeValue(value.verificationVerdict)) return false;
  if (value.nextBoundary !== null && !isSemanticId(value.nextBoundary)) {
    return false;
  }
  if (!isJsonObject(value.facts)) return false;
  if (
    Object.hasOwn(value.facts, APPLICABLE_CHECK_FACTS_KEY) &&
    !isApplicableCheckFactSet(value.facts[APPLICABLE_CHECK_FACTS_KEY])
  ) {
    return false;
  }

  return true;
}

export function hasMatchingRunLinkage(
  context: RunContextRecord,
  result: RunResultRecord,
): boolean {
  return (
    isRunContextRecord(context) &&
    isRunResultRecord(result) &&
    context.runId === result.runId &&
    sameActionIdentity(context.actionIdentity, result.actionIdentity)
  );
}

function isActionMarkdown(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    Buffer.byteLength(value, "utf8") <= MAX_ACTION_MARKDOWN_BYTES
  );
}

function recordMatchesAddress(
  address: RunAddress,
  input: RunAddressInput,
  context: RunContextRecord,
  result: RunResultRecord,
): boolean {
  return (
    context.runId === address.runId &&
    sameRunOccurrence(context.occurrence, input.occurrence) &&
    context.actionIdentity.deliveryId === input.deliveryId &&
    context.actionIdentity.changeId === input.changeId &&
    context.actionIdentity.actionId === input.occurrence.actionId &&
    hasMatchingRunLinkage(context, result)
  );
}

async function readChangeEntries(changeRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(changeRoot, { withFileTypes: true });
    const names: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        throw new Error(`Invalid Run history entry: ${entry.name}`);
      }
      if (parseRunOccurrenceId(entry.name) === null) {
        throw new Error(`Invalid Run occurrence directory: ${entry.name}`);
      }
      names.push(entry.name);
    }
    return names;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function assertUniqueSequences(runIds: readonly string[]): void {
  const seen = new Set<number>();
  for (const runId of runIds) {
    const occurrence = parseRunOccurrenceId(runId);
    if (occurrence === null) {
      throw new Error(`Invalid Run occurrence directory: ${runId}`);
    }
    if (seen.has(occurrence.sequence)) {
      throw new Error(`Duplicate Run sequence: ${occurrence.sequence}`);
    }
    seen.add(occurrence.sequence);
  }
}

export async function writeDurableRun(
  input: RunAddressInput,
  record: DurableRunRecord,
): Promise<RunAddress> {
  const address = buildRunAddress(input);
  if (address === null) throw new Error("Invalid controlled Run address input");
  if (!isActionMarkdown(record.actionMarkdown)) {
    throw new Error("Invalid action.md content");
  }
  if (!isRunContextRecord(record.context)) {
    throw new Error("Invalid Run context record");
  }
  if (!isRunResultRecord(record.result)) {
    throw new Error("Invalid Run result record");
  }
  if (!recordMatchesAddress(address, input, record.context, record.result)) {
    throw new Error("Run record linkage does not match generated address");
  }

  const existingRunIds = await readChangeEntries(address.changeRoot);
  assertUniqueSequences(existingRunIds);
  for (const existingRunId of existingRunIds) {
    const occurrence = parseRunOccurrenceId(existingRunId)!;
    if (occurrence.sequence === input.occurrence.sequence) {
      throw new Error(`Run sequence already exists: ${occurrence.sequence}`);
    }
  }

  await mkdir(address.changeRoot, { recursive: true });
  try {
    await mkdir(address.runDirectory, { recursive: false });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(`Run occurrence already exists: ${address.runId}`);
    }
    throw error;
  }

  try {
    await writeFile(
      path.join(address.runDirectory, "action.md"),
      record.actionMarkdown,
      { encoding: "utf8", flag: "wx" },
    );
    await writeFile(
      path.join(address.runDirectory, "context.json"),
      `${JSON.stringify(record.context, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    );
    await writeFile(
      path.join(address.runDirectory, "result.json"),
      `${JSON.stringify(record.result, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    );
    return address;
  } catch (error) {
    await rm(address.runDirectory, { recursive: true, force: true });
    throw error;
  }
}

function parseJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

export async function readDurableRun(
  input: RunAddressInput,
): Promise<DurableRunRecord> {
  const address = buildRunAddress(input);
  if (address === null) throw new Error("Invalid controlled Run address input");

  let actionMarkdown: string;
  let contextText: string;
  let resultText: string;
  try {
    [actionMarkdown, contextText, resultText] = await Promise.all([
      readFile(path.join(address.runDirectory, "action.md"), "utf8"),
      readFile(path.join(address.runDirectory, "context.json"), "utf8"),
      readFile(path.join(address.runDirectory, "result.json"), "utf8"),
    ]);
  } catch {
    throw new Error(`Incomplete Run record: ${address.runId}`);
  }

  if (!isActionMarkdown(actionMarkdown)) {
    throw new Error("Invalid action.md content");
  }

  const contextValue = parseJson(contextText, "context.json");
  const resultValue = parseJson(resultText, "result.json");
  if (!isRunContextRecord(contextValue)) {
    throw new Error("Invalid Run context record");
  }
  if (!isRunResultRecord(resultValue)) {
    throw new Error("Invalid Run result record");
  }
  if (!recordMatchesAddress(address, input, contextValue, resultValue)) {
    throw new Error("Run record linkage does not match generated address");
  }

  return {
    actionMarkdown,
    context: contextValue,
    result: resultValue,
  };
}

export async function listChangeRunHistory(input: {
  readonly repositoryRoot: string;
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
  readonly changeStartSequence: number;
}): Promise<DurableRunRecord[]> {
  if (
    typeof input.repositoryRoot !== "string" ||
    input.repositoryRoot.length === 0 ||
    !isSemanticId(input.deliveryId) ||
    !isSemanticId(input.changeId) ||
    !isRunSequence(input.changeStartSequence)
  ) {
    throw new Error("Invalid controlled Change Run root input");
  }

  const repositoryRoot = path.resolve(input.repositoryRoot);
  const changeRoot = path.join(
    repositoryRoot,
    ".flowkit",
    "runs",
    input.deliveryId,
    `${formatSequence(input.changeStartSequence)}-${input.changeId}`,
  );
  const runIds = await readChangeEntries(changeRoot);
  assertUniqueSequences(runIds);

  const occurrences = runIds
    .map((runId) => parseRunOccurrenceId(runId)!)
    .sort((a, b) => a.sequence - b.sequence);

  const records: DurableRunRecord[] = [];
  for (const occurrence of occurrences) {
    records.push(
      await readDurableRun({
        repositoryRoot,
        deliveryId: input.deliveryId,
        changeId: input.changeId,
        changeStartSequence: input.changeStartSequence,
        occurrence,
      }),
    );
  }
  return records;
}
