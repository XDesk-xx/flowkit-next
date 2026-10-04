import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd(), proof = import.meta.dirname;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: root });
const changed = git("diff", "--name-only", "-z").toString().split("\0").filter(Boolean);
const extra = git("ls-files", "--others", "--exclude-standard", "-z").toString().split("\0").filter(p => /^(src|tests)\//.test(p));
const files = {};
for (const relative of [...new Set([...changed, ...extra])].sort()) {
  if (relative.startsWith(".flowkit/runs/") || relative.startsWith("openspec/changes/archive/")) throw Error("Historical records changed");
  try { files[relative] = hash(await readFile(path.join(root, relative))); }
  catch (error) { if (error.code !== "ENOENT") throw error; files[relative] = null; }
}
const review = await readFile(path.join(root, "openspec/changes/repair-archive-lifecycle/review-propose-03.md"), "utf8");
const approvedInputs = {};
for (const [, relative, expected] of review.matchAll(/\| `([^`]+)` \| `([a-f0-9]{64})` \|/g)) {
  const actual = hash(await readFile(path.join(root, "openspec/changes/repair-archive-lifecycle", relative)));
  let progressOnly = false;
  if (relative === "tasks.md" && actual !== expected) {
    const tasks = await readFile(path.join(root, "openspec/changes/repair-archive-lifecycle/tasks.md"), "utf8");
    progressOnly = hash(Buffer.from(tasks.replaceAll("- [x]", "- [ ]"))) === expected;
  }
  approvedInputs[relative] = { expected, actual, matches: actual === expected, progressOnly };
  if (actual !== expected && !progressOnly) throw Error(`Approved input changed: ${relative}`);
}
const checks = {};
for (const directory of await readdir(proof, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const check = path.join(proof, directory.name);
  let command;
  try { command = JSON.parse(await readFile(path.join(check, "command.json"))); }
  catch (error) { if (error.code === "ENOENT") continue; throw error; }
  const streams = {};
  for (const name of ["stdout.txt", "stderr.txt"]) {
    const bytes = await readFile(path.join(check, name));
    streams[name] = { bytes: bytes.length, sha256: hash(bytes) };
  }
  checks[directory.name] = { command, streams };
}
const installedRoot = JSON.parse(await readFile(path.join(proof, "detached-final-root.json"))).root;
const installed = path.join(installedRoot, "node_modules/flowkit-next");
const installedFiles = {};
async function compareDirectory(relative) {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) await compareDirectory(child);
    else {
      const expected = hash(await readFile(path.join(root, child))), actual = hash(await readFile(path.join(installed, child)));
      if (actual !== expected) throw Error(`Installed candidate differs: ${child}`);
      installedFiles[child] = actual;
    }
  }
}
for (const directory of ["dist", "skills/actions", "skills/delivery", "skills/tools/openspec", "skills/vendors/openspec"]) await compareDirectory(directory);
for (const relative of ["docs/onboarding.md", "config/tools/toolchain.lock.json"]) {
  const expected = hash(await readFile(path.join(root, relative))), actual = hash(await readFile(path.join(installed, relative)));
  if (expected !== actual) throw Error(`Installed file differs: ${relative}`);
  installedFiles[relative] = actual;
}
const lock = await readFile(path.join(root, "pnpm-lock.yaml"));
if (!lock.equals(git("show", "HEAD:pnpm-lock.yaml"))) throw Error("Repository lock was not restored exactly");
if (git("diff", "--cached", "--name-only").length) throw Error("Unexpected staged paths");
const archive = await readFile(path.join(root, ".tmp/repair-archive-lifecycle-package/final-v3/flowkit-next-1.0.0.tgz"));
const nativeEvidence = path.join(proof, "native-windows-lp-materials");
const native = JSON.parse(await readFile(path.join(nativeEvidence, "outcome.json")));
const nativeMaterials = {};
for (const attempt of [native.failed, native.archived]) {
  for (const ref of attempt.archiveMaterialRefs) {
    if (!ref.path.startsWith(".flowkit/artifacts/")) throw Error("Unexpected native evidence path");
    const bytes = await readFile(path.join(nativeEvidence, ref.path.replace(/^\.flowkit\/artifacts\//, "artifacts/")));
    if (bytes.length !== ref.bytes || hash(bytes) !== ref.sha256) throw Error(`Native material changed: ${ref.path}`);
    nativeMaterials[ref.path] = ref.sha256;
  }
}
const readback = {
  observedAt: new Date().toISOString(), branch: git("branch", "--show-current").toString().trim(), head: git("rev-parse", "HEAD").toString().trim(),
  files, approvedInputs, checks, stagedPaths: [], historicalRecordsChanged: false,
  verificationSha256: hash(await readFile(path.join(root, "openspec/changes/repair-archive-lifecycle/verification.md"))),
  nativeWindows: { platform: native.platform, review: native.review, delivery: native.delivery, failed: native.failed.archiveOutcome, completed: native.archived.archiveOutcome, checkpoint: native.checkpoint, completions: native.completions, materials: nativeMaterials },
  repositoryLock: { sha256: hash(lock), matchesHead: true },
  package: { bytes: archive.length, sha256: hash(archive), installedRoot, installedMetadata: JSON.parse(await readFile(path.join(installed, "package.json"))), installedFiles,
    fixtureDependencyOverride: "yaml@2.9.0 (repository lock version)",
    fixtureWorkspace: (await readFile(path.join(installedRoot, "pnpm-workspace.yaml"))).toString(),
    fixtureLockSha256: hash(await readFile(path.join(installedRoot, "pnpm-lock.yaml"))) },
};
await writeFile(path.join(proof, "final-readback.json"), JSON.stringify(readback, null, 2) + "\n");
process.stdout.write(JSON.stringify({ head: readback.head, changedFiles: Object.keys(files).length, approvedInputCount: Object.keys(approvedInputs).length, checkCount: Object.keys(checks).length, packageSha256: readback.package.sha256, matchedInstalledFiles: Object.keys(installedFiles).length }) + "\n");
