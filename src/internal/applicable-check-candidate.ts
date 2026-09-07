import { spawn } from "node:child_process";
import { lstat, open, readlink, realpath } from "node:fs/promises";
import path from "node:path";
import {
  deriveCandidateRefFromRecords,
  materialRef,
  sortCandidateRecords,
  type CandidateGitMode,
  type CandidateManifestRecord,
} from "./applicable-check-material.js";

export type {
  CandidateGitMode,
  CandidateManifestRecord,
  CandidateMaterialKind,
} from "./applicable-check-material.js";

const RUN_PREFIX = ".flowkit/runs/";
const MEMO_PATH = ".flowkit/memos.json";
const MODE_PATTERN = /^(100644|100755|120000)$/;
const SHA1_PATTERN = /^[0-9a-f]{40}$/;
const RAW_DIFF_PATTERN =
  /^:(\d{6}) (\d{6}) [0-9a-f]+ [0-9a-f]+ ([A-Z])(?:\d+)?$/;

type MaterialRead = CandidateManifestRecord | "absent" | null;

interface WorktreeSnapshot {
  readonly stage: Buffer;
  readonly diff: Buffer;
  readonly untracked: Buffer;
}

function decodeUtf8(value: Buffer): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(value);
  } catch {
    return null;
  }
}

function splitNul(value: Buffer): string[] | null {
  const decoded = decodeUtf8(value);
  if (decoded === null) return null;
  const parts = decoded.split("\0");
  if (parts.at(-1) === "") parts.pop();
  return parts;
}

function isExcludedRunPath(gitPath: string): boolean {
  return gitPath === ".flowkit/runs" || gitPath.startsWith(RUN_PREFIX);
}

function isCanonicalGitPath(gitPath: string): boolean {
  if (
    gitPath.length === 0 ||
    gitPath.startsWith("/") ||
    gitPath.includes("\\") ||
    gitPath.includes("\0")
  )
    return false;
  return gitPath
    .split("/")
    .every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );
}

function toAbsolutePath(
  repositoryRoot: string,
  gitPath: string,
): string | null {
  if (!isCanonicalGitPath(gitPath)) return null;
  const absolute = path.resolve(repositoryRoot, ...gitPath.split("/"));
  const rootWithSeparator = repositoryRoot.endsWith(path.sep)
    ? repositoryRoot
    : `${repositoryRoot}${path.sep}`;
  const comparableAbsolute =
    process.platform === "win32" ? absolute.toLowerCase() : absolute;
  const comparableRoot =
    process.platform === "win32"
      ? rootWithSeparator.toLowerCase()
      : rootWithSeparator;
  return comparableAbsolute.startsWith(comparableRoot) ? absolute : null;
}

async function runGit(
  repositoryRoot: string,
  args: readonly string[],
): Promise<Buffer | null> {
  return new Promise((resolve) => {
    let settled = false;
    let stdout = Buffer.alloc(0);
    const child = spawn("git", [...args], {
      cwd: repositoryRoot,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
    });
    child.stdout.on("data", (chunk: Buffer) => {
      stdout = Buffer.concat([stdout, chunk]);
    });
    child.once("error", () => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    });
    child.once("close", (code, signal) => {
      if (!settled) {
        settled = true;
        resolve(code === 0 && signal === null ? stdout : null);
      }
    });
  });
}

async function resolveCanonicalRepositoryRoot(
  repositoryRoot: string,
): Promise<string | null> {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0)
    return null;
  try {
    const hostRoot = await realpath(repositoryRoot);
    const topLevel = await runGit(hostRoot, ["rev-parse", "--show-toplevel"]);
    if (topLevel === null) return null;
    const decoded = decodeUtf8(topLevel);
    if (decoded === null || decoded.trim().length === 0) return null;
    const gitRoot = await realpath(decoded.trim());
    const left =
      process.platform === "win32" ? hostRoot.toLowerCase() : hostRoot;
    const right =
      process.platform === "win32" ? gitRoot.toLowerCase() : gitRoot;
    return left === right ? hostRoot : null;
  } catch {
    return null;
  }
}

async function isSha1Repository(repositoryRoot: string): Promise<boolean> {
  const output = await runGit(repositoryRoot, [
    "rev-parse",
    "--show-object-format",
  ]);
  return output !== null && decodeUtf8(output)?.trim() === "sha1";
}

function parseStageEntries(
  output: Buffer,
): Map<string, CandidateGitMode> | null {
  const entries = splitNul(output);
  if (entries === null) return null;
  const result = new Map<string, CandidateGitMode>();
  for (const entry of entries) {
    const tab = entry.indexOf("\t");
    if (tab <= 0) return null;
    const metadata = entry.slice(0, tab).split(" ");
    const gitPath = entry.slice(tab + 1);
    if (metadata.length !== 3 || !isCanonicalGitPath(gitPath)) return null;
    const [mode, objectId, stage] = metadata;
    if (
      !MODE_PATTERN.test(mode) ||
      !SHA1_PATTERN.test(objectId) ||
      stage !== "0"
    )
      return null;
    if (result.has(gitPath)) return null;
    result.set(gitPath, mode as CandidateGitMode);
  }
  return result;
}

