import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
const root = process.cwd();
const proof = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-046-review-propose";
const attemptId = process.argv[2];
assert.match(attemptId ?? "", /^attempt-\d{2}$/);
const out = path.join(proof, attemptId);
fs.mkdirSync(out);
const sha = b => createHash("sha256").update(b).digest("hex");
const ref = p => { const b = fs.readFileSync(p); return {path:p.replaceAll("\\","/"),bytes:b.length,sha256:sha(b)}; };
const save = (name, data) => { const p=path.join(out,name); fs.writeFileSync(p,data,{flag:"wx"}); return ref(p); };
const json = p => JSON.parse(fs.readFileSync(p,"utf8"));
const sourceRun = ".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/20260909-045-propose";
const result = json(sourceRun+"/result.json");
assert.equal(result.runId,"20260909-045-propose");
assert.equal(result.previousRunId,"20260909-044-review-explore");
assert.equal(result.nextBoundary,"review-propose");
assert.equal(result.status,"terminal");
const refs = new Map();
function collect(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.path==="string" && typeof value.bytes==="number" && typeof value.sha256==="string") refs.set(value.path,value);
  for (const item of Object.values(value)) collect(item);
}
collect(result);
const assessment=json(result.assessment.path);
collect(assessment);
const accepted=json(result.acceptedReview.path);
assert.equal(accepted.verdict,"approved");
assert.equal(accepted.proposalReady,true);
assert.equal(accepted.reviewedRunId,"20260909-043-explore");
collect({reviewedResult:accepted.reviewedResult,reviewedExplore:accepted.reviewedExplore,coordinationAtReview:accepted.coordinationAtReview,reviewReport:accepted.reviewReport});
const audited = [...refs.values()].map(expected => {
 const actual=ref(expected.path);
 assert.equal(actual.bytes,expected.bytes,expected.path);
 assert.equal(actual.sha256,expected.sha256,expected.path);
 return actual;
});
const change="openspec/changes/simplify-delivery-coordination";
const capabilities=["delivery-finalization","delivery-operation-execution-and-start-continuity","repository-integration-and-next-base-continuity"];
function requirements(text) {
 const parts=text.split(/(?=^### Requirement: )/m);
 return parts.slice(1).map(part=>part.match(/^### Requirement: (.+)$/m)[1].trim());
}
const deltaAudit=capabilities.map(name=>{
 const mainPath="openspec/specs/"+name+"/spec.md";
 const deltaPath=change+"/specs/"+name+"/spec.md";
 const main=fs.readFileSync(mainPath,"utf8"),delta=fs.readFileSync(deltaPath,"utf8");
 const existing=requirements(main), changes=[];
 for(const section of delta.split(/(?=^## (?:ADDED|MODIFIED|REMOVED) Requirements)/m)) {
  const match=section.match(/^## (ADDED|MODIFIED|REMOVED) Requirements/m);
  if(!match)continue;
  for(const title of requirements(section)){
   assert.equal(existing.includes(title),match[1]!=="ADDED",name+":"+title);
   changes.push({operation:match[1],title});
  }
 }
 return {name,main:ref(mainPath),delta:ref(deltaPath),changes};
});
const tasks=fs.readFileSync(change+"/tasks.md","utf8");
assert.equal((tasks.match(/^- \[ \]/gm)||[]).length,19);
assert.equal((tasks.match(/^- \[x\]/gmi)||[]).length,0);
const audit=save("input-audit.json",JSON.stringify({sourceResult:ref(sourceRun+"/result.json"),verifiedReferences:audited,deltaAudit,uncheckedTasks:19,meaning:"Identity and structural cross-reference checks, not semantic approval or implementation acceptance."},null,2)+"\n");
const commands=[];
for(const [name,args] of [
 ["version",["--version"]],
 ["status",["status","--change","simplify-delivery-coordination","--json"]],
 ["validate",["validate","simplify-delivery-coordination","--strict"]]
]){
 const tool="C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
 const startedAt=new Date().toISOString();
 const run=spawnSync(process.execPath,[tool,...args],{cwd:root,encoding:null,windowsHide:true,timeout:60000,maxBuffer:4000000,env:{...process.env,OPENSPEC_TELEMETRY_DISABLED:"1"}});
 const command={name,program:process.execPath,args:[tool,...args],cwd:root,startedAt,completedAt:new Date().toISOString(),exitCode:run.status,signal:run.signal,error:run.error?{code:run.error.code,message:run.error.message}:null,stdout:save(name+".stdout.txt",run.stdout??Buffer.alloc(0)),stderr:save(name+".stderr.txt",run.stderr??Buffer.alloc(0))};
 commands.push(command);
 save(name+".command.json",JSON.stringify(command,null,2)+"\n");
 if(run.error)break;
}
const summary={kind:"independent-review-propose-read-only-checks",node:process.version,platform:process.platform,attemptId,inputAudit:audit,verifiedReferenceCount:audited.length,deltaCounts:deltaAudit.flatMap(x=>x.changes).reduce((acc,x)=>(acc[x.operation]=(acc[x.operation]??0)+1,acc),{}),commands,allCommandsSucceeded:commands.length===3&&commands.every(x=>x.exitCode===0&&!x.error),implementationAcceptance:false,formalFullTest:false};
save("summary.json",JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
process.exitCode=summary.allCommandsSucceeded?0:1;

