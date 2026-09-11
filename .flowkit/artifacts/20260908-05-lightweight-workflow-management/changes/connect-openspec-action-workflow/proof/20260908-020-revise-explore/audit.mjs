import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
const repo = process.cwd();
const out = path.join(import.meta.dirname, "attempt-01");
fs.mkdirSync(out);
const sources = [
  "package.json", "src/internal/manager-installation.ts", "src/domain/single-action-execution.ts",
  "src/domain/run-result-persistence.ts", "src/cli/entrypoint.ts", "src/cli/request.ts",
  "src/cli/action-command.ts", "src/cli/action-context.ts", "src/cli/current-run-chain.ts",
  "src/cli/action-protocol.ts", "src/internal/action-run-reservation.ts",
  "src/internal/action-proof.ts", "src/internal/action-target-files.ts", ".gitattributes",
  "openspec/changes/connect-openspec-action-workflow/proposal.md",
  "openspec/changes/connect-openspec-action-workflow/design.md",
  "openspec/changes/connect-openspec-action-workflow/tasks.md",
];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const inputs = sources.map(file => { const b = fs.readFileSync(file); return { path: file, bytes: b.length, sha256: hash(b) }; });
const runtime = "C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
const managerModule = pathToFileURL(path.join(repo, "dist/internal/manager-installation.js")).href;
const commands = [
  ["version", [runtime, "--version"], repo],
  ["list", [runtime, "list", "--json"], repo],
  ["status", [runtime, "status", "--change", "connect-openspec-action-workflow", "--json"], repo],
  ["module-root-other-cwd", ["--input-type=module", "-e", "const m=await import(" + JSON.stringify(managerModule) + "); console.log(JSON.stringify(m.loadManagerInstallation()))"], out],
];
const results = [];
for (const [name, args, cwd] of commands) {
  const startedAt = new Date().toISOString();
  const r = spawnSync(process.execPath, args, { cwd, maxBuffer: 1024 * 1024 });
  const streams = {};
  for (const stream of ["stdout", "stderr"]) {
    const b = r[stream] ?? Buffer.alloc(0);
    const file = path.join(out, name + "." + stream + ".txt");
    fs.writeFileSync(file, b, { flag: "wx" });
    streams[stream] = { path: path.relative(repo, file).replaceAll("\\", "/"), bytes: b.length, sha256: hash(b) };
  }
  results.push({ name, executable: process.execPath, args, cwd, startedAt, finishedAt: new Date().toISOString(), exitCode: r.status, error: r.error?.message ?? null, ...streams });
}
const changed = inputs.filter(item => hash(fs.readFileSync(item.path)) !== item.sha256);
const oldRun = ".flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow/20260908-019-apply";
const record = { recordedAt: new Date().toISOString(), inputs, results, protectedInputsUnchanged: changed.length === 0,
  priorApplyFiles: fs.readdirSync(oldRun), meaning: "Read-only source/root probe; not implementation acceptance, independent Review or Full Test." };
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(record, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ results: results.map(r => ({ name: r.name, exitCode: r.exitCode, error: r.error })), protectedInputsUnchanged: changed.length === 0, priorApplyFiles: record.priorApplyFiles }));
process.exitCode = changed.length || results.some(r => r.exitCode !== 0) ? 1 : 0;
