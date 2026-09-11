import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(), proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-045-propose", run=".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/20260909-045-propose", change="openspec/changes/simplify-delivery-coordination";
const ref=async p=>{const b=await fs.readFile(p);return {path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}};
const reviewPath='.flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/20260909-044-review-explore/result.json';
const review=JSON.parse(await fs.readFile(reviewPath,'utf8'));
assert.equal(review.verdict,'approved');assert.equal(review.nextBoundary,'propose');
for(const r of [review.reviewedResult,review.reviewedExplore,review.coordinationAtReview,review.reviewReport])assert.deepEqual(await ref(r.path),r);
const commands=[];
async function command(name,program,args){
 const startedAt=new Date().toISOString(),r=spawnSync(program,args,{cwd:root,windowsHide:true,encoding:null});
 await fs.writeFile(proof+'/'+name+'.stdout.txt',r.stdout??Buffer.alloc(0),{flag:'wx'});
 await fs.writeFile(proof+'/'+name+'.stderr.txt',r.stderr??Buffer.alloc(0),{flag:'wx'});
 const record={name,program,args,startedAt,completedAt:new Date().toISOString(),exitCode:r.status,error:r.error?.message??null,stdout:await ref(proof+'/'+name+'.stdout.txt'),stderr:await ref(proof+'/'+name+'.stderr.txt')};
 await fs.writeFile(proof+'/'+name+'.command.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});commands.push(record);
 assert.equal(r.status,0,name+': '+r.stderr);return (r.stdout??Buffer.alloc(0)).toString('utf8');
}
const cli='C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
assert.equal((await command('version',process.execPath,[cli,'--version'])).trim(),'1.10.0');
await command('validate',process.execPath,[cli,'validate','simplify-delivery-coordination','--strict']);
const status=JSON.parse(await command('status',process.execPath,[cli,'status','--change','simplify-delivery-coordination','--json']));
assert.equal(status.isPlanningComplete,true);assert.ok(status.artifacts.every(a=>a.status==='done'));
const diff=(await command('scope','git',['diff','--name-only'])).trim().split(/\r?\n/);
assert.deepEqual(diff,['openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml']);
let modifications=0,added=0,removed=0;
const specPaths=[];
for(const name of await fs.readdir(change+'/specs')){
 const p=change+'/specs/'+name+'/spec.md',s=await fs.readFile(p,'utf8'),base=await fs.readFile('openspec/specs/'+name+'/spec.md','utf8');specPaths.push(p);
 let operation='';
 for(const line of s.split(/\r?\n/)){
  if(line.startsWith('## '))operation=line;
  if(!line.startsWith('### Requirement: '))continue;
  if(operation.includes('MODIFIED')||operation.includes('REMOVED'))assert.ok(base.includes(line),line);
  if(operation.includes('MODIFIED'))modifications++;
  if(operation.includes('ADDED'))added++;
  if(operation.includes('REMOVED'))removed++;
 }
}
const tasks=await fs.readFile(change+'/tasks.md','utf8');assert.ok(!tasks.includes('- [x]'));
const artifacts=await Promise.all([change+'/proposal.md',change+'/design.md',change+'/tasks.md',...specPaths,run+'/action.md',run+'/context.json',proof+'/verify.mjs'].map(ref));
const assessment={authorAssessment:'Proposal convergence complete, awaiting independent review',traceability:'design Decisions 6',modifiedRequirements:modifications,addedRequirements:added,removedRequirements:removed,tasks:tasks.match(/^- \[ \]/gm).length,sourceReview:await ref(reviewPath),artifacts,commands,notImplementationAcceptance:true};
await fs.writeFile(proof+'/assessment.json',JSON.stringify(assessment,null,2)+'\n',{flag:'wx'});
const context=JSON.parse(await fs.readFile(run+'/context.json','utf8'));
const result={kind:'external-orchestrator-propose-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'propose',deliveryId:context.deliveryId,changeId:context.changeId,projectOrdinal:37,runId:'20260909-045-propose',previousRunId:'20260909-044-review-explore',status:'terminal',authorConclusion:'PASS',startedAt:context.startedAt,completedAt:new Date().toISOString(),acceptedReview:await ref(reviewPath),assessment:await ref(proof+'/assessment.json'),artifacts,validation:{exactOpenSpec:'1.10.0',strict:true,exitCode:0,planningComplete:true,meaning:'structure and planning completion only, not Reviewer approval or code PASS'},ownerDecisionsRelevant:context.ownerDecisionsRelevant,scope:{productionMutation:false,testMutation:false,skillMutation:false,mainSpecMutation:false,manifestMutation:false,historicalRunMutation:false,gitMutation:false},notExecuted:['Apply','Review','Archive','D05 Full Test','Git'],nextBoundary:'review-propose',stop:true};
await fs.writeFile(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
assert.deepEqual(JSON.parse(await fs.readFile(run+'/result.json','utf8')),result);
assert.equal((await fs.readdir(run)).length,3);
console.log(JSON.stringify({run:result.runId,validation:'PASS',modifiedRequirements:modifications,addedRequirements:added,removedRequirements:removed,tasks:assessment.tasks,nextBoundary:result.nextBoundary,result:await ref(run+'/result.json')},null,2));
