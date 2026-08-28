import { realpath, readFile, stat } from "node:fs/promises";
import path from "node:path";

export const MANAGED_TOOL_IDS = ["openspec", "archify"] as const;
export type ManagedToolId = (typeof MANAGED_TOOL_IDS)[number];

export const MANAGED_TOOL_RESOLUTION_DIAGNOSTICS = [
  "unsupported-managed-tool",
  "invalid-lock",
  "missing-flowkit-home",
  "invalid-runtime-root",
  "missing-runtime",
  "package-identity-mismatch",
  "missing-entrypoint",
] as const;

export type ManagedToolResolutionDiagnosticKind =
  (typeof MANAGED_TOOL_RESOLUTION_DIAGNOSTICS)[number];

export interface ResolvedManagedTool {
  readonly toolId: ManagedToolId;
  readonly version: string;
  readonly runtimeRoot: string;
  readonly entrypoint: string;
}

export interface ResolveManagedToolInput {
  readonly repositoryRoot: string;
  readonly flowkitHome?: string | null;
  readonly toolId: unknown;
}

interface ManagedToolLockEntry {
  readonly packageName: string;
  readonly version: string;
  readonly runtimeRoot: string;
  readonly entrypoint: string;
}

interface RuntimePackageIdentity {
  readonly name: string;
  readonly version: string;
}

const TOOLCHAIN_LOCK_RELATIVE_PATH = "config/tools/toolchain.lock.json";
const FLOWKIT_HOME_TOKEN = "${FLOWKIT_HOME}";
const ALLOWED_LOCK_ROOT_KEYS = new Set([
  "schemaVersion",
  "generatedFor",
  "openspec",
  "archify",
]);
const ALLOWED_ENTRY_KEYS = new Set([
  "packageName",
  "version",
  "runtimeRoot",
  "entrypoint",
  "runtimeArtifact",
  "runtimeArtifactSha256",
  "skillSourceArtifact",
  "skillSourceSha256",
  "sourceArtifact",
  "sourceArtifactSha256",
]);

export class ManagedToolResolutionError extends Error {
  public readonly kind: ManagedToolResolutionDiagnosticKind;

  public constructor(
    kind: ManagedToolResolutionDiagnosticKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ManagedToolResolutionError";
    this.kind = kind;
  }
}

export function isManagedToolId(value: unknown): value is ManagedToolId {
  return (
    typeof value === "string" &&
    (MANAGED_TOOL_IDS as readonly string[]).includes(value)
  );
}

function fail(
  kind: ManagedToolResolutionDiagnosticKind,
  message: string,
  cause?: unknown,
): never {
  throw new ManagedToolResolutionError(
    kind,
    message,
    cause === undefined ? undefined : { cause },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
): void {
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    fail(
      "invalid-lock",
      `${label} contains unsupported keys: ${unexpected.sort().join(", ")}`,
    );
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail("invalid-lock", `${label} must be a non-empty string`);
  }
  return value;
}

function parseLockEntry(
  value: unknown,
  toolId: ManagedToolId,
): ManagedToolLockEntry {
  if (!isRecord(value)) {
    fail("invalid-lock", `lock entry for ${toolId} must be an object`);
  }
  assertOnlyKeys(value, ALLOWED_ENTRY_KEYS, `lock entry for ${toolId}`);

  const packageName = nonEmptyString(
    value.packageName,
    `${toolId}.packageName`,
  );
  const version = nonEmptyString(value.version, `${toolId}.version`);
  const runtimeRoot = nonEmptyString(
    value.runtimeRoot,
    `${toolId}.runtimeRoot`,
  );
  const entrypoint = nonEmptyString(value.entrypoint, `${toolId}.entrypoint`);

  for (const [key, field] of Object.entries(value)) {
    if (
      key !== "packageName" &&
      key !== "version" &&
      key !== "runtimeRoot" &&
      key !== "entrypoint" &&
      typeof field !== "string"
    ) {
      fail("invalid-lock", `${toolId}.${key} must be a string when present`);
    }
  }

  return { packageName, version, runtimeRoot, entrypoint };
}

function parseRequestedLockEntry(
  value: unknown,
  toolId: ManagedToolId,
): ManagedToolLockEntry {
  if (!isRecord(value)) {
    fail("invalid-lock", "toolchain lock must be an object");
  }
  assertOnlyKeys(value, ALLOWED_LOCK_ROOT_KEYS, "toolchain lock");
  if (value.schemaVersion !== 1) {
    fail("invalid-lock", "toolchain lock schemaVersion must be 1");
  }
  if (
    value.generatedFor !== undefined &&
    (typeof value.generatedFor !== "string" || value.generatedFor.length === 0)
  ) {
    fail(
      "invalid-lock",
      "toolchain lock generatedFor must be a non-empty string",
    );
  }

  return parseLockEntry(value[toolId], toolId);
}

async function readManagedToolLockEntry(
  repositoryRoot: string,
  toolId: ManagedToolId,
): Promise<ManagedToolLockEntry> {
  const lockPath = path.resolve(repositoryRoot, TOOLCHAIN_LOCK_RELATIVE_PATH);
  let text: string;
  try {
    text = await readFile(lockPath, "utf8");
  } catch (error) {
    fail("invalid-lock", `cannot read managed-tool lock at ${lockPath}`, error);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    fail(
      "invalid-lock",
      `managed-tool lock is not valid JSON at ${lockPath}`,
      error,
    );
  }
  return parseRequestedLockEntry(parsed, toolId);
}

function expectedRuntimeTemplate(
  toolId: ManagedToolId,
  version: string,
): string {
  return `${FLOWKIT_HOME_TOKEN}/tools/${toolId}/${version}`;
}

