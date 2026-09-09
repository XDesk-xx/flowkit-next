import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { readFullTestToolMaterial } from "./full-test-tool.js";
import { isSemanticId } from "../domain/identity.js";
import {
  hasExactlyFields,
  isPlainRecord,
  isArgumentArray,
  hashReference,
} from "./applicable-check-identity.js";

export const FULL_TEST_CONFIG = "config/verification/full-test.json";
export interface FullTestCheck {
  readonly checkId: string;
  readonly program: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly toolRef: string;
  readonly environmentRefs: readonly string[];
  readonly checkRef: string;
}
interface FullTestConfig {
  inputs: string[];
  exclude: string[];
  environment: string[];
  checks: Array<{
    checkId: string;
    program: string;
    args: string[];
    cwd: string;
  }>;
}
export interface FullTestInput {
  readonly configRef: string;
  readonly inputRef: string;
  readonly orderedChecks: readonly FullTestCheck[];
  readonly files: readonly string[];
}
export const fullTestDigest = (bytes: Buffer | string): string =>
  createHash("sha256").update(bytes).digest("hex");
export const fullTestHash = (prefix: string, value: unknown): string =>
  hashReference(prefix, "flowkit-" + prefix, value);
const hasControl = (value: string): boolean =>
  [...value].some((char) => char.charCodeAt(0) < 32);
