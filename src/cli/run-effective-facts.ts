import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  isOwnerAuthorityFact,
  type ActionExecutionRole,
  type OwnerAuthorityFact,
} from "../domain/authority.js";
import {
  parseRunOccurrenceId,
  readDurableRun,
  type DurableRunRecord,
  type JsonObject,
} from "../domain/run-result-persistence.js";
import { assertManagedEvidenceGitBytes } from "../internal/managed-evidence-git.js";
import { uniqueRunGroup } from "../internal/proof-path-owner.js";
import { checkDeclaredProofs } from "./action-proof.js";
import { readDescriptor } from "./action-descriptor.js";
import type { ActionTarget } from "./action-request.js";
import { parseFoundationCliRequestJson } from "./request.js";

export type RunHashes = Readonly<
  Record<"action.md" | "context.json" | "result.json", string>
>;
export interface RunCorrection {
  readonly formatVersion: 1;
  readonly deliveryId: string;
  readonly changeId: string;
  readonly runId: string;
  readonly role: ActionExecutionRole;
  readonly originalHashes: RunHashes;
  readonly ownerAuthority: OwnerAuthorityFact;
  readonly additions: JsonObject;
  readonly candidateEvidenceRef: string | null;
  readonly createdAt: string;
}
export const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

export async function controlledBytes(root: string, relative: string) {
  if (
    !relative ||
    relative.includes("\\") ||
    relative.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw Error("Invalid controlled material path");
  let file = root;
  for (const part of relative.split("/")) {
    file = path.join(file, part);
    if ((await lstat(file)).isSymbolicLink())
      throw Error(`Linked material: ${relative}`);
  }
  if (!(await lstat(file)).isFile())
    throw Error(`Nonregular material: ${relative}`);
  return readFile(file);
}

export async function runMaterialLocation(target: ActionTarget, runId: string) {
  const occurrence = parseRunOccurrenceId(runId);
  if (occurrence === null) throw Error("Invalid Run locator");
  const group = uniqueRunGroup(
    await readdir(
      path.join(target.repositoryRoot, ".flowkit/runs", target.deliveryId),
    ),
    target.changeId,
  );
  const runRoot = `.flowkit/runs/${target.deliveryId}/${group}/${runId}`;
  const correctionPath = `.flowkit/artifacts/${target.deliveryId}/changes/${group}/corrections/${runId}/correction.json`;
  const record = await readDurableRun({
    ...target,
    changeStartSequence: Number(group.slice(0, -(target.changeId.length + 1))),
    occurrence,
  });
  const originalHashes = {} as Record<keyof RunHashes, string>;
  for (const name of ["action.md", "context.json", "result.json"] as const)
    originalHashes[name] = sha256(
      await controlledBytes(target.repositoryRoot, `${runRoot}/${name}`),
    );
  return { group, runRoot, correctionPath, record, originalHashes };
}

export function validateCorrectionShape(value: unknown): RunCorrection {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw Error("Correction object required");
  const c = value as RunCorrection;
  if (
    Object.keys(c).sort().join() !==
      "additions,candidateEvidenceRef,changeId,createdAt,deliveryId,formatVersion,originalHashes,ownerAuthority,role,runId" ||
    c.formatVersion !== 1 ||
    !isOwnerAuthorityFact(c.ownerAuthority) ||
    c.ownerAuthority.decision !== "correct-run-metadata" ||
    c.ownerAuthority.deliveryId !== c.deliveryId ||
    c.ownerAuthority.changeId !== c.changeId ||
    !isDeepStrictEqual(c.ownerAuthority.scope, ["correct-run-metadata"]) ||
    (c.role !== "author" && c.role !== "reviewer") ||
    parseRunOccurrenceId(c.runId) === null ||
    typeof c.createdAt !== "string" ||
    !Number.isFinite(Date.parse(c.createdAt)) ||
    typeof c.originalHashes !== "object" ||
    c.originalHashes === null ||
    Object.keys(c.originalHashes).sort().join() !==
      "action.md,context.json,result.json" ||
    !Object.values(c.originalHashes).every(
      (hash) => typeof hash === "string" && /^[a-f0-9]{64}$/.test(hash),
    ) ||
    typeof c.additions !== "object" ||
    c.additions === null ||
    Array.isArray(c.additions) ||
    !Object.keys(c.additions).length ||
    Object.keys(c.additions).some(
      (key) =>
        !["artifactHashes", "reviewedRunId", "reviewedAuthorRunId"].includes(
          key,
        ),
    ) ||
    (c.candidateEvidenceRef !== null &&
      typeof c.candidateEvidenceRef !== "string")
  )
    throw Error("Correction closed shape/Owner identity invalid");
  return c;
}

async function correctionFor(target: ActionTarget, runId: string) {
  const location = await runMaterialLocation(target, runId);
  const directory = path.dirname(
    path.join(target.repositoryRoot, location.correctionPath),
  );
  const names = await readdir(directory).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    },
  );
  if (names === null) return { ...location, correction: null };
  if (!isDeepStrictEqual(names, ["correction.json"]))
    throw Error("Partial or conflicting correction materials");
  const correction = validateCorrectionShape(
    parseFoundationCliRequestJson(
      (
        await controlledBytes(target.repositoryRoot, location.correctionPath)
      ).toString("utf8"),
    ),
  );
  await assertManagedEvidenceGitBytes(
    target.repositoryRoot,
    location.correctionPath,
  );
  if (
    correction.deliveryId !== target.deliveryId ||
    correction.changeId !== target.changeId ||
    correction.runId !== runId ||
    correction.role !== location.record.context.role ||
    !isDeepStrictEqual(correction.originalHashes, location.originalHashes)
  )
    throw Error("Correction original Run identity/hash drift");
  return { ...location, correction };
}

