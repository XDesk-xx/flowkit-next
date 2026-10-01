import path from "node:path";
import { isOwnerAuthorityFact } from "../domain/authority.js";
import { isSemanticId } from "../domain/identity.js";
import { FoundationCliInputError } from "./request.js";

export const SUPPORT_COMMANDS = [
  "project init",
  "delivery start",
  "change activate",
  "change archive",
  "memo list",
  "memo get",
  "memo create",
  "memo promote",
  "memo dismiss",
  "delivery full-test",
  "delivery full-test current",
  "delivery final",
  "git checkpoint",
  "git push",
  "git integrate",
] as const;
export type SupportCommand = (typeof SUPPORT_COMMANDS)[number];

const FIELDS: Record<SupportCommand, readonly string[]> = {
  "project init": ["projectId", "repository", "runtimeFamily", "sourceRef"],
  "delivery start": [
    "deliveryId",
    "ownerAuthority",
    "planningReference",
    "manifest",
  ],
  "change activate": ["deliveryId", "changeId", "ownerAuthority"],
  "change archive": ["deliveryId", "changeId", "runId"],
  "memo list": [],
  "memo get": ["memoId"],
  "memo create": ["memo", "ownerAuthority"],
  "memo promote": ["memoId", "target", "ownerAuthority"],
  "memo dismiss": ["memoId", "ownerAuthority"],
  "delivery full-test": [
    "deliveryId",
    "ownerAuthority",
    "attemptId",
    "expectedCurrentAttemptId",
  ],
  "delivery full-test current": ["deliveryId"],
  "delivery final": ["deliveryId", "ownerAuthority"],
  "git checkpoint": ["deliveryId", "changeId", "ownerAuthority", "gitRequest"],
  "git push": ["deliveryId", "changeId", "ownerAuthority", "gitRequest"],
  "git integrate": [
    "deliveryId",
    "ownerAuthority",
    "gitRequest",
    "integrationInput",
  ],
};
const DELIVERY_COMMANDS = new Set<SupportCommand>([
  "delivery start",
  "change activate",
  "change archive",
  "delivery full-test",
  "delivery full-test current",
  "delivery final",
  "git checkpoint",
  "git push",
  "git integrate",
]);
const CHANGE_COMMANDS = new Set<SupportCommand>([
  "change activate",
  "change archive",
]);
const OWNER_COMMANDS = new Set<SupportCommand>([
  "delivery start",
  "change activate",
  "memo create",
  "memo promote",
  "memo dismiss",
  "delivery full-test",
  "delivery final",
  "git checkpoint",
  "git push",
  "git integrate",
]);

function fail(message: string): never {
  throw new FoundationCliInputError("invalid-request", message);
}
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail("support request must be an object");
  return value as Record<string, unknown>;
}
function string(value: unknown, key: string): string {
  if (typeof value !== "string" || !value || /[\0\r\n]/.test(value))
    fail(`invalid ${key}`);
  return value;
}

export function parseSupportArguments(argv: readonly string[]): {
  command: SupportCommand;
  inputPath: string;
  visible: Readonly<Record<string, string>>;
} {
  const command = [...SUPPORT_COMMANDS]
    .sort((a, b) => b.length - a.length)
    .find((item) => argv.slice(0, item.split(" ").length).join(" ") === item);
  if (!command)
    throw new FoundationCliInputError(
      "invalid-command",
      "unknown support command",
    );
  const args = argv.slice(command.split(" ").length);
  const visible: Record<string, string> = {};
  let inputPath: string | null = null;
  const flags: Record<string, string> = {
    "--repository-root": "repositoryRoot",
    "--delivery-id": "deliveryId",
    "--change-id": "changeId",
  };
  if (args.length % 2 !== 0)
    throw new FoundationCliInputError(
      "invalid-arguments",
      "expected fixed flag/value pairs",
    );
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!value)
      throw new FoundationCliInputError(
        "invalid-arguments",
        "empty flag value",
      );
    if (flag === "--input") {
      if (inputPath !== null)
        throw new FoundationCliInputError(
          "invalid-arguments",
          "duplicate --input",
        );
      inputPath = value;
    } else if (flags[flag]) {
      const key = flags[flag];
      if (Object.hasOwn(visible, key))
        throw new FoundationCliInputError(
          "invalid-arguments",
          `duplicate ${flag}`,
        );
      visible[key] = value;
    } else
      throw new FoundationCliInputError(
        "invalid-arguments",
        "unsupported support flag",
      );
  }
  if (inputPath === null || !visible.repositoryRoot)
    throw new FoundationCliInputError(
      "invalid-arguments",
      "--input and visible target required",
    );
  if (DELIVERY_COMMANDS.has(command) && !visible.deliveryId)
    throw new FoundationCliInputError(
      "invalid-arguments",
      "visible deliveryId required",
    );
  if (CHANGE_COMMANDS.has(command) && !visible.changeId)
    throw new FoundationCliInputError(
      "invalid-arguments",
      "visible changeId required",
    );
  return { command, inputPath, visible };
}

export function parseSupportRequest(
  command: SupportCommand,
  raw: unknown,
  visible: Readonly<Record<string, string>>,
): Record<string, unknown> {
  const value = record(raw);
  const allowed = new Set([
    "repositoryRoot",
    "flowkitHome",
    ...FIELDS[command],
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key)))
    fail("request contains unsupported fields");
  const repositoryRoot = string(value.repositoryRoot, "repositoryRoot");
  string(value.flowkitHome, "flowkitHome");
  if (
    visible.repositoryRoot &&
    path.resolve(visible.repositoryRoot) !== path.resolve(repositoryRoot)
  )
    fail("visible repositoryRoot conflicts with request");
  if (DELIVERY_COMMANDS.has(command) && !isSemanticId(value.deliveryId))
    fail("invalid deliveryId");
  if (CHANGE_COMMANDS.has(command) && !isSemanticId(value.changeId))
    fail("invalid changeId");
  if (
    (command === "git checkpoint" || command === "git push") &&
    value.changeId !== undefined &&
    (!isSemanticId(value.changeId) || visible.changeId !== value.changeId)
  )
    fail("visible changeId required for Change Git operation");
  for (const key of ["deliveryId", "changeId"]) {
    if (visible[key] && visible[key] !== value[key])
      fail(`visible ${key} conflicts with request`);
  }
  if (
    OWNER_COMMANDS.has(command) &&
    !isOwnerAuthorityFact(value.ownerAuthority)
  )
    fail("invalid Owner authority");
  if (command === "project init") {
    for (const key of ["projectId", "repository", "runtimeFamily", "sourceRef"])
      string(value[key], key);
    if (!isSemanticId(value.projectId)) fail("invalid projectId");
    if (value.runtimeFamily !== "new") fail("invalid runtimeFamily");
    if (!/^[!-~]{1,512}$/.test(value.sourceRef as string))
      fail("invalid sourceRef");
  }
  if (
    command === "memo get" ||
    command === "memo promote" ||
    command === "memo dismiss"
  ) {
    if (!isSemanticId(value.memoId)) fail("invalid memoId");
  }
  if (command === "delivery full-test") {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        String(value.attemptId),
      )
    )
      fail("invalid attemptId");
    if (
      value.expectedCurrentAttemptId !== null &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        String(value.expectedCurrentAttemptId),
      )
    )
      fail("invalid expectedCurrentAttemptId");
  }
  return value;
}
