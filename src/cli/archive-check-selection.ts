import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { fullTestPath, fullTestRelative } from "../internal/full-test-input.js";
import type { StartRequest } from "./action-request.js";
import { blocked } from "./action-error.js";

type ArchiveCheck =
  | { readonly kind: "script"; readonly id: string; readonly runner: string }
  | {
      readonly kind: "configured-command";
      readonly id: string;
      readonly program: string;
      readonly args: readonly string[];
      readonly cwd: string;
    };

export async function optionalTargetJson(
  root: string,
  relative: string,
): Promise<unknown> {
  const file = path.join(root, ...relative.split("/"));
  const stat = await lstat(file).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (stat === null) return null;
  if (!stat.isFile() || stat.isSymbolicLink())
    blocked(
      "archive-check-unconfigured",
      `Invalid target check config: ${relative}`,
    );
  try {
    return JSON.parse(
      await readFile(await fullTestPath(root, relative), "utf8"),
    );
  } catch {
    blocked(
      "archive-check-unconfigured",
      `Unreadable target check config: ${relative}`,
    );
  }
}

export async function configuredArchiveChecks(
  request: StartRequest,
): Promise<ArchiveCheck[]> {
  const packageValue = await optionalTargetJson(
    request.repositoryRoot,
    "package.json",
  );
  const scripts =
    typeof packageValue === "object" &&
    packageValue !== null &&
    "scripts" in packageValue &&
    typeof packageValue.scripts === "object" &&
    packageValue.scripts !== null &&
    !Array.isArray(packageValue.scripts)
      ? (packageValue.scripts as Record<string, unknown>)
      : {};
  const managerValue =
    typeof packageValue === "object" &&
    packageValue !== null &&
    "packageManager" in packageValue &&
    typeof packageValue.packageManager === "string"
      ? packageValue.packageManager
      : undefined;
  const declaredManager =
    managerValue === undefined
      ? undefined
      : /^([a-z][a-z0-9-]*)@[^\s]+$/.exec(managerValue)?.[1];
  if (managerValue !== undefined && declaredManager === undefined)
    blocked("archive-check-unconfigured", "Invalid target packageManager");
  const runner = declaredManager ?? "npm";
  const fullTestValue = await optionalTargetJson(
    request.repositoryRoot,
    "config/verification/full-test.json",
  );
  const configured =
    typeof fullTestValue === "object" &&
    fullTestValue !== null &&
    "checks" in fullTestValue &&
    Array.isArray(fullTestValue.checks)
      ? (fullTestValue.checks as unknown[])
      : [];
  const selected: ArchiveCheck[] = [];
  for (const declared of request.applicableChecks ?? []) {
    const script = scripts[declared.id];
    const matches = configured.filter(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "checkId" in entry &&
        entry.checkId === declared.id,
    );
    if (matches.length > 1 || (typeof script === "string" && matches.length))
      blocked(
        "archive-check-unconfigured",
        `Ambiguous archive check: ${declared.id}`,
      );
    if (typeof script === "string" && script.trim()) {
      selected.push({ kind: "script", id: declared.id, runner });
      continue;
    }
    const match = matches[0];
    if (
      typeof match !== "object" ||
      match === null ||
      !("program" in match) ||
      typeof match.program !== "string" ||
      !match.program ||
      [...match.program].some((char) => char.charCodeAt(0) < 32) ||
      !("args" in match) ||
      !Array.isArray(match.args) ||
      !match.args.every(
        (arg) => typeof arg === "string" && !arg.includes("\0"),
      ) ||
      !("cwd" in match) ||
      !fullTestRelative(match.cwd, true)
    )
      blocked(
        "archive-check-unconfigured",
        `Unconfigured archive check: ${declared.id}`,
      );
    selected.push({
      kind: "configured-command",
      id: declared.id,
      program: match.program,
      args: match.args as string[],
      cwd: match.cwd,
    });
  }
  return selected;
}
