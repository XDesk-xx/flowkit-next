import {
  isActionIdentity,
  isCurrentAction,
  transitionCurrentAction,
  type ActionIdentity,
  type CurrentAction,
  type CurrentActionSlot,
} from "./action-lifecycle.js";
import {
  admitActionResult,
  formActionPackage,
  type ActionPackage,
} from "./action-package-result-admission.js";
import { resolveActionGuidanceRef } from "./action-guidance-execution.js";
import {
  isRunContextRecord,
  type RunResultRecord,
} from "./run-result-persistence.js";

export type ActionExecutionCallback = (
  actionPackage: ActionPackage,
) => unknown | Promise<unknown>;

export type ActionPreparationOutcome = "ready" | "blocked";

export type ActionPreparationCallback = (
  actionPackage: ActionPackage,
) => ActionPreparationOutcome | Promise<ActionPreparationOutcome>;

export type SingleActionInvocationFailureReason =
  | "entry-rejected"
  | "package-formation-rejected"
  | "preparation-blocked"
  | "execution-failed"
  | "result-admission-rejected"
  | "terminal-transition-rejected";

export interface SingleActionInvocationSuccess {
  readonly status: "terminal";
  readonly currentAction: CurrentAction;
  readonly result: RunResultRecord;
  readonly nextBoundary: string | null;
}

export interface SingleActionInvocationFailure {
  readonly status: "failed";
  readonly currentAction: CurrentActionSlot;
  readonly reason: SingleActionInvocationFailureReason;
  readonly nextBoundary: null;
}

export type SingleActionInvocationOutcome =
  SingleActionInvocationSuccess | SingleActionInvocationFailure;

function sameActionIdentity(a: ActionIdentity, b: ActionIdentity): boolean {
  return (
    a.deliveryId === b.deliveryId &&
    a.changeId === b.changeId &&
    a.actionId === b.actionId
  );
}

function stagePreparedCurrentAction(
  currentAction: unknown,
  target: unknown,
): { readonly prepared: CurrentAction; readonly staged: boolean } | null {
  if (!isActionIdentity(target)) return null;

  if (currentAction === null) {
    const prepared = transitionCurrentAction(currentAction, {
      type: "prepare",
      identity: target,
    });
    return prepared === null ? null : { prepared, staged: true };
  }

  if (!isCurrentAction(currentAction)) return null;

  if (
    currentAction.state === "prepared" &&
    sameActionIdentity(currentAction.identity, target)
  ) {
    return { prepared: currentAction, staged: false };
  }

  if (currentAction.state === "terminal") {
    const prepared = transitionCurrentAction(currentAction, {
      type: "prepare",
      identity: target,
    });
    return prepared === null ? null : { prepared, staged: true };
  }

  return null;
}

function failure(
  currentAction: CurrentActionSlot,
  reason: SingleActionInvocationFailureReason,
): SingleActionInvocationFailure {
  return { status: "failed", currentAction, reason, nextBoundary: null };
}

export async function invokeSingleAction(
  repositoryRoot: unknown,
  currentAction: unknown,
  target: unknown,
  currentContext: unknown,
  execute: ActionExecutionCallback,
  prepare: ActionPreparationCallback = () => "ready",
): Promise<SingleActionInvocationOutcome> {
  const staged = stagePreparedCurrentAction(currentAction, target);
  if (staged === null) {
    return failure(
      isCurrentAction(currentAction) ? currentAction : null,
      "entry-rejected",
    );
  }

  const { prepared } = staged;
  const preInvocationCurrentAction = isCurrentAction(currentAction)
    ? currentAction
    : null;
  const preparationFailureAction = staged.staged
    ? preInvocationCurrentAction
    : prepared;

  if (!isRunContextRecord(currentContext)) {
    return failure(preparationFailureAction, "package-formation-rejected");
  }

  const guidanceRef = await resolveActionGuidanceRef(
    repositoryRoot,
    prepared.identity.actionId,
  );
  if (guidanceRef === null) {
    return failure(preparationFailureAction, "package-formation-rejected");
  }

  const actionPackage = formActionPackage(
    prepared,
    currentContext,
    guidanceRef,
  );
  if (actionPackage === null) {
    return failure(preparationFailureAction, "package-formation-rejected");
  }

  let preparationOutcome: ActionPreparationOutcome;
  try {
    preparationOutcome = await prepare(actionPackage);
  } catch {
    return failure(preparationFailureAction, "preparation-blocked");
  }
  if (preparationOutcome !== "ready") {
    return failure(preparationFailureAction, "preparation-blocked");
  }

  let candidateResult: unknown;
  try {
    candidateResult = await execute(actionPackage);
  } catch {
    return failure(prepared, "execution-failed");
  }

  const admitted = admitActionResult(
    actionPackage,
    prepared,
    currentContext.occurrence,
    candidateResult,
  );
  if (admitted === null) {
    return failure(prepared, "result-admission-rejected");
  }

  const terminal = transitionCurrentAction(prepared, {
    type: "terminal",
    identity: prepared.identity,
  });
  if (terminal === null) {
    return failure(prepared, "terminal-transition-rejected");
  }

  return {
    status: "terminal",
    currentAction: terminal,
    result: admitted,
    nextBoundary: admitted.nextBoundary,
  };
}
