import {
  evaluateCheckpointAuthorization,
  type CheckpointAuthorizationInput,
} from "../cli/checkpoint-authorization.js";
import { isSemanticId } from "./identity.js";
import {
  cloneCheckpointOperation,
  isDeliveryCheckpointOperation,
  type DeliveryCheckpointOperation,
} from "./delivery-repository-integration-operation.js";
import {
  executeScopedCheckpoint,
  gitHostOutcome,
  type GitHostOutcome,
} from "../internal/git-checkpoint-execution.js";
import {
  gitBytes,
  gitText,
  readGitPosition,
  requireGitRoot,
} from "../internal/git-checkpoint-scope.js";

export type GitPushOperation = {
  readonly kind: "push";
  readonly localCommit: string;
  readonly remote: string;
  readonly targetRef: string;
};
export interface GitHostRequest {
  readonly targetRoot: string;
  readonly node:
    "delivery-start" | "change-checkpoint" | "repository-integration";
  readonly deliveryId: string;
  readonly changeId: string | null;
  readonly ownerSourceRef: string;
  readonly expectedBranch: string;
  readonly operation: DeliveryCheckpointOperation | GitPushOperation;
}

/** Trusted host capability over actual Owner input, not a caller-supplied approval bit. */
export type ReadGitHostAuthority = (sourceRef: string) => Promise<{
  readonly request: GitHostRequest;
  readonly checkpointAuthorization?: CheckpointAuthorizationInput;
} | null>;

function isPush(value: GitHostRequest["operation"]): value is GitPushOperation {
  return (
    value?.kind === "push" &&
    Object.keys(value).sort().join() === "kind,localCommit,remote,targetRef" &&
    /^[a-f0-9]{40}$/.test(value.localCommit) &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value.remote) &&
    /^refs\/heads\/[^\s:~^?*[\\]+$/.test(value.targetRef) &&
    !value.targetRef.includes("..")
  );
}

export function snapshotGitHostRequest(input: GitHostRequest): GitHostRequest {
  if (
    !input ||
    Object.keys(input).sort().join() !==
      "changeId,deliveryId,expectedBranch,node,operation,ownerSourceRef,targetRoot" ||
    !["delivery-start", "change-checkpoint", "repository-integration"].includes(
      input.node,
    ) ||
    !isSemanticId(input.deliveryId) ||
    (input.node === "change-checkpoint"
      ? !isSemanticId(input.changeId)
      : input.changeId !== null) ||
    typeof input.ownerSourceRef !== "string" ||
    !input.ownerSourceRef ||
    /[\r\n\0]/.test(input.ownerSourceRef) ||
    typeof input.expectedBranch !== "string" ||
    !input.expectedBranch ||
    typeof input.targetRoot !== "string" ||
    (!isPush(input.operation) &&
      !isDeliveryCheckpointOperation(input.operation))
  )
    throw Error("Git host request 无效");
  return {
    targetRoot: input.targetRoot,
    node: input.node,
    deliveryId: input.deliveryId,
    changeId: input.changeId,
    ownerSourceRef: input.ownerSourceRef,
    expectedBranch: input.expectedBranch,
    operation: isPush(input.operation)
      ? {
          kind: "push",
          localCommit: input.operation.localCommit,
          remote: input.operation.remote,
          targetRef: input.operation.targetRef,
        }
      : cloneCheckpointOperation(input.operation),
  };
}

export async function verifyGitHostAuthority(
  request: GitHostRequest,
  read: ReadGitHostAuthority,
): Promise<boolean> {
  try {
    const material = await read(request.ownerSourceRef);
    if (
      !material ||
      JSON.stringify(snapshotGitHostRequest(material.request)) !==
        JSON.stringify(request)
    )
      return false;
    if (request.node !== "change-checkpoint") return true;
    const checkpoint = material.checkpointAuthorization;
    return (
      checkpoint !== undefined &&
      checkpoint.deliveryId === request.deliveryId &&
      checkpoint.changeId === request.changeId &&
      checkpoint.ownerAuthority?.sourceRef === request.ownerSourceRef &&
      evaluateCheckpointAuthorization(checkpoint).authorized
    );
  } catch {
    return false;
  }
}

