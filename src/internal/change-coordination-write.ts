import { open, readFile, rename, lstat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { isMap, isScalar, isSeq, parseDocument, stringify } from "yaml";
import type { OwnerAuthorityFact } from "../domain/authority.js";

export async function writeChangeState(
  root: string,
  deliveryId: string,
  changeId: string,
  beforeState: "planned" | "active",
  afterState: "active" | "completed",
  authority?: OwnerAuthorityFact,
): Promise<void> {
  const target = path.join(
    root,
    "openspec",
    "delivery-groups",
    `${deliveryId}.yaml`,
  );
  if (!(await lstat(target)).isFile()) throw new Error("manifest-not-regular");
  const original = await readFile(target);
  const source = original.toString("utf8");
  if (!Buffer.from(source).equals(original))
    throw new Error("manifest-encoding-invalid");
  const doc = parseDocument(source, { keepSourceTokens: true });
  if (doc.errors.length || !isMap(doc.contents) || doc.get("id") !== deliveryId)
    throw new Error("manifest-invalid");
  const changes = doc.get("changes", true);
  if (!isSeq(changes)) throw new Error("manifest-changes-invalid");
  const matches = changes.items.filter(
    (item) => isMap(item) && item.get("id") === changeId,
  );
  if (
    matches.length !== 1 ||
    !isMap(matches[0]) ||
    matches[0].get("state") !== beforeState
  )
    throw new Error("change-prestate-invalid");
  const state = matches[0].get("state", true);
  if (!isScalar(state) || !state.range)
    throw new Error("change-state-unpatchable");
  const edits: Array<{ start: number; end: number; text: string }> = [
    { start: state.range[0], end: state.range[1], text: afterState },
  ];
  if (authority) {
    const ownerDecisions = doc.get("ownerDecisions", true);
    if (
      !isSeq(ownerDecisions) ||
      !ownerDecisions.range ||
      ownerDecisions.items.some(
        (item) => isMap(item) && item.get("ref") === authority.ref,
      )
    )
      throw new Error("owner-decisions-invalid");
    const append = stringify([authority], { lineWidth: 0 })
      .trimEnd()
      .split("\n")
      .map((line) => "  " + line)
      .join("\n");
    const offset = ownerDecisions.range[2];
    if (!source.slice(0, offset).endsWith("\n"))
      throw new Error("owner-decisions-unpatchable");
    edits.push({ start: offset, end: offset, text: append + "\n" });
  }
  let updated = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    updated =
      updated.slice(0, edit.start) + edit.text + updated.slice(edit.end);
  const check = parseDocument(updated);
  if (check.errors.length || !isMap(check.contents))
    throw new Error("manifest-patch-invalid");
  const updatedChanges = check.get("changes", true);
  if (
    !isSeq(updatedChanges) ||
    updatedChanges.items.filter(
      (item) =>
        isMap(item) &&
        item.get("id") === changeId &&
        item.get("state") === afterState,
    ).length !== 1
  )
    throw new Error("manifest-patch-invalid");
  const temporary = target + "." + randomUUID() + ".tmp";
  const handle = await open(temporary, "wx");
  try {
    await handle.writeFile(updated);
    await handle.sync();
  } finally {
    await handle.close();
  }
  if (!(await readFile(target)).equals(original))
    throw new Error("manifest-prestate-drift");
  await rename(temporary, target);
  if (!(await readFile(target)).equals(Buffer.from(updated)))
    throw new Error("manifest-readback-failed");
}
