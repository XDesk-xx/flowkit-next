import { isSemanticId } from "../domain/identity.js";
import {
  hasExactlyFields,
  hasNoDuplicates,
  isSafeText,
  isHashRef,
  isPlainRecord,
} from "./applicable-check-identity.js";

export const APPLICABLE_CHECK_FACTS_KEY = "applicableChecks";

export type ApplicableCheckStatus =
  "passed" | "failed" | "process-failed" | "reused-passed";

export interface ApplicableCheckFact {
  readonly checkId: string;
  readonly checkRef: string;
  readonly status: ApplicableCheckStatus;
  readonly exitCode: number | null;
  readonly signal: string | null;
}

export interface ApplicableCheckFactSet {
  readonly executionInputRef: string;
  readonly candidateRef: string;
  readonly checks: readonly ApplicableCheckFact[];
}

const FACT_FIELDS = [
  "checkId",
  "checkRef",
  "status",
  "exitCode",
  "signal",
] as const;
const FACT_SET_FIELDS = [
  "executionInputRef",
  "candidateRef",
  "checks",
] as const;

export function isApplicableCheckStatus(
  value: unknown,
): value is ApplicableCheckStatus {
  return (
    value === "passed" ||
    value === "failed" ||
    value === "process-failed" ||
    value === "reused-passed"
  );
}

function isSignal(value: unknown): value is string | null {
  return value === null || isSafeText(value);
}

export function isApplicableCheckFact(
  value: unknown,
): value is ApplicableCheckFact {
  if (!isPlainRecord(value) || !hasExactlyFields(value, FACT_FIELDS))
    return false;
  if (
    !isSemanticId(value.checkId) ||
    !isHashRef(value.checkRef, "check") ||
    !isApplicableCheckStatus(value.status) ||
    !(
      value.exitCode === null ||
      (typeof value.exitCode === "number" &&
        Number.isSafeInteger(value.exitCode) &&
        value.exitCode >= 0)
    ) ||
    !isSignal(value.signal)
  ) {
    return false;
  }
  if (value.status === "passed")
    return value.exitCode === 0 && value.signal === null;
  if (value.status === "failed") {
    return (
      value.exitCode !== null && value.exitCode !== 0 && value.signal === null
    );
  }
  if (value.status === "reused-passed") {
    return value.exitCode === null && value.signal === null;
  }
  return value.exitCode === null;
}

export function isApplicableCheckFactSet(
  value: unknown,
): value is ApplicableCheckFactSet {
  if (!isPlainRecord(value) || !hasExactlyFields(value, FACT_SET_FIELDS)) {
    return false;
  }
  if (
    !isHashRef(value.executionInputRef, "execution") ||
    !isHashRef(value.candidateRef, "candidate") ||
    !Array.isArray(value.checks) ||
    value.checks.length < 1 ||
    !value.checks.every(isApplicableCheckFact)
  ) {
    return false;
  }
  return hasNoDuplicates(value.checks.map((fact) => fact.checkId));
}
