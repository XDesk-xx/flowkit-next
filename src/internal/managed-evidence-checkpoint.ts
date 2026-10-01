import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { isExactGitPath } from "../domain/delivery-repository-integration-operation.js";
import {
  isRunContextRecord,
  isRunResultRecord,
} from "../domain/run-result-persistence.js";
import { gitBytes } from "./git-checkpoint-scope.js";
import { readCandidateRunChain } from "./git-index-run-chain.js";

type CandidateChain = Awaited<ReturnType<typeof readCandidateRunChain>>;

function addedPaths(bytes: Buffer): string[] {
  const value = bytes.toString("utf8");
  if (!Buffer.from(value).equals(bytes) || (value && !value.endsWith("\0"))) {
    throw Error("无法解释新增证据路径");
  }
  const paths = value ? value.slice(0, -1).split("\0") : [];
  if (!paths.every(isExactGitPath)) throw Error("新增证据路径无效");
  return paths;
}

async function declaredProof(
  root: string,
  relativePath: string,
  candidates: Map<string, CandidateChain>,
): Promise<{ bytes: number; sha256: string }> {
  const match =
    /^\.flowkit\/artifacts\/([^/]+)\/changes\/([^/]+)\/proof\/([^/]+)\/.+$/u.exec(
      relativePath,
    );
  if (!match) throw Error(`Managed proof path invalid: ${relativePath}`);
  const [, deliveryId, changeId, runId] = match;
  const deliveryRuns = path.join(root, ".flowkit", "runs", deliveryId);
  const changeRoots = (await readdir(deliveryRuns)).filter(
    (name) => /^\d{3,}-.+$/u.test(name) && name.endsWith(`-${changeId}`),
  );
  if (changeRoots.length !== 1) {
    throw Error(`Managed proof Run owner unavailable: ${relativePath}`);
  }
  const resultPath = path.join(
    deliveryRuns,
    changeRoots[0]!,
    runId,
    "result.json",
  );
  const contextPath = path.join(path.dirname(resultPath), "context.json");
  const relativeResult = path.relative(root, resultPath).replaceAll("\\", "/");
  const relativeContext = path
    .relative(root, contextPath)
    .replaceAll("\\", "/");
  let indexedResult: Buffer;
  let indexedContext: Buffer;
  let worktreeResult: Buffer;
  let worktreeContext: Buffer;
  try {
    [indexedResult, indexedContext, worktreeResult, worktreeContext] =
      await Promise.all([
        gitBytes(root, ["show", `:${relativeResult}`]),
        gitBytes(root, ["show", `:${relativeContext}`]),
        readFile(resultPath),
        readFile(contextPath),
      ]);
  } catch {
    throw Error("Managed proof owner Run unavailable: " + relativePath);
  }
  if (
    !indexedResult.equals(worktreeResult) ||
    !indexedContext.equals(worktreeContext)
  ) {
    throw Error(`Managed proof owner index bytes differ: ${relativePath}`);
  }
  let result: unknown;
  let context: unknown;
  try {
    result = JSON.parse(indexedResult.toString("utf8")) as unknown;
    context = JSON.parse(indexedContext.toString("utf8")) as unknown;
  } catch {
    throw Error("Managed proof owner Run invalid: " + relativePath);
  }
  if (
    !isRunResultRecord(result) ||
    !isRunContextRecord(context) ||
    (context.lifecycleState !== "terminal" &&
      context.lifecycleState !== "prepared") ||
    context.runId !== runId ||
    context.actionIdentity.deliveryId !== deliveryId ||
    context.actionIdentity.changeId !== changeId ||
    result.runId !== runId ||
    result.actionIdentity.deliveryId !== deliveryId ||
    result.actionIdentity.changeId !== changeId
  ) {
    throw Error(`Managed proof Result invalid: ${relativePath}`);
  }
  if (context.lifecycleState === "prepared") {
    const key = `${deliveryId}/${changeId}`;
    let candidate = candidates.get(key);
    if (candidate === undefined) {
      candidate = await readCandidateRunChain(root, deliveryId!, changeId!);
      candidates.set(key, candidate);
    }
    const owner = candidate.records.find(
      (record) => record.context.runId === runId,
    );
    const children = candidate.records.filter(
      (record) => record.context.previousRunId === runId,
    );
    if (
      owner?.context.lifecycleState !== "prepared" ||
      candidate.tip.context.runId === runId ||
      children.length !== 1 ||
      relativeResult !== `${candidate.runRoot}/${runId}/result.json`
    )
      throw Error(`Managed proof prepared chain invalid: ${relativePath}`);
    for (const name of ["action.md", "context.json", "result.json"]) {
      const indexedPath = `${candidate.runRoot}/${runId}/${name}`;
      const indexed = candidate.bytesByPath.get(indexedPath);
      if (
        indexed === undefined ||
        !indexed.equals(await readFile(path.join(root, indexedPath)))
      )
        throw Error(`Managed proof owner index bytes differ: ${indexedPath}`);
    }
  }
  const refs = result.facts.proofRefs;
  if (!Array.isArray(refs)) {
    throw Error(`Managed proof has no Result proofRefs: ${relativePath}`);
  }
  const matching = refs.filter(
    (ref) =>
      typeof ref === "object" &&
      ref !== null &&
      !Array.isArray(ref) &&
      ref.path === relativePath &&
      ref.deliveryId === deliveryId &&
      ref.changeId === changeId &&
      ref.runId === runId,
  );
  if (matching.length !== 1) {
    throw Error(
      `Managed proof declaration missing or ambiguous: ${relativePath}`,
    );
  }
  const ref = matching[0] as Record<string, unknown>;
  if (
    typeof ref.bytes !== "number" ||
    !Number.isSafeInteger(ref.bytes) ||
    ref.bytes < 0 ||
    typeof ref.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/u.test(ref.sha256)
  ) {
    throw Error(`Managed proof declaration invalid: ${relativePath}`);
  }
  return { bytes: ref.bytes, sha256: ref.sha256 };
}

/** Call only after scoped staging, immediately before a create-new commit. */
export async function requireNewManagedEvidenceBytes(
  root: string,
): Promise<void> {
  const candidates = new Map<string, CandidateChain>();
  const paths = addedPaths(
    await gitBytes(root, [
      "diff",
      "--cached",
      "--no-renames",
      "--diff-filter=A",
      "--name-only",
      "-z",
      "--",
    ]),
  ).filter(
    (name) =>
      name.startsWith(".flowkit/runs/") ||
      name.startsWith(".flowkit/artifacts/"),
  );
  for (const relativePath of paths) {
    const worktree = await readFile(path.join(root, relativePath));
    const indexed = await gitBytes(root, ["show", `:${relativePath}`]);
    if (!indexed.equals(worktree)) {
      throw Error(`Managed evidence index bytes differ: ${relativePath}`);
    }
    if (
      !/^\.flowkit\/artifacts\/[^/]+\/changes\/[^/]+\/proof\/[^/]+\//u.test(
        relativePath,
      )
    ) {
      continue;
    }
    const ref = await declaredProof(root, relativePath, candidates);
    if (
      indexed.length !== ref.bytes ||
      createHash("sha256").update(indexed).digest("hex") !== ref.sha256
    ) {
      throw Error(`Managed proof differs from Result: ${relativePath}`);
    }
  }
}
