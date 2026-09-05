import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { isMap, isScalar, parse, parseDocument } from "yaml";

import type { DeliveryFinalOperationPackage } from "../domain/delivery-operation-execution.js";
import {
  isDeliveryCoordinationRef,
  type DeliveryCoordinationRef,
} from "../domain/delivery-final-operation.js";
import { isSemanticId, type DeliveryId } from "../domain/identity.js";

interface DeliveryFinalCoordinationPrestate {
  readonly ref: DeliveryCoordinationRef;
  readonly completedRequiredChangeIds: readonly string[];
}

interface ParsedManifestPrestate {
  readonly document: Record<string, unknown>;
  readonly completedRequiredChangeIds: readonly string[];
}

const PRE_FINAL_DELIVERY_FIELDS = [
  "state",
  "fullTestStatus",
  "finalizationStatus",
] as const;
const COMPLETED_DELIVERY_FIELDS = [
  ...PRE_FINAL_DELIVERY_FIELDS,
  "formalVerificationCandidate",
] as const;
const FINALIZATION_FIELDS = [
  "state",
  "verifiedCandidateRef",
  "fullTestExecutionRef",
  "architectureFinalizationRef",
  "architectureMaterializedCandidateRef",
  "gitCheckpoint",
] as const;

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
    fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
  );
}

function coordinationArtifact(deliveryId: DeliveryId): string {
  return `openspec/delivery-groups/${deliveryId}.yaml`;
}

function coordinationRef(
  deliveryId: DeliveryId,
  bytes: Buffer,
): DeliveryCoordinationRef {
  return {
    artifact: coordinationArtifact(deliveryId),
    contentSha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  };
}

function sameCoordinationRef(
  left: DeliveryCoordinationRef,
  right: DeliveryCoordinationRef,
): boolean {
  return (
    left.artifact === right.artifact &&
    left.contentSha256 === right.contentSha256 &&
    left.bytes === right.bytes
  );
}

function requiredCompletedChangeIds(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.length < 1) return null;
  const allIds = new Set<string>();
  const required: string[] = [];
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      !isSemanticId(entry.id) ||
      typeof entry.required !== "boolean" ||
      typeof entry.state !== "string" ||
      allIds.has(entry.id)
    ) {
      return null;
    }
    allIds.add(entry.id);
    if (entry.required) {
      if (entry.state !== "completed") return null;
      required.push(entry.id);
    }
  }
  return required.length > 0 ? required : null;
}

