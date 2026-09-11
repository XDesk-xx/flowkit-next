import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import YAML from "yaml";

const repo=process.cwd(),proof=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(proof,process.argv[2]??"attempt-01");
fs.mkdirSync(out);
const digest=b=>createHash("sha256").update(b).digest("hex");
const relative=p=>path.relative(repo,path.resolve(p)).split(path.sep).join("/");
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const ref=p=>{const b=fs.readFileSync(p);return {path:relative(p),bytes:b.length,sha256:digest(b)};};
const save=(name,value)=>{const p=path.join(out,name);fs.writeFileSync(p,JSON.stringify(value,null,2)+"\n",{flag:"wx"});return ref(p);};
const verified=new Map();
function refs(value) {
 if(!value||typeof value!=="object")return;
 if(typeof value.path==="string"&&typeof value.bytes==="number"&&typeof value.sha256==="string"){
  const absolute=path.resolve(repo,value.path);
  assert(absolute.startsWith(repo+path.sep));
  const actual=ref(absolute);
  assert.equal(actual.bytes,value.bytes,value.path);
  assert.equal(actual.sha256,value.sha256,value.path);
  verified.set(actual.path,actual);
 }
 for(const child of Object.values(value))if(child&&typeof child==="object")refs(child);
}
const commands=[];
function git(label,cwd,args,expected=0) {
 const start=new Date().toISOString();
 const result=spawnSync("git",args,{cwd,maxBuffer:4*1024*1024,timeout:20000});
 for(const stream of ["stdout","stderr"])fs.writeFileSync(path.join(out,label+"."+stream+".txt"),result[stream]??Buffer.alloc(0),{flag:"wx"});
 const record={label,executable:"git",args,cwd,startedAt:start,finishedAt:new Date().toISOString(),exitCode:result.status,error:result.error?.message??null,stdout:ref(path.join(out,label+".stdout.txt")),stderr:ref(path.join(out,label+".stderr.txt"))};
 commands.push(save(label+".command.json",record));
 assert.equal(result.error,undefined,label);
 assert.equal(result.status,expected,label);
 return result.stdout;
}
const D="20260908-05-lightweight-workflow-management",C="connect-openspec-action-workflow";
const author=".flowkit/artifacts/"+D+"/changes/"+C+"/proof/20260908-015-explore";
const run=".flowkit/runs/"+D+"/"+C+"/20260908-015-explore";
const result=read(run+"/result.json");
assert.equal(result.action,"explore");assert.equal(result.status,"terminal");assert.equal(result.nextBoundary,"review-explore");
refs(result);
const handoff=read(author+"/handoff.json");refs(handoff);
const summary=read(author+"/attempt-02/summary.json");refs(summary);
const dependency=read(handoff.dependency.path);refs(dependency);
assert.equal(dependency.action,"archive");assert.equal(dependency.verdict,"PASS");
assert.equal(read(dependency.reviewSource.path).verdict,"approved");
const manifest=YAML.parse(fs.readFileSync(handoff.manifest.path,"utf8"));
const context=read(run+"/context.json");
const activation=manifest.ownerDecisions.find(x=>x.ref===context.ownerActivationRef);
assert.equal(activation.decision,"activate-change");assert.equal(activation.deliveryId,D);assert.equal(activation.changeId,C);assert.deepEqual(activation.scope,["explore"]);
const active=manifest.changes.find(x=>x.id===C);
assert.equal(active.state,"active");assert.equal(active.projectOrdinal,context.projectOrdinal);
for(const id of active.dependsOn)assert.equal(manifest.changes.find(x=>x.id===id).state,"completed");
const ordinals=fs.readdirSync("openspec/delivery-groups").filter(p=>p.endsWith(".yaml")).flatMap(p=>YAML.parse(fs.readFileSync("openspec/delivery-groups/"+p,"utf8")).changes??[]).map(c=>c.projectOrdinal).filter(x=>x!==undefined);
assert.equal(new Set(ordinals).size,ordinals.length);
assert.equal(context.projectOrdinal,Math.max(...ordinals.filter(x=>x!==context.projectOrdinal))+1);
assert.equal(context.sourceHead,git("source-head",repo,["rev-parse","HEAD"]).toString().trim());
const host=read(author+"/host-summary.json"),response=read(author+"/host-response.json"),request=read(author+"/host-request.json");
assert.equal(host.status,"PASS");assert.equal(request.canonicalAction,false);
assert.equal(response.inputPath,request.inputPath);assert.equal(response.sha256,ref(request.inputPath).sha256);assert.equal(host.inputSha256,response.sha256);
assert.deepEqual([host.requestCount,host.responseCount,host.nextInvocations],[1,1,0]);
const continuity=read(author+"/continuity-summary.json");
assert.equal(continuity.retainedSha256,ref(author+"/retained-input.bin").sha256);
for(const check of continuity.checks)assert.equal(check.actual,check.expected);
const raw=fs.readFileSync(author+"/attempt-02/fixture-input.bin");
for(const [i,entry] of summary.baseline.entries()){
 const blob=fs.readFileSync(author+"/attempt-02/baseline-blob-"+i+".stdout.txt");
 assert.equal(digest(blob),entry.indexSha256);assert(!blob.equals(raw));assert(blob.equals(Buffer.from(raw.toString().replace(/\r\n/g,"\n"))));
}
for(const [i,entry] of summary.candidate.entries()){
 const blob=fs.readFileSync(author+"/attempt-02/generalized-blob-"+i+".stdout.txt");
 assert.equal(digest(blob),entry.indexSha256);assert(blob.equals(raw));
}
for(const command of summary.commands){
 const p=author+"/attempt-02/"+command.label;
 assert.deepEqual(read(p+".command.json"),command);
 assert.equal(digest(fs.readFileSync(p+".stdout.txt")),command.stdoutSha256);
 assert.equal(digest(fs.readFileSync(p+".stderr.txt")),command.stderrSha256);
 assert.equal(command.error,null);
 const expected=["baseline-check","generalized-source-check"].includes(command.label)?2:0;
 assert.equal(command.exitCode,expected);
}
assert.match(fs.readFileSync(author+"/attempt-02/existing-focused-tests.stdout.txt","utf8"),/# pass 30\r?\n/);
const snapshot=fs.readFileSync(".gitattributes");
const rules=["stdout.txt","stderr.txt","*.stdout.txt","*.stderr.txt"].map(p=>".flowkit/artifacts/**/"+p+" -text -whitespace").join("\n")+"\n";
const scratch=fs.mkdtempSync(path.join(repo,".tmp/review-016-attributes-"));
const cases=["stdout.txt","stderr.txt","job.stdout.txt","job.stderr.txt"].flatMap(name=>[
 ".flowkit/artifacts/new-delivery/changes/new-change/proof/session/"+name,
 ".flowkit/artifacts/new-delivery/full-test/new-attempt/"+name]);
const input=Buffer.from("reviewer raw  \r\nsecond\t \r\n\r\n");
const independent=[];
for(const generalized of [false,true]){
 const cwd=path.join(scratch,generalized?"generalized":"baseline");fs.mkdirSync(cwd);
 const prefix=generalized?"generalized":"baseline";
 git(prefix+"-init",cwd,["init","--quiet"]);
 fs.writeFileSync(path.join(cwd,".gitattributes"),Buffer.concat([snapshot,Buffer.from(generalized?"\n"+rules:"")]));
 for(const p of cases){fs.mkdirSync(path.dirname(path.join(cwd,p)),{recursive:true});fs.writeFileSync(path.join(cwd,p),input);}
 git(prefix+"-add",cwd,["-c","core.autocrlf=false","-c","core.safecrlf=false","add","--",".gitattributes",...cases]);
 git(prefix+"-check",cwd,["diff","--cached","--check"],generalized?0:2);
 for(const [i,p]of cases.entries()){
  const blob=git(prefix+"-blob-"+i,cwd,["show",":"+p]);assert.equal(blob.equals(input),generalized);
  independent.push({generalized,path:p,inputSha256:digest(input),indexedSha256:digest(blob),exact:blob.equals(input)});
 }
 if(generalized){
  const controls=["src/negative.ts",".flowkit/runs/control/context.json",".flowkit/artifacts/new-delivery/changes/new-change/proof/summary.json"];
  for(const p of controls){fs.mkdirSync(path.dirname(path.join(cwd,p)),{recursive:true});fs.writeFileSync(path.join(cwd,p),"{}  \n");}
  git("controls-add",cwd,["add","--",...controls]);
  const failure=git("controls-check",cwd,["diff","--cached","--check"],2).toString();
  for(const p of controls)assert(failure.includes(p),p);
  for(const p of cases)assert(!failure.includes(p),p);
 }
}
assert(snapshot.equals(fs.readFileSync(".gitattributes")));
git("repository-diff-check",repo,["diff","--check"]);
const inputs=["AGENTS.md",".agents/skills/review-explore/SKILL.md","config/tools/toolchain.lock.json",".flowkit/project.json",".flowkit/memos.json","flowkit-next-delivery-change-plan.md","flowkit-next-d05-decoupling-analysis.md","openspec/specs/foundation-cli-surface/spec.md","openspec/specs/single-action-execution-terminal-boundary/spec.md","openspec/specs/run-result-persistence/spec.md","openspec/specs/action-package-and-result-admission/spec.md","src/domain/policy-and-next-boundary.ts"].map(ref);
const report={kind:"reviewer-bounded-explore-audit",completedAt:new Date().toISOString(),method:ref(fileURLToPath(import.meta.url)),reviewedResult:ref(run+"/result.json"),sourceHead:context.sourceHead,verifiedRefCount:verified.size,verifiedRefs:[...verified.values()],inputs,commands,independentRawStreamCases:independent,structuredTextControlsPreserved:3,authorObservedFacts:{hostTransport:{requestCount:1,responseCount:1,nextInvocations:0},topologyCounterexamples:continuity.checks.length,baselineTests:30},limitations:["Independent Git attribute fixture only; no product implementation or Formal Full Test.","Host transport inputs/outputs/method verified; actual Reviewer live transport is recorded separately.","Topology model is not a canonical Run resolver; Proposal must define schema/Role/Policy edges and prepare/persistence failure ordering.","Real repository attributes, index and Author artifacts are not edited."]};
save("summary.json",report);
console.log(JSON.stringify({summary:relative(path.join(out,"summary.json")),refs:verified.size,rawCases:independent.length,structuredControls:3}));

