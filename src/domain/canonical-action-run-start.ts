import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { assertManagedEvidenceGitBytes } from "../internal/managed-evidence-git.js";
import { isCurrentAction, type CurrentAction } from "./action-lifecycle.js";
import {
  formActionPackage,
  type ActionPackage,
} from "./action-package-result-admission.js";
import {
  resolveActionGuidanceRef,
  type ActionGuidanceRef,
} from "./action-guidance-execution.js";
import {
  buildRunAddress,
  isRunContextRecord,
  parseRunOccurrenceId,
  type RunAddressInput,
  type RunContextRecord,
} from "./run-result-persistence.js";

export interface StartedCanonicalActionRun {
  readonly input: RunAddressInput;
  readonly directory: string;
  readonly actionMarkdown: string;
  readonly currentAction: CurrentAction;
  readonly preparedContext: RunContextRecord;
  readonly actionPackage: ActionPackage;
}

export type CanonicalStartReadiness = (
  actionPackage: ActionPackage,
) => "ready" | "blocked" | Promise<"ready" | "blocked">;

function sameGuidance(
  actual: ActionGuidanceRef,
  expected: ActionGuidanceRef,
): boolean {
  return (
    actual.path === expected.path &&
    actual.contentSha256 === expected.contentSha256
  );
}

async function createControlledRunDirectory(
  input: RunAddressInput,
  runId: string,
): Promise<{ root: string; directory: string }> {
  const address = buildRunAddress(input);
  if (address === null || address.runId !== runId)
    throw new Error("Invalid controlled Run address");
  const root = await realpath(address.repositoryRoot);
  if (root !== address.repositoryRoot)
    throw new Error("Run repository root is not canonical");
  const relative = path.relative(root, address.changeRoot);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Run address escapes repository root");
  }
  let parent = root;
  for (const segment of relative.split(path.sep)) {
    parent = path.join(parent, segment);
    try {
      await mkdir(parent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    if (
      (await lstat(parent)).isSymbolicLink() ||
      (await realpath(parent)) !== parent
    ) {
      throw new Error("Run parent is linked or escaped");
    }
  }
  for (const name of await readdir(parent)) {
    const occurrence = parseRunOccurrenceId(name);
    if (occurrence === null) throw new Error(`Invalid Run entry: ${name}`);
    if (occurrence.sequence === input.occurrence.sequence) {
      throw new Error(`Run sequence already exists: ${occurrence.sequence}`);
    }
  }
  const directory = path.join(parent, runId);
  await mkdir(directory);
  return { root, directory };
}

/** This is the provenance-bearing start seam; package shape checks alone are not. */
export async function startCanonicalActionRun(
  installation: unknown,
  input: RunAddressInput,
  currentAction: unknown,
  preparedContext: unknown,
  expectedGuidanceRef: ActionGuidanceRef | null,
  prepare: CanonicalStartReadiness,
): Promise<StartedCanonicalActionRun> {
  if (!isCurrentAction(currentAction) || !isRunContextRecord(preparedContext)) {
    throw new Error("Invalid prepared Action or Run context");
  }
  if (typeof prepare !== "function")
    throw new Error("Missing package-bound readiness");
  const address = buildRunAddress(input);
  if (address === null) throw new Error("Invalid controlled Run address");
  if (
    preparedContext.runId !== address.runId ||
    preparedContext.actionIdentity.deliveryId !== input.deliveryId ||
    preparedContext.actionIdentity.changeId !== input.changeId ||
    preparedContext.actionIdentity.actionId !== input.occurrence.actionId
  ) {
    throw new Error("Run address does not match prepared Action");
  }
  const guidanceRef = await resolveActionGuidanceRef(
    installation,
    currentAction.identity.actionId,
  );
  if (guidanceRef === null)
    throw new Error("Current manager Guidance unavailable");
  if (
    expectedGuidanceRef !== null &&
    !sameGuidance(guidanceRef, expectedGuidanceRef)
  ) {
    throw new Error("Expected Guidance differs from current manager bytes");
  }
  const actionPackage = formActionPackage(
    currentAction,
    preparedContext,
    guidanceRef,
  );
  if (actionPackage === null) throw new Error("Invalid prepared ActionPackage");
  const preparedPackage = structuredClone(actionPackage);
  const preparedAddress = structuredClone(address);
  if ((await prepare(actionPackage)) !== "ready") {
    throw new Error("Package-bound preparation blocked");
  }
  const currentGuidance = await resolveActionGuidanceRef(
    installation,
    currentAction.identity.actionId,
  );
  if (currentGuidance === null || !sameGuidance(currentGuidance, guidanceRef)) {
    throw new Error("Manager Guidance changed before Run start");
  }
  const reboundPackage = formActionPackage(
    currentAction,
    preparedContext,
    currentGuidance,
  );
  if (
    reboundPackage === null ||
    !isDeepStrictEqual(reboundPackage, preparedPackage) ||
    !isDeepStrictEqual(actionPackage, preparedPackage) ||
    !isDeepStrictEqual(buildRunAddress(input), preparedAddress)
  ) {
    throw new Error("Prepared package or address changed before Run start");
  }
  const runRelative = path
    .relative(address.repositoryRoot, address.runDirectory)
    .split(path.sep)
    .join("/");
  for (const name of ["action.md", "context.json", "result.json"]) {
    await assertManagedEvidenceGitBytes(
      address.repositoryRoot,
      runRelative + "/" + name,
    );
  }
  const { root, directory } = await createControlledRunDirectory(
    input,
    address.runId,
  );
  const actionMarkdown =
    "# Action started\n\n" +
    JSON.stringify(
      {
        startedAt: new Date().toISOString(),
        repositoryRoot: root,
        actionPackage: reboundPackage,
      },
      null,
      2,
    ) +
    "\n";
  await writeFile(path.join(directory, "action.md"), actionMarkdown, {
    flag: "wx",
  });
  if (
    (await readFile(path.join(directory, "action.md"), "utf8")) !==
    actionMarkdown
  ) {
    throw new Error("Started Run readback mismatch");
  }
  return {
    input: { ...input, repositoryRoot: root },
    directory,
    actionMarkdown,
    currentAction,
    preparedContext,
    actionPackage: reboundPackage,
  };
}
