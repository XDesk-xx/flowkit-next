#!/usr/bin/env node
import { readRequestInput } from "./request-input.js";
import { executeSupportCommand } from "./support-commands.js";
import {
  parseSupportArguments,
  parseSupportRequest,
  SUPPORT_COMMANDS,
} from "./support-request.js";
import { executeActionCommand } from "./action-commands.js";
import { ActionCommandError } from "./action-error.js";
import {
  assertVisibleTarget,
  parseActionArguments,
  parseActionCommandRequest,
} from "./action-request.js";
import { ActionContextError } from "./current-run-chain.js";
import { TrustedChangeCoordinationError } from "./trusted-change-coordination.js";
import { OpenSpecObservationError } from "../domain/openspec-observation.js";
import { ManagedToolResolutionError } from "../domain/managed-tool-resolution.js";
import {
  loadManagerInstallation,
  ManagerInstallationError,
} from "../internal/manager-installation.js";

import {
  FoundationCliCommandError,
  executeFoundationCliRequest,
} from "./foundation-cli.js";
import {
  FoundationCliInputError,
  requestJsonLimit,
  parseFoundationCliArguments,
  parseFoundationCliRequest,
  parseFoundationCliRequestJson,
} from "./request.js";

interface CliFailureEnvelope {
  readonly kind: "error";
  readonly error: {
    readonly kind: string;
  };
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function failure(kind: string): CliFailureEnvelope {
  return Object.freeze({
    kind: "error",
    error: Object.freeze({ kind }),
  });
}

async function main(): Promise<number> {
  try {
    const argv = process.argv.slice(2);
    if (
      (argv.length === 1 && (argv[0] === "--help" || argv[0] === "help")) ||
      (argv.length === 2 &&
        argv[1] === "--help" &&
        (argv[0] === "action" || argv[0] === "proof"))
    ) {
      writeJson({
        kind: "help",
        commands: [
          "status",
          "next",
          "doctor",
          "action start",
          "action finish",
          "action inspect",
          "action correct",
          "proof inspect",
          ...SUPPORT_COMMANDS,
        ],
        input:
          "--input <path|-> (JSON, default 65536 UTF-8 bytes; action finish and git checkpoint/push/integrate 1048576 bytes; Result facts 524288 bytes)",
        actionTargetFlags: [
          "--repository-root",
          "--delivery-id",
          "--change-id",
        ],
        inspectFields: [
          "repositoryRoot",
          "flowkitHome",
          "deliveryId",
          "changeId",
          "runId",
        ],
        correctFields: [
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
        ],
        stoppedReview:
          "rejected/null -> blocked(review-rejected); exact Owner revise-action only",
      });
      return 0;
    }
    if (
      (argv[0] === "action" &&
        ["start", "finish", "inspect", "correct"].includes(argv[1])) ||
      (argv[0] === "proof" && argv[1] === "inspect")
    ) {
      const { inputPath, visible } = parseActionArguments(argv.slice(2));
      const command = `${argv[0]} ${argv[1]}` as
        | "action start"
        | "action finish"
        | "action inspect"
        | "action correct"
        | "proof inspect";
      const limit = requestJsonLimit(command);
      const inputText = await readRequestInput(inputPath, limit);
      const parsed = parseActionCommandRequest(
        command,
        parseFoundationCliRequestJson(inputText, limit),
      );
      assertVisibleTarget(visible, parsed.request);
      writeJson(await executeActionCommand(parsed, loadManagerInstallation()));
      return 0;
    }
    if (
      ["project", "delivery", "change", "memo", "git"].includes(argv[0] ?? "")
    ) {
      const { command, inputPath, visible } = parseSupportArguments(argv);
      const limit = requestJsonLimit(command);
      const requestText = await readRequestInput(inputPath, limit);
      const request = parseSupportRequest(
        command,
        parseFoundationCliRequestJson(requestText, limit),
        visible,
      );
      const result = await executeSupportCommand(
        command,
        request,
        loadManagerInstallation(),
      );
      writeJson(result);
      return result.status === "completed" ? 0 : 2;
    }
    const { command, inputPath } = parseFoundationCliArguments(argv);
    const requestText = await readRequestInput(inputPath);
    const raw = parseFoundationCliRequestJson(requestText);
    const request = parseFoundationCliRequest(command, raw);
    writeJson(
      await executeFoundationCliRequest(request, loadManagerInstallation()),
    );
    return 0;
  } catch (error) {
    if (
      error instanceof FoundationCliInputError ||
      error instanceof FoundationCliCommandError ||
      error instanceof ManagerInstallationError ||
      error instanceof ActionContextError ||
      error instanceof TrustedChangeCoordinationError ||
      error instanceof OpenSpecObservationError ||
      error instanceof ManagedToolResolutionError ||
      error instanceof ActionCommandError
    ) {
      writeJson(
        error instanceof ActionCommandError
          ? {
              kind: "error",
              effect: error.effect,
              runId: error.runId,
              error: {
                kind: error.kind,
                message: error.message,
                ...(error.budget === undefined ? {} : { budget: error.budget }),
              },
            }
          : error instanceof ActionContextError
            ? {
                kind: "error",
                error: {
                  kind: error.kind,
                  message: error.message,
                  candidates: error.candidates,
                  inspect: error.inspectLocator,
                },
              }
            : error instanceof FoundationCliInputError &&
                (error.kind === "invalid-request" || error.budget !== undefined)
              ? {
                  kind: "error",
                  error: {
                    kind: error.kind,
                    message: error.message,
                    ...(error.budget === undefined
                      ? {}
                      : { budget: error.budget }),
                  },
                }
              : failure(error.kind),
      );
      return 2;
    }
    writeJson(failure("internal-error"));
    return 3;
  }
}

process.exitCode = await main();
