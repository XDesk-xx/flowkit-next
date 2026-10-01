import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const proof = path.join(root, ".flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/pin-bootstrap-manager-version-1-0-0/proof/20261001-072-apply");
const config = JSON.parse(await readFile(path.join(root, "config/verification/full-test.json"), "utf8"));
assert.equal(config.inputs.filter((value) => value === "docs/onboarding.md").length, 1);
const scratch = await mkdtemp(path.join(root, ".tmp/d07-version-input-"));
for (const relative of config.inputs) {
  const target = path.join(scratch, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(root, relative), target, { recursive: true });
}
// Isolate input selection from check execution and executable resolution.
config.checks = [{ checkId: "selection-only", program: "node", args: ["--version"], cwd: "." }];
await writeFile(path.join(scratch, "config/verification/full-test.json"), JSON.stringify(config, null, 2) + "\n");
const docsPath = path.join(scratch, "docs/onboarding.md");
const docs = await readFile(docsPath);
const { readFullTestInput } = await import(pathToFileURL(path.join(root, "src/internal/full-test-input.ts")).href);
const before = await readFullTestInput(scratch);
assert.equal(before.files.includes("docs/onboarding.md"), true);
await writeFile(docsPath, Buffer.concat([docs, Buffer.from("\nCONTROLLED_D07_DOC_DRIFT\n")]));
const after = await readFullTestInput(scratch);
assert.notEqual(before.inputRef, after.inputRef);
const report = {
  kind: "d07-version-apply-input-selection",
  actualConfigSha256: createHash("sha256").update(await readFile(path.join(root, "config/verification/full-test.json"))).digest("hex"),
  selectedFile: "docs/onboarding.md",
  baselineInputRef: before.inputRef,
  driftInputRef: after.inputRef,
  changesWithOnboardingBytes: before.inputRef !== after.inputRef,
  checkDefinition: "fixed selection-only Node version check in isolated copy",
  limitation: "Input identity probe only; Formal Full Test checks and attempt were not executed."
};
await writeFile(path.join(proof, "input-selection-report.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
process.stdout.write(JSON.stringify({ selected: true, changed: report.changesWithOnboardingBytes }) + "\n");