export async function runCheckpoint(
  input: GitHostRequest,
  read: ReadGitHostAuthority,
): Promise<GitHostOutcome> {
  try {
    const request = snapshotGitHostRequest(input);
    if (request.node === "repository-integration" || isPush(request.operation))
      throw Error("此入口仅处理普通 checkpoint");
    return await executeScopedCheckpoint(
      request.targetRoot,
      request.expectedBranch,
      request.operation,
      () => verifyGitHostAuthority(request, read),
    );
  } catch (error) {
    return gitHostOutcome(
      "incomplete",
      "preflight",
      String(error),
      null,
      "none",
      ["核对普通 checkpoint 输入及真实 Owner 来源"],
    );
  }
}

async function readRemote(
  root: string,
  operation: GitPushOperation,
): Promise<string | null> {
  const value = await gitText(root, [
    "ls-remote",
    "--refs",
    "--",
    operation.remote,
    operation.targetRef,
  ]);
  if (!value) return null;
  const lines = value.split("\n");
  if (lines.length !== 1) throw Error("远端 exact ref 不唯一");
  const [commit, ref] = lines[0].split("\t");
  if (ref !== operation.targetRef || !/^[a-f0-9]{40}$/.test(commit))
    throw Error("远端 ref 无法确认");
  return commit;
}

export async function runPush(
  input: GitHostRequest,
  read: ReadGitHostAuthority,
): Promise<GitHostOutcome> {
  let request: GitHostRequest | undefined;
  let checkpoint: string | null = null;
  let remoteCommit: string | null = null;
  let phase: GitHostOutcome["phase"] = "preflight";
  let effect: GitHostOutcome["effect"] = "none";
  try {
    request = snapshotGitHostRequest(input);
    const operation = request.operation;
    if (!isPush(operation)) throw Error("此入口只支持 exact 非强制 push");
    const root = request.targetRoot;
    await requireGitRoot(root);
    const position = await readGitPosition(root);
    if (
      position.branch !== request.expectedBranch ||
      !(await verifyGitHostAuthority(request, read))
    )
      throw Error("push 权限或分支不符");
    if (
      (await gitText(root, [
        "rev-parse",
        "--verify",
        `${operation.localCommit}^{commit}`,
      ])) !== operation.localCommit
    )
      throw Error("本地对象不可确认");
    checkpoint = operation.localCommit;
    await gitBytes(root, ["check-ref-format", operation.targetRef]);
    const remoteUrl = await gitText(root, [
      "remote",
      "get-url",
      "--push",
      "--all",
      operation.remote,
    ]);
    const fetchUrl = await gitText(root, [
      "remote",
      "get-url",
      operation.remote,
    ]);
    if (!remoteUrl || remoteUrl.includes("\n") || remoteUrl !== fetchUrl)
      throw Error("须明确单一且可读回的 push remote");
    const preRemote = await readRemote(root, operation);
    await requireGitRoot(root);
    if (
      JSON.stringify(await readGitPosition(root)) !==
        JSON.stringify(position) ||
      !(await verifyGitHostAuthority(request, read)) ||
      (await gitText(root, [
        "remote",
        "get-url",
        "--push",
        "--all",
        operation.remote,
      ])) !== remoteUrl ||
      (await gitText(root, ["remote", "get-url", operation.remote])) !==
        fetchUrl ||
      (await readRemote(root, operation)) !== preRemote
    )
      throw Error("push 来源或目标漂移");
    phase = "publication";
    effect = "unknown";
    await gitBytes(root, [
      "push",
      "--no-force",
      "--no-follow-tags",
      "--",
      operation.remote,
      `${operation.localCommit}:${operation.targetRef}`,
    ]);
    phase = "readback";
    remoteCommit = await readRemote(root, operation);
    if (remoteCommit !== checkpoint) throw Error("远端本次读回不等于授权对象");
    return gitHostOutcome(
      "completed",
      "readback",
      null,
      checkpoint,
      "confirmed",
      [],
      remoteCommit,
    );
  } catch (error) {
    if (effect !== "none" && request && isPush(request.operation)) {
      try {
        remoteCommit = await readRemote(request.targetRoot, request.operation);
        effect = remoteCommit === checkpoint ? "confirmed" : "unknown";
      } catch {
        remoteCommit = null;
        effect = "unknown";
      }
    }
    return gitHostOutcome(
      "incomplete",
      phase,
      String(error),
      checkpoint,
      effect,
      ["核对远端本次状态及权限；不自动重推或 PR/merge"],
      remoteCommit,
    );
  }
}