function parseYamlObject(bytes: Buffer): Record<string, unknown> | null {
  try {
    const value = parse(bytes.toString("utf8")) as unknown;
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function parsePrestate(
  bytes: Buffer,
  deliveryId: DeliveryId,
): ParsedManifestPrestate | null {
  const document = parseYamlObject(bytes);
  if (
    document === null ||
    document.id !== deliveryId ||
    !isRecord(document.delivery) ||
    !hasExactlyFields(document.delivery, PRE_FINAL_DELIVERY_FIELDS) ||
    document.delivery.state !== "active" ||
    document.delivery.fullTestStatus !== "pending" ||
    document.delivery.finalizationStatus !== "pending" ||
    Object.prototype.hasOwnProperty.call(document, "finalization")
  ) {
    return null;
  }
  const completedRequiredChangeIds = requiredCompletedChangeIds(
    document.changes,
  );
  return completedRequiredChangeIds === null
    ? null
    : { document, completedRequiredChangeIds };
}

function parseCompleted(
  bytes: Buffer,
  operationPackage: DeliveryFinalOperationPackage,
): Record<string, unknown> | null {
  const document = parseYamlObject(bytes);
  if (
    document === null ||
    document.id !== operationPackage.deliveryId ||
    !isRecord(document.delivery) ||
    !hasExactlyFields(document.delivery, COMPLETED_DELIVERY_FIELDS) ||
    document.delivery.state !== "completed" ||
    document.delivery.fullTestStatus !== "passed" ||
    document.delivery.finalizationStatus !== "completed" ||
    document.delivery.formalVerificationCandidate !==
      operationPackage.operationFacts.verifiedCandidateRef ||
    !isRecord(document.finalization) ||
    !hasExactlyFields(document.finalization, FINALIZATION_FIELDS) ||
    document.finalization.state !== "completed" ||
    document.finalization.verifiedCandidateRef !==
      operationPackage.operationFacts.verifiedCandidateRef ||
    document.finalization.fullTestExecutionRef !==
      operationPackage.operationFacts.fullTestExecutionRef ||
    document.finalization.architectureFinalizationRef !==
      operationPackage.operationFacts.architectureFinalizationRef ||
    document.finalization.architectureMaterializedCandidateRef !==
      operationPackage.operationFacts.architectureMaterializedCandidateRef ||
    document.finalization.gitCheckpoint !==
      "pending-owner-authorized-local-delivery-commit"
  ) {
    return null;
  }
  const completedIds = requiredCompletedChangeIds(document.changes);
  if (
    completedIds === null ||
    JSON.stringify(completedIds) !==
      JSON.stringify(operationPackage.operationFacts.completedRequiredChangeIds)
  ) {
    return null;
  }
  return document;
}

function materializeCompletedManifestBytes(
  original: Buffer,
  operationPackage: DeliveryFinalOperationPackage,
): Buffer | null {
  const source = original.toString("utf8");
  const document = parseDocument(source, { keepSourceTokens: true });
  if (document.errors.length > 0 || !isMap(document.contents)) return null;

  const deliveryPair = document.contents.items.find(
    (pair) => isScalar(pair.key) && pair.key.value === "delivery",
  );
  const delivery = deliveryPair?.value;
  if (
    deliveryPair === undefined ||
    !isScalar(deliveryPair.key) ||
    deliveryPair.key.range === undefined ||
    !isMap(delivery) ||
    delivery.range === undefined ||
    delivery.flow
  ) {
    return null;
  }

  const lineIndent = (offset: number): string | null => {
    const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
    const indent = source.slice(lineStart, offset);
    return /^[ ]*$/.test(indent) ? indent : null;
  };
  const topLevelIndent = lineIndent(deliveryPair.key.range[0]);
  if (topLevelIndent === null) return null;

  const replacements = new Map<string, string>([
    ["state", "completed"],
    ["fullTestStatus", "passed"],
    ["finalizationStatus", "completed"],
  ]);
  const edits: Array<{
    readonly start: number;
    readonly end: number;
    readonly replacement: string;
  }> = [];
  let deliveryIndent: string | null = null;
  for (const pair of delivery.items) {
    if (!isScalar(pair.key) || typeof pair.key.value !== "string") return null;
    const replacement = replacements.get(pair.key.value);
    if (replacement === undefined) continue;
    if (!isScalar(pair.value) || pair.value.range === undefined) return null;
    const indent = lineIndent(pair.key.range[0]);
    if (
      indent === null ||
      indent.length <= topLevelIndent.length ||
      !indent.startsWith(topLevelIndent) ||
      (deliveryIndent !== null && indent !== deliveryIndent)
    ) {
      return null;
    }
    deliveryIndent = indent;
    edits.push({
      start: pair.value.range[0],
      end: pair.value.range[1],
      replacement,
    });
  }
  if (edits.length !== replacements.size || deliveryIndent === null)
    return null;

  const beforeInsertion = source.slice(0, delivery.range[2]);
  const newline = beforeInsertion.endsWith("\r\n")
    ? "\r\n"
    : beforeInsertion.endsWith("\n")
      ? "\n"
      : null;
  if (newline === null) return null;

  const facts = operationPackage.operationFacts;
  const quoted = (value: string): string => JSON.stringify(value);
  const inserted = [
    `${deliveryIndent}formalVerificationCandidate: ${quoted(facts.verifiedCandidateRef)}`,
    `${topLevelIndent}finalization:`,
    `${deliveryIndent}state: completed`,
    `${deliveryIndent}verifiedCandidateRef: ${quoted(facts.verifiedCandidateRef)}`,
    `${deliveryIndent}fullTestExecutionRef: ${quoted(facts.fullTestExecutionRef)}`,
    `${deliveryIndent}architectureFinalizationRef: ${quoted(facts.architectureFinalizationRef)}`,
    `${deliveryIndent}architectureMaterializedCandidateRef: ${quoted(facts.architectureMaterializedCandidateRef)}`,
    `${deliveryIndent}gitCheckpoint: pending-owner-authorized-local-delivery-commit`,
    "",
  ].join(newline);
  edits.push({
    start: delivery.range[2],
    end: delivery.range[2],
    replacement: inserted,
  });

  let completed = source;
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    completed =
      completed.slice(0, edit.start) +
      edit.replacement +
      completed.slice(edit.end);
  }
  return Buffer.from(completed, "utf8");
}

async function canonicalTarget(
  repositoryRoot: string,
  deliveryId: DeliveryId,
): Promise<{ readonly root: string; readonly target: string } | null> {
  try {
    const root = await fs.realpath(repositoryRoot);
    const target = path.join(
      root,
      "openspec",
      "delivery-groups",
      `${deliveryId}.yaml`,
    );
    const entry = await fs.lstat(target);
    if (!entry.isFile() || entry.isSymbolicLink()) return null;
    if ((await fs.realpath(target)) !== target) return null;
    return { root, target };
  } catch {
    return null;
  }
}

async function readCanonicalBytes(
  repositoryRoot: string,
  deliveryId: DeliveryId,
): Promise<Buffer | null> {
  const resolved = await canonicalTarget(repositoryRoot, deliveryId);
  if (resolved === null) return null;
  try {
    return await fs.readFile(resolved.target);
  } catch {
    return null;
  }
}

export async function readDeliveryFinalCoordinationPrestate(
  repositoryRoot: string,
  deliveryId: DeliveryId,
): Promise<DeliveryFinalCoordinationPrestate | null> {
  const bytes = await readCanonicalBytes(repositoryRoot, deliveryId);
  if (bytes === null) return null;
  const parsed = parsePrestate(bytes, deliveryId);
  if (parsed === null) return null;
  return {
    ref: coordinationRef(deliveryId, bytes),
    completedRequiredChangeIds: parsed.completedRequiredChangeIds,
  };
}

export async function revalidateDeliveryFinalCoordinationPrestate(
  repositoryRoot: string,
  operationPackage: DeliveryFinalOperationPackage,
): Promise<boolean> {
  const current = await readDeliveryFinalCoordinationPrestate(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  return (
    current !== null &&
    sameCoordinationRef(
      current.ref,
      operationPackage.operationFacts.coordinationPrestateRef,
    ) &&
    JSON.stringify(current.completedRequiredChangeIds) ===
      JSON.stringify(operationPackage.operationFacts.completedRequiredChangeIds)
  );
}

export async function writeDeliveryFinalCoordinationClosure(
  repositoryRoot: string,
  operationPackage: DeliveryFinalOperationPackage,
): Promise<DeliveryCoordinationRef | null> {
  if (
    !isDeliveryCoordinationRef(
      operationPackage.operationFacts.coordinationPrestateRef,
    )
  ) {
    return null;
  }
  const resolved = await canonicalTarget(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  if (resolved === null) return null;
  const original = await readCanonicalBytes(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  if (original === null) return null;
  const parsed = parsePrestate(original, operationPackage.deliveryId);
  if (
    parsed === null ||
    !sameCoordinationRef(
      coordinationRef(operationPackage.deliveryId, original),
      operationPackage.operationFacts.coordinationPrestateRef,
    ) ||
    JSON.stringify(parsed.completedRequiredChangeIds) !==
      JSON.stringify(operationPackage.operationFacts.completedRequiredChangeIds)
  ) {
    return null;
  }

  const stagedBytes = materializeCompletedManifestBytes(
    original,
    operationPackage,
  );
  if (stagedBytes === null) return null;
  if (parseCompleted(stagedBytes, operationPackage) === null) return null;

  const temporary = path.join(
    path.dirname(resolved.target),
    `.${path.basename(resolved.target)}.${randomUUID()}.tmp`,
  );
  try {
    const handle = await fs.open(temporary, "wx");
    try {
      await handle.writeFile(stagedBytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    const beforeReplace = await readCanonicalBytes(
      repositoryRoot,
      operationPackage.deliveryId,
    );
    if (beforeReplace === null || !beforeReplace.equals(original)) return null;
    await fs.rename(temporary, resolved.target);
    const reread = await readCanonicalBytes(
      repositoryRoot,
      operationPackage.deliveryId,
    );
    if (reread === null || !reread.equals(stagedBytes)) return null;
    if (parseCompleted(reread, operationPackage) === null) return null;
    return coordinationRef(operationPackage.deliveryId, reread);
  } catch {
    return null;
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
