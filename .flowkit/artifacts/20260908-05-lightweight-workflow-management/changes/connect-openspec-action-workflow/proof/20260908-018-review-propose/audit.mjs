import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
import YAML from "yaml";
const root=process.cwd(),proof=path.dirname(fileURLToPath(import.meta.url));
const attempt=process.argv[2]??"attempt-01";
assert.match(attempt,/^attempt-\d+$/);
const out=path.join(proof,attempt);fs.mkdirSync(out);
const sha=b=>createHash("sha256").update(b).digest("hex");
const rel=p=>path.relative(root,path.resolve(p)).split(path.sep).join("/");
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const ref=p=>{const b=fs.readFileSync(p);return{path:rel(p),bytes:b.length,sha256:sha(b)};};
const save=(name,value)=>{const p=path.join(out,name);fs.writeFileSync(p,JSON.stringify(value,null,2)+"\n",{flag:"wx"});return ref(p);};
const verified=new Map();
function verifyRefs(value){
 if(!value||typeof value!=="object")return;
 if(typeof value.path==="string"&&typeof value.bytes==="number"&&typeof value.sha256==="string"){
  assert(path.resolve(value.path).startsWith(root+path.sep));
  const actual=ref(value.path);assert.equal(actual.bytes,value.bytes,value.path);assert.equal(actual.sha256,value.sha256,value.path);verified.set(actual.path,actual);
 }
 for(const child of Object.values(value))if(child&&typeof child==="object")verifyRefs(child);
}
const D="20260908-05-lightweight-workflow-management",C="connect-openspec-action-workflow";
const chain=".flowkit/runs/"+D+"/"+C;
const reviewed=chain+"/20260908-017-propose/result.json";
const result=read(reviewed);verifyRefs(result);
assert.equal(result.action,"propose");assert.equal(result.status,"terminal");assert.equal(result.previousRunId,"20260908-016-review-explore");
const accepted=read(result.acceptedExploreReview.path);verifyRefs(accepted);
assert.equal(accepted.verdict,"approved");assert.equal(accepted.nextBoundary,"propose");
const explore=read(accepted.reviewedResult.path);verifyRefs(explore);
const handoff=read(explore.handoff.path);verifyRefs(handoff.manifest);
const validation=read(result.validation.path);verifyRefs(validation);
for(const command of validation.commands){assert.equal(command.exitCode,0);assert.equal(command.error,null);}
const manifest=YAML.parse(fs.readFileSync(handoff.manifest.path,"utf8"));
const context=read(chain+"/20260908-017-propose/context.json");
const selected=manifest.changes.find(c=>c.id===C);
assert.equal(selected.state,"active");
assert.equal(selected.projectOrdinal,context.projectOrdinal);
const owner=manifest.ownerDecisions.find(d=>d.ref===context.ownerActivationRef);
assert.equal(owner.decision,"activate-change");assert.equal(owner.deliveryId,D);assert.equal(owner.changeId,C);assert.deepEqual(owner.scope,["explore"]);
for(const id of selected.dependsOn)assert.equal(manifest.changes.find(c=>c.id===id).state,"completed");
const change="openspec/changes/"+C;
const counts=[];
for(const p of result.planningArtifacts){
 const text=fs.readFileSync(p.path,"utf8");
 assert(text.endsWith("\n")&&!text.endsWith("\n\n"));
 assert(!text.includes("\r")&&!/[\t ]+$/m.test(text));
 if(!p.path.includes("/specs/"))continue;
 const capability=p.path.split("/").at(-2);
 const canonical=fs.readFileSync("openspec/specs/"+capability+"/spec.md","utf8");
 let added=0,modified=0,scenarios=0;
 for(const section of text.split(/^## /m).slice(1)){
  const isModified=section.startsWith("MODIFIED Requirements"),isAdded=section.startsWith("ADDED Requirements");
  assert(isModified||isAdded);
  for(const block of section.split(/^### Requirement: /m).slice(1)){
   const name=block.split("\n")[0];
   const exists=canonical.split(/\r?\n/).includes("### Requirement: "+name);
   assert.equal(exists,isModified,name);
   assert.match(block,/\bSHALL\b/);
   const n=[...block.matchAll(/^#### Scenario: /gm)].length;assert(n>0,name);
   scenarios+=n;if(isModified)modified++;else added++;
  }
 }
 counts.push({capability,modified,added,scenarios});
}
const taskText=fs.readFileSync(change+"/tasks.md","utf8");
const ids=[...taskText.matchAll(/^- \[ \] (\d+\.\d+) /gm)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length);assert(!/^- \[x\]/m.test(taskText));
assert.equal(ids.length,validation.taskCount);
const commands=[];
function execute(label,program,args){
 const start=new Date().toISOString();
 const r=spawnSync(program,args,{cwd:root,maxBuffer:8*1024*1024,timeout:60000});
 for(const stream of["stdout","stderr"])fs.writeFileSync(path.join(out,label+"."+stream+".txt"),r[stream]??Buffer.alloc(0),{flag:"wx"});
 const record={label,program,args,cwd:root,startedAt:start,completedAt:new Date().toISOString(),exitCode:r.status,error:r.error?.message??null,stdout:ref(path.join(out,label+".stdout.txt")),stderr:ref(path.join(out,label+".stderr.txt"))};
 commands.push(save(label+".command.json",record));
 assert.equal(r.error,undefined,label);assert.equal(r.status,0,label);
 return r.stdout.toString();
}
const lock=read("config/tools/toolchain.lock.json");
const runtimeRoot=path.resolve(process.env.FLOWKIT_HOME,"tools/openspec",lock.openspec.version);
const runtime=read(path.join(runtimeRoot,"package.json"));
assert.equal(runtime.name,lock.openspec.packageName);assert.equal(runtime.version,lock.openspec.version);
const bin=path.join(runtimeRoot,lock.openspec.entrypoint);
assert.equal(execute("openspec-version",process.execPath,[bin,"--version"]).trim(),lock.openspec.version);
const status=JSON.parse(execute("openspec-status",process.execPath,[bin,"status","--change",C,"--json"]));
assert.equal(status.isPlanningComplete,true);assert(status.artifacts.every(a=>a.status==="done"));
execute("openspec-strict",process.execPath,[bin,"validate",C,"--strict"]);
execute("diff-check","git",["diff","--check"]);
const head=execute("source-head","git",["rev-parse","HEAD"]).trim();assert.equal(head,context.sourceHead);
assert.equal(execute("index-diff","git",["diff","--cached","--name-only"]).trim(),"");
const policy=await import(pathToFileURL(path.resolve("src/domain/policy-and-next-boundary.ts")).href);
const persistence=await import(pathToFileURL(path.resolve("src/domain/run-result-persistence.ts")).href);
const actionIdentity={deliveryId:"synthetic-delivery",changeId:"synthetic-change",actionId:"apply"};
function facts(state,authorConclusion,reviewerVerdict,nextBoundary,actionId="apply"){
 const identity={...actionIdentity,actionId};
 const occurrence={date:"20260908",sequence:1,actionId};
 const runId=persistence.formatRunOccurrenceId(occurrence);
 const ctx={runId,occurrence,actionIdentity:identity,role:actionId.startsWith("review-")?"reviewer":"author",lifecycleState:state,ownerAuthority:null,previousRunId:null};
 const result={runId,actionIdentity:identity,authorConclusion,reviewerVerdict,verificationVerdict:null,nextBoundary,facts:state==="prepared"?{invocationFailure:{kind:"host-eof",stage:"execution"}}:{}};
 assert(persistence.isRunContextRecord(ctx));assert(persistence.isRunResultRecord(result));
 return {deliveryId:identity.deliveryId,changeId:identity.changeId,changeState:"active",currentAction:{identity,state},terminalRunContext:state==="terminal"?ctx:null,terminalResult:state==="terminal"?result:null};
}
const examples=[
 ["prepared-retry",facts("prepared",null,null,null),{kind:"ready-action",actionId:"apply"}],
 ["author-pass",facts("terminal","PASS",null,"review-apply"),{kind:"ready-action",actionId:"review-apply"}],
 ["author-fail",facts("terminal","FAIL",null,null),{kind:"blocked",reason:"unrecognized-or-unsuccessful-author-outcome"}],
 ["review-revise",facts("terminal",null,"changes-requested","revise-apply","review-apply"),{kind:"ready-action",actionId:"revise-apply"}],
 ["skip-review-rejected",facts("terminal","PASS",null,"archive"),{kind:"blocked",reason:"reported-boundary-conflict"}]
].map(([name,input,expected])=>{const actual=policy.evaluatePolicyAndNextBoundary(input);assert.deepEqual(actual,expected);return{name,input,expected,actual};});
const sources=["AGENTS.md",".agents/skills/review-propose/SKILL.md","config/tools/toolchain.lock.json",".flowkit/project.json",".flowkit/memos.json","flowkit-next-delivery-change-plan.md","flowkit-next-d05-decoupling-analysis.md",...counts.map(c=>"openspec/specs/"+c.capability+"/spec.md"),"src/domain/policy-and-next-boundary.ts","src/domain/run-result-persistence.ts","src/domain/single-action-execution.ts","src/domain/action-package-result-admission.ts","src/cli/request.ts"].map(ref);
const report={kind:"independent-proposal-structure-and-seam-audit",completedAt:new Date().toISOString(),sourceHead:head,method:ref(fileURLToPath(import.meta.url)),reviewedResult:ref(reviewed),acceptedExploreReview:result.acceptedExploreReview,verifiedRefCount:verified.size,verifiedRefs:[...verified.values()],sourceInputs:sources,planningArtifacts:result.planningArtifacts,capabilityCounts:counts,pendingTasks:ids.length,commands,existingPolicyExamples:examples,limits:["Structure and existing Policy compatibility checks do not generate the Reviewer semantic verdict.","Synthetic in-memory examples only; no persisted product Runs or forged authority/verdict.","No new implementation tests, actual-host acceptance, Full Test, Author mutation or Git mutation."]};
save("summary.json",report);
console.log(JSON.stringify({refs:verified.size,capabilities:counts,tasks:ids.length,policyExamples:examples.length,summary:rel(path.join(out,"summary.json"))}));

