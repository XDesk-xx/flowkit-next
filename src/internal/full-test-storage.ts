import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isMap, isScalar, parseDocument } from "yaml";
import { isSemanticId } from "../domain/identity.js";
import {
  fullTestPath,
  fullTestDigest,
  fullTestRelative,
} from "./full-test-input.js";
import type { EvidenceArtifactRef } from "./delivery-required-evidence.js";

export const isAttemptId = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
    v,
  );
export function attemptRoot(deliveryId: string, attemptId: string): string {
  if (!isSemanticId(deliveryId) || !isAttemptId(attemptId))
    throw new Error("invalid Full Test identity");
  return `.flowkit/artifacts/${deliveryId}/full-test/${attemptId}`;
}
export async function ensureFullTestDirectory(
  root: string,
  relative: string,
  exclusive = false,
): Promise<string> {
  if (!fullTestRelative(relative)) throw new Error("invalid artifact path");
  let prefix = "";
  const parts = relative.split("/");
  for (const [index, part] of parts.entries()) {
    prefix = prefix ? prefix + "/" + part : part;
    const parent =
      index === 0
        ? await fs.realpath(root)
        : await fullTestPath(root, parts.slice(0, index).join("/"));
    try {
      await fs.mkdir(path.join(parent, part));
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "EEXIST" ||
        (exclusive && index === parts.length - 1)
      )
        throw error;
    }
    if (!(await fs.stat(await fullTestPath(root, prefix))).isDirectory())
      throw new Error("artifact parent is not a directory");
  }
  return fullTestPath(root, relative);
}
export async function fullTestArtifact(
  root: string,
  relative: string,
): Promise<EvidenceArtifactRef> {
  const target = await fullTestPath(root, relative);
  if (!(await fs.stat(target)).isFile())
    throw new Error("artifact is not regular");
  const bytes = await fs.readFile(target);
  return {
    artifact: relative,
    contentSha256: fullTestDigest(bytes),
    bytes: bytes.length,
  };
}
export async function saveFullTestJson(
  root: string,
  relative: string,
  value: unknown,
): Promise<EvidenceArtifactRef> {
  const parent = await fullTestPath(root, path.posix.dirname(relative));
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  const handle = await fs.open(
    path.join(parent, path.posix.basename(relative)),
    "wx",
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const actual = await fullTestArtifact(root, relative);
  if (
    actual.contentSha256 !== fullTestDigest(bytes) ||
    actual.bytes !== bytes.length
  )
    throw new Error("artifact readback mismatch");
  return actual;
}
export async function readFullTestJson(
  root: string,
  relative: string,
): Promise<unknown> {
  return JSON.parse(
    await fs.readFile(await fullTestPath(root, relative), "utf8"),
  );
}
export async function readFullTestCoordination(
  root: string,
  deliveryId: string,
) {
  if (!isSemanticId(deliveryId)) throw new Error("invalid Delivery id");
  const relative = `openspec/delivery-groups/${deliveryId}.yaml`;
  const target = await fullTestPath(root, relative);
  const bytes = await fs.readFile(target);
  const doc = parseDocument(bytes.toString("utf8"), { keepSourceTokens: true });
  const delivery = doc.get("delivery", true);
  if (
    doc.errors.length ||
    doc.get("id") !== deliveryId ||
    !isMap(delivery) ||
    delivery.flow ||
    !["active", "completed"].includes(String(delivery.get("state")))
  )
    throw new Error("invalid Delivery coordination");
  const attemptId = delivery.get("fullTestAttempt");
  if (attemptId !== undefined && !isAttemptId(attemptId))
    throw new Error("invalid current attempt");
  return {
    target,
    bytes,
    doc,
    delivery,
    attemptId,
    state: delivery.get("state"),
    status: delivery.get("fullTestStatus"),
  };
}
export async function publishFullTestAttempt(
  root: string,
  deliveryId: string,
  expected: Buffer,
  attemptId: string,
  status: "pending" | "passed" | "failed",
): Promise<void> {
  if (!isAttemptId(attemptId)) throw new Error("invalid current attempt");
  const current = await readFullTestCoordination(root, deliveryId);
  if (!current.bytes.equals(expected) || current.state !== "active")
    throw new Error("coordination drift");
  const source = current.bytes.toString("utf8");
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const values = new Map([
    ["fullTestAttempt", attemptId],
    ["fullTestStatus", status],
  ]);
  let indent: string | null = null;
  for (const pair of current.delivery.items) {
    if (!isScalar(pair.key) || !pair.key.range)
      throw new Error("unsupported coordination shape");
    const lineStart = source.lastIndexOf("\n", pair.key.range[0] - 1) + 1;
    const spaces = source.slice(lineStart, pair.key.range[0]);
    if (!/^ +$/.test(spaces))
      throw new Error("unsupported coordination indentation");
    indent ??= spaces;
    const value = values.get(String(pair.key.value));
    if (value === undefined) continue;
    if (!isScalar(pair.value) || !pair.value.range)
      throw new Error("unsupported coordination value");
    edits.push({
      start: pair.value.range[0],
      end: pair.value.range[1],
      text: JSON.stringify(value),
    });
    values.delete(String(pair.key.value));
  }
  if (
    indent === null ||
    !current.delivery.range ||
    values.has("fullTestStatus")
  )
    throw new Error("missing test status");
  if (values.has("fullTestAttempt")) {
    const offset = current.delivery.range[2];
    const newline = source.slice(0, offset).endsWith("\r\n") ? "\r\n" : "\n";
    if (!source.slice(0, offset).endsWith("\n"))
      throw new Error("unsupported coordination ending");
    edits.push({
      start: offset,
      end: offset,
      text: indent + "fullTestAttempt: " + JSON.stringify(attemptId) + newline,
    });
  }
  let text = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  const temporary = current.target + "." + randomUUID() + ".tmp";
  const handle = await fs.open(temporary, "wx");
  try {
    await handle.writeFile(text);
    await handle.sync();
  } finally {
    await handle.close();
  }
  if (
    !(await readFullTestCoordination(root, deliveryId)).bytes.equals(expected)
  )
    throw new Error("coordination drift before publication");
  await fs.rename(temporary, current.target);
  const reread = await readFullTestCoordination(root, deliveryId);
  if (
    !reread.bytes.equals(Buffer.from(text)) ||
    reread.attemptId !== attemptId ||
    reread.status !== status
  )
    throw new Error("coordination readback failed");
}
