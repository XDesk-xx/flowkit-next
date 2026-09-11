import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {spawn,execFileSync} from "node:child_process";
import {parse} from "yaml";
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260909-055-review-explore";
const authorProof=proof.replace("055-review-explore","054-explore");
const run=".flowkit/runs/20260908-05-lightweight-workflow-management/006-invoke-git-at-workflow-boundaries/20260909-054-explore/";
const attempt=process.argv[2];assert.match(attempt??"",/^attempt-\d{2}$/);
const out=path.join(proof,attempt);fs.mkdirSync(out);
const hash=b=>createHash("sha256").update(b).digest("hex");
const ref=p=>{const b=fs.readFileSync(p);return{path:p.replaceAll("\\","/"),bytes:b.length,sha256:hash(b)}};
const json=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const save=(n,b)=>{const p=path.join(out,n);fs.writeFileSync(p,b,{flag:"wx"});return ref(p)};
const author=json(run+"result.json"),context=json(run+"context.json");
assert.equal(author.status,"terminal");assert.equal(author.action,"explore");assert.equal(author.previousRunId,null);assert.equal(author.nextBoundary,"review-explore");
const previous=json(author.previousDeliveryRun.path);assert.equal(previous.action,"archive");assert.equal(previous.status,"terminal");assert.equal(previous.changeId,"simplify-delivery-coordination");
assert.equal(json(previous.acceptedReview.path).verdict,"approved");
const refs=new Map();function collect(v){if(!v||typeof v!=="object")return;if(typeof v.path==="string"&&typeof v.bytes==="number"&&typeof v.sha256==="string")refs.set(v.path,{path:v.path,bytes:v.bytes,sha256:v.sha256});for(const x of Object.values(v))collect(x);}
collect(author);collect(json(authorProof+"/evidence-index.json"));collect(json(authorProof+"/source-index.json"));collect(previous.acceptedReview);collect(previous.specSync.artifacts);
const verified=[...refs.values()].map(expected=>{const actual=ref(expected.path);assert.deepEqual(actual,expected);return actual});
const manifestPath="openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml";
const currentManifest=fs.readFileSync(manifestPath,"utf8"),manifest=parse(currentManifest);
const target=manifest.changes.filter(x=>x.id===author.changeId);assert.equal(target.length,1);assert.equal(target[0].state,"active");assert.equal(target[0].projectOrdinal,38);
for(const id of target[0].dependsOn)assert.equal(manifest.changes.find(x=>x.id===id).state,"completed");
const owner=manifest.ownerDecisions.filter(x=>x.changeId===author.changeId);assert.equal(owner.length,1);assert.equal(owner[0].decision,"activate-change");assert.equal(owner[0].sourceRef,context.ownerSourceRef);assert.deepEqual(owner[0].scope,["explore"]);
const artifacts=fs.readdirSync("openspec/changes/"+author.changeId).sort();assert.deepEqual(artifacts,[".openspec.yaml","explore.md"]);
const observations=json(authorProof+"/observations.json");assert.equal(observations.observations.length,8);
const native=json(authorProof+"/native-git-observations.json");assert.equal(native.commands.length,18);
for(const c of native.commands)for(const k of ["stdout","stderr"]){const expected=c[k],b=fs.readFileSync(authorProof+"/"+expected.file);assert.equal(b.length,expected.bytes);assert.equal(hash(b),expected.sha256);}
const priorProbe=json(authorProof+"/probe-01/command.json");assert.equal(priorProbe.exitCode,1);
for(const folder of ["probe-02","native-git-01","openspec-status"]){const c=json(authorProof+"/"+folder+"/command.json");assert.equal(c.exitCode,0,folder);assert.equal(c.error,null,folder);}
const head=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8",windowsHide:true}).trim();assert.equal(head,context.repositoryHead);
const deltaPaths=execFileSync("git",["diff","--name-only"],{encoding:"utf8",windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);assert.deepEqual(deltaPaths,[manifestPath]);
const baseline=execFileSync("git",["show","HEAD:"+manifestPath],{encoding:"utf8",windowsHide:true});
const semanticBaseline=parse(baseline),semanticCurrent=structuredClone(manifest);
const changed=semanticCurrent.changes.find(x=>x.id===author.changeId);changed.state="planned";delete changed.projectOrdinal;
semanticCurrent.ownerDecisions=semanticCurrent.ownerDecisions.filter(x=>x.changeId!==author.changeId);assert.deepEqual(semanticCurrent,semanticBaseline);
const inputAudit=save("input-audit.json",JSON.stringify({reviewedResult:ref(run+"result.json"),verifiedReferences:verified,sourceHead:head,ownerSourceRef:context.ownerSourceRef,onlyIntendedActivationSemanticDelta:true,changeArtifacts:artifacts,currentBehavior:observations.observations.map(x=>({mode:x.mode,status:x.outcome.status,reason:x.outcome.reason??null,commits:x.commits,providers:x.providers})),nativeCommandExitCodes:native.commands.map(x=>x.exitCode),initialAuthorSandboxFailure:priorProbe},null,2)+"\n");
const commands=[];
async function capture(name,args){
 const startedAt=new Date().toISOString(),stdout=[],stderr=[];let error=null,signal=null;
 const exitCode=await new Promise(resolve=>{try{const child=spawn(process.execPath,args,{cwd:process.cwd(),windowsHide:true,env:{...process.env,OPENSPEC_TELEMETRY_DISABLED:"1"}});child.stdout.on("data",b=>stdout.push(b));child.stderr.on("data",b=>stderr.push(b));child.on("error",e=>{error={code:e.code,message:e.message};});child.on("close",(c,s)=>{signal=s;resolve(c)});}catch(e){error={code:e.code,message:e.message};resolve(null);}});
 const metadata={name,program:process.execPath,args,cwd:process.cwd(),startedAt,completedAt:new Date().toISOString(),exitCode,signal,error,stdout:save(name+".stdout.txt",Buffer.concat(stdout)),stderr:save(name+".stderr.txt",Buffer.concat(stderr))};save(name+".command.json",JSON.stringify(metadata,null,2)+"\n");commands.push(metadata);console.log(JSON.stringify({name,exitCode,error}));return metadata;
}
const tool="C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
for(const [name,args] of [["version",[tool,"--version"]],["current-behavior",["--import","tsx",proof+"/probe.mjs"]],["native-git",[proof+"/native-git-proof.mjs"]],["openspec-status",[tool,"status","--change","invoke-git-at-workflow-boundaries","--json"]]]){
 const c=await capture(name,args);if(c.error)break;
}
const allCommandsSucceeded=commands.length===4&&commands.every(c=>c.exitCode===0&&!c.error);
const summary={kind:"independent-review-explore-proof-checks",attempt,node:process.version,platform:process.platform,inputAudit,verifiedReferences:verified.length,commands,allCommandsSucceeded,implementationAcceptance:false,formalD05FullTest:false};
save("summary.json",JSON.stringify(summary,null,2)+"\n");console.log(JSON.stringify({summary:ref(path.join(out,"summary.json")),allCommandsSucceeded}));process.exitCode=allCommandsSucceeded?0:1;
