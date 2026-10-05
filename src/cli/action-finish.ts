import { prepareFailedAuthorCorrection } from "../domain/policy-and-next-boundary.js";
import { readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import {
  supersedePreparedAction,
  transitionCurrentAction,
  retryTerminalArchive,
} from "../domain/action-lifecycle.js";
import {
  admitActionResult,
  expectedExecutionRoleForAction,
  formActionPackage,
} from "../domain/action-package-result-admission.js";
import { resolveActionGuidanceRef } from "../domain/action-guidance-execution.js";

import {
  buildRunAddress,
  parseRunOccurrenceId,
  readDurableRun,
  runResultFactsBudget,
  type RunAddressInput,
} from "../domain/run-result-persistence.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { resolveActionContext } from "./action-context.js";
import { checkResultArtifactsOnFinish as checkArtifacts } from "./action-artifact-hashes.js";
import { checkOwnRunProofClosure } from "./action-proof.js";
import type { FinishRequest } from "./action-request.js";
import { ActionCommandError, blocked } from "./action-error.js";
import { readDescriptor } from "./action-descriptor.js";
import { readProjectOrdinal } from "./action-readiness.js";
import {
  assertDeliverySequenceAvailable,
  policyForRecord,
  readSelectedRunChain,
  resolveRunChain,
} from "./current-run-chain.js";
import { resolveTrustedChangeCoordination } from "./trusted-change-coordination.js";
import { checkReviewCandidate } from "./review-candidate.js";

import { effectiveRecord } from "./run-effective-facts.js";

import { checkArchiveFinish } from "./archive-finish.js";

function address(input: RunAddressInput): string {
  const built = buildRunAddress(input);
  if (built === null)
    blocked("invalid-run-address", "Invalid controlled Run address");
  return built.runDirectory;
}
export async function finishAction(
  request: FinishRequest,
  installation: ManagerInstallation,
) {
  const occurrence = parseRunOccurrenceId(request.runId);
  if (
    occurrence === null ||
    request.result.runId !== request.runId ||
    request.result.actionIdentity.actionId !== occurrence.actionId ||
    request.result.actionIdentity.deliveryId !== request.deliveryId ||
    request.result.actionIdentity.changeId !== request.changeId ||
    request.role !== expectedExecutionRoleForAction(occurrence.actionId)
  )
    blocked(
      "finish-identity-mismatch",
      "Result/Role/Run target mismatch",
      request.runId,
    );
  const repositoryRoot = await realpath(request.repositoryRoot);
  const groupRoot = path.join(
    repositoryRoot,
    ".flowkit",
    "runs",
    request.deliveryId,
  );
  const matching = (await readdir(groupRoot)).filter((name) =>
    name.endsWith(`-${request.changeId}`),
  );
  if (matching.length !== 1 || !/^\d{3,}-/.test(matching[0]))
    blocked(
      "run-group-ambiguous",
      "Expected one canonical Run group",
      request.runId,
    );
  const sequence = Number(matching[0].slice(0, -(request.changeId.length + 1)));
  const input = {
    repositoryRoot,
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeStartSequence: sequence,
    occurrence,
  };
  const directory = address(input);
  let started;
  try {
    started = await readDescriptor(directory);
  } catch (error) {
    if (error instanceof ActionCommandError)
      throw new ActionCommandError(
        error.kind,
        "incomplete",
        request.runId,
        error.message,
      );
    throw error;
  }
  const { markdown, descriptor } = started;
  const prepared = descriptor.preparedContext;
  const packageValue = descriptor.actionPackage;
  const archiveKind = (
    request.result.facts.archiveOutcome as { kind?: string } | undefined
  )?.kind;
  if (
    descriptor.changeStartSequence !== sequence ||
    descriptor.repositoryRoot !== repositoryRoot ||
    prepared.runId !== request.runId ||
    prepared.role !== request.role ||
    prepared.actionIdentity.deliveryId !== request.deliveryId ||
    prepared.actionIdentity.changeId !== request.changeId ||
    prepared.actionIdentity.actionId !== occurrence.actionId ||
    !isDeepStrictEqual(prepared.occurrence, occurrence) ||
    !isDeepStrictEqual(packageValue?.ownerAuthority, prepared.ownerAuthority)
  )
    blocked(
      "descriptor-linkage-mismatch",
      "Start descriptor does not match exact target",
      request.runId,
    );
  const names = (await readdir(directory)).sort();
  if (
    !isDeepStrictEqual(names, ["action.md"]) &&
    !isDeepStrictEqual(names, ["action.md", "context.json", "result.json"])
  ) {
    throw new ActionCommandError(
      "partial-run",
      "incomplete",
      request.runId,
      "Run files are partial or unexpected",
    );
  }
  if (names.length === 3) {
    const existing = await readDurableRun(input);
    const duplicateResult =
      existing.result.facts.candidateGit !== undefined &&
      request.result.facts.candidateGit === undefined &&
      request.role === "author"
        ? {
            ...request.result,
            facts: {
              ...request.result.facts,
              candidateGit: existing.result.facts.candidateGit,
            },
          }
        : request.result;
    if (
      !isDeepStrictEqual(existing.result, duplicateResult) ||
      !isDeepStrictEqual(existing.context, {
        ...prepared,
        lifecycleState: request.terminal ? "terminal" : "prepared",
      })
    )
      blocked(
        "duplicate-finish-conflict",
        "Complete Run differs from retry",
        request.runId,
      );
    const history = await readSelectedRunChain(request);
    if (
      history.kind !== "canonical" ||
      !history.records.some((record) => record.context.runId === request.runId)
    )
      blocked(
        "duplicate-chain-invalid",
        "Complete Run is not in the canonical chain",
        request.runId,
      );
    return {
      kind: "action-finish",
      effect: "confirmed",
      runId: request.runId,
      state: existing.context.lifecycleState,
      duplicate: true,
      ...(existing.result.facts.candidateGit === undefined
        ? {}
        : { candidateGit: existing.result.facts.candidateGit }),
    };
  }
  const all = await readdir(path.dirname(directory));
  if (
    occurrence.actionId === "archive" &&
    descriptor.archiveContractVersion !== 2
  )
    blocked(
      "archive-contract-incompatible",
      "Use the manager matching the original Archive descriptor Guidance",
      request.runId,
    );
  const priorRecords = [];
  for (const name of all) {
    if (name === request.runId) continue;
    const priorOccurrence = parseRunOccurrenceId(name);
    if (priorOccurrence === null)
      blocked("run-chain-invalid", "Unknown Run occurrence", request.runId);
    priorRecords.push(
      await readDurableRun({ ...input, occurrence: priorOccurrence }),
    );
  }
  const previous = resolveRunChain(priorRecords);
  const expectedSequence =
    previous === null
      ? descriptor.changeStartSequence
      : previous.context.occurrence.sequence + 1;
  // A started Archive partial may close its immutable Run even when business coordination is unreadable.
  // It cannot allocate another occurrence or authorize a product mutation.
  if (!(occurrence.actionId === "archive" && archiveKind === "partial"))
    await assertDeliverySequenceAvailable(
      request,
      prepared.occurrence.sequence,
    );
  if (
    prepared.previousRunId !== (previous?.context.runId ?? null) ||
    prepared.occurrence.sequence !== expectedSequence
  )
    blocked(
      "predecessor-drift",
      "Started Run is not unique next successor",
      request.runId,
    );
  const state = await resolveTrustedChangeCoordination(request).catch(
    (error) => {
      if (occurrence.actionId === "archive" && archiveKind === "partial")
        return null;
      throw error;
    },
  );
  if (
    !(occurrence.actionId === "archive" && archiveKind === "partial") &&
    state !==
      (occurrence.actionId === "archive" && archiveKind !== "failed"
        ? "completed"
        : "active")
  )
    blocked(
      "coordination-drift",
      "Change coordination state does not match finish",
      request.runId,
    );
  if (
    occurrence.actionId === "explore" &&
    request.terminal &&
    request.result.authorConclusion === "PASS" &&
    request.result.facts.projectOrdinal !== (await readProjectOrdinal(request))
  )
    blocked(
      "project-ordinal-drift",
      "Explore did not materialize the exact project ordinal",
      request.runId,
    );
  if (occurrence.actionId === "archive")
    await checkArchiveFinish(
      request,
      installation,
      previous,
      matching[0],
      markdown,
      priorRecords,
      descriptor.archiveContractVersion,
    );
  const correction =
    prepared.ownerAuthority === null
      ? undefined
      : {
          requestedAction: occurrence.actionId,
          authority: prepared.ownerAuthority,
        };
  const policy = policyForRecord(previous, {
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeState: "active",
    ...(correction === undefined ? {} : { ownerCorrection: correction }),
  });
  if (policy.kind !== "ready-action" || policy.actionId !== occurrence.actionId)
    blocked(
      "policy-drift",
      "Started Action is no longer a legal edge",
      request.runId,
    );
  const previousAction =
    previous === null
      ? null
      : {
          identity: previous.context.actionIdentity,
          state: previous.context.lifecycleState,
        };
  const current =
    correction === undefined || previousAction?.state !== "prepared"
      ? (transitionCurrentAction(previousAction, {
          type: "prepare",
          identity: prepared.actionIdentity,
        }) ??
        retryTerminalArchive(previousAction, prepared.actionIdentity, policy) ??
        prepareFailedAuthorCorrection(
          previousAction,
          prepared.actionIdentity,
          previous?.context,
          previous?.result,
          prepared.ownerAuthority,
        ))
      : supersedePreparedAction(
          previousAction,
          prepared.actionIdentity,
          policy,
        );
  const guidance = await resolveActionGuidanceRef(
    installation,
    occurrence.actionId,
  );
  if (
    current === null ||
    guidance === null ||
    !isDeepStrictEqual(
      formActionPackage(current, prepared, guidance),
      packageValue,
    )
  )
    blocked(
      "package-drift",
      "Current Guidance or prepared package changed",
      request.runId,
    );
  let admitted = admitActionResult(
    packageValue,
    current,
    occurrence,
    request.result,
  );
  if (admitted === null)
    blocked(
      "result-admission-rejected",
      "Result admission rejected",
      request.runId,
    );
  const candidateGit = await checkArtifacts(
    request,
    occurrence.actionId,
    admitted,
    installation,
  );
  if (candidateGit !== null) {
    const merged = {
      ...admitted,
      facts: { ...admitted.facts, candidateGit },
    };
    const budget = runResultFactsBudget(merged);
    if (budget !== undefined)
      blocked(
        "result-admission-rejected",
        "Generated Result facts exceed JSON limit",
        request.runId,
        budget,
      );
    admitted = admitActionResult(packageValue, current, occurrence, merged);
    if (admitted === null)
      blocked(
        "result-admission-rejected",
        "Generated candidateGit admission rejected",
        request.runId,
      );
  }
  if (request.terminal && request.role === "reviewer")
    await checkReviewCandidate(
      request,
      previous === null ? null : await effectiveRecord(request, previous),
      admitted.facts,
    );
  try {
    await checkOwnRunProofClosure(
      request,
      request.runId,
      request.result.facts.proofRefs,
    );
  } catch (error) {
    blocked(
      "proof-invalid",
      error instanceof Error ? error.message : "Necessary proof is invalid",
      request.runId,
    );
  }
  const ended = request.terminal
    ? transitionCurrentAction(current, {
        type: "terminal",
        identity: prepared.actionIdentity,
      })
    : current;
  if (ended === null)
    blocked(
      "terminal-transition-invalid",
      "Action transition rejected",
      request.runId,
    );
  const context = { ...prepared, lifecycleState: ended.state };
  const candidate = { actionMarkdown: markdown, context, result: admitted };
  const own = policyForRecord(candidate, {
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeState: state,
  });
  const authorFail =
    request.terminal &&
    request.role === "author" &&
    admitted.authorConclusion === "FAIL" &&
    admitted.nextBoundary === null;
  const rejected =
    request.terminal &&
    request.role === "reviewer" &&
    admitted.reviewerVerdict === "rejected" &&
    admitted.nextBoundary === null &&
    own.kind === "blocked" &&
    own.reason === "review-rejected";
  if (own.kind === "blocked" && !authorFail && !rejected) {
    if (own.reason === "unrecognized-reviewer-verdict")
      throw new ActionCommandError(
        "outcome-unsupported",
        "incomplete",
        request.runId,
        JSON.stringify(own),
      );
    blocked("outcome-unsupported", JSON.stringify(own), request.runId);
  }
  if (
    !request.terminal &&
    [
      admitted.authorConclusion,
      admitted.reviewerVerdict,
      admitted.verificationVerdict,
      admitted.nextBoundary,
    ].some((value) => value !== null)
  )
    blocked(
      "prepared-outcome-invalid",
      "Prepared failure outcome slots must be null",
      request.runId,
    );
  if (
    resolveRunChain([...priorRecords, candidate])?.context.runId !==
    request.runId
  )
    blocked(
      "candidate-chain-invalid",
      "Candidate is not canonical tip",
      request.runId,
    );
  if ((await readFile(path.join(directory, "action.md"), "utf8")) !== markdown)
    blocked(
      "descriptor-drift",
      "Started Action bytes changed before finish write",
      request.runId,
    );
  try {
    await writeFile(
      path.join(directory, "context.json"),
      JSON.stringify(context, null, 2) + "\n",
      { flag: "wx" },
    );
    await writeFile(
      path.join(directory, "result.json"),
      JSON.stringify(admitted, null, 2) + "\n",
      { flag: "wx" },
    );
  } catch {
    throw new ActionCommandError(
      "finish-write-unconfirmed",
      "written-unconfirmed",
      request.runId,
      "Run write failed; exact bytes retained",
    );
  }
  try {
    const saved = await readDurableRun(input);
    if (!isDeepStrictEqual(saved, candidate))
      throw new Error("readback mismatch");
    const history = await readdir(path.dirname(directory));
    const records = await Promise.all(
      history.map((name) => {
        const item = parseRunOccurrenceId(name);
        if (item === null) throw new Error("invalid Run entry");
        return readDurableRun({ ...input, occurrence: item });
      }),
    );
    if (resolveRunChain(records)?.context.runId !== request.runId)
      throw new Error("canonical tip mismatch");
    const selected = await resolveActionContext(request, installation);
    if (
      selected.selected?.history.current?.context.runId !== request.runId ||
      selected.status !==
        (occurrence.actionId === "archive" &&
        archiveKind !== "failed" &&
        archiveKind !== "partial"
          ? "archived"
          : archiveKind === "partial"
            ? "recovery-required"
            : "current")
    )
      throw new Error("selected chain mismatch");
  } catch {
    throw new ActionCommandError(
      "finish-readback-unconfirmed",
      "written-unconfirmed",
      request.runId,
      "Complete canonical chain could not be confirmed",
    );
  }
  return {
    kind: "action-finish",
    effect: "confirmed",
    runId: request.runId,
    state: context.lifecycleState,
    duplicate: false,
    ...(admitted.facts.candidateGit === undefined
      ? {}
      : { candidateGit: admitted.facts.candidateGit }),
  };
}
