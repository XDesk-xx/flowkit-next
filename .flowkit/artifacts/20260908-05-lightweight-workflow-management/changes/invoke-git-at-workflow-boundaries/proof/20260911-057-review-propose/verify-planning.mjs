import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const base = path.dirname(fileURLToPath(import.meta.url));
const ref = p => {
  const b = fs.readFileSync(p);
  return { path: path.relative(process.cwd(), p).replaceAll("\\", "/"), bytes: b.length, sha256: createHash("sha256").update(b).digest("hex") };
};
const directory = path.join(base, "attempt-01");
fs.mkdirSync(directory);
const tool = "C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
const commands = [];
for (const [name, args] of [
  ["version", [tool, "--version"]],
  ["strict-validation", [tool, "validate", "invoke-git-at-workflow-boundaries", "--strict"]],
  ["planning-status", [tool, "status", "--change", "invoke-git-at-workflow-boundaries", "--json"]],
]) {
  const startedAt = new Date().toISOString();
  const stdoutPath = path.join(directory, name + ".stdout.txt");
  const stderrPath = path.join(directory, name + ".stderr.txt");
  const stdout = fs.openSync(stdoutPath, "wx");
  const stderr = fs.openSync(stderrPath, "wx");
  let error = null;
  const completion = await new Promise(resolve => {
    const child = spawn(process.execPath, args, { cwd: process.cwd(), windowsHide: true, shell: false, env: { ...process.env, OPENSPEC_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", stdout, stderr] });
    child.on("error", e => { error = { code: e.code, message: e.message }; });
    child.on("close", (exitCode, signal) => resolve({ exitCode, signal }));
  });
  fs.closeSync(stdout);
  fs.closeSync(stderr);
  const command = { name, program: process.execPath, args, cwd: process.cwd(), startedAt, completedAt: new Date().toISOString(), ...completion, error, node: process.version, platform: process.platform, telemetryDisabled: true, stdout: ref(stdoutPath), stderr: ref(stderrPath) };
  fs.writeFileSync(path.join(directory, name + ".command.json"), JSON.stringify(command, null, 2) + "\n", { flag: "wx" });
  commands.push(command);
  console.log(JSON.stringify({ name, ...completion, error }));
  if (error) break;
}
const successful = commands.length === 3 && commands.every(c => c.exitCode === 0 && c.error === null);
const summary = { kind: "independent-review-propose-structure-checks", commands, successful, structuralOnly: true, implementationAcceptance: false, formalD05FullTest: false };
const output = path.join(directory, "summary.json");
fs.writeFileSync(output, JSON.stringify(summary, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ summary: ref(output), successful }));
process.exitCode = successful ? 0 : 1;
