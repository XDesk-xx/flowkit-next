import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const base=path.relative(process.cwd(),path.dirname(fileURLToPath(import.meta.url))).replaceAll('\\','/');
const run='.flowkit/runs/20260908-05-lightweight-workflow-management/004-decouple-full-test-from-repository-tracking/20260909-034-apply';
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const ref=async file=>{const b=await fs.readFile(file);return {path:file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};};
const checked=async entry=>assert.deepEqual(await ref(entry.path),entry);
const context=await json(run+'/context.json');
const previous=run.replace('034-apply','033-review-propose')+'/result.json';
const review=await json(previous);assert.equal(review.verdict,'approved');assert.equal(context.previousRunId,review.runId);
const plan=await json(run.replace('034-apply','032-propose')+'/result.json');
for(const artifact of plan.planningArtifacts)if(!artifact.path.endsWith('/tasks.md'))await checked(artifact);
const tasks=await fs.readFile('openspec/changes/'+context.changeId+'/tasks.md','utf8');
assert.equal((tasks.match(/^- \[x\]/gm)||[]).length,20);assert.equal(tasks.includes('- [ ]'),false);
const audit=await json(base+'/audit-06/stdout.txt');
assert.equal(audit.maxLines,650);
for(const file of audit.changedSourceAndTests)await checked({path:file.path,bytes:file.bytes,sha256:file.sha256});
const commands=['linux-07','domain-05','focused-final-02','acceptance-02','bootstrap-01','typecheck-04','build-03','openspec-02','audit-06','skill-bootstrap-01','skill-bootstrap-02','skill-product-01','skill-product-02','stream-probe-01'];
const selected=new Set(['capture.mjs','audit.mjs','linux-prepare.mjs','linux-run.sh','linux-fixture.mjs','linux-stream-probe.mjs','apply-report.md','finalize-apply.mjs'].map(f=>base+'/'+f));
for(const id of commands){
 const file=base+'/'+id+'/command.json';const command=await json(file);assert.equal(command.exitCode,0,id);assert.equal(command.error,null,id);
 for(const stream of [command.stdout,command.stderr]){await checked(stream);selected.add(stream.path);}
 selected.add(file);
}
const outcome=await json(base+'/linux-07/linux-outcome.json');assert.equal(outcome.verdict,'passed');assert.equal(outcome.record.checks.length,9);assert.ok(outcome.record.checks.every(c=>c.status==='passed'));
const reread=await json(base+'/linux-07/linux-readback.json');assert.equal(reread.status,'passed');assert.equal(reread.afterTmpRemoval,'passed');
assert.equal((await json(base+'/linux-07/fresh-reader.stdout.txt')).status,'passed');
async function walk(directory){for(const item of await fs.readdir(directory,{withFileTypes:true})){const file=directory+'/'+item.name;if(item.isDirectory())await walk(file);else {assert.ok(item.isFile());selected.add(file);}}}
await walk(base+'/linux-07');
const proofRefs=[];for(const file of [...selected].sort())proofRefs.push(await ref(file));
const indexPath=base+'/evidence-index.json';
await fs.writeFile(indexPath,'[\n'+proofRefs.map(r=>'  '+JSON.stringify(r)).join(',\n')+'\n]\n',{flag:'wx'});
const planningArtifacts=[];for(const item of plan.planningArtifacts)planningArtifacts.push(await ref(item.path));
const result={kind:'external-orchestrator-apply-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'apply',deliveryId:context.deliveryId,changeId:context.changeId,projectOrdinal:context.projectOrdinal,runId:context.runId,previousRunId:context.previousRunId,status:'terminal',verdict:'implemented',startedAt:context.startedAt,completedAt:new Date().toISOString(),tasks:{total:20,complete:20,remaining:0},approvedProposalReview:await ref(previous),planningArtifacts,implementationArtifacts:audit.changedSourceAndTests,runArtifacts:{action:await ref(run+'/action.md'),context:await ref(run+'/context.json')},facts:{proofRefs:[await ref(indexPath),await ref(base+'/apply-report.md')],verification:{primary:'linux-x64-glibc code-only API fixture',linuxChecks:9,linuxDomainTests:282,linuxAcceptanceTests:6,windowsDomainTestsBeforeLastBoundedFixes:282,windowsFullTestTestsAfterFinalFix:9,bootstrapTests:9,formalD05FullTest:false,independentReview:false},scope:{maxChangedSourceTestLines:650,realDeliveryManifestUnchanged:true,historicalRunsChanged:false,attributesChanged:false,gitMutationPerformed:false,runtimePolicyRunSchemaChanged:false}},retainedFailures:['domain-01 sandbox EPERM','domain-02 old contract assertions corrected','audit-01 file size corrected','audit-02 sandbox EPERM','lint-02 unused import corrected','entropy-02 sandbox EPERM','linux-01 incomplete after host interruption; no exit code invented','linux-02 old dependency identity rejected','linux-03 offline policy metadata missing; existing cache added','linux-04/05 SIGKILL during premature-exit large-output fixture; flush callback corrected','linux-06 synchronous spawn ENOTDIR; process-failed classification corrected'],ownerDecisionsRelevant:context.ownerDecisionsRelevant,handoff:{nextBoundary:'review-apply',reviewerIndependent:true,report:base+'/apply-report.md',scope:'033 approved plan; current implementation and selected current evidence only',notExecuted:['review-apply','archive','D05 Formal Full Test','Git add/commit/push/merge/tag'],stop:true}};
const target=run+'/result.json';await fs.writeFile(target,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
assert.deepEqual(await json(target),result);await checked(result.runArtifacts.action);await checked(result.runArtifacts.context);
for(const entry of proofRefs)await checked(entry);
console.log(JSON.stringify({status:'recorded-and-read-back',result:await ref(target),tasks:result.tasks,nextBoundary:'review-apply',stop:true}));
