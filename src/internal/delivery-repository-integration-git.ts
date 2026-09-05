import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;

async function git(
  repositoryRoot: string,
  args: readonly string[],
): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", [...args], {
      cwd: repositoryRoot,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function observeGitHead(
  repositoryRoot: string,
): Promise<string | null> {
  const value = await git(repositoryRoot, ["rev-parse", "HEAD"]);
  return value !== null && GIT_COMMIT_PATTERN.test(value) ? value : null;
}

export async function observeGitBranch(
  repositoryRoot: string,
): Promise<string | null> {
  const value = await git(repositoryRoot, [
    "symbolic-ref",
    "--quiet",
    "--short",
    "HEAD",
  ]);
  return value !== null && value.length > 0 ? value : null;
}

export async function resolveGitCommit(
  repositoryRoot: string,
  ref: string,
): Promise<string | null> {
  const value = await git(repositoryRoot, [
    "rev-parse",
    "--verify",
    `${ref}^{commit}`,
  ]);
  return value !== null && GIT_COMMIT_PATTERN.test(value) ? value : null;
}

export async function isGitAncestor(
  repositoryRoot: string,
  ancestor: string,
  descendant: string,
): Promise<boolean> {
  try {
    await execFileAsync(
      "git",
      ["merge-base", "--is-ancestor", ancestor, descendant],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
      },
    );
    return true;
  } catch {
    return false;
  }
}

export async function observeGitTree(
  repositoryRoot: string,
  commit: string,
): Promise<string | null> {
  const value = await git(repositoryRoot, ["rev-parse", `${commit}^{tree}`]);
  return value !== null && GIT_COMMIT_PATTERN.test(value) ? value : null;
}

export async function observeFirstParent(
  repositoryRoot: string,
  commit: string,
): Promise<string | null> {
  const value = await git(repositoryRoot, ["rev-parse", `${commit}^1`]);
  return value !== null && GIT_COMMIT_PATTERN.test(value) ? value : null;
}

export async function countGitCommits(
  repositoryRoot: string,
  fromExclusive: string,
  toInclusive: string,
): Promise<number | null> {
  const value = await git(repositoryRoot, [
    "rev-list",
    "--count",
    `${fromExclusive}..${toInclusive}`,
  ]);
  if (value === null || !/^\d+$/.test(value)) return null;
  return Number(value);
}

export async function isGitIndexAndWorktreeClean(
  repositoryRoot: string,
): Promise<boolean> {
  const value = await git(repositoryRoot, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  return value === "";
}
