import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = "D:\\Projects\\flowkit-next";
const proofRoot = path.dirname(fileURLToPath(import.meta.url));
const argv = [
  "--import",
  "tsx",
  "--test",
  "tests/unit/domain/canonical-action-run-start.test.ts",
  "tests/unit/domain/agent-how-record.test.ts",
  "tests/unit/domain/agent-how-prepared.test.ts",
  "tests/unit/domain/agent-how-failure.test.ts",
];
const startedAt = new Date().toISOString();
const run = spawnSync(process.execPath, argv, {
  cwd: repositoryRoot,
  encoding: "buffer",
  maxBuffer: 16 * 1024 * 1024,
});
const endedAt = new Date().toISOString();
const stdout = Buffer.isBuffer(run.stdout) ? run.stdout : Buffer.alloc(0);
const stderr = Buffer.isBuffer(run.stderr) ? run.stderr : Buffer.alloc(0);
await writeFile(path.join(proofRoot, "stdout.txt"), stdout, { flag: "wx" });
await writeFile(path.join(proofRoot, "stderr.txt"), stderr, { flag: "wx" });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const command = {
  kind: "focused-apply-regression",
  executable: process.execPath,
  argv,
  cwd: repositoryRoot,
  startedAt,
  endedAt,
  exitCode: run.status,
  signal: run.signal,
  processError: run.error ? { name: run.error.name, message: run.error.message } : null,
  stdout: { bytes: stdout.length, sha256: hash(stdout) },
  stderr: { bytes: stderr.length, sha256: hash(stderr) },
};
await writeFile(path.join(proofRoot, "command.json"), `${JSON.stringify(command, null, 2)}\n`, {
  flag: "wx",
});
process.stdout.write(`${JSON.stringify({ exitCode: run.status, stdout: command.stdout, stderr: command.stderr })}\n`);
if (run.error) throw run.error;
if (run.status !== 0) process.exitCode = run.status ?? 1;
