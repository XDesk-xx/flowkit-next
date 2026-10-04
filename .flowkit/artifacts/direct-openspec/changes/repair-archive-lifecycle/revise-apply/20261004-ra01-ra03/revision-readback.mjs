import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd(), proof = import.meta.dirname;
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: root });
const expectedRevision = [
  "src/cli/action-inspect.ts", "src/internal/candidate-git-bytes.ts",
  "src/internal/checkpoint-candidate-tree.ts", "src/internal/git-checkpoint-execution.ts",
  "src/internal/reviewed-checkpoint-candidate.ts", "tests/unit/domain/action-archive-cli.test.ts",
  "tests/unit/domain/archive-date-continuation.test.ts", "tests/unit/domain/git-eol-checkpoint.test.ts",
].sort();
const oldProof = path.resolve(".flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/apply");
const old = JSON.parse(await readFile(path.join(oldProof, "final-readback.json")));
const reviewProof = path.resolve(".flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/review/20261004-ocr-linux");
const reviewed = JSON.parse(await readFile(path.join(reviewProof, "snapshot-inputs.json")));
const snapshot = JSON.parse(await readFile(path.join(proof, "snapshot-inputs.json")));
const observedRevision = [];
for (const [relative, before] of Object.entries(reviewed)) {
  const actual = hash(await readFile(path.join(root, relative)));
  if (actual !== snapshot[relative]) throw Error(`Linux tested input drift: ${relative}`);
  if (actual !== before) observedRevision.push(relative);
}
if (JSON.stringify(observedRevision.sort()) !== JSON.stringify(expectedRevision))
  throw Error(`Unexpected revision scope: ${observedRevision}`);