function portableRelativeSegments(value: string, label: string): string[] {
  if (value.includes("\\")) {
    fail("invalid-runtime-root", `${label} must use portable '/' separators`);
  }
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) {
    fail("invalid-runtime-root", `${label} must be relative`);
  }
  const segments = value.split("/");
  if (
    segments.length === 0 ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    fail("invalid-runtime-root", `${label} contains invalid path segments`);
  }
  return segments;
}

function isWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

async function requireDirectory(target: string): Promise<void> {
  try {
    const targetStat = await stat(target);
    if (!targetStat.isDirectory()) {
      fail("missing-runtime", `managed runtime is not a directory: ${target}`);
    }
  } catch (error) {
    if (error instanceof ManagedToolResolutionError) {
      throw error;
    }
    fail("missing-runtime", `managed runtime is missing: ${target}`, error);
  }
}

async function confinedRealPath(
  target: string,
  parent: string,
  kind: ManagedToolResolutionDiagnosticKind,
  label: string,
): Promise<string> {
  let targetReal: string;
  let parentReal: string;
  try {
    [targetReal, parentReal] = await Promise.all([
      realpath(target),
      realpath(parent),
    ]);
  } catch (error) {
    fail(kind, `${label} cannot be resolved`, error);
  }
  if (!isWithin(parentReal, targetReal)) {
    fail(
      "invalid-runtime-root",
      `${label} escapes the managed runtime boundary`,
    );
  }
  return targetReal;
}

async function readRuntimePackageIdentity(
  runtimeRoot: string,
): Promise<RuntimePackageIdentity> {
  const packagePath = path.join(runtimeRoot, "package.json");
  let packageReal: string;
  try {
    packageReal = await confinedRealPath(
      packagePath,
      runtimeRoot,
      "package-identity-mismatch",
      "runtime package manifest",
    );
  } catch (error) {
    if (
      error instanceof ManagedToolResolutionError &&
      error.kind === "invalid-runtime-root"
    ) {
      throw error;
    }
    fail(
      "package-identity-mismatch",
      `runtime package manifest is unavailable beneath ${runtimeRoot}`,
      error,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(packageReal, "utf8")) as unknown;
  } catch (error) {
    fail(
      "package-identity-mismatch",
      "runtime package manifest is invalid",
      error,
    );
  }
  if (!isRecord(parsed)) {
    fail(
      "package-identity-mismatch",
      "runtime package manifest must be an object",
    );
  }
  const name = parsed.name;
  const version = parsed.version;
  if (typeof name !== "string" || typeof version !== "string") {
    fail(
      "package-identity-mismatch",
      "runtime package manifest must expose string name and version",
    );
  }
  return { name, version };
}

export async function resolveManagedTool(
  input: ResolveManagedToolInput,
): Promise<ResolvedManagedTool> {
  if (!isManagedToolId(input.toolId)) {
    fail(
      "unsupported-managed-tool",
      `unsupported managed tool: ${String(input.toolId)}`,
    );
  }
  if (
    typeof input.repositoryRoot !== "string" ||
    input.repositoryRoot.length === 0
  ) {
    fail("invalid-lock", "repositoryRoot must be a non-empty string");
  }
  if (typeof input.flowkitHome !== "string" || input.flowkitHome.length === 0) {
    fail(
      "missing-flowkit-home",
      "FLOWKIT_HOME is required for managed-tool resolution",
    );
  }

  const toolId = input.toolId;
  const entry = await readManagedToolLockEntry(input.repositoryRoot, toolId);
  const expectedTemplate = expectedRuntimeTemplate(toolId, entry.version);
  if (entry.runtimeRoot !== expectedTemplate) {
    fail(
      "invalid-runtime-root",
      `${toolId}.runtimeRoot must equal ${expectedTemplate}`,
    );
  }

  const flowkitHome = path.resolve(input.flowkitHome);
  const expectedRoot = path.resolve(
    flowkitHome,
    "tools",
    toolId,
    entry.version,
  );
  const managedToolParent = path.resolve(flowkitHome, "tools", toolId);
  if (!isWithin(managedToolParent, expectedRoot)) {
    fail("invalid-runtime-root", `${toolId} runtime root escapes FLOWKIT_HOME`);
  }

  await requireDirectory(expectedRoot);
  const runtimeRoot = await confinedRealPath(
    expectedRoot,
    managedToolParent,
    "invalid-runtime-root",
    `${toolId} runtime root`,
  );

  const packageIdentity = await readRuntimePackageIdentity(runtimeRoot);
  if (
    packageIdentity.name !== entry.packageName ||
    packageIdentity.version !== entry.version
  ) {
    fail(
      "package-identity-mismatch",
      `${toolId} package identity mismatch: expected ${entry.packageName}@${entry.version}, got ${packageIdentity.name}@${packageIdentity.version}`,
    );
  }

  const entrypointSegments = portableRelativeSegments(
    entry.entrypoint,
    `${toolId}.entrypoint`,
  );
  const entrypointCandidate = path.resolve(runtimeRoot, ...entrypointSegments);
  if (!isWithin(runtimeRoot, entrypointCandidate)) {
    fail("invalid-runtime-root", `${toolId} entrypoint escapes runtime root`);
  }

  let entrypointStat;
  try {
    entrypointStat = await stat(entrypointCandidate);
  } catch (error) {
    fail("missing-entrypoint", `${toolId} entrypoint is missing`, error);
  }
  if (!entrypointStat.isFile()) {
    fail("missing-entrypoint", `${toolId} entrypoint is not a file`);
  }
  const entrypoint = await confinedRealPath(
    entrypointCandidate,
    runtimeRoot,
    "missing-entrypoint",
    `${toolId} entrypoint`,
  );

  return Object.freeze({
    toolId,
    version: entry.version,
    runtimeRoot,
    entrypoint,
  });
}
