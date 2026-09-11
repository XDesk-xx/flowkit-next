import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const repo = process.cwd();
const out = path.join(import.meta.dirname, process.argv[2]);
fs.mkdirSync(out);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const ref = file => { const b = fs.readFileSync(file); return { path: file, bytes: b.length, sha256: hash(b) }; };
const focused = [
  "tests/unit/domain/current-run-chain.test.ts", "tests/unit/domain/action-context.test.ts",
  "tests/unit/domain/run-partial-preservation.test.ts", "tests/unit/domain/agent-how-failure.test.ts",
  "tests/unit/domain/agent-how-material.test.ts", "tests/unit/domain/foundation-cli-surface.test.ts",
];
// Do not run the all-HOW loop: independent bootstrap must not consume candidate review-apply HOW.
const commands = [
  ["counterexamples", process.execPath, ["--import", "tsx", path.join(import.meta.dirname, "reproduce.mjs"), out]],
  ["focused-tests", process.execPath, ["--import", "tsx", "--test", ...focused]],
  ["strict", process.execPath, ["C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js",
    "validate", "connect-openspec-action-workflow", "--strict"]],
  ["diff-check", "git", ["diff", "--check", "HEAD"]],
];
const results = commands.map(([name, executable, args]) => {
  const startedAt = new Date().toISOString();
  const result = spawnSync(executable, args, { cwd: repo, maxBuffer: 4 * 1024 * 1024 });
  const streams = {};
  for (const stream of ["stdout", "stderr"]) {
    const file = path.join(out, name + "." + stream + ".txt");
    fs.writeFileSync(file, result[stream] ?? Buffer.alloc(0), { flag: "wx" });
    streams[stream] = ref(path.relative(repo, file).replaceAll("\\", "/"));
  }
  return { name, executable, args, cwd: repo, startedAt, finishedAt: new Date().toISOString(),
    exitCode: result.status, error: result.error?.message ?? null, streams };
});
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify({
  kind: "independent-review-apply-execution", results,
  counterexampleSuccessMeaning: "Exit zero means two current defects were reproduced with controls, not candidate PASS.",
  limit: "Focused tests only; no full suite/all-HOW/Full Test or candidate self-management."
}, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(results.map(({ name, exitCode, error }) => ({ name, exitCode, error }))));
process.exitCode = results.some(item => item.exitCode !== 0) ? 1 : 0;
