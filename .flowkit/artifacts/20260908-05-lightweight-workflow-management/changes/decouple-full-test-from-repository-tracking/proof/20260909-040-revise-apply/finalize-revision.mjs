import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const base=path.relative(process.cwd(),path.dirname(fileURLToPath(import.meta.url))).replaceAll('\\','/');
const run=".flowkit/runs/20260908-05-lightweight-workflow-management/004-decouple-full-test-from-repository-tracking/20260909-040-revise-apply";
const previous=run.replace('040-revise-apply','039-review-apply');
const ancestor=run.replace('040-revise-apply','038-revise-apply');
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
 const actual=await ref(old.path);if(!changed.has(old.path))await verify(old);cumulative.push(actual);
 if(changed.has(old.path)){const lines=(await fs.readFile(old.path,'utf8')).trimEnd().split('\n').length;assert.ok(lines<=650);revisionArtifacts.push({...actual,lines});}
}
assert.equal(revisionArtifacts.length,2);assert.equal(cumulative.length,48);
for(const item of before.planningArtifacts)await verify(item);
const approved=await json(review.approvedProposalReview.path);await verify(approved.coordinationAtReview);
for(const id of ['probe-before','probe-after','regression-after','domain-01','domain-02','acceptance-01','typecheck-01','format-01','lint-01','build-01','openspec-01','linux-01','linux-02']){
 const c=await json(base+'/'+id+'/command.json');assert.equal(c.exitCode,['domain-01','linux-01'].includes(id)?1:0,id);await verify(c.stdout);await verify(c.stderr);
}
const oldProbe=(await json(base+'/probe-before/option-observations.json')).toolDrift;assert.equal(oldProbe.inputRefUnchanged,true);assert.equal(oldProbe.readerAfterToolChanged,'passed');assert.equal(oldProbe.newExecutionVerdict,'failed');
const fixedProbe=(await json(base+'/probe-after/option-observations.json')).toolDrift;assert.equal(fixedProbe.inputRefUnchanged,false);assert.equal(fixedProbe.checkRefUnchanged,false);assert.equal(fixedProbe.readerAfterToolChanged,'stale');assert.equal(fixedProbe.readerAfterNewFailure,'failed');
assert.match(await fs.readFile(base+'/regression-after/stdout.txt','utf8'),/# pass 14/);
assert.match(await fs.readFile(base+'/domain-02/stdout.txt','utf8'),/# pass 296/);
assert.match(await fs.readFile(base+'/acceptance-01/stdout.txt','utf8'),/# pass 6/);
const linux=await json(base+'/linux-02/linux-outcome.json');assert.equal(linux.verdict,'passed');assert.equal(linux.record.checks.length,9);assert.ok(linux.record.checks.every(c=>c.status==='passed'));
assert.equal((await json(base+'/linux-02/linux-readback.json')).afterTmpRemoval,'passed');
assert.equal((await json(base+'/linux-02/fresh-reader.stdout.txt')).status,'passed');
const linuxRoot=base+'/linux-02/linux-fixture';
const domainCheck=linux.record.checks.find(c=>c.checkId==='domain');
assert.match(await fs.readFile(linuxRoot+'/'+domainCheck.command.artifact.replace('command.json','stdout.txt'),'utf8'),/# pass 296/);
const proofRefs=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=dir+'/'+e.name;if(e.isDirectory())await walk(f);else{assert.ok(e.isFile());proofRefs.push(await ref(f));}}}
await walk(base);proofRefs.sort((a,b)=>a.path.localeCompare(b.path));
const index=base+'/evidence-index.json';await fs.writeFile(index,'[\n'+proofRefs.map(r=>'  '+JSON.stringify(r)).join(',\n')+'\n]\n',{flag:'wx'});
const context=await json(run+'/context.json');
const result={kind:'external-orchestrator-revise-apply-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'revise-apply',
 deliveryId:review.deliveryId,changeId:review.changeId,projectOrdinal:36,runId:context.runId,previousRunId:review.runId,status:'terminal',verdict:'corrected',
 startedAt:context.startedAt,completedAt:new Date().toISOString(),reviewedFindingsSource:await ref(previous+'/result.json'),ancestorApply:await ref(ancestor+'/result.json'),
 findingCorrections:[{findingId:'D05-RA039-001',status:'corrected-pending-independent-review',before:await ref(base+'/probe-before/option-observations.json'),after:await ref(base+'/probe-after/option-observations.json'),implementation:'Bounded Node option arity before entry/preload; unknown/unresolved launch rejects preparation without an attempt.'}],
 preservedCorrections:['D05-RA035-001','D05-RA035-002','D05-RA037-001'],revisionArtifacts,cumulativeCandidateArtifacts:cumulative,removedPaths:[],ancestorRemovalSource:ancestor+'/result.json#ancestorRemovalSource',
 planningArtifacts:before.planningArtifacts,tasks:{total:20,complete:20,remaining:0},
 verification:{focused:14,windowsDomain:296,windowsAcceptance:6,linuxProjectChecks:9,linuxDomain:296,linuxAcceptance:6,linuxEntropyTests:7,strictOpenSpec:'passed',formalD05FullTest:false,independentReviewerVerdict:false,retainedFailedAttempts:['domain-01','linux-01'],failureCorrection:'Restored existing valueless --version/-v support; no test weakening.'},
 facts:{proofRefs:[await ref(index),await ref(base+'/revision-report.md')],maxRevisionFileLines:Math.max(...revisionArtifacts.map(r=>r.lines)),approvedPlanningUnchanged:true,realManifestUnchanged:true,skillsUnchanged:true,attributesUnchanged:true,gitMutation:false,runtimePolicyRunSchemaMutation:false},
 ownerDecisionsRelevant:context.ownerDecisionsRelevant,runArtifacts:{action:await ref(run+'/action.md'),context:await ref(run+'/context.json')},nextBoundary:'review-apply',
 handoff:{nextBoundary:'review-apply',independentReviewRequired:true,report:base+'/revision-report.md',continuity:'48 cumulative current files and exact 038/039 ancestors; 2 revised files, no new removals',notExecuted:['review-apply','archive','D05 Formal Full Test','Git mutation'],stop:true},stop:true};
for(const item of proofRefs)await verify(item);for(const item of cumulative)await verify(item);
await fs.writeFile(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});assert.deepEqual(await json(run+'/result.json'),result);
console.log(JSON.stringify({status:'recorded-and-read-back',result:await ref(run+'/result.json'),revisionFiles:2,maxLines:result.facts.maxRevisionFileLines,nextBoundary:'review-apply',stop:true}));
