import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  isJsonObject,
  type DurableRunRecord,
  type JsonObject,
  type RunResultRecord,
} from "../domain/run-result-persistence.js";
import { isSemanticId } from "../domain/identity.js";
import { parseRunOccurrenceId } from "../domain/run-result-persistence.js";
import {
  actionTargetPath,
  isCanonicalTargetPath,
} from "./action-target-files.js";

export interface ActionProofRef {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly deliveryId: string;
  readonly changeId: string;
  readonly runId: string;
  readonly purpose: string;
}
export interface ActionHandoff {
  readonly summary: string;
  readonly ownerDecisions: readonly { sourceRef: string; summary: string }[];
  readonly evidenceRefs: readonly { sourceRunId: string; path: string }[];
}
export class ActionProofError extends Error {
  readonly kind = "action-evidence-rejected";
}
function reject(message: string): never {
  throw new ActionProofError(message);
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function fields(
  value: unknown,
  keys: string[],
): value is Record<string, unknown> {
  return (
    record(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function proofRoot(
  identity: { deliveryId: string; changeId: string },
  runId: string,
): string {
  if (
    !isSemanticId(identity.deliveryId) ||
    !isSemanticId(identity.changeId) ||
    parseRunOccurrenceId(runId) === null
  )
    reject("Invalid proof ownership");
  return `.flowkit/artifacts/${identity.deliveryId}/changes/${identity.changeId}/proof/${runId}`;
}

export function parseActionProofFacts(facts: JsonObject): {
  proofRefs: ActionProofRef[];
  handoff: ActionHandoff;
} {
  if (!isJsonObject(facts) || Object.hasOwn(facts, "invocationFailure"))
    reject("Invalid or reserved host facts");
  if (!Array.isArray(facts.proofRefs)) reject("proofRefs required");
  const proofRefs = facts.proofRefs.map((value) => {
    if (
      !fields(value, [
        "path",
        "bytes",
        "sha256",
        "deliveryId",
        "changeId",
        "runId",
        "purpose",
      ]) ||
      !isCanonicalTargetPath(value.path) ||
      typeof value.bytes !== "number" ||
      !Number.isSafeInteger(value.bytes) ||
      value.bytes < 0 ||
      typeof value.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(value.sha256) ||
      !isSemanticId(value.deliveryId) ||
      !isSemanticId(value.changeId) ||
      parseRunOccurrenceId(value.runId) === null ||
      !text(value.purpose)
    )
      reject("Invalid proofRef");
    return value as unknown as ActionProofRef;
  });
  const handoff = facts.handoff;
  if (
    !fields(handoff, ["summary", "ownerDecisions", "evidenceRefs"]) ||
    !text(handoff.summary) ||
    !Array.isArray(handoff.ownerDecisions) ||
    !Array.isArray(handoff.evidenceRefs)
  )
    reject("handoff required");
  for (const decision of handoff.ownerDecisions) {
    if (
      !fields(decision, ["sourceRef", "summary"]) ||
      !text(decision.sourceRef) ||
      !text(decision.summary)
    )
      reject("Invalid Owner handoff");
  }
  for (const ref of handoff.evidenceRefs) {
    if (
      !fields(ref, ["sourceRunId", "path"]) ||
      parseRunOccurrenceId(ref.sourceRunId) === null ||
      !isCanonicalTargetPath(ref.path)
    )
      reject("Invalid evidence handoff");
  }
  return { proofRefs, handoff: handoff as unknown as ActionHandoff };
}

async function verifyRef(
  repositoryRoot: string,
  ref: ActionProofRef,
  source: RunResultRecord,
) {
  if (
    ref.deliveryId !== source.actionIdentity.deliveryId ||
    ref.changeId !== source.actionIdentity.changeId ||
    ref.runId !== source.runId ||
    !ref.path.startsWith(`${proofRoot(source.actionIdentity, source.runId)}/`)
  )
    reject("Proof ownership mismatch");
  try {
    const file = await actionTargetPath(repositoryRoot, ref.path);
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink())
      reject("Proof must be a regular file");
    const root = await realpath(repositoryRoot);
    const resolved = await realpath(file);
    const relative = path.relative(root, resolved);
    if (
      path.isAbsolute(relative) ||
      relative === ".." ||
      relative.startsWith(`..${path.sep}`)
    )
      reject("Proof escapes repository");
    const bytes = await readFile(file);
    if (
      bytes.length !== ref.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== ref.sha256
    )
      reject("Proof integrity mismatch");
  } catch (error) {
    if (error instanceof ActionProofError) throw error;
    reject(`Proof unreadable: ${ref.path}`);
  }
}

/** Reads only declared related files, never all historical proof. */
export async function validateActionProof(
  repositoryRoot: string,
  candidate: RunResultRecord,
  history: readonly DurableRunRecord[],
  validateProduced = true,
) {
  const parsed = parseActionProofFacts(candidate.facts);
  const refs = new Map<string, ActionProofRef>();
  for (const ref of parsed.proofRefs) {
    const prior = refs.get(ref.path);
    if (prior && !isDeepStrictEqual(prior, ref))
      reject("Conflicting duplicate proof path");
    refs.set(ref.path, ref);
    if (validateProduced) await verifyRef(repositoryRoot, ref, candidate);
  }
  const evidenceRefs: ActionProofRef[] = [];
  for (const request of parsed.handoff.evidenceRefs) {
    const source =
      request.sourceRunId === candidate.runId
        ? candidate
        : history.find((item) => item.context.runId === request.sourceRunId)
            ?.result;
    if (
      !source ||
      source.actionIdentity.deliveryId !==
        candidate.actionIdentity.deliveryId ||
      source.actionIdentity.changeId !== candidate.actionIdentity.changeId
    )
      reject("Missing same-Change proof source");
    const sourceRefs =
      source === candidate
        ? parsed.proofRefs
        : parseActionProofFacts(source.facts).proofRefs;
    const matching = sourceRefs.filter((ref) => ref.path === request.path);
    if (
      matching.length === 0 ||
      matching.some((ref) => !isDeepStrictEqual(ref, matching[0]))
    )
      reject("Missing or conflicting declared evidence");
    await verifyRef(repositoryRoot, matching[0], source);
    evidenceRefs.push(matching[0]);
  }
  return { ...parsed, evidenceRefs };
}
