import fs from"node:fs";import path from"node:path";import crypto from"node:crypto";import{spawnSync}from"node:child_process";import{fileURLToPath}from"node:url";
const root=process.cwd(),proof=path.dirname(fileURLToPath(import.meta.url)),attempt=process.argv[2];if(!/^attempt-\d+$/.test(attempt??""))throw Error("new attempt required");const out=path.join(proof,attempt);fs.mkdirSync(out);
const ref=p=>{const b=fs.readFileSync(p);return{path:path.relative(root,p).replaceAll("\\","/"),bytes:b.length,sha256:crypto.createHash("sha256").update(b).digest("hex")}};
const save=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+"\n",{flag:"wx"});
const run=".flowkit/runs/20260908-05-lightweight-workflow-management/004-decouple-full-test-from-repository-tracking/";
const author=JSON.parse(fs.readFileSync(run+"20260909-040-revise-apply/result.json","utf8"));let count=0;
function verify(v){if(!v||typeof v!=="object")return;if(typeof v.path==="string"&&typeof v.sha256==="string"&&Number.isInteger(v.bytes)){const a=ref(v.path);if(a.sha256!==v.sha256||a.bytes!==v.bytes)throw Error("input drift "+v.path);count++;}for(const c of Object.values(v))verify(c);}
verify(author);const idx=JSON.parse(fs.readFileSync(author.facts.proofRefs[0].path,"utf8"));verify(idx);
const prior=JSON.parse(fs.readFileSync(author.reviewedFindingsSource.path,"utf8"));if(prior.verdict!=="changes-requested"||author.previousRunId!==prior.runId)throw Error("chain mismatch");
const baseline=JSON.parse(fs.readFileSync(author.ancestorApply.path,"utf8"));
const old=new Map(baseline.cumulativeCandidateArtifacts.map(r=>[r.path,r.sha256]));
if(old.size!==author.cumulativeCandidateArtifacts.length || [...old.keys()].some(p=>!author.cumulativeCandidateArtifacts.some(r=>r.path===p)))throw Error("candidate coverage drift");
if(JSON.stringify(author.planningArtifacts)!==JSON.stringify(baseline.planningArtifacts))throw Error("planning drift");const changed=author.cumulativeCandidateArtifacts.filter(r=>old.get(r.path)!==r.sha256);
const actual=changed.map(r=>r.path).sort(),expected=author.revisionArtifacts.map(r=>r.path).sort();if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error("unreported revision drift");
save("input-audit.json",{reviewedResult:ref(run+"20260909-040-revise-apply/result.json"),verifiedReferences:count,revisionFiles:changed,otherCandidateFilesUnchanged:true,planningArtifacts:author.planningArtifacts});
const commands=[];
function call(id,program,args){const startedAt=new Date().toISOString();const r=spawnSync(program,args,{cwd:root,encoding:null,windowsHide:true,maxBuffer:32*1024*1024});for(const s of["stdout","stderr"])fs.writeFileSync(path.join(out,id+"."+s+".txt"),r[s]??Buffer.alloc(0),{flag:"wx"});const c={id,program,args,cwd:root,startedAt,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?.message??null,stdout:ref(path.join(out,id+".stdout.txt")),stderr:ref(path.join(out,id+".stderr.txt"))};save(id+".command.json",c);commands.push(c);console.log(JSON.stringify({id,exitCode:c.exitCode,error:c.error}));}
call("original-counterexamples",process.execPath,["--import","tsx",path.join(proof,"original-counterexamples.mjs"),out]);
call("node-option-scope",process.execPath,["--import","tsx",path.join(proof,"node-option-probe.mjs"),out]);
call("output-scope",process.execPath,["--import","tsx",path.join(proof,"output-probe.mjs"),out]);
call("focused",process.execPath,["--import","tsx","--test","tests/unit/domain/full-test-revision.test.ts","tests/unit/domain/full-test-input.test.ts","tests/unit/domain/full-test-storage.test.ts","tests/unit/domain/delivery-full-test-execution.test.ts","tests/unit/domain/delivery-final-execution.test.ts"]);
call("typecheck",process.execPath,["node_modules/typescript/bin/tsc","--noEmit"]);
call("openspec",process.execPath,["C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js","validate","decouple-full-test-from-repository-tracking","--strict"]);
const result={kind:"independent-review-apply-checks",inputAudit:ref(path.join(out,"input-audit.json")),commands,allCommandsExitZero:commands.every(c=>c.exitCode===0&&c.error===null),notFormalFullTest:true};save("summary.json",result);console.log(JSON.stringify({summary:ref(path.join(out,"summary.json")),allCommandsExitZero:result.allCommandsExitZero,verifiedReferences:count}));process.exitCode=result.allCommandsExitZero?0:1;
