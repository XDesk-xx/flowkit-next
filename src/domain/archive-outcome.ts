export type ArchiveOutcome =
  | { readonly kind: "completed" }
  | {
      readonly kind: "failed";
      readonly effect: "no-mutation" | "rolled-back";
      readonly retryable: true;
    }
  | {
      readonly kind: "partial";
      readonly effect: "recovery-required";
      readonly retryable: false;
    };

export function isArchiveOutcome(value: unknown): value is ArchiveOutcome {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const item = value as Record<string, unknown>;
  if (item.kind === "completed") return Object.keys(item).join() === "kind";
  if (Object.keys(item).sort().join() !== "effect,kind,retryable") return false;
  return (
    (item.kind === "failed" &&
      (item.effect === "no-mutation" || item.effect === "rolled-back") &&
      item.retryable === true) ||
    (item.kind === "partial" &&
      item.effect === "recovery-required" &&
      item.retryable === false)
  );
}

export function isSafeArchiveFailure(result: {
  readonly actionIdentity: { readonly actionId: string };
  readonly authorConclusion: string | null;
  readonly nextBoundary: string | null;
  readonly facts: Readonly<Record<string, unknown>>;
}): boolean {
  return (
    result.actionIdentity.actionId === "archive" &&
    result.authorConclusion === "FAIL" &&
    result.nextBoundary === null &&
    isArchiveOutcome(result.facts.archiveOutcome) &&
    result.facts.archiveOutcome.kind === "failed"
  );
}
