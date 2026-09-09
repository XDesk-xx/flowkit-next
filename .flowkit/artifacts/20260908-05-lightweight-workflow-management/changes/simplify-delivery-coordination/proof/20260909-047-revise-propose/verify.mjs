import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const run=".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/20260909-047-revise-propose",proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-047-revise-propose",change="openspec/changes/simplify-delivery-coordination";
const base='.flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination';
const ref=async path=>{const b=await fs.readFile(path);return {path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}};
const reviewPath=base+'/20260909-046-review-propose/result.json',review=JSON.parse(await fs.readFile(reviewPath,'utf8'));
assert.equal(review.verdict,'changes-requested');assert.equal(review.nextBoundary,'revise-propose');assert.deepEqual(review.findings.map(f=>f.id),['R046-01']);
assert.deepEqual(await ref(review.reviewedResult.path),review.reviewedResult);
const previous=JSON.parse(await fs.readFile(review.reviewedResult.path,'utf8'));
const changed=['design.md','tasks.md','specs/delivery-finalization/spec.md','specs/repository-integration-and-next-base-continuity/spec.md'].map(p=>change+'/'+p);
const beforeAfter=[];
for(const old of previous.artifacts){
 const now=await ref(old.path);
 if(changed.includes(old.path)){assert.notEqual(now.sha256,old.sha256);beforeAfter.push({before:old,after:now});}
 else assert.deepEqual(now,old);
}
assert.equal(beforeAfter.length,4);
const ctx=JSON.parse(await fs.readFile(run+'/context.json','utf8'));
const commands=[];
async function command(name,program,args){
 const startedAt=new Date().toISOString(),p=spawnSync(program,args,{cwd:process.cwd(),windowsHide:true,encoding:null});
 await fs.writeFile(proof+'/'+name+'.stdout.txt',p.stdout??Buffer.alloc(0),{flag:'wx'});
 await fs.writeFile(proof+'/'+name+'.stderr.txt',p.stderr??Buffer.alloc(0),{flag:'wx'});
 const m={program,args,startedAt,completedAt:new Date().toISOString(),exitCode:p.status,error:p.error?.message??null,stdout:await ref(proof+'/'+name+'.stdout.txt'),stderr:await ref(proof+'/'+name+'.stderr.txt')};
 await fs.writeFile(proof+'/'+name+'.command.json',JSON.stringify(m,null,2)+'\n',{flag:'wx'});commands.push(m);
 assert.equal(p.status,0,name);return p.stdout.toString('utf8');
}
const cli='C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
assert.equal((await command('version',process.execPath,[cli,'--version'])).trim(),'1.10.0');
await command('validate',process.execPath,[cli,'validate','simplify-delivery-coordination','--strict']);
const status=JSON.parse(await command('status',process.execPath,[cli,'status','--change','simplify-delivery-coordination','--json']));assert.equal(status.isPlanningComplete,true);
assert.deepEqual((await command('scope','git',['diff','--name-only'])).trim().split(/\r?\n/),['openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml']);
const r44=JSON.parse(await fs.readFile(base+'/20260909-044-review-explore/result.json','utf8'));
assert.deepEqual(await ref(r44.coordinationAtReview.path),r44.coordinationAtReview);
assert.deepEqual(await ref(r44.reviewedExplore.path),r44.reviewedExplore);
const taskText=await fs.readFile(change+'/tasks.md','utf8');assert.equal((taskText.match(/^- \[ \]/gm)||[]).length,19);assert.ok(!taskText.includes('- [x]'));
const assessment={finding:'R046-01',classification:'contract inconsistency / verification gap',authorDisposition:'addressed-in-plan-awaiting-independent-review',correction:'manifest confirmationRef initially null; publish only after required checks; publication is success commit point; reader and Integration require matching confirmation',counterexampleClosure:[
{case:'content readback fails',persisted:'completed + null confirmationRef',newSession:'unconfirmed',integration:'reject'},
{case:'input drifts before confirmation',persisted:'completed + null confirmationRef',newSession:'unconfirmed',integration:'reject'},
{case:'normal success',persisted:'completed + valid confirmationRef',newSession:'completed',integration:'eligible subject to independent Git checks'},
{case:'confirmation committed, response lost',persisted:'completed + valid confirmationRef',newSession:'recognize actual committed completion; no automatic replay',integration:'eligible subject to independent Git checks'}],evidenceClass:'planning semantic analysis, NOT product fault-injection or implementation PASS',scope:'exactly four confirmed planning files changed; other 045 bound artifacts, manifest and approved Explore preserved',beforeAfter,commands};
await fs.writeFile(proof+'/assessment.json',JSON.stringify(assessment,null,2)+'\n',{flag:'wx'});
const files=[change+'/proposal.md',change+'/design.md',change+'/tasks.md',...status.artifactPaths.specs.existingOutputPaths.map(p=>p.replaceAll('\\','/').replace(process.cwd().replaceAll('\\','/')+'/',''))];
const artifacts=await Promise.all([...files,run+'/action.md',run+'/context.json',proof+'/verify.mjs'].map(ref));
const result={kind:'external-orchestrator-revise-propose-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'revise-propose',deliveryId:ctx.deliveryId,changeId:ctx.changeId,projectOrdinal:37,runId:ctx.runId,previousRunId:ctx.previousRunId,status:'terminal',authorConclusion:'PASS',startedAt:ctx.startedAt,completedAt:new Date().toISOString(),acceptedFindingSource:await ref(reviewPath),findingResponses:[{id:'R046-01',disposition:'addressed-in-plan-awaiting-independent-review',assessment:await ref(proof+'/assessment.json')}],artifacts,ownerSourceRef:ctx.ownerSourceRef,ownerDecisionsRelevant:ctx.ownerDecisionsRelevant,verification:{strictOpenSpec:'PASS',version:'1.10.0',planningComplete:true,uncheckedTasks:19,meaning:'plan structure and scoped correction only; not implementation acceptance'},scope:{changedPlanningFiles:changed,productionMutation:false,mainSpecMutation:false,skillMutation:false,manifestMutation:false,historicalRunMutation:false,gitMutation:false},nextBoundary:'review-propose',stop:true};
await fs.writeFile(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
assert.deepEqual(JSON.parse(await fs.readFile(run+'/result.json','utf8')),result);assert.equal((await fs.readdir(run)).length,3);
console.log(JSON.stringify({run:ctx.runId,validation:'PASS',changed:changed.length,nextBoundary:result.nextBoundary,result:await ref(run+'/result.json')},null,2));
