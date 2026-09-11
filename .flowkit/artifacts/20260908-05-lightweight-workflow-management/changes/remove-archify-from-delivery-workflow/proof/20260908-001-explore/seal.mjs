// One-time local bootstrap handoff readback; never candidate Runtime admission.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const deliveryId = '20260908-05-lightweight-workflow-management';
const changeId = 'remove-archify-from-delivery-workflow';
const runId = '20260908-001-explore';
const run = `.flowkit/runs/${deliveryId}/${changeId}/${runId}`;
const manifestPath = `openspec/delivery-groups/${deliveryId}.yaml`;
const explorePath = `openspec/changes/${changeId}/explore.md`;
const digest = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const relative = value => path.relative(root, value).replaceAll('\\', '/');
async function readJson(file) { return JSON.parse(await readFile(file, 'utf8')); }
function exec(program, args) {
  const value = spawnSync(program, args, { cwd: root, windowsHide: true, timeout: 30000 });
  assert.equal(value.status, 0, `${program}: ${value.stderr?.toString()}`);
  return value.stdout;
}
const manifest = parse(await readFile(manifestPath, 'utf8'));
assert.equal(manifest.changes.length, 6);
assert.equal(manifest.changes[0].id, changeId);
assert.equal(manifest.changes[0].state, 'active');
assert.equal(manifest.changes[0].projectOrdinal, 33);
assert.ok(manifest.changes.slice(1).every(x => x.state === 'planned' && x.projectOrdinal === undefined));
const context = await readJson(`${run}/context.json`);
assert.equal(context.canonicalFlowkitRuntimeRun, false);
assert.equal(context.ownerInstruction, 'owner 授权激活 第一个change，进行 proof based ，这里按照文档要求来处理 proof 的保存');
assert.ok(manifest.ownerDecisions.some(x => x.ref === context.ownerActivationRef && x.changeId === changeId && x.scope.join() === 'explore'));
const summary = await readJson(path.join(proof, 'attempt-01/summary.json'));
for (const [field, expected] of Object.entries({ deliveryId, changeId, runId })) assert.equal(summary[field], expected);
assert.equal(summary.focusedTestsExitCode, 0);
assert.equal(summary.observations.length, 3);
const testOutput = await readFile(path.join(proof, 'attempt-01/focused-tests.stdout.txt'), 'utf8');
assert.match(testOutput, /# tests 59\r?\n/);
assert.match(testOutput, /# pass 59\r?\n/);
assert.match(testOutput, /# fail 0\r?\n/);
assert.match(testOutput, /# skipped 0\r?\n/);
const inputSet = await readJson(path.join(proof, 'attempt-01/source-inputs.json'));
for (const input of inputSet.inputs) assert.equal(digest(await readFile(input.path)), input.sha256);
const ordinals = await readJson(path.join(proof, 'attempt-01/ordinal-inputs.json'));
assert.equal(Math.max(...ordinals.filter(x => x.changeId !== changeId).map(x => x.ordinal)) + 1, 33);

exec('git', ['diff', '--check']);
const changed = exec('git', ['diff', '--name-only', 'HEAD']).toString().trim().split(/\r?\n/).filter(Boolean);
assert.deepEqual(changed, [manifestPath]);
const allowed = [manifestPath, `openspec/changes/${changeId}/`, `${run}/`, `${relative(proof)}/`];
const status = exec('git', ['status', '--porcelain=v1', '--untracked-files=all']).toString();
for (const line of status.split(/\r?\n/).filter(Boolean)) {
  const file = line.slice(3);
  assert.ok(allowed.some(prefix => prefix.endsWith('/') ? file.startsWith(prefix) : file === prefix), `Unexpected worktree change: ${file}`);
}
const historical = [
  'openspec/delivery-groups/20260902-04-delivery-continuity-stable-core-closure.yaml',
  '.flowkit/runs/20260902-04-delivery-continuity-stable-core-closure/007-correct-delivery-content-continuity/20260907-086-archive/result.json',
];
const historicalReadback = [];
for (const file of historical) {
  const bytes = await readFile(file);
  assert.ok(bytes.equals(exec('git', ['show', `HEAD:${file}`])));
  if (file.endsWith('.json')) JSON.parse(bytes.toString()); else parse(bytes.toString());
  historicalReadback.push({ path: file, sha256: digest(bytes), bytes: bytes.length, unchangedFromHead: true });
}
const openspec = JSON.parse(exec(process.execPath, [
  'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js', 'status', '--change', changeId, '--json',
]).toString());
assert.equal(openspec.changeName, changeId);
assert.equal(openspec.isPlanningComplete, false);
assert.ok(openspec.artifacts.every(x => x.status !== 'done'));
assert.deepEqual((await readdir(`openspec/changes/${changeId}`)).sort(), ['.openspec.yaml', 'explore.md']);
assert.deepEqual((await readdir(run)).sort(), ['action.md', 'context.json']);

async function filesUnder(dir) {
  const files = [];
  for (const name of (await readdir(dir)).sort()) {
    const file = path.join(dir, name);
    const stat = await lstat(file);
    assert.equal(stat.isSymbolicLink(), false);
    if (stat.isDirectory()) files.push(...await filesUnder(file));
    else { assert.ok(stat.isFile()); files.push(file); }
  }
  return files;
}
const material = await filesUnder(proof);
material.push(path.resolve(manifestPath), path.resolve(explorePath), path.resolve(`${run}/action.md`), path.resolve(`${run}/context.json`), path.resolve(`openspec/changes/${changeId}/.openspec.yaml`));
const artifacts = [];
for (const file of material) {
  const bytes = await readFile(file);
  if (file.endsWith('.md')) {
    assert.equal(/[\t ]+\r?$/m.test(bytes.toString()), false, file);
    assert.ok(bytes.toString().endsWith('\n'), file);
  }
  artifacts.push({ path: relative(file), bytes: bytes.length, sha256: digest(bytes) });
}
const audit = {
  kind: 'independent-bootstrap-explore-handoff-readback', projectId: 'flowkit-next', deliveryId, changeId, runId,
  executedAt: new Date().toISOString(), artifacts, historicalReadback,
  historicalReadbackLimit: 'Byte equality and JSON/YAML parsing only, not new product historical-reader acceptance.',
  checks: { onlyFirstChangeActive: true, uniqueOrdinalNext33: true, sourceInputsUnchanged: true,
    onlyScopedWorktreeChanges: true, gitDiffCheck: true, noProposalArtifacts: true,
    proofFilesRegularReadable: true, noTmpOnlyReferences: true, focusedTests: '59/59; 0 skipped' },
  openspecStatus: openspec,
  authorityLimit: 'Local integrity/readback, not candidate admission or independent Reviewer approval.',
};
const auditBytes = json(audit);
await writeFile(path.join(proof, 'handoff-audit.json'), auditBytes, { flag: 'wx' });
const result = {
  kind: 'external-orchestrator-explore-result', canonicalFlowkitRuntimeRun: false,
  deliveryId, changeId, runId, action: 'explore', role: 'author', status: 'terminal',
  verdict: 'PASS', verdictMeaning: 'Author bounded Explore completed; no implementation acceptance or Review approval claimed.',
  projectOrdinal: 33, previousRunId: null,
  summary: '三个真实有界反例确认 doctor、Start 与共享证据的 Archify 强制依赖；59/59 现行定向测试通过。退役需覆盖 operation、工具、Final/共享证据/协调/Integration 直接消费者，不扩大至其余五个 Change。',
  exploreArtifact: explorePath,
  proofRoot: relative(proof), proofSummary: `${relative(proof)}/attempt-01/summary.json`,
  handoffAudit: { path: `${relative(proof)}/handoff-audit.json`, sha256: digest(auditBytes) },
  ownerActivationRef: context.ownerActivationRef,
  retention: context.retention,
  nextBoundary: 'review-explore', reviewerVerdict: null,
  proposalAllowed: false, applyAllowed: false, gitMutationAllowed: false,
  formalFullTestExecuted: false, productionMutation: false,
  blockingUnknown: null,
  limitations: summary.observations.map(x => x.limitation),
  completedAt: new Date().toISOString(), stop: true,
};
await writeFile(`${run}/result.json`, json(result), { flag: 'wx' });
const persisted = await readJson(`${run}/result.json`);
assert.equal(persisted.handoffAudit.sha256, digest(await readFile(path.join(proof, 'handoff-audit.json'))));
assert.deepEqual((await readdir(run)).sort(), ['action.md', 'context.json', 'result.json']);
console.log(json({ runId, verdict: persisted.verdict, nextBoundary: persisted.nextBoundary, proofFiles: artifacts.length, tests: '59/59', stop: true }));
