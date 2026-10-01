import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = await realpath(process.cwd());
const proof = path.join(root, ".flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/validate-and-freeze-bootstrap-manager/proof/20261001-065-apply");
const staging = path.join(root, ".tmp/d07-e-065-proof-raw-staging");
assert.equal(await realpath(proof), proof);
assert.ok(proof.toLowerCase().startsWith((root + path.sep).toLowerCase()));
assert.ok(staging.toLowerCase().startsWith((root + path.sep).toLowerCase()));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const names = (await readdir(proof)).sort();
const raw = names.filter((name) => /\.(?:mjs|sh|txt)$/.test(name) && name !== "proof-bundle-builder.mjs");
assert.equal(raw.length, 120);
const members = [];
for (const name of raw) {
  assert.ok(name && !name.includes("/") && !name.includes("\\") && name !== "." && name !== "..");
  const file = path.join(proof, name);
  const info = await lstat(file);
  assert.equal(info.isFile(), true);
  assert.equal(info.isSymbolicLink(), false);
  assert.equal(await realpath(file), file);
  const bytes = await readFile(file);
  members.push({ name, bytes: bytes.length, sha256: hash(bytes) });
}
async function tar(args) {
  const child = spawn("tar", args, { cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const out = [], err = [];
  child.stdout.on("data", (bytes) => out.push(bytes));
  child.stderr.on("data", (bytes) => err.push(bytes));
  const code = await new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
  assert.equal(code, 0, Buffer.concat(err).toString("utf8"));
  return Buffer.concat(out);
}
const archive = path.join(proof, "proof-raw.tar");
await tar(["-cf", archive, "-C", proof, ...raw]);
const listed = (await tar(["-tf", archive])).toString("utf8").trim().split(/\r?\n/).map((name) => name.replace(/^\.\//, "")).sort();
assert.deepEqual(listed, raw);
for (const member of members) {
  const extracted = await tar(["-xOf", archive, member.name]);
  assert.equal(extracted.length, member.bytes, member.name);
  assert.equal(hash(extracted), member.sha256, member.name);
}
const archiveBytes = await readFile(archive);
const manifest = { kind: "d07-e-065-exact-raw-proof-bundle", archive: "proof-raw.tar",
  archiveBytes: archiveBytes.length, archiveSha256: hash(archiveBytes), memberCount: members.length, members,
  note: "Each member was read as raw bytes and independently compared with tar extraction before source files moved to disposable staging." };
await writeFile(path.join(proof, "proof-bundle-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
assert.equal((await stat(archive)).size, manifest.archiveBytes);
await mkdir(staging, { recursive: false });
for (const name of raw) await rename(path.join(proof, name), path.join(staging, name));
assert.equal((await readdir(proof)).length, names.length - raw.length + 2);
process.stdout.write(JSON.stringify({ memberCount: members.length, archiveBytes: manifest.archiveBytes,
  archiveSha256: manifest.archiveSha256, staging }) + "\n");
