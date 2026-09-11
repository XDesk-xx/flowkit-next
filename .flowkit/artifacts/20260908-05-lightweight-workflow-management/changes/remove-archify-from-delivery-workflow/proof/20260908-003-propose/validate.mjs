// Local Propose validation and execution record; not product Runtime admission.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const deliveryId = '20260908-05-lightweight-workflow-management';
const changeId = 'remove-archify-from-delivery-workflow';
const runId = '20260908-003-propose';
const run = `.flowkit/runs/${deliveryId}/${changeId}/${runId}`;
const change = `openspec/changes/${changeId}`;
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2];
assert.match(attempt ?? '', /^attempt-\d{2}$/);
const out = path.join(proof, attempt);
await mkdir(out);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const relative = value => path.relative(process.cwd(), value).replaceAll('\\', '/');
async function save(name, value) { await writeFile(path.join(out, name), value, { flag: 'wx' }); }
async function command(label, program, args) {
  const value = spawnSync(program, args, { cwd: process.cwd(), encoding: 'utf8', windowsHide: true, timeout: 30000 });
  await save(`${label}.stdout.txt`, value.stdout ?? '');
  await save(`${label}.stderr.txt`, value.stderr ?? '');
  const meta = { program, args, exitCode: value.status, error: value.error?.message ?? null };
  await save(`${label}.command.json`, json(meta));
  return { ...meta, stdout: value.stdout };
}
const cli = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
const files = [`${change}/proposal.md`, `${change}/design.md`, `${change}/tasks.md`];
const capabilities = (await readdir(`${change}/specs`)).sort();
for (const capability of capabilities) files.push(`${change}/specs/${capability}/spec.md`);
const inputs = [];
for (const file of files) {
  const bytes = await readFile(file);
  inputs.push({ path: file, sha256: hash(bytes), bytes: bytes.length });
}
await save('inputs.json', json(inputs));
const validation = await command('openspec-validate', process.execPath, [cli, 'validate', changeId, '--strict']);
if (validation.exitCode !== 0) {
  await save('summary.json', json({ runId, attempt, status: 'validation-failed', validation, recordedAt: new Date().toISOString(), limitation: 'No terminal success or Review verdict produced.' }));
  process.exitCode = 1;
} else {
  const context = JSON.parse(await readFile(`${run}/context.json`, 'utf8'));
  const previous = `.flowkit/runs/${deliveryId}/${changeId}/20260908-002-review-explore/result.json`;
  const reviewBytes = await readFile(previous);
  assert.equal(hash(reviewBytes), context.previousResultSha256);
  const review = JSON.parse(reviewBytes);
  assert.equal(review.verdict, 'approved');
  assert.equal(review.nextBoundary, 'propose');
  assert.equal(review.previousRunId, '20260908-001-explore');
  assert.equal(hash(await readFile(review.reviewedArtifact)), review.reviewedArtifactSha256);
  assert.equal(hash(await readFile(`.flowkit/runs/${deliveryId}/${changeId}/20260908-001-explore/result.json`)), review.reviewedResultSha256);
  for (const entry of Object.values(review.runArtifacts)) assert.equal(hash(await readFile(entry.path)), entry.sha256);
  const mapping = [];
  for (const capability of capabilities) {
    const base = await readFile(`openspec/specs/${capability}/spec.md`, 'utf8');
    const delta = await readFile(`${change}/specs/${capability}/spec.md`, 'utf8');
    let operation;
    for (const line of delta.split(/\r?\n/)) {
      const section = /^## (ADDED|MODIFIED|REMOVED) Requirements$/.exec(line);
      if (section) operation = section[1];
      if (!line.startsWith('### Requirement: ')) continue;
      assert.ok(operation);
      const exists = base.split(/\r?\n/).includes(line);
      assert.equal(exists, operation !== 'ADDED', `${operation}: ${line}`);
      mapping.push({ capability, operation, requirement: line.slice(17) });
    }
  }
  assert.equal(capabilities.length, 6);
  const proposal = await readFile(`${change}/proposal.md`, 'utf8');
  for (const capability of capabilities) assert.ok(proposal.includes('`' + capability + '`'));
  const tasks = await readFile(`${change}/tasks.md`, 'utf8');
  assert.equal((tasks.match(/^- \[ \] \d+\.\d+ /gm) ?? []).length, 16);
  assert.equal(tasks.includes('- [x]'), false);
  for (const input of inputs) {
    const bytes = await readFile(input.path);
    assert.equal(hash(bytes), input.sha256);
    const value = bytes.toString();
    assert.ok(!value.includes('\r') && value.endsWith('\n') && !value.endsWith('\n\n'));
    assert.equal(/[\t ]+$/m.test(value), false);
  }
  const state = await command('openspec-status', process.execPath, [cli, 'status', '--change', changeId, '--json']);
  assert.equal(state.exitCode, 0);
  assert.equal(JSON.parse(state.stdout).isPlanningComplete, true);
  const whitespace = await command('git-diff-check', 'git', ['diff', '--check']);
  assert.equal(whitespace.exitCode, 0);
  const diff = await command('git-tracked-diff', 'git', ['diff', '--name-only', 'HEAD']);
  assert.equal(diff.exitCode, 0);
  assert.equal(diff.stdout.trim(), `openspec/delivery-groups/${deliveryId}.yaml`);
  // The manifest and old Author artifacts remain exactly as sealed before this invocation.
  const authorAudit = JSON.parse(await readFile(`.flowkit/artifacts/${deliveryId}/changes/${changeId}/proof/20260908-001-explore/handoff-audit.json`, 'utf8'));
  for (const entry of authorAudit.artifacts) assert.equal(hash(await readFile(entry.path)), entry.sha256);
  const report = { kind: 'propose-validation', deliveryId, changeId, runId, attempt,
    recordedAt: new Date().toISOString(), status: 'passed', inputs, mapping,
    checks: { openspecStrict: true, planningComplete: true, requirementHeadersMatchBase: true,
      tasksUnchecked: 16, predecessorApprovedAndHashesMatch: true, oldAuthorArtifactsUnchanged: true,
      productionAndMainSpecsUnchanged: true, gitDiffCheck: true },
    limitations: ['Structure and local planning checks only; not independent review, implementation acceptance, or Full Test.'] };
  const bytes = json(report);
  await save('summary.json', bytes);
  const result = { kind: 'external-orchestrator-propose-result', canonicalFlowkitRuntimeRun: false,
    executionMode: 'independent-bootstrap', deliveryId, changeId, runId, action: 'propose', role: 'author',
    status: 'terminal', verdict: 'PASS', verdictMeaning: '计划生成及真实结构核对完成；不是 Reviewer approved 或实现 PASS。',
    projectOrdinal: 33, previousRunId: review.runId, previousResultSha256: hash(reviewBytes),
    ownerInstruction: 'propose', summary: '中文 proposal/design/tasks 与六个能力 delta 已完成，16 个任务均未执行；去掉架构直接依赖，保留其余现行边界。',
    artifacts: inputs,
    validation: { path: `${relative(out)}/summary.json`, sha256: hash(bytes) },
    retention: context.ownerRetentionDecision,
    nextBoundary: 'review-propose', reviewerVerdict: null, applyAllowed: false,
    productionMutation: false, formalFullTestExecuted: false, gitMutationAllowed: false,
    completedAt: new Date().toISOString(), stop: true };
  await writeFile(`${run}/result.json`, json(result), { flag: 'wx' });
  assert.deepEqual((await readdir(run)).sort(), ['action.md', 'context.json', 'result.json']);
  console.log(json({ runId, capabilities: capabilities.length, tasks: 16, checks: report.checks, nextBoundary: result.nextBoundary }));
}
