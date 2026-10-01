import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
assert.equal(path.resolve(root).toLowerCase(), "d:\\projects\\flowkit-next");
const proof = path.join(root, ".flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/validate-and-freeze-bootstrap-manager/proof/20261001-058-explore");
const scratch = await mkdtemp(path.join(root, ".tmp", "d07-e-package-probe-"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const checks = [];

async function run(id, command, args, cwd) {
  const startedAt = new Date().toISOString();
  const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
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
  checks.push({ id, command: [command, ...args], cwd, startedAt,
    finishedAt: new Date().toISOString(), ...outcome,
    stdoutBytes: out.length, stdoutSha256: hash(out),
    stderrBytes: err.length, stderrSha256: hash(err) });
  return { ...outcome, stdout: out, stderr: err };
}

const pnpm = "C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js";
const npm = "C:/nvm4w/nodejs/node_modules/npm/bin/npm-cli.js";
const pack = await run("pack", process.execPath,
  [pnpm, "pack", "--pack-destination", scratch, "--json"], root);
assert.equal(pack.exitCode, 0);
const tarballs = (await readdir(scratch)).filter((name) => name.endsWith(".tgz"));
assert.equal(tarballs.length, 1);
const tgz = path.join(scratch, tarballs[0]);
const packageBytes = await readFile(tgz);
const packOutput = JSON.parse(pack.stdout.toString("utf8"));
const installation = path.join(scratch, "installation");
await mkdir(installation);
const installed = await run("install", process.execPath,
  [npm, "install", "--prefix", installation, "--omit=dev", "--no-audit", "--no-fund", tgz], scratch);
assert.equal(installed.exitCode, 0);
const manager = path.join(installation, "node_modules", "flowkit-next");
const metadata = JSON.parse(await readFile(path.join(manager, "package.json"), "utf8"));
assert.equal(metadata.name, "flowkit-next");
assert.equal(metadata.version, "0.1.0");
assert.equal(metadata.bin.flowkit, "dist/cli/entrypoint.js");
assert.deepEqual(Object.keys(metadata.dependencies), ["yaml"]);
for (const relative of ["dist/cli/entrypoint.js", "docs/onboarding.md",
  "skills/actions/explore/SKILL.md", "skills/delivery/start/SKILL.md",
  "skills/delivery/repository-integration/references/git-host.mjs",
  "skills/tools/openspec/SKILL.md", "config/tools/toolchain.lock.json"])
  assert.ok((await readFile(path.join(manager, ...relative.split("/")))).length > 0, relative);
const installedTopLevel = await readdir(path.join(installation, "node_modules"));
assert.ok(installedTopLevel.includes("yaml"));
assert.equal(installedTopLevel.includes("tsx"), false);
assert.equal(installedTopLevel.includes("typescript"), false);
const target = path.join(scratch, "fresh-target");
await mkdir(target);
const request = path.join(scratch, "fresh-target-query.json");
await writeFile(request, JSON.stringify({ repositoryRoot: target,
  flowkitHome: "C:\\Users\\xuser\\.flowkit" }) + "\n");
const cli = path.join(manager, "dist", "cli", "entrypoint.js");
const status = await run("fresh-status", process.execPath,
  [cli, "status", "--input", request], target);
const doctor = await run("fresh-doctor", process.execPath,
  [cli, "doctor", "--input", request], target);
const report = { kind: "bounded-installed-package-explore-probe", scratch,
  sourceHead: "2bab78b41750d1cff665a20b37dfca09ca1ca511",
  tgz: { name: tarballs[0], bytes: packageBytes.length, sha256: hash(packageBytes) },
  packOutput, installedMetadata: { name: metadata.name, version: metadata.version,
    bin: metadata.bin.flowkit, productionDependencies: metadata.dependencies },
  installedTopLevel, target, status: { exitCode: status.exitCode,
    output: status.stdout.toString("utf8").trim() },
  doctor: { exitCode: doctor.exitCode,
    output: doctor.stdout.toString("utf8").trim() },
  checks,
  limitation: "This is a same-session isolated package probe, not a new Agent session or completed end-to-end target acceptance." };
await writeFile(path.join(proof, "package-probe-report.json"),
  JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
process.stdout.write(JSON.stringify({ scratch, tgz: report.tgz,
  installed: true, status: report.status, doctor: report.doctor,
  checkExits: checks.map((item) => ({ id: item.id, exitCode: item.exitCode })) }) + "\n");
