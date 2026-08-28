#!/usr/bin/env node
import { readFile } from "node:fs/promises";

import {
  FoundationCliCommandError,
  executeFoundationCliRequest,
} from "./foundation-cli.js";
import {
  FoundationCliInputError,
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
    const { command, inputPath } = parseFoundationCliArguments(
      process.argv.slice(2),
    );
    let requestText: string;
    try {
      requestText = await readFile(inputPath, "utf8");
    } catch (error) {
      throw new FoundationCliInputError(
        "invalid-arguments",
        "cannot read --input request file",
        { cause: error },
      );
    }
    const raw = parseFoundationCliRequestJson(requestText);
    const request = parseFoundationCliRequest(command, raw);
    writeJson(await executeFoundationCliRequest(request));
    return 0;
  } catch (error) {
    if (
      error instanceof FoundationCliInputError ||
      error instanceof FoundationCliCommandError
    ) {
      writeJson(failure(error.kind));
      return 2;
    }
    writeJson(failure("internal-error"));
    return 3;
  }
}

process.exitCode = await main();
