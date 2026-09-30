import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, rename, realpath } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual, promisify } from "node:util";
import {
  parseRunOccurrenceId,
  readDurableRun,
} from "../domain/run-result-persistence.js";
import { resolveManagedTool } from "../domain/managed-tool-resolution.js";
import { resolveActionGuidanceRef } from "../domain/action-guidance-execution.js";
import { observeOpenSpecChangeStatus } from "../domain/openspec-observation.js";
import { readDescriptor } from "./action-descriptor.js";
import { policyForRecord, resolveRunChain } from "./current-run-chain.js";
import { archiveReadiness, readProjectOrdinal } from "./action-readiness.js";
import { readCoordinationManifest } from "./trusted-change-coordination.js";
import { writeChangeState } from "../internal/change-coordination-write.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { openSpecArchiveDate } from "../internal/openspec-archive-date.js";

const run = promisify(execFile);
const digest = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

export async function archiveChange(
  request: Record<string, unknown>,
  installation: ManagerInstallation,
): Promise<Record<string, unknown>> {
  const root = request.repositoryRoot as string;
  const deliveryId = request.deliveryId as string;
  const changeId = request.changeId as string;
  const runId = request.runId as string;
  let effect:
    "none" | "openspec-unknown" | "archived" | "coordination-unknown" = "none";
  let archivePath: string | null = null;
  try {
    const occurrence = parseRunOccurrenceId(runId);
    if (occurrence?.actionId !== "archive")
      throw new Error("archive-run-invalid");
    const group = path.join(root, ".flowkit", "runs", deliveryId);
    const matches = (await readdir(group)).filter((name) =>
      name.endsWith("-" + changeId),
    );
    if (matches.length !== 1) throw new Error("archive-run-group-ambiguous");
    const sequence = Number(matches[0].slice(0, -(changeId.length + 1)));
    if (!Number.isSafeInteger(sequence) || sequence < 1)
      throw new Error("archive-run-group-invalid");
    const directory = path.join(group, matches[0], runId);
    const { descriptor } = await readDescriptor(directory);
    if (
      (await readdir(directory)).sort().join() !== "action.md" ||
      descriptor.repositoryRoot !== root ||
      descriptor.changeStartSequence !== sequence ||
      descriptor.preparedContext.runId !== runId ||
      descriptor.preparedContext.role !== "author" ||
      descriptor.preparedContext.actionIdentity.deliveryId !== deliveryId ||
      descriptor.preparedContext.actionIdentity.changeId !== changeId ||
      descriptor.preparedContext.actionIdentity.actionId !== "archive"
    )
      throw new Error("archive-start-invalid");
    const reviewId = descriptor.preparedContext.previousRunId;
    const assertCurrentArchive = async () => {
      const groups = (await readdir(group)).filter((name) =>
        name.endsWith("-" + changeId),
      );
      if (groups.length !== 1 || groups[0] !== matches[0])
        throw new Error("archive-run-group-ambiguous");
      const reread = await readDescriptor(directory);
      if (!isDeepStrictEqual(reread.descriptor, descriptor))
        throw new Error("archive-start-drift");
      const entries = await readdir(path.join(group, matches[0]));
      if (entries.filter((entry) => entry === runId).length !== 1)
        throw new Error("archive-current-invalid");
      const records = [];
      for (const entry of entries) {
        const parsed = parseRunOccurrenceId(entry);
        if (parsed === null) throw new Error("archive-run-chain-invalid");
        if (entry === runId) continue;
        records.push(
          await readDurableRun({
            repositoryRoot: root,
            deliveryId,
            changeId,
            changeStartSequence: sequence,
            occurrence: parsed,
          }),
        );
      }
      const current = resolveRunChain(records);
      const guidance = await resolveActionGuidanceRef(installation, "archive");
      if (
        current?.context.runId !== reviewId ||
        descriptor.actionPackage.runId !== runId ||
        descriptor.actionPackage.previousRunId !== reviewId ||
        descriptor.actionPackage.role !== "author" ||
        !isDeepStrictEqual(descriptor.actionPackage.actionIdentity, {
          deliveryId,
          changeId,
          actionId: "archive",
        }) ||
        !isDeepStrictEqual(descriptor.actionPackage.guidanceRef, guidance) ||
        !isDeepStrictEqual(
          policyForRecord(current, {
            deliveryId,
            changeId,
            changeState: "active",
          }),
          { kind: "ready-action", actionId: "archive" },
        ) ||
        (await readdir(directory)).sort().join() !== "action.md"
      )
        throw new Error("archive-current-invalid");
      return current;
    };
    await assertCurrentArchive();
    const reviewOccurrence = parseRunOccurrenceId(reviewId);
    if (reviewOccurrence?.actionId !== "review-apply")
      throw new Error("archive-review-invalid");
    const review = await readDurableRun({
      repositoryRoot: root,
      deliveryId,
      changeId,
      changeStartSequence: sequence,
      occurrence: reviewOccurrence,
    });
    if (
      review.context.role !== "reviewer" ||
      review.context.lifecycleState !== "terminal" ||
      review.result.reviewerVerdict !== "approved"
    )
      throw new Error("archive-review-invalid");
    const authorId = review.result.facts.reviewedRunId;
    const authorOccurrence = parseRunOccurrenceId(authorId);
    if (authorOccurrence === null) throw new Error("archive-candidate-unbound");
    const author = await readDurableRun({
      repositoryRoot: root,
      deliveryId,
      changeId,
      changeStartSequence: sequence,
      occurrence: authorOccurrence,
    });
    if (
      author.context.role !== "author" ||
      author.result.authorConclusion !== "PASS" ||
      author.context.runId !== review.context.previousRunId
    )
      throw new Error("archive-candidate-unbound");
    const hashes = author.result.facts.artifactHashes;
    if (
      typeof hashes !== "object" ||
      hashes === null ||
      Array.isArray(hashes) ||
      !Object.keys(hashes).length
    )
      throw new Error("archive-candidate-unbound");
    for (const [relative, hash] of Object.entries(hashes)) {
      if (
        !relative ||
        relative.includes("\\") ||
        relative
          .split("/")
          .some((part) => !part || part === "." || part === "..") ||
        typeof hash !== "string" ||
        !/^[0-9a-f]{64}$/.test(hash)
      )
        throw new Error("archive-candidate-invalid");
      let candidate = await realpath(root);
      for (const segment of relative.split("/")) {
        candidate = path.join(candidate, segment);
        if ((await lstat(candidate)).isSymbolicLink())
          throw new Error("archive-candidate-linked");
      }
      if (
        !(await lstat(candidate)).isFile() ||
        digest(await readFile(candidate)) !== hash
      )
        throw new Error("archive-candidate-drift");
    }
    const manifest = await readCoordinationManifest(root, deliveryId);
    if (
      manifest.id !== deliveryId ||
      manifest.changes.filter(
        (change) => change.id === changeId && change.state === "active",
      ).length !== 1
    )
      throw new Error("archive-coordination-invalid");
    const ordinal = await readProjectOrdinal({
      repositoryRoot: root,
      deliveryId,
      changeId,
      flowkitHome: request.flowkitHome as string,
    });
    if (!Number.isSafeInteger(ordinal) || !ordinal || ordinal < 1)
      throw new Error("archive-ordinal-invalid");
    if (!descriptor.applicableChecks?.length)
      throw new Error("archive-applicable-checks-unbound");
    await archiveReadiness(
      {
        repositoryRoot: root,
        flowkitHome: request.flowkitHome as string,
        deliveryId,
        changeId,
        actionId: "archive",
        role: "author",
        applicableChecks: descriptor.applicableChecks,
      },
      review,
      installation,
    );
    const openSpec = await observeOpenSpecChangeStatus({
      repositoryRoot: root,
      flowkitHome: request.flowkitHome as string,
      changeId,
      installation,
    });
    if (!openSpec.isPlanningComplete)
      throw new Error("archive-planning-incomplete");
    const tasks = await readFile(
      path.join(root, "openspec", "changes", changeId, "tasks.md"),
      "utf8",
    );
    if (!tasks.includes("- [x]") || /^- \[ \]/m.test(tasks))
      throw new Error("archive-tasks-incomplete");
    const tool = await resolveManagedTool({
      flowkitHome: request.flowkitHome as string,
      installation,
      toolId: "openspec",
    });
    await run(
      process.execPath,
      [tool.entrypoint, "validate", changeId, "--strict"],
      { cwd: root, timeout: 120_000, windowsHide: true },
    );
    const date = openSpecArchiveDate();
    const archiveRoot = path.join(root, "openspec", "changes", "archive");
    const defaultTarget = path.join(archiveRoot, `${date}-${changeId}`);
    const exactName = `${date}-${String(ordinal).padStart(3, "0")}-${changeId}`;
    const exactTarget = path.join(archiveRoot, exactName);
    for (const target of [defaultTarget, exactTarget]) {
      const exists = await lstat(target).catch((error) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      });
      if (exists) throw new Error("archive-target-collision");
    }
    await assertCurrentArchive();
    effect = "openspec-unknown";
    await run(
      process.execPath,
      [tool.entrypoint, "archive", changeId, "--yes", "--json"],
      {
        cwd: root,
        timeout: 120_000,
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true,
      },
    );
    if (!(await lstat(defaultTarget)).isDirectory())
      throw new Error("archive-materialization-unconfirmed");
    const sourceAfter = await lstat(
      path.join(root, "openspec", "changes", changeId),
    ).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    });
    if (
      sourceAfter !== null ||
      !(await lstat(path.join(defaultTarget, "tasks.md"))).isFile()
    )
      throw new Error("archive-source-not-moved");
    await rename(defaultTarget, exactTarget);
    effect = "archived";
    archivePath = `openspec/changes/archive/${exactName}`;
    if (!(await lstat(exactTarget)).isDirectory())
      throw new Error("archive-materialization-unconfirmed");
    effect = "coordination-unknown";
    await writeChangeState(root, deliveryId, changeId, "active", "completed");
    const completed = await readCoordinationManifest(root, deliveryId);
    if (
      completed.changes.filter(
        (change) => change.id === changeId && change.state === "completed",
      ).length !== 1
    )
      throw new Error("archive-coordination-unconfirmed");
    return {
      status: "completed",
      effect: "archive-and-coordination",
      archivePath,
      projectOrdinal: ordinal,
      runId,
    };
  } catch (error) {
    return {
      status: "incomplete",
      effect,
      archivePath,
      runId,
      reason: error instanceof Error ? error.message : "archive-failed",
    };
  }
}
