import {
  isActionIdentity,
  isCurrentAction,
  transitionCurrentAction,
  retryTerminalArchive,
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
import { isDeepStrictEqual } from "node:util";
import {
  prepareFailedAuthorCorrection,
  evaluatePolicyAndNextBoundary,
  isOrdinaryAuthorFailure,
} from "./policy-and-next-boundary.js";

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
  retryBoundary?: unknown,
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
    const prepared =
      transitionCurrentAction(currentAction, {
        type: "prepare",
        identity: target,
      }) ?? retryTerminalArchive(currentAction, target, retryBoundary);
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
  installation: unknown,
  currentAction: unknown,
  target: unknown,
  currentContext: unknown,
  execute: ActionExecutionCallback,
  prepare: ActionPreparationCallback = () => "ready",
  retryBoundary?: unknown,
  failureSource?: unknown,
): Promise<SingleActionInvocationOutcome> {
  let corrected: CurrentAction | null = null;
  if (failureSource !== undefined) {
    if (
      !failureSource ||
      typeof failureSource !== "object" ||
      Array.isArray(failureSource)
    )
      return failure(
        isCurrentAction(currentAction) ? currentAction : null,
        "entry-rejected",
      );
    const source = failureSource as Record<string, unknown>;
    const keys = [
      "changeState",
      "terminalRunContext",
      "terminalResult",
      "ownerAuthority",
    ];
    const parent = source.terminalRunContext;
    if (
      Object.keys(source).length !== keys.length ||
      !keys.every((k) => Object.hasOwn(source, k)) ||
      source.changeState !== "active" ||
      !isActionIdentity(target) ||
      !isOrdinaryAuthorFailure(parent, source.terminalResult) ||
      !isRunContextRecord(currentContext) ||
      currentContext.lifecycleState !== "prepared" ||
      currentContext.role !== "author" ||
      !sameActionIdentity(currentContext.actionIdentity, target) ||
      currentContext.previousRunId !== parent.runId ||
      currentContext.occurrence.sequence !== parent.occurrence.sequence + 1 ||
      !isDeepStrictEqual(currentContext.ownerAuthority, source.ownerAuthority)
    )
      return failure(
        isCurrentAction(currentAction) ? currentAction : null,
        "entry-rejected",
      );
    const boundary = evaluatePolicyAndNextBoundary({
      deliveryId: target.deliveryId,
      changeId: target.changeId,
      changeState: "active",
      currentAction,
      terminalRunContext: parent,
      terminalResult: source.terminalResult,
      ownerCorrection: {
        requestedAction: target.actionId,
        authority: source.ownerAuthority,
      },
    });
    if (
      boundary.kind !== "ready-action" ||
      boundary.actionId !== target.actionId
    )
      return failure(
        isCurrentAction(currentAction) ? currentAction : null,
        "entry-rejected",
      );
    corrected =
      prepareFailedAuthorCorrection(
        currentAction,
        target,
        parent,
        source.terminalResult,
        source.ownerAuthority,
      ) ??
      transitionCurrentAction(currentAction, {
        type: "prepare",
        identity: target,
      });
    if (corrected === null)
      return failure(
        isCurrentAction(currentAction) ? currentAction : null,
        "entry-rejected",
      );
  }
  const staged = stagePreparedCurrentAction(
    currentAction,
    target,
    retryBoundary,
  );
  const entry =
    corrected === null ? staged : { prepared: corrected, staged: true };
  if (entry === null) {
    return failure(
      isCurrentAction(currentAction) ? currentAction : null,
      "entry-rejected",
    );
  }

  const { prepared } = entry;
  const preInvocationCurrentAction = isCurrentAction(currentAction)
    ? currentAction
    : null;
  const preparationFailureAction = entry.staged
    ? preInvocationCurrentAction
    : prepared;

  if (!isRunContextRecord(currentContext)) {
    return failure(preparationFailureAction, "package-formation-rejected");
  }

  const guidanceRef = await resolveActionGuidanceRef(
    installation,
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
