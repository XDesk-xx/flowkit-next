import { readFile, rename, lstat } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { resolveManagedTool } from "../domain/managed-tool-resolution.js";
import { writeChangeState } from "../internal/change-coordination-write.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import {
  assertOpenSpecArchiveDate,
  openSpecArchiveDate,
} from "../internal/openspec-archive-date.js";
import {
  archiveCoordinationAfter,
  archiveEffectsRoot,
  saveArchiveObservation,
} from "../internal/archive-effects.js";
import {
  archiveJson,
  archiveV2Refs,
  archiveV2Snapshot,
  observeArchiveV2,
  readArchiveV2,
  type ArchivePrestateV2,
} from "../internal/archive-effects-v2.js";
import {
  affectedSpecHashes,
  directoryHashes,
} from "../internal/archive-file-identities.js";
import {
  archiveDiagnosticAttempt,
  runArchiveProcess,
} from "../internal/archive-process.js";
import { candidateGitProjection } from "../internal/candidate-git-bytes.js";
import { inspectStartedAction } from "./action-inspect.js";
import { readProjectOrdinal } from "./action-readiness.js";
import { archiveReviewSource } from "./current-run-chain.js";
import {
  effectiveRecord,
  runMaterialLocation,
  sha256,
} from "./run-effective-facts.js";
import { checkReviewCandidate } from "./review-candidate.js";
import type { InspectRequest } from "./action-request.js";

