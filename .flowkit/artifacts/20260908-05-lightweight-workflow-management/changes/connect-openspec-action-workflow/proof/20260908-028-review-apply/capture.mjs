import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2];
if (!/^attempt-\d{2}$/.test(attempt)) throw new Error("Expected unique attempt-NN");
const out = path.join(proof, attempt);
mkdirSync(out);
const ref = file => { const b = readFileSync(file); return { path: path.relative(process.cwd(), file).replaceAll("\\", "/"), bytes: b.length, sha256: createHash("sha256").update(b).digest("hex") }; };
const tests = ["run-group-selection", "current-run-chain", "action-context", "run-partial-preservation", "agent-how-failure", "agent-how-material", "foundation-cli-surface"].map(n => "tests/unit/domain/" + n + ".test.ts");
const commands = [
  ["independent-probe", process.execPath, ["--import", "tsx", path.join(proof, "probe.mjs"), out]],
  ["focused-tests", process.execPath, ["--import", "tsx", "--test", ...tests]],
  ["openspec-version", process.execPath, ["C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js", "--version"]],
  ["openspec-strict", process.execPath, ["C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js", "validate", "connect-openspec-action-workflow", "--strict"]],
  ["diff-check", "git", ["diff", "--check", "HEAD"]]
];
const results = [];
for (const [label, executable, args] of commands) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(executable, args, { cwd: process.cwd(), encoding: null, maxBuffer: 20000000, timeout: 180000, windowsHide: true });
  for (const name of ["stdout", "stderr"]) writeFileSync(path.join(out, label + "." + name + ".txt"), result[name] ?? Buffer.alloc(0), { flag: "wx" });
  const row = { label, executable, args, cwd: process.cwd(), startedAt, finishedAt: new Date().toISOString(), exitCode: result.status, signal: result.signal, error: result.error ? { code: result.error.code, message: result.error.message } : null, stdout: ref(path.join(out, label + ".stdout.txt")), stderr: ref(path.join(out, label + ".stderr.txt")) };
  results.push(row);
  console.log(JSON.stringify({ label, exitCode: row.exitCode, error: row.error }));
}
writeFileSync(path.join(out, "summary.json"), JSON.stringify({ platform: process.platform, node: process.version, commands: results, limits: "No candidate review-apply HOW, actual D05 lifecycle, full domain suite, Linux replay or Formal Full Test executed." }, null, 2) + "\n", { flag: "wx" });
process.exitCode = results.every(row => row.exitCode === 0) ? 0 : 1;
