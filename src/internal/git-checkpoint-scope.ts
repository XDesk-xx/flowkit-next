import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  isExactGitPath,
  type DeliveryCheckpointOperation,
} from "../domain/delivery-repository-integration-operation.js";
import { observeGitParents } from "./delivery-repository-integration-git.js";

const exec = promisify(execFile);
const SHA = /^[a-f0-9]{40}$/;

/** Buffer/NUL path observations must not use the older trimmed text reader. */
export async function gitBytes(
  root: string,
  args: readonly string[],
): Promise<Buffer> {
  const { stdout } = await exec("git", [...args], {
    cwd: root,
    encoding: "buffer",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

export async function gitText(
  root: string,
  args: readonly string[],
): Promise<string> {
  return (await gitBytes(root, args)).toString("utf8").trim();
}

function pathsFromNul(bytes: Buffer): string[] {
  const value = bytes.toString("utf8");
  if (
    !Buffer.from(value).equals(bytes) ||
    (value !== "" && !value.endsWith("\0"))
  )
    throw Error("无法解释 Git 路径编码");
  const paths = value === "" ? [] : value.slice(0, -1).split("\0");
  if (!paths.every(isExactGitPath)) throw Error("Git 返回不受支持的路径");
  return paths;
}

export async function requireGitRoot(root: string): Promise<void> {
  if (!path.isAbsolute(root)) throw Error("targetRoot 必须是绝对 Git 根");
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_COMMON_DIR",
  ]) {
    if (process.env[key]) throw Error(`环境 ${key} 会重定向 Git 目标`);
  }
  const observed = await gitText(root, ["rev-parse", "--show-toplevel"]);
  if ((await realpath(root)) !== (await realpath(observed)))
    throw Error("targetRoot 不是实际 Git 根");
  if (await gitText(root, ["rev-parse", "--show-superproject-working-tree"]))
    throw Error("本宿主不处理 submodule target");
}

export async function readGitPosition(
  root: string,
): Promise<{ branch: string; head: string | null }> {
  const branch = await gitText(root, [
    "symbolic-ref",
    "--quiet",
    "--short",
    "HEAD",
  ]);
  const head = await gitText(root, [
    "for-each-ref",
    "--format=%(objectname)",
    `refs/heads/${branch}`,
  ]);
  if (head !== "" && !SHA.test(head)) throw Error("无法确认 HEAD");
  return { branch, head: head || null };
}

export async function readPendingPaths(root: string): Promise<string[]> {
  if ((await gitBytes(root, ["ls-files", "--unmerged", "-z"])).length)
    throw Error("index 存在未合并条目");
  // --no-renames yields both deletion/addition paths, including rename endpoints.
  return pathsFromNul(
    await gitBytes(root, [
      "diff",
      "--cached",
      "--name-only",
      "--no-renames",
      "-z",
      "--",
    ]),
  );
}

/** A plain commit must not continue a separate merge/rebase/sequencer operation. */
export async function requireNoPendingGitOperation(
  root: string,
): Promise<void> {
  const gitDir = await gitText(root, ["rev-parse", "--absolute-git-dir"]);
  for (const name of [
    "MERGE_HEAD",
    "CHERRY_PICK_HEAD",
    "REVERT_HEAD",
    "rebase-merge",
    "rebase-apply",
    "sequencer",
  ]) {
    const state = await lstat(path.join(gitDir, name)).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (state !== null)
      throw Error(`普通 checkpoint 不接续待完成 Git 操作: ${name}`);
  }
}

export async function requireIndexScope(
  root: string,
  paths: readonly string[],
): Promise<void> {
  const outside = (await readPendingPaths(root)).filter(
    (p) => !paths.includes(p),
  );
  if (outside.length) throw Error(`范围外 staged: ${outside.join(", ")}`);
}

export async function scopeWorktreeFingerprint(
  root: string,
  paths: readonly string[],
): Promise<string> {
  const hash = createHash("sha256");
  for (const file of paths) {
    let absent = false;
    const parts = file.split("/");
    for (let i = 1; i <= parts.length; i++) {
      const name = path.join(root, ...parts.slice(0, i));
      const stat = await lstat(name).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (stat === null) {
        absent = true;
        break;
      }
      if (
        stat.isSymbolicLink() ||
        (i < parts.length ? !stat.isDirectory() : !stat.isFile())
      )
        throw Error(`无法安全解释目标: ${file}`);
    }
    const tracked = await gitBytes(root, [
      "ls-files",
      "--stage",
      "-z",
      "--",
      `:(literal)${file}`,
    ]);
    if (tracked.toString("utf8").startsWith("160000 "))
      throw Error(`不支持 submodule: ${file}`);
    hash.update(JSON.stringify(file)).update(absent ? "absent" : "file");
    if (!absent) hash.update(await readFile(path.join(root, file)));
  }
  return hash.digest("hex");
}

export async function readIndexFingerprint(root: string): Promise<string> {
  return createHash("sha256")
    .update(await gitBytes(root, ["ls-files", "--stage", "-z"]))
    .digest("hex");
}

export async function verifyCheckpointObjects(
  root: string,
  before: string | null,
  after: string,
  operation: Extract<DeliveryCheckpointOperation, { kind: "create-new" }>,
): Promise<boolean> {
  try {
    if (!SHA.test(after) || after === before) return false;
    const commits = (
      await gitText(root, [
        "rev-list",
        after,
        ...(before ? [`^${before}`] : []),
        "--",
      ])
    ).split("\n");
    if (!commits.length || !commits.every((c) => SHA.test(c))) return false;
    for (const commit of commits) {
      const paths = pathsFromNul(
        await gitBytes(root, [
          "diff-tree",
          "--root",
          "-m",
          "--no-commit-id",
          "--name-only",
          "--no-renames",
          "-r",
          "-z",
          commit,
          "--",
        ]),
      );
      if (paths.some((p) => !operation.paths.includes(p))) return false;
    }
    const shape = operation.commitShape;
    return (
      shape === null ||
      (commits.length === shape.count &&
        JSON.stringify(await observeGitParents(root, after)) ===
          JSON.stringify(shape.parents))
    );
  } catch {
    return false;
  }
}
