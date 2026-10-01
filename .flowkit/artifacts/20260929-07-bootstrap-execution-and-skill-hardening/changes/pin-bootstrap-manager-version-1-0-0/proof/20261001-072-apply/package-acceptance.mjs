import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const deliveryId = "20260929-07-bootstrap-execution-and-skill-hardening";
const proof = path.join(root, `.flowkit/artifacts/${deliveryId}/changes/pin-bootstrap-manager-version-1-0-0/proof/20261001-072-apply`);
const oldPackage = path.join(root, `.flowkit/artifacts/${deliveryId}/changes/validate-and-freeze-bootstrap-manager/proof/20261001-065-apply/flowkit-next-0.1.0.tgz`);
const newPackage = path.join(proof, "flowkit-next-1.0.0.tgz");
const scratch = path.join(root, ".tmp/d07-version-072-package-acceptance");
const pnpm = "C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js";
const npm = "C:/nvm4w/nodejs/node_modules/npm/bin/npm-cli.js";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = { kind: "d07-version-1-0-0-package-acceptance", sourceRoot: root,
  sourceHead: "f826f44587b25130a9f47d2426391cbba52520b1",
  sourceHashes: {}, commands: [] };
for (const relative of ["package.json", "docs/onboarding.md", "config/verification/full-test.json", "pnpm-lock.yaml", "config/tools/toolchain.lock.json"])
  report.sourceHashes[relative] = digest(await readFile(path.join(root, relative)));

async function run(id, program, args, cwd = root) {
  const start = new Date().toISOString();
  const child = spawn(program, args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const stdoutChunks = [], stderrChunks = [];
  child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
  child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
  const outcome = await new Promise((resolve) => {
    child.on("error", (error) => resolve({ exitCode: null, signal: null, error: String(error) }));
    child.on("close", (exitCode, signal) => resolve({ exitCode, signal, error: null }));
  });
  const stdout = Buffer.concat(stdoutChunks), stderr = Buffer.concat(stderrChunks);
  await writeFile(path.join(proof, `${id}.stdout.txt`), stdout, { flag: "wx" });
  await writeFile(path.join(proof, `${id}.stderr.txt`), stderr, { flag: "wx" });
  report.commands.push({ id, command: [program, ...args], cwd, start, end: new Date().toISOString(),
    ...outcome, stdoutBytes: stdout.length, stdoutSha256: digest(stdout),
    stderrBytes: stderr.length, stderrSha256: digest(stderr) });
  await writeFile(path.join(proof, "package-report.json"), JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(`${id}: ${outcome.exitCode}\n`);
  assert.equal(outcome.exitCode, 0, `${id} failed`);
  return stdout;
}

assert.equal(digest(await readFile(oldPackage)), "1b2c88c9263d5892946d3d9aacba79a6392eb3d8b3b37fa3c87aebcc1550cba0");
await mkdir(scratch, { recursive: true });
await run("pack", process.execPath, [pnpm, "pack", "--pack-destination", proof]);
const packed = await readFile(newPackage);
report.package = { path: path.relative(root, newPackage).replaceAll("\\", "/"), bytes: packed.length, sha256: digest(packed) };
const oldDir = path.join(scratch, "old"), newDir = path.join(scratch, "new");
await mkdir(oldDir, { recursive: true });
await mkdir(newDir, { recursive: true });
await run("extract-old", "tar", ["-xzf", oldPackage, "-C", oldDir]);
await run("extract-new", "tar", ["-xzf", newPackage, "-C", newDir]);
async function members(dir, prefix = "") {
  const out = new Map();
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) for (const [name, value] of await members(full, relative)) out.set(name, value);
    else if (entry.isFile()) out.set(relative, digest(await readFile(full)));
    else throw new Error(`unsupported package member ${relative}`);
  }
  return out;
}
const oldMembers = await members(oldDir), newMembers = await members(newDir);
const added = [...newMembers.keys()].filter((name) => !oldMembers.has(name));
const removed = [...oldMembers.keys()].filter((name) => !newMembers.has(name));
const changed = [...newMembers.keys()].filter((name) => oldMembers.has(name) && newMembers.get(name) !== oldMembers.get(name));
report.comparison = { oldMemberCount: oldMembers.size, newMemberCount: newMembers.size,
  added, removed, changed, expectedChanged: ["package/docs/onboarding.md", "package/package.json"],
  onlyExpectedChanges: added.length === 0 && removed.length === 0 &&
    changed.length === 2 && changed.every((name) => ["package/docs/onboarding.md", "package/package.json"].includes(name)) };
assert.equal(report.comparison.onlyExpectedChanges, true, "unexpected package member difference");
const sourcePackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const packageJson = JSON.parse(await readFile(path.join(newDir, "package/package.json"), "utf8"));
assert.equal(packageJson.version, "1.0.0");
assert.equal(packageJson.private, true);
assert.deepEqual(packageJson.bin, sourcePackage.bin);
assert.deepEqual(packageJson.dependencies, sourcePackage.dependencies);
assert.equal(digest(await readFile(path.join(newDir, "package/docs/onboarding.md"))), report.sourceHashes["docs/onboarding.md"]);
assert.equal(digest(await readFile(path.join(newDir, "package/config/tools/toolchain.lock.json"))), report.sourceHashes["config/tools/toolchain.lock.json"]);
assert.equal((await stat(path.join(newDir, "package/dist/cli/entrypoint.js"))).isFile(), true);
assert.equal((await stat(path.join(newDir, "package/skills/actions/apply/SKILL.md"))).isFile(), true);
report.packagedMetadata = { name: packageJson.name, version: packageJson.version, private: packageJson.private,
  bin: packageJson.bin, dependencies: packageJson.dependencies,
  onboardingMatchesSource: true, toolLockMatchesSource: true, entrypointPresent: true, applySkillPresent: true };
const installDir = path.join(scratch, "installation");
await mkdir(installDir, { recursive: true });
await run("production-install", process.execPath, [npm, "install", "--prefix", installDir,
  "--omit=dev", "--no-audit", "--no-fund", newPackage]);
const installed = path.join(installDir, "node_modules/flowkit-next");
const installedJson = JSON.parse(await readFile(path.join(installed, "package.json"), "utf8"));
assert.equal(installedJson.version, "1.0.0");
assert.deepEqual(installedJson.bin, sourcePackage.bin);
assert.deepEqual(installedJson.dependencies, sourcePackage.dependencies);
assert.equal(digest(await readFile(path.join(installed, "docs/onboarding.md"))), report.sourceHashes["docs/onboarding.md"]);
const help = await run("installed-cli-help", process.execPath, [path.join(installed, "dist/cli/entrypoint.js"), "--help"]);
assert.equal(JSON.parse(help.toString("utf8")).kind, "help");
report.install = { path: installed, version: installedJson.version, bin: installedJson.bin,
  dependencies: installedJson.dependencies, onboardingMatchesSource: true, helpKind: "help" };
report.limitations = ["Isolated Windows production installation and entrypoint help only; no Formal Full Test, registry publication, Git or Stable manager switch."];
await writeFile(path.join(proof, "package-report.json"), JSON.stringify(report, null, 2) + "\n");
process.stdout.write(JSON.stringify({ sha256: report.package.sha256, memberCount: newMembers.size,
  changed, installedVersion: installedJson.version }) + "\n");
