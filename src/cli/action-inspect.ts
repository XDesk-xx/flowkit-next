import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { resolveActionGuidanceRef } from "../domain/action-guidance-execution.js";
import {
  transitionCurrentAction,
  supersedePreparedAction,
  retryTerminalArchive,
} from "../domain/action-lifecycle.js";
import { formActionPackage } from "../domain/action-package-result-admission.js";
import {
  parseRunOccurrenceId,
  readDurableRun,
} from "../domain/run-result-persistence.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { uniqueRunGroup } from "../internal/proof-path-owner.js";
import type { InspectRequest } from "./action-request.js";
import { readDescriptor } from "./action-descriptor.js";
import {
  policyForRecord,
  resolveRunChain,
  archiveReviewSource,
} from "./current-run-chain.js";
import {
  observeArchiveV2,
  readArchiveV2,
} from "../internal/archive-effects-v2.js";
import {
  controlledBytes,
  effectiveRecord,
  sha256,
} from "./run-effective-facts.js";
import {
  assertReviewBinding,
  checkReviewCandidate,
} from "./review-candidate.js";
import { archiveEffectsRoot } from "../internal/archive-effects.js";
import { assertOpenSpecArchiveDate } from "../internal/openspec-archive-date.js";

export async function inspectStartedAction(
  request: InspectRequest,
  installation: ManagerInstallation,
) {
  const root = await realpath(request.repositoryRoot);
  if (root !== request.repositoryRoot)
    throw Error("Descriptor target root must be exact");
  const delivery = path.join(root, ".flowkit/runs", request.deliveryId);
  const group = uniqueRunGroup(await readdir(delivery), request.changeId);
  const changeStartSequence = Number(
    group.slice(0, -(request.changeId.length + 1)),
  );
  const directory = path.join(delivery, group, request.runId);
  const { descriptor, markdown } = await readDescriptor(directory);
  const prepared = descriptor.preparedContext;
  if (
    descriptor.repositoryRoot !== root ||
    descriptor.changeStartSequence !== changeStartSequence ||
    prepared.runId !== request.runId ||
    prepared.lifecycleState !== "prepared" ||
    prepared.actionIdentity.deliveryId !== request.deliveryId ||
    prepared.actionIdentity.changeId !== request.changeId ||
    !isDeepStrictEqual(prepared.occurrence, parseRunOccurrenceId(request.runId))
  )
    throw Error("Descriptor identity/root drift");
  const names = (await readdir(directory)).sort();
  if (
    !isDeepStrictEqual(names, ["action.md"]) &&
    !isDeepStrictEqual(names, ["action.md", "context.json", "result.json"])
  )
    throw Error("Partial machine files; cannot continue");
  const records = [];
  for (const name of await readdir(path.dirname(directory))) {
    if (name === request.runId) continue;
    const occurrence = parseRunOccurrenceId(name);
    if (occurrence === null) throw Error("Unknown occurrence or fork");
    records.push(
      await readDurableRun({ ...request, changeStartSequence, occurrence }),
    );
  }
  const previous = resolveRunChain(records);
  if (
    (previous?.context.runId ?? null) !== prepared.previousRunId ||
    prepared.occurrence.sequence !==
      (previous
        ? previous.context.occurrence.sequence + 1
        : changeStartSequence)
  )
    throw Error("Descriptor predecessor/fork drift");
  const policy = policyForRecord(previous, {
    ...request,
    changeState: "active",
    ...(prepared.ownerAuthority === null
      ? {}
      : {
          ownerCorrection: {
            requestedAction: prepared.actionIdentity.actionId,
            authority: prepared.ownerAuthority,
          },
        }),
  });
  if (
    policy.kind !== "ready-action" ||
    policy.actionId !== prepared.actionIdentity.actionId
  )
    throw Error("Descriptor Policy edge invalid");
  const previousAction =
    previous === null
      ? null
      : {
          identity: previous.context.actionIdentity,
          state: previous.context.lifecycleState,
        };
  const current =
    previousAction?.state === "prepared" && prepared.ownerAuthority !== null
      ? supersedePreparedAction(previousAction, prepared.actionIdentity, policy)
      : (transitionCurrentAction(previousAction, {
          type: "prepare",
          identity: prepared.actionIdentity,
        }) ??
        retryTerminalArchive(previousAction, prepared.actionIdentity, policy));
  const guidance = await resolveActionGuidanceRef(
    installation,
    prepared.actionIdentity.actionId,
  );
  if (
    current === null ||
    guidance === null ||
    !isDeepStrictEqual(
      formActionPackage(current, prepared, guidance),
      descriptor.actionPackage,
    )
  )
    throw Error("Descriptor package/Guidance drift");
  const originalHashes: Record<string, string> = {};
  for (const name of names) {
    if ((await lstat(path.join(directory, name))).isSymbolicLink())
      throw Error("Linked Run file");
    originalHashes[name] = sha256(await readFile(path.join(directory, name)));
  }
  return {
    root,
    group,
    directory,
    descriptor,
    markdown,
    names,
    previous,
    originalHashes,
    records,
  };
}

