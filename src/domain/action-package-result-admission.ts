import {
  isActionExecutionRole,
  type ActionExecutionRole,
} from "./authority.js";
import { isCurrentAction, type ActionIdentity } from "./action-lifecycle.js";
import {
  isActionGuidanceRefForAction,
  type ActionGuidanceRef,
} from "./action-guidance-execution.js";
import { isStandardActionId } from "./identity.js";
import {
  formatRunOccurrenceId,
  isRunContextRecord,
  isRunOccurrence,
  isRunResultRecord,
  type RunContextRecord,
  type RunOccurrence,
  type RunResultRecord,
} from "./run-result-persistence.js";

export type ExecutableActionLifecycleState = "prepared";

export interface ActionPackage {
  readonly runId: RunContextRecord["runId"];
  readonly occurrence: RunContextRecord["occurrence"];
  readonly actionIdentity: RunContextRecord["actionIdentity"];
  readonly role: RunContextRecord["role"];
  readonly lifecycleState: ExecutableActionLifecycleState;
  readonly ownerAuthority: RunContextRecord["ownerAuthority"];
  readonly previousRunId: RunContextRecord["previousRunId"];
  readonly guidanceRef: ActionGuidanceRef;
}

const ACTION_PACKAGE_FIELDS = [
  "runId",
  "occurrence",
  "actionIdentity",
  "role",
  "lifecycleState",
  "ownerAuthority",
  "previousRunId",
  "guidanceRef",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function hasExactlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === fields.length &&
    fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
  );
}

function sameActionIdentity(a: ActionIdentity, b: ActionIdentity): boolean {
  return (
    a.deliveryId === b.deliveryId &&
    a.changeId === b.changeId &&
    a.actionId === b.actionId
  );
}

function isExecutableState(
  value: unknown,
): value is ExecutableActionLifecycleState {
  return value === "prepared";
}

export function expectedExecutionRoleForAction(
  actionId: unknown,
): ActionExecutionRole | null {
  if (!isStandardActionId(actionId)) return null;

  switch (actionId) {
    case "review-explore":
    case "review-propose":
    case "review-apply":
      return "reviewer";
    case "explore":
    case "revise-explore":
    case "propose":
    case "revise-propose":
    case "apply":
    case "revise-apply":
    case "archive":
      return "author";
  }
}

function projectRunContext(value: ActionPackage): RunContextRecord {
  return {
    runId: value.runId,
    occurrence: value.occurrence,
    actionIdentity: value.actionIdentity,
    role: value.role,
    lifecycleState: value.lifecycleState,
    ownerAuthority: value.ownerAuthority,
    previousRunId: value.previousRunId,
  };
}

export function isActionPackage(value: unknown): value is ActionPackage {
  if (!isRecord(value) || !hasExactlyFields(value, ACTION_PACKAGE_FIELDS)) {
    return false;
  }

  const candidate = value as unknown as ActionPackage;
  if (!isRunContextRecord(projectRunContext(candidate))) return false;
  if (!isExecutableState(candidate.lifecycleState)) return false;

  const expectedRole = expectedExecutionRoleForAction(
    candidate.actionIdentity.actionId,
  );
  return (
    expectedRole !== null &&
    candidate.role === expectedRole &&
    isActionGuidanceRefForAction(
      candidate.guidanceRef,
      candidate.actionIdentity.actionId,
    )
  );
}

function cloneActionIdentity(identity: ActionIdentity): ActionIdentity {
  return {
    deliveryId: identity.deliveryId,
    changeId: identity.changeId,
    actionId: identity.actionId,
  };
}

function cloneOccurrence(occurrence: RunOccurrence): RunOccurrence {
  return {
    date: occurrence.date,
    sequence: occurrence.sequence,
    actionId: occurrence.actionId,
  };
}

function cloneOwnerAuthority(
  authority: RunContextRecord["ownerAuthority"],
): RunContextRecord["ownerAuthority"] {
  if (authority === null) return null;
  return {
    ref: authority.ref,
    decision: authority.decision,
    deliveryId: authority.deliveryId,
    ...(authority.changeId === undefined
      ? {}
      : { changeId: authority.changeId }),
    sourceRef: authority.sourceRef,
    scope: [...authority.scope],
  };
}

function cloneGuidanceRef(guidanceRef: ActionGuidanceRef): ActionGuidanceRef {
  return {
    path: guidanceRef.path,
    contentSha256: guidanceRef.contentSha256,
  };
}

export function formActionPackage(
  currentAction: unknown,
  currentContext: unknown,
  guidanceRef: unknown,
): ActionPackage | null {
  if (!isCurrentAction(currentAction)) return null;
  if (!isRunContextRecord(currentContext)) return null;
  if (!isExecutableState(currentAction.state)) return null;
  if (currentContext.lifecycleState !== currentAction.state) return null;
  if (
    !sameActionIdentity(currentContext.actionIdentity, currentAction.identity)
  ) {
    return null;
  }

  const expectedRole = expectedExecutionRoleForAction(
    currentAction.identity.actionId,
  );
  if (expectedRole === null || currentContext.role !== expectedRole)
    return null;
  if (
    !isActionGuidanceRefForAction(guidanceRef, currentAction.identity.actionId)
  ) {
    return null;
  }

  const formed: ActionPackage = {
    runId: currentContext.runId,
    occurrence: cloneOccurrence(currentContext.occurrence),
    actionIdentity: cloneActionIdentity(currentContext.actionIdentity),
    role: expectedRole,
    lifecycleState: currentAction.state,
    ownerAuthority: cloneOwnerAuthority(currentContext.ownerAuthority),
    previousRunId: currentContext.previousRunId,
    guidanceRef: cloneGuidanceRef(guidanceRef),
  };

  return isActionPackage(formed) ? formed : null;
}

function outcomeSlotsMatchExecutionRole(
  role: ActionExecutionRole,
  result: RunResultRecord,
): boolean {
  if (!isActionExecutionRole(role)) return false;
  if (result.verificationVerdict !== null) return false;
  if (role === "author") return result.reviewerVerdict === null;
  return result.authorConclusion === null;
}

export function admitActionResult(
  actionPackage: unknown,
  currentAction: unknown,
  currentOccurrence: unknown,
  candidateResult: unknown,
): RunResultRecord | null {
  if (!isActionPackage(actionPackage)) return null;
  if (!isCurrentAction(currentAction)) return null;
  if (!isRunOccurrence(currentOccurrence)) return null;
  if (!isRunResultRecord(candidateResult)) return null;
  if (!isExecutableState(currentAction.state)) return null;

  if (
    !sameActionIdentity(actionPackage.actionIdentity, currentAction.identity)
  ) {
    return null;
  }
  if (actionPackage.lifecycleState !== currentAction.state) return null;

  const currentRunId = formatRunOccurrenceId(currentOccurrence);
  if (currentRunId === null || actionPackage.runId !== currentRunId)
    return null;

  if (candidateResult.runId !== actionPackage.runId) return null;
  if (
    !sameActionIdentity(
      candidateResult.actionIdentity,
      actionPackage.actionIdentity,
    )
  ) {
    return null;
  }

  const expectedRole = expectedExecutionRoleForAction(
    actionPackage.actionIdentity.actionId,
  );
  if (expectedRole === null || actionPackage.role !== expectedRole) return null;
  if (!outcomeSlotsMatchExecutionRole(expectedRole, candidateResult))
    return null;

  return candidateResult;
}
