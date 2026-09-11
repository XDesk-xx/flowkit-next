import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
const change='separate-manager-assets-from-target-project';
const delivery='20260908-05-lightweight-workflow-management';
const dry='.tmp/archive-014-converged';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const ref=async p=>{const b=await fs.readFile(p);return {path:p,bytes:b.length,sha256:sha(b)};};
const reviewPath='.flowkit/runs/'+delivery+'/'+change+'/20260908-013-review-apply/result.json';
const review=await read(reviewPath);
assert.equal(review.verdict,'approved');assert.equal(review.nextBoundary,'archive');
async function verify(v){if(!v||typeof v!=='object')return;if(typeof v.path==='string'&&typeof v.bytes==='number'&&typeof v.sha256==='string')assert.deepEqual(await ref(v.path),{path:v.path,bytes:v.bytes,sha256:v.sha256});for(const x of Object.values(v))await verify(x);}
await verify(review);
const apply=await read(review.reviewedResult.path);
const evidence=await read(apply.evidence.path);
await verify(evidence.candidateInventory);
await verify(await read(evidence.candidateInventory.path));
const manifestPath='openspec/delivery-groups/'+delivery+'.yaml';
const manifest=parse(await fs.readFile(manifestPath,'utf8'));
const selected=manifest.changes.filter(c=>c.id===change);
assert.equal(selected.length,1);assert.equal(selected[0].state,'active');assert.equal(selected[0].projectOrdinal,34);
const ordinals=new Map();
for(const f of await fs.readdir('openspec/delivery-groups')){
 if(!/\.ya?ml$/.test(f))continue;
 const m=parse(await fs.readFile('openspec/delivery-groups/'+f,'utf8'));
 for(const c of m.changes??[]){if(c.projectOrdinal===undefined)continue;assert.ok(Number.isSafeInteger(c.projectOrdinal)&&c.projectOrdinal>0);assert.ok(!ordinals.has(c.projectOrdinal));ordinals.set(c.projectOrdinal,c.id);}
}
const archive='openspec/changes/archive/2026-09-08-034-'+change;
await assert.rejects(fs.access(archive));
await assert.rejects(fs.access(dry));
const tasks=await fs.readFile('openspec/changes/'+change+'/tasks.md','utf8');
assert.equal((tasks.match(/^- \[x\]/gm)||[]).length,12);assert.ok(!/^- \[ \]/m.test(tasks));
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8',maxBuffer:32*1024*1024}).split('\0').filter(Boolean);
await fs.mkdir(dry,{recursive:true});
let copied=0;
for(const file of new Set(files)){
 if(file.startsWith('.flowkit/artifacts/'))continue;
 const info=await fs.lstat(file).catch(()=>null);if(!info?.isFile())continue;
 const dest=path.join(dry,file);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(file,dest);copied++;
}
await fs.symlink(path.resolve('node_modules'),path.resolve(dry,'node_modules'),process.platform==='win32'?'junction':'dir');
const snapshot={kind:'archive-readiness',review:await ref(reviewPath),reviewedApply:review.reviewedResult,candidateInventory:await ref(evidence.candidateInventory.path),manifest:await ref(manifestPath),changeId:change,projectOrdinal:34,ordinalCount:ordinals.size,archiveTarget:archive,dryRoot:dry,copiedFiles:copied,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks:{reviewApproved:true,reviewRefsExact:true,candidateFilesExact:true,tasksComplete:true,ordinalUnique:true,archiveTargetAbsent:true}};
console.log(JSON.stringify(snapshot,null,2));
