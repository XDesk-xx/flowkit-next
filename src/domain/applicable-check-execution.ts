import {
  admitActionResult,
  isActionPackage,
  type ActionPackage,
} from "./action-package-result-admission.js";
import { isSemanticId } from "./identity.js";
import {
  isRunResultRecord,
  type JsonObject,
  type RunResultRecord,
} from "./run-result-persistence.js";
import {
  deriveApplicableCheckCandidateRef,
  type CandidateManifestRecord,
} from "../internal/applicable-check-candidate.js";
import {
  canonicalRefs,
  hasExactlyFields,
  hasNoDuplicates,
  hashReference,
  isArgumentArray,
  isSafeText,
  isCanonicalRefSet,
  isHashRef,
  isMaterialRefArray,
  isPlainRecord,
} from "../internal/applicable-check-identity.js";
import {
  APPLICABLE_CHECK_FACTS_KEY,
  isApplicableCheckFactSet,
  isApplicableCheckStatus,
  type ApplicableCheckFact,
  type ApplicableCheckFactSet,
  type ApplicableCheckStatus,
} from "../internal/applicable-check-facts.js";

export {
  APPLICABLE_CHECK_FACTS_KEY,
  isApplicableCheckFact,
  isApplicableCheckFactSet,
} from "../internal/applicable-check-facts.js";
export type {
  ApplicableCheckFact,
  ApplicableCheckFactSet,
  ApplicableCheckStatus,
} from "../internal/applicable-check-facts.js";
import { executeExactApplicableCheckProcess } from "../internal/applicable-check-process.js";

export interface ApplicableCheckDeclaration {
  readonly checkId: string;
  readonly program: string;
  readonly args: readonly string[];
  readonly configRefs: readonly string[];
  readonly toolRefs: readonly string[];
  readonly environmentRefs: readonly string[];
}

export interface ApplicableCheckPlanInput {
  readonly checks: readonly ApplicableCheckDeclaration[];
}

export interface ResolvedApplicableCheck extends ApplicableCheckDeclaration {
  readonly checkRef: string;
}

export interface ApplicableCheckExecutionInput {
  readonly actionPackage: ActionPackage;
  readonly actionPackageRef: string;
  readonly candidateRef: string;
  readonly checks: readonly ResolvedApplicableCheck[];
  readonly executionInputRef: string;
}

export interface ApplicableCheckPriorFact {
  readonly candidateRef: string;
  readonly checkId: string;
  readonly checkRef: string;
  readonly status: ApplicableCheckStatus;
}

const DECLARATION_FIELDS = [
  "checkId",
  "program",
  "args",
  "configRefs",
  "toolRefs",
  "environmentRefs",
] as const;

const RESOLVED_CHECK_FIELDS = [...DECLARATION_FIELDS, "checkRef"] as const;
const PLAN_FIELDS = ["checks"] as const;
const EXECUTION_INPUT_FIELDS = [
  "actionPackage",
  "actionPackageRef",
  "candidateRef",
  "checks",
  "executionInputRef",
] as const;
const PRIOR_FACT_FIELDS = [
  "candidateRef",
  "checkId",
  "checkRef",
  "status",
] as const;

export function isApplicableCheckDeclaration(
  value: unknown,
): value is ApplicableCheckDeclaration {
  if (!isPlainRecord(value) || !hasExactlyFields(value, DECLARATION_FIELDS)) {
    return false;
  }
  return (
    isSemanticId(value.checkId) &&
    isSafeText(value.program) &&
    isArgumentArray(value.args) &&
    isMaterialRefArray(value.configRefs) &&
    isMaterialRefArray(value.toolRefs) &&
    isMaterialRefArray(value.environmentRefs)
  );
}

export function isApplicableCheckPlanInput(
  value: unknown,
): value is ApplicableCheckPlanInput {
  if (!isPlainRecord(value) || !hasExactlyFields(value, PLAN_FIELDS))
    return false;
  if (!Array.isArray(value.checks) || value.checks.length < 1) return false;
  if (!value.checks.every(isApplicableCheckDeclaration)) return false;
  const checkIds = value.checks.map((check) => check.checkId);
  return hasNoDuplicates(checkIds);
}

