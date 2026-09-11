import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-050-review-apply";
const runRoot=".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/";
const authorProof=proof.replace("050-review-apply","049-apply");
const attempt=process.argv[2];assert.match(attempt??"",/^attempt-\d{2}$/);
const out=path.join(proof,attempt);fs.mkdirSync(out);
const digest=b=>createHash("sha256").update(b).digest("hex");
const ref=p=>{const b=fs.readFileSync(p);return{path:p.replaceAll("\\","/"),bytes:b.length,sha256:digest(b)}};
const json=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const save=(name,data)=>{const p=path.join(out,name);fs.writeFileSync(p,data,{flag:"wx"});return ref(p)};
const refs=new Map();
function collect(v){if(!v||typeof v!=="object")return;if(typeof v.path==="string"&&typeof v.bytes==="number"&&typeof v.sha256==="string")refs.set(v.path,{path:v.path,bytes:v.bytes,sha256:v.sha256});for(const x of Object.values(v))collect(x);}
const author=json(runRoot+"20260909-049-apply/result.json");
assert.equal(author.previousRunId,"20260909-048-review-propose");assert.equal(author.status,"terminal");assert.equal(author.nextBoundary,"review-apply");
collect(author);
const approved=json(author.approvedProposal.path),review=json(author.approvedReview.path);
assert.equal(review.verdict,"approved");
for(const expected of approved.artifacts.filter(x=>x.path.startsWith("openspec/changes/"))){
 const bytes=fs.readFileSync(expected.path);
 if(expected.path.endsWith("/tasks.md"))assert.equal(digest(Buffer.from(bytes.toString("utf8").replaceAll("- [x]","- [ ]"))),expected.sha256);
 else assert.equal(digest(bytes),expected.sha256);
}
assert.equal((fs.readFileSync(author.planningArtifacts.find(x=>x.path.endsWith("/tasks.md")).path,"utf8").match(/^- \[x\]/gm)||[]).length,19);
for(const deleted of author.removedPaths)assert.equal(fs.existsSync(deleted),false,deleted);
const prior=json(runRoot+"20260909-044-review-explore/result.json");collect(prior.coordinationAtReview);
const index=json(authorProof+"/evidence-index.json");
const wanted=new Set(index.currentLabels.flatMap(label=>[label+".json",label+".stdout.txt",label+".stderr.txt"]));
for(const name of ["linux-source-02.json","linux-run-02.sh","candidate-checks.mjs"])wanted.add(name);
for(const file of index.files)if(wanted.has(path.basename(file.path)))collect(file);
const commandEvidence=index.currentLabels.map(label=>{
 const metadata=json(authorProof+"/"+label+".json");
 assert.equal(metadata.exitCode,0,label);assert.equal(metadata.error,null,label);
 const stdout=fs.readFileSync(authorProof+"/"+label+".stdout.txt","utf8");
 return{label,metadata,tail:stdout.split(/\r?\n/).slice(-12).join("\n")};
});
const linux=json(authorProof+"/linux-source-02.json");
const verifiedLinux=linux.files.map(x=>{
 const actual=ref(x.artifact);assert.equal(actual.bytes,x.bytes,x.artifact);assert.equal(actual.sha256,x.contentSha256,x.artifact);return actual;
});
const verified=[...refs.values()].map(x=>{const actual=ref(x.path);assert.equal(actual.bytes,x.bytes,x.path);assert.equal(actual.sha256,x.sha256,x.path);return actual;});
const audit=save("input-audit.json",JSON.stringify({reviewedResult:ref(runRoot+"20260909-049-apply/result.json"),verifiedReferences:verified,verifiedLinuxInputs:verifiedLinux,commandEvidence,approvedPlanningUnchangedExceptCheckboxes:true,implementationCount:author.implementationArtifacts.length,removedPaths:author.removedPaths},null,2)+"\n");
const commands=[];
async function capture(name,program,args){
 const startedAt=new Date().toISOString(),stdout=[],stderr=[];
 let error=null,signal=null;
 const exitCode=await new Promise(resolve=>{
  const child=spawn(program,args,{cwd:process.cwd(),windowsHide:true,env:{...process.env,OPENSPEC_TELEMETRY_DISABLED:"1"}});
  child.stdout?.on("data",b=>stdout.push(b));child.stderr?.on("data",b=>stderr.push(b));
  child.on("error",e=>{error={code:e.code,message:e.message};});
  child.on("close",(code,s)=>{signal=s;resolve(code)});
 });
 const metadata={name,program,args,cwd:process.cwd(),startedAt,completedAt:new Date().toISOString(),exitCode,signal,error,stdout:save(name+".stdout.txt",Buffer.concat(stdout)),stderr:save(name+".stderr.txt",Buffer.concat(stderr))};
 commands.push(metadata);save(name+".command.json",JSON.stringify(metadata,null,2)+"\n");console.log(JSON.stringify({name,exitCode,error}));return metadata;
}
const tool="C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
for(const [name,args] of [["version",[tool,"--version"]],["domain",["--import","tsx","--test","tests/unit/domain/*.test.ts"]],["typecheck",["node_modules/typescript/bin/tsc","--noEmit"]],["openspec-strict",[tool,"validate","simplify-delivery-coordination","--strict"]]]){
 const completed=await capture(name,process.execPath,args);if(completed.error)break;
}
const summary={kind:"independent-review-apply-current-checks",attempt,node:process.version,platform:process.platform,inputAudit:audit,verifiedReferences:verified.length,verifiedLinuxInputs:verifiedLinux.length,commands,allCommandsSucceeded:commands.length===4&&commands.every(x=>x.exitCode===0&&!x.error),formalD05FullTest:false};
save("summary.json",JSON.stringify(summary,null,2)+"\n");console.log(JSON.stringify({summary:ref(path.join(out,"summary.json")),allCommandsSucceeded:summary.allCommandsSucceeded}));process.exitCode=summary.allCommandsSucceeded?0:1;
