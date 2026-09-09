import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const base=path.relative(process.cwd(),path.dirname(fileURLToPath(import.meta.url))).replaceAll('\\','/');
const run=".flowkit/runs/20260908-05-lightweight-workflow-management/004-decouple-full-test-from-repository-tracking/20260909-036-revise-apply";
const previous=run.replace('036-revise-apply','035-review-apply');
const ancestor=run.replace('036-revise-apply','034-apply');
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const ref=async file=>{const b=await fs.readFile(file);return {path:file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};};
const verify=async r=>assert.deepEqual(await ref(r.path),r);
const review=await json(previous+'/result.json');assert.equal(review.verdict,'changes-requested');assert.equal(review.nextBoundary,'revise-apply');
await verify(review.reviewedResult);await verify(review.reviewReport);await verify(review.candidateSnapshot);await verify(review.approvedProposalReview);
const before=(await json(review.candidateSnapshot.path)).candidateFiles;
const changed=new Set(['src/internal/full-test-input.ts','src/internal/full-test-process.ts','src/domain/delivery-full-test-execution.ts','tests/unit/domain/full-test-input.test.ts']);
const added=['src/internal/full-test-tool.ts','tests/unit/domain/full-test-revision.test.ts'];
const current=[];
for(const r of before){const actual=await ref(r.path);if(!changed.has(r.path))assert.deepEqual(actual,r);current.push(actual);}
for(const f of added)current.push(await ref(f));
const revisionArtifacts=[];
for(const f of [...changed,...added]){const r=await ref(f);const lines=(await fs.readFile(f,'utf8')).replace(/\r?\n$/,'').split('\n').length;assert.ok(lines<=650,f);revisionArtifacts.push({...r,lines});}
const apply=await json(ancestor+'/result.json');for(const r of apply.planningArtifacts)await verify(r);
const taskText=await fs.readFile('openspec/changes/'+review.changeId+'/tasks.md','utf8');assert.equal((taskText.match(/^- \[x\]/gm)||[]).length,20);assert.equal(taskText.includes('- [ ]'),false);
const observations=await json(base+'/counterexamples/observations.json');
assert.equal(observations.toolDrift.inputRefUnchanged,false);assert.equal(observations.toolDrift.checkRefUnchanged,false);assert.equal(observations.toolDrift.readerAfterToolChanged,'stale');assert.equal(observations.toolDrift.readerAfterNewFailure,'failed');assert.equal(new Set(observations.diagnostics.map(d=>d.reason)).size,4);
const linux=await json(base+'/linux-01/linux-outcome.json');assert.equal(linux.verdict,'passed');assert.equal(linux.record.checks.length,9);assert.ok(linux.record.checks.every(c=>c.status==='passed'));
assert.equal((await json(base+'/linux-01/linux-readback.json')).afterTmpRemoval,'passed');assert.equal((await json(base+'/linux-01/fresh-reader.stdout.txt')).status,'passed');
const proof=new Set(['capture.mjs','probe.mjs','linux-prepare.mjs','linux-fixture.mjs','linux-run.sh','revision-report.md','finalize-revision.mjs','counterexamples/observations.json'].map(f=>base+'/'+f));
const checks=['regression-final','counterexamples','domain-01','acceptance-01','typecheck-01','build-01','format-01','lint-01','dependency-01','openspec-01','linux-01'];
for(const id of [...checks,'regression-before']){
 const file=base+'/'+id+'/command.json';const c=await json(file);assert.equal(c.exitCode,id==='regression-before'?1:0,id);assert.equal(c.error,null,id);proof.add(file);
 for(const r of [c.stdout,c.stderr]){await verify(r);proof.add(r.path);}
}
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=dir+'/'+e.name;if(e.isDirectory())await walk(f);else{assert.ok(e.isFile());proof.add(f);}}}
await walk(base+'/linux-01');
const proofRefs=[];for(const f of [...proof].sort())proofRefs.push(await ref(f));
const index=base+'/evidence-index.json';await fs.writeFile(index,'[\n'+proofRefs.map(r=>'  '+JSON.stringify(r)).join(',\n')+'\n]\n',{flag:'wx'});
const context=await json(run+'/context.json');
const result={kind:'external-orchestrator-revise-apply-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'revise-apply',deliveryId:review.deliveryId,changeId:review.changeId,projectOrdinal:36,runId:context.runId,previousRunId:review.runId,status:'terminal',verdict:'corrected',startedAt:context.startedAt,completedAt:new Date().toISOString(),reviewedFindingsSource:await ref(previous+'/result.json'),ancestorApply:await ref(ancestor+'/result.json'),findingCorrections:[{findingId:'D05-RA035-001',status:'corrected-pending-independent-review',proof:base+'/counterexamples/observations.json#toolDrift',implementation:'actual executable plus explicit launch resource / selected package implementation bytes; shared producer/reader identity'},{findingId:'D05-RA035-002',status:'corrected-pending-independent-review',proof:base+'/counterexamples/observations.json#diagnostics',implementation:'shared checked preparation with bounded stage/reason; no config/environment plaintext'}],revisionArtifacts,cumulativeCandidateArtifacts:current,removedPaths:[],planningArtifacts:apply.planningArtifacts,tasks:{total:20,complete:20,remaining:0},verification:{windowsDomain:285,windowsAcceptance:6,focused:14,linuxProjectChecks:9,linuxDomain:285,linuxAcceptance:6,linuxEntropyTests:7,strictOpenSpec:'passed',formalD05FullTest:false,independentReviewerVerdict:false},facts:{proofRefs:[await ref(index),await ref(base+'/revision-report.md')],maxRevisionFileLines:Math.max(...revisionArtifacts.map(r=>r.lines)),approvedPlanningUnchanged:true,realManifestUnchanged:true,attributesUnchanged:true,skillsUnchanged:true,gitMutation:false,runtimePolicyRunSchemaMutation:false},ownerDecisionsRelevant:context.ownerDecisionsRelevant,runArtifacts:{action:await ref(run+'/action.md'),context:await ref(run+'/context.json')},handoff:{nextBoundary:'review-apply',independentReviewRequired:true,report:base+'/revision-report.md',continuity:'current cumulative file refs plus exact 034/035 ancestor results; no removals; only selected current evidence needed',notExecuted:['review-apply','archive','D05 Formal Full Test','Git mutation'],stop:true}};
await fs.writeFile(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});assert.deepEqual(await json(run+'/result.json'),result);
for(const r of proofRefs)await verify(r);for(const r of current)await verify(r);await verify(result.runArtifacts.action);await verify(result.runArtifacts.context);
console.log(JSON.stringify({status:'recorded-and-read-back',result:await ref(run+'/result.json'),revisionFiles:revisionArtifacts.length,maxLines:result.facts.maxRevisionFileLines,nextBoundary:'review-apply',stop:true}));
