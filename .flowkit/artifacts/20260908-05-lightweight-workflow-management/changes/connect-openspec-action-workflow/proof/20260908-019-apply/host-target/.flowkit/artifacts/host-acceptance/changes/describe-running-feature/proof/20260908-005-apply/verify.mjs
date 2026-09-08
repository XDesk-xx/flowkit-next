import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const commands = [
  ["execute", ["feature.mjs"]],
  ["test", ["--test", "feature.test.mjs"]],
  ["strict", ["C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js", "validate", "describe-running-feature", "--strict"]],
];
const records = [];
for (const [name, args] of commands) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, args, { cwd: process.cwd() });
  const record = { name, args, startedAt, finishedAt: new Date().toISOString(),
    exitCode: result.status, error: result.error?.message ?? null };
  for (const stream of ["stdout", "stderr"]) {
    const bytes = result[stream] ?? Buffer.alloc(0);
    await fs.writeFile(path.join(import.meta.dirname, name + "." + stream + ".txt"), bytes, { flag: "wx" });
    record[stream] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
  }
  records.push(record);
}
await fs.writeFile(path.join(import.meta.dirname, "verification.json"), JSON.stringify(records, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(records));
process.exitCode = records.every(record => record.exitCode === 0) ? 0 : 1;
