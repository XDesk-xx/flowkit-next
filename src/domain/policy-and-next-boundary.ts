import { isOwnerAuthorityFact, type OwnerAuthorityFact } from "./authority.js";
import {
  isCurrentAction,
  transitionCurrentAction,
  type ActionIdentity,
  type CurrentAction,
} from "./action-lifecycle.js";
import {
  isSemanticId,
  isStandardActionId,
  type ChangeId,
  type DeliveryId,
  type StandardActionId,
} from "./identity.js";
import {
  hasMatchingRunLinkage,
  isRunContextRecord,
  isRunResultRecord,
  type RunContextRecord,
  type RunResultRecord,
} from "./run-result-persistence.js";
import { isChangeState, type ChangeState } from "./state.js";

export const POLICY_BLOCKED_REASONS = [
  "invalid-policy-input",
  "change-not-active",
  "archive-completion-state-mismatch",
  "terminal-result-missing-or-mismatched",
  "unrecognized-or-unsuccessful-author-outcome",
  "unrecognized-reviewer-verdict",
  "reported-boundary-conflict",
  "owner-authority-required",
  "owner-authority-rejected",
  "unsupported-owner-correction",
  "action-boundary-not-enterable",
] as const;

export type PolicyBlockedReason = (typeof POLICY_BLOCKED_REASONS)[number];

export type PolicyDecision =
  | { readonly kind: "ready-action"; readonly actionId: StandardActionId }
  | { readonly kind: "ready-checkpoint-evaluation" }
  | { readonly kind: "blocked"; readonly reason: PolicyBlockedReason };

export interface OwnerCorrectionRequest {
  readonly requestedAction: StandardActionId;
  readonly authority?: unknown;
}

export interface PolicyFacts {
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
  readonly changeState: ChangeState;
  readonly currentAction: CurrentAction | null;
  readonly terminalRunContext: RunContextRecord | null;
  readonly terminalResult: RunResultRecord | null;
  readonly ownerCorrection?: OwnerCorrectionRequest | null;
}

type BlockedDecision = Extract<PolicyDecision, { readonly kind: "blocked" }>;

type ActionBoundary = {
  readonly kind: "action";
  readonly actionId: StandardActionId;
};
type NormalBoundary = ActionBoundary | { readonly kind: "checkpoint" };

type ParsedPolicyFacts = Omit<PolicyFacts, "ownerCorrection"> & {
  readonly ownerCorrection: OwnerCorrectionRequest | null;
};

const POLICY_FIELDS = new Set([
  "deliveryId",
  "changeId",
  "changeState",
  "currentAction",
  "terminalRunContext",
  "terminalResult",
  "ownerCorrection",
]);
const REQUIRED_POLICY_FIELDS = [
  "deliveryId",
  "changeId",
  "changeState",
  "currentAction",
  "terminalRunContext",
  "terminalResult",
] as const;
const OWNER_CORRECTION_FIELDS = new Set(["requestedAction", "authority"]);
const REVISE_ACTIONS = new Set<StandardActionId>([
  "revise-explore",
  "revise-propose",
  "revise-apply",
]);
const AUTHOR_ACTIONS = new Set<StandardActionId>([
  "explore",
  "revise-explore",
  "propose",
  "revise-propose",
  "apply",
  "revise-apply",
  "archive",
]);

