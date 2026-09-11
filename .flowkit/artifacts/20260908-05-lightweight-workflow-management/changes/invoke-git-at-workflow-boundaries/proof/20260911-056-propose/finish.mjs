import fs from "node:fs/promises";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
const run=".flowkit/runs/20260908-05-lightweight-workflow-management/006-invoke-git-at-workflow-boundaries/20260911-056-propose",proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260911-056-propose",root="openspec/changes/invoke-git-at-workflow-boundaries";
const json=async p=>JSON.parse(await fs.readFile(p,"utf8"));
const ref=async p=>{const b=await fs.readFile(p);return {path:p,bytes:b.length,sha256:createHash("sha256").update(b).digest("hex")};};
const verify=async r=>assert.deepEqual(await ref(r.path),{path:r.path,bytes:r.bytes,sha256:r.sha256});
const ctx=await json(run+"/context.json"),review=await json(ctx.acceptedReview);
assert.equal(review.verdict,"approved");assert.equal(review.nextBoundary,"propose");
for(const r of [review.reviewedExplore,review.reviewedResult,review.reviewedContext,review.reviewReport])await verify(r);
const ancestor=await json(review.reviewedResult.path);
for(const r of ancestor.artifacts)await verify(r);
const caps=["repository-integration-and-next-base-continuity","delivery-operation-execution-and-start-continuity"];
const blocks=t=>[...t.matchAll(/^### Requirement: ([^\r\n]+)\r?\n[\s\S]*?(?=^### Requirement: |^## (?:MODIFIED|ADDED|REMOVED) Requirements|$(?![\s\S]))/gm)];
let modified=0,added=0;
for(const cap of caps){
 const main=await fs.readFile("openspec/specs/"+cap+"/spec.md","utf8");
 const delta=await fs.readFile(root+"/specs/"+cap+"/spec.md","utf8");
 for(const section of delta.split(/^## /m).slice(1))for(const b of blocks(section)){
   assert(/\bSHALL\b/.test(b[0]));assert(/#### Scenario:/.test(b[0]));
   if(section.startsWith("MODIFIED")){
     modified++;const prior=blocks(main).find(x=>x[1].trim()===b[1].trim());assert(prior,b[1]);
     for(const scenario of prior[0].matchAll(/^#### Scenario: ([^\r\n]+)/gm))assert(b[0].includes(scenario[0]),"lost scenario "+scenario[0]);
   }else {added++;assert(!blocks(main).some(x=>x[1].trim()===b[1].trim()));}
 }
}
assert.equal(modified,4);assert.equal(added,3);
const tasks=await fs.readFile(root+"/tasks.md","utf8");
assert.equal((tasks.match(/^- \[ \]/gm)||[]).length,17);assert(!tasks.includes("- [x]"));
for(const id of ["strict-validation","planning-status"]){const cmd=await json(proof+"/"+id+"/command.json");assert.equal(cmd.exitCode,0);await verify(cmd.stdout);await verify(cmd.stderr);}
const status=await json(proof+"/planning-status/stdout.txt");assert(status.isPlanningComplete);assert(status.artifacts.every(a=>a.status==="done"));
const artifacts=await Promise.all(["proposal.md","design.md","tasks.md",...caps.map(c=>"specs/"+c+"/spec.md")].map(f=>ref(root+"/"+f)));
const proofRefs=[];async function walk(d){for(const e of await fs.readdir(d,{withFileTypes:true})){const p=d+"/"+e.name;if(e.isDirectory())await walk(p);else proofRefs.push(await ref(p));}}
await walk(proof);await fs.writeFile(proof+"/evidence-index.json",JSON.stringify(proofRefs,null,2)+"\n",{flag:"wx"});
const result={kind:"external-orchestrator-propose-result",canonicalFlowkitRuntimeRun:false,executionMode:"independent-bootstrap",role:"author",action:"propose",deliveryId:ctx.deliveryId,changeId:ctx.changeId,projectOrdinal:38,runId:ctx.runId,previousRunId:ctx.previousRunId,status:"terminal",authorConclusion:"PASS",meaning:"计划收敛与结构验证通过，待独立 review-propose；不代表实现或 Review approved。",startedAt:ctx.startedAt,completedAt:new Date().toISOString(),acceptedReview:await ref(ctx.acceptedReview),acceptedExplore:review.reviewedExplore,ancestorExplore:review.reviewedResult,artifacts,ancestorHandoff:[{source:review.reviewedResult,scope:"激活 manifest、scaffold、Explore 与必要 proof refs；无删除。"},{source:await ref(ctx.acceptedReview),scope:"独立审查及相关依据、Owner 决定；不重写原材料。"}],removedPaths:[],ownerDecisionsRelevant:ctx.ownerDecisionsRelevant,verification:{openspecStrictExitCode:0,allPlanningArtifactsDone:true,modifiedRequirements:modified,addedRequirements:added,priorScenariosPreserved:true,uncheckedTasks:17,implementationAcceptance:false,formalD05FullTest:false},proofRefs:await Promise.all([proof+"/convergence.md",proof+"/evidence-index.json"].map(ref)),runArtifacts:await Promise.all([run+"/action.md",run+"/context.json"].map(ref)),blockingUnknowns:[],nextBoundary:"review-propose",reviewerVerdict:null,productionMutation:false,testMutation:false,skillMutation:false,mainSpecMutation:false,manifestMutation:false,historicalRunMutation:false,gitMutation:false,applyExecuted:false,stop:true};
await fs.writeFile(run+"/result.json",JSON.stringify(result,null,2)+"\n",{flag:"wx"});
assert.deepEqual(await json(run+"/result.json"),result);
assert.deepEqual((await fs.readdir(run)).sort(),["action.md","context.json","result.json"]);
console.log(JSON.stringify({result:await ref(run+"/result.json"),planningArtifacts:artifacts.length,modified,added,uncheckedTasks:17,nextBoundary:"review-propose",readBack:true,stop:true}));
