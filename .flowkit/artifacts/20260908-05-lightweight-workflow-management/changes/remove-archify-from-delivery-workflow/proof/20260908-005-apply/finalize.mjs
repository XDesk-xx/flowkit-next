// Per-invocation bootstrap verification/readback; not product lifecycle authority.
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const proof = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-005-apply";
const run = '.flowkit/runs/20260908-05-lightweight-workflow-management/remove-archify-from-delivery-workflow/20260908-005-apply';
const review = run.replace('005-apply', '004-review-propose');
const change = 'openspec/changes/remove-archify-from-delivery-workflow';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async p => JSON.parse(await readFile(p, 'utf8'));
const ref = async p => { const bytes = await readFile(p); return { path:p, bytes:bytes.length, sha256:digest(bytes) }; };
const git = (...args) => execFileSync('git', args, { encoding:'utf8', windowsHide:true }).trim();
assert.equal(git('rev-parse','HEAD'), '97bcd2f99dcf6946b646fb1759b2e64584007c30');
assert.equal(git('branch','--show-current'), 'delivery/20260908-05-lightweight-workflow-management');
assert.equal((await ref(review+'/result.json')).sha256, 'b84083459fbb10cc69eca86ad59aa4cd1ba9964b4f11de905e778fa9316fa56b');
const reviewed = await json(review+'/context.json');
for (const artifact of reviewed.reviewedArtifacts) {
  if (artifact.path.endsWith('/tasks.md')) continue;
  assert.equal((await ref(artifact.path)).sha256, artifact.sha256, artifact.path);
}
const tasks = await readFile(change+'/tasks.md','utf8');
assert.equal((tasks.match(/^- \[x\] /gm)??[]).length, 16);
assert.equal((tasks.match(/^- \[ \] /gm)??[]).length, 0);
const checks = [];
for (const label of ['windows-final-01','linux-final-01']) {
  const dir = proof+'/'+label;
  const result = await json(dir+'/result.json');
  const stdout = await readFile(dir+'/stdout.txt');
  const stderr = await readFile(dir+'/stderr.txt');
  assert.equal(result.exitCode,0,label);
  assert.equal(result.error,null,label);
  assert.equal(result.signal,null,label);
  assert.equal(digest(stdout), result.stdoutSha256,label);
  assert.equal(digest(stderr), result.stderrSha256,label);
  const output = stdout.toString();
  assert.ok(output.includes('# tests 259'),label);
  assert.ok(output.includes('# tests 5'),label);
  assert.ok(!/^not ok/m.test(output),label);
  assert.ok([...output.matchAll(/^# fail (\d+)$/gm)].every(match=>match[1]==='0'),label);
  assert.ok([...output.matchAll(/^# skipped (\d+)$/gm)].every(match=>match[1]==='0'),label);
  if (label.startsWith('linux')) {
    assert.ok(output.includes('source-copy-bytes: PASS'));
    assert.ok(output.includes('"installedResolvedLockEqualsSource":true'));
    assert.ok(output.includes('uid=1000(node)'));
    assert.ok(output.includes('glibc 2.36'));
    assert.ok(output.startsWith('{}'));
  }
  checks.push({label, ...result, artifacts:await Promise.all(['result.json','stdout.txt','stderr.txt'].map(name=>ref(dir+'/'+name)))});
}
async function files(root) {
  const result=[];
  for (const entry of await readdir(root,{withFileTypes:true})) {
    const p=root+'/'+entry.name;
    if(entry.isDirectory()) result.push(...await files(p)); else result.push(p);
  }
  return result.sort();
}
const production = await files('src');
const lineCounts = await Promise.all(production.filter(p=>p.endsWith('.ts')).map(async p=>{
  const text=await readFile(p,'utf8'); const lines=text.split('\n').length-(text.endsWith('\n')?1:0);
  assert.ok(lines<=650,p+': '+lines);
  assert.ok(!/archify|delivery-architecture-finalization/i.test(text),p);
  return {path:p,lines};
}));
const deleted=["src/domain/delivery-architecture-finalization-execution.ts","src/domain/delivery-architecture-finalization-identity.ts","src/domain/delivery-architecture-finalization-operation.ts","src/internal/delivery-architecture-finalization-archify.ts","src/internal/delivery-architecture-finalization-artifacts.ts","src/internal/delivery-architecture-finalization-closure.ts","tests/unit/domain/delivery-architecture-finalization-execution.test.ts","skills/delivery/architecture-finalization/SKILL.md","skills/tools/archify/SKILL.md","skills/vendors/archify/LICENSE","skills/vendors/archify/UPSTREAM-SKILL.md","skills/vendors/archify/UPSTREAM.json","skills/vendors/archify/references/authoring-contract.md","skills/vendors/archify/references/brand-marks.md","skills/vendors/archify/references/delivery-contract.md","skills/vendors/archify/references/viewer-runtime.md"];
for (const p of deleted) await assert.rejects(access(p),{code:'ENOENT'});
const changed=git('diff','--name-only','HEAD').split('\n').filter(Boolean);
assert.ok(!changed.some(p=>p.startsWith('architecture/')||p.startsWith('openspec/specs/')||p.startsWith('openspec/changes/archive/')||p.startsWith('.flowkit/runs/')));
const preexisting='openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml';
const authorFiles=changed.filter(p=>p!==preexisting&&!deleted.includes(p)).concat([
 'tests/unit/domain/delivery-without-archify.test.ts',
 'tests/fixtures/delivery/legacy-architecture-package.json',
 change+'/tasks.md',
]);
const artifacts=await Promise.all(authorFiles.map(ref));
const scopeRefs=await Promise.all([...await files('src'),...await files('tests'),...await files('skills'),...await files('config'),...await files('.agents/skills')].map(ref));
const summary={
 kind:'bootstrap-apply-verification-summary',runId:'20260908-005-apply',createdAt:new Date().toISOString(),
 authorVerification:'PASS', formalFullTest:false, reviewerVerdict:null,
 checks, sourceScopeSha256:digest(JSON.stringify(scopeRefs)), sourceScope:scopeRefs,
 sourceLineGate:{limit:650,maximum:Math.max(...lineCounts.map(entry=>entry.lines)),files:lineCounts},
 authorArtifacts:artifacts, deletedTrackedArtifacts:deleted,
 priorRunResult:await ref(review+'/result.json'),
 unchangedApprovedPlanning:true, trackedHistoryUnchanged:true, gitMutation:false,
 preexistingManifestExcludedFromAuthorEdits:preexisting,
 implementationReport:await ref(proof+'/implementation.md'),
 excludedAttempts:['focused-01: sandbox EPERM','focused-02: obsolete golden vector','windows-regression-01: command escaping error; not PASS','windows-regression-02: obsolete singleton fixture assumptions','continuity-01: obsolete sparse-array index'],
 limits:['OpenSpec and remote in end-to-end unit fixture are simulated; checks and isolated Git are real','Linux uses isolated installed exact-lock dependencies; external Archify is not mounted','Apply verification is not Formal Full Test or Reviewer approval'],
};
await writeFile(proof+'/summary.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
const context=await json(run+'/context.json');
assert.equal(context.previousRunId,'20260908-004-review-propose');
const result={
 kind:'external-orchestrator-apply-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',
 role:'author',action:'apply',deliveryId:context.deliveryId,changeId:context.changeId,
 runId:context.runId,runNumber:5,projectOrdinal:33,previousRunId:context.previousRunId,
 status:'terminal',authorConclusion:'PASS',reviewerVerdict:null,verificationVerdict:null,
 taskProgress:{complete:16,total:16},nextBoundary:'review-apply',stop:true,
 verification:await ref(proof+'/summary.json'),
 artifactHashes:{actionSha256:(await ref(run+'/action.md')).sha256,contextSha256:(await ref(run+'/context.json')).sha256},
 changedArtifacts:artifacts,deletedArtifacts:deleted,
 gitMutationExecuted:false,formalFullTestExecuted:false,continuationExecuted:false,
 handoff:'独立 review-apply 审查当前未提交工作树；不自动 Git/Archive。必要证据在项目 .flowkit/artifacts；历史 Explore 不是当前实现 PASS。后续 archive/spec-sync 按已批准 design 更新两处 Purpose。',
};
await writeFile(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
assert.deepEqual((await readdir(run)).sort(),['action.md','context.json','result.json']);
assert.deepEqual(await json(run+'/result.json'),result);
console.log(JSON.stringify({run:context.runId,summary:await ref(proof+'/summary.json'),result:await ref(run+'/result.json'),tasks:'16/16',sourceMaxLines:summary.sourceLineGate.maximum,nextBoundary:'review-apply',stop:true},null,2));
