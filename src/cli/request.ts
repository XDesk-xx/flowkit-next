import {
  asChangeId,
  asDeliveryId,
  isStandardActionId,
  type ChangeId,
  type DeliveryId,
} from "../domain/identity.js";
import type { JsonBudget } from "../internal/json-budget.js";

export const MAX_REQUEST_JSON_BYTES = 65_536;
export const MAX_GIT_REQUEST_JSON_BYTES = 1_048_576;
export const MAX_FINISH_REQUEST_JSON_BYTES = 1_048_576;
export function requestJsonLimit(command: string): number {
  if (command === "action finish") return MAX_FINISH_REQUEST_JSON_BYTES;
  return ["git checkpoint", "git push", "git integrate"].includes(command)
    ? MAX_GIT_REQUEST_JSON_BYTES
    : MAX_REQUEST_JSON_BYTES;
}

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
    readonly budget?: JsonBudget,
  ) {
    super(message, options);
    this.name = "FoundationCliInputError";
    this.kind = kind;
  }
}

interface CommonRunRequest {
  readonly repositoryRoot: string;
  readonly deliveryId?: DeliveryId;
  readonly changeId?: ChangeId;
  readonly flowkitHome: string;
}

export type StatusRequest = CommonRunRequest;

export interface NextRequest extends CommonRunRequest {
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
    fail(
      "invalid-request",
      Object.hasOwn(value, "currentRunId") ||
        Object.hasOwn(value, "changeStartSequence")
        ? "Remove currentRunId/changeStartSequence; context is resolved from target and optional deliveryId/changeId"
        : "request contains unsupported fields",
    );
  }
  const repositoryRoot = requiredNonEmptyString(value, "repositoryRoot");
  const flowkitHome = requiredNonEmptyString(value, "flowkitHome");
  const deliveryId =
    value.deliveryId === undefined ? undefined : asDeliveryId(value.deliveryId);
  const changeId =
    value.changeId === undefined ? undefined : asChangeId(value.changeId);
  if (deliveryId === null || changeId === null) {
    fail(
      "invalid-request",
      "deliveryId/changeId must be canonical semantic ids",
    );
  }
  return {
    repositoryRoot,
    deliveryId,
    changeId,
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
  return parseCommon(value, COMMON_FIELDS);
}

function parseNext(value: unknown): NextRequest {
  if (!isRecord(value))
    fail("invalid-request", "next request must be an object");
  const common = parseCommon(value, NEXT_FIELDS);
  return {
    ...common,
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

export function parseFoundationCliRequestJson(
  text: string,
  limit = MAX_REQUEST_JSON_BYTES,
): unknown {
  const observed = Buffer.byteLength(text);
  if (observed > limit)
    throw new FoundationCliInputError(
      "invalid-request-json",
      "request exceeds JSON limit",
      undefined,
      {
        subject: "request",
        dimension: "bytes",
        limit,
        observed,
        measurement: "exact",
      },
    );
  try {
    assertNoDuplicateJsonKeys(text);
    return JSON.parse(text) as unknown;
  } catch (error) {
    fail("invalid-request-json", "request file is not valid JSON", error);
  }
}

function assertNoDuplicateJsonKeys(text: string): void {
  let offset = 0;
  const skip = () => {
    while (/\s/.test(text[offset] ?? "") && offset < text.length) offset += 1;
  };
  const string = (): string => {
    if (text[offset] !== '"') throw new Error("expected JSON string");
    const start = offset++;
    while (offset < text.length) {
      if (text[offset] === "\\") {
        offset += 2;
        continue;
      }
      if (text[offset++] === '"')
        return JSON.parse(text.slice(start, offset)) as string;
    }
    throw new Error("unterminated JSON string");
  };
  const value = (depth: number): void => {
    if (depth > 32) throw new Error("JSON depth exceeded");
    skip();
    const first = text[offset];
    if (first === "{") {
      offset += 1;
      skip();
      const keys = new Set<string>();
      if (text[offset] === "}") {
        offset += 1;
        return;
      }
      for (;;) {
        const key = string();
        if (keys.has(key)) throw new Error("duplicate JSON key");
        keys.add(key);
        skip();
        if (text[offset++] !== ":") throw new Error("expected colon");
        value(depth + 1);
        skip();
        const separator = text[offset++];
        if (separator === "}") return;
        if (separator !== ",") throw new Error("expected object separator");
        skip();
      }
    }
    if (first === "[") {
      offset += 1;
      skip();
      if (text[offset] === "]") {
        offset += 1;
        return;
      }
      for (;;) {
        value(depth + 1);
        skip();
        const separator = text[offset++];
        if (separator === "]") return;
        if (separator !== ",") throw new Error("expected array separator");
      }
    }
    if (first === '"') {
      string();
      return;
    }
    const start = offset;
    while (offset < text.length && !/[\s,}\]]/.test(text[offset])) offset += 1;
    if (start === offset) throw new Error("expected JSON value");
    JSON.parse(text.slice(start, offset));
  };
  value(0);
  skip();
  if (offset !== text.length) throw new Error("trailing JSON data");
}
