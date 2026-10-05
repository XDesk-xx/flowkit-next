import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { isSemanticId } from "../domain/identity.js";
import { observeOpenSpecActiveChanges } from "../domain/openspec-observation.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import type { ActionTarget } from "./action-request.js";
import {
  readCoordinationManifest,
  resolveTrustedChangeCoordination,
} from "./trusted-change-coordination.js";
import {
  freshDirectoryEntries,
  assertFreshRunMaterials,
} from "./fresh-run-materials.js";

export async function assertFreshFirstExplore(
  target: ActionTarget,
  installation: ManagerInstallation,
  currentRunId?: string,
): Promise<void> {
  const root = target.repositoryRoot;
  if ((await realpath(root)) !== root) throw Error("Noncanonical fresh root");
  for (const relative of [
    ".flowkit",
    "openspec",
    "openspec/changes",
    "openspec/delivery-groups",
  ])
    await freshDirectoryEntries(path.join(root, relative), false);
  const projectFile = path.join(root, ".flowkit/project.json");
  const stat = await lstat(projectFile);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw Error("Invalid fresh project file");
  const project = JSON.parse(await readFile(projectFile, "utf8"));
  if (
    !project ||
    Object.keys(project).sort().join() !==
      "formatVersion,projectId,repository,runtimeFamily,state" ||
    project.formatVersion !== 1 ||
    project.state !== "initialized" ||
    project.runtimeFamily !== "new" ||
    !isSemanticId(project.projectId) ||
    typeof project.repository !== "string" ||
    !project.repository.trim()
  )
    throw Error("Invalid fresh project identity");
  let selected = 0;
  for (const file of await freshDirectoryEntries(
    path.join(root, "openspec/delivery-groups"),
    false,
  )) {
    if (!file.endsWith(".yaml") || !isSemanticId(file.slice(0, -5)))
      throw Error("Unknown coordination entry");
    const fileStat = await lstat(
      path.join(root, "openspec/delivery-groups", file),
    );
    if (!fileStat.isFile() || fileStat.isSymbolicLink())
      throw Error("Invalid coordination file");
    const deliveryId = file.slice(0, -5);
    const manifest = await readCoordinationManifest(root, deliveryId);
    if (
      manifest.id !== deliveryId ||
      new Set(manifest.changes.map((c) => c.id)).size !==
        manifest.changes.length
    )
      throw Error("Coordination identity conflict");
    for (const change of manifest.changes) {
      if (deliveryId === target.deliveryId && change.id === target.changeId) {
        selected++;
        if (change.state !== "active")
          throw Error("Fresh Change is not active");
      } else if (change.state !== "planned")
        throw Error("Prior or competing Change");
    }
  }
  if (
    selected !== 1 ||
    (await resolveTrustedChangeCoordination(target)) !== "active"
  )
    throw Error("Fresh activation provenance missing");
  const active = await observeOpenSpecActiveChanges({
    ...target,
    installation,
  });
  if (active.changeIds.length !== 1 || active.changeIds[0] !== target.changeId)
    throw Error("Competing OpenSpec Change");
  if (
    (await freshDirectoryEntries(path.join(root, "openspec/changes/archive")))
      .length !== 0
  )
    throw Error("Archive history exists");
  await assertFreshRunMaterials(target, installation, currentRunId);
}
