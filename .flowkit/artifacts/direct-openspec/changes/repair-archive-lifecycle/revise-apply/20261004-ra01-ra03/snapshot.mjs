import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const root = process.cwd();
const proof = import.meta.dirname;
const snapshot = path.join(root, ".tmp/revise-apply-linux-20261004/snapshot");
const previous = JSON.parse(await readFile(".flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/review/20261004-ocr-linux/snapshot-inputs.json"));
const inputs = {};
for (const relative of Object.keys(previous)) {
  const bytes = await readFile(path.join(root, relative));
  await mkdir(path.dirname(path.join(snapshot, relative)), { recursive: true });
  await writeFile(path.join(snapshot, relative), bytes);
  inputs[relative] = createHash("sha256").update(bytes).digest("hex");
}
await writeFile(path.join(proof, "snapshot-inputs.json"), JSON.stringify(inputs, null, 2) + "\n");
console.log(JSON.stringify({ snapshot, files: Object.keys(inputs).length }));
