import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const work=path.resolve(".tmp/d05-055-review-git");
await fs.mkdir(work,{recursive:true});
const base=await fs.mkdtemp(path.join(work,"native-git-"));
assert(base.startsWith(work+path.sep));
const target=path.join(base,"target"),remote=path.join(base,"remote.git");
await fs.mkdir(target);
const commands=[];
function git(cwd,args,expect=0){
 const startedAt=new Date().toISOString();
 const out=spawnSync("git",args,{cwd,encoding:null,windowsHide:true});
 const index=String(commands.length+1).padStart(2,"0");
 const streams={};
 for(const key of ["stdout","stderr"]){
  const bytes=out[key]??Buffer.alloc(0),file="native-"+index+"."+key+".txt";
  awaitlessWrite.push(fs.writeFile(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260909-055-review-explore"+"/"+file,bytes,{flag:"wx"}));
  streams[key]={file,bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")};
 }
 commands.push({cwd,args,startedAt,finishedAt:new Date().toISOString(),exitCode:out.status,error:out.error?.message??null,...streams});
 assert.equal(out.status,expect,JSON.stringify(args)+": "+out.stderr);
 return out.stdout.toString().trim();
}
const awaitlessWrite=[];
git(target,["init","-b","main"]);git(target,["config","user.name","Flowkit Proof"]);git(target,["config","user.email","proof@example.invalid"]);
await fs.writeFile(path.join(target,"owned.txt"),"authorized content\n");
await fs.writeFile(path.join(target,"unrelated.txt"),"untouched owner work\n");
git(target,["add","--","owned.txt"]);
assert.equal(git(target,["diff","--cached","--name-only"]),"owned.txt");
git(target,["commit","-m","fixture bounded checkpoint"]);
const head=git(target,["rev-parse","HEAD"]);
assert.equal(git(target,["show","--format=","--name-only",head]),"owned.txt");
assert(git(target,["status","--porcelain=v1","-uall"]).includes("unrelated.txt"));
// Deliberate unreachable local destination: inspect the existing commit, never auto-create another.
git(target,["push",path.join(base,"missing.git"),"HEAD:refs/heads/main"],128);
assert.equal(git(target,["rev-parse","HEAD"]),head);
// Separate known local bare destination; not an external PR or network credential acceptance.
git(base,["init","--bare",remote]);
git(target,["push",remote,"HEAD:refs/heads/main"]);
assert.equal(git(target,["ls-remote",remote,"refs/heads/main"]).split(/\s/)[0],head);
assert.equal(git(target,["rev-list","--count","HEAD"]),"1");
assert.equal(await fs.readFile(path.join(target,"unrelated.txt"),"utf8"),"untouched owner work\n");
// An out-of-scope index entry is observable; this bounded example stops before commit and leaves it untouched.
git(target,["add","--","unrelated.txt"]);
const outside=git(target,["diff","--cached","--name-only"]);
assert.equal(outside,"unrelated.txt");
assert.equal(git(target,["rev-parse","HEAD"]),head);
await Promise.all(awaitlessWrite);
await fs.writeFile(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260909-055-review-explore/native-git-observations.json",JSON.stringify({fixtureOnly:true,prototypeNotProductAdapter:true,platform:process.platform,node:process.version,localBareRemoteOnly:true,scopedCommitPreservesUnrelated:true,pushFailureRetainsCommit:true,pushReadBackMatches:true,noShaWriteBackCommit:true,outOfScopeIndexDetectedAndLeft:true,commands},null,2)+"\n",{flag:"wx"});
console.log("Native local Git proof: scoped commit, failed publication readback, local bare push/readback, unrelated index detection; no extra commit.");
