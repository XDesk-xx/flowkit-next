import {
  isOwnerAuthorityFact,
  type ActionExecutionRole,
  type OwnerAuthorityFact,
} from "../domain/authority.js";
import {
  isRunResultRecord,
  parseRunOccurrenceId,
  type RunResultRecord,
  type JsonObject,
} from "../domain/run-result-persistence.js";
import {
  asChangeId,
  asDeliveryId,
  isStandardActionId,
  type ChangeId,
  type DeliveryId,
  type StandardActionId,
} from "../domain/identity.js";
import { FoundationCliInputError } from "./request.js";
import path from "node:path";
import {
  validateCorrectionShape,
  type RunHashes,
} from "./run-effective-facts.js";

export interface ActionTarget {
  readonly repositoryRoot: string;
  readonly flowkitHome: string;
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
}
export interface StartRequest extends ActionTarget {
  readonly actionId: StandardActionId;
  readonly role: ActionExecutionRole;
  readonly ownerAuthority?: OwnerAuthorityFact;
  readonly applicableChecks?: readonly {
    readonly id: string;
    readonly reason: string;
  }[];
}
export interface FinishRequest extends ActionTarget {
  readonly runId: string;
  readonly role: ActionExecutionRole;
  readonly result: RunResultRecord;
  readonly terminal: boolean;
}
export interface ProofRequest extends ActionTarget {
  readonly runId: string;
  readonly path: string;
}
export interface InspectRequest extends ActionTarget {
  readonly runId: string;
}
export interface CorrectRequest extends InspectRequest {
  readonly role: ActionExecutionRole;
  readonly ownerAuthority: OwnerAuthorityFact;
  readonly expectedRunHashes: RunHashes;
  readonly additions: JsonObject;
  readonly candidateEvidenceRef: string | null;
}
export type ActionCommandRequest =
  | { readonly command: "action start"; readonly request: StartRequest }
  | { readonly command: "action finish"; readonly request: FinishRequest }
  | { readonly command: "action inspect"; readonly request: InspectRequest }
  | { readonly command: "action correct"; readonly request: CorrectRequest }
  | { readonly command: "proof inspect"; readonly request: ProofRequest };

export function parseActionArguments(argv: readonly string[]): {
  readonly inputPath: string;
  readonly visible: Readonly<Record<string, string>>;
} {
  const visible: Record<string, string> = {};
  let inputPath: string | null = null;
  const keys: Record<string, string> = {
    "--repository-root": "repositoryRoot",
    "--delivery-id": "deliveryId",
    "--change-id": "changeId",
  };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag || !value || index + 1 >= argv.length)
      fail("expected fixed flag/value pairs");
    if (flag === "--input") {
      if (inputPath !== null) fail("duplicate --input");
      inputPath = value;
    } else if (keys[flag]) {
      const key = keys[flag];
      if (Object.hasOwn(visible, key)) fail(`duplicate ${flag}`);
      visible[key] = value;
    } else fail("unsupported Action argument");
  }
  if (inputPath === null) fail("--input is required");
  return { inputPath, visible };
}

export function assertVisibleTarget(
  visible: Readonly<Record<string, string>>,
  request: ActionTarget,
): void {
  for (const [key, value] of Object.entries(visible)) {
    const actual = request[key as keyof ActionTarget];
    if (
      key === "repositoryRoot"
        ? path.resolve(value) !== path.resolve(actual)
        : value !== actual
    )
      fail(`visible ${key} conflicts with JSON target`);
  }
}

function fail(message: string): never {
  throw new FoundationCliInputError("invalid-request", message);
}
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail("request must be an object");
  return value as Record<string, unknown>;
}
function only(value: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(value).some((key) => !keys.includes(key)))
    fail("request contains unsupported fields");
}
function requiredString(value: Record<string, unknown>, key: string): string {
  const item = value[key];
  if (typeof item !== "string" || !item.length) fail(`${key} is required`);
  return item;
}
function target(value: Record<string, unknown>): ActionTarget {
  const deliveryId = asDeliveryId(value.deliveryId);
  const changeId = asChangeId(value.changeId);
  if (deliveryId === null || changeId === null)
    fail("invalid Delivery/Change target");
  return {
    repositoryRoot: requiredString(value, "repositoryRoot"),
    flowkitHome: requiredString(value, "flowkitHome"),
    deliveryId,
    changeId,
  };
}
function role(value: unknown): ActionExecutionRole {
  if (value !== "author" && value !== "reviewer")
    fail("invalid execution Role");
  return value;
}
function runId(value: Record<string, unknown>): string {
  const id = requiredString(value, "runId");
  if (parseRunOccurrenceId(id) === null) fail("invalid Run locator");
  return id;
}

