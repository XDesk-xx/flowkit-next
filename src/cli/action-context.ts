import { readdir, realpath } from "node:fs/promises";
import path from "node:path";
import {
  isSemanticId,
  type ChangeId,
  type DeliveryId,
} from "../domain/identity.js";
import {
  observeOpenSpecActiveChanges,
  observeOpenSpecChangeStatus,
} from "../domain/openspec-observation.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import {
  readCoordinationManifest,
  resolveTrustedChangeCoordination,
} from "./trusted-change-coordination.js";
import {
  ActionContextError,
  readSelectedRunChain,
} from "./current-run-chain.js";

export interface ActionContextSelection {
  readonly repositoryRoot: string;
  readonly flowkitHome: string;
  readonly deliveryId?: DeliveryId;
  readonly changeId?: ChangeId;
}

export async function resolveActionContext(
  request: ActionContextSelection,
  installation: ManagerInstallation,
) {
  let repositoryRoot: string;
  try {
    repositoryRoot = await realpath(path.resolve(request.repositoryRoot));
  } catch {
    throw new ActionContextError(
      "context-missing",
      "Target root cannot be resolved",
    );
  }
  const active = await observeOpenSpecActiveChanges({
    ...request,
    repositoryRoot,
    installation,
  });
  const directory = path.join(repositoryRoot, "openspec", "delivery-groups");
  let names: string[];
  if (request.deliveryId !== undefined) {
    names = [`${request.deliveryId}.yaml`];
  } else {
    try {
      names = await readdir(directory);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      names = [];
    }
    names = names.filter((name) => name.endsWith(".yaml"));
  }
  const pairs = [];
  for (const name of names) {
    const deliveryId = name.slice(0, -5);
    if (!isSemanticId(deliveryId))
      throw new ActionContextError(
        "context-inconsistent",
        `Invalid manifest name: ${name}`,
      );
    const manifest = await readCoordinationManifest(repositoryRoot, deliveryId);
    if (manifest.id !== deliveryId)
      throw new ActionContextError(
        "context-inconsistent",
        `Manifest identity mismatch: ${name}`,
      );
    const seen = new Set<string>();
    for (const change of manifest.changes) {
      if (seen.has(change.id))
        throw new ActionContextError(
          "context-inconsistent",
          `Duplicate Change: ${change.id}`,
        );
      seen.add(change.id);
      pairs.push({
        deliveryId,
        changeId: change.id,
        state: change.state,
        ownerDecisions: manifest.ownerDecisions,
      });
    }
  }
  // Only diagnose orphan observations in the explicitly selected scope.
  for (const changeId of active.changeIds) {
    if (request.changeId !== undefined && request.changeId !== changeId)
      continue;
    if (
      request.deliveryId === undefined &&
      !pairs.some((pair) => pair.changeId === changeId)
    ) {
      throw new ActionContextError(
        "context-inconsistent",
        `OpenSpec Change has no coordination: ${changeId}`,
      );
    }
  }
  const selected = pairs.filter((pair) =>
    request.changeId !== undefined
      ? pair.changeId === request.changeId
      : pair.state === "active",
  );
  if (selected.length === 0) {
    if (request.changeId !== undefined)
      throw new ActionContextError(
        "context-missing",
        "Selected Change not found",
      );
    return {
      status: "idle" as const,
      repositoryRoot,
      openSpec: { activeChangeIds: active.changeIds, exactChange: null },
      selected: null,
    };
  }
  if (selected.length !== 1)
    throw new ActionContextError(
      "context-ambiguous",
      "Select one Delivery/Change",
      selected.map(({ deliveryId, changeId }) => ({ deliveryId, changeId })),
    );
  const pair = selected[0];
  const changeState = await resolveTrustedChangeCoordination({
    repositoryRoot,
    ...pair,
  });
  const history = await readSelectedRunChain({ repositoryRoot, ...pair });
  const isOpen = active.changeIds.includes(pair.changeId);
  const exactChange = isOpen
    ? await observeOpenSpecChangeStatus({
        repositoryRoot,
        flowkitHome: request.flowkitHome,
        installation,
        changeId: pair.changeId,
      })
    : null;
  let status:
    | "current"
    | "archived"
    | "waiting-owner"
    | "cancelled"
    | "bootstrap-history";
  if (history.kind === "bootstrap-history") {
    status = "bootstrap-history";
  } else if (changeState === "planned") {
    if (history.current !== null)
      throw new ActionContextError(
        "context-inconsistent",
        "Planned Change has canonical execution history",
      );
    status = "waiting-owner";
  } else if (changeState === "cancelled") {
    status = "cancelled";
  } else if (changeState === "completed") {
    if (
      isOpen ||
      history.current?.context.lifecycleState !== "terminal" ||
      history.current.context.actionIdentity.actionId !== "archive" ||
      history.current.result.authorConclusion !== "PASS"
    ) {
      throw new ActionContextError(
        "context-inconsistent",
        "Completed Change lacks matching archive terminal",
      );
    }
    status = "archived";
  } else {
    if (
      (!isOpen && history.current !== null) ||
      history.current?.context.actionIdentity.actionId === "archive"
    ) {
      throw new ActionContextError(
        "context-inconsistent",
        "Active coordination conflicts with OpenSpec/Run history",
      );
    }
    status = "current";
  }
  return {
    status,
    repositoryRoot,
    openSpec: { activeChangeIds: active.changeIds, exactChange },
    selected: { ...pair, changeState, history },
  };
}
