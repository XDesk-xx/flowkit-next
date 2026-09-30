import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import {
  isActionPackage,
  type ActionPackage,
} from "../domain/action-package-result-admission.js";
import {
  isRunContextRecord,
  type RunContextRecord,
} from "../domain/run-result-persistence.js";
import { blocked } from "./action-error.js";
import { parseFoundationCliRequestJson } from "./request.js";

interface StartedDescriptor {
  readonly startedAt: string;
  readonly repositoryRoot: string;
  readonly formatVersion: 1;
  readonly commandOrigin: "flowkit-action-start";
  readonly changeStartSequence: number;
  readonly actionPackage: ActionPackage;
  readonly preparedContext: RunContextRecord;
  readonly applicableChecks?: readonly {
    readonly id: string;
    readonly reason: string;
  }[];
}
export async function readDescriptor(
  directory: string,
): Promise<{ markdown: string; descriptor: StartedDescriptor }> {
  if ((await lstat(directory)).isSymbolicLink())
    blocked("linked-run", "Run directory is linked");
  const markdown = await readFile(path.join(directory, "action.md"), "utf8");
  if (
    !markdown.startsWith("# Action started\n\n") ||
    Buffer.byteLength(markdown) > 65_536
  )
    blocked("descriptor-invalid", "Unknown or oversized Action descriptor");
  let value;
  try {
    value = parseFoundationCliRequestJson(
      markdown.slice("# Action started\n\n".length),
    );
  } catch {
    blocked("descriptor-invalid", "Action descriptor JSON is invalid");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value))
    blocked("descriptor-invalid", "Action descriptor object required");
  const object = value as Record<string, unknown>;
  if (
    Object.keys(object).sort().join(",") !==
      [
        "startedAt",
        "repositoryRoot",
        "formatVersion",
        "commandOrigin",
        "changeStartSequence",
        "actionPackage",
        "preparedContext",
        ...(Object.hasOwn(object, "applicableChecks")
          ? ["applicableChecks"]
          : []),
      ]
        .sort()
        .join(",") ||
    object.formatVersion !== 1 ||
    object.commandOrigin !== "flowkit-action-start" ||
    typeof object.startedAt !== "string" ||
    typeof object.repositoryRoot !== "string" ||
    !Number.isSafeInteger(object.changeStartSequence) ||
    !isActionPackage(object.actionPackage) ||
    !isRunContextRecord(object.preparedContext) ||
    (Object.hasOwn(object, "applicableChecks") &&
      (object.actionPackage.actionIdentity.actionId !== "archive" ||
        !Array.isArray(object.applicableChecks) ||
        object.applicableChecks.length === 0 ||
        !object.applicableChecks.every(
          (check: unknown) =>
            typeof check === "object" &&
            check !== null &&
            !Array.isArray(check) &&
            Object.keys(check).sort().join() === "id,reason" &&
            typeof (check as { id?: unknown }).id === "string" &&
            /^[a-z0-9:-]+$/.test((check as { id: string }).id) &&
            typeof (check as { reason?: unknown }).reason === "string" &&
            (check as { reason: string }).reason.trim().length > 0,
        )))
  )
    blocked("descriptor-invalid", "Unrecognized Action descriptor shape");
  return { markdown, descriptor: object as unknown as StartedDescriptor };
}
