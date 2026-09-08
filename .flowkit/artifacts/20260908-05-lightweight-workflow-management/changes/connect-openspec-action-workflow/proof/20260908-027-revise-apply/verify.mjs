import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const p = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-027-revise-apply";
const baseline = JSON.parse(fs.readFileSync(p + "/baseline.json"));
const sha = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const ref = file => ({ path: file, bytes: fs.statSync(file).size, sha256: sha(file) });
for (const item of baseline.protectedFiles) assert.equal(sha(item.path), item.sha256, item.path);
const actions = ["explore","propose","apply","archive","revise-explore","revise-propose","revise-apply","review-explore","review-propose","review-apply"];
const allowed = ["src/cli/current-run-chain.ts", "tests/unit/domain/agent-how-fixture.ts", "AGENTS.md",
  ...actions.map(action => "skills/actions/" + action + "/SKILL.md")];
const changed = baseline.priorArtifacts.filter(item => sha(item.path) !== item.sha256).map(item => item.path);
assert.deepEqual([...changed].sort(), [...allowed].sort());
const additions = ["tests/unit/domain/run-group-selection.test.ts", "tests/unit/domain/agent-how-prepared.test.ts"];
const sources = [...baseline.priorArtifacts.map(item => item.path), ...additions].filter(file => /^(src|tests)\//.test(file));
const sizes = sources.map(file => ({ path: file, lines: fs.readFileSync(file, "utf8").split("\n").length - 1 }));
for (const item of sizes) assert.ok(item.lines <= 650, JSON.stringify(item));
const commands = ["group-fixed-native", "prepared-fixed", "typecheck", "build", "lint", "format-check",
  "domain-windows", "linux", "acceptance-windows", "dependency", "entropy", "strict", "skill-validation-02"];
const evidence = [];
for (const label of commands) {
  const file = p + "/" + label + "/command.json";
  const command = JSON.parse(fs.readFileSync(file));
  assert.equal(command.exitCode, 0, label);
  assert.equal(command.error, null, label);
  for (const stream of [command.stdout, command.stderr]) { assert.deepEqual(ref(stream.path), stream); evidence.push(stream); }
  evidence.push(ref(file));
}
const gitCheck = spawnSync("git", ["diff", "--check", "HEAD"], { encoding: "utf8" });
assert.equal(gitCheck.status, 0, gitCheck.stdout + gitCheck.stderr);
const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
assert.equal(head, "697088391374daa67d63c20f8a365fb44ec5c058");
const result = { status: "PASS", head, protectedFilesUnchanged: baseline.protectedFiles.length,
  changed: [...changed, ...additions].map(ref), exactRemovals: [],
  gate: { limit: 650, includesBlankAndCommentLines: true, maxLines: Math.max(...sizes.map(i => i.lines)), files: sizes },
  evidence, previousReview: baseline.review, priorApply: baseline.reviewedResult };
fs.writeFileSync(p + "/verification.json", JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ status: "PASS", protectedFiles: result.protectedFilesUnchanged,
  changedFiles: result.changed.length, maxLines: result.gate.maxLines }));
