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
import {
  isRunContextRecord,
  type RunResultRecord,
} from "./run-result-persistence.js";

export type ActionExecutionCallback = (
  actionPackage: ActionPackage,
) => unknown | Promise<unknown>;

export type SingleActionInvocationFailureReason =
  | "entry-rejected"
  | "package-formation-rejected"
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

function establishPreparedCurrentAction(
  currentAction: unknown,
  target: unknown,
): CurrentAction | null {
  if (!isActionIdentity(target)) return null;

  if (currentAction === null) {
    return transitionCurrentAction(currentAction, {
      type: "prepare",
      identity: target,
    });
  }

  if (!isCurrentAction(currentAction)) return null;

  if (
    currentAction.state === "prepared" &&
    sameActionIdentity(currentAction.identity, target)
  ) {
    return currentAction;
  }

  if (currentAction.state === "terminal") {
    return transitionCurrentAction(currentAction, {
      type: "prepare",
      identity: target,
    });
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
  currentAction: unknown,
  target: unknown,
  currentContext: unknown,
  execute: ActionExecutionCallback,
): Promise<SingleActionInvocationOutcome> {
  const prepared = establishPreparedCurrentAction(currentAction, target);
  if (prepared === null) {
    return failure(
      isCurrentAction(currentAction) ? currentAction : null,
      "entry-rejected",
    );
  }

  if (!isRunContextRecord(currentContext)) {
    return failure(prepared, "package-formation-rejected");
  }

  const actionPackage = formActionPackage(prepared, currentContext);
  if (actionPackage === null) {
    return failure(prepared, "package-formation-rejected");
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
