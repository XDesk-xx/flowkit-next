import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const root=process.cwd(), proof=path.dirname(fileURLToPath(import.meta.url));
const attempt=process.argv[2];
if(!/^attempt-\d+$/.test(attempt??"")) throw new Error("explicit new attempt required");
const out=path.join(proof,attempt); fs.mkdirSync(out);
const change="decouple-full-test-from-repository-tracking";
const group=".flowkit/runs/20260908-05-lightweight-workflow-management/004-"+change;
const ref=p=>{const b=fs.readFileSync(p);return{path:path.relative(root,p).replaceAll("\\","/"),bytes:b.length,sha256:crypto.createHash("sha256").update(b).digest("hex")};};
const save=(name,v)=>fs.writeFileSync(path.join(out,name),JSON.stringify(v,null,2)+"\n",{flag:"wx"});
const audit=[];
function checkRefs(v){
 if(!v||typeof v!=="object")return;
 if(typeof v.path==="string"&&typeof v.sha256==="string"&&Number.isInteger(v.bytes)){
  const a=ref(path.resolve(root,v.path)); if(a.bytes!==v.bytes||a.sha256!==v.sha256)throw new Error("input integrity mismatch "+v.path);
  audit.push(a);
 }
 for(const child of Object.values(v))checkRefs(child);
}
const proposal=JSON.parse(fs.readFileSync(group+"/20260909-032-propose/result.json","utf8"));
const review=JSON.parse(fs.readFileSync(group+"/20260909-031-review-explore/result.json","utf8"));
checkRefs(proposal);
checkRefs(JSON.parse(fs.readFileSync(proposal.verification.completedAttempt.path,"utf8")));
for(const r of proposal.verification.firstSandboxBlockedCommands)checkRefs(JSON.parse(fs.readFileSync(r.path,"utf8")));
if(proposal.previousRunId!=="20260909-031-review-explore"||proposal.nextBoundary!=="review-propose"||review.verdict!=="approved")throw new Error("wrong chain");
const caps=fs.readdirSync("openspec/changes/"+change+"/specs").sort();
const requirementChecks=[];
const blocks=s=>[...s.matchAll(/^### Requirement: (.+)\n([\s\S]*?)(?=^### Requirement: |^## |$(?![\s\S]))/gm)];
for(const cap of caps){
 const delta=fs.readFileSync("openspec/changes/"+change+"/specs/"+cap+"/spec.md","utf8").replaceAll("\r\n","\n");
 const main=fs.readFileSync("openspec/specs/"+cap+"/spec.md","utf8").replaceAll("\r\n","\n");
 const original=new Map(blocks(main).map(m=>[m[1],m[2]]));
 const modified=delta.split("## MODIFIED Requirements\n")[1]?.split(/^## /m)[0]??"";
 for(const m of blocks(modified)){
  const old=original.get(m[1]);if(old===undefined)throw new Error("unknown modified requirement");
  const names=[...old.matchAll(/^#### Scenario: (.+)$/gm)].map(s=>s[1]);
  const missing=names.filter(n=>!m[2].includes("#### Scenario: "+n+"\n"));
  if(missing.length)throw new Error("omitted preserved scenario "+missing);
  requirementChecks.push({cap,requirement:m[1],preservedScenarios:names.length});
 }
}
const textChecks=proposal.planningArtifacts.map(a=>{
 const b=fs.readFileSync(a.path),s=b.toString("utf8");
 return{...ref(path.resolve(root,a.path)),utf8Roundtrip:Buffer.from(s).equals(b),bom:b.subarray(0,3).equals(Buffer.from([239,187,191])),trailingWhitespaceLines:s.split(/\r?\n/).flatMap((line,i)=>/[ \t]+$/.test(line)?[i+1]:[])};
});
const tasks=fs.readFileSync("openspec/changes/"+change+"/tasks.md","utf8");
const taskIds=[...tasks.matchAll(/^- \[ \] (\d+\.\d+) /gm)].map(m=>m[1]);
if(!taskIds.length||new Set(taskIds).size!==taskIds.length||/^- \[x\]/mi.test(tasks))throw new Error("task structure invalid");
const commands=[];
function run(id,program,args){
 const startedAt=new Date().toISOString();
 const r=spawnSync(program,args,{cwd:root,encoding:null,windowsHide:true,maxBuffer:16*1024*1024});
 for(const s of ["stdout","stderr"])fs.writeFileSync(path.join(out,id+"."+s+".txt"),r[s]??Buffer.alloc(0),{flag:"wx"});
 const c={id,program,args,cwd:root,startedAt,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?.message??null,stdout:ref(path.join(out,id+".stdout.txt")),stderr:ref(path.join(out,id+".stderr.txt"))};
 save(id+".command.json",c);commands.push(c);return r;
}
const cli="C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
const version=run("openspec-version",process.execPath,[cli,"--version"]);
run("openspec-strict",process.execPath,[cli,"validate",change,"--strict"]);
const status=run("openspec-status",process.execPath,[cli,"status","--change",change,"--json"]);
run("git-diff-check","git",["diff","--check"]);
const completed=status.stdout?.length?JSON.parse(status.stdout.toString("utf8")).isPlanningComplete===true:false;
const passed=commands.every(c=>c.exitCode===0&&c.error===null)&&version.stdout?.toString().trim()==="1.10.0"&&completed&&textChecks.every(c=>c.utf8Roundtrip&&!c.bom&&!c.trailingWhitespaceLines.length);
const result={kind:"independent-review-propose-structural-check",implementationAcceptance:false,formalFullTest:false,chain:{proposal:ref(path.resolve(root,group+"/20260909-032-propose/result.json")),review:ref(path.resolve(root,group+"/20260909-031-review-explore/result.json")),verdict:review.verdict},referencesVerified:audit.length,audit,requirementChecks,textChecks,taskIds,commands,planningComplete:completed,passed,limitations:"Checks establish exact inputs and planning structure, not semantic approval or implementation PASS. git diff --check does not cover untracked plans; plans were separately read and text checked. No product invocation."};
save("verification.json",result);
console.log(JSON.stringify({passed,referencesVerified:audit.length,modifiedRequirements:requirementChecks.length,uncheckedTasks:taskIds.length,commands:commands.map(c=>({id:c.id,exitCode:c.exitCode,error:c.error})),summary:ref(path.join(out,"verification.json"))},null,2));
process.exitCode=passed?0:1;
