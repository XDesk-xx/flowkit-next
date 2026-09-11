import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parse} from 'yaml';
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-007-archive",run=".flowkit/runs/20260908-05-lightweight-workflow-management/remove-archify-from-delivery-workflow/20260908-007-archive";
const hash=b=>createHash('sha256').update(b).digest('hex');
const ref=async p=>{const b=await readFile(p);return {path:p,bytes:b.length,sha256:hash(b)}};
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const plan=await json(proof+'/convergence.json');
assert.equal((await ref(plan.review.path)).sha256,plan.review.sha256);
for(const r of plan.sourceScope)assert.equal((await ref(r.path)).sha256,r.sha256,r.path);
const specs=[];
for(const s of plan.specs){const current=await ref(s.before.path);assert.equal(current.sha256,s.converged.sha256);specs.push({...current,operations:s.operations});}
const manifest=await ref(plan.manifest.path);
assert.equal(manifest.sha256,plan.manifestAfter.sha256);
const doc=parse(await readFile(manifest.path,'utf8'));
const target=doc.changes.find(c=>c.id===plan.change);
assert.equal(target.state,'completed');assert.equal(target.projectOrdinal,33);
assert.ok(doc.changes.filter(c=>c.id!==plan.change).every(c=>c.state==='planned'));
assert.equal(doc.delivery.state,'active');
await assert.rejects(access('openspec/changes/'+plan.change),{code:'ENOENT'});
const moved=[];
for(const original of plan.changeFiles){
 const destination=plan.target+original.path.slice(('openspec/changes/'+plan.change).length);
 const actual=await ref(destination);assert.equal(actual.sha256,original.sha256);
 moved.push({from:original.path,to:destination,bytes:actual.bytes,sha256:actual.sha256});
}
const checks=[];
for(const label of ['converged-02','post-archive-01']){
 const dir=proof+'/'+label,result=await json(dir+'/result.json');
 assert.equal(result.exitCode,0);assert.equal(result.error,null);
 for(const stream of ['stdout','stderr'])assert.equal(hash(await readFile(dir+'/'+stream+'.txt')),result[stream+'Sha256']);
 checks.push({label,result:await ref(dir+'/result.json'),stdout:await ref(dir+'/stdout.txt'),stderr:await ref(dir+'/stderr.txt')});
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
assert.equal(git('rev-parse','HEAD'),'97bcd2f99dcf6946b646fb1759b2e64584007c30');
assert.equal(git('branch','--show-current'),'delivery/20260908-05-lightweight-workflow-management');
git('diff','--check','HEAD');
const summary={kind:'bootstrap-archive-verification',runId:'20260908-007-archive',createdAt:new Date().toISOString(),status:'PASS',review:plan.review,specs,moved,manifest,checks,convergencePlan:await ref(proof+'/convergence.json'),sourceUnchangedSinceReview:true,actualCanonicalBytesEqualTestedDryRun:true,taskProgress:'16/16',domainTests:259,domainFailed:0,domainSkipped:0,specsStrictPassed:22,gitMutation:false,formalFullTest:false,linuxReexecuted:false,scope:'规范/manifest/目录移动；未修改生产、测试、已归档历史或旧 Run。',environment:'converged-01 pnpm 联接目录安全保护失败；未关闭保护，converged-02 对相同 bytes 使用已安装直接工具入口通过相同检查。',distObservation:'006 的旧 ignored dist 仅为非阻断缓存观察；本轮干净 outDir 构建，未清理或发布混合 dist。'};
await writeFile(proof+'/summary.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
const ctx=await json(run+'/context.json');
const result={kind:'external-orchestrator-archive-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'archive',deliveryId:ctx.deliveryId,changeId:ctx.changeId,runId:ctx.runId,runNumber:7,projectOrdinal:33,previousRunId:ctx.previousRunId,status:'terminal',executionStatus:'completed',authorConclusion:'PASS',reviewerVerdict:null,verificationVerdict:null,archivePath:plan.target,coordinationState:'completed',specSync:{capabilities:6,added:4,modified:14,removed:9,operations:27,purposeUpdates:['architecture-and-canonical-diagram-continuity','managed-toolchain-resolution']},evidence:await ref(proof+'/summary.json'),runArtifacts:{action:await ref(run+'/action.md'),context:await ref(run+'/context.json')},handoff:{moved,priorReview:plan.review,uncommittedAncestors:'当前工作树及005/006证据；旧Change路径按本Run moved映射读取，原bytes未变。'},nextBoundary:'checkpoint',checkpointAuthorized:false,gitMutationExecuted:false,formalFullTestExecuted:false,nextChangeActivated:false,stop:true};
await writeFile(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
assert.deepEqual((await readdir(run)).sort(),['action.md','context.json','result.json']);
assert.deepEqual(await json(run+'/result.json'),result);
console.log(JSON.stringify({archivePath:plan.target,run:await ref(run+'/result.json'),verification:await ref(proof+'/summary.json'),nextBoundary:'checkpoint',checkpointAuthorized:false,stop:true},null,2));
