import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { isMap, isScalar, isSeq, parseDocument } from "yaml";
import type { ActionTarget } from "../cli/action-request.js";
import { controlledBytes, sha256 } from "../cli/run-effective-facts.js";
import { parseFoundationCliRequestJson } from "../cli/request.js";
import { assertManagedEvidenceGitBytes } from "./managed-evidence-git.js";
import {
  affectedSpecHashes,
  directoryHashes,
  type FileHashes,
} from "./archive-file-identities.js";

export interface ArchivePrestate {
  readonly formatVersion: 1;
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
  readonly specsAfter: Readonly<Record<string, string | null>>;
  readonly coordination: {
    readonly path: string;
    readonly beforeText: string;
    readonly beforeSha256: string;
    readonly afterSha256: string;
  };
}
export function archiveEffectsRoot(
  target: ActionTarget,
  group: string,
  runId: string,
) {
  return `.flowkit/artifacts/${target.deliveryId}/changes/${group}/archive-effects/${runId}`;
}
export function archiveCoordinationAfter(
  bytes: Buffer,
  deliveryId: string,
  changeId: string,
): Buffer {
  const source = bytes.toString("utf8");
  if (!Buffer.from(source).equals(bytes))
    throw Error("Coordination UTF-8 required");
  const doc = parseDocument(source, { keepSourceTokens: true });
  const changes = doc.get("changes", true);
  if (
    doc.errors.length ||
    !isMap(doc.contents) ||
    doc.get("id") !== deliveryId ||
    !isSeq(changes)
  )
    throw Error("Archive coordination invalid");
  const exact = changes.items.filter(
    (item) => isMap(item) && item.get("id") === changeId,
  );
  if (
    exact.length !== 1 ||
    !isMap(exact[0]) ||
    exact[0].get("state") !== "active"
  )
    throw Error("Archive coordination prestate invalid");
  const state = exact[0].get("state", true);
  if (!isScalar(state) || !state.range)
    throw Error("Archive coordination state unpatchable");
  return Buffer.from(
    source.slice(0, state.range[0]) +
      "completed" +
      source.slice(state.range[1]),
  );
}
export async function saveArchiveObservation(
  target: ActionTarget,
  relative: string,
  name: string,
  value: object,
) {
  const file = `${relative}/${name}.json`;
  await assertManagedEvidenceGitBytes(target.repositoryRoot, file);
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  const existing = await controlledBytes(target.repositoryRoot, file).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    },
  );
  if (existing !== null) {
    if (!existing.equals(bytes))
      throw Error(`Archive observation conflict: ${file}`);
    return { path: file, bytes: bytes.length, sha256: sha256(bytes) };
  }
  await mkdir(path.join(target.repositoryRoot, relative), { recursive: true });
  try {
    await writeFile(path.join(target.repositoryRoot, file), bytes, {
      flag: "wx",
    });
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code !== "EEXIST" ||
      !(await controlledBytes(target.repositoryRoot, file)).equals(bytes)
    )
      throw error;
  }
  return { path: file, bytes: bytes.length, sha256: sha256(bytes) };
}
export async function readArchivePrestate(
  target: ActionTarget,
  group: string,
  runId: string,
): Promise<ArchivePrestate | null> {
  const relative = archiveEffectsRoot(target, group, runId);
  let bytes: Buffer;
  try {
    bytes = await controlledBytes(
      target.repositoryRoot,
      `${relative}/prestate.json`,
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const names = await readdir(
        path.join(target.repositoryRoot, relative),
      ).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      if (names.length) throw Error("Partial archive prestate materials");
      return null;
    }
    throw error;
  }
  const pre = parseFoundationCliRequestJson(
    bytes.toString("utf8"),
  ) as ArchivePrestate;
  if (
    typeof pre !== "object" ||
    pre === null ||
    Array.isArray(pre) ||
    Object.keys(pre).sort().join(",") !==
      "archivePath,authorRunId,candidate,changeId,coordination,defaultPath,deliveryId,descriptorSha256,formatVersion,reviewRunId,runId,sourceFiles,sourcePath,specsAfter,specsBefore" ||
    typeof pre.coordination !== "object" ||
    pre.coordination === null ||
    Object.keys(pre.coordination).sort().join(",") !==
      "afterSha256,beforeSha256,beforeText,path" ||
    typeof pre.coordination.beforeText !== "string" ||
    typeof pre.archivePath !== "string" ||
    !/^[0-9a-f]{64}$/.test(pre.descriptorSha256) ||
    !/^\d{8}-\d{3,}-(apply|revise-apply)$/.test(pre.authorRunId) ||
    !/^\d{8}-\d{3,}-review-apply$/.test(pre.reviewRunId)
  )
    throw Error("Archive prestate shape invalid");
  for (const hashes of [
    pre.sourceFiles,
    pre.candidate,
    pre.specsBefore,
    pre.specsAfter,
  ])
    if (typeof hashes !== "object" || hashes === null || Array.isArray(hashes))
      throw Error("Archive identities invalid");
  const date = pre.archivePath.slice(
    "openspec/changes/archive/".length,
    "openspec/changes/archive/".length + 10,
  );
  if (
    pre.formatVersion !== 1 ||
    pre.deliveryId !== target.deliveryId ||
    pre.changeId !== target.changeId ||
    pre.runId !== runId ||
    pre.sourcePath !== `openspec/changes/${target.changeId}` ||
    !/^openspec\/changes\/archive\/\d{4}-\d{2}-\d{2}-[0-9]{3,}-[a-z0-9-]+$/.test(
      pre.archivePath,
    ) ||
    !pre.archivePath.endsWith(`-${target.changeId}`) ||
    pre.defaultPath !== `openspec/changes/archive/${date}-${target.changeId}` ||
    !isDeepStrictEqual(
      Object.keys(pre.specsBefore).sort(),
      Object.keys(pre.specsAfter).sort(),
    ) ||
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
    throw Error("Archive pre/postcondition identity invalid");
  for (const hashes of [
    pre.sourceFiles,
    pre.candidate,
    pre.specsBefore,
    pre.specsAfter,
  ]) {
    if (typeof hashes !== "object" || hashes === null || Array.isArray(hashes))
      throw Error("Archive identities invalid");
    for (const [relative, hash] of Object.entries(hashes))
      if (
        !relative ||
        relative.includes("\\") ||
        relative
          .split("/")
          .some((part) => !part || part === "." || part === "..") ||
        (hash !== null && !/^[0-9a-f]{64}$/.test(hash))
      )
        throw Error("Archive identities invalid");
  }
  if (
    !Object.keys(pre.sourceFiles).length ||
    !Object.keys(pre.candidate).length
  )
    throw Error("Archive identities missing");
  if (
    Object.values(pre.sourceFiles).some((hash) => hash === null) ||
    Object.values(pre.candidate).some((hash) => hash === null) ||
    !isDeepStrictEqual(
      Object.keys(pre.specsBefore).sort(),
      Object.keys(
        await affectedSpecHashes(target.repositoryRoot, pre.sourceFiles),
      ).sort(),
    )
  )
    throw Error("Archive spec/source identities invalid");
  return pre;
}
export async function observeArchiveEffects(
  target: ActionTarget,
  pre: ArchivePrestate,
) {
  const observations = await validateArchiveObservations(target, pre);
  const source = await directoryHashes(target.repositoryRoot, pre.sourcePath);
  const defaultArchive = await directoryHashes(
    target.repositoryRoot,
    pre.defaultPath,
  );
  const exact = await directoryHashes(target.repositoryRoot, pre.archivePath);
  const specs = await affectedSpecHashes(
    target.repositoryRoot,
    pre.sourceFiles,
  );
  const coordination = sha256(
    await controlledBytes(target.repositoryRoot, pre.coordination.path),
  );
  for (const [relative, hash] of Object.entries(pre.candidate)) {
    if (
      relative.startsWith(pre.sourcePath + "/") ||
      Object.hasOwn(pre.specsAfter, relative) ||
      relative === pre.coordination.path
    )
      continue;
    if (sha256(await controlledBytes(target.repositoryRoot, relative)) !== hash)
      throw Error(`Archived candidate drift: ${relative}`);
  }
  if (
    isDeepStrictEqual(source, pre.sourceFiles) &&
    defaultArchive === null &&
    exact === null &&
    isDeepStrictEqual(specs, pre.specsBefore) &&
    coordination === pre.coordination.beforeSha256
  )
    return {
      effect: observations.some((name) => name.endsWith("-observed.json"))
        ? ("unknown" as const)
        : ("none" as const),
      remaining: observations.some((name) => name.endsWith("-observed.json"))
        ? []
        : ["preflight", "openspec", "rename", "coordination", "finish"],
    };
  if (source === null && isDeepStrictEqual(specs, pre.specsAfter)) {
    if (
      isDeepStrictEqual(defaultArchive, pre.sourceFiles) &&
      exact === null &&
      coordination === pre.coordination.beforeSha256 &&
      !observations.includes("rename-observed.json") &&
      !observations.includes("coordination-observed.json")
    )
      return {
        effect: "openspec" as const,
        remaining: ["rename", "coordination", "finish"],
      };
    if (defaultArchive === null && isDeepStrictEqual(exact, pre.sourceFiles)) {
      if (
        coordination === pre.coordination.beforeSha256 &&
        !observations.includes("coordination-observed.json")
      )
        return {
          effect: "archived" as const,
          remaining: ["coordination", "finish"],
        };
      if (coordination === pre.coordination.afterSha256)
        return { effect: "completed" as const, remaining: ["finish"] };
    }
  }
  return { effect: "unknown" as const, remaining: [] };
}

async function validateArchiveObservations(
  target: ActionTarget,
  pre: ArchivePrestate,
) {
  const groupRoot = path.join(
    target.repositoryRoot,
    ".flowkit/runs",
    target.deliveryId,
  );
  const groups = (await readdir(groupRoot)).filter((group) =>
    group.endsWith(`-${target.changeId}`),
  );
  if (groups.length !== 1)
    throw Error("Archive observations have no unique Run group");
  const relative = archiveEffectsRoot(target, groups[0], pre.runId);
  const names: string[] = await readdir(
    path.join(target.repositoryRoot, relative),
  ).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const expected: Record<string, object> = {
    "openspec-intent.json": {
      runId: pre.runId,
      descriptorSha256: pre.descriptorSha256,
    },
    "openspec-observed.json": {
      runId: pre.runId,
      defaultPath: pre.defaultPath,
      sourceFiles: pre.sourceFiles,
      specsAfter: pre.specsAfter,
    },
    "rename-observed.json": {
      runId: pre.runId,
      archivePath: pre.archivePath,
      sourceFiles: pre.sourceFiles,
    },
    "coordination-observed.json": {
      runId: pre.runId,
      path: pre.coordination.path,
      beforeSha256: pre.coordination.beforeSha256,
      afterSha256: pre.coordination.afterSha256,
    },
  };
  for (const name of names) {
    if (name === "prestate.json") continue;
    if (
      !Object.hasOwn(expected, name) ||
      !isDeepStrictEqual(
        parseFoundationCliRequestJson(
          (
            await controlledBytes(target.repositoryRoot, `${relative}/${name}`)
          ).toString("utf8"),
        ),
        expected[name],
      )
    )
      throw Error(`Archive observation conflict: ${relative}/${name}`);
  }
  return names;
}
export async function archiveMaterialRefs(
  target: ActionTarget,
  relative: string,
) {
  const names = (
    await readdir(path.join(target.repositoryRoot, relative))
  ).sort();
  if (
    !isDeepStrictEqual(names, [
      "coordination-observed.json",
      "openspec-intent.json",
      "openspec-observed.json",
      "prestate.json",
      "rename-observed.json",
    ])
  )
    throw Error("Archive observations incomplete");
  const refs = [];
  const pre = parseFoundationCliRequestJson(
    (
      await controlledBytes(target.repositoryRoot, `${relative}/prestate.json`)
    ).toString("utf8"),
  ) as ArchivePrestate;
  const expected: Record<string, object> = {
    "openspec-intent.json": {
      runId: pre.runId,
      descriptorSha256: pre.descriptorSha256,
    },
    "openspec-observed.json": {
      runId: pre.runId,
      defaultPath: pre.defaultPath,
      sourceFiles: pre.sourceFiles,
      specsAfter: pre.specsAfter,
    },
    "rename-observed.json": {
      runId: pre.runId,
      archivePath: pre.archivePath,
      sourceFiles: pre.sourceFiles,
    },
    "coordination-observed.json": {
      runId: pre.runId,
      path: pre.coordination.path,
      beforeSha256: pre.coordination.beforeSha256,
      afterSha256: pre.coordination.afterSha256,
    },
  };
  for (const name of names) {
    const file = `${relative}/${name}`;
    const bytes = await controlledBytes(target.repositoryRoot, file);
    if (
      name !== "prestate.json" &&
      !isDeepStrictEqual(
        parseFoundationCliRequestJson(bytes.toString("utf8")),
        expected[name],
      )
    )
      throw Error(`Archive observation binding invalid: ${file}`);
    await assertManagedEvidenceGitBytes(target.repositoryRoot, file);
    refs.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) });
  }
  return refs;
}
