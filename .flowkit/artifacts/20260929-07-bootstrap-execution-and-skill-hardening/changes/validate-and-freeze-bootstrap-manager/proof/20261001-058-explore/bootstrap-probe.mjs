import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
assert.equal(path.resolve(root).toLowerCase(), "d:\\projects\\flowkit-next");
const proof = path.join(root, ".flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/validate-and-freeze-bootstrap-manager/proof/20261001-058-explore");
const first = JSON.parse(await readFile(path.join(proof, "package-probe-report.json"), "utf8"));
const target = first.target;
const cli = path.join(first.scratch, "installation", "node_modules", "flowkit-next", "dist", "cli", "entrypoint.js");
const request = path.join(first.scratch, "fresh-target-query.json");
const openspec = "C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const checks = [];

async function run(id, args) {
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, args, { cwd: target, windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"] });
  const stdout = [], stderr = [];
  child.stdout.on("data", (bytes) => stdout.push(bytes));
  child.stderr.on("data", (bytes) => stderr.push(bytes));
  const ended = await new Promise((resolve) => {
    child.on("error", (error) => resolve({ exitCode: null, signal: null, processError: error.message }));
    child.on("close", (exitCode, signal) => resolve({ exitCode, signal, processError: null }));
  });
  const out = Buffer.concat(stdout), err = Buffer.concat(stderr);
  await writeFile(path.join(proof, `${id}.stdout.txt`), out, { flag: "wx" });
  await writeFile(path.join(proof, `${id}.stderr.txt`), err, { flag: "wx" });
  checks.push({ id, command: [process.execPath, ...args], cwd: target,
    startedAt, finishedAt: new Date().toISOString(), ...ended,
    stdoutBytes: out.length, stdoutSha256: hash(out),
    stderrBytes: err.length, stderrSha256: hash(err) });
  return { ...ended, output: out.toString("utf8").trim() };
}

const init = await run("openspec-init", [openspec, "init", "--tools", "none"]);
assert.equal(init.exitCode, 0);
const doctor = await run("initialized-doctor", [cli, "doctor", "--input", request]);
const status = await run("initialized-status", [cli, "status", "--input", request]);
const next = await run("initialized-next", [cli, "next", "--input", request]);
assert.equal(doctor.exitCode, 0);
assert.equal(status.exitCode, 0);
assert.equal(next.exitCode, 0);
const report = { kind: "isolated-first-query-after-exact-openspec-init",
  target, packageSha256: first.tgz.sha256,
  outputs: { init, doctor, status, next }, checks,
  limitation: "Same Agent session and empty isolated target; this does not prove a real new target workflow or independent new Agent session." };
await writeFile(path.join(proof, "bootstrap-probe-report.json"),
  JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
process.stdout.write(JSON.stringify({ target, init, doctor, status, next }) + "\n");
