import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const own = ".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/correct-project-onboarding-and-agent-entry/proof/20260911-068-review-apply";
const author = own.replace("068-review-apply", "067-apply");
const manager = ".tmp/onboarding-039-manager/node_modules/flowkit-next";
const text = p => fs.readFileSync(p, "utf8");
const json = p => JSON.parse(text(p));
const hash = b => createHash("sha256").update(b).digest("hex");
const ref = p => { const b = fs.readFileSync(p); return {path:p, bytes:b.length, sha256:hash(b)}; };
const check = r => assert.deepEqual(ref(r.path), {path:r.path,bytes:r.bytes,sha256:r.sha256});
const result = json(".flowkit/runs/20260908-05-lightweight-workflow-management/007-correct-project-onboarding-and-agent-entry/20260911-067-apply/result.json");
for (const r of result.artifacts) check(r);
const original = json(author + "/preflight.json");
const manifest = "openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml";
const lines = text(manifest).split(/(?<=\n)/);
assert.equal(lines.filter(l => l.startsWith("  planningHistoryNote:")).length, 1);
const restored = Buffer.from(lines.filter(l => !l.startsWith("  planningHistoryNote:")).join(""));
const manifestBefore = original.inputs.find(r => r.path === manifest);
assert.equal(restored.length, manifestBefore.bytes);
assert.equal(hash(restored), manifestBefore.sha256);
check(original.inputs.find(r => r.path === "pnpm-lock.yaml"));
const removed = json(author + "/removal-sources.json").refs;
assert.equal(removed.length, 3);
for (const r of removed) {
  assert(!fs.existsSync(r.path));
  const b = execFileSync("git", ["show", r.gitSource], {windowsHide:true});
  assert.equal(b.length, r.bytes); assert.equal(hash(b), r.sha256);
}
const installed = json(manager + "/package.json"), source = json("package.json");
for (const key of ["name","version","bin","dependencies","files","engines"]) assert.deepEqual(installed[key],source[key]);
const packageRef = json(author + "/implementation-audit.json").finalPackage;
check(packageRef);
const listing = execFileSync("C:/WINDOWS/system32/tar.exe", ["-tf", packageRef.path], {encoding:"utf8",windowsHide:true}).trim().split(/\r?\n/);
assert(!listing.some(p => /^package\/(\.agents|\.flowkit|\.tmp|openspec|tests|src|architecture)\//.test(p)));
for (const relative of ["README.md","docs/onboarding.md",source.bin.flowkit,"config/tools/toolchain.lock.json"]) {
  assert(listing.includes("package/" + relative));
  const packed = execFileSync("C:/WINDOWS/system32/tar.exe", ["-xOf",packageRef.path,"package/" + relative], {windowsHide:true,maxBuffer:8*1024*1024});
  assert(packed.equals(fs.readFileSync(relative)), relative);
  assert(packed.equals(fs.readFileSync(manager + "/" + relative)), relative);
}
const packaged = JSON.parse(execFileSync("C:/WINDOWS/system32/tar.exe",["-xOf",packageRef.path,"package/package.json"],{encoding:"utf8",windowsHide:true}));
for (const key of ["name","version","bin","dependencies","files","engines"]) assert.deepEqual(packaged[key],source[key]);
const example = json(author + "/example-evidence.json");
for (const r of example.files) {
  const b = Buffer.from(r.content, "utf8");
  assert.equal(b.length,r.bytes); assert.equal(hash(b),r.sha256); check(r);
}
const preserved = json(author + "/installation-audit.json").preservedInputs;
for (const r of preserved) {
  const b = fs.readFileSync(r.path);
  if(r.path.endsWith("/AGENTS.md")) {assert.equal(hash(b.subarray(0,r.bytes)),r.sha256);}
  else check(r);
}
const entry = example.files.find(r => r.targetRelativePath === "AGENTS.md").content;
assert.equal(entry.split("<!-- flowkit-entry:start -->").length,2);
const template = text("docs/onboarding.md").match(/```markdown\n([\s\S]*?)\n```/)[1]
  .replace("<本项目绝对路径>", path.resolve(example.sourceRoot).replaceAll("\\","/"))
  .replace("<所选安装的 node_modules/flowkit-next 绝对路径>", path.resolve(manager).replaceAll("\\","/"))
  .replace("<外部 exact tools 根目录；不是 manager>", "C:/Users/xuser/.flowkit");
assert(entry.includes(template));
const ex = relative => JSON.parse(example.files.find(r => r.targetRelativePath === relative).content);
const exRunRoot = ".flowkit/runs/onboarding-stock-delivery/001-inspect-stock-total/20260911-001-explore";
const exampleResult = ex(exRunRoot + "/result.json"), exampleContext = ex(exRunRoot + "/context.json");
assert.equal(exampleContext.lifecycleState,"terminal");
assert.equal(exampleResult.nextBoundary,"review-explore");
assert.equal(exampleResult.reviewerVerdict,null);
assert.equal(exampleResult.verificationVerdict,null);
const startText = example.files.find(r=>r.targetRelativePath===exRunRoot+"/action.md").content;
assert(startText.includes('"lifecycleState": "prepared"'));
const exProof = ".flowkit/artifacts/onboarding-stock-delivery/changes/inspect-stock-total/proof/20260911-001-explore";
const probeCommand = ex(exProof + "/stock-probe/command.json");
assert.equal(probeCommand.exitCode,0); assert.equal(probeCommand.error,null);
const sourceFacts = ex(exProof + "/stock-probe/stdout.txt");
assert.deepEqual(sourceFacts.observations.map(o=>o.actual),[20,0,20,"0812",-1]);
const commands = [];
for (const r of result.commands) {
  check(r);
  const c = json(r.path); assert.equal(c.exitCode,0); assert.equal(c.error,null);
  check(c.stdout);check(c.stderr);commands.push({id:r.path.slice(author.length+1),command:r,exitCode:c.exitCode});
}
const ownCommands = [];
for(const id of ["focused","validate","example-status","example-next","example-doctor"]) {
  const c = json(own+"/"+id+"/command.json"); assert.equal(c.exitCode,0);assert.equal(c.error,null);
  check(c.stdout);check(c.stderr);ownCommands.push(ref(own+"/"+id+"/command.json"));
}
const current = json(own+"/example-status/stdout.txt"), next = json(own+"/example-next/stdout.txt"), doctor = json(own+"/example-doctor/stdout.txt");
assert.equal(current.status,"current");assert.equal(current.currentRun.runId,"20260911-001-explore");assert.equal(current.currentRun.state,"terminal");
assert.equal(next.decision.actionId,"review-explore");assert.equal(doctor.status,"pass");
assert.deepEqual(current,json(author+"/example-status-after/stdout.txt"));
assert.deepEqual(next,json(author+"/example-next-after/stdout.txt"));
assert(/# tests 13\r?\n/.test(text(own+"/focused/stdout.txt")));
assert(/# pass 13\r?\n/.test(text(own+"/focused/stdout.txt")));
const ownerReturn=text(author+"/fresh-session-owner-return.md");
for(const literal of ["onboarding-stock-example","onboarding-stock-delivery","inspect-stock-total","20260911-001-explore","review-explore","未取得独立会话原始工具日志"])assert(ownerReturn.includes(literal));
const gitChanged=execFileSync("git",["diff","--name-only","--","src","skills",".agents","pnpm-lock.yaml","openspec/specs","openspec/changes/archive"],{encoding:"utf8",windowsHide:true}).trim();
assert.equal(gitChanged,"");
console.log(JSON.stringify({
 kind:"independent-review-apply-current-evidence-audit",checkedAt:new Date().toISOString(),
 reviewedResult:ref(".flowkit/runs/20260908-05-lightweight-workflow-management/007-correct-project-onboarding-and-agent-entry/20260911-067-apply/result.json"),
 finalPackage:packageRef,packageEntryCount:listing.length,packedCurrentInstalledAssetsEqual:true,
 originalManifestPreservedExceptHistoryNote:true,dependencyAndProductionScopesUnchanged:true,
 exactRemovals:removed.map(r=>({path:r.path,gitSource:r.gitSource,bytes:r.bytes,sha256:r.sha256})),
 durableExampleFilesVerified:example.files.length,liveExampleMatchesDurableCopy:true,
 originalBusinessBytesPreserved:true,entryMatchesCurrentTemplate:true,
 authorCommands:commands,independentCommands:ownCommands,
 focused:{tests:13,passed:13,failed:0},
 liveReadback:{runId:current.currentRun.runId,state:current.currentRun.state,nextAction:next.decision.actionId,doctor:doctor.status},
 freshSession:{basis:"Owner-returned actual session output corroborated against current project facts; not a new session executed by this Reviewer",report:ref(author+"/fresh-session-owner-return.md"),rawLogProvided:false},
 limitations:["No new Author/Reviewer Action on example","No Formal Full Test","No Git mutation","Linux installation evidence audited, not rerun by this Reviewer","Package remains disposable; current source and durable example/command evidence retained"]
},null,2));
