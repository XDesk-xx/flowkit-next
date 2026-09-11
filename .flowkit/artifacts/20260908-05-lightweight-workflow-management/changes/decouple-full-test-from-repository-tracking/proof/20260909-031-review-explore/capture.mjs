import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2];
if (!/^attempt-\d{2}$/.test(attempt)) throw new Error("Unique attempt-NN required");
const out = path.join(proof, attempt);
mkdirSync(out);
const ref = file => {
  const bytes = readFileSync(file);
  return { path: path.relative(process.cwd(), file).replaceAll("\\", "/"), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
};
const commands = [
  ["independent-probe", process.execPath, ["--import", "tsx", path.join(proof, "probe.mjs"), out]],
  ["openspec-version", process.execPath, ["C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js", "--version"]],
  ["openspec-status", process.execPath, ["C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js", "status", "--change", "decouple-full-test-from-repository-tracking", "--json"]],
  ["diff-check", "git", ["diff", "--check", "HEAD"]]
];
const results = [];
for (const [label, executable, args] of commands) {
  const startedAt = new Date().toISOString();
  const r = spawnSync(executable, args, { cwd: process.cwd(), encoding: null, maxBuffer: 10000000, timeout: 120000, windowsHide: true });
  for (const stream of ["stdout", "stderr"]) writeFileSync(path.join(out, label + "." + stream + ".txt"), r[stream] ?? Buffer.alloc(0), { flag: "wx" });
  const row = { label, executable, args, cwd: process.cwd(), startedAt, finishedAt: new Date().toISOString(), exitCode: r.status, signal: r.signal, error: r.error ? { code: r.error.code, message: r.error.message } : null, stdout: ref(path.join(out, label + ".stdout.txt")), stderr: ref(path.join(out, label + ".stderr.txt")) };
  results.push(row);
  console.log(JSON.stringify({ label, exitCode: row.exitCode, error: row.error }));
}
writeFileSync(path.join(out, "summary.json"), JSON.stringify({ platform: process.platform, node: process.version, commands: results, limitation: "Explore review only; synthetic experiments, not production/Full Test acceptance; no candidate same-stage Skill" }, null, 2) + "\n", { flag: "wx" });
process.exitCode = results.every(r => r.exitCode === 0) ? 0 : 1;
