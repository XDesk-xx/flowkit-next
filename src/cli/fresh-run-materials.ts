import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { isSemanticId } from "../domain/identity.js";
import { parseRunOccurrenceId } from "../domain/run-result-persistence.js";
import { resolveActionGuidanceRef } from "../domain/action-guidance-execution.js";
import { formActionPackage } from "../domain/action-package-result-admission.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { proofDirectoryCandidates } from "../internal/proof-path-owner.js";
import type { ActionTarget } from "./action-request.js";
import { readDescriptor } from "./action-descriptor.js";
import { inspectActionProof } from "./action-proof.js";

// Absence is allowed only for historical material roots, never for a linked or unreadable source.
export async function freshDirectoryEntries(
  directory: string,
  absent = true,
): Promise<string[]> {
  try {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw Error("Invalid material directory");
    return await readdir(directory);
  } catch (error) {
    if (absent && (error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function firstDescriptor(
  target: ActionTarget,
  installation: ManagerInstallation,
  group: string,
  runId: string,
) {
  const directory = path.join(
    target.repositoryRoot,
    ".flowkit/runs",
    target.deliveryId,
    group,
    runId,
  );
  if (
    !isDeepStrictEqual(await freshDirectoryEntries(directory, false), [
      "action.md",
    ])
  )
    throw Error("Fresh continuation has machine or unknown files");
  const stat = await lstat(path.join(directory, "action.md"));
  if (!stat.isFile() || stat.isSymbolicLink())
    throw Error("Invalid first descriptor file");
  const { descriptor } = await readDescriptor(directory);
  const context = descriptor.preparedContext;
  const occurrence = parseRunOccurrenceId(runId);
  const guidance = await resolveActionGuidanceRef(installation, "explore");
  if (
    !occurrence ||
    occurrence.actionId !== "explore" ||
    guidance === null ||
    descriptor.repositoryRoot !== target.repositoryRoot ||
    context.runId !== runId ||
    context.previousRunId !== null ||
    context.ownerAuthority !== null ||
    context.role !== "author" ||
    context.lifecycleState !== "prepared" ||
    context.actionIdentity.deliveryId !== target.deliveryId ||
    context.actionIdentity.changeId !== target.changeId ||
    context.actionIdentity.actionId !== "explore" ||
    !isDeepStrictEqual(context.occurrence, occurrence) ||
    descriptor.changeStartSequence !== occurrence.sequence ||
    group !==
      `${String(occurrence.sequence).padStart(3, "0")}-${target.changeId}` ||
    !isDeepStrictEqual(
      formActionPackage(
        { identity: context.actionIdentity, state: "prepared" },
        context,
        guidance,
      ),
      descriptor.actionPackage,
    )
  )
    throw Error("First descriptor identity/Guidance drift");
}

export async function assertFreshRunMaterials(
  target: ActionTarget,
  installation: ManagerInstallation,
  currentRunId?: string,
) {
  const root = target.repositoryRoot;
  const runs = path.join(root, ".flowkit/runs");
  let currentGroup: string | undefined;
  for (const delivery of await freshDirectoryEntries(runs)) {
    if (!isSemanticId(delivery)) throw Error("Unknown Run delivery");
    for (const group of await freshDirectoryEntries(
      path.join(runs, delivery),
      false,
    )) {
      if (!/^\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(group))
        throw Error("Unknown Run group");
      for (const runId of await freshDirectoryEntries(
        path.join(runs, delivery, group),
        false,
      )) {
        if (
          currentRunId === undefined ||
          delivery !== target.deliveryId ||
          runId !== currentRunId ||
          currentGroup !== undefined
        )
          throw Error("Prior or competing Run occurrence");
        await firstDescriptor(target, installation, group, runId);
        currentGroup = group;
      }
    }
  }
  if (currentRunId !== undefined && currentGroup === undefined)
    throw Error("Current first descriptor missing");
  const artifacts = path.join(root, ".flowkit/artifacts");
  const allowed =
    currentGroup === undefined
      ? []
      : proofDirectoryCandidates(
          target.deliveryId,
          target.changeId,
          currentGroup,
          currentRunId!,
        );
  let proofRoot: string | undefined;
  async function visit(
    directory: string,
    relative: string,
    depth: number,
  ): Promise<void> {
    for (const name of await freshDirectoryEntries(directory)) {
      const child = path.join(directory, name);
      const ref = `${relative}/${name}`;
      const stat = await lstat(child);
      if (stat.isSymbolicLink()) throw Error("Linked Change material");
      if (depth === 1 && name === "full-test") {
        await freshDirectoryEntries(child, false);
        continue;
      }
      const within = allowed.find(
        (prefix) => ref === prefix || ref.startsWith(`${prefix}/`),
      );
      if (within) {
        if (proofRoot !== undefined && proofRoot !== within)
          throw Error("Ambiguous current proof roots");
        proofRoot = within;
        if (stat.isFile()) await inspectActionProof(target, currentRunId!, ref);
        else if (stat.isDirectory()) await visit(child, ref, depth + 1);
        else throw Error("Unknown proof material");
        continue;
      }
      if (!stat.isDirectory()) throw Error("Orphan Change material");
      if (depth === 0 && !isSemanticId(name))
        throw Error("Unknown artifact delivery");
      if (depth === 1 && name !== "changes")
        throw Error("Unknown delivery material");
      if (depth === 2 && !/^(?:\d{3,}-)?[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
        throw Error("Unknown artifact group");
      if (depth === 3 && name !== "proof")
        throw Error("Unknown Change material");
      if (depth >= 4) throw Error("Orphan Run proof");
      await visit(child, ref, depth + 1);
    }
  }
  await visit(artifacts, ".flowkit/artifacts", 0);
}
