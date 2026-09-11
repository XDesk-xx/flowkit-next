import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from 'yaml';
const delivery='20260908-05-lightweight-workflow-management', change='invoke-git-at-workflow-boundaries';
const runId='20260911-062-archive', group='.flowkit/runs/'+delivery+'/006-'+change;
const proof='.flowkit/artifacts/'+delivery+'/changes/'+change+'/proof/'+runId;
const root='openspec/changes/'+change, archive='openspec/changes/archive/2026-09-11-038-'+change;
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const ref=async p=>{const b=await fs.readFile(p);return {path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};};
const verify=async r=>assert.deepEqual(await ref(r.path),{path:r.path,bytes:r.bytes,sha256:r.sha256});
const reviewPath=group+'/20260911-061-review-apply/result.json', review=await json(reviewPath);
assert.equal(review.verdict,'approved');assert.equal(review.nextBoundary,'archive');assert.equal(review.findings.length,0);
await verify(review.reviewedResult);await verify(review.reviewedPayload);await verify(review.reviewReport);
const payload=await json(review.reviewedPayload.path);await verify(payload.ancestorPayload);
const ancestor=await json(payload.ancestorPayload.path);
const files=[...new Map([...ancestor.files,...payload.files].map(r=>[r.path,r])).values()];
for(const r of files)await verify(r);
const ordinals=new Map();
for(const f of await fs.readdir('openspec/delivery-groups'))if(f.endsWith('.yaml')){
 const m=parse(await fs.readFile('openspec/delivery-groups/'+f,'utf8'));
 for(const c of m.changes??[])if(c.projectOrdinal!==undefined){assert(Number.isInteger(c.projectOrdinal)&&c.projectOrdinal>0);assert(!ordinals.has(c.projectOrdinal));ordinals.set(c.projectOrdinal,c.id);}
}
assert.equal(ordinals.get(38),change);
const manifestPath='openspec/delivery-groups/'+delivery+'.yaml';
const m=parse(await fs.readFile(manifestPath,'utf8')), selected=m.changes.filter(c=>c.id===change);
assert.equal(selected.length,1);assert.equal(selected[0].state,'active');assert.equal(selected[0].projectOrdinal,38);
await assert.rejects(fs.stat(archive),{code:'ENOENT'});
await assert.rejects(fs.stat(group+'/'+runId),{code:'ENOENT'});
assert(!/- \[ \]/.test(await fs.readFile(root+'/tasks.md','utf8')));
const blocks=t=>[...t.matchAll(/^### Requirement: .+$(?:\n(?!### Requirement: |## (?:ADDED|MODIFIED) Requirements)[^\n]*)*/gm)].map(m=>m[0].trimEnd());
const caps=['delivery-operation-execution-and-start-continuity','repository-integration-and-next-base-continuity'];
let patch='*** Begin Patch\n';const canonicalBefore=[],converged=[];
for(const cap of caps){
 const mainPath='openspec/specs/'+cap+'/spec.md',main=(await fs.readFile(mainPath,'utf8')).replaceAll('\r\n','\n');
 const delta=(await fs.readFile(root+'/specs/'+cap+'/spec.md','utf8')).replaceAll('\r\n','\n');
 assert(!/^## (REMOVED|RENAMED)/m.test(delta));
 let merged=main;const db=blocks(delta);
 for(const b of db){
  const old=blocks(merged).find(x=>x.split('\n')[0]===b.split('\n')[0]);
  if(old){for(const s of old.matchAll(/^#### Scenario: .+$/gm))assert(b.includes(s[0]),'missing surviving scenario');merged=merged.replace(old,b);}
  else merged=merged.trimEnd()+'\n\n'+b+'\n';
 }
 merged=merged.trimEnd()+'\n';
 assert.equal(merged.split('### Requirement:')[0],main.split('### Requirement:')[0]);
 for(const b of db)assert(merged.includes(b));
 for(const b of blocks(main))if(!db.some(d=>d.split('\n')[0]===b.split('\n')[0]))assert(merged.includes(b));
 const dest=proof+'/converged-specs/'+cap+'/spec.md';
 canonicalBefore.push(await ref(mainPath));converged.push({path:dest,bytes:Buffer.byteLength(merged),sha256:createHash('sha256').update(merged).digest('hex')});
 patch+='*** Add File: '+dest+'\n'+merged.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n';
}
const changeFiles=[];async function walk(d){for(const e of await fs.readdir(d,{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())await walk(f);else{assert(e.isFile());changeFiles.push(await ref(f));}}}await walk(root);
const startedAt=new Date().toISOString();
const context={kind:'external-orchestrator-archive-context',executionMode:'independent-bootstrap',canonicalFlowkitRuntimeRun:false,role:'author',action:'archive',deliveryId:delivery,changeId:change,projectOrdinal:38,runId,previousRunId:review.runId,startedAt,ownerInstruction:'根据最新run，archive',archivePath:archive,proofRoot:proof,acceptedReview:await ref(reviewPath),ownerDecisionsRelevant:review.ownerDecisionsRelevant,scope:'同步两个已批准 delta、移动当前 Change、仅更新其 completed 状态；不改实现，不执行 Git 或 Delivery Final。'};
await fs.mkdir(group+'/'+runId);
await fs.writeFile(group+'/'+runId+'/action.md','# Archive\n\n归档 invoke-git-at-workflow-boundaries（projectOrdinal 38），独立 bootstrap。先验证隔离合并，再同步、移动及记录完成；不执行 Git，完成后 STOP。\n',{flag:'wx'});
await fs.writeFile(group+'/'+runId+'/context.json',JSON.stringify(context,null,2)+'\n',{flag:'wx'});
await fs.writeFile(proof+'/preflight.json',JSON.stringify({checkedAt:startedAt,review:context.acceptedReview,payload:review.reviewedPayload,ancestor:payload.ancestorPayload,candidateFiles:files,canonicalBefore,converged,manifest:await ref(manifestPath),changeFiles,archivePath:archive},null,2)+'\n',{flag:'wx'});
console.log(patch+'*** End Patch');

