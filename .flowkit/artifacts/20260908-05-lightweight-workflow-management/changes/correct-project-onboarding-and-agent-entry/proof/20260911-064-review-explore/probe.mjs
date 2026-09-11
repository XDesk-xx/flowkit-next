import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
const root=process.cwd(),proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/correct-project-onboarding-and-agent-entry/proof/20260911-064-review-explore",author=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/correct-project-onboarding-and-agent-entry/proof/20260911-063-explore";
const hash=b=>createHash("sha256").update(b).digest("hex");
const json=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const ref=p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:hash(b)};};
const base=fs.mkdtempSync(path.join(root,".tmp/review-onboarding-064-"));
const target=path.join(base,"target 项目");fs.mkdirSync(target);
const sentinel="existing project content\r\n";fs.writeFileSync(path.join(target,"existing.txt"),sentinel);
const runtime="C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js", cli=path.join(root,"dist/cli/entrypoint.js"),request=path.join(base,"request.json");
const commands=[];
function run(id,program,args,cwd,expected=0){
 const start=new Date().toISOString();
 const r=spawnSync(program,args,{cwd,encoding:null,windowsHide:true,maxBuffer:8*1024*1024,env:{...process.env,OPENSPEC_TELEMETRY_DISABLED:"1"}});
 const stdout=proof+"/"+id+".stdout.txt",stderr=proof+"/"+id+".stderr.txt";
 fs.writeFileSync(stdout,r.stdout??Buffer.alloc(0),{flag:"wx"});fs.writeFileSync(stderr,r.stderr??Buffer.alloc(0),{flag:"wx"});
 const record={id,program,args,cwd,startedAt:start,finishedAt:new Date().toISOString(),exitCode:r.status,error:r.error?.message??null,stdout:ref(stdout),stderr:ref(stderr)};
 commands.push(record);assert.equal(r.status,expected,JSON.stringify(record));
 return r.stdout??Buffer.alloc(0);
}
run("openspec-init",process.execPath,[runtime,"init",target,"--tools","none","--no-animation"],root);
assert(fs.existsSync(path.join(target,"openspec/config.yaml")));
assert(!fs.existsSync(path.join(target,".agents")));assert(!fs.existsSync(path.join(target,".github")));
function query(id,command,extra={},expected=0){
 fs.writeFileSync(request,JSON.stringify({repositoryRoot:target,flowkitHome:"C:/Users/xuser/.flowkit",...extra}));
 return JSON.parse(run(id,process.execPath,[cli,command,"--input",request],target,expected).toString());
}
const observations={idle:query("idle","next"),doctor:query("doctor","doctor")};
assert.equal(observations.idle.status,"idle");assert.equal(observations.idle.decision,null);assert.equal(observations.doctor.status,"pass");
const manifestDir=path.join(target,"openspec/delivery-groups");fs.mkdirSync(manifestDir);
const manifest=path.join(manifestDir,"example-delivery.yaml");
fs.writeFileSync(manifest,"id: example-delivery\nchanges:\n  - id: example-change\n    state: planned\n    dependsOn: []\n");
const selected={deliveryId:"example-delivery",changeId:"example-change"};
observations.planned=query("planned","next",selected);
assert.equal(observations.planned.decision.reason,"change-not-active");
const activation=id=>"  - ref: owner:"+"a".repeat(64)+"\n    decision: activate-change\n    deliveryId: example-delivery\n    changeId: "+id+"\n    sourceRef: SYNTHETIC-REVIEW-PROBE-NOT-OWNER-AUTHORITY\n    scope: [explore]\n";
fs.writeFileSync(manifest,"id: example-delivery\nchanges:\n  - id: example-change\n    state: active\n    dependsOn: []\nownerDecisions:\n"+activation("example-change"));
observations.first=query("first","next",selected);assert.equal(observations.first.decision.actionId,"explore");
observations.legacyRunOverride=query("old-run-override","next",{...selected,currentRunId:"invented"},2);
assert.equal(observations.legacyRunOverride.error.kind,"invalid-request");
observations.missingRuntime=query("missing-runtime","doctor",{flowkitHome:path.join(base,"missing-runtime")});
assert.equal(observations.missingRuntime.status,"fail");
fs.writeFileSync(manifest,"id: example-delivery\nchanges:\n  - id: example-change\n    state: active\n    dependsOn: []\n  - id: another-change\n    state: active\n    dependsOn: []\nownerDecisions:\n"+activation("example-change")+activation("another-change"));
observations.ambiguous=query("ambiguous","next",{},2);assert.equal(observations.ambiguous.error.kind,"context-ambiguous");
assert.equal(fs.readFileSync(path.join(target,"existing.txt"),"utf8"),sentinel);
for(const dir of [".flowkit/runs","skills","node_modules"])assert(!fs.existsSync(path.join(target,dir)),dir);
const docs=json(author+"/source-audit.json").documentsAtCheckpoint;
for(let i=0;i<docs.length;i++){const d=docs[i];const b=run("document-"+(i+1), "git",["show",d.gitSource],root);assert.equal(b.length,d.bytes);assert.equal(hash(b),d.sha256);assert(b.equals(fs.readFileSync(d.path)));}
const outputs={kind:"independent-review-explore-probe",checkedAt:new Date().toISOString(),node:process.version,platform:process.platform,fixtureRoot:base,observations,commands,
 documentsVerified:docs.length,existingTargetBytesPreserved:true,noActionRunCreated:true,syntheticActivation:true,
 limitations:["只验证当前机制与 Explore 决策依据，不是新接入实现或发行安装验收。","实际新 Agent 会话未执行；CLI 子进程不算真实新会话。","未执行 Action、Formal Full Test 或项目 Git mutation；git show 只读。"]};
fs.writeFileSync(proof+"/observations.json",JSON.stringify(outputs,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({queryCases:Object.keys(observations).length,openspecInit:true,documentsVerified:docs.length,commands:commands.length,actualNewSession:false,realAction:false,evidence:ref(proof+"/observations.json")},null,2));
