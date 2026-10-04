import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const proof = import.meta.dirname;
const root = process.cwd();
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: root }).toString().trim();
const json = file => readFile(file, "utf8").then(JSON.parse);
const normalize = text => text.replaceAll("\r\n", "\n").trim();
function requirements(text) {
  const result = {};
  const pattern = /^### Requirement: (.+)\r?\n([\s\S]*?)(?=^### Requirement: |^## |$(?![\s\S]))/gm;
  for (const match of text.matchAll(pattern)) {
    if (Object.hasOwn(result, match[1])) throw Error(`Duplicate requirement: ${match[1]}`);
    result[match[1]] = normalize(match[0]);
  }
  return result;
}
async function directoryHashes(directory, prefix = "") {
  const hashes = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(hashes, await directoryHashes(file, relative + "/"));
    else if (entry.isFile()) hashes[relative] = hash(await readFile(file));
    else throw Error(`Nonordinary change file: ${relative}`);
  }
  return hashes;
}
const mode = process.argv[2];
if (mode === "before") {
  const status = await json(path.join(proof, "openspec-status/stdout.txt"));
  if (path.resolve(status.planningHome.root) !== root || !status.isComplete || status.artifacts.some(a => !["done", "skipped"].includes(a.status))) throw Error("Incomplete or mismatched planning context");
  const instructions = await json(path.join(proof, "specs-instructions/stdout.txt"));
  if (instructions.artifactId !== "specs" || path.resolve(instructions.planningHome.root) !== root) throw Error("Invalid specs instructions");
  if (instructions.rules !== undefined) throw Error("Artifact rules require explicit assessment before archive");
  const snapshot = await json(path.join(root, ".flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/review/20261004-round2/snapshot-inputs.json"));
  for (const [file, expected] of Object.entries(snapshot)) if (hash(await readFile(path.join(root, file))) !== expected) throw Error(`Reviewed input drift: ${file}`);
  const candidate = (await json(path.join(root, ".flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/revise-apply/20261004-ra01-ra03/revision-readback.json"))).cumulativeCandidate;
  for (const [file, expected] of Object.entries(candidate)) {
    let actual = null;
    try { actual = hash(await readFile(path.join(root, file))); } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (actual !== expected) throw Error(`Cumulative candidate drift: ${file}`);
  }
  const review = await readFile(path.join(status.changeRoot, "review-apply-02.md"), "utf8");
  if (!/^[-] Verdict[:：]\s*approved\r?$/m.test(review)) throw Error("Latest independent review not approved");
  const tasks = await readFile(path.join(status.changeRoot, "tasks.md"), "utf8");
  if (/^- \[ \]/m.test(tasks)) throw Error("Incomplete tasks");
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const archiveRoot = path.join(status.planningHome.changesDir, "archive", `${date}-${status.changeName}`);
  try { await readdir(archiveRoot); throw Error("Archive destination already exists"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const specs = {};
  for (const deltaFile of status.artifactPaths.specs.existingOutputPaths) {
    const capability = path.relative(path.join(status.changeRoot, "specs"), path.dirname(deltaFile)).replaceAll("\\", "/");
    const mainPath = path.join(status.planningHome.root, "openspec/specs", capability, "spec.md");
    const delta = await readFile(deltaFile, "utf8");
    const main = await readFile(mainPath, "utf8");
    const mainRequirements = requirements(main);
    const original = Object.fromEntries(Object.entries(mainRequirements).map(([name, text]) => [name, hash(text)]));
    const operations = {};
    for (const match of delta.matchAll(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
      if (match[1] === "RENAMED") throw Error("Unexpected rename requires separate assessment");
      for (const [name, text] of Object.entries(requirements(match[2]))) {
        if (match[1] === "MODIFIED" && !Object.hasOwn(original, name)) throw Error(`Missing modified requirement: ${capability}/${name}`);
        if (match[1] === "ADDED" && Object.hasOwn(original, name)) throw Error(`Existing added requirement: ${capability}/${name}`);
        if (Object.hasOwn(operations, name)) throw Error(`Overlapping operation: ${name}`);
        operations[name] = { operation: match[1], sha256: hash(text) };
      }
    }
    if (!Object.keys(operations).length) throw Error(`No delta operations: ${capability}`);
    specs[capability] = { mainPath, deltaPath: deltaFile, beforeRawSha256: hash(main), purposePrefixSha256: hash(normalize(main.slice(0, main.search(/^### Requirement:/m)))), original, operations };
  }
  const result = { at: now.toISOString(), head: git("rev-parse", "HEAD"), branch: git("branch", "--show-current"), stagedPaths: git("diff", "--cached", "--name-only"), changeRoot: status.changeRoot, archiveRoot, reviewSha256: hash(review), checkedReviewedInputs: Object.keys(snapshot).length, cumulativeCandidate: candidate, tasksCompleted: (tasks.match(/^- \[x\]/gm) ?? []).length, changeFiles: await directoryHashes(status.changeRoot), mainSpecFiles: await directoryHashes(path.join(root, "openspec/specs")), specs };
  if (result.stagedPaths) throw Error("Unexpected staged paths");
  await writeFile(path.join(proof, "before.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ head: result.head, reviewedInputs: result.checkedReviewedInputs, tasks: result.tasksCompleted, archiveRoot, assessment: Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, Object.values(spec.operations).map(op => op.operation).reduce((counts, op) => ({ ...counts, [op]: (counts[op] ?? 0) + 1 }), {})])) }, null, 2));
} else if (mode === "after") {
  const before = await json(path.join(proof, "before.json"));
  try { await readdir(before.changeRoot); throw Error("Active source still exists"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const archived = await directoryHashes(before.archiveRoot);
  if (JSON.stringify(archived) !== JSON.stringify(before.changeFiles)) throw Error("Archive bytes/set differ from source");
  const syncedSpecs = {};
  for (const [capability, spec] of Object.entries(before.specs)) {
    const main = await readFile(spec.mainPath, "utf8");
    if (/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/m.test(main)) throw Error("Main spec contains delta headings");
    if (hash(normalize(main.slice(0, main.search(/^### Requirement:/m)))) !== spec.purposePrefixSha256) throw Error(`Purpose/header drift: ${capability}`);
    const actual = Object.fromEntries(Object.entries(requirements(main)).map(([name, text]) => [name, hash(text)]));
    const expected = { ...spec.original };
    for (const [name, operation] of Object.entries(spec.operations)) {
      if (operation.operation === "REMOVED") delete expected[name];
      else expected[name] = operation.sha256;
    }
    const keys = [...new Set([...Object.keys(actual), ...Object.keys(expected)])];
    if (keys.some(name => actual[name] !== expected[name])) throw Error(`Requirement sync mismatch: ${capability}`);
    syncedSpecs[capability] = { sha256: hash(main), requirements: Object.keys(actual).length, operations: Object.fromEntries(Object.entries(spec.operations).map(([name, value]) => [name, value.operation])) };
  }
  const currentMain = await directoryHashes(path.join(root, "openspec/specs"));
  const changedSpecs = new Set(Object.keys(before.specs).map(capability => `${capability}/spec.md`));
  for (const file of new Set([...Object.keys(before.mainSpecFiles), ...Object.keys(currentMain)])) if (!changedSpecs.has(file) && before.mainSpecFiles[file] !== currentMain[file]) throw Error(`Unrelated spec changed: ${file}`);
  for (const [file, expected] of Object.entries(before.cumulativeCandidate)) {
    let actual = null;
    try { actual = hash(await readFile(path.join(root, file))); } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (actual !== expected) throw Error(`Implementation changed during archive: ${file}`);
  }
  if (git("rev-parse", "HEAD") !== before.head || git("diff", "--cached", "--name-only")) throw Error("Unexpected Git mutation");
  const result = { at: new Date().toISOString(), head: before.head, archiveRoot: before.archiveRoot, archivedFiles: Object.keys(archived).length, sourceAbsent: true, rawMigrationVerified: true, tasksCompleted: before.tasksCompleted, syncedSpecs, unrelatedSpecsPreserved: true, implementationPreserved: true, stagedPaths: [] };
  await writeFile(path.join(proof, "after.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
} else throw Error("Expected before or after");
