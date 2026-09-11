import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const proof = path.dirname(fileURLToPath(import.meta.url));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const checkIds = JSON.parse(await fs.readFile("config/verification/full-test.json", "utf8")).checks.map(c => c.checkId);
const checks = [];
for (const prefix of ["win-final", "linux-final"]) for (const id of checkIds) {
  const directory = path.join(proof, prefix + "-" + id);
  const record = JSON.parse(await fs.readFile(path.join(directory, "command.json"), "utf8"));
  assert.equal(record.exitCode, 0, `${prefix}-${id}`);
  for (const name of ["stdout", "stderr"]) {
    const bytes = await fs.readFile(path.join(directory, name + ".txt"));
    assert.equal(bytes.length, record[name].bytes); assert.equal(sha(bytes), record[name].sha256);
  }
  checks.push({ check: prefix + "-" + id, exitCode: record.exitCode });
}
for (const id of ["pack", "packed-example", "supplemental", "openspec-strict", "linux-container-retry"]) {
  assert.equal(JSON.parse(await fs.readFile(path.join(proof, id, "command.json"), "utf8")).exitCode, 0);
}
const linuxSource = JSON.parse(await fs.readFile(path.join(proof, "linux-source.json"), "utf8"));
for (const ref of linuxSource.files) {
  const bytes = await fs.readFile(ref.artifact);
  assert.equal(bytes.length, ref.bytes, ref.artifact); assert.equal(sha(bytes), ref.contentSha256, ref.artifact);
}
const files = [];
async function scan(dir) {
  for (const name of await fs.readdir(dir)) {
    const file = path.join(dir, name);
    if ((await fs.lstat(file)).isDirectory()) await scan(file);
    else if (/\.(?:ts|mjs)$/.test(file)) {
      const text = await fs.readFile(file, "utf8");
      const lines = text.split("\n").length - Number(text.endsWith("\n"));
      assert.ok(lines <= 650, `${file}: ${lines}`);
      files.push({ path: file.replaceAll("\\", "/"), lines });
    }
  }
}
await scan("src"); await scan("tests");
const change = "openspec/changes/invoke-git-at-workflow-boundaries";
let modified = 0, added = 0;
for (const capability of await fs.readdir(path.join(change, "specs"))) {
  const delta = await fs.readFile(path.join(change, "specs", capability, "spec.md"), "utf8");
  const main = await fs.readFile(path.join("openspec/specs", capability, "spec.md"), "utf8");
  let mode;
  for (const section of delta.split(/(?=^## |^### Requirement: )/m)) {
    if (section.startsWith("## ")) { mode = section.split("\n")[0]; continue; }
    if (!section.startsWith("### Requirement: ")) continue;
    if (mode === "## ADDED Requirements") { added++; continue; }
    if (mode !== "## MODIFIED Requirements") continue;
    modified++;
    const heading = section.split("\n")[0];
    const canonical = main.split(/(?=^### Requirement: )/m).find(s => s.split("\n")[0] === heading);
    assert.ok(canonical, heading);
    for (const scenario of canonical.matchAll(/^#### Scenario: (.+)$/gm)) assert.ok(section.includes(scenario[0]), scenario[0]);
  }
}
assert.equal(modified, 4); assert.equal(added, 3);
const report = { status: "passed", checks, linuxSourceFilesMatchCurrent: linuxSource.files.length,
  lineGate: { limit: 650, checked: files.length, largest: files.sort((a, b) => b.lines - a.lines).slice(0, 10) }, deltaCoverage: { modified, added, existingScenarioNamesPreserved: true },
  limitations: ["Linux /evidence is the bind mount of this target proofRoot; ../../evidence refs in command metadata use container cwd, not external project retention", "First Linux launch failed because daemon was stopped; preserved original failure, unchanged-code retry passed", "Not actual D05 Formal Full Test or independent review-apply"] };
await fs.writeFile(path.join(proof, "verification-audit.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(report));