export async function archiveChange(
  request: Record<string, unknown>,
  installation: ManagerInstallation,
): Promise<Record<string, unknown>> {
  const target = request as unknown as InspectRequest;
  let pre: ArchivePrestateV2 | null = null;
  let group: string | null = null;
  let relative: string | null = null;
  let effect = "unknown";
  try {
    const started = await inspectStartedAction(target, installation);
    const { descriptor } = started;
    group = started.group;
    if (started.names.length === 3) {
      const { record } = await runMaterialLocation(target, target.runId);
      if (
        record.context.lifecycleState !== "terminal" ||
        record.context.actionIdentity.actionId !== "archive" ||
        record.context.role !== "author"
      )
        throw Error("archive-terminal-record-invalid");
      const kind = (
        record.result.facts.archiveOutcome as { kind?: string } | undefined
      )?.kind;
      return {
        status:
          record.result.authorConclusion === "PASS"
            ? "completed"
            : kind === "failed"
              ? "failed"
              : "incomplete",
        effect: "read-only",
        runId: target.runId,
        ...record.result.facts,
      };
    }
    if (
      started.names.length !== 1 ||
      descriptor.archiveContractVersion !== 2 ||
      descriptor.preparedContext.actionIdentity.actionId !== "archive" ||
      descriptor.preparedContext.role !== "author"
    )
      throw Error(
        "archive-start-invalid-or-incompatible; use the manager matching the original descriptor Guidance",
      );
    if (started.previous === null) throw Error("archive-review-missing");
    const source = archiveReviewSource(started.records, started.previous);
    const review = await effectiveRecord(target, source.review);
    const author = await effectiveRecord(target, source.author);
    const ordinal = await readProjectOrdinal(target);
    relative = archiveEffectsRoot(target, group, target.runId);
    pre = await readArchiveV2(target, group, target.runId);
    const assertCurrent = async () => {
      const latest = await inspectStartedAction(target, installation);
      if (
        !isDeepStrictEqual(latest.descriptor, descriptor) ||
        latest.names.length !== 1 ||
        latest.previous?.context.runId !== started.previous?.context.runId
      )
        throw Error("archive-current-drift");
    };
    if (pre === null) {
      await checkReviewCandidate(target, author, review.result.facts);
      const date = openSpecArchiveDate();
      const sourcePath = `openspec/changes/${target.changeId}`;
      const sourceFiles = await directoryHashes(
        target.repositoryRoot,
        sourcePath,
      );
      if (!sourceFiles) throw Error("archive-source-missing");
      const defaultPath = `openspec/changes/archive/${date}-${target.changeId}`;
      const archivePath = `openspec/changes/archive/${date}-${String(ordinal).padStart(3, "0")}-${target.changeId}`;
      const coordinationPath = `openspec/delivery-groups/${target.deliveryId}.yaml`;
      const coordination = await readFile(
        path.join(target.repositoryRoot, coordinationPath),
      );
      pre = {
        formatVersion: 2,
        deliveryId: target.deliveryId,
        changeId: target.changeId,
        runId: target.runId,
        descriptorSha256: sha256(Buffer.from(started.markdown)),
        authorRunId: author.context.runId,
        reviewRunId: review.context.runId,
        sourcePath,
        defaultPath,
        archivePath,
        sourceFiles,
        candidate: author.result.facts.artifactHashes as Record<string, string>,
        specsBefore: await affectedSpecHashes(
          target.repositoryRoot,
          sourceFiles,
        ),
        defaultBefore: await directoryHashes(
          target.repositoryRoot,
          defaultPath,
        ),
        archiveBefore: await directoryHashes(
          target.repositoryRoot,
          archivePath,
        ),
        coordination: {
          path: coordinationPath,
          beforeText: coordination.toString("utf8"),
          beforeSha256: sha256(coordination),
          afterSha256: sha256(
            archiveCoordinationAfter(
              coordination,
              target.deliveryId,
              target.changeId,
            ),
          ),
        },
      };
      await assertCurrent();
      await saveArchiveObservation(target, relative, "prestate", pre);
    }
    if (
      pre.descriptorSha256 !== sha256(Buffer.from(started.markdown)) ||
      pre.authorRunId !== author.context.runId ||
      pre.reviewRunId !== review.context.runId ||
      !isDeepStrictEqual(pre.candidate, author.result.facts.artifactHashes) ||
      pre.archivePath !==
        `openspec/changes/archive/${pre.defaultPath.slice("openspec/changes/archive/".length, "openspec/changes/archive/".length + 10)}-${String(ordinal).padStart(3, "0")}-${target.changeId}`
    )
      throw Error("archive-prestate-binding-invalid");
    let observed = await observeArchiveV2(target, group, pre);
    effect = observed.effect;
    if (effect === "none") {
      await checkReviewCandidate(target, author, review.result.facts);
      assertOpenSpecArchiveDate(pre.defaultPath, target.changeId);
      await assertCurrent();
      await saveArchiveObservation(target, relative, "openspec-intent", {
        runId: target.runId,
        descriptorSha256: pre.descriptorSha256,
      });
      let invoked = false;
      let commandRef: string | null = null;
      let toolEntrypoint: string | null = null;
      let toolVersion: string | null = null;
      let errorMessage: string | null = null;
      try {
        const tool = await resolveManagedTool({
          flowkitHome: target.flowkitHome,
          installation,
          toolId: "openspec",
        });
        toolEntrypoint = tool.entrypoint;
        toolVersion = tool.version;
        const attempt = await archiveDiagnosticAttempt(
          target.repositoryRoot,
          target.deliveryId,
          group,
          { ...target, trigger: "archive", candidate: pre.candidate },
        );
        commandRef = `${attempt}/commands/openspec-archive/command.json`;
        invoked = true;
        await runArchiveProcess(
          target.repositoryRoot,
          attempt,
          "openspec-archive",
          process.execPath,
          [tool.entrypoint, "archive", target.changeId, "--yes", "--json"],
          target.repositoryRoot,
          { timeout: 120_000 },
        );
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
      }
      await saveArchiveObservation(target, relative, "openspec-result", {
        runId: target.runId,
        descriptorSha256: pre.descriptorSha256,
        invoked,
        commandRef,
        toolEntrypoint,
        toolVersion,
        error: errorMessage,
      });
      const command =
        commandRef === null ? null : await archiveJson(target, commandRef);
      if (command?.status === "passed" && command.exitCode === 0) {
        const snapshot = await archiveV2Snapshot(target, pre);
        if (
          snapshot.source !== null ||
          !isDeepStrictEqual(snapshot.defaultArchive, pre.sourceFiles) ||
          snapshot.archive !== null ||
          pre.archiveBefore !== null ||
          pre.defaultBefore !== null
        )
          throw Error("archive-native-success-poststate-unconfirmed");
        await saveArchiveObservation(target, relative, "openspec-observed", {
          runId: target.runId,
          defaultPath: pre.defaultPath,
          sourceFiles: pre.sourceFiles,
          specsAfter: snapshot.specs,
        });
      }
      observed = await observeArchiveV2(target, group, pre);
      effect = observed.effect;
    } else if (effect === "unknown") {
      const result = await archiveJson(
        target,
        `${relative}/openspec-result.json`,
      );
      const captured = await archiveJson(
        target,
        `${relative}/openspec-observed.json`,
      );
      if (
        observed.success &&
        result &&
        captured === null &&
        observed.actual.source === null &&
        isDeepStrictEqual(observed.actual.defaultArchive, pre.sourceFiles) &&
        observed.actual.archive === null &&
        pre.defaultBefore === null &&
        pre.archiveBefore === null &&
        observed.actual.coordinationSha256 === pre.coordination.beforeSha256
      ) {
        await saveArchiveObservation(target, relative, "openspec-observed", {
          runId: target.runId,
          defaultPath: pre.defaultPath,
          sourceFiles: pre.sourceFiles,
          specsAfter: observed.actual.specs,
        });
        observed = await observeArchiveV2(target, group, pre);
        effect = observed.effect;
      }
    }
    if (effect === "failed")
      return {
        status: "failed",
        effect: "no-mutation",
        runId: target.runId,
        archivePath: pre.archivePath,
        archiveOutcome: {
          kind: "failed",
          effect: "no-mutation",
          retryable: true,
        },
        archiveMaterialRefs: await archiveV2Refs(target, group, target.runId),
      };
    if (effect === "openspec") {
      await assertCurrent();
      const stat = await lstat(
        path.join(target.repositoryRoot, pre.archivePath),
      ).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (stat !== null) throw Error("archive-ordinal-destination-collision");
      await rename(
        path.join(target.repositoryRoot, pre.defaultPath),
        path.join(target.repositoryRoot, pre.archivePath),
      );
      observed = await observeArchiveV2(target, group, pre);
      effect = observed.effect;
    }
    if (effect === "archived" || effect === "completed") {
      await assertCurrent();
      await saveArchiveObservation(target, relative, "rename-observed", {
        runId: target.runId,
        archivePath: pre.archivePath,
        sourceFiles: pre.sourceFiles,
      });
      if (effect === "archived") {
        await writeChangeState(
          target.repositoryRoot,
          target.deliveryId,
          target.changeId,
          "active",
          "completed",
        );
        observed = await observeArchiveV2(target, group, pre);
        effect = observed.effect;
      }
    }
    if (effect !== "completed") throw Error("archive-recovery-required");
    await assertCurrent();
    await saveArchiveObservation(target, relative, "coordination-observed", {
      runId: target.runId,
      path: pre.coordination.path,
      beforeSha256: pre.coordination.beforeSha256,
      afterSha256: pre.coordination.afterSha256,
    });
    const hashes: Record<string, string> = {};
    for (const [suffix, hash] of Object.entries(pre.sourceFiles))
      hashes[`${pre.archivePath}/${suffix}`] = hash;
    for (const [file, hash] of Object.entries(observed.actual.specs))
      if (hash !== null) hashes[file] = hash;
    hashes[pre.coordination.path] = pre.coordination.afterSha256;
    const stored = await archiveJson(target, `${relative}/git-projection.json`);
    const projection = await candidateGitProjection(
      target.repositoryRoot,
      hashes,
      stored ?? undefined,
    );
    await saveArchiveObservation(
      target,
      relative,
      "git-projection",
      projection,
    );
    return {
      status: "completed",
      effect: "archive-and-coordination",
      archivePath: pre.archivePath,
      projectOrdinal: ordinal,
      runId: target.runId,
      archiveOutcome: { kind: "completed" },
      archiveMaterialRefs: await archiveV2Refs(target, group, target.runId),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "archive-failed";
    if (relative !== null)
      await saveArchiveObservation(target, relative, "failure", {
        runId: target.runId,
        descriptorSha256: pre?.descriptorSha256 ?? null,
        reason,
        effect,
      }).catch(() => undefined);
    const refs =
      group === null
        ? []
        : await archiveV2Refs(target, group, target.runId).catch(() => []);
    return {
      status: "incomplete",
      effect,
      archivePath: pre?.archivePath ?? null,
      runId: target.runId,
      reason,
      archiveOutcome: {
        kind: "partial",
        effect: "recovery-required",
        retryable: false,
      },
      archiveMaterialRefs: refs,
    };
  }
}
