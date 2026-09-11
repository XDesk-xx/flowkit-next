import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const repo = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = path.join(proof, process.argv[2] || 'attempt-01');
await fs.mkdir(attempt);
const deliveryId = '20260908-05-lightweight-workflow-management';
const changeId = 'separate-manager-assets-from-target-project';
const runId = '20260908-010-propose';
const runBase = `.flowkit/runs/${deliveryId}/${changeId}`;
const changeRoot = `openspec/changes/${changeId}`;
const read = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const write = async (p, j) => fs.writeFile(p, JSON.stringify(j, null, 2) + '\n', { flag: 'wx' });
const ref = async p => {
  const b = await fs.readFile(p);
  return { path: path.relative(repo, path.resolve(p)).split(path.sep).join('/'), bytes: b.length,
    sha256: createHash('sha256').update(b).digest('hex') };
};
const checkRef = async r => assert.deepEqual(await ref(r.path), r);
const command = async (label, exe, args) => {
  const r = spawnSync(exe, args, { cwd: repo, encoding: 'utf8', timeout: 60000 });
  await fs.writeFile(path.join(attempt, label + '.stdout.txt'), r.stdout || '', { flag: 'wx' });
  await fs.writeFile(path.join(attempt, label + '.stderr.txt'), r.stderr || '', { flag: 'wx' });
  await write(path.join(attempt, label + '.command.json'), {
    exe, args, cwd: repo, exitCode: r.status, signal: r.signal, error: r.error?.message || null,
  });
  assert.equal(r.status, 0, r.stderr || r.error?.message);
  return r.stdout;
};
try {
  const reviewPath = `${runBase}/20260908-009-review-explore/result.json`;
  const review = await read(reviewPath);
  assert.equal(review.verdict, 'approved');
  assert.equal(review.nextBoundary, 'propose');
  for (const r of [review.reviewedExplore, review.reviewedResult, review.manifest, review.verification.summary]) await checkRef(r);
  const tool = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
  await command('strict', process.execPath, [tool, 'validate', changeId, '--strict']);
  const status = JSON.parse(await command('status', process.execPath, [tool, 'status', '--change', changeId, '--json']));
  assert.equal(status.isPlanningComplete, true);
  assert(status.artifacts.every(a => a.status === 'done'));
  const files = ['proposal.md', 'design.md', 'tasks.md'];
  const deltaStats = [];
  for (const cap of await fs.readdir(`${changeRoot}/specs`)) {
    const p = `specs/${cap}/spec.md`;
    files.push(p);
    const delta = await fs.readFile(`${changeRoot}/${p}`, 'utf8');
    const canonical = await fs.readFile(`openspec/specs/${cap}/spec.md`, 'utf8');
    let mode;
    const parts = delta.split(/(?=^## |^### Requirement: )/m);
    for (const block of parts) {
      if (block.startsWith('## ')) mode = block.split('\n')[0];
      if (!block.startsWith('### Requirement: ')) continue;
      const title = block.split('\n')[0];
      if (mode === '## MODIFIED Requirements') {
        const original = canonical.split(/(?=^### Requirement: )/m).find(b => b.split('\n')[0].trim() === title.trim());
        assert(original, `unknown modified requirement ${cap}: ${title}`);
        for (const s of original.match(/^#### Scenario: .+$/gm) || []) assert(block.includes(s.trim()), `lost scenario ${s}`);
      }
    }
    deltaStats.push({ capability: cap, requirements: (delta.match(/^### Requirement:/gm) || []).length });
  }
  assert.equal(deltaStats.length, 5);
  const taskText = await fs.readFile(`${changeRoot}/tasks.md`, 'utf8');
  const taskCount = (taskText.match(/^- \[ \] \d+\.\d+ /gm) || []).length;
  assert.equal(taskCount, 12);
  const artifacts = [];
  for (const p of files) {
    const b = await fs.readFile(`${changeRoot}/${p}`, 'utf8');
    assert(!b.includes('\r'), p);
    assert(!/[ \t]+$/m.test(b), p);
    assert(b.endsWith('\n') && !b.endsWith('\n\n'), p);
    artifacts.push(await ref(`${changeRoot}/${p}`));
  }
  await command('diff-check', 'git', ['diff', '--check']);
  const diff = (await command('tracked-diff', 'git', ['diff', '--name-only'])).trim();
  assert.equal(diff, `openspec/delivery-groups/${deliveryId}.yaml`);
  const summaryPath = path.join(attempt, 'summary.json');
  await write(summaryPath, {
    kind: 'bootstrap-propose-validation', status: 'PASS', completedAt: new Date().toISOString(),
    review: await ref(reviewPath), acceptedExplore: review.reviewedExplore, manifest: review.manifest,
    artifacts, deltaStats, taskCount, implementationTasksCompleted: 0,
    scope: '仅新建当前计划与本 Run/proof；既有 manifest 未在本轮修改，Review/Explore 精确引用不变',
    checkMeaning: 'OpenSpec结构/旧场景保留/计划文本与作用域检查，不是独立审查或实现验收',
  });
  const result = {
    kind: 'external-orchestrator-propose-result', canonicalFlowkitRuntimeRun: false,
    executionMode: 'independent-bootstrap', role: 'author', action: 'propose',
    deliveryId, changeId, runId, runNumber: 10, projectOrdinal: 34,
    previousRunId: '20260908-009-review-explore', status: 'terminal', verdict: 'PASS',
    verdictMeaning: 'Author Proposal completed and validated; not Reviewer approval or implementation PASS',
    summary: '分根、同源Guidance读取、target cwd与最小发行合同已收敛；5份delta、12项待实施任务。',
    reviewSource: await ref(reviewPath), evidence: await ref(summaryPath),
    action: await ref(`${runBase}/${runId}/action.md`), context: await ref(`${runBase}/${runId}/context.json`),
    nextBoundary: 'review-propose', reviewerVerdict: null,
    productionMutation: false, canonicalSpecMutation: false, applyExecuted: false,
    formalFullTestExecuted: false, gitMutationExecuted: false,
    completedAt: new Date().toISOString(), stop: true,
  };
  await write(`${runBase}/${runId}/result.json`, result);
  console.log(JSON.stringify({ runId, status: 'PASS', capabilities: 5, tasks: taskCount, nextBoundary: result.nextBoundary }));
} catch (e) {
  await write(path.join(attempt, 'failure.json'), { status: 'FAIL', message: e.message, stack: e.stack });
  throw e;
}