export async function validateCorrectionAdditions(
  target: ActionTarget,
  original: DurableRunRecord,
  correction: RunCorrection,
) {
  if (original.context.lifecycleState !== "terminal")
    throw Error("Correction requires terminal Run");
  for (const [key, value] of Object.entries(correction.additions)) {
    const old = original.result.facts[key];
    if (
      old !== undefined &&
      !(
        key === "artifactHashes" &&
        old !== null &&
        typeof old === "object" &&
        !Array.isArray(old) &&
        Object.keys(old).length === 0
      )
    )
      throw Error(`Correction cannot replace an existing fact: ${key}`);
    if (correction.role === "reviewer") {
      if (
        !["reviewedRunId", "reviewedAuthorRunId"].includes(key) ||
        value !== original.context.previousRunId ||
        correction.candidateEvidenceRef !== null
      )
        throw Error("Reviewer correction must bind its unique direct Author");
      const parent = await runMaterialLocation(
        target,
        original.context.previousRunId!,
      );
      if (
        parent.record.context.role !== "author" ||
        parent.record.context.lifecycleState !== "terminal" ||
        parent.record.result.authorConclusion !== "PASS"
      )
        throw Error("Correction direct Author unavailable");
      for (const alias of ["reviewedRunId", "reviewedAuthorRunId"])
        if (
          Object.hasOwn(original.result.facts, alias) &&
          original.result.facts[alias] !== parent.record.context.runId
        )
          throw Error("Existing Reviewer binding conflicts");
      if (Object.hasOwn(original.result.facts, "artifactHashes")) {
        const parentView = await correctionFor(
          target,
          parent.record.context.runId,
        );
        if (parentView.correction !== null)
          await validateCorrectionAdditions(
            target,
            parentView.record,
            parentView.correction,
          );
        const parentFacts = {
          ...parentView.record.result.facts,
          ...parentView.correction?.additions,
        };
        if (
          !isDeepStrictEqual(
            original.result.facts.artifactHashes,
            parentFacts.artifactHashes,
          )
        )
          throw Error(
            "Existing Reviewer candidate conflicts with direct Author",
          );
      }
    } else {
      if (
        key !== "artifactHashes" ||
        !["apply", "revise-apply"].includes(
          original.context.actionIdentity.actionId,
        ) ||
        original.result.authorConclusion !== "PASS" ||
        correction.candidateEvidenceRef === null
      )
        throw Error(
          "Author correction requires original candidate manifest proof",
        );
      const refs = original.result.facts.proofRefs;
      if (
        !Array.isArray(refs) ||
        refs.filter(
          (ref) =>
            typeof ref === "object" &&
            ref !== null &&
            !Array.isArray(ref) &&
            ref.path === correction.candidateEvidenceRef,
        ).length !== 1
      )
        throw Error("Candidate manifest was not declared by original Result");
      await checkDeclaredProofs(target, original.context.runId, refs);
      const manifest = parseFoundationCliRequestJson(
        (
          await controlledBytes(
            target.repositoryRoot,
            correction.candidateEvidenceRef,
          )
        ).toString("utf8"),
      ) as { artifactHashes?: unknown };
      if (
        !isDeepStrictEqual(manifest?.artifactHashes, value) ||
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value) ||
        !Object.keys(value).length
      )
        throw Error("Candidate correction differs from original manifest");
    }
  }
}

