import {
  isOwnerAuthorityFact,
  type OwnerAuthorityFact,
} from "../domain/authority.js";
import {
  runCheckpoint,
  runPush,
  snapshotGitHostRequest,
  type GitHostRequest,
  type ReadGitHostAuthority,
} from "../domain/git-workflow-host.js";
import { readCoordinationManifest } from "./trusted-change-coordination.js";
import { resolveActionContext } from "./action-context.js";
import { policyForRecord } from "./current-run-chain.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";

function validAuthority(
  command: "git checkpoint" | "git push",
  request: GitHostRequest,
  authority: unknown,
): authority is OwnerAuthorityFact {
  if (
    !isOwnerAuthorityFact(authority) ||
    authority.deliveryId !== request.deliveryId ||
    authority.changeId !== (request.changeId ?? undefined) ||
    authority.sourceRef !== request.ownerSourceRef
  )
    return false;
  return command === "git checkpoint"
    ? authority.decision === "authorize-checkpoint" &&
        authority.scope.length === 1 &&
        authority.scope[0] === "checkpoint"
    : authority.decision === "authorize-push" &&
        authority.scope.length === 1 &&
        authority.scope[0] === "push";
}

export async function executeOrdinaryGit(
  command: "git checkpoint" | "git push",
  raw: Record<string, unknown>,
  installation: ManagerInstallation,
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
  if (
    request.targetRoot !== raw.repositoryRoot ||
    request.deliveryId !== raw.deliveryId ||
    request.changeId !== (raw.changeId ?? null) ||
    !validAuthority(command, request, authority) ||
    (command === "git checkpoint" &&
      (request.node === "repository-integration" ||
        request.operation.kind === "push")) ||
    (command === "git push" && request.operation.kind !== "push")
  )
    return {
      status: "incomplete",
      effect: "none",
      reason: "git-target-or-authority-mismatch",
    };
  const readOwner: ReadGitHostAuthority = async (sourceRef) => {
    if (
      sourceRef !== authority.sourceRef ||
      !validAuthority(command, request, authority)
    )
      return null;
    const manifest = await readCoordinationManifest(
      request.targetRoot,
      request.deliveryId,
    );
    if (manifest.id !== request.deliveryId) return null;
    if (request.node !== "change-checkpoint") return { request };
    if (!request.changeId) return null;
    const context = await resolveActionContext(
      {
        repositoryRoot: request.targetRoot,
        flowkitHome: raw.flowkitHome as string,
        deliveryId: request.deliveryId,
        changeId: request.changeId,
      },
      installation,
    );
    if (context.selected?.history.kind !== "canonical") return null;
    const selected = context.selected;
    const policyDecision = policyForRecord(selected.history.current, {
      deliveryId: selected.deliveryId,
      changeId: selected.changeId,
      changeState: selected.changeState,
    });
    if (command === "git push")
      return { request, changePolicyDecision: policyDecision };
    return {
      request,
      checkpointAuthorization: {
        policyDecision,
        ownerAuthority: authority,
        deliveryId: selected.deliveryId,
        changeId: selected.changeId,
      },
    };
  };
  const outcome =
    command === "git checkpoint"
      ? await runCheckpoint(request, readOwner)
      : await runPush(request, readOwner);
  return {
    status: outcome.status === "completed" ? "completed" : "incomplete",
    effect: outcome.effect,
    outcome,
  };
}
