import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

const repo = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const deliveryId = '20260908-05-lightweight-workflow-management';
const changeId = 'connect-openspec-action-workflow';
const runId = '20260908-015-explore';
const run = `.flowkit/runs/${deliveryId}/${changeId}/${runId}`;
const manifestPath = `openspec/delivery-groups/${deliveryId}.yaml`;
const explorePath = `openspec/changes/${changeId}/explore.md`;
const hash = b => createHash('sha256').update(b).digest('hex');
const relative = p => path.relative(repo, path.resolve(p)).split(path.sep).join('/');
const read = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const ref = async p => { const b = await fs.readFile(p); return { path: relative(p), bytes: b.length, sha256: hash(b) }; };
const write = (p, value) => fs.writeFile(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const manifest = YAML.parse(await fs.readFile(manifestPath, 'utf8'));
assert.deepEqual(manifest.changes.filter(c => c.state === 'active').map(c => c.id), [changeId]);
assert.equal(manifest.changes.find(c => c.id === changeId).projectOrdinal, 35);
assert.equal(manifest.changes.find(c => c.id === 'separate-manager-assets-from-target-project').state, 'completed');
const context = await read(run + '/context.json');
assert.ok(manifest.ownerDecisions.some(d => d.ref === context.ownerActivationRef && d.changeId === changeId && d.scope[0] === 'explore'));
const summary = await read(path.join(proof, 'attempt-02/summary.json'));
assert.equal(summary.status, 'PASS');
for (const r of summary.sourceRefs) assert.deepEqual(await ref(r.path), r);
assert.equal((await read(path.join(proof, 'host-summary.json'))).status, 'PASS');
assert.equal((await read(path.join(proof, 'continuity-summary.json'))).status, 'PASS');
const tests = await fs.readFile(path.join(proof, 'attempt-02/existing-focused-tests.stdout.txt'), 'utf8');
assert.match(tests, /# pass 30\r?\n/);
assert.match(tests, /# fail 0\r?\n/);
assert.match(tests, /# skipped 0\r?\n/);
const dependencyPath = `.flowkit/runs/${deliveryId}/separate-manager-assets-from-target-project/20260908-014-archive/result.json`;
const dependency = await read(dependencyPath);
assert.equal(dependency.verdict, 'PASS');
assert.deepEqual(await ref(dependency.reviewSource.path), dependency.reviewSource);
assert.equal((await read(dependency.reviewSource.path)).verdict, 'approved');
const git = args => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.error?.message);
  return r.stdout.trim();
};
// This is a read-back of this invocation's mutation boundary, not a new Git gate.
assert.equal(git(['diff', '--name-only']), manifestPath);
assert.equal(git(['diff', '--cached', '--name-only']), '');
git(['diff', '--check']);
const proofRefs = [];
async function walk(dir) {
  for (const e of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else { assert.ok(e.isFile()); proofRefs.push(await ref(p)); }
  }
}
await walk(proof);
const auditPath = path.join(proof, 'handoff.json');
await write(auditPath, { kind: 'bootstrap-explore-handoff', status: 'PASS', verifiedAt: new Date().toISOString(),
  proofRefs, explore: await ref(explorePath), manifest: await ref(manifestPath),
  dependency: await ref(dependencyPath), action: await ref(run + '/action.md'), context: await ref(run + '/context.json'),
  sourceInputsUnchanged: true, repositoryIndexUnchanged: true, testResult: { pass: 30, fail: 0, skipped: 0 },
  meaning: '本次真实 Explore 及材料读回，不是独立 Review、新实现验收或 Full Test' });
await write(run + '/result.json', {
  kind: 'external-orchestrator-explore-result', canonicalFlowkitRuntimeRun: false, executionMode: 'independent-bootstrap',
  role: 'author', action: 'explore', deliveryId, changeId, runId, runNumber: 15,
  projectOrdinal: 35, previousRunId: null, dependencyRun: context.dependencyRun,
  status: 'terminal', verdict: 'PASS',
  verdictMeaning: 'Author bounded Explore completed; no Reviewer approval or new implementation acceptance',
  summary: '已复现逐 Change attributes 耦合；隔离通用规则保留 4/4 原始流且源码检查仍生效；实际单进程宿主交接、7 项拓扑反例及必要材料文件反例成立，30 项既有定向测试通过。',
  explore: await ref(explorePath), proofSummary: await ref(path.join(proof, 'attempt-02/summary.json')),
  handoff: await ref(auditPath), ownerActivationRef: context.ownerActivationRef,
  reviewerVerdict: null, implementationVerificationVerdict: null, nextBoundary: 'review-explore',
  productionMutation: false, skillMutation: false, repositoryGitMutation: false,
  isolatedFixtureGitMutation: true, formalFullTestExecuted: false,
  limitations: ['Windows 实验，未执行 Linux', '宿主仅真实传输可行性，不是两个 Changes/独立 Review/revise 产品验收',
    '拓扑与证据实验不是产品 resolver/admission；Propose 固定精确命令与失败写入顺序'],
  blockingUnknown: null, proposalAllowed: false, applyAllowed: false, completedAt: new Date().toISOString(), stop: true,
});
assert.deepEqual((await fs.readdir(run)).sort(), ['action.md', 'context.json', 'result.json']);
console.log(JSON.stringify({ runId, verdict: 'PASS', proofFiles: proofRefs.length, nextBoundary: 'review-explore', stop: true }));
