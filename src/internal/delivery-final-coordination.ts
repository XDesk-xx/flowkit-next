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
import {
  deriveDeliveryFinalizationRef,
  type DeliveryFinalizationRecord,
} from "../domain/delivery-finalization.js";

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
  "fullTestAttempt",
  "finalizationStatus",
] as const;
const FINALIZATION_FIELDS = [
  "state",
  "ownerAuthorityRef",
  "sourceRef",
  "fullTestAttempt",
  "verifiedCandidateRef",
  "fullTestExecutionRef",
  "confirmationRef",
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
    !PRE_FINAL_DELIVERY_FIELDS.every((field) =>
      Object.hasOwn(document.delivery as object, field),
    ) ||
    document.delivery.state !== "active" ||
    document.delivery.fullTestStatus !== "passed" ||
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

function finalRecord(
  operationPackage: DeliveryFinalOperationPackage,
): DeliveryFinalizationRecord {
  const facts = operationPackage.operationFacts;
  const links = {
    projectId: facts.projectId,
    deliveryId: operationPackage.deliveryId,
    ownerAuthorityRef: operationPackage.ownerAuthority.ref,
    sourceRef: operationPackage.ownerAuthority.sourceRef,
    fullTestAttempt: facts.fullTestAttempt,
    verifiedCandidateRef: facts.verifiedCandidateRef,
    fullTestExecutionRef: facts.fullTestExecutionRef,
  };
  const ref = deriveDeliveryFinalizationRef(links);
  if (ref === null) throw new Error("invalid finalization links");
  return { ...links, deliveryFinalizationRef: ref };
}

function parseCompleted(
  bytes: Buffer,
  operationPackage: DeliveryFinalOperationPackage,
  confirmationRef: string | null,
): Record<string, unknown> | null {
  const document = parseYamlObject(bytes);
  const record = finalRecord(operationPackage);
  if (
    document === null ||
    document.id !== operationPackage.deliveryId ||
    !isRecord(document.delivery) ||
    !PRE_FINAL_DELIVERY_FIELDS.every((field) =>
      Object.hasOwn(document.delivery as object, field),
    ) ||
    document.delivery.state !== "completed" ||
    document.delivery.fullTestStatus !== "passed" ||
    document.delivery.finalizationStatus !== "completed" ||
    document.delivery.fullTestAttempt !== record.fullTestAttempt ||
    !isRecord(document.finalization) ||
    !hasExactlyFields(document.finalization, FINALIZATION_FIELDS) ||
    document.finalization.state !== "completed" ||
    document.finalization.confirmationRef !== confirmationRef
  )
    return null;
  for (const field of [
    "ownerAuthorityRef",
    "sourceRef",
    "fullTestAttempt",
    "verifiedCandidateRef",
    "fullTestExecutionRef",
  ] as const) {
    if (document.finalization[field] !== record[field]) return null;
  }
  return JSON.stringify(requiredCompletedChangeIds(document.changes)) ===
    JSON.stringify(operationPackage.operationFacts.completedRequiredChangeIds)
    ? document
    : null;
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
    `${topLevelIndent}finalization:`,
    `${deliveryIndent}state: completed`,
    `${deliveryIndent}verifiedCandidateRef: ${quoted(facts.verifiedCandidateRef)}`,
    `${deliveryIndent}fullTestExecutionRef: ${quoted(facts.fullTestExecutionRef)}`,
    `${deliveryIndent}ownerAuthorityRef: ${quoted(operationPackage.ownerAuthority.ref)}`,
    `${deliveryIndent}sourceRef: ${quoted(operationPackage.ownerAuthority.sourceRef)}`,
    `${deliveryIndent}fullTestAttempt: ${quoted(facts.fullTestAttempt)}`,
    `${deliveryIndent}confirmationRef: null`,
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

export type DeliveryMutationStatus =
  "not-written" | "written-unconfirmed" | "unknown";
export type CoordinationWriteOutcome =
  | { status: "confirmed"; record: DeliveryFinalizationRecord }
  | {
      status: "failed";
      mutationStatus: DeliveryMutationStatus;
      reason: string;
    };

function confirmationBytes(content: Buffer, ref: string): Buffer | null {
  const source = content.toString("utf8");
  const doc = parseDocument(source, { keepSourceTokens: true });
  const value = doc.getIn(["finalization", "confirmationRef"], true);
  if (
    doc.errors.length ||
    !isScalar(value) ||
    value.value !== null ||
    !value.range
  )
    return null;
  return Buffer.from(
    source.slice(0, value.range[0]) +
      JSON.stringify(ref) +
      source.slice(value.range[1]),
  );
}

/** Atomic confirmation replacement is the success commit point. No business validation follows it. */
export async function writeDeliveryFinalCoordinationClosure(
  repositoryRoot: string,
  operationPackage: DeliveryFinalOperationPackage,
  revalidateRelated: () => Promise<boolean>,
): Promise<CoordinationWriteOutcome> {
  let mutationStatus: DeliveryMutationStatus = "not-written";
  let reason = "content-validation-failed";
  const fail = (): CoordinationWriteOutcome => ({
    status: "failed",
    mutationStatus,
    reason,
  });
  const resolved = await canonicalTarget(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  if (
    resolved === null ||
    !isDeliveryCoordinationRef(
      operationPackage.operationFacts.coordinationPrestateRef,
    )
  )
    return fail();
  const original = await readCanonicalBytes(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  if (
    original === null ||
    !parsePrestate(original, operationPackage.deliveryId) ||
    !sameCoordinationRef(
      coordinationRef(operationPackage.deliveryId, original),
      operationPackage.operationFacts.coordinationPrestateRef,
    )
  )
    return fail();
  const content = materializeCompletedManifestBytes(original, operationPackage);
  if (
    content === null ||
    parseCompleted(content, operationPackage, null) === null
  )
    return fail();
  const record = finalRecord(operationPackage);
  const confirmed = confirmationBytes(content, record.deliveryFinalizationRef);
  if (
    confirmed === null ||
    parseCompleted(
      confirmed,
      operationPackage,
      record.deliveryFinalizationRef,
    ) === null
  )
    return fail();

  async function replace(
    expected: Buffer,
    targetBytes: Buffer,
    confirming: boolean,
  ): Promise<boolean> {
    const temporary = path.join(
      path.dirname(resolved!.target),
      "." + path.basename(resolved!.target) + "." + randomUUID() + ".tmp",
    );
    try {
      const handle = await fs.open(temporary, "wx");
      try {
        await handle.writeFile(targetBytes);
        await handle.sync();
      } finally {
        await handle.close();
      }
      if (confirming && !(await revalidateRelated())) return false;
      const before = await readCanonicalBytes(
        repositoryRoot,
        operationPackage.deliveryId,
      );
      if (before === null || !before.equals(expected)) return false;
      mutationStatus = "unknown";
      await fs.rename(temporary, resolved!.target);
      mutationStatus = "written-unconfirmed";
      if (confirming) reason = "confirmation-readback-failed";
      return true;
    } finally {
      // Only this invocation's exact temporary path; never remove retained evidence.
      await fs.rm(temporary, { force: true });
    }
  }
  try {
    if (!(await replace(original, content, false))) return fail();
    const readback = await readCanonicalBytes(
      repositoryRoot,
      operationPackage.deliveryId,
    );
    if (
      readback === null ||
      !readback.equals(content) ||
      parseCompleted(readback, operationPackage, null) === null ||
      !(await revalidateRelated())
    )
      return fail();
    reason = "confirmation-publication-failed";
    if (!(await replace(content, confirmed, true))) return fail();
    reason = "confirmation-readback-failed";
    const acknowledged = await readCanonicalBytes(
      repositoryRoot,
      operationPackage.deliveryId,
    );
    if (acknowledged === null || !acknowledged.equals(confirmed)) return fail();
    return { status: "confirmed", record };
  } catch {
    return fail();
  }
}
