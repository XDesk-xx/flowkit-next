import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const proof = path.join(root, ".flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/pin-bootstrap-manager-version-1-0-0/proof/20261001-072-apply");
const pnpm = "C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const checks = [
  ["frozen-install-ci", ["install", "--frozen-lockfile"]],
  ["quality-gate", ["quality:gate"]],
  ["typecheck", ["typecheck"]],
  ["domain", ["test:domain"]],
  ["acceptance", ["test:acceptance"]],
  ["dependency-health", ["quality:dependency-health"]],
  ["entropy-tests", ["test:entropy"]],
  ["entropy", ["quality:entropy"]],
  ["owned-source", ["quality:owned-source"]],
  ["bootstrap", ["test:bootstrap"]],
  ["forbidden-tracked", ["check:forbidden-tracked-artifacts"]],
  ["build", ["build"]],
];
const report = JSON.parse(await readFile(path.join(proof, "checks-report.json"), "utf8"));
report.retryEnvironment = { CI: "true" };
for (const [id, args] of checks) {
  const start = new Date().toISOString();
  const child = spawn(process.execPath, [pnpm, ...args], { cwd: root, windowsHide: true,
    env: { ...process.env, CI: "true" }, stdio: ["ignore", "pipe", "pipe"] });
  const out = [], err = [];
  child.stdout.on("data", (chunk) => out.push(chunk));
  child.stderr.on("data", (chunk) => err.push(chunk));
  const outcome = await new Promise((resolve) => {
    child.on("error", (error) => resolve({ code: null, signal: null, error: String(error) }));
    child.on("close", (code, signal) => resolve({ code, signal, error: null }));
  });
  const stdout = Buffer.concat(out), stderr = Buffer.concat(err);
  await writeFile(path.join(proof, `${id}.stdout.txt`), stdout, { flag: "wx" });
  await writeFile(path.join(proof, `${id}.stderr.txt`), stderr, { flag: "wx" });
  const entry = { id, command: [process.execPath, pnpm, ...args], cwd: root, start,
    end: new Date().toISOString(), exitCode: outcome.code, signal: outcome.signal, error: outcome.error,
    stdoutBytes: stdout.length, stdoutSha256: digest(stdout), stderrBytes: stderr.length,
    stderrSha256: digest(stderr) };
  report.commands.push(entry);
  await writeFile(path.join(proof, "checks-report.json"), JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(`${id}: ${outcome.code}\n`);
  if (outcome.code !== 0 || outcome.error) break;
}
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
report.packageVersion = packageJson.version;
report.packagePrivate = packageJson.private;
report.packageBin = packageJson.bin;
report.packageDependencies = packageJson.dependencies;
report.lockSha256 = digest(await readFile(path.join(root, "pnpm-lock.yaml")));
report.toolLockSha256 = digest(await readFile(path.join(root, "config/tools/toolchain.lock.json")));
await writeFile(path.join(proof, "checks-report.json"), JSON.stringify(report, null, 2) + "\n");
if (report.commands.length !== checks.length + 1 ||
    report.commands.slice(1).some((command) => command.exitCode !== 0))
  process.exitCode = 1;
