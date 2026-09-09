import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const base=path.relative(process.cwd(),path.dirname(fileURLToPath(import.meta.url))).replaceAll('\\','/');
const run=".flowkit/runs/20260908-05-lightweight-workflow-management/004-decouple-full-test-from-repository-tracking/20260909-038-revise-apply";
const previous=run.replace('038-revise-apply','037-review-apply');
const ancestor=run.replace('038-revise-apply','036-revise-apply');
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const ref=async file=>{const b=await fs.readFile(file);return {path:file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};};
const verify=async r=>assert.deepEqual(await ref(r.path),{path:r.path,bytes:r.bytes,sha256:r.sha256});
const review=await json(previous+'/result.json');
assert.equal(review.verdict,'changes-requested');assert.equal(review.nextBoundary,'revise-apply');assert.equal(review.contractBlocker,false);
await verify(review.reviewedResult);await verify(review.reviewReport);await verify(review.approvedProposalReview);
const before=await json(ancestor+'/result.json');
const changed=new Set(['src/internal/full-test-tool.ts','tests/unit/domain/full-test-revision.test.ts']);
const cumulative=[];const revisionArtifacts=[];
for(const old of before.cumulativeCandidateArtifacts){
 const actual=await ref(old.path);if(!changed.has(old.path))await verify(old);
 cumulative.push(actual);
 if(changed.has(old.path)){const lines=(await fs.readFile(old.path,'utf8')).trimEnd().split('\n').length;assert.ok(lines<=650);revisionArtifacts.push({...actual,lines});}
}
assert.equal(revisionArtifacts.length,2);assert.equal(cumulative.length,48);
for(const item of before.planningArtifacts)await verify(item);
const approved=await json(review.approvedProposalReview.path);await verify(approved.coordinationAtReview);
const checks=['regression-after','counterexample-01','domain-01','acceptance-01','typecheck-01','format-01','lint-01','build-01','openspec-01','linux-01'];
for(const id of [...checks,'regression-before','regression-before-native']){
 const c=await json(base+'/'+id+'/command.json');assert.equal(c.exitCode,id.startsWith('regression-before')?1:0,id);
 await verify(c.stdout);await verify(c.stderr);
}
const beforeTap=await fs.readFile(base+'/regression-before-native/stdout.txt','utf8');assert.match(beforeTap,/# fail 6/);assert.match(beforeTap,/# pass 3/);
const domainTap=await fs.readFile(base+'/domain-01/stdout.txt','utf8');assert.match(domainTap,/# pass 291/);assert.match(domainTap,/# fail 0/);
assert.match(await fs.readFile(base+'/acceptance-01/stdout.txt','utf8'),/# pass 6/);
for(const o of (await json(base+'/counterexample-01/output-observations.json')).observations){
 for(const field of ['filesUnchanged','configRefUnchanged','inputRefUnchanged','toolRefUnchanged'])assert.equal(o[field],true);
 for(const field of ['checkStatus','fullTestVerdict','currentStatus'])assert.equal(o[field],'passed');
 assert.equal(o.commandExitCode,0);assert.deepEqual(o.failureReasons,[]);
}
const linux=await json(base+'/linux-01/linux-outcome.json');assert.equal(linux.verdict,'passed');assert.equal(linux.record.checks.length,9);assert.ok(linux.record.checks.every(c=>c.status==='passed'));
assert.equal((await json(base+'/linux-01/linux-readback.json')).afterTmpRemoval,'passed');
assert.equal((await json(base+'/linux-01/fresh-reader.stdout.txt')).status,'passed');
const linuxRoot=base+'/linux-01/linux-fixture';
for(const check of linux.record.checks){
 const c=await json(linuxRoot+'/'+check.command.artifact);
 for(const raw of [c.stdout,c.stderr])if(raw?.artifact){const actual=await ref(linuxRoot+'/'+raw.artifact);assert.equal(actual.sha256,raw.contentSha256);assert.equal(actual.bytes,raw.bytes);}
 if(check.checkId==='domain')assert.match(await fs.readFile(linuxRoot+'/'+check.command.artifact.replace('command.json','stdout.txt'),'utf8'),/# pass 291/);
}
const proofRefs=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=dir+'/'+e.name;if(e.isDirectory())await walk(f);else{assert.ok(e.isFile());proofRefs.push(await ref(f));}}}
await walk(base);proofRefs.sort((a,b)=>a.path.localeCompare(b.path));
const index=base+'/evidence-index.json';await fs.writeFile(index,'[\n'+proofRefs.map(r=>'  '+JSON.stringify(r)).join(',\n')+'\n]\n',{flag:'wx'});
const context=await json(run+'/context.json');
const result={
 kind:'external-orchestrator-revise-apply-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'revise-apply',
 deliveryId:review.deliveryId,changeId:review.changeId,projectOrdinal:36,runId:context.runId,previousRunId:review.runId,status:'terminal',verdict:'corrected',
 startedAt:context.startedAt,completedAt:new Date().toISOString(),reviewedFindingsSource:await ref(previous+'/result.json'),ancestorApply:await ref(ancestor+'/result.json'),
 findingCorrections:[{findingId:'D05-RA037-001',status:'corrected-pending-independent-review',proof:await ref(base+'/counterexample-01/output-observations.json'),implementation:'Bound Node launch/preload resources; stop at script argv boundary; no ordinary output-file existence inference.'}],
 preservedCorrections:['D05-RA035-001','D05-RA035-002'],revisionArtifacts,cumulativeCandidateArtifacts:cumulative,removedPaths:[],
 ancestorRemovalSource:ancestor+'/result.json#ancestorApply',planningArtifacts:before.planningArtifacts,tasks:{total:20,complete:20,remaining:0},
 verification:{focused:9,windowsDomain:291,windowsAcceptance:6,linuxProjectChecks:9,linuxDomain:291,linuxAcceptance:6,linuxEntropyTests:7,format:'passed',lint:'passed',typecheck:'passed',build:'passed',strictOpenSpec:'passed',formalD05FullTest:false,independentReviewerVerdict:false},
 facts:{proofRefs:[await ref(index),await ref(base+'/revision-report.md')],maxRevisionFileLines:Math.max(...revisionArtifacts.map(r=>r.lines)),approvedPlanningUnchanged:true,realManifestUnchanged:true,skillsUnchanged:true,attributesUnchanged:true,gitMutation:false,runtimePolicyRunSchemaMutation:false},
 ownerDecisionsRelevant:context.ownerDecisionsRelevant,runArtifacts:{action:await ref(run+'/action.md'),context:await ref(run+'/context.json')},
 nextBoundary:'review-apply',handoff:{nextBoundary:'review-apply',independentReviewRequired:true,report:base+'/revision-report.md',continuity:'48 cumulative current file refs and exact 036/037 ancestor refs; 2 revised files, no new removals',notExecuted:['review-apply','archive','D05 Formal Full Test','Git mutation'],stop:true},stop:true
};
for(const item of proofRefs)await verify(item);for(const item of cumulative)await verify(item);
await fs.writeFile(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
assert.deepEqual(await json(run+'/result.json'),result);
console.log(JSON.stringify({status:'recorded-and-read-back',result:await ref(run+'/result.json'),revisionFiles:2,maxLines:result.facts.maxRevisionFileLines,nextBoundary:'review-apply',stop:true}));