function canonicalDeclaration(
  declaration: ApplicableCheckDeclaration,
): ApplicableCheckDeclaration {
  return {
    checkId: declaration.checkId,
    program: declaration.program,
    args: [...declaration.args],
    configRefs: canonicalRefs(declaration.configRefs),
    toolRefs: canonicalRefs(declaration.toolRefs),
    environmentRefs: canonicalRefs(declaration.environmentRefs),
  };
}

export function deriveApplicableCheckRef(declaration: unknown): string | null {
  if (!isApplicableCheckDeclaration(declaration)) return null;
  const canonical = canonicalDeclaration(declaration);
  return hashReference("check", "flowkit-applicable-check", canonical);
}

export function isResolvedApplicableCheck(
  value: unknown,
): value is ResolvedApplicableCheck {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, RESOLVED_CHECK_FIELDS)
  ) {
    return false;
  }
  if (
    !isSemanticId(value.checkId) ||
    !isSafeText(value.program) ||
    !isArgumentArray(value.args) ||
    !isMaterialRefArray(value.configRefs) ||
    !isMaterialRefArray(value.toolRefs) ||
    !isMaterialRefArray(value.environmentRefs) ||
    !isHashRef(value.checkRef, "check")
  ) {
    return false;
  }
  if (
    !isCanonicalRefSet(value.configRefs) ||
    !isCanonicalRefSet(value.toolRefs) ||
    !isCanonicalRefSet(value.environmentRefs)
  ) {
    return false;
  }
  return (
    deriveApplicableCheckRef({
      checkId: value.checkId,
      program: value.program,
      args: value.args,
      configRefs: value.configRefs,
      toolRefs: value.toolRefs,
      environmentRefs: value.environmentRefs,
    }) === value.checkRef
  );
}

function cloneActionPackage(actionPackage: ActionPackage): ActionPackage {
  return {
    runId: actionPackage.runId,
    occurrence: {
      date: actionPackage.occurrence.date,
      sequence: actionPackage.occurrence.sequence,
      actionId: actionPackage.occurrence.actionId,
    },
    actionIdentity: {
      deliveryId: actionPackage.actionIdentity.deliveryId,
      changeId: actionPackage.actionIdentity.changeId,
      actionId: actionPackage.actionIdentity.actionId,
    },
    role: actionPackage.role,
    lifecycleState: actionPackage.lifecycleState,
    ownerAuthority:
      actionPackage.ownerAuthority === null
        ? null
        : {
            ref: actionPackage.ownerAuthority.ref,
            decision: actionPackage.ownerAuthority.decision,
            deliveryId: actionPackage.ownerAuthority.deliveryId,
            ...(actionPackage.ownerAuthority.changeId === undefined
              ? {}
              : { changeId: actionPackage.ownerAuthority.changeId }),
            sourceRef: actionPackage.ownerAuthority.sourceRef,
            scope: [...actionPackage.ownerAuthority.scope],
          },
    previousRunId: actionPackage.previousRunId,
  };
}

export function deriveActionPackageRef(actionPackage: unknown): string | null {
  if (!isActionPackage(actionPackage)) return null;
  return hashReference(
    "action-package",
    "flowkit-action-package",
    cloneActionPackage(actionPackage),
  );
}

function resolveChecks(
  plan: ApplicableCheckPlanInput,
): readonly ResolvedApplicableCheck[] | null {
  const resolved: ResolvedApplicableCheck[] = [];
  const checkRefs = new Set<string>();

  for (const declaration of plan.checks) {
    const canonical = canonicalDeclaration(declaration);
    const checkRef = deriveApplicableCheckRef(canonical);
    if (checkRef === null || checkRefs.has(checkRef)) return null;
    checkRefs.add(checkRef);
    resolved.push({ ...canonical, checkRef });
  }

  resolved.sort((left, right) => {
    const byId = left.checkId.localeCompare(right.checkId);
    return byId !== 0 ? byId : left.checkRef.localeCompare(right.checkRef);
  });
  return resolved;
}

function executionHashMaterial(
  actionPackageRef: string,
  candidateRef: string,
  checks: readonly ResolvedApplicableCheck[],
): unknown {
  return {
    actionPackageRef,
    candidateRef,
    checks: checks.map((check) => ({
      checkId: check.checkId,
      program: check.program,
      args: [...check.args],
      configRefs: [...check.configRefs],
      toolRefs: [...check.toolRefs],
      environmentRefs: [...check.environmentRefs],
      checkRef: check.checkRef,
    })),
  };
}