export function parseActionCommandRequest(
  command: ActionCommandRequest["command"],
  raw: unknown,
): ActionCommandRequest {
  const value = record(raw);
  if (command === "action inspect") {
    only(value, [
      "repositoryRoot",
      "flowkitHome",
      "deliveryId",
      "changeId",
      "runId",
    ]);
    return { command, request: { ...target(value), runId: runId(value) } };
  }
  if (command === "action correct") {
    only(value, [
      "repositoryRoot",
      "flowkitHome",
      "deliveryId",
      "changeId",
      "runId",
      "role",
      "ownerAuthority",
      "expectedRunHashes",
      "additions",
      "candidateEvidenceRef",
    ]);
    const t = target(value);
    let c;
    try {
      c = validateCorrectionShape({
        formatVersion: 1,
        deliveryId: t.deliveryId,
        changeId: t.changeId,
        runId: runId(value),
        role: role(value.role),
        ownerAuthority: value.ownerAuthority,
        originalHashes: value.expectedRunHashes,
        additions: value.additions,
        candidateEvidenceRef: value.candidateEvidenceRef,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      fail(error instanceof Error ? error.message : "invalid correction");
    }
    return {
      command,
      request: {
        ...t,
        runId: c.runId,
        role: c.role,
        ownerAuthority: c.ownerAuthority,
        expectedRunHashes: c.originalHashes,
        additions: c.additions,
        candidateEvidenceRef: c.candidateEvidenceRef,
      },
    };
  }
  if (command === "action start") {
    only(value, [
      "repositoryRoot",
      "flowkitHome",
      "deliveryId",
      "changeId",
      "actionId",
      "role",
      "ownerAuthority",
      "applicableChecks",
    ]);
    if (!isStandardActionId(value.actionId)) fail("invalid exact Action");
    if (
      value.actionId === "archive" &&
      Object.hasOwn(value, "applicableChecks")
    )
      fail(
        "Archive contract version 2 no longer accepts applicableChecks; project verification belongs to Apply/Review/Full Test",
      );
    if (
      value.ownerAuthority !== undefined &&
      !isOwnerAuthorityFact(value.ownerAuthority)
    )
      fail("invalid Owner fact");
    if (
      value.applicableChecks !== undefined &&
      (!Array.isArray(value.applicableChecks) ||
        !value.applicableChecks.every(
          (check) =>
            typeof check === "object" &&
            check !== null &&
            !Array.isArray(check) &&
            Object.keys(check).sort().join(",") === "id,reason" &&
            typeof check.id === "string" &&
            /^[a-z0-9:-]+$/.test(check.id) &&
            typeof check.reason === "string" &&
            check.reason.trim().length > 0,
        ) ||
        new Set(value.applicableChecks.map((check) => check.id)).size !==
          value.applicableChecks.length)
    )
      fail("invalid applicable checks");
    return {
      command,
      request: {
        ...target(value),
        actionId: value.actionId,
        role: role(value.role),
        ...(value.ownerAuthority === undefined
          ? {}
          : { ownerAuthority: value.ownerAuthority }),
        ...(value.applicableChecks === undefined
          ? {}
          : {
              applicableChecks: value.applicableChecks as {
                id: string;
                reason: string;
              }[],
            }),
      },
    };
  }
  if (command === "action finish") {
    only(value, [
      "repositoryRoot",
      "flowkitHome",
      "deliveryId",
      "changeId",
      "runId",
      "role",
      "result",
      "terminal",
    ]);
    if (!isRunResultRecord(value.result)) fail("invalid Result record");
    if (typeof value.terminal !== "boolean") fail("terminal must be boolean");
    return {
      command,
      request: {
        ...target(value),
        runId: runId(value),
        role: role(value.role),
        result: value.result,
        terminal: value.terminal,
      },
    };
  }
  only(value, [
    "repositoryRoot",
    "flowkitHome",
    "deliveryId",
    "changeId",
    "runId",
    "path",
  ]);
  return {
    command,
    request: {
      ...target(value),
      runId: runId(value),
      path: requiredString(value, "path"),
    },
  };
}
