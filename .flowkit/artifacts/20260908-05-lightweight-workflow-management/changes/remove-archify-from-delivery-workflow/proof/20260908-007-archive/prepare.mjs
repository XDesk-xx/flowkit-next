import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,cp,mkdir,symlink,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {parse} from 'yaml';
const root=process.cwd(), proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-007-archive", dry='.tmp/archive-007-converged';
const change='remove-archify-from-delivery-workflow', delivery='20260908-05-lightweight-workflow-management';
const runs='.flowkit/runs/'+delivery+'/'+change;
const hash=b=>createHash('sha256').update(b).digest('hex');
const ref=async p=>{const b=await readFile(p);return {path:p,bytes:b.length,sha256:hash(b)}};
const review=JSON.parse(await readFile(runs+'/20260908-006-review-apply/result.json','utf8'));
assert.equal(review.verdict,'approved');assert.equal(review.nextBoundary,'archive');assert.equal(review.archiveReady,true);
for(const r of [review.reviewedResult,review.approvedProposalReview,review.verification.summary,review.verification.authorEvidence,...Object.values(review.runArtifacts)]) assert.equal((await ref(r.path)).sha256,r.sha256,r.path);
const author=JSON.parse(await readFile(review.verification.authorEvidence.path,'utf8'));
for(const r of [...author.sourceScope,...author.authorArtifacts]) assert.equal((await ref(r.path)).sha256,r.sha256,r.path);
for(const p of author.deletedTrackedArtifacts) await assert.rejects(access(p),{code:'ENOENT'});
const ordinals=new Map();
for(const name of await readdir('openspec/delivery-groups')) {
 if(!name.endsWith('.yaml'))continue;
 const doc=parse(await readFile('openspec/delivery-groups/'+name,'utf8'));
 for(const c of doc.changes??[]) if(c.projectOrdinal!==undefined){
 assert.ok(Number.isSafeInteger(c.projectOrdinal)&&c.projectOrdinal>0);
 assert.ok(!ordinals.has(c.projectOrdinal),'duplicate ordinal '+c.projectOrdinal);
 ordinals.set(c.projectOrdinal,c.id);
 }
}
assert.equal(ordinals.get(33),change);
const manifest='openspec/delivery-groups/'+delivery+'.yaml';
const doc=parse(await readFile(manifest,'utf8'));
assert.equal(doc.bootstrap.mode,'independent-bootstrap');
assert.equal(doc.changes.filter(c=>c.id===change).length,1);
assert.equal(doc.changes.find(c=>c.id===change).state,'active');
assert.equal(doc.changes.find(c=>c.id===change).projectOrdinal,33);
const target='openspec/changes/archive/2026-09-08-033-'+change;
await assert.rejects(access(target),{code:'ENOENT'});
await mkdir(dry);
for(const entry of await readdir(root,{withFileTypes:true})){
 if(['.git','.tmp','node_modules','dist'].includes(entry.name))continue;
 await cp(path.join(root,entry.name),path.join(root,dry,entry.name),{recursive:true,filter:p=>!p.startsWith(path.join(root,'.flowkit','artifacts'))});
}
await symlink(path.join(root,'node_modules'),path.join(root,dry,'node_modules'),'junction');
const baseline={review:await ref(runs+'/20260908-006-review-apply/result.json'),manifest:await ref(manifest),change,target,dry,projectOrdinal:33,ownerInstruction:'根据最新run，archive',executionMode:'independent-bootstrap',reviewedBytesMatch:true,ordinalUnique:true,specRules:{artifactId:'specs',schemaName:'spec-driven',rulesAbsent:true,source:'本轮成功的 exact OpenSpec instructions specs JSON；不重复获取'},sourceScope:author.sourceScope};
await writeFile(proof+'/preflight.json',JSON.stringify(baseline,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({preflight:'PASS',dry,target,reviewedBytesMatch:true,ordinalUnique:true}));
