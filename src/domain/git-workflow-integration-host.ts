import {
  invokeDeliveryRepositoryIntegrationOperation,
  prepareDeliveryRepositoryIntegrationOperationPackage,
  type DeliveryRepositoryIntegrationPreparationInput,
  type DeliveryRepositoryIntegrationProviderMechanics,
  type ReadRepositoryIntegrationSource,
} from "./delivery-repository-integration-execution.js";
import { sameCheckpointOperation } from "./delivery-repository-integration-operation.js";
import {
  snapshotGitHostRequest,
  verifyGitHostAuthority,
  type GitHostRequest,
  type ReadGitHostAuthority,
} from "./git-workflow-host.js";
import {
  executeScopedCheckpoint,
  gitHostOutcome,
  type GitHostOutcome,
} from "../internal/git-checkpoint-execution.js";

export interface GitIntegrationHostCapabilities {
  readonly input: DeliveryRepositoryIntegrationPreparationInput;
  readonly readOwner: ReadGitHostAuthority;
  readonly readIntegrationSource: ReadRepositoryIntegrationSource;
  readonly performAcceptance?: DeliveryRepositoryIntegrationProviderMechanics;
}

export async function runIntegration(
  input: GitHostRequest,
  host: GitIntegrationHostCapabilities,
): Promise<GitHostOutcome> {
  let checkpoint: GitHostOutcome | undefined;
  try {
    const request = snapshotGitHostRequest(input);
    if (
      request.node !== "repository-integration" ||
      request.deliveryId !== host.input.deliveryId ||
      request.ownerSourceRef !== host.input.ownerAuthority.sourceRef ||
      request.expectedBranch !== host.input.deliveryBranch ||
      !sameCheckpointOperation(
        request.operation,
        host.input.checkpointOperation,
      ) ||
      !(await verifyGitHostAuthority(request, host.readOwner))
    )
      throw Error("Integration 本次输入或独立权限不符");
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      request.targetRoot,
      host.input,
      async ({ operationPackage }) => {
        checkpoint = await executeScopedCheckpoint(
          request.targetRoot,
          request.expectedBranch,
          operationPackage.operationFacts.checkpointOperation,
          async () => {
            if (!(await verifyGitHostAuthority(request, host.readOwner)))
              return false;
            const current =
              await prepareDeliveryRepositoryIntegrationOperationPackage(
                request.targetRoot,
                host.input,
                host.readIntegrationSource,
              );
            return (
              current !== null &&
              JSON.stringify(current) === JSON.stringify(operationPackage)
            );
          },
        );
        return checkpoint.status === "completed"
          ? { status: "committed" }
          : { status: "incomplete" };
      },
      async (context) => {
        if (!(await verifyGitHostAuthority(request, host.readOwner)))
          return { status: "authority-unavailable" };
        return host.performAcceptance
          ? host.performAcceptance(context)
          : { status: "manual-acceptance-pending" };
      },
      host.readIntegrationSource,
    );
    if (outcome.status === "terminal")
      return gitHostOutcome(
        "completed",
        "readback",
        null,
        outcome.record.finalCommit,
        "confirmed",
        [],
      );
    if (checkpoint?.status === "incomplete") return checkpoint;
    return gitHostOutcome(
      "incomplete",
      outcome.gitEffects?.phase ?? "preflight",
      outcome.reason,
      outcome.gitEffects?.checkpointCommit ??
        checkpoint?.observed.checkpointCommit ??
        null,
      outcome.gitEffects?.effect ?? "none",
      outcome.gitEffects?.remaining ?? ["核对 Integration preparation 与权限"],
    );
  } catch (error) {
    return gitHostOutcome(
      "incomplete",
      checkpoint ? "acceptance" : "preflight",
      String(error),
      checkpoint?.observed.checkpointCommit ?? null,
      checkpoint?.effect ?? "none",
      ["核对已有 checkpoint 与人工 acceptance，不自动续跑"],
    );
  }
}
