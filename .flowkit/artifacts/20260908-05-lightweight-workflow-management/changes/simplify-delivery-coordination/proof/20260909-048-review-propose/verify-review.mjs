import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-048-review-propose";
const runs=".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/";
const change="openspec/changes/simplify-delivery-coordination";
const attempt=process.argv[2];
assert.match(attempt??"",/^attempt-\d{2}$/);
const out=path.join(proof,attempt);
fs.mkdirSync(out);
const json=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const digest=b=>createHash("sha256").update(b).digest("hex");
const ref=p=>{const b=fs.readFileSync(p);return {path:p.replaceAll("\\","/"),bytes:b.length,sha256:digest(b)}};
const save=(name,data)=>{const p=path.join(out,name);fs.writeFileSync(p,data,{flag:"wx"});return ref(p)};
const refs=new Map();
function collect(value){
 if(!value||typeof value!=="object")return;
 if(typeof value.path==="string"&&typeof value.bytes==="number"&&typeof value.sha256==="string")refs.set(value.path,value);
 for(const v of Object.values(value))collect(v);
}
const latest=json(runs+"20260909-047-revise-propose/result.json");
assert.equal(latest.action,"revise-propose");assert.equal(latest.status,"terminal");
assert.equal(latest.previousRunId,"20260909-046-review-propose");assert.equal(latest.nextBoundary,"review-propose");
collect(latest);
const assessment=json(latest.findingResponses[0].assessment.path);
collect(assessment.commands);
const priorReview=json(latest.acceptedFindingSource.path);
assert.equal(priorReview.verdict,"changes-requested");
assert.deepEqual(priorReview.findings.map(x=>x.id),["R046-01"]);
collect({reviewedResult:priorReview.reviewedResult,reviewReport:priorReview.reviewReport});
const proposal=json(runs+"20260909-045-propose/result.json");
collect(proposal.acceptedReview);
const exploreReview=json(proposal.acceptedReview.path);
assert.equal(exploreReview.verdict,"approved");
assert.equal(exploreReview.proposalReady,true);
collect({reviewedExplore:exploreReview.reviewedExplore,coordinationAtReview:exploreReview.coordinationAtReview});
const oldByPath=new Map(proposal.artifacts.map(x=>[x.path,x]));
const plan=latest.artifacts.filter(x=>x.path.startsWith(change+"/"));
const changed=plan.filter(x=>oldByPath.get(x.path)?.sha256!==x.sha256).map(x=>x.path).sort();
assert.deepEqual(changed,[...latest.scope.changedPlanningFiles].sort());
assert.equal(changed.length,4);
for(const pair of assessment.beforeAfter){
 assert.deepEqual(pair.before,oldByPath.get(pair.before.path));
 assert.deepEqual(pair.after,plan.find(x=>x.path===pair.after.path));
 collect(pair.after);
}
const oldAudit=json(priorReview.reviewEvidence.inputAudit.path);
for(const item of oldAudit.deltaAudit)collect(item.main);
const verified=[...refs.values()].map(expected=>{
 const actual=ref(expected.path);
 assert.equal(actual.bytes,expected.bytes,expected.path);
 assert.equal(actual.sha256,expected.sha256,expected.path);
 return actual;
});
const caps=["delivery-finalization","delivery-operation-execution-and-start-continuity","repository-integration-and-next-base-continuity"];
const names=text=>[...text.matchAll(/^### Requirement: (.+)$/gm)].map(x=>x[1].trim());
const deltas=caps.map(cap=>{
 const mainPath="openspec/specs/"+cap+"/spec.md",deltaPath=change+"/specs/"+cap+"/spec.md";
 const existing=names(fs.readFileSync(mainPath,"utf8")),text=fs.readFileSync(deltaPath,"utf8");
 const changes=[];
 for(const section of text.split(/(?=^## (?:ADDED|MODIFIED|REMOVED) Requirements)/m)){
  const match=section.match(/^## (ADDED|MODIFIED|REMOVED) Requirements/m);
  if(!match)continue;
  for(const title of names(section)){
   assert.equal(existing.includes(title),match[1]!=="ADDED",cap+":"+title);
   changes.push({operation:match[1],title});
  }
 }
 return {capability:cap,changes};
});
assert.equal((fs.readFileSync(change+"/tasks.md","utf8").match(/^- \[ \]/gm)||[]).length,19);
assert.equal((fs.readFileSync(change+"/tasks.md","utf8").match(/^- \[x\]/gmi)||[]).length,0);
const audit=save("input-audit.json",JSON.stringify({
 sourceResult:ref(runs+"20260909-047-revise-propose/result.json"),verifiedReferences:verified,
 changedPlanningFiles:changed,unchangedPlanningFiles:plan.filter(x=>!changed.includes(x.path)).map(x=>x.path),
 priorPlanningIdentitiesMatched:true,canonicalSpecsUnchanged:true,deltas,uncheckedTasks:19,
 sourceReadbacks:["src/internal/delivery-final-coordination.ts","src/domain/delivery-final-execution.ts","src/domain/delivery-repository-integration-execution.ts","src/domain/policy-and-next-boundary.ts"].map(ref),
 meaning:"Current bytes and structural cross-reference verification; not implementation acceptance or semantic approval."
},null,2)+"\n");
const commands=[];
for(const [name,args] of [["version",["--version"]],["status",["status","--change","simplify-delivery-coordination","--json"]],["validate",["validate","simplify-delivery-coordination","--strict"]]]){
 const executable="C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js",startedAt=new Date().toISOString();
 const result=spawnSync(process.execPath,[executable,...args],{cwd:process.cwd(),encoding:null,windowsHide:true,timeout:60000,maxBuffer:4000000,env:{...process.env,OPENSPEC_TELEMETRY_DISABLED:"1"}});
 const metadata={name,program:process.execPath,args:[executable,...args],cwd:process.cwd(),startedAt,completedAt:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?{code:result.error.code,message:result.error.message}:null,stdout:save(name+".stdout.txt",result.stdout??Buffer.alloc(0)),stderr:save(name+".stderr.txt",result.stderr??Buffer.alloc(0))};
 commands.push(metadata);save(name+".command.json",JSON.stringify(metadata,null,2)+"\n");if(result.error)break;
}
const summary={kind:"independent-review-propose-read-only-checks",node:process.version,platform:process.platform,attempt,inputAudit:audit,verifiedReferences:verified.length,changedPlanningFiles:changed,deltaCounts:deltas.flatMap(x=>x.changes).reduce((a,x)=>(a[x.operation]=(a[x.operation]??0)+1,a),{}),commands,allCommandsSucceeded:commands.length===3&&commands.every(x=>x.exitCode===0&&!x.error),implementationAcceptance:false,formalFullTest:false};
save("summary.json",JSON.stringify(summary,null,2)+"\n");console.log(JSON.stringify(summary,null,2));process.exitCode=summary.allCommandsSucceeded?0:1;
