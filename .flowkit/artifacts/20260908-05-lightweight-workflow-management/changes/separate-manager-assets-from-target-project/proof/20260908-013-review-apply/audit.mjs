import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const own = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2] ?? "attempt-01";
assert.match(attempt, /^attempt-\d+$/);
const out = path.join(own, attempt);
fs.mkdirSync(out); // create-once; previous attempts are immutable
const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const ref = (p) => { const b = fs.readFileSync(p); return {path:rel(p),bytes:b.length,sha256:sha(b)}; };
const json = (p) => JSON.parse(fs.readFileSync(p,"utf8"));
const write = (name,value) => {
 const p=path.join(out,name);
 fs.writeFileSync(p,JSON.stringify(value,null,2)+"\n",{flag:"wx"});
 return ref(p);
};
const checks = [];
function command(label, executable, args, env = {}) {
 const startedAt=new Date().toISOString();
 const r=spawnSync(executable,args,{cwd:root,env:{...process.env,...env},encoding:null,timeout:180000,maxBuffer:32*1024*1024});
 for(const key of ["stdout","stderr"]) fs.writeFileSync(path.join(out,label+"."+key+".txt"),r[key]??Buffer.alloc(0),{flag:"wx"});
 const result={label,executable,args,cwd:root,environment:env,startedAt,completedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?{code:r.error.code,message:r.error.message}:null,stdout:ref(path.join(out,label+".stdout.txt")),stderr:ref(path.join(out,label+".stderr.txt"))};
 checks.push(write(label+".result.json",result));
 console.log(label,JSON.stringify({exitCode:r.status,error:result.error}));
 assert.equal(r.error,undefined,label+" spawn");
 assert.equal(r.status,0,label+" exit");
 return r.stdout;
}
function raw(executable,args) {
 const r=spawnSync(executable,args,{cwd:root,encoding:null,maxBuffer:16*1024*1024});
 assert.equal(r.error,undefined); assert.equal(r.status,0);
 return r.stdout;
}
function walk(dir) {
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
}
const D="20260908-05-lightweight-workflow-management",C="separate-manager-assets-from-target-project";
const author=".flowkit/artifacts/"+D+"/changes/"+C+"/proof/20260908-012-apply";
const chain=".flowkit/runs/"+D+"/"+C;
const verified=new Map();
function checkRefs(value) {
 if(!value || typeof value!=="object") return;
 if(typeof value.path==="string" && typeof value.bytes==="number" && typeof value.sha256==="string") {
  assert(!path.isAbsolute(value.path));
  const p=path.resolve(root,value.path);
  assert(p.startsWith(root+path.sep));
  const actual=ref(p); assert.deepEqual(actual,value);
  verified.set(value.path,actual);
 }
 for(const child of Object.values(value)) if(typeof child==="object") checkRefs(child);
}
const sourceHead=raw("git",["rev-parse","HEAD"]).toString().trim();
const run12=json(chain+"/20260908-012-apply/result.json");
const review11=json(chain+"/20260908-011-review-propose/result.json");
assert.equal(run12.action,"apply"); assert.equal(run12.status,"terminal");
assert.equal(review11.verdict,"approved");
assert.equal(run12.previousRunId,"20260908-011-review-propose");
checkRefs(run12);
checkRefs(review11);
const authorSummary=json(author+"/summary.json");
checkRefs(authorSummary);
const inventory=json(author+"/candidate-files.json");
checkRefs(inventory);
assert.equal(inventory.sourceHead,sourceHead);
const changedPaths = raw("git",["diff","--name-only","HEAD"]).toString().trim().split(/\r?\n/);
const untrackedPaths = raw("git",["ls-files","--others","--exclude-standard"]).toString().trim().split(/\r?\n/);
const dirty = [...new Set(changedPaths.concat(untrackedPaths).filter(p=>p&&!p.startsWith(".flowkit/")))].sort();
assert.deepEqual(inventory.files.map(x=>x.path).sort(),dirty);
const prior=".flowkit/artifacts/"+D+"/changes/"+C+"/proof/20260908-011-review-propose/attempt-01/summary.json";
const planningRefs=[];
function comparePlanning(value) {
 if(!value||typeof value!=="object") return;
 if(typeof value.path==="string" && value.path.startsWith("openspec/changes/"+C+"/") && typeof value.sha256==="string") {
  const bytes=fs.readFileSync(value.path);
  const normalized=value.path.endsWith("/tasks.md")?Buffer.from(bytes.toString("utf8").replace(/\[x\]/g,"[ ]")):bytes;
  assert.equal(sha(normalized),value.sha256,value.path+" approved preservation");
  assert.equal(normalized.length,value.bytes);
  planningRefs.push(value);
 }
 for(const child of Object.values(value)) if(typeof child==="object") comparePlanning(child);
}
comparePlanning(json(prior));
assert(planningRefs.length>=8);
const finals=authorSummary.checks.map(c=>({label:c.label,...json(c.result.path)}));
for(const r of finals){assert.equal(r.exitCode,0,r.label);assert.equal(r.error,null);assert.equal(r.signal,null);}
const archive=authorSummary.packageAudit.archive;
assert.equal(sha(fs.readFileSync(archive)),authorSummary.packageAudit.sha256);
const installation=path.resolve(".tmp/d05-012-install/node_modules/flowkit-next");
assert(fs.existsSync(path.join(installation,"package.json")));
const fresh=fs.mkdtempSync(path.join(root,".tmp/review-013-build-"));
const emitted=path.join(fresh,"dist");
command("fresh-build",process.execPath,["node_modules/typescript/bin/tsc","-p","tsconfig.build.json","--outDir",emitted]);
const entries=raw("tar",["-tf",archive]).toString().trim().split(/\r?\n/).filter(p=>!p.endsWith("/")).map(p=>p.replace(/^package\//,"")).sort();
assert.deepEqual(entries,[...authorSummary.packageAudit.files].sort());
assert.equal(entries.filter(p=>p.startsWith("dist/")).length,walk(emitted).length);
const packageFiles=[];
for(const p of entries){
 assert(!/(^|\/)(?:\.agents|\.flowkit|\.tmp|node_modules|architecture)(?:\/|$)/.test(p));
 const packed=raw("tar",["-xOf",archive,"package/"+p]);
 const installed=fs.readFileSync(path.join(installation,p));
 assert(packed.equals(installed),"installed bytes "+p);
 if(p==="package.json"){
  const packaged=JSON.parse(packed);
  const current=json("package.json");
  for(const key of ["name","version","type","engines","dependencies","bin","files"]) assert.deepEqual(packaged[key],current[key],key);
 }else{
  const current=fs.readFileSync(p.startsWith("dist/")?path.join(emitted,p.slice(5)):p);
  assert(packed.equals(current),"fresh source or static bytes "+p);
 }
 packageFiles.push({path:p,bytes:packed.length,sha256:sha(packed)});
}
assert(!fs.existsSync(path.join(installation,"node_modules/tsx")));
command("typecheck",process.execPath,["node_modules/typescript/bin/tsc","--noEmit"]);
const tests=[
"action-guidance-execution","single-action-execution","managed-tool-resolution","manager-installation","manager-assets-boundary",
"delivery-operation-execution","delivery-start-execution","delivery-full-test-execution","delivery-final-execution","delivery-final-projection",
"delivery-continuity-semantic-boundaries","delivery-repository-integration-execution","delivery-repository-integration-accepted-object",
"delivery-without-archify","openspec-observation","openspec-observation-boundary","foundation-cli-entrypoint","foundation-cli-surface"
].map(p=>"tests/unit/domain/"+p+".test.ts");
const domain=command("focused-domain",process.execPath,["--import","tsx","--test",...tests]);
assert.match(domain.toString(),/# fail 0/);
const acceptance=command("installed-windows",process.execPath,["--import","tsx","--test","tests/acceptance/foundation-manager.acceptance.test.ts"],{
 FLOWKIT_HOME:process.env.FLOWKIT_HOME,
 FLOWKIT_ACCEPTANCE_INSTALLATION:installation
});
assert.match(acceptance.toString(),/# pass 6/);
assert.match(acceptance.toString(),/# fail 0/);
command("diff-check","git",["diff","--check","HEAD"]);
const outputs={completedAt:new Date().toISOString(),sourceHead,method:ref(fileURLToPath(import.meta.url)),authorResult:ref(chain+"/20260908-012-apply/result.json"),acceptedProposalReview:ref(chain+"/20260908-011-review-propose/result.json"),authorSummary:ref(author+"/summary.json"),candidateInventory:ref(author+"/candidate-files.json"),candidateFiles:inventory.files.length,verifiedRefCount:verified.size,verifiedRefs:[...verified.values()],planningArtifactsPreserved:[...new Set(planningRefs.map(p=>p.path))],authorApplicableChecks:finals.map(r=>({label:r.label,exitCode:r.exitCode})),package:{archive:ref(archive),installation,files:packageFiles,emittedModuleCount:walk(emitted).length,currentFreshCompilationMatches:true},checks,domainCounts:domain.toString().match(/^# (?:tests|pass|fail|skipped) \d+$/gm),acceptanceCounts:acceptance.toString().match(/^# (?:tests|pass|fail|skipped) \d+$/gm),limitations:["Bounded Reviewer verification, not Formal Delivery Full Test.","Candidate review-apply HOW is not read as guidance or executed; opaque package hashes are integrity-only.","Existing Author Linux acceptance is independently integrity-checked, not rerun by this script.","Fresh compiler output is isolated; Author dist/package/install are not modified."]};
write("summary.json",outputs);
console.log(JSON.stringify({summary:rel(path.join(out,"summary.json")),refs:verified.size,files:inventory.files.length,domain:outputs.domainCounts,acceptance:outputs.acceptanceCounts}));
