import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { isExactGitPath } from "../domain/delivery-repository-integration-operation.js";
import {
  isRunContextRecord,
  isRunResultRecord,
} from "../domain/run-result-persistence.js";
import { gitBytes } from "./git-checkpoint-scope.js";

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
  let result: unknown;
  let context: unknown;
  try {
    result = JSON.parse(await readFile(resultPath, "utf8")) as unknown;
    context = JSON.parse(
      await readFile(
        path.join(path.dirname(resultPath), "context.json"),
        "utf8",
      ),
    ) as unknown;
  } catch {
    throw Error("Managed proof terminal Run unavailable: " + relativePath);
  }
  if (
    !isRunResultRecord(result) ||
    !isRunContextRecord(context) ||
    context.lifecycleState !== "terminal" ||
    context.runId !== runId ||
    context.actionIdentity.deliveryId !== deliveryId ||
    context.actionIdentity.changeId !== changeId ||
    result.runId !== runId ||
    result.actionIdentity.deliveryId !== deliveryId ||
    result.actionIdentity.changeId !== changeId
  ) {
    throw Error(`Managed proof Result invalid: ${relativePath}`);
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
    const ref = await declaredProof(root, relativePath);
    if (
      indexed.length !== ref.bytes ||
      createHash("sha256").update(indexed).digest("hex") !== ref.sha256
    ) {
      throw Error(`Managed proof differs from Result: ${relativePath}`);
    }
  }
}
