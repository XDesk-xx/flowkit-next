import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from 'yaml';
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-053-archive",run=".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/20260909-053-archive";
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const ref=async p=>{const b=await fs.readFile(p);return {path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};};
const review=await json(run.replace('053-archive','052-review-apply')+'/result.json');
assert.equal(review.verdict,'approved');assert.equal(review.nextBoundary,'archive');assert.equal(review.findings.length,0);
assert.deepEqual(await ref(review.reviewedResult.path),review.reviewedResult);
const apply=await json(review.reviewedResult.path);
for(const r of [...apply.cumulativeArtifacts,...apply.planningArtifacts])assert.deepEqual(await ref(r.path),{path:r.path,bytes:r.bytes,sha256:r.sha256});
const ordinals=new Map();
for(const f of await fs.readdir('openspec/delivery-groups'))if(f.endsWith('.yaml')){
 const m=parse(await fs.readFile('openspec/delivery-groups/'+f,'utf8'));
 for(const c of m.changes??[])if(c.projectOrdinal!==undefined){assert(Number.isInteger(c.projectOrdinal)&&c.projectOrdinal>0);assert(!ordinals.has(c.projectOrdinal));ordinals.set(c.projectOrdinal,c.id);}
}
const manifestPath='openspec/delivery-groups/'+review.deliveryId+'.yaml';
const manifest=parse(await fs.readFile(manifestPath,'utf8'));
const selected=manifest.changes.filter(c=>c.id===review.changeId);
assert.equal(selected.length,1);assert.equal(selected[0].state,'active');assert.equal(selected[0].projectOrdinal,37);
const context=await json(run+'/context.json');
await assert.rejects(fs.stat(context.archivePath),{code:'ENOENT'});
const changeRoot='openspec/changes/'+review.changeId;
const tasks=await fs.readFile(changeRoot+'/tasks.md','utf8');assert.equal((tasks.match(/^- \[x\]/gm)||[]).length,19);assert(!tasks.includes('- [ ]'));
const caps=["delivery-finalization","delivery-operation-execution-and-start-continuity","repository-integration-and-next-base-continuity"];
const blocks=t=>[...t.matchAll(/^### Requirement: .+$(?:\n(?!### Requirement: |## (?:ADDED|MODIFIED) Requirements)[^\n]*)*/gm)].map(m=>m[0].trimEnd());
const canonicalBefore=[],converged=[];
for(const c of caps){
 const mainPath='openspec/specs/'+c+'/spec.md',mergedPath=proof+'/converged-specs/'+c+'/spec.md';
 const main=(await fs.readFile(mainPath,'utf8')).replaceAll('\r\n','\n');
 const delta=(await fs.readFile(changeRoot+'/specs/'+c+'/spec.md','utf8')).replaceAll('\r\n','\n');
 const merged=await fs.readFile(mergedPath,'utf8');const removed='### Requirement: 必要证据是 Final 的有限前置快照而非可选清单'; const db=blocks(delta.replace(/^## REMOVED Requirements\n[\s\S]*?(?=^## ADDED Requirements)/m,''));
 assert.equal(merged.split('### Requirement:')[0],main.split('### Requirement:')[0]);
 assert(!/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/m.test(merged));
 for(const b of db)assert(merged.includes(b),c+' lost delta');
 for(const b of blocks(main)){if(b.startsWith(removed)){assert(!merged.includes(removed));continue;}const replacement=db.find(d=>d.split('\n')[0]===b.split('\n')[0]);if(!replacement)assert(merged.includes(b));else for(const s of b.matchAll(/^#### Scenario: .+$/gm))assert(replacement.includes(s[0]));}
 canonicalBefore.push(await ref(mainPath));converged.push(await ref(mergedPath));
}
const changeFiles=[];async function walk(d){for(const e of await fs.readdir(d,{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())await walk(f);else{assert(e.isFile());changeFiles.push(await ref(f));}}}await walk(changeRoot);
for(const p of apply.removedPaths)await assert.rejects(fs.stat(p),{code:'ENOENT'});
const result={review:await ref(run.replace('053-archive','052-review-apply')+'/result.json'),apply:review.reviewedResult,projectOrdinal:37,archivePath:context.archivePath,manifest:await ref(manifestPath),changeFiles,canonicalBefore,converged,candidateFiles:apply.cumulativeArtifacts,checkedAt:new Date().toISOString()};
await fs.writeFile(proof+'/preflight.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,files:result.candidateFiles.length,specs:caps.length,projectOrdinal:37}));
