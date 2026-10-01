import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
assert.equal(path.resolve(root).toLowerCase(), "d:\\projects\\flowkit-next");
const proof = path.join(root, ".flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/validate-and-freeze-bootstrap-manager/proof/20261001-062-apply");
const pnpm = "C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = promisify(execFile);
const git = async (...args) => (await run("git", args, { cwd: root, windowsHide: true })).stdout.trim();
const source = {
  branch: await git("branch", "--show-current"),
  head: await git("rev-parse", "HEAD"),
  trackedDiffNames: (await git("diff", "--name-only")).split(/\r?\n/).filter(Boolean),
  untrackedNames: (await git("ls-files", "--others", "--exclude-standard")).split(/\r?\n/).filter(Boolean),
  packageJsonSha256: hash(await readFile(path.join(root, "package.json"))),
  lockSha256: hash(await readFile(path.join(root, "pnpm-lock.yaml"))),
  nodeVersion: process.version,
  pnpmVersion: (await run(process.execPath, [pnpm, "--version"], { cwd: root, windowsHide: true })).stdout.trim(),
};
assert.equal(source.branch, "delivery/20260929-07-bootstrap-execution-and-skill-hardening");
assert.equal(source.head, "2bab78b41750d1cff665a20b37dfca09ca1ca511");
const checks = [];
for (const name of ["typecheck", "test:domain", "test:acceptance", "test:bootstrap",
  "quality:gate", "quality:dependency-health", "quality:entropy", "quality:owned-source",
  "check:forbidden-tracked-artifacts"]) {
  const id = name.replaceAll(":", "-");
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, [pnpm, name], {
    cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = [], stderr = [];
  child.stdout.on("data", (bytes) => stdout.push(bytes));
  child.stderr.on("data", (bytes) => stderr.push(bytes));
  const outcome = await new Promise((resolve) => {
    child.on("error", (error) => resolve({ exitCode: null, signal: null, processError: error.message }));
    child.on("close", (exitCode, signal) => resolve({ exitCode, signal, processError: null }));
  });
  const out = Buffer.concat(stdout), err = Buffer.concat(stderr);
  await writeFile(path.join(proof, `${id}.stdout.txt`), out, { flag: "wx" });
  await writeFile(path.join(proof, `${id}.stderr.txt`), err, { flag: "wx" });
  checks.push({ name, command: [process.execPath, pnpm, name], cwd: root,
    startedAt, finishedAt: new Date().toISOString(), ...outcome,
    stdoutBytes: out.length, stdoutSha256: hash(out),
    stderrBytes: err.length, stderrSha256: hash(err) });
  process.stdout.write(`${name}: ${outcome.exitCode ?? outcome.processError}\n`);
}
const report = { kind: "d07-e-apply-source-and-applicable-checks", source, checks,
  scope: "Candidate source checks; not Formal Full Test, real target acceptance, or Reviewer verdict." };
await writeFile(path.join(proof, "acceptance-checks-report.json"),
  JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
assert.equal((await readdir(proof)).includes("acceptance-checks-report.json"), true);
if (checks.some((check) => check.exitCode !== 0)) process.exitCode = 1;
