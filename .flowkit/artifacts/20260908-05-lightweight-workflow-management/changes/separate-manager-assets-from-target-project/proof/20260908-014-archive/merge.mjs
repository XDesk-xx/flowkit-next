import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const change='separate-manager-assets-from-target-project';
const capabilities=['action-guidance-execution','delivery-operation-execution-and-start-continuity','foundation-cli-surface','managed-toolchain-resolution','openspec-thin-integration'];
const root=process.argv[2];
assert.ok(['.tmp/archive-014-converged','.'].includes(root));
function requirements(body){
 const heads=[...body.matchAll(/^### Requirement: ([^\r\n]+)\r?\n/gm)];
 return heads.map((h,i)=>({name:h[1],body:body.slice(h.index,heads[i+1]?.index??body.length).trimEnd()}));
}
let patch='*** Begin Patch\n';
for(const capability of capabilities){
 const relative='openspec/specs/'+capability+'/spec.md';
 const before=(await fs.readFile(relative,'utf8')).replaceAll('\r\n','\n');
 const delta=(await fs.readFile('openspec/changes/'+change+'/specs/'+capability+'/spec.md','utf8')).replaceAll('\r\n','\n');
 const modified=delta.startsWith('## MODIFIED Requirements');
 assert.ok(modified||delta.startsWith('## ADDED Requirements'));
 const source=requirements(before);
 let after=before;
 for(const update of requirements(delta)){
  const old=source.find(x=>x.name===update.name);
  if(modified){
   assert.ok(old,update.name);
   for(const m of old.body.matchAll(/^#### Scenario: (.+)$/gm))assert.ok(update.body.includes('#### Scenario: '+m[1]),m[1]);
   after=after.replace(old.body,update.body);
  }else{assert.ok(!old);after=after.trimEnd()+'\n\n'+update.body+'\n';}
 }
 if(capability==='managed-toolchain-resolution')after=after.replace('from repository-tracked identity','from the manager-owned installed contract');
 const target=root==='.'?relative:root+'/'+relative;
 const current=(await fs.readFile(target,'utf8')).replaceAll('\r\n','\n');
 assert.equal(current,before);
 patch+='*** Update File: '+target+'\n@@\n'+before.trimEnd().split('\n').map(x=>'-'+x).join('\n')+'\n'+after.trimEnd().split('\n').map(x=>'+'+x).join('\n')+'\n';
}
const manifest='openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml';
const before=(await fs.readFile(manifest,'utf8')).replaceAll('\r\n','\n');
const start=before.indexOf('  - id: "'+change+'"');
const end=before.indexOf('\n  - id:',start+1);
const entry=before.slice(start,end);
assert.equal((entry.match(/    state: active/g)||[]).length,1);
const target=root==='.'?manifest:root+'/'+manifest;
if(root!=='.')patch+='*** Update File: '+target+'\n@@\n'+entry.split('\n').map(x=>'-'+x).join('\n')+'\n'+entry.replace('    state: active','    state: completed').split('\n').map(x=>'+'+x).join('\n')+'\n';
console.log(patch+'*** End Patch');
