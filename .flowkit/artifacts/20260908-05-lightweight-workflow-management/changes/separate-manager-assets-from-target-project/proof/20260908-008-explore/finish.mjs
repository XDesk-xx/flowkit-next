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
const changeId = 'separate-manager-assets-from-target-project';
const runId = '20260908-008-explore';
const runRoot = `.flowkit/runs/${deliveryId}/${changeId}/${runId}`;
const explorePath = `openspec/changes/${changeId}/explore.md`;
const hash = b => createHash('sha256').update(b).digest('hex');
const read = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const relative = p => path.relative(repo, p).split(path.sep).join('/');
const ref = async p => {
  const b = await fs.readFile(p);
  return { path: relative(path.resolve(p)), bytes: b.length, sha256: hash(b) };
};
const write = async (p, j) => fs.writeFile(p, JSON.stringify(j, null, 2) + '\n', { flag: 'wx' });
const git = args => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.error?.message);
  return r.stdout.trim();
};
const manifestPath = `openspec/delivery-groups/${deliveryId}.yaml`;
const manifest = YAML.parse(await fs.readFile(manifestPath, 'utf8'));
assert.deepEqual(manifest.changes.filter(c => c.state === 'active').map(c => c.id), [changeId]);
assert.equal(manifest.changes.find(c => c.id === changeId).projectOrdinal, 34);
const summary = await read(path.join(proof, 'attempt-01/summary.json'));
assert.equal(summary.status, 'PASS');
for (const r of summary.sourceRefs) assert.deepEqual(await ref(r.path), r);
const tests = await fs.readFile(path.join(proof, 'attempt-01/focused-tests.stdout.txt'), 'utf8');
assert.match(tests, /# pass 26\r?\n/);
assert.match(tests, /# fail 0\r?\n/);
assert.match(tests, /# skipped 0\r?\n/);
assert.equal(git(['rev-parse', 'HEAD']), '01d82dba4593ea0c5b85ac67da03e6261dccfba6');
assert.equal(git(['diff', '--name-only']), manifestPath);
assert.equal(git(['diff', '--cached', '--name-only']), '');
git(['diff', '--check']);
const proofRefs = [];
async function walk(dir) {
  for (const e of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.isFile()) proofRefs.push(await ref(p));
    else throw Error('unexpected proof entry ' + p);
  }
}
await walk(proof);
const auditPath = path.join(proof, 'handoff.json');
await write(auditPath, {
  kind: 'bootstrap-explore-handoff', verifiedAt: new Date().toISOString(),
  status: 'PASS', proofRefs, explore: await ref(explorePath),
  manifest: await ref(manifestPath),
  action: await ref(`${runRoot}/action.md`), context: await ref(`${runRoot}/context.json`),
  sourceInputsUnchanged: true, trackedDiffOnlyActivationManifest: true,
  testResult: { pass: 26, fail: 0, skipped: 0 },
  meaning: '本次实验与交接材料核对，不是独立 Review 或新产品实现验收',
});
const result = {
  kind: 'external-orchestrator-explore-result', canonicalFlowkitRuntimeRun: false,
  executionMode: 'independent-bootstrap', deliveryId, changeId, runId,
  action: 'explore', role: 'author', status: 'terminal', verdict: 'PASS',
  verdictMeaning: 'Author bounded Explore completed; not Reviewer approval or implementation acceptance',
  projectOrdinal: 34, previousRunId: null,
  dependencyRun: 'remove-archify-from-delivery-workflow/20260908-007-archive',
  summary: '已复现 target lock/Guidance 耦合及同名冲突；真实 OpenSpec 分根组合、资产移位、缺 runtime 诊断成立；现行 26 项定向测试通过。',
  exploreArtifact: explorePath, proofRoot: relative(proof),
  proofSummary: await ref(path.join(proof, 'attempt-01/summary.json')),
  handoffAudit: await ref(auditPath),
  ownerActivationRef: 'owner:470db16c7d253d2f9a0342b49690106c2556434026b81490b918f08db52a90c9',
  retention: '必要 proof 保留本项目 .flowkit/artifacts；原始日志不套源码格式规则；不改写历史材料',
  reviewerVerdict: null, nextBoundary: 'review-explore',
  proposalAllowed: false, applyAllowed: false, gitMutationAllowed: false,
  formalFullTestExecuted: false, productionMutation: false, blockingUnknown: null,
  limitations: summary.limitations, completedAt: new Date().toISOString(), stop: true,
};
await write(`${runRoot}/result.json`, result);
assert.deepEqual((await fs.readdir(runRoot)).sort(), ['action.md', 'context.json', 'result.json']);
assert.equal((await read(`${runRoot}/result.json`)).nextBoundary, 'review-explore');
console.log(JSON.stringify({ runId, verdict: 'PASS', proofFiles: proofRefs.length, nextBoundary: 'review-explore', stop: true }));
