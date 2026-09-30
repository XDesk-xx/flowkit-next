import { isOwnerAuthorityFact } from "../domain/authority.js";
import { readDeliveryFinalization } from "../domain/delivery-finalization.js";
import { isDeliveryCheckpointOperation } from "../domain/delivery-repository-integration-operation.js";
import { runIntegration } from "../domain/git-workflow-integration-host.js";
import {
  snapshotGitHostRequest,
  type GitHostRequest,
} from "../domain/git-workflow-host.js";
import {
  isGitAncestor,
  observeGitHead,
  resolveGitCommit,
} from "../internal/delivery-repository-integration-git.js";
import type { ReadRepositoryIntegrationSource } from "../internal/delivery-repository-integration-source.js";

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function integrateRepository(
  raw: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  let request: GitHostRequest;
  try {
    request = snapshotGitHostRequest(raw.gitRequest as GitHostRequest);
  } catch {
    return {
      status: "incomplete",
      effect: "none",
      reason: "git-request-invalid",
    };
  }
  const authority = raw.ownerAuthority;
  const provided = record(raw.integrationInput);
  const keys = provided ? Object.keys(provided).sort().join() : "";
  if (
    !isOwnerAuthorityFact(authority) ||
    authority.decision !== "authorize-repository-integration" ||
    authority.deliveryId !== raw.deliveryId ||
    authority.changeId !== undefined ||
    authority.scope.length !== 1 ||
    authority.scope[0] !== "delivery-repository-integration" ||
    request.node !== "repository-integration" ||
    request.changeId !== null ||
    request.targetRoot !== raw.repositoryRoot ||
    request.deliveryId !== raw.deliveryId ||
    request.ownerSourceRef !== authority.sourceRef ||
    request.operation.kind === "push" ||
    keys !== "acceptedBaseCommit,checkpointOperation,targetMainRef" ||
    typeof provided?.acceptedBaseCommit !== "string" ||
    !/^[0-9a-f]{40}$/.test(provided.acceptedBaseCommit) ||
    typeof provided.targetMainRef !== "string" ||
    !/^refs\/heads\/[A-Za-z0-9._/-]+$/.test(provided.targetMainRef) ||
    !isDeliveryCheckpointOperation(provided.checkpointOperation) ||
    JSON.stringify(request.operation) !==
      JSON.stringify(provided.checkpointOperation)
  )
    return {
      status: "incomplete",
      effect: "none",
      reason: "integration-input-or-authority-invalid",
    };

  const root = request.targetRoot;
  const deliveryId = request.deliveryId;
  const input = {
    deliveryId,
    ownerAuthority: authority,
    deliveryBranch: request.expectedBranch,
    targetMainRef: provided.targetMainRef,
    acceptedBaseCommit: provided.acceptedBaseCommit,
    checkpointOperation: provided.checkpointOperation,
  };
  const [preIntegrationHead, targetMainPreIntegrationCommit] =
    await Promise.all([
      observeGitHead(root),
      resolveGitCommit(root, input.targetMainRef),
    ]);
  if (!preIntegrationHead || !targetMainPreIntegrationCommit)
    return {
      status: "incomplete",
      effect: "none",
      reason: "integration-git-prestate-unavailable",
    };
  const readOwner = async (sourceRef: string) => {
    if (sourceRef !== authority.sourceRef) return null;
    const final = await readDeliveryFinalization(root, deliveryId);
    return final.status === "completed" ? { request } : null;
  };
  let acceptedFinalCommit: string | null = null;
  const readIntegrationSource: ReadRepositoryIntegrationSource = {
    readAuthorization: async (ownerAuthorityRef) => {
      if (ownerAuthorityRef !== authority.ref)
        throw Error("owner-reference-mismatch");
      return {
        sourceRef: authority.sourceRef,
        ownerAuthorityRef: authority.ref,
        ownerAuthoritySourceRef: authority.sourceRef,
        deliveryId,
        deliveryBranch: input.deliveryBranch,
        targetMainRef: input.targetMainRef,
        targetMainPreIntegrationCommit,
        preIntegrationHead,
        acceptedBaseCommit: input.acceptedBaseCommit,
        checkpointOperation: input.checkpointOperation,
        reuseCheckpointSourceRef:
          input.checkpointOperation.kind === "reuse-existing"
            ? authority.sourceRef
            : null,
      };
    },
    readAcceptance: async (ownerAuthorityRef) => {
      if (ownerAuthorityRef !== authority.ref || acceptedFinalCommit === null)
        throw Error("acceptance-unavailable");
      const acceptedMainCommit = await resolveGitCommit(
        root,
        input.targetMainRef,
      );
      if (
        !acceptedMainCommit ||
        acceptedMainCommit === input.acceptedBaseCommit ||
        !(await isGitAncestor(root, acceptedFinalCommit, acceptedMainCommit))
      )
        throw Error("acceptance-unavailable");
      return {
        sourceRef: `git:${input.targetMainRef}@${acceptedMainCommit}`,
        ownerAuthorityRef: authority.ref,
        deliveryId,
        targetMainRef: input.targetMainRef,
        targetMainPreIntegrationCommit,
        checkpointOperation: input.checkpointOperation,
        finalCommit: acceptedFinalCommit,
        acceptedMainCommit,
      };
    },
  };
  const outcome = await runIntegration(request, {
    input,
    readOwner,
    readIntegrationSource,
    performAcceptance: async ({ finalCommit }) => {
      const current = await resolveGitCommit(root, input.targetMainRef);
      if (
        !current ||
        current === input.acceptedBaseCommit ||
        !(await isGitAncestor(root, finalCommit, current))
      )
        return { status: "manual-acceptance-pending" };
      acceptedFinalCommit = finalCommit;
      return {
        status: "repository-acceptance-complete",
        auditRef: `git:${input.targetMainRef}@${current}`,
      };
    },
  });
  return {
    status: outcome.status === "completed" ? "completed" : "incomplete",
    effect: outcome.effect,
    outcome,
  };
}
