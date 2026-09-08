import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
const delivery='20260908-05-lightweight-workflow-management';
const change='separate-manager-assets-from-target-project';
const runId='20260908-014-archive';
const run='.flowkit/runs/'+delivery+'/'+change+'/'+runId;
const proof='.flowkit/artifacts/'+delivery+'/changes/'+change+'/proof/'+runId;
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const ref=async p=>{const b=await fs.readFile(p);return {path:p,bytes:b.length,sha256:sha(b)};};
const refText=(p,s)=>({path:p,bytes:Buffer.byteLength(s),sha256:sha(s)});
const pre=await read(proof+'/prepare-01/stdout.txt');
assert.deepEqual(await ref(pre.review.path),pre.review);
const convergence=await read(proof+'/dry-convergence-02/stdout.txt');
assert.equal(convergence.convergence,'PASS');
const canonical=[];
for(const c of convergence.capabilities){
 const p='openspec/specs/'+c.capability+'/spec.md';
 const r=await ref(p);assert.equal(r.sha256,c.sha256);
 assert.deepEqual(await fs.readFile(p),await fs.readFile('.tmp/archive-014-converged/'+p));
 canonical.push({...c,artifact:r});
}
for(const move of convergence.moves){
 await assert.rejects(fs.access(move.from));
 const current=await ref(move.to);
 assert.equal(current.bytes,move.bytes);assert.equal(current.sha256,move.sha256);
}
await assert.rejects(fs.access('openspec/changes/'+change));
const manifestPath=pre.manifest.path;
const bytes=await fs.readFile(manifestPath);
assert.deepEqual(bytes,await fs.readFile('.tmp/archive-014-converged/'+manifestPath));
const body=bytes.toString('utf8');
const start=body.indexOf('  - id: "'+change+'"'),end=body.indexOf('\n  - id:',start+1);
const entry=body.slice(start,end);
assert.ok(entry.includes('    state: completed'));
const original=body.slice(0,start)+entry.replace('    state: completed','    state: active')+body.slice(end);
assert.equal(sha(original),pre.manifest.sha256);
const manifest=parse(body);
assert.equal(manifest.changes.find(c=>c.id===change).projectOrdinal,34);
assert.equal(manifest.changes.filter(c=>c.state==='planned').length,4);
const currentFiles=[];
const candidate=await read(pre.candidateInventory.path);
for(const file of candidate.files){
 if(file.path===manifestPath)continue;
 const move=convergence.moves.find(m=>m.from===file.path);
 const r=await ref(move?.to??file.path);
 assert.equal(r.sha256,file.sha256);assert.equal(r.bytes,file.bytes);
 currentFiles.push(r);
}
const checks=[];
for(const label of ['prepare-01','dry-specs-01','dry-domain-01','dry-typecheck-01','dry-format-01','dry-lint-01','dry-convergence-02','real-specs-01','real-list-01','diff-check-01']){
 const directory=proof+'/'+label;
 const record=await read(directory+'/result.json');
 assert.equal(record.exitCode,0,label);assert.equal(record.error,null,label);
 checks.push({label,...record,result:await ref(directory+'/result.json'),stdout:await ref(directory+'/stdout.txt'),stderr:await ref(directory+'/stderr.txt')});
}
const domain=await fs.readFile(proof+'/dry-domain-01/stdout.txt','utf8');
assert.match(domain,/# tests 262[\s\S]*# pass 262[\s\S]*# fail 0/);
const list=await read(proof+'/real-list-01/stdout.txt');
assert.equal(list.changes.length,0);
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(head,pre.head);
const completedAt=new Date().toISOString();
const summaryPath=proof+'/summary.json';
const summary={
 kind:'bootstrap-archive-completion-evidence',deliveryId:delivery,changeId:change,runId,completedAt,conclusion:'PASS',
 sourceHead:head,reviewSource:pre.review,projectOrdinal:34,archiveTarget:pre.archiveTarget,
 sync:{modified:8,added:2,purposeClarification:'managed-toolchain-resolution 按已批准 design 明确 manager-owned installed contract',canonical},
 moves:convergence.moves,manifest:await ref(manifestPath),onlyCurrentChangeCompleted:true,otherChangesNotActivated:true,
 checks,currentContinuationFiles:currentFiles,
 evidenceMeaning:'隔离合并/模拟归档的规范与 manifest 字节和正式结果一致；262 domain、typecheck/format/lint 与 strict 验证属于 Archive preparation，不是 Formal Full Test。',
 preservation:'所有旧 Run/Review 与实现文件保持原样；旧材料中的活动 Change 路径使用 moves 显式映射到当前 archive，不回写历史引用。',
 environmentNote:'Node/Git 子进程 sandbox EPERM 在沙箱外重试；dry-convergence-01 原始失败日志保留，适用结果为 dry-convergence-02。',
 scopeDrift:'NONE',productionMutation:false,gitMutationExecuted:false,formalFullTestExecuted:false,nextBoundary:'checkpoint',stop:true
};
const summaryText=JSON.stringify(summary,null,2)+'\n';
const result={
 kind:'external-orchestrator-archive-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',
 role:'author',action:'archive',deliveryId:delivery,changeId:change,runId,runNumber:14,projectOrdinal:34,
 previousRunId:'20260908-013-review-apply',status:'terminal',verdict:'PASS',
 verdictMeaning:'真实 Archive/spec sync/completion 已执行并读回；不产生 checkpoint Git 权限或 Delivery 完成。',
 summary:'5 个 canonical specs 同步完成（8 modified + 2 added），ordinal 34 的 Change 原字节归档，当前 Change completed；其余四个 Change 保持 planned。',
 archiveTarget:pre.archiveTarget,reviewSource:pre.review,evidence:refText(summaryPath,summaryText),
 runArtifacts:{action:await ref(run+'/action.md'),context:await ref(run+'/context.json')},
 nextBoundary:'checkpoint',reviewerVerdict:null,archiveExecuted:true,specSyncExecuted:true,
 productionMutation:false,formalFullTestExecuted:false,gitMutationExecuted:false,completedAt,stop:true
};
let patch='*** Begin Patch\n';
for(const [file,text] of [[summaryPath,summaryText],[run+'/result.json',JSON.stringify(result,null,2)+'\n']]){
 await assert.rejects(fs.access(file));
 patch+='*** Add File: '+file+'\n'+text.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n';
}
console.log(patch+'*** End Patch');
