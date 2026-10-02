import {
  lstat,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { isOwnerAuthorityFact } from "../domain/authority.js";
import {
  supersedePreparedAction,
  transitionCurrentAction,
} from "../domain/action-lifecycle.js";
import {
  admitActionResult,
  expectedExecutionRoleForAction,
  formActionPackage,
} from "../domain/action-package-result-admission.js";
import { resolveActionGuidanceRef } from "../domain/action-guidance-execution.js";
import { startCanonicalActionRun } from "../domain/canonical-action-run-start.js";
import { observeOpenSpecActiveChanges } from "../domain/openspec-observation.js";
import {
  buildRunAddress,
  formatRunOccurrenceId,
  isRunContextRecord,
  parseRunOccurrenceId,
  readDurableRun,
  type RunAddressInput,
  type RunContextRecord,
} from "../domain/run-result-persistence.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { resolveActionContext } from "./action-context.js";
import { checkResultArtifactsOnFinish } from "./action-artifact-hashes.js";
import { checkOwnRunProofClosure, inspectActionProof } from "./action-proof.js";
import type {
  ActionCommandRequest,
  FinishRequest,
  StartRequest,
} from "./action-request.js";
import { ActionCommandError, blocked } from "./action-error.js";
import { readDescriptor } from "./action-descriptor.js";
import { packageReadiness, readProjectOrdinal } from "./action-readiness.js";
import {
  ActionContextError,
  policyForRecord,
  readSelectedRunChain,
  resolveRunChain,
} from "./current-run-chain.js";
import { resolveTrustedChangeCoordination } from "./trusted-change-coordination.js";

function address(input: RunAddressInput): string {
  const built = buildRunAddress(input);
  if (built === null)
    blocked("invalid-run-address", "Invalid controlled Run address");
  return built.runDirectory;
}
async function start(request: StartRequest, installation: ManagerInstallation) {
  if (request.role !== expectedExecutionRoleForAction(request.actionId))
    blocked("role-mismatch", "Role does not match Action");
  const selection = await resolveActionContext(request, installation);
  const selected = selection.selected;
  if (
    selection.status !== "current" ||
    selected?.history.kind !== "canonical" ||
    selected.changeState !== "active"
  )
    blocked("target-not-current", "Exact active canonical Change required");
  const history = selected.history;
  const previous = history.current;
  const correction =
    request.ownerAuthority === undefined
      ? undefined
      : {
          requestedAction: request.actionId,
          authority: request.ownerAuthority,
        };
  if (
    request.ownerAuthority !== undefined &&
    (!isOwnerAuthorityFact(request.ownerAuthority) ||
      previous?.context.lifecycleState !== "prepared" ||
      previous.context.role !== "author")
  )
    blocked(
      "owner-correction-invalid",
      "Prepared Author Owner correction required",
    );
  const policy = policyForRecord(previous, {
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeState: selected.changeState,
    ...(correction === undefined ? {} : { ownerCorrection: correction }),
  });
  if (policy.kind !== "ready-action" || policy.actionId !== request.actionId)
    blocked("policy-boundary-mismatch", JSON.stringify(policy));
  if (
    previous?.context.lifecycleState === "prepared" &&
    correction === undefined
  )
    blocked(
      "prepared-run-current",
      "An existing prepared Run cannot be started again",
    );
  const nextSequence = (previous?.context.occurrence.sequence ?? 0) + 1;
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const occurrence = {
    date,
    sequence: nextSequence,
    actionId: request.actionId,
  };
  const runId = formatRunOccurrenceId(occurrence);
  if (runId === null)
    blocked("run-sequence-exhausted", "No valid next Run occurrence");
  const identity = {
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    actionId: request.actionId,
  };
  const previousAction =
    previous === null
      ? null
      : {
          identity: previous.context.actionIdentity,
          state: previous.context.lifecycleState,
        };
  const current =
    correction === undefined
      ? transitionCurrentAction(previousAction, { type: "prepare", identity })
      : supersedePreparedAction(previousAction, identity, policy);
  if (current === null)
    blocked("action-transition-invalid", "Cannot prepare exact Action", runId);
  const preparedContext: RunContextRecord = {
    runId,
    occurrence,
    actionIdentity: identity,
    role: request.role,
    lifecycleState: "prepared",
    ownerAuthority: request.ownerAuthority ?? null,
    previousRunId: previous?.context.runId ?? null,
  };
  if (!isRunContextRecord(preparedContext))
    blocked("prepared-context-invalid", "Invalid prepared context", runId);
  const input = {
    repositoryRoot: selection.repositoryRoot,
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeStartSequence: history.changeStartSequence,
    occurrence,
  };
  const guidance = await resolveActionGuidanceRef(
    installation,
    request.actionId,
  );
  if (guidance === null)
    blocked(
      "guidance-unavailable",
      "Current manager Guidance unavailable",
      runId,
    );
  let held: Awaited<ReturnType<typeof startCanonicalActionRun>>;
  try {
    held = await startCanonicalActionRun(
      installation,
      input,
      current,
      preparedContext,
      guidance,
      async (actionPackage) => {
        if (
          actionPackage.runId !== runId ||
          !isDeepStrictEqual(
            actionPackage.ownerAuthority,
            preparedContext.ownerAuthority,
          )
        )
          return "blocked";
        await packageReadiness(request, runId, previous, installation);
        const latest = await resolveActionContext(request, installation);
        return latest.selected?.history.kind === "canonical" &&
          isDeepStrictEqual(latest.selected.history.current, previous)
          ? "ready"
          : "blocked";
      },
      request.actionId === "archive"
        ? { applicableChecks: request.applicableChecks ?? [] }
        : true,
    );
  } catch (error) {
    if (error instanceof ActionCommandError) throw error;
    const directory = address(input);
    const entries = await readdir(directory).catch((failure) => {
      if (failure.code === "ENOENT") return null;
      throw failure;
    });
    throw new ActionCommandError(
      "start-unconfirmed",
      entries === null ? "not-written" : "written-unconfirmed",
      runId,
      error instanceof Error ? error.message : "Action start failed",
    );
  }
  return {
    kind: "action-start",
    effect: "started",
    runId,
    directory: held.directory,
    actionId: request.actionId,
    role: request.role,
  };
}
async function finish(
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
    if (
      !isDeepStrictEqual(existing.result, request.result) ||
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
    };
  }
  const all = await readdir(path.dirname(directory));
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
  if (
    prepared.previousRunId !== (previous?.context.runId ?? null) ||
    prepared.occurrence.sequence !==
      (previous?.context.occurrence.sequence ?? 0) + 1
  )
    blocked(
      "predecessor-drift",
      "Started Run is not unique next successor",
      request.runId,
    );
  const state = await resolveTrustedChangeCoordination(request);
  if (state !== (occurrence.actionId === "archive" ? "completed" : "active"))
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
  if (occurrence.actionId === "archive") {
    const archivePath = request.result.facts.archivePath;
    const ordinal = request.result.facts.projectOrdinal;
    if (
      typeof archivePath !== "string" ||
      typeof ordinal !== "number" ||
      !Number.isSafeInteger(ordinal) ||
      ordinal < 1 ||
      !new RegExp(
        `^openspec/changes/archive/\\d{4}-\\d{2}-\\d{2}-${String(ordinal).padStart(3, "0")}-${request.changeId}$`,
      ).test(archivePath) ||
      !(
        await lstat(path.join(repositoryRoot, ...archivePath.split("/")))
      ).isDirectory()
    )
      blocked(
        "archive-materialization-invalid",
        "Exact archive materialization is missing",
        request.runId,
      );
    if (ordinal !== (await readProjectOrdinal(request)))
      blocked(
        "archive-ordinal-drift",
        "Archive ordinal differs from coordination",
        request.runId,
      );
    let component = repositoryRoot;
    for (const segment of archivePath.split("/")) {
      component = path.join(component, segment);
      if ((await lstat(component)).isSymbolicLink())
        blocked(
          "archive-materialization-invalid",
          "Archive target is linked",
          request.runId,
        );
    }
    const active = await observeOpenSpecActiveChanges({
      repositoryRoot,
      flowkitHome: request.flowkitHome,
      installation,
    });
    if (active.changeIds.includes(request.changeId))
      blocked(
        "archive-materialization-invalid",
        "OpenSpec Change remains active",
        request.runId,
      );
  }
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
    correction === undefined
      ? transitionCurrentAction(previousAction, {
          type: "prepare",
          identity: prepared.actionIdentity,
        })
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
  const admitted = admitActionResult(
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
  await checkResultArtifactsOnFinish(request, occurrence.actionId, admitted);
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
  if (own.kind === "blocked" && !authorFail) {
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
        (occurrence.actionId === "archive" ? "archived" : "current")
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
  };
}
export async function executeActionCommand(
  input: ActionCommandRequest,
  installation: ManagerInstallation,
) {
  try {
    if (input.command === "action start")
      return await start(input.request, installation);
    if (input.command === "action finish")
      return await finish(input.request, installation);
    const facts = await inspectActionProof(
      input.request,
      input.request.runId,
      input.request.path,
    );
    return { kind: "proof-inspect", effect: "confirmed", ...facts };
  } catch (error) {
    if (error instanceof ActionCommandError) throw error;
    if (error instanceof ActionContextError)
      throw new ActionCommandError(
        error.kind,
        "incomplete",
        input.command === "action start" ? null : input.request.runId,
        error.message,
      );
    if (input.command !== "proof inspect") throw error;
    blocked(
      "proof-invalid",
      error instanceof Error ? error.message : "Proof inspection failed",
      input.request.runId,
    );
  }
}
