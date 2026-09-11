import {
  observeGitHead,
  resolveGitCommit,
} from "./delivery-repository-integration-git.js";

export type DeliveryRepositoryIntegrationFailureReason =
  | "package-formation-rejected"
  | "guidance-drift-rejected"
  | "pre-integration-drift-rejected"
  | "final-commit-rejected"
  | "repository-acceptance-rejected"
  | "accepted-main-content-rejected";

export interface DeliveryRepositoryIntegrationFailure {
  readonly status: "failed";
  readonly reason: DeliveryRepositoryIntegrationFailureReason;
  readonly gitEffects?: {
    readonly observedHead: string | null;
    readonly observedTargetMainCommit: string | null;
    readonly phase: "commit" | "acceptance";
    readonly effect: "none" | "confirmed" | "unknown";
    readonly checkpointCommit: string | null;
    readonly remaining: readonly string[];
  };
  readonly record: null;
}

export async function integrationFailure(
  reason: DeliveryRepositoryIntegrationFailureReason,
  mutation?: {
    root: string;
    target: string;
    before: string;
    checkpoint?: string;
    writeAttempted?: boolean;
  },
): Promise<DeliveryRepositoryIntegrationFailure> {
  if (!mutation) return { status: "failed", reason, record: null };
  const head = await observeGitHead(mutation.root);
  const checkpointCommit =
    mutation.checkpoint ?? (head !== mutation.before ? head : null);
  return {
    status: "failed",
    reason,
    record: null,
    gitEffects: {
      observedHead: head,
      phase: reason === "final-commit-rejected" ? "commit" : "acceptance",
      effect:
        mutation.writeAttempted === false
          ? "none"
          : checkpointCommit === null
            ? "unknown"
            : "confirmed",
      checkpointCommit,
      remaining: [
        reason === "final-commit-rejected"
          ? "核对 checkpoint 已有效果与当前权限"
          : "完成并核对真实 repository acceptance",
      ],
      observedTargetMainCommit: await resolveGitCommit(
        mutation.root,
        mutation.target,
      ),
    },
  };
}
