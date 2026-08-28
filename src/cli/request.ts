import {
  asChangeId,
  asDeliveryId,
  isStandardActionId,
  type ChangeId,
  type DeliveryId,
} from "../domain/identity.js";
import { isRunSequence } from "../domain/run-result-persistence.js";
import { isChangeState, type ChangeState } from "../domain/state.js";

export type FoundationCliCommand = "status" | "next" | "doctor";

export class FoundationCliInputError extends Error {
  readonly kind:
    | "invalid-command"
    | "invalid-arguments"
    | "invalid-request"
    | "invalid-request-json";

  constructor(
    kind: FoundationCliInputError["kind"],
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "FoundationCliInputError";
    this.kind = kind;
  }
}

interface CommonRunRequest {
  readonly repositoryRoot: string;
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
  readonly changeState: ChangeState;
  readonly changeStartSequence: number;
  readonly flowkitHome: string;
}

export interface StatusRequest extends CommonRunRequest {
  readonly currentRunId: string;
}

export interface NextRequest extends CommonRunRequest {
  readonly currentRunId: string | null;
  readonly ownerCorrection?: unknown;
  readonly checkpointAuthority?: unknown;
}

export interface DoctorRequest {
  readonly repositoryRoot: string;
  readonly flowkitHome: string;
}

export type FoundationCliRequest =
  | { readonly command: "status"; readonly request: StatusRequest }
  | { readonly command: "next"; readonly request: NextRequest }
  | { readonly command: "doctor"; readonly request: DoctorRequest };

const COMMON_FIELDS = new Set([
  "repositoryRoot",
  "deliveryId",
  "changeId",
  "changeState",
  "changeStartSequence",
  "currentRunId",
  "flowkitHome",
]);
const NEXT_FIELDS = new Set([
  ...COMMON_FIELDS,
  "ownerCorrection",
  "checkpointAuthority",
]);
const DOCTOR_FIELDS = new Set(["repositoryRoot", "flowkitHome"]);

function fail(
  kind: FoundationCliInputError["kind"],
  message: string,
  cause?: unknown,
): never {
  throw new FoundationCliInputError(
    kind,
    message,
    cause === undefined ? undefined : { cause },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function requiredNonEmptyString(
  value: Record<string, unknown>,
  key: string,
): string {
  if (!Object.hasOwn(value, key)) fail("invalid-request", `${key} is required`);
  const candidate = value[key];
  if (typeof candidate !== "string" || candidate.length === 0) {
    fail("invalid-request", `${key} must be a non-empty string`);
  }
  return candidate;
}

function parseCommon(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): CommonRunRequest {
  if (!hasOnlyKeys(value, allowed)) {
    fail("invalid-request", "request contains unsupported fields");
  }
  const repositoryRoot = requiredNonEmptyString(value, "repositoryRoot");
  const flowkitHome = requiredNonEmptyString(value, "flowkitHome");
  const deliveryId = asDeliveryId(value.deliveryId);
  const changeId = asChangeId(value.changeId);
  if (deliveryId === null || changeId === null) {
    fail(
      "invalid-request",
      "deliveryId/changeId must be canonical semantic ids",
    );
  }
  if (!isChangeState(value.changeState)) {
    fail("invalid-request", "changeState is invalid");
  }
  if (!isRunSequence(value.changeStartSequence)) {
    fail("invalid-request", "changeStartSequence is invalid");
  }
  return {
    repositoryRoot,
    deliveryId,
    changeId,
    changeState: value.changeState,
    changeStartSequence: value.changeStartSequence,
    flowkitHome,
  };
}

function parseOwnerCorrection(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (!isRecord(value)) {
    fail("invalid-request", "ownerCorrection must be an object or null");
  }
  const keys = Object.keys(value);
  if (keys.some((key) => key !== "requestedAction" && key !== "authority")) {
    fail("invalid-request", "ownerCorrection contains unsupported fields");
  }
  if (
    !Object.hasOwn(value, "requestedAction") ||
    !isStandardActionId(value.requestedAction)
  ) {
    fail("invalid-request", "ownerCorrection.requestedAction is invalid");
  }
  return value;
}

function parseStatus(value: unknown): StatusRequest {
  if (!isRecord(value))
    fail("invalid-request", "status request must be an object");
  const common = parseCommon(value, COMMON_FIELDS);
  if (!Object.hasOwn(value, "currentRunId")) {
    fail("invalid-request", "currentRunId is required");
  }
  if (
    typeof value.currentRunId !== "string" ||
    value.currentRunId.length === 0
  ) {
    fail("invalid-request", "status currentRunId must be an exact run id");
  }
  return { ...common, currentRunId: value.currentRunId };
}

function parseNext(value: unknown): NextRequest {
  if (!isRecord(value))
    fail("invalid-request", "next request must be an object");
  const common = parseCommon(value, NEXT_FIELDS);
  if (!Object.hasOwn(value, "currentRunId")) {
    fail("invalid-request", "currentRunId is required");
  }
  const currentRunId = value.currentRunId;
  if (
    currentRunId !== null &&
    (typeof currentRunId !== "string" || currentRunId.length === 0)
  ) {
    fail(
      "invalid-request",
      "next currentRunId must be an exact run id or explicit null",
    );
  }
  return {
    ...common,
    currentRunId,
    ...(Object.hasOwn(value, "ownerCorrection")
      ? { ownerCorrection: parseOwnerCorrection(value.ownerCorrection) }
      : {}),
    ...(Object.hasOwn(value, "checkpointAuthority")
      ? { checkpointAuthority: value.checkpointAuthority }
      : {}),
  };
}

function parseDoctor(value: unknown): DoctorRequest {
  if (!isRecord(value) || !hasOnlyKeys(value, DOCTOR_FIELDS)) {
    fail("invalid-request", "doctor request shape is invalid");
  }
  return {
    repositoryRoot: requiredNonEmptyString(value, "repositoryRoot"),
    flowkitHome: requiredNonEmptyString(value, "flowkitHome"),
  };
}

export function parseFoundationCliCommand(
  value: unknown,
): FoundationCliCommand {
  if (value === "status" || value === "next" || value === "doctor")
    return value;
  fail("invalid-command", "unsupported Foundation CLI command");
}

export function parseFoundationCliArguments(argv: readonly string[]): {
  readonly command: FoundationCliCommand;
  readonly inputPath: string;
} {
  if (argv.length !== 3 || argv[1] !== "--input") {
    fail("invalid-arguments", "expected: <status|next|doctor> --input <path>");
  }
  const command = parseFoundationCliCommand(argv[0]);
  const inputPath = argv[2];
  if (typeof inputPath !== "string" || inputPath.length === 0) {
    fail("invalid-arguments", "--input requires a path");
  }
  return { command, inputPath };
}

export function parseFoundationCliRequest(
  command: FoundationCliCommand,
  value: unknown,
): FoundationCliRequest {
  switch (command) {
    case "status":
      return { command, request: parseStatus(value) };
    case "next":
      return { command, request: parseNext(value) };
    case "doctor":
      return { command, request: parseDoctor(value) };
  }
}

export function parseFoundationCliRequestJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    fail("invalid-request-json", "request file is not valid JSON", error);
  }
}