export function isFullTestRef(value: unknown, prefix: string): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(prefix + ":sha256:") &&
    /^[0-9a-f]{64}$/.test(value.slice(prefix.length + 8))
  );
}
export function fullTestRelative(
  value: unknown,
  allowRoot = false,
): value is string {
  return (
    typeof value === "string" &&
    ((allowRoot && value === ".") ||
      (value.length > 0 &&
        !/[\\:]/.test(value) &&
        !hasControl(value) &&
        !path.posix.isAbsolute(value) &&
        value
          .split("/")
          .every(
            (part) =>
              part !== "" &&
              part !== "." &&
              part !== ".." &&
              !/[. ]$/.test(part),
          )))
  );
}
export async function fullTestPath(
  root: string,
  relative: string,
): Promise<string> {
  if (!fullTestRelative(relative, true))
    throw new Error("invalid target path: " + relative);
  let current = await fs.realpath(root);
  for (const part of relative === "." ? [] : relative.split("/")) {
    current = path.join(current, part);
    const stat = await fs.lstat(current);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()))
      throw new Error("unsupported input: " + relative);
  }
  return current;
}
function uniqueStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "string") &&
    new Set(value).size === value.length
  );
}
function parseConfig(value: unknown): FullTestConfig {
  if (
    isPlainRecord(value) &&
    !hasExactlyFields(value, ["inputs", "exclude", "environment", "checks"])
  )
    throw new Error("invalid Full Test config: unknown-or-missing-fields");
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, ["inputs", "exclude", "environment", "checks"]) ||
    !uniqueStrings(value.inputs) ||
    !value.inputs.length ||
    !value.inputs.every((p) => fullTestRelative(p, true)) ||
    !uniqueStrings(value.exclude) ||
    !value.exclude.every((p) => fullTestRelative(p)) ||
    !uniqueStrings(value.environment) ||
    !value.environment.every((n) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n)) ||
    !Array.isArray(value.checks) ||
    !value.checks.length
  )
    throw new Error("invalid Full Test config");
  const ids = new Set<string>();
  for (const check of value.checks) {
    if (
      !isPlainRecord(check) ||
      !hasExactlyFields(check, ["checkId", "program", "args", "cwd"]) ||
      !isSemanticId(check.checkId) ||
      ids.has(check.checkId) ||
      typeof check.program !== "string" ||
      !check.program ||
      hasControl(check.program) ||
      !isArgumentArray(check.args) ||
      !fullTestRelative(check.cwd, true)
    )
      throw new Error("invalid Full Test check");
    ids.add(check.checkId);
  }
  return value as unknown as FullTestConfig;
}
export function deriveFullTestCheckRef(
  check: Omit<FullTestCheck, "checkRef">,
): string {
  return fullTestHash("full-test-check", {
    checkId: check.checkId,
    program: check.program,
    args: check.args,
    cwd: check.cwd,
    toolRef: check.toolRef,
    environmentRefs: check.environmentRefs,
  });
}
export function isFullTestCheck(value: unknown): value is FullTestCheck {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, [
      "checkId",
      "program",
      "args",
      "cwd",
      "toolRef",
      "environmentRefs",
      "checkRef",
    ]) ||
    !isSemanticId(value.checkId) ||
    typeof value.program !== "string" ||
    !value.program ||
    !isArgumentArray(value.args) ||
    !fullTestRelative(value.cwd, true) ||
    !isFullTestRef(value.toolRef, "full-test-tool") ||
    !uniqueStrings(value.environmentRefs)
  )
    return false;
  return (
    value.checkRef === deriveFullTestCheckRef(value as unknown as FullTestCheck)
  );
}
export async function resolveFullTestProgram(
  root: string,
  program: string,
): Promise<string> {
  const names =
    process.platform === "win32" && !path.extname(program)
      ? [program + ".exe", program]
      : [program];
  const candidates = path.isAbsolute(program)
    ? [program]
    : program.includes("/") || program.includes("\\")
      ? [path.resolve(root, program)]
      : (process.env.PATH ?? "")
          .split(path.delimiter)
          .filter(Boolean)
          .flatMap((dir) => names.map((n) => path.resolve(dir, n)));
  for (const candidate of candidates) {
    try {
      const resolved = await fs.realpath(candidate);
      if (!/\.(cmd|bat)$/i.test(resolved) && (await fs.stat(resolved)).isFile())
        return resolved;
    } catch {
      /* Try the next explicit PATH entry. */
    }
  }
  throw new Error("Full Test executable missing or unsupported: " + program);
}
export async function readFullTestInput(root: string): Promise<FullTestInput> {
  let stage = "config.read:config/verification/full-test.json";
  try {
    const configBytes = await fs.readFile(
      await fullTestPath(root, FULL_TEST_CONFIG),
    );
    stage = "config.parse";
    const config = parseConfig(JSON.parse(configBytes.toString("utf8")));
    const excluded = (p: string): boolean =>
      config.exclude.some((e) => p === e || p.startsWith(e + "/"));
    if (excluded(FULL_TEST_CONFIG))
      throw new Error("Full Test config cannot be excluded");
    const files = new Map<string, string>();
    async function visit(relative: string): Promise<void> {
      if (excluded(relative)) return;
      if (
        relative === ".git" ||
        relative.startsWith(".git/") ||
        relative === ".flowkit/artifacts" ||
        relative.startsWith(".flowkit/artifacts/")
      )
        return;
      const target = await fullTestPath(root, relative);
      const stat = await fs.lstat(target);
      if (stat.isDirectory()) {
        for (const name of await fs.readdir(target))
          await visit(relative === "." ? name : relative + "/" + name);
      } else if (stat.isFile())
        files.set(relative, fullTestDigest(await fs.readFile(target)));
      else throw new Error("unsupported input: " + relative);
    }
    for (const [index, input] of config.inputs.entries()) {
      stage = `inputs[${index}]`;
      await fullTestPath(root, input);
      await visit(input);
    }
    files.set(FULL_TEST_CONFIG, fullTestDigest(configBytes));
    const environmentRefs = [
      process.platform,
      process.arch,
      process.version,
      ...config.environment.map(
        (name) =>
          name +
          ":" +
          (process.env[name] === undefined
            ? "absent"
            : fullTestDigest(process.env[name]!)),
      ),
    ];
    const orderedChecks: FullTestCheck[] = [];
    for (const [index, declared] of config.checks.entries()) {
      stage = `checks[${index}].cwd`;
      const cwd = await fullTestPath(root, declared.cwd);
      if (!(await fs.stat(cwd)).isDirectory())
        throw new Error("check cwd is not a directory");
      stage = `checks[${index}].executable`;
      const executable = await resolveFullTestProgram(cwd, declared.program);
      stage = `checks[${index}].resources`;
      const check = {
        ...declared,
        toolRef: fullTestHash(
          "full-test-tool",
          await readFullTestToolMaterial(executable, cwd, declared.args),
        ),
        environmentRefs,
      };
      orderedChecks.push({ ...check, checkRef: deriveFullTestCheckRef(check) });
    }
    const sorted = [...files].sort(([a], [b]) =>
      Buffer.compare(Buffer.from(a), Buffer.from(b)),
    );
    const configRef = fullTestHash(
      "full-test-config",
      fullTestDigest(configBytes),
    );
    return {
      configRef,
      inputRef: fullTestHash("full-test-input", {
        files: sorted,
        configRef,
        orderedChecks,
      }),
      orderedChecks,
      files: sorted.map(([name]) => name),
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    const message = error instanceof Error ? error.message : "";
    const known = [
      "invalid Full Test config",
      "invalid Full Test config: unknown-or-missing-fields",
      "invalid Full Test check",
      "Full Test config cannot be excluded",
      "check cwd is not a directory",
      "unsupported tool resource link",
      "unsupported tool resource type",
      "missing preload resource",
    ];
    const reason =
      typeof code === "string" && /^[A-Z_]+$/.test(code)
        ? code
        : error instanceof SyntaxError
          ? "invalid-json"
          : known.includes(message)
            ? message
            : message.startsWith("Full Test executable missing")
              ? "executable missing or unsupported"
              : message.startsWith("unsupported input:")
                ? "unsupported input"
                : "unreadable-or-invalid-resource";
    throw new FullTestInputError(stage + ": " + reason);
  }
}

export class FullTestInputError extends Error {}
