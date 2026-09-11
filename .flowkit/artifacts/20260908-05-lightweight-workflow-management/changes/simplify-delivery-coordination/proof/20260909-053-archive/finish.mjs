import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from 'yaml';
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-053-archive",run=".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/20260909-053-archive";
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
const ref=async p=>{const b=await fs.readFile(p);return {path:p,bytes:b.length,sha256:digest(b)};};
const verify=async r=>assert.deepEqual(await ref(r.path),{path:r.path,bytes:r.bytes,sha256:r.sha256});
const pre=await json(proof+'/preflight.json'),context=await json(run+'/context.json');
await verify(pre.review);await verify(pre.apply);
const from='openspec/changes/'+context.changeId,to=context.archivePath;
await assert.rejects(fs.stat(from),{code:'ENOENT'});
const moved=[];
for(const old of pre.changeFiles){const current=await ref(old.path.replace(from,to));assert.equal(current.bytes,old.bytes);assert.equal(current.sha256,old.sha256);moved.push({from:old.path,to:current.path,bytes:current.bytes,sha256:current.sha256});}
const specs=[];
for(const old of pre.canonicalBefore){const cap=old.path.split('/')[2];const current=await ref(old.path);const merged=await ref(proof+'/converged-specs/'+cap+'/spec.md');assert.equal(current.sha256,merged.sha256);specs.push(current);}
const manifestText=await fs.readFile(pre.manifest.path,'utf8');
const restored=manifestText.replace(/(  - id: "simplify-delivery-coordination"[\s\S]*?    state: )completed/,'$1active');
assert.equal(digest(Buffer.from(restored)),pre.manifest.sha256);assert.equal(Buffer.byteLength(restored),pre.manifest.bytes);
const manifest=parse(manifestText);assert.equal(manifest.changes.find(c=>c.id===context.changeId).state,'completed');
assert.equal(manifest.changes.filter(c=>c.state==='completed').length,5);assert.equal(manifest.changes.filter(c=>c.state==='planned').length,1);
const cumulative=[];
for(const old of pre.candidateFiles){if(old.path!==pre.manifest.path)await verify(old);cumulative.push(await ref(old.path));}
for(const item of specs)if(!cumulative.some(r=>r.path===item.path))cumulative.push(item);
if(!cumulative.some(r=>r.path===pre.manifest.path))cumulative.push(await ref(pre.manifest.path));
for(const f of moved)cumulative.push(await ref(f.to));
const verification=await json(proof+'/dry-run-02/verification.json');assert.equal(verification.results.length,10);assert(verification.results.every(r=>r.exitCode===0));
for(const id of ['dry-run-02','sync-validation','post-archive-validation']){const c=await json(proof+'/'+id+'/command.json');assert.equal(c.exitCode,0);await verify(c.stdout);await verify(c.stderr);}
for(const c of verification.results)for(const stream of [c.stdout,c.stderr]){const b=await fs.readFile(proof+'/dry-run-02/'+stream.file);assert.equal(b.length,stream.bytes);assert.equal(digest(b),stream.sha256);}
const proofRefs=[];async function walk(d){for(const e of await fs.readdir(d,{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())await walk(f);else proofRefs.push(await ref(f));}}await walk(proof);
await fs.writeFile(proof+'/evidence-index.json','[\n'+proofRefs.map(x=>'  '+JSON.stringify(x)).join(',\n')+'\n]\n',{flag:'wx'});
const result={kind:'external-orchestrator-archive-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'archive',deliveryId:context.deliveryId,changeId:context.changeId,projectOrdinal:37,runId:context.runId,previousRunId:context.previousRunId,status:'terminal',verdict:'archived',startedAt:context.startedAt,completedAt:new Date().toISOString(),acceptedReview:pre.review,ancestorApply:pre.apply,archivePath:to,specSync:{status:'converged',capabilities:3,modifiedRequirements:12,addedRequirements:1,removedRequirements:1,artifacts:specs,untouchedRequirementsAndScenariosPreserved:true},completion:{manifest:await ref(pre.manifest.path),changeState:'completed',deliveryState:manifest.delivery.state,completedChanges:5,plannedChanges:1,nonTargetManifestBytesPreserved:true},movedFiles:moved,removedPaths:[...moved.map(f=>f.from),...(await json(pre.apply.path)).removedPaths],cumulativeCandidateArtifacts:cumulative,ancestorRemovalSource:pre.apply.path+'#removedPaths',verification:{dryRunChecks:10,domain:309,acceptance:6,strictSpecValidation:'passed',postArchiveAllStrict:'passed',formalD05FullTest:false},proofRefs:[await ref(proof+'/evidence-index.json'),await ref(proof+'/archive-report.md')],runArtifacts:{action:await ref(run+'/action.md'),context:await ref(run+'/context.json')},ownerDecisionsRelevant:[{sourceRef:'owner-input:current-turn:根据最新run，archive',decision:'执行当前归档，遵循既有明确同步偏好；不执行 Git 或下一个 Change。'},{sourceRef:pre.review.path+'#ownerDecisionsRelevant',decision:'D05 independent-bootstrap；必要材料在 target artifacts；历史不重写。'}],nextBoundary:'checkpoint-owner-authorization',nextBoundaryMeaning:'Archive 已完成；Git checkpoint/commit/push 另需 Owner 明确授权，不自动执行。',productionMutation:false,skillMutation:false,historicalRunMutation:false,gitMutation:false,formalD05FullTestExecuted:false,nextChangeActivated:false,stop:true};
await fs.writeFile(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});assert.deepEqual(await json(run+'/result.json'),result);
console.log(JSON.stringify({status:'archived-and-read-back',result:await ref(run+'/result.json'),archivePath:to,movedFiles:moved.length,syncedSpecs:specs.length,completedChanges:5,plannedChanges:1,stop:true}));
