import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";import{spawnSync}from"node:child_process";import{fileURLToPath}from"node:url";
const root=process.cwd(),proof=path.dirname(fileURLToPath(import.meta.url)),attempt=process.argv[2];if(!/^attempt-\d+$/.test(attempt??""))throw Error("new attempt required");const out=path.join(proof,attempt);fs.mkdirSync(out);
const ref=p=>{const b=fs.readFileSync(p);return{path:path.relative(root,p).replaceAll("\\","/"),bytes:b.length,sha256:crypto.createHash("sha256").update(b).digest("hex")}};
const save=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+"\n",{flag:"wx"});
const run=".flowkit/runs/20260908-05-lightweight-workflow-management/004-decouple-full-test-from-repository-tracking/";
const author=JSON.parse(fs.readFileSync(run+"20260909-034-apply/result.json","utf8"));let count=0;
function verify(v){if(!v||typeof v!=="object")return;if(typeof v.path==="string"&&typeof v.sha256==="string"&&Number.isInteger(v.bytes)){const a=ref(v.path);if(a.sha256!==v.sha256||a.bytes!==v.bytes)throw Error("input drift "+v.path);count++;}for(const c of Object.values(v))verify(c);}
verify(author);
const index=JSON.parse(fs.readFileSync(author.facts.proofRefs[0].path,"utf8"));verify(index);
const approved=JSON.parse(fs.readFileSync(author.approvedProposalReview.path,"utf8"));if(approved.verdict!=="approved"||author.previousRunId!==approved.runId)throw Error("wrong chain");
const commands=[];
function runCommand(id,program,args){const startedAt=new Date().toISOString();const r=spawnSync(program,args,{cwd:root,encoding:null,windowsHide:true,maxBuffer:32*1024*1024});for(const s of["stdout","stderr"])fs.writeFileSync(path.join(out,id+"."+s+".txt"),r[s]??Buffer.alloc(0),{flag:"wx"});const c={id,program,args,cwd:root,startedAt,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?.message??null,stdout:ref(path.join(out,id+".stdout.txt")),stderr:ref(path.join(out,id+".stderr.txt"))};save(id+".command.json",c);commands.push(c);console.log(JSON.stringify({id,exitCode:c.exitCode,error:c.error}));}
runCommand("probe",process.execPath,["--import","tsx",path.join(proof,"probe.mjs"),out]);
runCommand("focused",process.execPath,["--import","tsx","--test","tests/unit/domain/full-test-input.test.ts","tests/unit/domain/full-test-storage.test.ts","tests/unit/domain/delivery-full-test-execution.test.ts","tests/unit/domain/delivery-final-execution.test.ts","tests/unit/domain/delivery-required-evidence-source.test.ts","tests/unit/domain/code-gate-boundary.test.ts"]);
runCommand("typecheck",process.execPath,["node_modules/typescript/bin/tsc","--noEmit"]);
runCommand("openspec",process.execPath,["C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js","validate","decouple-full-test-from-repository-tracking","--strict"]);
const s={kind:"independent-review-apply-checks",verifiedAuthorReferences:count,reviewedResult:ref(run+"20260909-034-apply/result.json"),commands,allCommandsExitZero:commands.every(c=>c.exitCode===0&&c.error===null),notFormalFullTest:true};save("summary.json",s);console.log(JSON.stringify({summary:ref(path.join(out,"summary.json")),allCommandsExitZero:s.allCommandsExitZero,verifiedAuthorReferences:count}));process.exitCode=s.allCommandsExitZero?0:1;