function blocked(reason: PolicyBlockedReason): BlockedDecision {
  return { kind: "blocked", reason };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sameActionIdentity(a: ActionIdentity, b: ActionIdentity): boolean {
  return (
    a.deliveryId === b.deliveryId &&
    a.changeId === b.changeId &&
    a.actionId === b.actionId
  );
}

function parseOwnerCorrection(
  value: unknown,
): OwnerCorrectionRequest | null | false {
  if (value === undefined || value === null) return null;
  if (!isPlainRecord(value)) return false;
  if (Object.keys(value).some((key) => !OWNER_CORRECTION_FIELDS.has(key))) {
    return false;
  }
  if (!Object.hasOwn(value, "requestedAction")) return false;
  if (!isStandardActionId(value.requestedAction)) return false;
  return {
    requestedAction: value.requestedAction,
    ...(Object.hasOwn(value, "authority")
      ? { authority: value.authority }
      : {}),
  };
}

function parsePolicyFacts(value: unknown): ParsedPolicyFacts | null {
  if (!isPlainRecord(value)) return null;
  const keys = Object.keys(value);
  if (keys.some((key) => !POLICY_FIELDS.has(key))) return null;
  if (REQUIRED_POLICY_FIELDS.some((key) => !Object.hasOwn(value, key))) {
    return null;
  }
  if (
    !isSemanticId(value.deliveryId) ||
    !isSemanticId(value.changeId) ||
    !isChangeState(value.changeState)
  ) {
    return null;
  }
  if (value.currentAction !== null && !isCurrentAction(value.currentAction)) {
    return null;
  }
  if (
    value.currentAction !== null &&
    (value.currentAction.identity.deliveryId !== value.deliveryId ||
      value.currentAction.identity.changeId !== value.changeId)
  ) {
    return null;
  }
  if (
    value.terminalRunContext !== null &&
    !isRunContextRecord(value.terminalRunContext)
  ) {
    return null;
  }
  if (
    value.terminalResult !== null &&
    !isRunResultRecord(value.terminalResult)
  ) {
    return null;
  }
  const ownerCorrection = parseOwnerCorrection(value.ownerCorrection);
  if (ownerCorrection === false) return null;
  return {
    deliveryId: value.deliveryId,
    changeId: value.changeId,
    changeState: value.changeState,
    currentAction: value.currentAction,
    terminalRunContext: value.terminalRunContext,
    terminalResult: value.terminalResult,
    ownerCorrection,
  };
}

function terminalFactsMatch(
  currentAction: CurrentAction,
  context: RunContextRecord | null,
  result: RunResultRecord | null,
): context is RunContextRecord {
  return (
    context !== null &&
    result !== null &&
    sameActionIdentity(context.actionIdentity, currentAction.identity) &&
    hasMatchingRunLinkage(context, result)
  );
}

function normalBoundaryForTerminal(
  currentAction: CurrentAction,
  result: RunResultRecord,
): ActionBoundary | BlockedDecision {
  const actionId = currentAction.identity.actionId;
  if (AUTHOR_ACTIONS.has(actionId)) {
    if (result.authorConclusion !== "PASS") {
      return blocked("unrecognized-or-unsuccessful-author-outcome");
    }
    switch (actionId) {
      case "explore":
      case "revise-explore":
        return { kind: "action", actionId: "review-explore" };
      case "propose":
      case "revise-propose":
        return { kind: "action", actionId: "review-propose" };
      case "apply":
      case "revise-apply":
        return { kind: "action", actionId: "review-apply" };
      case "archive":
        return blocked("archive-completion-state-mismatch");
    }
  }

  if (
    result.reviewerVerdict !== "approved" &&
    result.reviewerVerdict !== "changes-requested"
  ) {
    return blocked("unrecognized-reviewer-verdict");
  }
  switch (actionId) {
    case "review-explore":
      return {
        kind: "action",
        actionId:
          result.reviewerVerdict === "approved" ? "propose" : "revise-explore",
      };
    case "review-propose":
      return {
        kind: "action",
        actionId:
          result.reviewerVerdict === "approved" ? "apply" : "revise-propose",
      };
    case "review-apply":
      return {
        kind: "action",
        actionId:
          result.reviewerVerdict === "approved" ? "archive" : "revise-apply",
      };
    default:
      return blocked("unrecognized-reviewer-verdict");
  }
}

function reportedToken(boundary: NormalBoundary): string {
  return boundary.kind === "checkpoint" ? "checkpoint" : boundary.actionId;
}

function hasReportedConflict(
  result: RunResultRecord,
  normalBoundary: NormalBoundary,
): boolean {
  return (
    result.nextBoundary !== null &&
    result.nextBoundary !== reportedToken(normalBoundary)
  );
}

function correctionAllowedForStage(
  currentActionId: StandardActionId,
  requestedAction: StandardActionId,
): boolean {
  if (!REVISE_ACTIONS.has(requestedAction)) return false;
  switch (currentActionId) {
    case "explore":
    case "revise-explore":
    case "review-explore":
      return requestedAction === "revise-explore";
    case "propose":
    case "revise-propose":
    case "review-propose":
      return (
        requestedAction === "revise-propose" ||
        requestedAction === "revise-explore"
      );
    case "apply":
    case "revise-apply":
    case "review-apply":
      return true;
    case "archive":
      return false;
  }
}

function correctionAuthorityDecision(
  facts: ParsedPolicyFacts,
  requestedAction: StandardActionId,
  authority: unknown,
): PolicyDecision | null {
  if (authority === undefined || authority === null) {
    return blocked("owner-authority-required");
  }
  if (!isOwnerAuthorityFact(authority)) {
    return blocked("owner-authority-rejected");
  }
  const exactAuthority = authority as OwnerAuthorityFact;
  if (
    exactAuthority.decision !== "revise-action" ||
    exactAuthority.deliveryId !== facts.deliveryId ||
    exactAuthority.changeId !== facts.changeId ||
    exactAuthority.scope.length !== 1 ||
    exactAuthority.scope[0] !== requestedAction
  ) {
    return blocked("owner-authority-rejected");
  }
  return null;
}

function isStructurallyEnterable(
  facts: ParsedPolicyFacts,
  actionId: StandardActionId,
): boolean {
  const identity: ActionIdentity = {
    deliveryId: facts.deliveryId,
    changeId: facts.changeId,
    actionId,
  };
  if (facts.currentAction?.state === "prepared") {
    return sameActionIdentity(facts.currentAction.identity, identity);
  }
  return (
    transitionCurrentAction(facts.currentAction, {
      type: "prepare",
      identity,
    }) !== null
  );
}

function readyAction(
  facts: ParsedPolicyFacts,
  actionId: StandardActionId,
): PolicyDecision {
  return isStructurallyEnterable(facts, actionId)
    ? { kind: "ready-action", actionId }
    : blocked("action-boundary-not-enterable");
}

export function evaluatePolicyAndNextBoundary(input: unknown): PolicyDecision {
  const facts = parsePolicyFacts(input);
  if (facts === null) return blocked("invalid-policy-input");

  const current = facts.currentAction;
  if (
    facts.changeState === "completed" &&
    current?.state === "terminal" &&
    current.identity.actionId === "archive"
  ) {
    if (
      !terminalFactsMatch(
        current,
        facts.terminalRunContext,
        facts.terminalResult,
      )
    ) {
      return blocked("terminal-result-missing-or-mismatched");
    }
    const result = facts.terminalResult;
    if (result === null)
      return blocked("terminal-result-missing-or-mismatched");
    if (result.authorConclusion !== "PASS") {
      return blocked("change-not-active");
    }
    const checkpoint: NormalBoundary = { kind: "checkpoint" };
    if (hasReportedConflict(result, checkpoint)) {
      return blocked("reported-boundary-conflict");
    }
    if (facts.ownerCorrection !== null) {
      return blocked("unsupported-owner-correction");
    }
    return { kind: "ready-checkpoint-evaluation" };
  }

  if (facts.changeState !== "active") return blocked("change-not-active");

  if (current === null) {
    if (facts.terminalRunContext !== null || facts.terminalResult !== null) {
      return blocked("invalid-policy-input");
    }
    if (facts.ownerCorrection !== null) {
      return blocked("unsupported-owner-correction");
    }
    return readyAction(facts, "explore");
  }

  if (current.state === "prepared") {
    if (facts.terminalRunContext !== null || facts.terminalResult !== null) {
      return blocked("invalid-policy-input");
    }
    if (facts.ownerCorrection !== null) {
      return blocked("unsupported-owner-correction");
    }
    return readyAction(facts, current.identity.actionId);
  }

  if (
    !terminalFactsMatch(current, facts.terminalRunContext, facts.terminalResult)
  ) {
    return blocked("terminal-result-missing-or-mismatched");
  }
  const result = facts.terminalResult;
  if (result === null) return blocked("terminal-result-missing-or-mismatched");
  const normal = normalBoundaryForTerminal(current, result);
  if (normal.kind === "blocked") return normal;
  if (hasReportedConflict(result, normal)) {
    return blocked("reported-boundary-conflict");
  }

  let actionId = normal.actionId;
  if (facts.ownerCorrection !== null) {
    const requested = facts.ownerCorrection.requestedAction;
    if (!correctionAllowedForStage(current.identity.actionId, requested)) {
      return blocked("unsupported-owner-correction");
    }
    const authorityFailure = correctionAuthorityDecision(
      facts,
      requested,
      facts.ownerCorrection.authority,
    );
    if (authorityFailure !== null) return authorityFailure;
    actionId = requested;
  }

  return readyAction(facts, actionId);
}
