import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { isSemanticId } from "../domain/identity.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import type { ActionTarget } from "./action-request.js";
import { blocked } from "./action-error.js";
import { assertFreshFirstExplore } from "./fresh-first-explore.js";

export async function readProjectOrdinal(
  target: ActionTarget,
  allowUnassigned = false,
  installation?: ManagerInstallation,
  currentRunId?: string,
): Promise<number> {
  try {
    const manifestRoot = path.join(
      target.repositoryRoot,
      "openspec/delivery-groups",
    );
    const ordinals = new Set<number>();
    let selected: number | null = null;
    let maximum = 0;
    for (const file of await readdir(manifestRoot)) {
      if (!file.endsWith(".yaml")) continue;
      const document = parse(
        await readFile(path.join(manifestRoot, file), "utf8"),
      ) as {
        changes?: { id?: unknown; projectOrdinal?: unknown }[];
      };
      if (!Array.isArray(document?.changes))
        throw Error("Delivery manifest lacks Change entries");
      for (const change of document.changes) {
        if (
          !change ||
          typeof change !== "object" ||
          Array.isArray(change) ||
          !isSemanticId(change.id)
        )
          throw Error("Malformed Change entry");
        const value = change.projectOrdinal;
        if (value === undefined) continue;
        if (
          typeof value !== "number" ||
          !Number.isSafeInteger(value) ||
          value < 1 ||
          ordinals.has(value)
        )
          throw Error("Project ordinal is malformed or duplicated");
        ordinals.add(value);
        maximum = Math.max(maximum, value);
        if (
          file === `${target.deliveryId}.yaml` &&
          change.id === target.changeId
        )
          selected = value;
      }
    }
    if (selected !== null) return selected;
    if (allowUnassigned && maximum > 0) {
      if (!Number.isSafeInteger(maximum + 1))
        throw Error("Project ordinal would overflow");
      return maximum + 1;
    }
    if (allowUnassigned && installation !== undefined) {
      await assertFreshFirstExplore(target, installation, currentRunId);
      return 1;
    }
    throw Error(
      "Exact Change has no assigned project ordinal or durable baseline",
    );
  } catch {
    blocked(
      "project-ordinal-invalid",
      "Project ordinal or first Explore eligibility is invalid",
    );
  }
}