export async function readEffectiveRun(target: ActionTarget, runId: string) {
  const {
    record: original,
    correction,
    correctionPath,
    group,
  } = await correctionFor(target, runId);
  if (correction === null)
    return {
      original,
      effectiveFacts: original.result.facts,
      correctionRef: null,
    };
  await validateCorrectionAdditions(target, original, correction);
  const effectiveFacts = { ...original.result.facts, ...correction.additions };
  if (correction.role === "author")
    await checkCorrectionConsumer(target, original, effectiveFacts, group);
  return { original, effectiveFacts, correctionRef: correctionPath };
}

export async function checkCorrectionConsumer(
  target: ActionTarget,
  original: DurableRunRecord,
  effectiveFacts: JsonObject,
  group: string,
  requireDeclaredCandidate = false,
) {
  const runId = original.context.runId;
  const directory = path.join(
    target.repositoryRoot,
    ".flowkit/runs",
    target.deliveryId,
    group,
  );
  const children: DurableRunRecord[] = [];
  let preparedChildren = 0;
  for (const id of await readdir(directory)) {
    if (id === runId) continue;
    const childDirectory = path.join(directory, id);
    if (isDeepStrictEqual(await readdir(childDirectory), ["action.md"])) {
      await controlledBytes(
        target.repositoryRoot,
        `.flowkit/runs/${target.deliveryId}/${group}/${id}/action.md`,
      );
      const { descriptor } = await readDescriptor(childDirectory);
      const context = descriptor.preparedContext;
      if (
        descriptor.repositoryRoot !== target.repositoryRoot ||
        descriptor.changeStartSequence !==
          Number(group.slice(0, -(target.changeId.length + 1))) ||
        context.runId !== id ||
        context.lifecycleState !== "prepared" ||
        context.actionIdentity.deliveryId !== target.deliveryId ||
        context.actionIdentity.changeId !== target.changeId ||
        !isDeepStrictEqual(context.occurrence, parseRunOccurrenceId(id)) ||
        !isDeepStrictEqual(
          context.actionIdentity,
          descriptor.actionPackage.actionIdentity,
        )
      )
        throw Error("Correction consumer descriptor identity drift");
      if (context.previousRunId === runId) {
        if (
          context.role !== "reviewer" ||
          context.actionIdentity.actionId !== "review-apply"
        )
          throw Error("Correction direct prepared consumer must be Review");
        preparedChildren++;
      }
      continue;
    }
    const child = await runMaterialLocation(target, id);
    if (child.record.context.previousRunId === runId)
      children.push(child.record);
  }
  if (children.length + preparedChildren > 1)
    throw Error("Correction direct consumer fork");
  for (const child of children) {
    const view = await readEffectiveRun(target, child.context.runId);
    if (
      child.context.role !== "reviewer" ||
      view.effectiveFacts.reviewedRunId !== runId ||
      ((requireDeclaredCandidate ||
        Object.hasOwn(view.effectiveFacts, "artifactHashes")) &&
        !isDeepStrictEqual(
          view.effectiveFacts.artifactHashes,
          effectiveFacts.artifactHashes,
        ))
    )
      throw Error(
        "Correction cannot inherit inconsistent or unproven direct Review",
      );
  }
}

export async function effectiveRecord(
  target: ActionTarget,
  record: DurableRunRecord,
): Promise<DurableRunRecord> {
  const view = await readEffectiveRun(target, record.context.runId);
  const effective = {
    ...view.original,
    result: { ...view.original.result, facts: view.effectiveFacts },
  };
  if (
    !isDeepStrictEqual(record, view.original) &&
    !isDeepStrictEqual(record, effective)
  )
    throw Error("Effective Run input/original drift");
  return effective;
}
