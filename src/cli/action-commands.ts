import { finishAction as finish } from "./action-finish.js";
import { readdir } from "node:fs/promises";

import { isDeepStrictEqual } from "node:util";
import { isOwnerAuthorityFact } from "../domain/authority.js";
import {
  supersedePreparedAction,
  transitionCurrentAction,
  retryTerminalArchive,
} from "../domain/action-lifecycle.js";
import { expectedExecutionRoleForAction } from "../domain/action-package-result-admission.js";
import { resolveActionGuidanceRef } from "../domain/action-guidance-execution.js";
import { startCanonicalActionRun } from "../domain/canonical-action-run-start.js";
import {
  buildRunAddress,
  formatRunOccurrenceId,
  isRunContextRecord,
  type RunAddressInput,
  type RunContextRecord,
} from "../domain/run-result-persistence.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { resolveActionContext } from "./action-context.js";

import { inspectActionProof } from "./action-proof.js";
import type { ActionCommandRequest, StartRequest } from "./action-request.js";
import { ActionCommandError, blocked } from "./action-error.js";

import { packageReadiness } from "./action-readiness.js";
import {
  ActionContextError,
  deliveryRunOccupancy,
  nextActionRunSequence,
  policyForRecord,
} from "./current-run-chain.js";

import { correctAction } from "./action-correct.js";

import { inspectAction } from "./action-inspect.js";

function address(input: RunAddressInput): string {
  const built = buildRunAddress(input);
  if (built === null)
    blocked("invalid-run-address", "Invalid controlled Run address");
  return built.runDirectory;
}
async function start(request: StartRequest, installation: ManagerInstallation) {
  if (request.role !== expectedExecutionRoleForAction(request.actionId))
    blocked("role-mismatch", "Role does not match Action");
  const selection = await resolveActionContext(request, installation);
  const selected = selection.selected;
  if (
    selection.status !== "current" ||
    selected?.history.kind !== "canonical" ||
    selected.changeState !== "active"
  )
    blocked("target-not-current", "Exact active canonical Change required");
  const history = selected.history;
  const previous = history.current;
  const correction =
    request.ownerAuthority === undefined
      ? undefined
      : {
          requestedAction: request.actionId,
          authority: request.ownerAuthority,
        };
  if (
    request.ownerAuthority !== undefined &&
    (!isOwnerAuthorityFact(request.ownerAuthority) ||
      previous === null ||
      (previous.context.lifecycleState === "prepared" &&
        previous.context.role !== "author"))
  )
    blocked(
      "owner-correction-invalid",
      "Exact legal prepared Author or terminal Owner correction required",
    );
  const policy = policyForRecord(previous, {
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeState: selected.changeState,
    ...(correction === undefined ? {} : { ownerCorrection: correction }),
  });
  if (policy.kind !== "ready-action" || policy.actionId !== request.actionId)
    blocked("policy-boundary-mismatch", JSON.stringify(policy));
  if (
    previous?.context.lifecycleState === "prepared" &&
    correction === undefined
  )
    blocked(
      "prepared-run-current",
      "An existing prepared Run cannot be started again",
    );
  const nextSequence = await nextActionRunSequence(request, previous);
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const occurrence = {
    date,
    sequence: nextSequence,
    actionId: request.actionId,
  };
  const runId = formatRunOccurrenceId(occurrence);
  if (runId === null)
    blocked("run-sequence-exhausted", "No valid next Run occurrence");
  const identity = {
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    actionId: request.actionId,
  };
  const previousAction =
    previous === null
      ? null
      : {
          identity: previous.context.actionIdentity,
          state: previous.context.lifecycleState,
        };
  const current =
    correction === undefined || previousAction?.state !== "prepared"
      ? (transitionCurrentAction(previousAction, {
          type: "prepare",
          identity,
        }) ?? retryTerminalArchive(previousAction, identity, policy))
      : supersedePreparedAction(previousAction, identity, policy);
  if (current === null)
    blocked("action-transition-invalid", "Cannot prepare exact Action", runId);
  const preparedContext: RunContextRecord = {
    runId,
    occurrence,
    actionIdentity: identity,
    role: request.role,
    lifecycleState: "prepared",
    ownerAuthority: request.ownerAuthority ?? null,
    previousRunId: previous?.context.runId ?? null,
  };
  if (!isRunContextRecord(preparedContext))
    blocked("prepared-context-invalid", "Invalid prepared context", runId);
  const input = {
    repositoryRoot: selection.repositoryRoot,
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeStartSequence: previous ? history.changeStartSequence : nextSequence,
    occurrence,
  };
  const guidance = await resolveActionGuidanceRef(
    installation,
    request.actionId,
  );
  if (guidance === null)
    blocked(
      "guidance-unavailable",
      "Current manager Guidance unavailable",
      runId,
    );
  let held: Awaited<ReturnType<typeof startCanonicalActionRun>>;
  try {
    held = await startCanonicalActionRun(
      installation,
      input,
      current,
      preparedContext,
      guidance,
      async (actionPackage) => {
        if (
          actionPackage.runId !== runId ||
          !isDeepStrictEqual(
            actionPackage.ownerAuthority,
            preparedContext.ownerAuthority,
          )
        )
          return "blocked";
        await packageReadiness(request, runId, previous, installation);
        const latest = await resolveActionContext(request, installation);
        return latest.selected?.history.kind === "canonical" &&
          isDeepStrictEqual(latest.selected.history.current, previous)
          ? "ready"
          : "blocked";
      },
      request.actionId === "archive" ? { archiveContractVersion: 2 } : true,
    );
  } catch (error) {
    if (error instanceof ActionCommandError) throw error;
    const directory = address(input);
    const entries = await readdir(directory).catch((failure) => {
      if (failure.code === "ENOENT") return null;
      throw failure;
    });
    throw new ActionCommandError(
      "start-unconfirmed",
      entries === null ? "not-written" : "written-unconfirmed",
      runId,
      error instanceof Error ? error.message : "Action start failed",
    );
  }
  return {
    kind: "action-start",
    effect: "started",
    runId,
    directory: held.directory,
    actionId: request.actionId,
    role: request.role,
    warnings: (await deliveryRunOccupancy(request)).warnings,
  };
}
export async function executeActionCommand(
  input: ActionCommandRequest,
  installation: ManagerInstallation,
) {
  try {
    if (input.command === "action start")
      return await start(input.request, installation);
    if (input.command === "action finish")
      return await finish(input.request, installation);
    if (input.command === "action correct")
      return await correctAction(input.request, installation);
    if (input.command === "action inspect")
      return await inspectAction(input.request, installation);
    const facts = await inspectActionProof(
      input.request,
      input.request.runId,
      input.request.path,
    );
    return { kind: "proof-inspect", effect: "confirmed", ...facts };
  } catch (error) {
    if (error instanceof ActionCommandError) throw error;
    if (error instanceof ActionContextError)
      throw new ActionCommandError(
        error.kind,
        "incomplete",
        input.command === "action start" ? null : input.request.runId,
        error.message,
      );
    if (input.command === "action correct")
      blocked(
        "correction-invalid",
        error instanceof Error ? error.message : "Correction failed",
        input.request.runId,
      );
    if (input.command !== "proof inspect") throw error;
    blocked(
      "proof-invalid",
      error instanceof Error ? error.message : "Proof inspection failed",
      input.request.runId,
    );
  }
}