export function isApplicableCheckExecutionInput(
  value: unknown,
): value is ApplicableCheckExecutionInput {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, EXECUTION_INPUT_FIELDS)
  ) {
    return false;
  }
  if (
    !isActionPackage(value.actionPackage) ||
    !isHashRef(value.actionPackageRef, "action-package") ||
    !isHashRef(value.candidateRef, "candidate") ||
    !Array.isArray(value.checks) ||
    value.checks.length < 1 ||
    !value.checks.every(isResolvedApplicableCheck) ||
    !isHashRef(value.executionInputRef, "execution")
  ) {
    return false;
  }
  const actionPackageRef = deriveActionPackageRef(value.actionPackage);
  if (actionPackageRef !== value.actionPackageRef) return false;
  const checkIds = value.checks.map((check) => check.checkId);
  const checkRefs = value.checks.map((check) => check.checkRef);
  if (!hasNoDuplicates(checkIds) || !hasNoDuplicates(checkRefs)) return false;
  for (let index = 1; index < value.checks.length; index += 1) {
    const previous = value.checks[index - 1];
    const current = value.checks[index];
    if (
      previous.checkId.localeCompare(current.checkId) > 0 ||
      (previous.checkId === current.checkId &&
        previous.checkRef.localeCompare(current.checkRef) >= 0)
    ) {
      return false;
    }
  }
  const expectedRef = hashReference(
    "execution",
    "flowkit-applicable-check-execution",
    executionHashMaterial(
      value.actionPackageRef,
      value.candidateRef,
      value.checks,
    ),
  );
  return expectedRef === value.executionInputRef;
}

export async function resolveApplicableCheckExecutionInput(
  repositoryRoot: string,
  actionPackage: unknown,
  plan: unknown,
): Promise<ApplicableCheckExecutionInput | null> {
  if (!isActionPackage(actionPackage) || !isApplicableCheckPlanInput(plan)) {
    return null;
  }
  const actionPackageRef = deriveActionPackageRef(actionPackage);
  const candidateRef = await deriveApplicableCheckCandidateRef(repositoryRoot);
  const checks = resolveChecks(plan);
  if (actionPackageRef === null || candidateRef === null || checks === null) {
    return null;
  }
  const executionInputRef = hashReference(
    "execution",
    "flowkit-applicable-check-execution",
    executionHashMaterial(actionPackageRef, candidateRef, checks),
  );
  const resolved: ApplicableCheckExecutionInput = {
    actionPackage: cloneActionPackage(actionPackage),
    actionPackageRef,
    candidateRef,
    checks,
    executionInputRef,
  };
  return isApplicableCheckExecutionInput(resolved) ? resolved : null;
}

export function isApplicableCheckPriorFact(
  value: unknown,
): value is ApplicableCheckPriorFact {
  if (!isPlainRecord(value) || !hasExactlyFields(value, PRIOR_FACT_FIELDS)) {
    return false;
  }
  return (
    isHashRef(value.candidateRef, "candidate") &&
    isSemanticId(value.checkId) &&
    isHashRef(value.checkRef, "check") &&
    isApplicableCheckStatus(value.status)
  );
}

export function isApplicableCheckReuseEligible(
  currentCandidateRef: string,
  currentCheck: ResolvedApplicableCheck,
  prior: unknown,
): boolean {
  return (
    isHashRef(currentCandidateRef, "candidate") &&
    isResolvedApplicableCheck(currentCheck) &&
    isApplicableCheckPriorFact(prior) &&
    prior.status === "passed" &&
    prior.candidateRef === currentCandidateRef &&
    prior.checkId === currentCheck.checkId &&
    prior.checkRef === currentCheck.checkRef
  );
}

async function executeOneCheck(
  repositoryRoot: string,
  check: ResolvedApplicableCheck,
): Promise<ApplicableCheckFact> {
  const outcome = await executeExactApplicableCheckProcess(
    repositoryRoot,
    check.program,
    check.args,
  );
  return {
    checkId: check.checkId,
    checkRef: check.checkRef,
    status: outcome.status,
    exitCode: outcome.exitCode,
    signal: outcome.signal,
  };
}

