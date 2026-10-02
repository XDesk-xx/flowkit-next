import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { assertManagedEvidenceGitBytes } from "../internal/managed-evidence-git.js";
import {
  proofDirectoryCandidates,
  selectedProofDirectory,
  uniqueRunGroup,
} from "../internal/proof-path-owner.js";
import { parseRunOccurrenceId } from "../domain/run-result-persistence.js";
import type { ActionTarget } from "./action-request.js";

export interface ProofFacts {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly deliveryId: string;
  readonly changeId: string;
  readonly runId: string;
  readonly purpose: string;
}

async function ownProofDirectory(
  target: ActionTarget,
  runId: string,
): Promise<{ root: string; relative: string | null }> {
  if (parseRunOccurrenceId(runId) === null)
    throw new Error("Invalid proof Run locator");
  const root = await realpath(target.repositoryRoot);
  const runRoot = path.join(root, ".flowkit", "runs", target.deliveryId);
  const group = uniqueRunGroup(await readdir(runRoot), target.changeId);
  if (!(await lstat(path.join(runRoot, group, runId))).isDirectory())
    throw new Error("Proof Run is not uniquely present");
  return {
    root,
    relative: await selectedProofDirectory(
      root,
      proofDirectoryCandidates(
        target.deliveryId,
        target.changeId,
        group,
        runId,
      ),
    ),
  };
}

export async function inspectActionProof(
  target: ActionTarget,
  runId: string,
  relative: string,
): Promise<ProofFacts> {
  const { root, relative: selected } = await ownProofDirectory(target, runId);
  const prefix = `${selected}/`;
  if (
    selected === null ||
    !relative.startsWith(prefix) ||
    relative.includes("\\") ||
    relative.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("Proof path is outside exact Run ownership");
  }
  let absolute = root;
  for (const segment of relative.split("/")) {
    absolute = path.join(absolute, segment);
    if ((await lstat(absolute)).isSymbolicLink())
      throw new Error("Linked proof path");
  }
  if (
    (await realpath(absolute)) !== absolute ||
    !(await lstat(absolute)).isFile()
  )
    throw new Error("Proof is not a regular controlled file");
  await assertManagedEvidenceGitBytes(root, relative);
  const content = await readFile(absolute);
  return {
    path: relative,
    bytes: content.length,
    sha256: createHash("sha256").update(content).digest("hex"),
    deliveryId: target.deliveryId,
    changeId: target.changeId,
    runId,
    purpose: "inspection-only",
  };
}

export async function checkDeclaredProofs(
  target: ActionTarget,
  runId: string,
  refs: unknown,
): Promise<void> {
  if (!Array.isArray(refs)) throw new Error("proofRefs must be an array");
  const seen = new Set<string>();
  for (const item of refs) {
    if (typeof item !== "object" || item === null || Array.isArray(item))
      throw new Error("Invalid proof reference");
    const ref = item as Record<string, unknown>;
    if (
      Object.keys(ref).some(
        (key) =>
          ![
            "path",
            "bytes",
            "sha256",
            "deliveryId",
            "changeId",
            "runId",
            "purpose",
          ].includes(key),
      ) ||
      typeof ref.path !== "string" ||
      typeof ref.purpose !== "string" ||
      !ref.purpose.trim() ||
      ref.deliveryId !== target.deliveryId ||
      ref.changeId !== target.changeId ||
      ref.runId !== runId ||
      seen.has(ref.path)
    ) {
      throw new Error("Proof reference ownership or shape mismatch");
    }
    seen.add(ref.path);
    const observed = await inspectActionProof(target, runId, ref.path);
    if (ref.bytes !== observed.bytes || ref.sha256 !== observed.sha256)
      throw new Error("Proof bytes changed");
  }
}

/** Finish checks the new producer's whole directory; later consumers remain selective. */
export async function checkOwnRunProofClosure(
  target: ActionTarget,
  runId: string,
  refs: unknown,
): Promise<void> {
  if (!Array.isArray(refs))
    throw new Error("proofRefs must be an explicit array");
  const { root, relative: relativeRoot } = await ownProofDirectory(
    target,
    runId,
  );
  if (relativeRoot === null) {
    if (refs.length !== 0) throw new Error("Proof directory is absent");
    return;
  }
  const directory = path.join(root, ...relativeRoot.split("/"));
  const prefix = `${relativeRoot}/`;
  const actual = new Set<string>();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink())
      throw new Error(`Unsupported proof entry: ${entry.name}`);
    actual.add(`${prefix}${entry.name}`);
  }
  if (actual.size === 0)
    throw new Error("Empty proof directory is not allowed");
  await checkDeclaredProofs(target, runId, refs);
  if (actual.size !== refs.length || refs.some((ref) => !actual.has(ref.path)))
    throw new Error("Own-Run proof directory and proofRefs differ");
}
