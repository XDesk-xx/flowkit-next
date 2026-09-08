import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-007-archive",dry='.tmp/archive-007-converged',change='openspec/changes/remove-archify-from-delivery-workflow';
const caps=["architecture-and-canonical-diagram-continuity","delivery-finalization","delivery-operation-execution-and-start-continuity","foundation-cli-surface","managed-toolchain-resolution","repository-integration-and-next-base-continuity"],stats=[{"cap":"architecture-and-canonical-diagram-continuity","added":2,"modified":0,"removed":8},{"cap":"delivery-finalization","added":0,"modified":5,"removed":0},{"cap":"delivery-operation-execution-and-start-continuity","added":0,"modified":4,"removed":1},{"cap":"foundation-cli-surface","added":0,"modified":2,"removed":0},{"cap":"managed-toolchain-resolution","added":1,"modified":3,"removed":0},{"cap":"repository-integration-and-next-base-continuity","added":1,"modified":0,"removed":0}];
const hash=b=>createHash('sha256').update(b).digest('hex');
const ref=async p=>{const b=await readFile(p);return {path:p,bytes:b.length,sha256:hash(b)}};
const read=async p=>(await readFile(p,'utf8')).replace(/\r\n/g,'\n').trim();
const blocks=s=>{const hs=[...s.matchAll(/^### Requirement: (.+)$/gm)];return hs.map((m,i)=>({name:m[1].trim(),body:s.slice(m.index,hs[i+1]?.index??s.length).split(/^## /m)[0].trim()}));};
const result=JSON.parse(await readFile(proof+'/converged-02/result.json','utf8'));
assert.equal(result.exitCode,0);
for(const stream of ['stdout','stderr'])assert.equal(hash(await readFile(proof+'/converged-02/'+stream+'.txt')),result[stream+'Sha256']);
const stdout=await read(proof+'/converged-02/stdout.txt');
assert.ok(stdout.includes('# tests 259'));assert.ok(!/^not ok/m.test(stdout));
const pre=JSON.parse(await readFile(proof+'/preflight.json','utf8'));
assert.equal((await ref(pre.review.path)).sha256,pre.review.sha256);
assert.equal((await ref(pre.manifest.path)).sha256,pre.manifest.sha256);
for(const r of pre.sourceScope) assert.equal((await ref(r.path)).sha256,r.sha256,r.path);
const specs=[];
for(const cap of caps){
 const p='openspec/specs/'+cap+'/spec.md', old=await read(p), merged=await read(dry+'/'+p),delta=await read(change+'/specs/'+cap+'/spec.md');
 const before=blocks(old),after=blocks(merged),hs=[...delta.matchAll(/^## (ADDED|MODIFIED|REMOVED) Requirements$/gm)];
 const ops=hs.flatMap((m,i)=>blocks(delta.slice(m.index+m[0].length,hs[i+1]?.index??delta.length)).map(b=>({...b,op:m[1]})));
 for(const op of ops){const target=after.find(b=>b.name===op.name);if(op.op==='REMOVED')assert.equal(target,undefined);else assert.equal(target?.body,op.body,op.name);}
 for(const b of before.filter(b=>!ops.some(o=>o.name===b.name)))assert.equal(after.find(a=>a.name===b.name)?.body,b.body,b.name);
 assert.ok(after.length>0);assert.ok(!/^## (ADDED|MODIFIED|REMOVED)/m.test(merged));
 assert.ok(!/[^\S\n]+$/m.test(merged));
 specs.push({cap,before:await ref(p),converged:await ref(dry+'/'+p),operations:stats.find(s=>s.cap===cap)});
}
async function files(p){const a=[];for(const e of await readdir(p,{withFileTypes:true})){const f=p+'/'+e.name;if(e.isDirectory())a.push(...await files(f));else a.push(f);}return a.sort();}
const changeFiles=await Promise.all((await files(change)).map(ref));
for(const r of changeFiles)assert.equal((await ref(dry+'/'+pre.target+r.path.slice(change.length))).sha256,r.sha256,r.path);
await assert.rejects(access(pre.target),{code:'ENOENT'});
const plan={...pre,specs,changeFiles,manifestAfter:await ref(dry+'/'+pre.manifest.path),convergence:'27/27 PASS',verification:await ref(proof+'/converged-02/result.json')};
await writeFile(proof+'/convergence.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({convergence:'PASS',capabilities:6,operations:27,changeFiles:changeFiles.length}));
