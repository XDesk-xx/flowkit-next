import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from 'yaml';
const proof='.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/correct-project-onboarding-and-agent-entry/proof/20260911-063-explore',change='correct-project-onboarding-and-agent-entry';
const run='.flowkit/runs/20260908-05-lightweight-workflow-management/007-'+change+'/20260911-063-explore';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
const ref=p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:digest(b)};};
const verify=r=>assert.deepEqual(ref(r.path),{path:r.path,bytes:r.bytes,sha256:r.sha256});
const context=json(run+'/context.json'),pre=json(proof+'/preflight.json');
verify(pre.priorResult);
const source=json(proof+'/source-audit.json');
for(const r of [...source.inputs,...source.documentsAtCheckpoint])verify(r);
const manifestText=fs.readFileSync(pre.manifest.path,'utf8'),m=parse(manifestText);
const selected=m.changes.filter(c=>c.id===change);assert.equal(selected.length,1);assert.equal(selected[0].state,'active');assert.equal(selected[0].projectOrdinal,39);
assert.equal(m.changes.filter(c=>c.state==='completed').length,6);
assert.equal(m.delivery.fullTestStatus,'pending');assert.equal(m.delivery.finalizationStatus,'pending');
const restored=manifestText.replace(/  - id: "correct-project-onboarding-and-agent-entry"[\s\S]*?(?=ownerDecisions:)/,'').replace(/  - ref: "owner:aa33e6a09124d87ec6c650956fa91cf58e71216719e7ddf7f7681ccfaedb109f"[\s\S]*?(?=bootstrap:)/,'');
assert.equal(digest(Buffer.from(restored)),pre.manifest.sha256,'old manifest bytes changed');
const commands=[];
for(const name of ['current-build','package-inventory','query-probe','source-audit','openspec-init','openspec-status']){
 const r=json(proof+'/'+name+'/command.json');assert.equal(r.exitCode,0,name);verify(r.stdout);verify(r.stderr);commands.push(ref(proof+'/'+name+'/command.json'));
}
const observations=json(proof+'/query-observations.json');
for(const c of observations.commands){verify(c.stdout);verify(c.stderr);}
assert.equal(observations.actualNewSession,false);assert.equal(observations.realActionExecuted,false);
assert(!fs.existsSync('.tmp/onboarding-039-init/.agents'));
assert(!fs.existsSync('.tmp/onboarding-039-init/skills'));
const initConfig=ref('.tmp/onboarding-039-init/openspec/config.yaml');
const status=json(proof+'/openspec-status/stdout.txt');assert.equal(status.isComplete,false);
const changeRoot='openspec/changes/'+change;
assert.deepEqual(fs.readdirSync(changeRoot).sort(),['.openspec.yaml','explore.md']);
const inputArtifacts=[ref(changeRoot+'/.openspec.yaml'),ref(changeRoot+'/explore.md'),ref(pre.manifest.path)];
const proofRefs=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())walk(f);else proofRefs.push(ref(f));}}walk(proof);
fs.writeFileSync(proof+'/evidence-index.json',JSON.stringify({artifacts:proofRefs,initObservation:{onlyOpenSpecStructure:true,configAtObservation:initConfig,temporaryAndDiscardable:true}},null,2)+'\n',{flag:'wx'});
const result={kind:'external-orchestrator-explore-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',role:'author',action:'explore',deliveryId:context.deliveryId,changeId:change,projectOrdinal:39,runId:context.runId,previousRunId:null,priorDeliveryRun:pre.priorResult,status:'terminal',authorConclusion:'PASS',conclusionMeaning:'实际有界 Explore 已完成，首次接入与文档退役边界可交独立 review-explore；不是实现/安装/跨会话/Full Test PASS。',startedAt:context.startedAt,completedAt:new Date().toISOString(),ownerSourceRef:context.ownerSourceRef,ownerDecisionsRelevant:context.ownerDecisionsRelevant,scopeClassification:'Owner-authorized single correct Change: onboarding capability completion and documentation correction; no new core defect established',artifacts:inputArtifacts,removedPaths:[],proofRefs:[ref(proof+'/source-audit.json'),ref(proof+'/query-observations.json'),ref(proof+'/evidence-index.json')],commands,observations:{currentBuild:'passed',packageDryRunFiles:observations.packageInventory.files,queryCases:observations.commands.length,syntheticActivation:true,openspecToolsNoneInit:'observed',rootPlanningDocumentsRecoverable:3,existingManifestBytesPreserved:true},limitations:{realActionAcceptance:'not-executed',actualNewSessionRead:'not-executed',newPackageInstallation:'not-executed',formalDeliveryFullTest:'not-executed',independentReview:'not-executed'},proposalDirection:['fixed-package onboarding and purpose-specific project setup','thin Agent entry using existing query/Role/Guidance ownership','current README and honestly separated acceptance','delete exact three obsolete root planning documents in Apply with bounded history/reference handoff'],productionMutation:false,skillMutation:false,readmeMutation:false,rootPlanningDocumentDeletion:false,historicalRunMutation:false,gitMutation:false,proposalCreated:false,nextBoundary:'review-explore',stop:true};
fs.writeFileSync(run+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});assert.deepEqual(json(run+'/result.json'),result);assert.deepEqual(fs.readdirSync(run).sort(),['action.md','context.json','result.json']);
console.log(JSON.stringify({recordedAndReadBack:true,runId:context.runId,projectOrdinal:39,changeId:change,result:ref(run+'/result.json'),nextBoundary:'review-explore',actualNewSessionRead:'not-executed',stop:true}));
