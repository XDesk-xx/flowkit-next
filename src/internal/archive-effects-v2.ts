import { readdir } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { ActionTarget } from "../cli/action-request.js";
import { controlledBytes, sha256 } from "../cli/run-effective-facts.js";
import { isExactGitPath } from "../domain/delivery-repository-integration-operation.js";
import { assertManagedEvidenceGitBytes } from "./managed-evidence-git.js";
import {
  affectedSpecHashes,
  directoryHashes,
  type FileHashes,
} from "./archive-file-identities.js";
import {
  archiveCoordinationAfter,
  archiveEffectsRoot,
} from "./archive-effects.js";
import { isCandidateGit } from "./candidate-git-facts.js";

export interface ArchivePrestateV2 {
  readonly formatVersion: 2;
  readonly deliveryId: string;
  readonly changeId: string;
  readonly runId: string;
  readonly descriptorSha256: string;
  readonly authorRunId: string;
  readonly reviewRunId: string;
  readonly sourcePath: string;
  readonly defaultPath: string;
  readonly archivePath: string;
  readonly sourceFiles: FileHashes;
  readonly candidate: FileHashes;
  readonly specsBefore: Readonly<Record<string, string | null>>;
  readonly defaultBefore: FileHashes | null;
  readonly archiveBefore: FileHashes | null;
  readonly coordination: {
    readonly path: string;
    readonly beforeText: string;
    readonly beforeSha256: string;
    readonly afterSha256: string;
  };
}
export async function archiveJson(target: ActionTarget, relative: string) {
  try {
    return JSON.parse(
      (await controlledBytes(target.repositoryRoot, relative)).toString("utf8"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
export async function readArchiveV2(
  target: ActionTarget,
  group: string,
  runId: string,
): Promise<ArchivePrestateV2 | null> {
  const pre = (await archiveJson(
    target,
    `${archiveEffectsRoot(target, group, runId)}/prestate.json`,
  )) as ArchivePrestateV2 | null;
  if (pre === null) return null;
  if (
    pre.formatVersion !== 2 ||
    pre.deliveryId !== target.deliveryId ||
    pre.changeId !== target.changeId ||
    pre.runId !== runId ||
    Object.keys(pre).sort().join() !==
      "archiveBefore,archivePath,authorRunId,candidate,changeId,coordination,defaultBefore,defaultPath,deliveryId,descriptorSha256,formatVersion,reviewRunId,runId,sourceFiles,sourcePath,specsBefore" ||
    pre.sourcePath !== `openspec/changes/${target.changeId}` ||
    !new RegExp(
      `^openspec/changes/archive/\\d{4}-\\d{2}-\\d{2}-\\d{3,}-${target.changeId}$`,
    ).test(pre.archivePath) ||
    pre.defaultPath !==
      `${pre.archivePath.slice(0, "openspec/changes/archive/".length + 10)}-${target.changeId}` ||
    !/^[a-f0-9]{64}$/.test(pre.descriptorSha256) ||
    !/^\d{8}-\d{3,}-(apply|revise-apply)$/.test(pre.authorRunId) ||
    !/^\d{8}-\d{3,}-review-apply$/.test(pre.reviewRunId) ||
    pre.coordination.path !==
      `openspec/delivery-groups/${target.deliveryId}.yaml` ||
    sha256(Buffer.from(pre.coordination.beforeText)) !==
      pre.coordination.beforeSha256 ||
    sha256(
      archiveCoordinationAfter(
        Buffer.from(pre.coordination.beforeText),
        target.deliveryId,
        target.changeId,
      ),
    ) !== pre.coordination.afterSha256
  )
    throw Error("Archive v2 prestate binding invalid");
  for (const hashes of [
    pre.sourceFiles,
    pre.candidate,
    pre.specsBefore,
    pre.defaultBefore,
    pre.archiveBefore,
  ]) {
    if (hashes === null) continue;
    if (
      typeof hashes !== "object" ||
      Array.isArray(hashes) ||
      !Object.entries(hashes).every(
        ([file, hash]) =>
          isExactGitPath(file) &&
          (hash === null || /^[a-f0-9]{64}$/.test(hash)),
      )
    )
      throw Error("Archive v2 hashes invalid");
  }
  if (
    !Object.keys(pre.sourceFiles).length ||
    !Object.keys(pre.candidate).length ||
    !isDeepStrictEqual(
      Object.keys(pre.specsBefore).sort(),
      Object.keys(
        await affectedSpecHashes(target.repositoryRoot, pre.sourceFiles),
      ).sort(),
    )
  )
    throw Error("Archive v2 controlled input set invalid");
  return pre;
}

export async function archiveV2Snapshot(
  target: ActionTarget,
  pre: ArchivePrestateV2,
) {
  return {
    source: await directoryHashes(target.repositoryRoot, pre.sourcePath),
    defaultArchive: await directoryHashes(
      target.repositoryRoot,
      pre.defaultPath,
    ),
    archive: await directoryHashes(target.repositoryRoot, pre.archivePath),
    specs: await affectedSpecHashes(target.repositoryRoot, pre.sourceFiles),
    coordinationSha256: sha256(
      await controlledBytes(target.repositoryRoot, pre.coordination.path),
    ),
  };
}

export async function observeArchiveV2(
  target: ActionTarget,
  group: string,
  pre: ArchivePrestateV2,
) {
  const relative = archiveEffectsRoot(target, group, pre.runId);
  const actual = await archiveV2Snapshot(target, pre);
  const intent = await archiveJson(target, `${relative}/openspec-intent.json`);
  const result = await archiveJson(target, `${relative}/openspec-result.json`);
  if (
    intent &&
    (intent.runId !== pre.runId ||
      intent.descriptorSha256 !== pre.descriptorSha256 ||
      Object.keys(intent).sort().join() !== "descriptorSha256,runId")
  )
    throw Error("Archive intent mismatch");
  if (
    result &&
    (!intent ||
      result.runId !== pre.runId ||
      (result.error !== null && typeof result.error !== "string") ||
      result.descriptorSha256 !== pre.descriptorSha256 ||
      typeof result.invoked !== "boolean" ||
      Object.keys(result).sort().join() !==
        "commandRef,descriptorSha256,error,invoked,runId,toolEntrypoint,toolVersion" ||
      (result.invoked
        ? result.toolVersion !== "1.10.0" ||
          typeof result.toolEntrypoint !== "string" ||
          !path.isAbsolute(result.toolEntrypoint)
        : result.commandRef !== null ||
          !(
            (result.toolEntrypoint === null && result.toolVersion === null) ||
            (result.toolVersion === "1.10.0" &&
              typeof result.toolEntrypoint === "string" &&
              path.isAbsolute(result.toolEntrypoint))
          )))
  )
    throw Error("Archive process binding mismatch");
  let stopped = result?.invoked === false;
  let success = false;
  if (result?.commandRef) {
    const prefix = `.flowkit/artifacts/${target.deliveryId}/changes/${group}/archive-diagnostics/`;
    if (
      typeof result.commandRef !== "string" ||
      !result.commandRef.startsWith(prefix) ||
      !/\/[a-f0-9-]{36}\/commands\/openspec-archive\/command\.json$/.test(
        result.commandRef,
      )
    )
      throw Error("Archive command locator invalid");
    const command = await archiveJson(target, result.commandRef);
    const attemptRef =
      result.commandRef.slice(0, result.commandRef.indexOf("/commands/")) +
      "/attempt.json";
    const attempt = await archiveJson(target, attemptRef);
    if (
      !attempt ||
      attempt.repositoryRoot !== target.repositoryRoot ||
      attempt.deliveryId !== pre.deliveryId ||
      attempt.changeId !== pre.changeId ||
      attempt.runId !== pre.runId ||
      attempt.trigger !== "archive" ||
      !isDeepStrictEqual(attempt.candidate, pre.candidate)
    )
      throw Error("Archive attempt source binding invalid");
    if (
      !command ||
      Object.keys(command).sort().join() !==
        "args,cwd,exitCode,finishedAt,id,program,saveError,signal,spawnError,startedAt,status,stderr,stdout,timeout,truncated" ||
      command.id !== "openspec-archive" ||
      (command.exitCode !== null &&
        (!Number.isInteger(command.exitCode) || command.exitCode < 0)) ||
      [command.signal, command.spawnError, command.saveError].some(
        (value) => value !== null && typeof value !== "string",
      ) ||
      typeof command.timeout !== "boolean" ||
      !command.truncated ||
      Object.keys(command.truncated).sort().join() !== "stderr,stdout" ||
      typeof command.truncated.stdout !== "boolean" ||
      typeof command.truncated.stderr !== "boolean" ||
      !["passed", "failed", "process-failed"].includes(command.status) ||
      typeof command.startedAt !== "string" ||
      typeof command.finishedAt !== "string" ||
      !Number.isFinite(Date.parse(command.startedAt)) ||
      Date.parse(command.finishedAt) < Date.parse(command.startedAt) ||
      !Number.isFinite(Date.parse(command.finishedAt)) ||
      command.cwd !== target.repositoryRoot ||
      command.program !== process.execPath ||
      !isDeepStrictEqual(command.args, [
        result.toolEntrypoint,
        "archive",
        target.changeId,
        "--yes",
        "--json",
      ]) ||
      command.stdout !==
        result.commandRef.replace("command.json", "stdout.txt") ||
      command.stderr !== result.commandRef.replace("command.json", "stderr.txt")
    )
      throw Error("Archive command provenance invalid");
    stopped =
      command.saveError === null &&
      (command.exitCode !== null ||
        command.signal !== null ||
        command.spawnError !== null);
    success =
      stopped &&
      command.status === "passed" &&
      command.exitCode === 0 &&
      !command.timeout &&
      command.spawnError === null &&
      command.signal === null &&
      !command.truncated.stdout &&
      !command.truncated.stderr;
    if (
      (await controlledBytes(target.repositoryRoot, command.stdout)).length >
        16 * 1024 * 1024 ||
      (await controlledBytes(target.repositoryRoot, command.stderr)).length >
        16 * 1024 * 1024
    )
      throw Error("Archive raw diagnostic exceeds limit");
  }
  const unchanged =
    isDeepStrictEqual(actual.source, pre.sourceFiles) &&
    isDeepStrictEqual(actual.specs, pre.specsBefore) &&
    isDeepStrictEqual(actual.defaultArchive, pre.defaultBefore) &&
    isDeepStrictEqual(actual.archive, pre.archiveBefore) &&
    actual.coordinationSha256 === pre.coordination.beforeSha256;
  for (const [file, hash] of Object.entries(pre.candidate)) {
    if (
      file.startsWith(pre.sourcePath + "/") ||
      Object.hasOwn(pre.specsBefore, file) ||
      file === pre.coordination.path
    )
      continue;
    if (sha256(await controlledBytes(target.repositoryRoot, file)) !== hash)
      throw Error(`Archive candidate drift: ${file}`);
  }
  if (unchanged)
    return {
      effect: stopped && !success ? "failed" : !intent ? "none" : "unknown",
      actual,
      success,
    };
  const observed = await archiveJson(
    target,
    `${relative}/openspec-observed.json`,
  );
  if (
    !success ||
    !observed ||
    observed.runId !== pre.runId ||
    Object.keys(observed).sort().join() !==
      "defaultPath,runId,sourceFiles,specsAfter" ||
    observed.defaultPath !== pre.defaultPath ||
    !isDeepStrictEqual(observed.sourceFiles, pre.sourceFiles) ||
    !isDeepStrictEqual(observed.specsAfter, actual.specs)
  )
    return { effect: "unknown", actual, success };
  if (
    actual.source === null &&
    pre.defaultBefore === null &&
    pre.archiveBefore === null
  ) {
    if (
      isDeepStrictEqual(actual.defaultArchive, pre.sourceFiles) &&
      actual.archive === null &&
      actual.coordinationSha256 === pre.coordination.beforeSha256
    )
      return { effect: "openspec", actual, success };
    if (
      actual.defaultArchive === null &&
      isDeepStrictEqual(actual.archive, pre.sourceFiles)
    ) {
      if (actual.coordinationSha256 === pre.coordination.beforeSha256)
        return { effect: "archived", actual, success };
      if (actual.coordinationSha256 === pre.coordination.afterSha256)
        return { effect: "completed", actual, success };
    }
  }
  return { effect: "unknown", actual, success };
}

export async function archiveV2Refs(
  target: ActionTarget,
  group: string,
  runId: string,
) {
  const relative = archiveEffectsRoot(target, group, runId);
  const names = (
    await readdir(path.join(target.repositoryRoot, relative))
  ).sort();
  const allowed = new Set([
    "prestate.json",
    "openspec-intent.json",
    "openspec-result.json",
    "openspec-observed.json",
    "rename-observed.json",
    "coordination-observed.json",
    "git-projection.json",
    "failure.json",
  ]);
  if (names.some((name) => !allowed.has(name)))
    throw Error("Unknown Archive v2 material");
  const paths = names.map((name) => `${relative}/${name}`);
  const result = await archiveJson(target, `${relative}/openspec-result.json`);
  if (result?.commandRef) {
    const prefix = `.flowkit/artifacts/${target.deliveryId}/changes/${group}/archive-diagnostics/`;
    if (
      typeof result.commandRef !== "string" ||
      !result.commandRef.startsWith(prefix) ||
      !/\/[a-f0-9-]{36}\/commands\/openspec-archive\/command\.json$/.test(
        result.commandRef,
      )
    )
      throw Error("Archive material command locator invalid");
    paths.push(
      result.commandRef.slice(0, result.commandRef.indexOf("/commands/")) +
        "/attempt.json",
      result.commandRef,
      result.commandRef.replace("command.json", "stdout.txt"),
      result.commandRef.replace("command.json", "stderr.txt"),
    );
  }
  const refs = [];
  for (const file of paths.sort()) {
    await assertManagedEvidenceGitBytes(target.repositoryRoot, file);
    const bytes = await controlledBytes(target.repositoryRoot, file);
    refs.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) });
  }
  return refs;
}

export async function readArchiveV2Projection(
  target: ActionTarget,
  group: string,
  runId: string,
) {
  const value = await archiveJson(
    target,
    `${archiveEffectsRoot(target, group, runId)}/git-projection.json`,
  );
  if (!isCandidateGit(value))
    throw Error("Archive destination projection missing or invalid");
  return value;
}
