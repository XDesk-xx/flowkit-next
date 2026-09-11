import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const p='.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260911-062-archive';
const pre=JSON.parse(await fs.readFile(p+'/preflight.json','utf8'));
const v=JSON.parse(await fs.readFile(p+'/dry-run/verification.json','utf8'));
assert.equal(v.results.length,10);assert(v.results.every(c=>c.exitCode===0));
for(const r of [...pre.candidateFiles,...pre.canonicalBefore,pre.review,pre.manifest]){
 const b=await fs.readFile(r.path);assert.equal(b.length,r.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),r.sha256,r.path);
}
let patch='*** Begin Patch\n';
for(const r of pre.canonicalBefore){
 const cap=r.path.split('/')[2];
 const old=(await fs.readFile(r.path,'utf8')).replaceAll('\r\n','\n').trimEnd();
 const merged=(await fs.readFile(p+'/converged-specs/'+cap+'/spec.md','utf8')).trimEnd();
 patch+='*** Update File: '+r.path+'\n@@\n'+old.split('\n').map(l=>'-'+l).join('\n')+'\n'+merged.split('\n').map(l=>'+'+l).join('\n')+'\n';
}
console.log(patch+'*** End Patch');