function parseWorktreeModeOverrides(
  output: Buffer,
): Map<string, string> | null {
  const parts = splitNul(output);
  if (parts === null || parts.length % 2 !== 0) return null;
  const result = new Map<string, string>();
  for (let index = 0; index < parts.length; index += 2) {
    const metadata = parts[index];
    const gitPath = parts[index + 1];
    const match = RAW_DIFF_PATTERN.exec(metadata);
    if (match === null || !isCanonicalGitPath(gitPath)) return null;
    const newMode = match[2];
    if (result.has(gitPath)) return null;
    result.set(gitPath, newMode);
  }
  return result;
}

function statIdentity(stat: Awaited<ReturnType<typeof lstat>>): string {
  return [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeMs].join(":");
}

async function regularRecord(
  gitPath: string,
  absolutePath: string,
  mode: CandidateGitMode,
): Promise<CandidateManifestRecord | null> {
  if (mode !== "100644" && mode !== "100755") return null;
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    const beforePath = await lstat(absolutePath);
    if (!beforePath.isFile() || beforePath.isSymbolicLink()) return null;
    handle = await open(absolutePath, "r");
    const beforeHandle = await handle.stat();
    const value = await handle.readFile();
    const afterHandle = await handle.stat();
    const afterPath = await lstat(absolutePath);
    if (
      statIdentity(beforePath) !== statIdentity(afterPath) ||
      statIdentity(beforeHandle) !== statIdentity(afterHandle) ||
      beforePath.dev !== beforeHandle.dev ||
      beforePath.ino !== beforeHandle.ino
    )
      return null;
    return {
      path: gitPath,
      kind: "regular",
      mode,
      materialRef: materialRef(value),
    };
  } catch {
    return null;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function symlinkRecord(
  gitPath: string,
  absolutePath: string,
): Promise<CandidateManifestRecord | null> {
  try {
    const before = await lstat(absolutePath);
    if (!before.isSymbolicLink()) return null;
    const target = await readlink(absolutePath, { encoding: "buffer" });
    const after = await lstat(absolutePath);
    if (statIdentity(before) !== statIdentity(after)) return null;
    return {
      path: gitPath,
      kind: "symlink",
      mode: "120000",
      materialRef: materialRef(target),
    };
  } catch {
    return null;
  }
}

async function trackedRecord(
  repositoryRoot: string,
  gitPath: string,
  indexMode: CandidateGitMode,
  worktreeMode: string | undefined,
): Promise<MaterialRead> {
  const absolutePath = toAbsolutePath(repositoryRoot, gitPath);
  if (absolutePath === null) return null;
  try {
    const stat = await lstat(absolutePath);
    const selectedMode = worktreeMode === undefined ? indexMode : worktreeMode;
    if (!MODE_PATTERN.test(selectedMode)) return null;
    const mode = selectedMode as CandidateGitMode;
    if (gitPath === MEMO_PATH)
      return stat.isFile() && !stat.isSymbolicLink() ? "absent" : null;
    if (mode === "120000")
      return stat.isSymbolicLink()
        ? symlinkRecord(gitPath, absolutePath)
        : null;
    return stat.isFile() && !stat.isSymbolicLink()
      ? regularRecord(gitPath, absolutePath, mode)
      : null;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT" &&
      worktreeMode === "000000"
      ? "absent"
      : null;
  }
}

async function untrackedRecord(
  repositoryRoot: string,
  gitPath: string,
): Promise<MaterialRead> {
  const absolutePath = toAbsolutePath(repositoryRoot, gitPath);
  if (absolutePath === null) return null;
  try {
    const stat = await lstat(absolutePath);
    if (gitPath === MEMO_PATH)
      return stat.isFile() && !stat.isSymbolicLink() ? "absent" : null;
    if (stat.isSymbolicLink()) return symlinkRecord(gitPath, absolutePath);
    if (!stat.isFile()) return null;
    const mode: CandidateGitMode =
      (stat.mode & 0o111) === 0 ? "100644" : "100755";
    return regularRecord(gitPath, absolutePath, mode);
  } catch {
    return null;
  }
}

async function readWorktreeSnapshot(
  root: string,
): Promise<WorktreeSnapshot | null> {
  const [stage, diff, untracked] = await Promise.all([
    runGit(root, ["ls-files", "--stage", "-z"]),
    runGit(root, [
      "diff",
      "--raw",
      "-z",
      "--no-abbrev",
      "--no-ext-diff",
      "--ignore-submodules",
      "--",
    ]),
    runGit(root, ["ls-files", "--others", "--exclude-standard", "-z"]),
  ]);
  return stage === null || diff === null || untracked === null
    ? null
    : { stage, diff, untracked };
}

function sameSnapshot(
  left: WorktreeSnapshot,
  right: WorktreeSnapshot,
): boolean {
  return (
    left.stage.equals(right.stage) &&
    left.diff.equals(right.diff) &&
    left.untracked.equals(right.untracked)
  );
}

async function validateMemoPath(root: string): Promise<boolean> {
  const memo = toAbsolutePath(root, MEMO_PATH);
  if (memo === null) return false;
  try {
    const stat = await lstat(memo);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT";
  }
}

export async function deriveApplicableCheckCandidateManifest(
  repositoryRoot: string,
): Promise<readonly CandidateManifestRecord[] | null> {
  const root = await resolveCanonicalRepositoryRoot(repositoryRoot);
  if (root === null || !(await isSha1Repository(root))) return null;
  const before = await readWorktreeSnapshot(root);
  if (before === null || !(await validateMemoPath(root))) return null;
  const tracked = parseStageEntries(before.stage);
  const overrides = parseWorktreeModeOverrides(before.diff);
  const untracked = splitNul(before.untracked);
  if (tracked === null || overrides === null || untracked === null) return null;
  const records: CandidateManifestRecord[] = [];
  const seen = new Set<string>();
  for (const [gitPath, indexMode] of tracked) {
    if (isExcludedRunPath(gitPath)) continue;
    const record = await trackedRecord(
      root,
      gitPath,
      indexMode,
      overrides.get(gitPath),
    );
    if (record === null || seen.has(gitPath)) return null;
    seen.add(gitPath);
    if (record !== "absent") records.push(record);
  }
  for (const gitPath of untracked) {
    if (isExcludedRunPath(gitPath)) continue;
    if (!isCanonicalGitPath(gitPath) || seen.has(gitPath)) return null;
    const record = await untrackedRecord(root, gitPath);
    if (record === null) return null;
    seen.add(gitPath);
    if (record !== "absent") records.push(record);
  }
  const after = await readWorktreeSnapshot(root);
  if (
    after === null ||
    !sameSnapshot(before, after) ||
    !(await validateMemoPath(root))
  )
    return null;
  return sortCandidateRecords(records);
}

interface TreeEntry {
  readonly mode: string;
  readonly type: string;
  readonly objectId: string;
  readonly path: string;
}

function parseTree(output: Buffer): TreeEntry[] | null {
  const entries = splitNul(output);
  if (entries === null) return null;
  const result: TreeEntry[] = [];
  for (const entry of entries) {
    const tab = entry.indexOf("\t");
    if (tab <= 0) return null;
    const metadata = entry.slice(0, tab).split(" ");
    const gitPath = entry.slice(tab + 1);
    if (metadata.length !== 3 || !isCanonicalGitPath(gitPath)) return null;
    const [mode, type, objectId] = metadata;
    if (!SHA1_PATTERN.test(objectId)) return null;
    result.push({ mode, type, objectId, path: gitPath });
  }
  return result;
}

async function resolveExactCommit(
  root: string,
  commit: string,
): Promise<string | null> {
  if (!SHA1_PATTERN.test(commit) || !(await isSha1Repository(root)))
    return null;
  const resolved = await runGit(root, [
    "rev-parse",
    "--verify",
    `${commit}^{commit}`,
  ]);
  const decoded = resolved === null ? null : decodeUtf8(resolved);
  return decoded?.trim() === commit ? commit : null;
}

export async function deriveApplicableCheckObjectManifest(
  repositoryRoot: string,
  commit: string,
): Promise<readonly CandidateManifestRecord[] | null> {
  const root = await resolveCanonicalRepositoryRoot(repositoryRoot);
  if (root === null || (await resolveExactCommit(root, commit)) === null)
    return null;
  const output = await runGit(root, [
    "ls-tree",
    "-r",
    "-t",
    "-z",
    "--full-tree",
    commit,
  ]);
  const entries = output === null ? null : parseTree(output);
  if (entries === null) return null;
  const records: CandidateManifestRecord[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (isExcludedRunPath(entry.path)) continue;
    if (entry.path === MEMO_PATH) {
      if (
        entry.type !== "blob" ||
        (entry.mode !== "100644" && entry.mode !== "100755")
      )
        return null;
      continue;
    }
    if (entry.type === "tree") continue;
    if (
      entry.type !== "blob" ||
      !MODE_PATTERN.test(entry.mode) ||
      seen.has(entry.path)
    )
      return null;
    const bytes = await runGit(root, ["cat-file", "blob", entry.objectId]);
    if (bytes === null) return null;
    const mode = entry.mode as CandidateGitMode;
    records.push({
      path: entry.path,
      kind: mode === "120000" ? "symlink" : "regular",
      mode,
      materialRef: materialRef(bytes),
    });
    seen.add(entry.path);
  }
  return sortCandidateRecords(records);
}

export async function deriveApplicableCheckCandidateRef(
  repositoryRoot: string,
): Promise<string | null> {
  const manifest = await deriveApplicableCheckCandidateManifest(repositoryRoot);
  return manifest === null ? null : deriveCandidateRefFromRecords(manifest);
}

export async function deriveApplicableCheckObjectCandidateRef(
  repositoryRoot: string,
  commit: string,
): Promise<string | null> {
  const manifest = await deriveApplicableCheckObjectManifest(
    repositoryRoot,
    commit,
  );
  return manifest === null ? null : deriveCandidateRefFromRecords(manifest);
}
