import {
  isDeliveryCheckpointOperation,
  type DeliveryCheckpointOperation,
} from "../domain/delivery-repository-integration-operation.js";
import { requireNewManagedEvidenceBytes } from "./managed-evidence-checkpoint.js";
import {
  gitBytes,
  gitText,
  readGitPosition,
  readIndexFingerprint,
  requireGitRoot,
  requireIndexScope,
  requireNoPendingGitOperation,
  scopeWorktreeFingerprint,
  verifyCheckpointObjects,
} from "./git-checkpoint-scope.js";

export interface GitHostOutcome {
  readonly status: "completed" | "incomplete";
  readonly phase:
    | "preflight"
    | "stage"
    | "commit"
    | "publication"
    | "acceptance"
    | "readback";
  readonly reason: string | null;
  readonly observed: {
    readonly checkpointCommit: string | null;
    readonly remoteCommit: string | null;
  };
  readonly effect: "none" | "confirmed" | "unknown";
  readonly remaining: readonly string[];
}

export function gitHostOutcome(
  status: GitHostOutcome["status"],
  phase: GitHostOutcome["phase"],
  reason: string | null,
  checkpointCommit: string | null,
  effect: GitHostOutcome["effect"],
  remaining: readonly string[],
  remoteCommit: string | null = null,
): GitHostOutcome {
  return {
    status,
    phase,
    reason,
    observed: { checkpointCommit, remoteCommit },
    effect,
    remaining,
  };
}

/** This capability re-reads the already-decided authority AND relevant target before every write. */
export async function executeScopedCheckpoint(
  root: string,
  expectedBranch: string,
  operation: DeliveryCheckpointOperation,
  revalidate: () => Promise<boolean>,
): Promise<GitHostOutcome> {
  let phase: GitHostOutcome["phase"] = "preflight";
  let effect: GitHostOutcome["effect"] = "none";
  let before: string | null = null;
  let checkpoint: string | null = null;
  try {
    if (!isDeliveryCheckpointOperation(operation))
      throw Error("checkpointOperation 无效");
    await requireGitRoot(root);
    const position = await readGitPosition(root);
    before = position.head;
    if (position.branch !== expectedBranch || !(await revalidate()))
      throw Error("分支或 Owner 来源不匹配");
    if (operation.kind === "reuse-existing") {
      if (
        (await gitText(root, [
          "rev-parse",
          "--verify",
          `${operation.checkpointCommit}^{commit}`,
        ])) !== operation.checkpointCommit
      )
        throw Error("复用对象不可确认");
      return gitHostOutcome(
        "completed",
        "readback",
        null,
        operation.checkpointCommit,
        "none",
        [],
      );
    }
    await requireNoPendingGitOperation(root);
    await requireIndexScope(root, operation.paths);
    const worktree = await scopeWorktreeFingerprint(root, operation.paths);
    let index = await readIndexFingerprint(root);
    const validate = async () => {
      await requireGitRoot(root);
      const current = await readGitPosition(root);
      if (
        current.head !== before ||
        current.branch !== expectedBranch ||
        !(await revalidate())
      )
        throw Error("权限、HEAD 或分支漂移");
      await requireNoPendingGitOperation(root);
      await requireIndexScope(root, operation.paths);
      if (
        (await scopeWorktreeFingerprint(root, operation.paths)) !== worktree ||
        (await readIndexFingerprint(root)) !== index
      )
        throw Error("相关目标或 index 漂移");
    };
    await validate();
    phase = "stage";
    effect = "unknown";
    await gitBytes(root, [
      "add",
      "--",
      ...operation.paths.map((p) => `:(literal)${p}`),
    ]);
    effect = "confirmed";
    index = await readIndexFingerprint(root);
    await validate();
    // Re-read immediately before commit, including the full pending index.
    await validate();
    await requireNewManagedEvidenceBytes(root);
    phase = "commit";
    effect = "unknown";
    await gitBytes(root, ["commit", "-m", operation.commitMessage]);
    phase = "readback";
    const after = await readGitPosition(root);
    checkpoint = after.head;
    if (
      checkpoint === null ||
      after.branch !== expectedBranch ||
      !(await verifyCheckpointObjects(root, before, checkpoint, operation))
    )
      throw Error("实际提交对象、范围或指定形状不符");
    return gitHostOutcome(
      "completed",
      "readback",
      null,
      checkpoint,
      "confirmed",
      [],
    );
  } catch (error) {
    if (effect !== "none") {
      try {
        const observed = await readGitPosition(root);
        if (observed.head !== before) checkpoint = observed.head;
        await readIndexFingerprint(root);
        effect =
          checkpoint !== null || phase === "stage" ? "confirmed" : "unknown";
      } catch {
        effect = "unknown";
      }
    }
    return gitHostOutcome(
      "incomplete",
      phase,
      error instanceof Error ? error.message : String(error),
      checkpoint,
      effect,
      [
        effect === "none"
          ? "核对本次权限、范围和目标后显式调用"
          : "保留现有 index/对象，核对已有副作用后明确复用或人工处理",
      ],
    );
  }
}
