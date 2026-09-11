import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const repo = process.cwd();
const out = import.meta.dirname;
const change = 'openspec/changes/connect-openspec-action-workflow';
const runRoot = '.flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow';
const plans = ['proposal.md', 'design.md', 'tasks.md', ...['foundation-cli-surface', 'single-action-execution-terminal-boundary', 'run-result-persistence', 'action-guidance-execution'].map(x => 'specs/' + x + '/spec.md')].map(x => change + '/' + x);
const hash = b => createHash('sha256').update(b).digest('hex');
const identity = p => { const b = fs.readFileSync(p); return { path: p, bytes: b.length, sha256: hash(b) }; };
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const files = [];
function collect(p) {
  if (fs.statSync(p).isDirectory()) for (const n of fs.readdirSync(p)) collect(p + '/' + n);
  else if (!plans.includes(p) && !p.includes('/20260908-023-revise-propose/')) files.push(p);
}
for (const p of ['src', 'tests', 'skills', '.agents/skills', 'config', 'openspec/specs', 'openspec/delivery-groups', change, runRoot, 'AGENTS.md', 'README.md', '.gitattributes', 'package.json', 'pnpm-lock.yaml', '.flowkit/project.json', '.flowkit/memos.json']) collect(p);
if (process.argv[2] === 'baseline') {
  const prior = path.join(out, 'prior-plan');
  fs.mkdirSync(prior);
  for (const p of plans) {
    const dest = path.join(prior, path.relative(change, p));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, fs.readFileSync(p), { flag: 'wx' });
  }
  const review = JSON.parse(fs.readFileSync(runRoot + '/20260908-022-review-explore/result.json'));
  for (const ref of [review.reviewedExplore, review.reviewedResult]) if (identity(ref.path).sha256 !== ref.sha256) throw Error('Reviewed input changed: ' + ref.path);
  if (review.verdict !== 'approved' || review.nextBoundary !== 'revise-propose') throw Error('Wrong review boundary');
  write(path.join(out, 'baseline.json'), { recordedAt: new Date().toISOString(), protected: files.map(identity), plans: plans.map(identity), review: identity(runRoot + '/20260908-022-review-explore/result.json') });
  console.log(JSON.stringify({ baseline: true, protectedFiles: files.length, planFiles: plans.length, reviewVerified: true }));
} else {
  const attempt = path.join(out, process.argv[2]);
  fs.mkdirSync(attempt);
  const runtime = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
  const commands = [['version', process.execPath, [runtime, '--version']], ['strict', process.execPath, [runtime, 'validate', 'connect-openspec-action-workflow', '--strict']], ['status', process.execPath, [runtime, 'status', '--change', 'connect-openspec-action-workflow', '--json']], ['diff-check', 'git', ['diff', '--check']]];
  const results = commands.map(([name, executable, args]) => {
    const startedAt = new Date().toISOString();
    const r = spawnSync(executable, args, { cwd: repo, maxBuffer: 2 * 1024 * 1024 });
    const streams = {};
    for (const s of ['stdout', 'stderr']) {
      const file = path.join(attempt, name + '.' + s + '.txt');
      fs.writeFileSync(file, r[s] ?? Buffer.alloc(0), { flag: 'wx' });
      streams[s] = identity(path.relative(repo, file).replaceAll('\\', '/'));
    }
    return { name, executable, args, cwd: repo, startedAt, finishedAt: new Date().toISOString(), exitCode: r.status, error: r.error?.message ?? null, streams };
  });
  const baseline = JSON.parse(fs.readFileSync(path.join(out, 'baseline.json')));
  const changed = baseline.protected.filter(x => !fs.existsSync(x.path) || identity(x.path).sha256 !== x.sha256);
  const textIssues = plans.flatMap(p => { const s = fs.readFileSync(p, 'utf8'); return /\r|\uFFFD|[\t ]+\n/.test(s) || !s.endsWith('\n') || s.endsWith('\n\n') ? [p] : []; });
  const deltas = plans.filter(p => p.includes('/specs/'));
  const missingModified = deltas.flatMap(p => {
    const canonical = fs.readFileSync(p.replace(change + '/specs/', 'openspec/specs/'), 'utf8');
    const modified = fs.readFileSync(p, 'utf8').split('## MODIFIED Requirements')[1]?.split(/^## /m)[0] ?? '';
    return [...modified.matchAll(/^### Requirement: (.+)$/gm)].filter(m => !canonical.includes('### Requirement: ' + m[1])).map(m => ({ path: p, requirement: m[1] }));
  });
  const tasks = fs.readFileSync(change + '/tasks.md', 'utf8');
  const summary = { recordedAt: new Date().toISOString(), results, protectedFiles: baseline.protected.length, changed, textIssues, missingModified, tasks: { checked: (tasks.match(/^- \[x\]/gm) ?? []).length, unchecked: (tasks.match(/^- \[ \]/gm) ?? []).length }, artifacts: plans.map(identity), priorApplyResultAbsent: !fs.existsSync(runRoot + '/20260908-019-apply/result.json'), meaning: 'Planning validation only; no implementation, independent review or Full Test.' };
  write(path.join(attempt, 'summary.json'), summary);
  console.log(JSON.stringify({ commands: results.map(r => ({ name: r.name, exitCode: r.exitCode, error: r.error })), protectedFiles: summary.protectedFiles, changed, textIssues, missingModified, tasks: summary.tasks }));
  process.exitCode = changed.length || textIssues.length || missingModified.length || results.some(r => r.exitCode !== 0) ? 1 : 0;
}
