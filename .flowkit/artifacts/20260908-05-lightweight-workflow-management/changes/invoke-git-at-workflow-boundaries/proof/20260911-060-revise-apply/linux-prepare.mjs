import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const root = "/work/project";
const config = JSON.parse(await fs.readFile("/source/config/verification/full-test.json", "utf8"));
await fs.mkdir(root, { recursive: true });
for (const relative of config.inputs) await fs.cp("/source/" + relative, root + "/" + relative, { recursive: true });
for (const excluded of [".git", ".flowkit", ".agents", "openspec", "architecture", ".tmp", "node_modules"])
  await assert.rejects(fs.stat(root + "/" + excluded), { code: "ENOENT" });
const files = [];
async function inventory(relative) {
  const target = root + "/" + relative;
  if ((await fs.lstat(target)).isDirectory()) {
    for (const name of (await fs.readdir(target)).sort()) await inventory(relative + "/" + name);
  } else {
    const bytes = await fs.readFile(target);
    files.push({ artifact: relative, bytes: bytes.length, contentSha256: createHash("sha256").update(bytes).digest("hex") });
  }
}
for (const relative of config.inputs) await inventory(relative);
await fs.writeFile("/evidence/linux-source.json", JSON.stringify({ kind: "current-code-only-implementation-regression", formalD05FullTest: false,
  node: process.version, platform: process.platform, arch: process.arch, files }, null, 2) + "\n", { flag: "wx" });
