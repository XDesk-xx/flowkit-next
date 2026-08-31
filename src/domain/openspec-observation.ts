import { spawn } from "node:child_process";
import { realpath } from "node:fs/promises";
import path from "node:path";

import { asChangeId, type ChangeId } from "./identity.js";
import { resolveManagedTool } from "./managed-tool-resolution.js";
import { classifyManagedOpenSpecClose } from "../internal/openspec-process-outcome.js";

export type OpenSpecArtifactStatus = "ready" | "blocked" | "done" | "skipped";

export interface OpenSpecObservationInput {
  readonly repositoryRoot: string;
  readonly flowkitHome: string;
}

export interface OpenSpecChangeStatusInput extends OpenSpecObservationInput {
  readonly changeId: ChangeId;
}

export interface OpenSpecActiveChangesObservation {
  readonly changeIds: readonly ChangeId[];
}

export interface OpenSpecArtifactObservation {
  readonly id: string;
  readonly status: OpenSpecArtifactStatus;
  readonly requires: readonly string[];
  readonly missingDeps: readonly string[];
}

export interface OpenSpecChangeStatusObservation {
  readonly changeId: ChangeId;
  readonly schemaName: string;
  readonly changeRoot: string;
  readonly isPlanningComplete: boolean;
  readonly isComplete: boolean;
  readonly artifacts: readonly OpenSpecArtifactObservation[];
}

export type OpenSpecObservationDiagnosticKind =
  | "invalid-observation-input"
  | "openspec-process-failed"
  | "malformed-machine-output"
  | "invalid-machine-shape"
  | "openspec-root-mismatch"
  | "openspec-formal-outcome";

export class OpenSpecObservationError extends Error {
  readonly kind: OpenSpecObservationDiagnosticKind;

  constructor(
    kind: OpenSpecObservationDiagnosticKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "OpenSpecObservationError";
    this.kind = kind;
  }
}

interface ProcessOutcome {
  readonly exitCode: number;
  readonly stdout: string;
}

const ARTIFACT_STATUSES = new Set<OpenSpecArtifactStatus>([
  "ready",
  "blocked",
  "done",
  "skipped",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(
  kind: OpenSpecObservationDiagnosticKind,
  message: string,
  cause?: unknown,
): never {
  throw new OpenSpecObservationError(
    kind,
    message,
    cause === undefined ? undefined : { cause },
  );
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail("invalid-machine-shape", `${label} must be a non-empty string`);
  }
  return value;
}

function stringArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) {
    fail("invalid-machine-shape", `${label} must be an array`);
  }
  const result = value.map((item, index) =>
    nonEmptyString(item, `${label}[${index}]`),
  );
  return Object.freeze(result);
}

function parseMachineDocument(stdout: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout) as unknown;
  } catch (error) {
    fail(
      "malformed-machine-output",
      "OpenSpec did not return valid JSON machine output",
      error,
    );
  }
  if (!isRecord(parsed)) {
    fail("invalid-machine-shape", "OpenSpec machine output must be an object");
  }
  return parsed;
}

function assertFormalOutcomeStatus(value: unknown): void {
  if (!Array.isArray(value) || value.length === 0) {
    fail(
      "invalid-machine-shape",
      "OpenSpec formal outcome status must be a non-empty array",
    );
  }
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      fail(
        "invalid-machine-shape",
        `OpenSpec formal outcome status[${index}] must be an object`,
      );
    }
    const keys = Object.keys(item);
    if (
      keys.some(
        (key) =>
          !["severity", "code", "message", "target", "fix"].includes(key),
      )
    ) {
      fail(
        "invalid-machine-shape",
        `OpenSpec formal outcome status[${index}] has an unsupported field`,
      );
    }
    if (!new Set(["error", "warning", "info"]).has(item.severity as string)) {
      fail(
        "invalid-machine-shape",
        `OpenSpec formal outcome status[${index}].severity is unsupported`,
      );
    }
    nonEmptyString(item.code, `status[${index}].code`);
    nonEmptyString(item.message, `status[${index}].message`);
    if (item.target !== undefined) {
      nonEmptyString(item.target, `status[${index}].target`);
    }
    if (item.fix !== undefined) {
      nonEmptyString(item.fix, `status[${index}].fix`);
    }
  }
}

type OpenSpecFormalOutcomeKind = "list" | "status";

function assertFormalOutcomeDocument(
  document: Record<string, unknown>,
  kind: OpenSpecFormalOutcomeKind,
): void {
  const topLevelKeys = Object.keys(document).sort();
  if (kind === "status") {
    if (topLevelKeys.length !== 1 || topLevelKeys[0] !== "status") {
      fail(
        "invalid-machine-shape",
        "OpenSpec status formal outcome has an unsupported envelope",
      );
    }
  } else {
    if (
      topLevelKeys.length !== 3 ||
      topLevelKeys[0] !== "changes" ||
      topLevelKeys[1] !== "root" ||
      topLevelKeys[2] !== "status" ||
      !Array.isArray(document.changes) ||
      document.changes.length !== 0 ||
      document.root !== null
    ) {
      fail(
        "invalid-machine-shape",
        "OpenSpec list formal outcome has an unsupported envelope",
      );
    }
  }
  assertFormalOutcomeStatus(document.status);
}

async function canonicalRepositoryRoot(
  repositoryRoot: string,
): Promise<string> {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    fail(
      "invalid-observation-input",
      "repositoryRoot must be a non-empty string",
    );
  }
  try {
    return await realpath(path.resolve(repositoryRoot));
  } catch (error) {
    fail(
      "invalid-observation-input",
      "repositoryRoot must resolve to an existing path",
      error,
    );
  }
}

