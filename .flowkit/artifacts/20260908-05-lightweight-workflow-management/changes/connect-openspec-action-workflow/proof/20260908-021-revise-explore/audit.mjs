import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const repo = process.cwd();
const out = path.join(import.meta.dirname, process.argv[2] ?? 'attempt-01');
fs.mkdirSync(out);
const hash = b => createHash('sha256').update(b).digest('hex');
const change = 'openspec/changes/connect-openspec-action-workflow';
const runRoot = '.flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow';
const files = [];
function collect(p) {
  if (fs.statSync(p).isDirectory()) for (const n of fs.readdirSync(p)) collect(p + '/' + n);
  else files.push(p);
}
for (const p of ['src', 'tests', 'skills', '.agents/skills', 'config', 'openspec/delivery-groups', change, runRoot, 'AGENTS.md', 'README.md', '.gitattributes', 'package.json']) collect(p);
const inputs = files.map(p => ({ path: p, sha256: hash(fs.readFileSync(p)) }));
fs.writeFileSync(path.join(out, 'prior-explore.md'), fs.readFileSync(change + '/explore.md'), { flag: 'wx' });
const targets = ['src/cli/entrypoint.ts', 'src/cli/foundation-cli.ts', 'src/cli/current-run-chain.ts', 'src/domain/run-result-persistence.ts', 'src/domain/single-action-execution.ts'];
const inspections = targets.map(p => ({ path: p, sha256: hash(fs.readFileSync(p)), numberedSource: fs.readFileSync(p, 'utf8').split(/\r?\n/).map((s, i) => `${i + 1}: ${s}`).join('\n') }));
fs.writeFileSync(path.join(out, 'source-inspection.json'), JSON.stringify(inspections, null, 2) + '\n', { flag: 'wx' });
const runtime = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
const commands = [
  ['version', process.execPath, [runtime, '--version']],
  ['list', process.execPath, [runtime, 'list', '--json']],
  ['status', process.execPath, [runtime, 'status', '--change', 'connect-openspec-action-workflow', '--json']],
  ['existing-kernel', 'git', ['diff', 'HEAD', '--', 'src/domain/run-result-persistence.ts', 'src/domain/single-action-execution.ts', 'src/domain/policy-and-next-boundary.ts']],
];
const results = commands.map(([name, executable, args]) => {
  const startedAt = new Date().toISOString();
  const r = spawnSync(executable, args, { cwd: repo, maxBuffer: 1024 * 1024 });
  const streams = {};
  for (const s of ['stdout', 'stderr']) {
    const b = r[s] ?? Buffer.alloc(0);
    const p = path.join(out, name + '.' + s + '.txt');
    fs.writeFileSync(p, b, { flag: 'wx' });
    streams[s] = { path: path.relative(repo, p).replaceAll('\\', '/'), bytes: b.length, sha256: hash(b) };
  }
  return { name, executable, args, cwd: repo, startedAt, finishedAt: new Date().toISOString(), exitCode: r.status, error: r.error?.message ?? null, streams };
});
const changed = inputs.filter(x => hash(fs.readFileSync(x.path)) !== x.sha256);
const record = { kind: 'readonly-explore-audit', recordedAt: new Date().toISOString(), inputs, results, changed, priorApplyFiles: fs.readdirSync(runRoot + '/20260908-019-apply'), meaning: 'Source inspection and OpenSpec observation only; no candidate Action, implementation acceptance, Reviewer verdict or Full Test.' };
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ commands: results.map(r => ({ name: r.name, exitCode: r.exitCode, error: r.error })), protectedFiles: inputs.length, changed, priorApplyFiles: record.priorApplyFiles }));
process.exitCode = changed.length || results.some(r => r.exitCode !== 0) ? 1 : 0;
