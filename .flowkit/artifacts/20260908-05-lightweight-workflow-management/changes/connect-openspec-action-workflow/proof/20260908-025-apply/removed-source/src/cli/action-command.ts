import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  isOwnerAuthorityFact,
  type OwnerAuthorityFact,
} from "../domain/authority.js";
import { expectedExecutionRoleForAction } from "../domain/action-package-result-admission.js";
import { invokeSingleAction } from "../domain/single-action-execution.js";
import { observeOpenSpecActiveChanges } from "../domain/openspec-observation.js";
import {
  formatRunOccurrenceId,
  isRunResultRecord,
  type RunContextRecord,
  type RunResultRecord,
} from "../domain/run-result-persistence.js";
import {
  reserveActionRun,
  ActionRunPersistenceError,
} from "../internal/action-run-reservation.js";
import { proofRoot, validateActionProof } from "../internal/action-proof.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { resolveActionContext } from "./action-context.js";
import { policyForRecord } from "./current-run-chain.js";
import { resolveTrustedChangeCoordination } from "./trusted-change-coordination.js";
import type { ActionRequest } from "./request.js";
import type { ActionTransport } from "./action-protocol.js";

type Stage =
  | "context"
  | "preparation"
  | "reservation"
  | "execution"
  | "evidence"
  | "admission"
  | "persistence";
class ActionInvocationError extends Error {
  constructor(readonly kind: string) {
    super(kind);
  }
}
function reject(kind: string): never {
  throw new ActionInvocationError(kind);
}
function ownerAuthority(request: ActionRequest): OwnerAuthorityFact | null {
  const correction = request.ownerCorrection as
    { authority?: unknown } | null | undefined;
  const authority = request.ownerAuthority ?? correction?.authority ?? null;
  if (authority !== null && !isOwnerAuthorityFact(authority))
    reject("invalid-owner-authority");
  if (
    request.ownerAuthority !== undefined &&
    correction?.authority !== undefined &&
    !isDeepStrictEqual(request.ownerAuthority, correction.authority)
  )
    reject("owner-authority-conflict");
  // Ordinary actions do not invent or consume a new approval.
  if (authority !== null && correction == null)
    reject("unexpected-owner-authority");
  return authority;
}