export async function executeApplicableChecks(
  repositoryRoot: string,
  executionInput: unknown,
  priorFacts: readonly unknown[] = [],
): Promise<ApplicableCheckFactSet | null> {
  if (!isApplicableCheckExecutionInput(executionInput)) return null;
  const priorById = new Map<string, ApplicableCheckPriorFact>();
  const declaredIds = new Set(
    executionInput.checks.map((check) => check.checkId),
  );
  for (const prior of priorFacts) {
    if (!isApplicableCheckPriorFact(prior)) return null;
    if (!declaredIds.has(prior.checkId) || priorById.has(prior.checkId)) {
      return null;
    }
    priorById.set(prior.checkId, prior);
  }

  const facts: ApplicableCheckFact[] = [];
  for (const check of executionInput.checks) {
    const prior = priorById.get(check.checkId);
    if (
      prior !== undefined &&
      isApplicableCheckReuseEligible(executionInput.candidateRef, check, prior)
    ) {
      facts.push({
        checkId: check.checkId,
        checkRef: check.checkRef,
        status: "reused-passed",
        exitCode: null,
        signal: null,
      });
      continue;
    }
    facts.push(await executeOneCheck(repositoryRoot, check));
  }

  const factSet: ApplicableCheckFactSet = {
    executionInputRef: executionInput.executionInputRef,
    candidateRef: executionInput.candidateRef,
    checks: facts,
  };
  return isApplicableCheckFactSet(factSet) ? factSet : null;
}

function cloneFactSet(factSet: ApplicableCheckFactSet): ApplicableCheckFactSet {
  return {
    executionInputRef: factSet.executionInputRef,
    candidateRef: factSet.candidateRef,
    checks: factSet.checks.map((fact) => ({ ...fact })),
  };
}

export function attachApplicableCheckFacts(
  result: unknown,
  factSet: unknown,
): RunResultRecord | null {
  if (!isRunResultRecord(result) || !isApplicableCheckFactSet(factSet)) {
    return null;
  }
  if (Object.hasOwn(result.facts, APPLICABLE_CHECK_FACTS_KEY)) return null;
  const facts: JsonObject = {
    ...result.facts,
    [APPLICABLE_CHECK_FACTS_KEY]: cloneFactSet(
      factSet,
    ) as unknown as JsonObject,
  };
  const next: RunResultRecord = { ...result, facts };
  return isRunResultRecord(next) ? next : null;
}

export function readApplicableCheckFacts(
  result: unknown,
): ApplicableCheckFactSet | null {
  if (!isRunResultRecord(result)) return null;
  const value = result.facts[APPLICABLE_CHECK_FACTS_KEY];
  return isApplicableCheckFactSet(value) ? value : null;
}

function factSetMatchesExecutionInput(
  factSet: ApplicableCheckFactSet,
  executionInput: ApplicableCheckExecutionInput,
): boolean {
  if (
    factSet.executionInputRef !== executionInput.executionInputRef ||
    factSet.candidateRef !== executionInput.candidateRef ||
    factSet.checks.length !== executionInput.checks.length
  ) {
    return false;
  }
  const factsById = new Map(factSet.checks.map((fact) => [fact.checkId, fact]));
  if (factsById.size !== factSet.checks.length) return false;
  for (const check of executionInput.checks) {
    const fact = factsById.get(check.checkId);
    if (fact === undefined || fact.checkRef !== check.checkRef) return false;
  }
  return true;
}

export async function admitApplicableCheckActionResult(
  repositoryRoot: string,
  executionInput: unknown,
  actionPackage: unknown,
  currentAction: unknown,
  currentOccurrence: unknown,
  candidateResult: unknown,
): Promise<RunResultRecord | null> {
  if (!isApplicableCheckExecutionInput(executionInput)) return null;
  if (!isActionPackage(actionPackage)) return null;
  const actionPackageRef = deriveActionPackageRef(actionPackage);
  if (actionPackageRef !== executionInput.actionPackageRef) return null;

  const admitted = admitActionResult(
    actionPackage,
    currentAction,
    currentOccurrence,
    candidateResult,
  );
  if (admitted === null) return null;

  const currentCandidateRef =
    await deriveApplicableCheckCandidateRef(repositoryRoot);
  if (
    currentCandidateRef === null ||
    currentCandidateRef !== executionInput.candidateRef
  ) {
    return null;
  }

  const factSet = readApplicableCheckFacts(admitted);
  if (
    factSet === null ||
    !factSetMatchesExecutionInput(factSet, executionInput)
  ) {
    return null;
  }
  return admitted;
}

export type { CandidateManifestRecord };
export { deriveApplicableCheckCandidateRef };
