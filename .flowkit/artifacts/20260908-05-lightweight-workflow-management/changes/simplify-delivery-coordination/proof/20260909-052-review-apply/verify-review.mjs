import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-052-review-apply";
const authorProof=proof.replace("052-review-apply","051-revise-apply");
const runs=".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/";
const attempt=process.argv[2];assert.match(attempt??"",/^attempt-\d{2}$/);
const out=path.join(proof,attempt);fs.mkdirSync(out);
const digest=b=>createHash("sha256").update(b).digest("hex");
const ref=p=>{const b=fs.readFileSync(p);return{path:p.replaceAll("\\","/"),bytes:b.length,sha256:digest(b)}};
const json=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const save=(name,b)=>{const p=path.join(out,name);fs.writeFileSync(p,b,{flag:"wx"});return ref(p)};
const author=json(runs+"20260909-051-revise-apply/result.json");
assert.equal(author.status,"terminal");assert.equal(author.previousRunId,"20260909-050-review-apply");assert.equal(author.nextBoundary,"review-apply");
const prior=json(author.reviewedFindingsSource.path),base=json(author.ancestorApply.path);
assert.equal(prior.verdict,"changes-requested");assert.deepEqual(prior.findings.map(x=>x.id),["R050-01"]);
assert.equal(json(author.approvedReview.path).verdict,"approved");
const refs=new Map();
function collect(v){if(!v||typeof v!=="object")return;if(typeof v.path==="string"&&typeof v.sha256==="string"&&typeof v.bytes==="number")refs.set(v.path,{path:v.path,bytes:v.bytes,sha256:v.sha256});for(const x of Object.values(v))collect(x);}
collect(author);
const index=json(authorProof+"/evidence-index.json");collect(index.files);
const verified=[...refs.values()].map(expected=>{const actual=ref(expected.path);assert.deepEqual(actual,expected);return actual;});
const modified=new Set(author.revisionArtifacts.map(x=>x.path));
assert.deepEqual([...modified].sort(),["src/domain/delivery-final-execution.ts","tests/unit/domain/delivery-final-confirmation.test.ts"]);
const unaffected=base.implementationArtifacts.filter(x=>!modified.has(x.path)).map(x=>{const actual=ref(x.path);assert.equal(actual.sha256,x.sha256,x.path);assert.equal(actual.bytes,x.bytes,x.path);return actual;});
assert.deepEqual(author.removedPaths,base.removedPaths);for(const x of author.removedPaths)assert.equal(fs.existsSync(x),false);
assert.deepEqual(author.planningArtifacts,base.planningArtifacts);
const coordination=json(runs+"20260909-044-review-explore/result.json").coordinationAtReview;
if(coordination){const actual=ref(coordination.path);assert.equal(actual.sha256,coordination.sha256);}
const approved=json(author.approvedProposal.path);
for(const x of approved.artifacts.filter(x=>x.path.startsWith("openspec/changes/"))){
 let b=fs.readFileSync(x.path);if(x.path.endsWith("/tasks.md"))b=Buffer.from(b.toString("utf8").replaceAll("- [x]","- [ ]"));
 assert.equal(digest(b),x.sha256,x.path);
}
const current=fs.readFileSync("src/domain/delivery-final-execution.ts","utf8"),eol=current.includes("\r\n")?"\r\n":"\n";
const addedGuard="    !isPreparationInput(input) ||"+eol;
const addedCheck=['    try {','      const activeChanges = await observeOpenSpecActiveChanges({','        repositoryRoot,','        flowkitHome: input.flowkitHome,','      });','      if (activeChanges.changeIds.length !== 0) return false;','    } catch {','      return false;','    }',""].join(eol);
assert.equal(current.split(addedGuard).length,2);assert.equal(current.split(addedCheck).length,2);
const reversed=current.replace(addedGuard,"").replace(addedCheck,"");
assert.equal(digest(Buffer.from(reversed)),base.implementationArtifacts.find(x=>x.path==="src/domain/delivery-final-execution.ts").sha256);
const linux=json(authorProof+"/linux-source.json");
const linuxInputs=linux.files.map(x=>{const actual=ref(x.artifact);assert.equal(actual.bytes,x.bytes,x.artifact);assert.equal(actual.sha256,x.contentSha256,x.artifact);return actual;});
const labels=["regression-before","regression-after","openspec-strict","linux-container","linux-dependencies",...["win-final","linux-final"].flatMap(p=>["format-check","lint","typecheck","build","domain","acceptance","dependency-health","entropy-tests","entropy"].map(x=>p+"-"+x))];
const commandEvidence=labels.map(label=>{const metadata=json(authorProof+"/"+label+".json");assert.equal(metadata.error,null,label);assert.equal(metadata.exitCode,label==="regression-before"?1:0,label);return{label,metadata,tail:fs.readFileSync(authorProof+"/"+label+".stdout.txt","utf8").split(/\r?\n/).slice(-14).join("\n")};});
const inputAudit=save("input-audit.json",JSON.stringify({reviewedResult:ref(runs+"20260909-051-revise-apply/result.json"),verifiedReferences:verified,unchangedImplementationFrom049:unaffected,modifiedImplementationPaths:[...modified],productionDeltaExactlyGuardAndActiveObservation:true,planningUnchangedFrom049:true,approved047ContractUnchanged:true,removedPaths:author.removedPaths,linuxInputs,commandEvidence},null,2)+"\n");
const commands=[];
async function capture(name,args){
 const startedAt=new Date().toISOString(),stdout=[],stderr=[];let signal=null,error=null;
 const exitCode=await new Promise(resolve=>{
  try{
   const child=spawn(process.execPath,args,{cwd:process.cwd(),windowsHide:true,env:{...process.env,OPENSPEC_TELEMETRY_DISABLED:"1"}});
   child.stdout.on("data",b=>stdout.push(b));child.stderr.on("data",b=>stderr.push(b));
   child.on("error",e=>{error={code:e.code,message:e.message};});
   child.on("close",(code,s)=>{signal=s;resolve(code)});
  }catch(e){error={code:e.code,message:e.message};resolve(null);}
 });
 const metadata={name,program:process.execPath,args,cwd:process.cwd(),startedAt,completedAt:new Date().toISOString(),exitCode,signal,error,stdout:save(name+".stdout.txt",Buffer.concat(stdout)),stderr:save(name+".stderr.txt",Buffer.concat(stderr))};
 save(name+".command.json",JSON.stringify(metadata,null,2)+"\n");commands.push(metadata);console.log(JSON.stringify({name,exitCode,error}));
 return metadata;
}
const tool="C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js";
for(const [name,args] of [
 ["version",[tool,"--version"]],
 ["original-probe",[proof+"/probe-active-set.mjs"]],
 ["domain",["--import","tsx","--test","tests/unit/domain/*.test.ts"]],
 ["typecheck",["node_modules/typescript/bin/tsc","--noEmit"]],
 ["openspec-strict",[tool,"validate","simplify-delivery-coordination","--strict"]]
]){
 const completed=await capture(name,args);if(completed.error)break;
}
const summary={kind:"independent-review-apply-current-checks",attempt,node:process.version,platform:process.platform,inputAudit,verifiedReferences:verified.length,unchangedImplementationFrom049:unaffected.length,verifiedLinuxCurrentInputs:linuxInputs.length,commands,allCommandsSucceeded:commands.length===5&&commands.every(x=>x.exitCode===0&&!x.error),formalD05FullTest:false};
save("summary.json",JSON.stringify(summary,null,2)+"\n");console.log(JSON.stringify({summary:ref(path.join(out,"summary.json")),allCommandsSucceeded:summary.allCommandsSucceeded}));process.exitCode=summary.allCommandsSucceeded?0:1;