const cumulativeCandidate = {};
for (const [relative, before] of Object.entries(old.files)) {
  let actual;
  try { actual = hash(await readFile(path.join(root, relative))); }
  catch (error) { if (error.code !== "ENOENT") throw error; actual = null; }
  cumulativeCandidate[relative] = actual;
  if (!expectedRevision.includes(relative) && actual !== before)
    throw Error(`Unrelated ancestor changed: ${relative}`);
}
const approvedInputs = {};
for (const [relative, previous] of Object.entries(old.approvedInputs)) {
  const actual = hash(await readFile(path.join(root, "openspec/changes/repair-archive-lifecycle", relative)));
  if (actual !== previous.actual) throw Error(`Approved planning input changed: ${relative}`);
  approvedInputs[relative] = { ...previous, actual };
}
let preservedAuthorStreams = 0;
for (const [name, check] of Object.entries(old.checks)) {
  for (const [stream, expected] of Object.entries(check.streams)) {
    const bytes = await readFile(path.join(oldProof, name, stream));
    if (bytes.length !== expected.bytes || hash(bytes) !== expected.sha256)
      throw Error(`Historical Author proof changed: ${name}/${stream}`);
    preservedAuthorStreams++;
  }
  const command = JSON.parse(await readFile(path.join(oldProof, name, "command.json")));
  if (JSON.stringify(command) !== JSON.stringify(check.command)) throw Error(`Historical command changed: ${name}`);
}
const oldVerification = hash(await readFile(path.join(root, "openspec/changes/repair-archive-lifecycle/verification.md")));
if (oldVerification !== old.verificationSha256) throw Error("Original verification changed");
const checks = {};
for (const directory of await readdir(proof, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  let command;
  try { command = JSON.parse(await readFile(path.join(proof, directory.name, "command.json"))); }
  catch (error) { if (error.code === "ENOENT") continue; throw error; }
  const streams = {};
  for (const name of ["stdout.txt", "stderr.txt"]) {
    const bytes = await readFile(path.join(proof, directory.name, name));
    streams[name] = { bytes: bytes.length, sha256: hash(bytes) };
  }
  checks[directory.name] = { command, streams };
}
const detached = JSON.parse(await readFile(path.join(proof, "detached-root.json")));
const installedFiles = {};
async function compare(relative) {
  for (const item of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const file = `${relative}/${item.name}`;
    if (item.isDirectory()) await compare(file);
    else await compareFile(file);
  }
}
async function compareFile(file) {
  const actual = hash(await readFile(path.join(detached.root, "node_modules/flowkit-next", file)));
  if (actual !== hash(await readFile(path.join(root, file)))) throw Error(`Installed bytes differ: ${file}`);
  installedFiles[file] = actual;
}
for (const directory of ["dist", "skills/actions", "skills/delivery", "skills/tools/openspec", "skills/vendors/openspec"]) await compare(directory);
for (const file of ["docs/onboarding.md", "config/tools/toolchain.lock.json"]) await compareFile(file);
const native = {};
for (const platform of ["linux", "windows"]) {
  const materialRoot = path.join(proof, `${platform}-native-materials`);
  const outcome = JSON.parse(await readFile(path.join(materialRoot, "outcome.json")));
  const materials = {};
  for (const attempt of [outcome.failed, outcome.archived]) {
    for (const ref of attempt.archiveMaterialRefs) {
      if (!ref.path.startsWith(".flowkit/artifacts/")) throw Error("Unexpected native reference");
      const bytes = await readFile(path.join(materialRoot, ref.path.replace(/^\.flowkit\/artifacts\//, "artifacts/")));
      if (bytes.length !== ref.bytes || hash(bytes) !== ref.sha256) throw Error(`Native material changed: ${ref.path}`);
      materials[ref.path] = ref.sha256;
    }
  }
  native[platform] = { platform: outcome.platform, failed: outcome.failed.archiveOutcome, completed: outcome.archived.archiveOutcome, checkpoint: outcome.checkpoint, completions: outcome.completions, materials };
}
const staged = git("diff", "--cached", "--name-only").toString().trim();
if (staged) throw Error("Unexpected staged paths");
const head = git("rev-parse", "HEAD").toString().trim();
if (head !== old.head) throw Error("HEAD changed");
const lock = await readFile(path.join(root, "pnpm-lock.yaml"));
if (!lock.equals(git("show", "HEAD:pnpm-lock.yaml"))) throw Error("Repository lock changed");
const historicalChanges = git("diff", "--name-only", "--", ".flowkit/runs", "openspec/changes/archive").toString();
if (historicalChanges) throw Error("Historical Run/archive changed");
const archive = await readFile(detached.packagePath);
const readback = {
  observedAt: new Date().toISOString(), role: "Author / Verification", head,
  branch: git("branch", "--show-current").toString().trim(), stagedPaths: [], historicalRecordsChanged: false,
  revisionFiles: Object.fromEntries(expectedRevision.map(file => [file, { before: reviewed[file], after: snapshot[file] }])),
  cumulativeCandidate, approvedInputs, testedLinuxSnapshotFiles: Object.keys(snapshot).length,
  originalVerificationSha256: oldVerification, preservedAuthorStreams,
  immutableReferences: { originalApplyReadback: hash(await readFile(path.join(oldProof, "final-readback.json"))), reviewReadback: hash(await readFile(path.join(reviewProof, "review-readback.json"))), reviewReport: hash(await readFile(path.join(root, "openspec/changes/repair-archive-lifecycle/review-apply.md"))) },
  checks, native, repositoryLock: { sha256: hash(lock), matchesHead: true },
  package: { path: detached.packagePath, bytes: archive.length, sha256: hash(archive), installedRoot: detached.root, installedFiles, fixtureYamlOverride: "2.9.0", metadata: JSON.parse(await readFile(path.join(detached.root, "node_modules/flowkit-next/package.json"))) },
  handoffSha256: hash(await readFile(path.join(root, "openspec/changes/repair-archive-lifecycle/revise-apply.md"))),
};
await writeFile(path.join(proof, "revision-readback.json"), JSON.stringify(readback, null, 2) + "\n");
console.log(JSON.stringify({ head, revisionFiles: expectedRevision.length, cumulativeFiles: Object.keys(cumulativeCandidate).length, approvedInputs: Object.keys(approvedInputs).length, preservedAuthorStreams, matchedInstalledFiles: Object.keys(installedFiles).length, packageSha256: readback.package.sha256, checks: Object.keys(checks).length }));
