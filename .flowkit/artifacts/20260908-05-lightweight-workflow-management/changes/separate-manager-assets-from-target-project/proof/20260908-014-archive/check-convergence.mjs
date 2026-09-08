import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
const change='separate-manager-assets-from-target-project';
const caps=['action-guidance-execution','delivery-operation-execution-and-start-continuity','foundation-cli-surface','managed-toolchain-resolution','openspec-thin-integration'];
const dry='.tmp/archive-014-converged/';
const archive='openspec/changes/archive/2026-09-08-034-'+change;
const text=async p=>(await fs.readFile(p,'utf8')).replaceAll('\r\n','\n');
const blocks=s=>{const h=[...s.matchAll(/^### Requirement: ([^\n]+)\n/gm)];return h.map((m,i)=>({name:m[1],body:s.slice(m.index,h[i+1]?.index??s.length).trimEnd()}));};
const report=[];
for(const cap of caps){
 const relative='openspec/specs/'+cap+'/spec.md';
 const old=await text(relative), merged=await text(dry+relative);
 const delta=await text('openspec/changes/'+change+'/specs/'+cap+'/spec.md');
 const oldBlocks=blocks(old), newBlocks=blocks(merged), deltas=blocks(delta);
 for(const d of deltas)assert.equal(newBlocks.find(x=>x.name===d.name)?.body,d.body);
 for(const b of oldBlocks)if(!deltas.some(d=>d.name===b.name))assert.equal(newBlocks.find(x=>x.name===b.name)?.body,b.body);
 const added=deltas.filter(d=>!oldBlocks.some(b=>b.name===d.name)).length;
 assert.equal(newBlocks.length,oldBlocks.length+added);
 const purpose=s=>s.slice(s.indexOf('## Purpose'),s.indexOf('## Requirements'));
 assert.equal(purpose(merged),cap==='managed-toolchain-resolution'?purpose(old).replace('from repository-tracked identity','from the manager-owned installed contract'):purpose(old));
 report.push({capability:cap,modified:deltas.length-added,added,untouchedPreserved:oldBlocks.length-(deltas.length-added),requirements:newBlocks.length,sha256:createHash('sha256').update(await fs.readFile(dry+relative)).digest('hex')});
}
const manifest='openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml';
const before=parse(await text(manifest)),after=parse(await text(dry+manifest));
before.changes.find(c=>c.id===change).state='completed';assert.deepEqual(after,before);
async function files(root){const out=[];for(const e of await fs.readdir(root,{withFileTypes:true})){const p=root+'/'+e.name;if(e.isDirectory())out.push(...await files(p));else out.push(p);}return out.sort();}
const original='openspec/changes/'+change;
const moves=[];
for(const file of await files(original)){
 const destination=archive+file.slice(original.length);
 const a=await fs.readFile(file),b=await fs.readFile(dry+destination);assert.deepEqual(a,b);
 moves.push({from:file,to:destination,bytes:a.length,sha256:createHash('sha256').update(a).digest('hex')});
}
await assert.rejects(fs.access(dry+original));
console.log(JSON.stringify({convergence:'PASS',capabilities:report,manifestOnlyCurrentChangeCompleted:true,moves},null,2));