export async function inspectAction(
  request: InspectRequest,
  installation: ManagerInstallation,
) {
  try {
    const started = await inspectStartedAction(request, installation);
    let actualEffect: string = "none";
    let remaining = ["finish"];
    let canContinue = false;
    if (
      started.descriptor.archiveContractVersion === 2 &&
      started.names.length === 1
    ) {
      if (!started.previous) throw Error("Archive predecessor missing");
      const source = archiveReviewSource(started.records, started.previous);
      const review = await effectiveRecord(request, source.review);
      const author = await effectiveRecord(request, source.author);
      assertReviewBinding(author, review.result.facts);
      const pre = await readArchiveV2(request, started.group, request.runId);
      if (pre === null) {
        await checkReviewCandidate(request, author, review.result.facts);
        actualEffect = "none";
        remaining = ["openspec", "rename", "coordination", "finish"];
        canContinue = true;
      } else {
        if (
          pre.descriptorSha256 !== sha256(Buffer.from(started.markdown)) ||
          pre.authorRunId !== author.context.runId ||
          pre.reviewRunId !== review.context.runId ||
          !isDeepStrictEqual(pre.candidate, author.result.facts.artifactHashes)
        )
          throw Error("Archive v2 descriptor/source drift");
        const observed = await observeArchiveV2(request, started.group, pre);
        actualEffect = observed.effect;
        if (observed.effect === "none") {
          await checkReviewCandidate(request, author, review.result.facts);
          assertOpenSpecArchiveDate(pre.defaultPath, request.changeId);
        }
        remaining =
          observed.effect === "none"
            ? ["openspec", "rename", "coordination", "finish"]
            : observed.effect === "openspec"
              ? ["rename", "coordination", "finish"]
              : observed.effect === "archived"
                ? ["coordination", "finish"]
                : observed.effect === "completed" ||
                    observed.effect === "failed"
                  ? ["finish"]
                  : ["explicit-recovery"];
        const recoverableAck =
          observed.success &&
          observed.effect === "unknown" &&
          observed.actual.source === null &&
          observed.actual.archive === null &&
          isDeepStrictEqual(observed.actual.defaultArchive, pre.sourceFiles) &&
          pre.defaultBefore === null &&
          pre.archiveBefore === null &&
          observed.actual.coordinationSha256 === pre.coordination.beforeSha256;
        canContinue =
          ["none", "openspec", "archived", "completed"].includes(
            observed.effect,
          ) || recoverableAck;
        if (recoverableAck)
          remaining = ["observe-openspec", "rename", "coordination", "finish"];
      }
    }
    if (
      started.names.length === 1 &&
      started.descriptor.preparedContext.actionIdentity.actionId ===
        "archive" &&
      started.descriptor.archiveContractVersion !== 2
    )
      throw Error(
        "archive-contract-incompatible: use the manager matching original descriptor Guidance",
      );
    if (started.names.length === 3) {
      const occurrence = parseRunOccurrenceId(request.runId)!;
      const record = await readDurableRun({
        ...request,
        changeStartSequence: started.descriptor.changeStartSequence,
        occurrence,
      });
      if (
        resolveRunChain([...started.records, record])?.context.runId !==
        request.runId
      )
        throw Error("Complete Run is not canonical tip");
      actualEffect = record.context.lifecycleState ?? "unknown";
      remaining = [];
      const outcome = record.result.facts.archiveOutcome as
        { kind?: string } | undefined;
      if (outcome?.kind === "partial") {
        actualEffect = "recovery-required";
        remaining = ["explicit-recovery"];
      } else if (outcome?.kind === "failed") actualEffect = "safe-failed";
    }
    return {
      kind: "action-inspect",
      effect: "observed",
      runId: request.runId,
      completeness: started.names.length === 1 ? "descriptor-only" : "complete",
      originalHashes: started.originalHashes,
      actualEffect,
      remaining,
      canContinue,
      archiveEffectsRef: archiveEffectsRoot(
        request,
        started.group,
        request.runId,
      ),
      diagnosticRefs: await inspectDiagnostics(
        request,
        started.group,
        started.previous?.context.runId ?? null,
      ),
    };
  } catch (error) {
    return {
      kind: "action-inspect",
      effect: "blocked",
      runId: request.runId,
      completeness: "unconfirmed",
      actualEffect: "unknown",
      remaining: [],
      canContinue: false,
      reason: error instanceof Error ? error.message : "Inspection failed",
    };
  }
}

async function inspectDiagnostics(
  request: InspectRequest,
  group: string,
  reviewRunId: string | null,
) {
  const prefix = `.flowkit/artifacts/${request.deliveryId}/changes/${group}/archive-diagnostics`;
  const attempts = await readdir(
    path.join(request.repositoryRoot, prefix),
  ).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const refs: string[] = [];
  for (const attempt of attempts) {
    if (!/^[a-f0-9-]{36}$/.test(attempt))
      throw Error("Unknown Archive diagnostic attempt");
    const relative = `${prefix}/${attempt}`;
    const value = JSON.parse(
      (
        await controlledBytes(
          request.repositoryRoot,
          `${relative}/attempt.json`,
        )
      ).toString("utf8"),
    );
    if (
      value.runId !== request.runId &&
      !(value.runId === null && value.reviewRunId === reviewRunId)
    )
      continue;
    refs.push(`${relative}/attempt.json`);
    const commands = await readdir(
      path.join(request.repositoryRoot, relative, "commands"),
    ).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    for (const command of commands) {
      if (!/^[a-z0-9%:-]+$/i.test(command))
        throw Error("Unknown Archive diagnostic command");
      const file = `${relative}/commands/${command}/command.json`;
      try {
        await controlledBytes(request.repositoryRoot, file);
        refs.push(file);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        refs.push(`${relative}/commands/${command}`);
      }
    }
  }
  return refs.sort();
}