export async function executeActionCommand(
  request: ActionRequest,
  installation: ManagerInstallation,
  transport: ActionTransport,
): Promise<number> {
  let stage: Stage = "context";
  let runId: string | null = null;
  let reservation: Awaited<ReturnType<typeof reserveActionRun>> | null = null;
  let prepared: RunContextRecord | null = null;
  let dispatched = false;
  let failureRecorded = false;
  let terminalSaved = false;
  try {
    const context = await resolveActionContext(request, installation);
    const selected = context.selected;
    if (
      context.status !== "current" ||
      !selected ||
      selected.history.kind !== "canonical"
    )
      reject("context-not-executable");
    const { history, deliveryId, changeId, changeState } = selected;
    const policy = policyForRecord(history.current, {
      deliveryId,
      changeId,
      changeState,
      ...(Object.hasOwn(request, "ownerCorrection")
        ? { ownerCorrection: request.ownerCorrection }
        : {}),
    });
    if (policy.kind !== "ready-action" || policy.actionId !== request.actionId)
      reject("illegal-action-boundary");
    if (expectedExecutionRoleForAction(request.actionId) !== request.role)
      reject("wrong-action-role");
    const authority = ownerAuthority(request);
    const occurrence = {
      date: new Date().toISOString().slice(0, 10).replaceAll("-", ""),
      sequence:
        Math.max(
          0,
          ...history.records.map((item) => item.context.occurrence.sequence),
        ) + 1,
      actionId: request.actionId,
    };
    runId = formatRunOccurrenceId(occurrence);
    if (runId === null) reject("run-sequence-exhausted");
    prepared = {
      runId,
      occurrence,
      actionIdentity: { deliveryId, changeId, actionId: request.actionId },
      role: request.role,
      lifecycleState: "prepared",
      ownerAuthority: authority,
      previousRunId: history.current?.context.runId ?? null,
    };
    const current =
      history.current === null
        ? null
        : {
            identity: history.current.context.actionIdentity,
            state: history.current.context.lifecycleState,
          };
    const input = {
      repositoryRoot: context.repositoryRoot,
      deliveryId,
      changeId,
      changeStartSequence: history.changeStartSequence!,
      occurrence,
    };
    const root = proofRoot(prepared.actionIdentity, runId);
    let callbackError: unknown = null;
    stage = "preparation";
    const outcome = await invokeSingleAction(
      installation,
      current,
      prepared.actionIdentity,
      prepared,
      async (actionPackage) => {
        try {
          stage = "execution";
          dispatched = true;
          const response = await transport.exchange(
            { kind: "execute", actionPackage, proofRoot: root },
            "result",
            actionPackage.runId,
          );
          transport.assertClean();
          stage = "admission";
          if (!isRunResultRecord(response.result))
            reject("invalid-action-result");
          stage = "evidence";
          await validateActionProof(
            context.repositoryRoot,
            response.result,
            history.records,
          );
          stage = "admission";
          return response.result;
        } catch (error) {
          callbackError = error;
          throw error;
        }
      },
      async (actionPackage) => {
        try {
          let evidenceRefs: unknown[] = [];
          let materialDecisions: unknown[] = [];
          const prior = history.current?.result;
          if (prior && Object.hasOwn(prior.facts, "handoff")) {
            const validated = await validateActionProof(
              context.repositoryRoot,
              prior,
              history.records,
              false,
            );
            evidenceRefs = validated.evidenceRefs;
            materialDecisions = [...validated.handoff.ownerDecisions];
          }
          const handoff = {
            repositoryRoot: context.repositoryRoot,
            deliveryId,
            changeId,
            changeState,
            currentRun: history.current
              ? { runId: history.current.context.runId }
              : null,
            openSpec: context.openSpec,
            ownerDecisions: [
              ...selected.ownerDecisions.filter(
                (decision) =>
                  isOwnerAuthorityFact(decision) &&
                  decision.deliveryId === deliveryId &&
                  (decision.changeId === undefined ||
                    decision.changeId === changeId),
              ),
              ...materialDecisions,
            ],
            guidanceFile: path.join(
              installation.root,
              actionPackage.guidanceRef.path,
            ),
            evidenceRefs,
          };
          const response = await transport.exchange(
            { kind: "prepare", actionPackage, handoff },
            "prepared",
            actionPackage.runId,
          );
          transport.assertClean();
          if (response.outcome !== "ready") return "blocked";
          stage = "reservation";
          reservation = await reserveActionRun(
            input,
            prepared!,
            `# ${request.actionId}\n\n${runId} · ${deliveryId}/${changeId} · ${request.role}\n`,
          );
          return "ready";
        } catch (error) {
          callbackError = error;
          throw error;
        }
      },
    );
    if (outcome.status !== "terminal") {
      if (callbackError !== null) throw callbackError;
      reject(outcome.reason);
    }
    stage = "admission";
    const finalContext: RunContextRecord = {
      ...prepared,
      lifecycleState: "terminal",
    };
    const actualState = await resolveTrustedChangeCoordination({
      repositoryRoot: context.repositoryRoot,
      deliveryId,
      changeId,
    });
    if (
      request.actionId === "archive" &&
      outcome.result.authorConclusion === "PASS"
    ) {
      const observed = await observeOpenSpecActiveChanges({
        installation,
        repositoryRoot: context.repositoryRoot,
        flowkitHome: request.flowkitHome,
      });
      if (observed.changeIds.includes(changeId))
        reject("archive-not-materialized");
    }
    const decision = policyForRecord(
      {
        actionMarkdown: "unused",
        context: finalContext,
        result: outcome.result,
      },
      { deliveryId, changeId, changeState: actualState },
    );
    if (
      decision.kind === "blocked" &&
      !(
        request.role === "author" &&
        outcome.result.authorConclusion === "FAIL" &&
        outcome.result.nextBoundary === null &&
        actualState === "active"
      )
    )
      reject("result-policy-conflict");
    transport.assertClean();
    stage = "persistence";
    const held = reservation as Awaited<
      ReturnType<typeof reserveActionRun>
    > | null;
    if (!held) reject("missing-reservation");
    await held.finish(finalContext, outcome.result);
    terminalSaved = true;
    transport.assertClean();
    transport.send({
      kind: "action",
      status: "terminal",
      runId,
      result: outcome.result,
      nextBoundary: outcome.nextBoundary,
    });
    return 0;
  } catch (error) {
    const kind =
      error instanceof Error &&
      "kind" in error &&
      typeof error.kind === "string"
        ? error.kind
        : "action-invocation-failed";
    const held = reservation as Awaited<
      ReturnType<typeof reserveActionRun>
    > | null;
    let persistence: "none" | "complete" | "incomplete" | "unconfirmed" =
      terminalSaved ? "complete" : held ? "incomplete" : "none";
    if (error instanceof ActionRunPersistenceError)
      persistence = error.persistence;
    if (dispatched && held && prepared && stage !== "persistence") {
      const result: RunResultRecord = {
        runId: prepared.runId,
        actionIdentity: prepared.actionIdentity,
        authorConclusion: null,
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: null,
        facts: { invocationFailure: { kind, stage } },
      };
      try {
        await held.finish(prepared, result);
        persistence = "complete";
        failureRecorded = true;
      } catch (writeError) {
        stage = "persistence";
        persistence =
          writeError instanceof ActionRunPersistenceError
            ? writeError.persistence
            : "incomplete";
      }
    }
    transport.send({
      kind: "error",
      error: { kind, stage, runId, persistence },
    });
    return kind === "action-invocation-failed" && !failureRecorded ? 3 : 2;
  } finally {
    transport.close();
  }
}
