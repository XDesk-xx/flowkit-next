import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
const own=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260911-061-review-apply";
const author=own.replace("20260911-061-review-apply","20260911-060-revise-apply");
const json=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const sha=b=>createHash("sha256").update(b).digest("hex");
const ref=p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:sha(b)};};
function check(r, mapped=r.path){ const b=fs.readFileSync(mapped); assert.equal(b.length,r.bytes,mapped);assert.equal(sha(b),r.sha256,mapped);return b.toString("utf8"); }
const source=json(author+"/linux-source.json");
for(const f of source.files) check({path:f.artifact,bytes:f.bytes,sha256:f.contentSha256});
const config=json("config/verification/full-test.json");
function walk(p){return fs.statSync(p).isDirectory()?fs.readdirSync(p).flatMap(n=>walk(p+"/"+n)):[p];}
assert.deepEqual([...new Set(config.inputs.flatMap(walk))].sort(),source.files.map(f=>f.artifact).sort());
const commands=[];
const counts=(s)=>({tests:Number(/^# tests (\d+)$/m.exec(s)?.[1]??0),passed:Number(/^# pass (\d+)$/m.exec(s)?.[1]??0),failed:Number(/^# fail (\d+)$/m.exec(s)?.[1]??0)});
for(const row of json(author+"/verification-audit.json").checks){
 const c=json(author+"/"+row.label+"/command.json");
 assert.equal(c.exitCode,row.label==="before"?1:0);assert.equal(c.error,null);assert.equal(c.signal,null);
 const map=r=>r.path.startsWith("../../evidence/")?author+"/"+r.path.slice("../../evidence/".length):r.path;
 const stdout=check(c.stdout,map(c.stdout));check(c.stderr,map(c.stderr));
 const tap=counts(stdout);
 if(row.label.endsWith("-domain")) assert.deepEqual(tap,{tests:324,passed:324,failed:0});
 if(row.label.endsWith("-acceptance")||row.label.endsWith("-entropy-tests")) assert.deepEqual(tap,{tests:7,passed:7,failed:0});
 if(row.label==="before") assert.deepEqual(tap,{tests:3,passed:0,failed:3});
 if(row.label==="after") assert.deepEqual(tap,{tests:3,passed:3,failed:0});
 const prefix=row.label.startsWith("win-final-")?"win-final-":row.label.startsWith("linux-final-")?"linux-final-":null;
 if(prefix){const expected=config.checks.find(x=>x.checkId===row.label.slice(prefix.length));assert(expected);assert.deepEqual(c.args,expected.args);assert.equal(c.node,"v22.23.2");assert.equal(c.platform,prefix==="win-final-"?"win32":"linux");}
 commands.push({check:row.label,command:ref(author+"/"+row.label+"/command.json"),exitCode:c.exitCode,node:c.node,platform:c.platform,tap});
}
const evidence=json(own+"/adversarial-observations.json");
for(const c of evidence.commands){assert.equal(c.exitCode,0);check(c.stdout);check(c.stderr);}
const [push,merge,reuse]=evidence.observations;
assert.equal(push.unauthorizedTagPublished,false);assert.deepEqual(push.afterRefs,["refs/heads/main"]);assert.equal(push.outcome.status,"completed");
assert.equal(merge.beforeHead,merge.afterHead);assert.equal(merge.mergeHeadStillExists,true);assert.equal(merge.outcome.status,"incomplete");assert.equal(merge.outcome.phase,"preflight");assert.equal(merge.outcome.effect,"none");
assert.equal(reuse.knownCheckpoint,reuse.actualHead);assert.equal(reuse.outcome.observed.checkpointCommit,reuse.knownCheckpoint);assert.equal(reuse.acceptanceCalled,false);assert.equal(reuse.outcome.status,"incomplete");assert.equal(reuse.outcome.phase,"acceptance");assert.equal(reuse.outcome.effect,"none");
const focused=json(own+"/focused-tests/command.json");
assert.equal(focused.exitCode,0);check(focused.stderr);
assert.deepEqual(counts(check(focused.stdout)),{tests:16,passed:16,failed:0});
const adv=json(own+"/adversarial/command.json");assert.equal(adv.exitCode,0);check(adv.stdout);check(adv.stderr);
const packed=json(author+"/packed-example.json");assert.equal(packed.status,"passed");
for(const k of ["first","change","push","reuse"])assert.equal(packed[k].status,"completed");
assert.equal(packed.pending.status,"incomplete");assert.equal(packed.reuse.effect,"none");assert.notEqual(packed.installation.manager,packed.target);
console.log(JSON.stringify({kind:"independent-review-apply-evidence-audit",checkedAt:new Date().toISOString(),authorSourceFilesMatchCurrent:source.files.length,sourceSelectionMatchesCurrentConfig:true,authorChecks:commands,independentFocusedTests:{files:7,tests:16,passed:16,failed:0,command:ref(own+"/focused-tests/command.json")},independentAdversarial:{cases:3,closedFindings:["D05-RA038-001","D05-RA038-002","D05-RA038-003"],nativeCommands:evidence.commands.length,observation:ref(own+"/adversarial-observations.json")},packedExampleAudited:true,linuxIndependentlyRerunThisReview:false,formalD05FullTest:false},null,2));
