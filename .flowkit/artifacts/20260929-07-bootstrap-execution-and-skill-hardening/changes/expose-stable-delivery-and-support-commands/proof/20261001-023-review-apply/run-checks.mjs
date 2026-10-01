import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),deliveryId='20260929-07-bootstrap-execution-and-skill-hardening',changeId='expose-stable-delivery-and-support-commands';
const group=`.flowkit/runs/${deliveryId}/014-${changeId}`;
const proof=`.flowkit/artifacts/${deliveryId}/changes/${changeId}/proof/20261001-023-review-apply`;
await fs.mkdir(proof,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const author=await json(`${group}/20261001-022-revise-apply/result.json`);
const earlier=await json(`${group}/20261001-020-apply/result.json`);
const report={syntheticTests:true,formalDeliveryFullTest:false,candidateHashes:{},changedSinceApply:[],addedSinceApply:[],authorEvidenceVerified:[],checks:[]};
for(const [file,hash] of Object.entries(author.facts.artifactHashes)){
 assert.equal(digest(await fs.readFile(file)),hash,file);report.candidateHashes[file]=hash;
 if(!Object.hasOwn(earlier.facts.artifactHashes,file))report.addedSinceApply.push(file);
 else if(earlier.facts.artifactHashes[file]!==hash)report.changedSinceApply.push(file);
}
const unbound='src/domain/git-workflow-host.ts';report.candidateHashes[unbound]=digest(await fs.readFile(unbound));
report.candidateBinding={unboundModifiedFile:unbound,currentSha256:report.candidateHashes[unbound],declaredInAuthor022:Object.hasOwn(author.facts.artifactHashes,unbound),declaredInAuthor020:Object.hasOwn(earlier.facts.artifactHashes,unbound)};
const indexRef=author.facts.proofRefs[0];const index=await json(indexRef.path);
for(const item of index.results){assert.equal(item.exitCode,0);for(const stream of item.streams){const b=await fs.readFile(path.join(path.dirname(indexRef.path),stream.path));assert.equal(b.length,stream.bytes);assert.equal(digest(b),stream.sha256);}report.authorEvidenceVerified.push({id:item.id,exitCode:item.exitCode,streams:item.streams.length});}
const tests=['support-archive-chain','support-command-boundaries','support-full-test','support-git-checkpoint','support-git-integration','action-archive-cli','action-archive-readiness'].map(n=>'tests/unit/domain/'+n+'.test.ts');
const args=['--import','tsx','--test',...tests];const startedAt=new Date().toISOString();
const out=spawnSync(process.execPath,args,{cwd:root,windowsHide:true,timeout:180000,maxBuffer:8*1024*1024});
for(const [name,bytes] of [['checks.stdout.txt',out.stdout??Buffer.alloc(0)],['checks.stderr.txt',out.stderr??Buffer.alloc(0)]])await fs.writeFile(path.join(proof,name),bytes,{flag:'wx'});
report.checks.push({program:process.execPath,args,startedAt,finishedAt:new Date().toISOString(),exitCode:out.status,signal:out.signal,error:out.error?.message??null});
await fs.writeFile(path.join(proof,'checks.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({changed:report.changedSinceApply,added:report.addedSinceApply,binding:report.candidateBinding,exitCode:out.status,outputTail:out.stdout?.toString().slice(-1500)}));
