import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readlink, realpath } from "node:fs/promises";
import path from "node:path";

export type CandidateGitMode = "100644" | "100755" | "120000";
export type CandidateMaterialKind = "regular" | "symlink" | "tracked-missing";

export interface CandidateManifestRecord {
  readonly path: string;
  readonly kind: CandidateMaterialKind;
  readonly mode: CandidateGitMode;
  readonly materialRef: string;
}

const RUN_PREFIX = ".flowkit/runs/";
const MODE_PATTERN = /^(100644|100755|120000)$/;
const RAW_DIFF_PATTERN =
  /^:(\d{6}) (\d{6}) [0-9a-f]+ [0-9a-f]+ ([A-Z])(?:\d+)?$/;

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
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
  ) {
    return false;
  }
  const segments = gitPath.split("/");
  return segments.every(
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
  if (!comparableAbsolute.startsWith(comparableRoot)) return null;
  return absolute;
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
      if (settled) return;
      settled = true;
      resolve(null);
    });
    child.once("close", (code, signal) => {
      if (settled) return;
      settled = true;
      resolve(code === 0 && signal === null ? stdout : null);
    });
  });
}

async function resolveCanonicalRepositoryRoot(
  repositoryRoot: string,
): Promise<string | null> {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    return null;
  }
  try {
    const hostRoot = await realpath(repositoryRoot);
    const topLevelOutput = await runGit(hostRoot, [
      "rev-parse",
      "--show-toplevel",
    ]);
    if (topLevelOutput === null) return null;
    const decoded = decodeUtf8(topLevelOutput);
    if (decoded === null) return null;
    const gitRootText = decoded.trim();
    if (gitRootText.length === 0) return null;
    const gitRoot = await realpath(gitRootText);
    const left =
      process.platform === "win32" ? hostRoot.toLowerCase() : hostRoot;
    const right =
      process.platform === "win32" ? gitRoot.toLowerCase() : gitRoot;
    return left === right ? hostRoot : null;
  } catch {
    return null;
  }
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
    if (!MODE_PATTERN.test(mode) || !/^[0-9a-f]{40,64}$/.test(objectId)) {
      return null;
    }
    if (stage !== "0") return null;
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
    const [, oldMode, newMode] = match;
    if (!/^\d{6}$/.test(oldMode) || !/^\d{6}$/.test(newMode)) return null;
    if (result.has(gitPath)) return null;
    result.set(gitPath, newMode);
  }

  return result;
}

async function regularRecord(
  gitPath: string,
  absolutePath: string,
  mode: CandidateGitMode,
): Promise<CandidateManifestRecord | null> {
  if (mode !== "100644" && mode !== "100755") return null;
  try {
    const value = await readFile(absolutePath);
    return {
      path: gitPath,
      kind: "regular",
      mode,
      materialRef: `sha256:${sha256(value)}`,
    };
  } catch {
    return null;
  }
}

async function symlinkRecord(
  gitPath: string,
  absolutePath: string,
): Promise<CandidateManifestRecord | null> {
  try {
    const target = await readlink(absolutePath, { encoding: "buffer" });
    return {
      path: gitPath,
      kind: "symlink",
      mode: "120000",
      materialRef: `sha256:${sha256(target)}`,
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
): Promise<CandidateManifestRecord | null> {
  const absolutePath = toAbsolutePath(repositoryRoot, gitPath);
  if (absolutePath === null) return null;

  try {
    const stat = await lstat(absolutePath);
    const selectedMode =
      worktreeMode !== undefined && worktreeMode !== "000000"
        ? worktreeMode
        : indexMode;
    if (!MODE_PATTERN.test(selectedMode)) return null;
    const mode = selectedMode as CandidateGitMode;

    if (mode === "120000") {
      if (!stat.isSymbolicLink()) return null;
      return symlinkRecord(gitPath, absolutePath);
    }
    if (!stat.isFile()) return null;
    return regularRecord(gitPath, absolutePath, mode);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") return null;
    return {
      path: gitPath,
      kind: "tracked-missing",
      mode: indexMode,
      materialRef: "missing",
    };
  }
}

async function untrackedRecord(
  repositoryRoot: string,
  gitPath: string,
): Promise<CandidateManifestRecord | null> {
  const absolutePath = toAbsolutePath(repositoryRoot, gitPath);
  if (absolutePath === null) return null;

  try {
    const stat = await lstat(absolutePath);
    if (stat.isSymbolicLink()) return symlinkRecord(gitPath, absolutePath);
    if (!stat.isFile()) return null;
    const mode: CandidateGitMode =
      (stat.mode & 0o111) === 0 ? "100644" : "100755";
    return regularRecord(gitPath, absolutePath, mode);
  } catch {
    return null;
  }
}

export async function deriveApplicableCheckCandidateManifest(
  repositoryRoot: string,
): Promise<readonly CandidateManifestRecord[] | null> {
  const root = await resolveCanonicalRepositoryRoot(repositoryRoot);
  if (root === null) return null;

  const [stageOutput, diffOutput, untrackedOutput] = await Promise.all([
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
  if (stageOutput === null || diffOutput === null || untrackedOutput === null) {
    return null;
  }

  const tracked = parseStageEntries(stageOutput);
  const modeOverrides = parseWorktreeModeOverrides(diffOutput);
  const untracked = splitNul(untrackedOutput);
  if (tracked === null || modeOverrides === null || untracked === null) {
    return null;
  }

  const records: CandidateManifestRecord[] = [];
  const seen = new Set<string>();

  for (const [gitPath, indexMode] of tracked) {
    if (isExcludedRunPath(gitPath)) continue;
    const record = await trackedRecord(
      root,
      gitPath,
      indexMode,
      modeOverrides.get(gitPath),
    );
    if (record === null || seen.has(gitPath)) return null;
    seen.add(gitPath);
    records.push(record);
  }

  for (const gitPath of untracked) {
    if (isExcludedRunPath(gitPath)) continue;
    if (!isCanonicalGitPath(gitPath) || seen.has(gitPath)) return null;
    const record = await untrackedRecord(root, gitPath);
    if (record === null) return null;
    seen.add(gitPath);
    records.push(record);
  }

  records.sort((left, right) => left.path.localeCompare(right.path));
  return records;
}

export async function deriveApplicableCheckCandidateRef(
  repositoryRoot: string,
): Promise<string | null> {
  const manifest = await deriveApplicableCheckCandidateManifest(repositoryRoot);
  if (manifest === null) return null;
  const digest = createHash("sha256")
    .update("flowkit-applicable-check-candidate\0")
    .update(JSON.stringify(manifest))
    .digest("hex");
  return `candidate:sha256:${digest}`;
}
