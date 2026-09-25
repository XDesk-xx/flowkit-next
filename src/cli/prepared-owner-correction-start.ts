import { isDeepStrictEqual } from "node:util";

import { isOwnerAuthorityFact } from "../domain/authority.js";
import { supersedePreparedAction } from "../domain/action-lifecycle.js";
import {
  startCanonicalActionRun,
  type CanonicalStartReadiness,
  type StartedCanonicalActionRun,
} from "../domain/canonical-action-run-start.js";
import type { ActionGuidanceRef } from "../domain/action-guidance-execution.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import {
  formatRunOccurrenceId,
  isRunContextRecord,
  type RunAddressInput,
  type RunContextRecord,
} from "../domain/run-result-persistence.js";
import { resolveActionContext } from "./action-context.js";
import { policyForRecord } from "./current-run-chain.js";

/** Starts one Owner-corrected revise occurrence; the predecessor remains immutable. */
export async function startPreparedOwnerCorrectionRun(
  installation: ManagerInstallation,
  input: RunAddressInput,
  flowkitHome: string,
  ownerAuthority: unknown,
  expectedGuidanceRef: ActionGuidanceRef | null,
  prepare: CanonicalStartReadiness,
): Promise<StartedCanonicalActionRun> {
  if (!isOwnerAuthorityFact(ownerAuthority)) {
    throw new Error("Invalid prepared correction Owner authority");
  }
  const selection = {
    repositoryRoot: input.repositoryRoot,
    flowkitHome,
    deliveryId: input.deliveryId,
    changeId: input.changeId,
  };
  const context = await resolveActionContext(selection, installation);
  const selected = context.selected?.history;
  if (
    context.status !== "current" ||
    context.selected?.changeState !== "active" ||
    selected?.kind !== "canonical" ||
    selected.changeStartSequence !== input.changeStartSequence ||
    selected.current === null
  ) {
    throw new Error("No exact current Run for prepared correction");
  }
  const previous = selected.current;
  const previousContext = previous.context;
  if (
    previousContext.lifecycleState !== "prepared" ||
    previousContext.role !== "author"
  ) {
    throw new Error("Current Run is not a prepared Author Action");
  }
  const target = {
    deliveryId: input.deliveryId,
    changeId: input.changeId,
    actionId: input.occurrence.actionId,
  };
  const correction = {
    requestedAction: target.actionId,
    authority: ownerAuthority,
  };
  const policyInput = {
    deliveryId: input.deliveryId,
    changeId: input.changeId,
    changeState: context.selected.changeState,
    ownerCorrection: correction,
  };
  const boundary = policyForRecord(previous, policyInput);
  if (
    boundary.kind !== "ready-action" ||
    boundary.actionId !== target.actionId
  ) {
    throw new Error(
      `Prepared correction Policy rejected: ${JSON.stringify(boundary)}`,
    );
  }
  const priorAction = {
    identity: previousContext.actionIdentity,
    state: previousContext.lifecycleState,
  };
  const staged = supersedePreparedAction(priorAction, target, boundary);
  if (staged === null) {
    throw new Error("Prepared correction structural transition rejected");
  }
  const preparedContext: RunContextRecord = {
    runId: formatRunOccurrenceId(input.occurrence) ?? "",
    occurrence: input.occurrence,
    actionIdentity: target,
    role: "author",
    lifecycleState: "prepared",
    ownerAuthority,
    previousRunId: previousContext.runId,
  };
  if (!isRunContextRecord(preparedContext)) {
    throw new Error("Invalid prepared correction Run context");
  }
  return startCanonicalActionRun(
    installation,
    input,
    staged,
    preparedContext,
    expectedGuidanceRef,
    async (actionPackage) => {
      if ((await prepare(actionPackage)) !== "ready") return "blocked";
      const latest = await resolveActionContext(selection, installation);
      const current = latest.selected?.history;
      if (
        latest.status !== "current" ||
        latest.selected?.changeState !== "active" ||
        current?.kind !== "canonical" ||
        current.changeStartSequence !== input.changeStartSequence ||
        !isDeepStrictEqual(current.current, previous)
      ) {
        return "blocked";
      }
      return "ready";
    },
  );
}
