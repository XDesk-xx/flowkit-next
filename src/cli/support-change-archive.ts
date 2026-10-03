import { readFile, rename } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { resolveManagedTool } from "../domain/managed-tool-resolution.js";
import { observeOpenSpecChangeStatus } from "../domain/openspec-observation.js";
import { writeChangeState } from "../internal/change-coordination-write.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import {
  assertOpenSpecArchiveDate,
  openSpecArchiveDate,
} from "../internal/openspec-archive-date.js";
import {
  archiveCoordinationAfter,
  archiveEffectsRoot,
  archiveMaterialRefs,
  observeArchiveEffects,
  readArchivePrestate,
  saveArchiveObservation,
} from "../internal/archive-effects.js";
import {
  archiveDiagnosticAttempt,
  runArchiveProcess,
} from "../internal/archive-process.js";
import { inspectStartedAction } from "./action-inspect.js";
import { archiveReadiness, readProjectOrdinal } from "./action-readiness.js";
import { effectiveRecord, sha256 } from "./run-effective-facts.js";
import { checkReviewCandidate } from "./review-candidate.js";
import type { InspectRequest } from "./action-request.js";

export async function archiveChange(
  request: Record<string, unknown>,
  installation: ManagerInstallation,
): Promise<Record<string, unknown>> {
  const target = request as unknown as InspectRequest;
  let effect: string = "none";
  let archivePath: string | null = null;
  try {
    const started = await inspectStartedAction(target, installation);
    const { descriptor, group } = started;
    if (
      started.names.length !== 1 ||
      descriptor.preparedContext.actionIdentity.actionId !== "archive" ||
      descriptor.preparedContext.role !== "author" ||
      !descriptor.applicableChecks?.length
    )
      throw Error("archive-start-invalid");
    const reviewOriginal = started.previous;
    if (
      reviewOriginal?.context.actionIdentity.actionId !== "review-apply" ||
      reviewOriginal.result.reviewerVerdict !== "approved"
    )
      throw Error("archive-review-invalid");
    const review = await effectiveRecord(target, reviewOriginal);
    const authorOriginal = started.records.find(
      (record) => record.context.runId === review.context.previousRunId,
    );
    if (authorOriginal === undefined) throw Error("archive-candidate-unbound");
    const author = await effectiveRecord(target, authorOriginal);
    const ordinal = await readProjectOrdinal(target);
    const relative = archiveEffectsRoot(target, group, target.runId);
    let pre = await readArchivePrestate(target, group, target.runId);
    const existingPrestate = pre !== null;
    const assertCurrent = async () => {
      const latest = await inspectStartedAction(target, installation);
      if (
        !isDeepStrictEqual(latest.descriptor, descriptor) ||
        latest.names.length !== 1 ||
        latest.previous?.context.runId !== review.context.runId
      )
        throw Error("archive-current-drift");
    };
    if (pre === null) {
      await checkReviewCandidate(target, author, review.result.facts);
      const observed = await observeOpenSpecChangeStatus({
        ...target,
        installation,
      });
      const tasks = await readFile(
        path.join(
          target.repositoryRoot,
          "openspec/changes",
          target.changeId,
          "tasks.md",
        ),
        "utf8",
      );
      if (
        !observed.isPlanningComplete ||
        !tasks.includes("- [x]") ||
        /^- \[ \]/m.test(tasks)
      )
        throw Error("archive-planning-incomplete");
      const converged = await archiveReadiness(
        {
          ...target,
          actionId: "archive",
          role: "author",
          applicableChecks: descriptor.applicableChecks,
        },
        review,
        installation,
        { trigger: "archive", runId: target.runId },
      );
      const date = openSpecArchiveDate();
      const coordinationPath = `openspec/delivery-groups/${target.deliveryId}.yaml`;
      const coordination = await readFile(
        path.join(target.repositoryRoot, coordinationPath),
      );
      pre = {
        formatVersion: 1,
        deliveryId: target.deliveryId,
        changeId: target.changeId,
        runId: target.runId,
        descriptorSha256: sha256(Buffer.from(started.markdown)),
        authorRunId: author.context.runId,
        reviewRunId: review.context.runId,
        sourcePath: `openspec/changes/${target.changeId}`,
        defaultPath: `openspec/changes/archive/${date}-${target.changeId}`,
        archivePath: `openspec/changes/archive/${date}-${String(ordinal).padStart(3, "0")}-${target.changeId}`,
        sourceFiles: converged.sourceFiles,
        candidate: author.result.facts.artifactHashes as Record<string, string>,
        specsBefore: converged.specsBefore,
        specsAfter: converged.specsAfter,
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
      if ((await observeArchiveEffects(target, pre)).effect !== "none")
        throw Error("archive-prestate-drift");
      await saveArchiveObservation(target, relative, "prestate", pre);
    }
    archivePath = pre.archivePath;
    const archiveDate = pre.defaultPath.slice(
      "openspec/changes/archive/".length,
      "openspec/changes/archive/".length + 10,
    );
    if (
      pre.descriptorSha256 !== sha256(Buffer.from(started.markdown)) ||
      pre.authorRunId !== author.context.runId ||
      pre.reviewRunId !== review.context.runId ||
      pre.archivePath !==
        `openspec/changes/archive/${archiveDate}-${String(ordinal).padStart(3, "0")}-${target.changeId}` ||
      !isDeepStrictEqual(pre.candidate, author.result.facts.artifactHashes) ||
      review.result.facts.reviewedRunId !== author.context.runId
    )
      throw Error("archive-prestate-binding-invalid");
    let observed = await observeArchiveEffects(target, pre);
    effect = observed.effect;
    if (effect === "unknown") throw Error("archive-effects-unknown");
    if (effect === "none") {
      assertOpenSpecArchiveDate(pre.defaultPath, target.changeId);
      if (existingPrestate) {
        const converged = await archiveReadiness(
          {
            ...target,
            actionId: "archive",
            role: "author",
            applicableChecks: descriptor.applicableChecks,
          },
          review,
          installation,
          { trigger: "archive", runId: target.runId },
        );
        if (
          !isDeepStrictEqual(converged.sourceFiles, pre.sourceFiles) ||
          !isDeepStrictEqual(converged.specsBefore, pre.specsBefore) ||
          !isDeepStrictEqual(converged.specsAfter, pre.specsAfter)
        )
          throw Error("archive-convergence-prestate-drift");
      }
      await assertCurrent();
      await saveArchiveObservation(target, relative, "openspec-intent", {
        runId: target.runId,
        descriptorSha256: pre.descriptorSha256,
      });
      const attempt = await archiveDiagnosticAttempt(
        target.repositoryRoot,
        target.deliveryId,
        group,
        { ...target, trigger: "archive", candidate: pre.candidate },
      );
      const tool = await resolveManagedTool({
        flowkitHome: target.flowkitHome,
        installation,
        toolId: "openspec",
      });
      effect = "openspec-unknown";
      await runArchiveProcess(
        target.repositoryRoot,
        attempt,
        "openspec-archive",
        process.execPath,
        [tool.entrypoint, "archive", target.changeId, "--yes", "--json"],
        target.repositoryRoot,
        { timeout: 120_000 },
      );
      observed = await observeArchiveEffects(target, pre);
      if (observed.effect !== "openspec")
        throw Error("archive-materialization-unconfirmed");
      effect = "openspec";
    }
    if (effect === "openspec") {
      await assertCurrent();
      await saveArchiveObservation(target, relative, "openspec-observed", {
        runId: target.runId,
        defaultPath: pre.defaultPath,
        sourceFiles: pre.sourceFiles,
        specsAfter: pre.specsAfter,
      });
      await rename(
        path.join(target.repositoryRoot, pre.defaultPath),
        path.join(target.repositoryRoot, pre.archivePath),
      );
      observed = await observeArchiveEffects(target, pre);
      if (observed.effect !== "archived")
        throw Error("archive-rename-unconfirmed");
      effect = "archived";
    }
    if (effect === "archived") {
      await assertCurrent();
      await saveArchiveObservation(target, relative, "rename-observed", {
        runId: target.runId,
        archivePath: pre.archivePath,
        sourceFiles: pre.sourceFiles,
      });
      effect = "coordination-unknown";
      await writeChangeState(
        target.repositoryRoot,
        target.deliveryId,
        target.changeId,
        "active",
        "completed",
      );
      observed = await observeArchiveEffects(target, pre);
      if (observed.effect !== "completed")
        throw Error("archive-coordination-unconfirmed");
      effect = "completed";
    }
    if (effect === "completed") {
      await assertCurrent();
      await saveArchiveObservation(target, relative, "openspec-intent", {
        runId: target.runId,
        descriptorSha256: pre.descriptorSha256,
      });
      await saveArchiveObservation(target, relative, "openspec-observed", {
        runId: target.runId,
        defaultPath: pre.defaultPath,
        sourceFiles: pre.sourceFiles,
        specsAfter: pre.specsAfter,
      });
      await saveArchiveObservation(target, relative, "rename-observed", {
        runId: target.runId,
        archivePath: pre.archivePath,
        sourceFiles: pre.sourceFiles,
      });
      await saveArchiveObservation(target, relative, "coordination-observed", {
        runId: target.runId,
        path: pre.coordination.path,
        beforeSha256: pre.coordination.beforeSha256,
        afterSha256: pre.coordination.afterSha256,
      });
      return {
        status: "completed",
        effect: "archive-and-coordination",
        archivePath,
        projectOrdinal: ordinal,
        runId: target.runId,
        archiveMaterialRefs: await archiveMaterialRefs(target, relative),
      };
    }
    throw Error("archive-effects-unknown");
  } catch (error) {
    return {
      status: "incomplete",
      effect,
      archivePath,
      runId: target.runId,
      reason: error instanceof Error ? error.message : "archive-failed",
    };
  }
}