async function invokeManagedOpenSpec(
  input: OpenSpecObservationInput,
  args: readonly string[],
  formalOutcomeKind: OpenSpecFormalOutcomeKind,
): Promise<{
  readonly repositoryRoot: string;
  readonly document: Record<string, unknown>;
}> {
  const repositoryRoot = await canonicalRepositoryRoot(input.repositoryRoot);
  const tool = await resolveManagedTool({
    repositoryRoot,
    flowkitHome: input.flowkitHome,
    toolId: "openspec",
  });

  const outcome = await new Promise<ProcessOutcome>((resolve, reject) => {
    const child = spawn(process.execPath, [tool.entrypoint, ...args], {
      cwd: repositoryRoot,
      shell: false,
      stdio: ["ignore", "pipe", "ignore"],
    });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code, signal) => {
      const close = classifyManagedOpenSpecClose(code, signal);
      if (close === "openspec-process-failed") {
        reject(new Error("OpenSpec process did not complete normally"));
        return;
      }
      resolve({ exitCode: close.exitCode, stdout });
    });
  }).catch((error: unknown) =>
    fail(
      "openspec-process-failed",
      "OpenSpec process invocation failed",
      error,
    ),
  );

  const document = parseMachineDocument(outcome.stdout);
  if (outcome.exitCode !== 0) {
    assertFormalOutcomeDocument(document, formalOutcomeKind);
    fail(
      "openspec-formal-outcome",
      "OpenSpec returned a formal non-success machine outcome",
    );
  }

  await assertExactRoot(document.root, repositoryRoot);
  return { repositoryRoot, document };
}

async function assertExactRoot(
  value: unknown,
  requestedRoot: string,
): Promise<void> {
  if (!isRecord(value)) {
    fail("invalid-machine-shape", "OpenSpec root must be an object");
  }
  const reportedPath = nonEmptyString(value.path, "root.path");
  let canonicalReportedRoot: string;
  try {
    canonicalReportedRoot = await realpath(path.resolve(reportedPath));
  } catch (error) {
    fail(
      "invalid-machine-shape",
      "OpenSpec root.path must resolve to an existing path",
      error,
    );
  }
  if (canonicalReportedRoot !== requestedRoot) {
    fail(
      "openspec-root-mismatch",
      "OpenSpec reported a repository root different from the requested root",
    );
  }
}

function parseArtifact(
  value: unknown,
  index: number,
): OpenSpecArtifactObservation {
  if (!isRecord(value)) {
    fail("invalid-machine-shape", `artifacts[${index}] must be an object`);
  }
  const id = nonEmptyString(value.id, `artifacts[${index}].id`);
  if (!ARTIFACT_STATUSES.has(value.status as OpenSpecArtifactStatus)) {
    fail(
      "invalid-machine-shape",
      `artifacts[${index}].status is not supported`,
    );
  }
  const requires = stringArray(value.requires, `artifacts[${index}].requires`);
  const missingDeps =
    value.missingDeps === undefined
      ? Object.freeze([] as string[])
      : stringArray(value.missingDeps, `artifacts[${index}].missingDeps`);

  return Object.freeze({
    id,
    status: value.status as OpenSpecArtifactStatus,
    requires,
    missingDeps,
  });
}

export async function observeOpenSpecActiveChanges(
  input: OpenSpecObservationInput,
): Promise<OpenSpecActiveChangesObservation> {
  const { document } = await invokeManagedOpenSpec(
    input,
    ["list", "--json"],
    "list",
  );
  if (!Array.isArray(document.changes)) {
    fail("invalid-machine-shape", "OpenSpec changes must be an array");
  }
  const changeIds = document.changes.map((value, index) => {
    if (!isRecord(value)) {
      fail("invalid-machine-shape", `changes[${index}] must be an object`);
    }
    const changeId = asChangeId(value.name);
    if (changeId === null) {
      fail(
        "invalid-machine-shape",
        `changes[${index}].name must be a canonical ChangeId`,
      );
    }
    return changeId;
  });
  return Object.freeze({ changeIds: Object.freeze(changeIds) });
}

export async function observeOpenSpecChangeStatus(
  input: OpenSpecChangeStatusInput,
): Promise<OpenSpecChangeStatusObservation> {
  const changeId = asChangeId(input.changeId);
  if (changeId === null) {
    fail("invalid-observation-input", "changeId must be a canonical ChangeId");
  }
  const { document } = await invokeManagedOpenSpec(
    input,
    ["status", "--change", changeId, "--json"],
    "status",
  );

  if (document.changeName !== changeId) {
    fail(
      "invalid-machine-shape",
      "OpenSpec changeName must exactly match the requested ChangeId",
    );
  }
  const schemaName = nonEmptyString(document.schemaName, "schemaName");
  const changeRoot = nonEmptyString(document.changeRoot, "changeRoot");
  if (typeof document.isPlanningComplete !== "boolean") {
    fail("invalid-machine-shape", "isPlanningComplete must be a boolean");
  }
  if (typeof document.isComplete !== "boolean") {
    fail("invalid-machine-shape", "isComplete must be a boolean");
  }
  if (!Array.isArray(document.artifacts)) {
    fail("invalid-machine-shape", "artifacts must be an array");
  }
  const artifacts = document.artifacts.map(parseArtifact);

  return Object.freeze({
    changeId,
    schemaName,
    changeRoot,
    isPlanningComplete: document.isPlanningComplete,
    isComplete: document.isComplete,
    artifacts: Object.freeze(artifacts),
  });
}
