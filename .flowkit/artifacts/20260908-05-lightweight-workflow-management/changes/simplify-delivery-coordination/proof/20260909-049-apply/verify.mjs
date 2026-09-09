import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const [label, command, ...args] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label ?? "") || !command) throw new Error("label and command required");
const base = path.dirname(fileURLToPath(import.meta.url));
const startedAt = new Date().toISOString();
const result = spawnSync(command, args, { windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
for (const stream of ["stdout", "stderr"]) {
  writeFileSync(path.join(base, `${label}.${stream}.txt`), result[stream] ?? Buffer.alloc(0), { flag: "wx" });
}
const metadata = { command, args, cwd: process.cwd(), startedAt, finishedAt: new Date().toISOString(),
  platform: process.platform, node: process.version, exitCode: result.status, signal: result.signal,
  error: result.error?.message ?? null };
writeFileSync(path.join(base, `${label}.json`), JSON.stringify(metadata, null, 2) + "\n", { flag: "wx" });
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
console.log(JSON.stringify(metadata));
process.exitCode = result.status ?? 1;
