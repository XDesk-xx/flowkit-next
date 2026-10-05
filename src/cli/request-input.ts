import { open } from "node:fs/promises";
import { FoundationCliInputError, MAX_REQUEST_JSON_BYTES } from "./request.js";

export async function collectRequestInput(
  chunks: AsyncIterable<Buffer | string>,
  limit = MAX_REQUEST_JSON_BYTES,
): Promise<string> {
  const buffers: Buffer[] = [];
  let observed = 0;
  for await (const chunk of chunks) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    observed += bytes.length;
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
          measurement: "lower-bound",
        },
      );
    buffers.push(bytes);
  }
  return Buffer.concat(buffers).toString("utf8");
}

async function* fileChunks(inputPath: string, limit: number) {
  const handle = await open(inputPath, "r");
  try {
    let read = 0;
    while (read <= limit) {
      const buffer = Buffer.alloc(Math.min(65_536, limit + 1 - read));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) return;
      read += bytesRead;
      yield buffer.subarray(0, bytesRead);
    }
  } finally {
    await handle.close();
  }
}

export async function readRequestInput(
  inputPath: string,
  limit = MAX_REQUEST_JSON_BYTES,
): Promise<string> {
  try {
    return await collectRequestInput(
      inputPath === "-" ? process.stdin : fileChunks(inputPath, limit),
      limit,
    );
  } catch (error) {
    if (error instanceof FoundationCliInputError) throw error;
    throw new FoundationCliInputError(
      "invalid-arguments",
      "cannot read --input request file",
      { cause: error },
    );
  }
}
