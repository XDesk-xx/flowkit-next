import { execFile } from "node:child_process";
import { lstat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { isOwnerAuthorityFact } from "../domain/authority.js";
import { resolveManagedTool } from "../domain/managed-tool-resolution.js";
import {
  observeOpenSpecActiveChanges,
  observeOpenSpecChangeStatus,
} from "../domain/openspec-observation.js";
import { readCoordinationManifest } from "./trusted-change-coordination.js";
import { writeChangeState } from "../internal/change-coordination-write.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";

const run = promisify(execFile);

export async function activateChange(
  request: Record<string, unknown>,
  installation: ManagerInstallation,
): Promise<Record<string, unknown>> {
  const root = request.repositoryRoot as string;
  const deliveryId = request.deliveryId as string;
  const changeId = request.changeId as string;
  const authority = request.ownerAuthority;
  let effect:
    "none" | "scaffold-unknown" | "scaffold-created" | "coordination-unknown" =
    "none";
  try {
    if (
      !isOwnerAuthorityFact(authority) ||
      authority.decision !== "activate-change" ||
      authority.deliveryId !== deliveryId ||
      authority.changeId !== changeId ||
      authority.scope.length !== 1 ||
      authority.scope[0] !== "explore"
    )
      throw new Error("activation-authority-invalid");
    const manifest = await readCoordinationManifest(root, deliveryId);
    if (manifest.id !== deliveryId)
      throw new Error("delivery-identity-mismatch");
    const selected = manifest.changes.filter(
      (change) => change.id === changeId,
    );
    if (
      selected.length !== 1 ||
      selected[0].state !== "planned" ||
      manifest.changes.some((change) => change.state === "active")
    )
      throw new Error("activation-state-invalid");
    for (const dependency of selected[0].dependsOn) {
      const matching = manifest.changes.filter(
        (change) => change.id === dependency,
      );
      if (matching.length !== 1 || matching[0].state !== "completed")
        throw new Error("activation-dependency-invalid");
    }
    const active = await observeOpenSpecActiveChanges({
      repositoryRoot: root,
      flowkitHome: request.flowkitHome as string,
      installation,
    });
    if (active.changeIds.length !== 0)
      throw new Error("openspec-active-change-conflict");
    const destination = path.join(root, "openspec", "changes", changeId);
    try {
      await lstat(destination);
      throw new Error("openspec-change-collision");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const tool = await resolveManagedTool({
      flowkitHome: request.flowkitHome as string,
      installation,
      toolId: "openspec",
    });
    effect = "scaffold-unknown";
    await run(
      process.execPath,
      [tool.entrypoint, "new", "change", changeId, "--json"],
      { cwd: root, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
    );
    effect = "scaffold-created";
    if (!(await lstat(destination)).isDirectory())
      throw new Error("openspec-scaffold-unconfirmed");
    const observed = await observeOpenSpecChangeStatus({
      repositoryRoot: root,
      flowkitHome: request.flowkitHome as string,
      changeId,
      installation,
    });
    if (observed.changeId !== changeId)
      throw new Error("openspec-scaffold-unconfirmed");
    effect = "coordination-unknown";
    await writeChangeState(
      root,
      deliveryId,
      changeId,
      "planned",
      "active",
      authority,
    );
    const confirmed = await readCoordinationManifest(root, deliveryId);
    if (
      confirmed.changes.filter(
        (change) => change.id === changeId && change.state === "active",
      ).length !== 1 ||
      !confirmed.ownerDecisions.some(
        (value) => isOwnerAuthorityFact(value) && value.ref === authority.ref,
      )
    )
      throw new Error("activation-readback-failed");
    return {
      status: "completed",
      effect: "scaffold-and-coordination",
      deliveryId,
      changeId,
    };
  } catch (error) {
    return {
      status: "incomplete",
      effect,
      reason: error instanceof Error ? error.message : "activation-failed",
      deliveryId,
      changeId,
    };
  }
}
