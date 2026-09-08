import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

const repo = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2] ?? 'attempt-01';
assert.match(attempt, /^attempt-\d{2}$/);
const out = path.join(proof, attempt);
await fs.mkdir(out, { recursive: false });
const deliveryId = '20260908-05-lightweight-workflow-management';
const changeId = 'connect-openspec-action-workflow';
const runId = '20260908-017-propose';
const runBase = `.flowkit/runs/${deliveryId}/${changeId}`;
const run = `${runBase}/${runId}`;
const change = `openspec/changes/${changeId}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const relative = p => path.relative(repo, path.resolve(p)).split(path.sep).join('/');
const read = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const ref = async p => { const b = await fs.readFile(p); return { path: relative(p), bytes: b.length, sha256: hash(b) }; };
const write = (p, value) => fs.writeFile(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const commands = [];
async function command(label, exe, args) {
  const start = new Date().toISOString();
  const r = spawnSync(exe, args, { cwd: repo, maxBuffer: 8 * 1024 * 1024 });
  await fs.writeFile(path.join(out, label + '.stdout.txt'), r.stdout ?? Buffer.alloc(0), { flag: 'wx' });
  await fs.writeFile(path.join(out, label + '.stderr.txt'), r.stderr ?? Buffer.alloc(0), { flag: 'wx' });
  const record = { label, exe, args, startedAt: start, finishedAt: new Date().toISOString(),
    exitCode: r.status, error: r.error?.message ?? null,
    stdout: await ref(path.join(out, label + '.stdout.txt')), stderr: await ref(path.join(out, label + '.stderr.txt')) };
  await write(path.join(out, label + '.command.json'), record);
  commands.push(record);
  assert.equal(r.status, 0, `${label}: ${r.stderr} ${r.error?.message ?? ''}`);
  return r.stdout.toString();
}
const reviewPath = `${runBase}/20260908-016-review-explore/result.json`;
const review = await read(reviewPath);
assert.equal(review.verdict, 'approved');
assert.equal(review.nextBoundary, 'propose');
assert.equal(review.previousRunId, '20260908-015-explore');
assert.deepEqual(await ref(review.reviewedResult.path), review.reviewedResult);
for (const r of Object.values(review.runArtifacts)) assert.deepEqual(await ref(r.path), r);
const exploreResult = await read(review.reviewedResult.path);
assert.deepEqual(await ref(exploreResult.explore.path), exploreResult.explore);
const exploreSummary = await read(exploreResult.proofSummary.path);
for (const r of exploreSummary.sourceRefs) assert.deepEqual(await ref(r.path), r);
const manifestPath = `openspec/delivery-groups/${deliveryId}.yaml`;
const oldHandoff = await read(exploreResult.handoff.path);
assert.deepEqual(await ref(manifestPath), oldHandoff.manifest);
const manifest = YAML.parse(await fs.readFile(manifestPath, 'utf8'));
assert.equal(manifest.changes.find(c => c.id === changeId).state, 'active');
assert.equal(manifest.changes.find(c => c.id === changeId).projectOrdinal, 35);
const capabilities = ['foundation-cli-surface', 'single-action-execution-terminal-boundary', 'run-result-persistence', 'action-guidance-execution'];
const planningPaths = ['proposal.md', 'design.md', 'tasks.md', ...capabilities.map(c => `specs/${c}/spec.md`)];
const artifactRefs = [];
for (const p of planningPaths) {
  const full = `${change}/${p}`;
  const text = await fs.readFile(full, 'utf8');
  assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'), 'EOF: ' + p);
  assert.ok(!text.includes('\r') && !/[\t ]+$/m.test(text), 'text hygiene: ' + p);
  artifactRefs.push({ ...await ref(full), lines: text.split('\n').length - 1 });
}
const tasks = await fs.readFile(`${change}/tasks.md`, 'utf8');
const taskIds = [...tasks.matchAll(/^- \[ \] (\d+\.\d+) /gm)].map(m => m[1]);
assert.ok(taskIds.length > 0);
assert.equal(new Set(taskIds).size, taskIds.length);
assert.doesNotMatch(tasks, /^- \[x\]/m);
const deltaCounts = [];
for (const capability of capabilities) {
  const text = await fs.readFile(`${change}/specs/${capability}/spec.md`, 'utf8');
  const main = await fs.readFile(`openspec/specs/${capability}/spec.md`, 'utf8');
  const sections = text.split(/^## /m).slice(1);
  let added = 0, modified = 0;
  for (const section of sections) {
    const names = [...section.matchAll(/^### Requirement: (.+)$/gm)].map(m => m[1]);
    for (const name of names) {
      if (section.startsWith('MODIFIED Requirements')) {
        assert.ok(main.includes('### Requirement: ' + name + '\r\n') || main.includes('### Requirement: ' + name + '\n'), name);
        modified++;
      } else { assert.ok(!main.includes('### Requirement: ' + name), name); added++; }
    }
    for (const block of section.split(/^### Requirement: /m).slice(1)) assert.match(block, /^#### Scenario: /m);
  }
  deltaCounts.push({ capability, added, modified });
}
const runtime = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
assert.equal((await command('openspec-version', process.execPath, [runtime, '--version'])).trim(), '1.10.0');
const status = JSON.parse(await command('openspec-status', process.execPath, [runtime, 'status', '--change', changeId, '--json']));
assert.equal(status.isPlanningComplete, true);
assert.ok(status.artifacts.every(a => a.status === 'done'));
await command('openspec-strict', process.execPath, [runtime, 'validate', changeId, '--strict']);
await command('git-diff-check', 'git', ['diff', '--check']);
assert.equal((await command('tracked-diff', 'git', ['diff', '--name-only'])).trim(), manifestPath);
assert.equal((await command('index-diff', 'git', ['diff', '--cached', '--name-only'])).trim(), '');
const summaryPath = path.join(out, 'summary.json');
await write(summaryPath, { kind: 'bootstrap-propose-validation', status: 'PASS', verifiedAt: new Date().toISOString(),
  acceptedReview: await ref(reviewPath), approvedExplore: exploreResult.explore,
  authorAssessment: '规划从 approved Explore/Owner 决定/016 carry-forward 收敛；未重开 Explore 或执行实现。',
  artifactRefs, deltaCounts, taskCount: taskIds.length, allTasksUnchecked: true,
  priorSourceInputsUnchanged: true, activationManifestUnchanged: true, indexUnchanged: true,
  commands, method: await ref(fileURLToPath(import.meta.url)),
  limitations: ['OpenSpec strict 和结构核对不是独立语义审查', '未执行任何新增产品实现或宿主双 Change 验收', '未执行 Full Test/Git mutation'],
  nextBoundary: 'review-propose' });
await write(`${run}/result.json`, { kind: 'external-orchestrator-propose-result', canonicalFlowkitRuntimeRun: false,
  executionMode: 'independent-bootstrap', role: 'author', action: 'propose', deliveryId, changeId, runId,
  runNumber: 17, projectOrdinal: 35, previousRunId: '20260908-016-review-explore',
  status: 'terminal', verdict: 'PASS', verdictMeaning: '真实规划与结构/交接核对完成；不是 Reviewer approved 或实现 PASS',
  summary: '中文 proposal/design/tasks 与 4 份 delta 已完成；固定当前上下文、单次交互宿主、部分写入可见性与原始流解耦，交独立 review-propose。',
  acceptedExploreReview: await ref(reviewPath), planningArtifacts: artifactRefs,
  validation: await ref(summaryPath), runArtifacts: { action: await ref(`${run}/action.md`), context: await ref(`${run}/context.json`) },
  reviewerVerdict: null, implementationVerificationVerdict: null, nextBoundary: 'review-propose',
  applyExecuted: false, productionMutation: false, skillMutation: false, attributesMutation: false,
  formalFullTestExecuted: false, repositoryGitMutation: false,
  completedAt: new Date().toISOString(), stop: true });
assert.deepEqual((await fs.readdir(run)).sort(), ['action.md', 'context.json', 'result.json']);
console.log(JSON.stringify({ runId, verdict: 'PASS', artifacts: artifactRefs.length, taskCount: taskIds.length, deltaCounts, nextBoundary: 'review-propose', stop: true }));
