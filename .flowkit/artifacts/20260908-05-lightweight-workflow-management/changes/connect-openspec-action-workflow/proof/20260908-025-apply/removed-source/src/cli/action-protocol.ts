import type { Readable, Writable } from "node:stream";
import { StringDecoder } from "node:string_decoder";
import { MAX_RUN_FACTS_JSON_BYTES } from "../domain/run-result-persistence.js";

export class ActionProtocolError extends Error {
  constructor(readonly kind: string) {
    super(kind);
    this.name = "ActionProtocolError";
  }
}
export interface ActionTransport {
  exchange(
    frame: unknown,
    expected: "prepared" | "result",
    runId: string,
  ): Promise<Record<string, unknown>>;
  assertClean(): void;
  send(frame: unknown): void;
  close(): void;
}

export function jsonLineActionTransport(
  input: Readable,
  output: Writable,
): ActionTransport {
  let buffer = "";
  let failure: ActionProtocolError | null = null;
  let ended = false;
  let closed = false;
  let waiting: {
    expected: "prepared" | "result";
    runId: string;
    resolve: (value: Record<string, unknown>) => void;
    reject: (error: unknown) => void;
  } | null = null;
  const decoder = new StringDecoder("utf8");
  function reject(kind: string) {
    failure ??= new ActionProtocolError(kind);
    buffer = "";
    waiting?.reject(failure);
    waiting = null;
  }
  function line(text: string) {
    if (closed) return;
    if (!waiting) {
      reject("unexpected-host-frame");
      return;
    }
    let value: unknown;
    try {
      value = JSON.parse(text) as unknown;
    } catch {
      reject("invalid-host-json");
      return;
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      reject("invalid-host-frame");
      return;
    }
    const frame = value as Record<string, unknown>;
    const keys =
      waiting.expected === "prepared"
        ? ["kind", "runId", "outcome", "reason"]
        : ["kind", "runId", "result"];
    if (
      Object.keys(frame).length !== keys.length ||
      !keys.every((key) => Object.hasOwn(frame, key)) ||
      frame.kind !== waiting.expected ||
      frame.runId !== waiting.runId
    ) {
      reject("invalid-host-frame");
      return;
    }
    if (
      waiting.expected === "prepared" &&
      ((frame.outcome !== "ready" && frame.outcome !== "blocked") ||
        (frame.reason !== null && typeof frame.reason !== "string") ||
        (frame.outcome === "blocked" &&
          (typeof frame.reason !== "string" ||
            frame.reason.trim().length === 0)))
    ) {
      reject("invalid-host-preparation");
      return;
    }
    const pending = waiting;
    waiting = null;
    pending.resolve(frame);
  }
  function data(chunk: Buffer | string) {
    if (closed || failure) return;
    buffer += typeof chunk === "string" ? chunk : decoder.write(chunk);
    while (buffer.includes("\n")) {
      const index = buffer.indexOf("\n");
      const text = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      if (Buffer.byteLength(text) > MAX_RUN_FACTS_JSON_BYTES * 2) {
        reject("host-frame-too-large");
        return;
      }
      line(text);
    }
    if (Buffer.byteLength(buffer) > MAX_RUN_FACTS_JSON_BYTES * 2)
      reject("host-frame-too-large");
  }
  function end() {
    ended = true;
    if (waiting || buffer.length > 0) reject("host-eof");
  }
  function error() {
    reject("host-stream-error");
  }
  input.on("data", data);
  input.on("end", end);
  input.on("error", error);
  output.on("error", error);
  return {
    async exchange(frame, expected, runId) {
      if (failure) throw failure;
      if (ended) throw new ActionProtocolError("host-eof");
      if (waiting || closed)
        throw new ActionProtocolError("invalid-protocol-state");
      return new Promise((resolve, reject) => {
        waiting = { expected, runId, resolve, reject };
        output.write(`${JSON.stringify(frame)}\n`);
      });
    },
    assertClean() {
      if (failure) throw failure;
      if (buffer.trim().length > 0)
        throw new ActionProtocolError("unexpected-host-frame");
    },
    send(frame) {
      output.write(`${JSON.stringify(frame)}\n`);
    },
    close() {
      closed = true;
      input.off("data", data);
      input.off("end", end);
      input.off("error", error);
      output.off("error", error);
      input.pause();
    },
  };
}
