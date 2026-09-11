import fs from "node:fs/promises";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {parse} from "yaml";
const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260909-054-explore",run=".flowkit/runs/20260908-05-lightweight-workflow-management/006-invoke-git-at-workflow-boundaries/20260909-054-explore";
const json=async p=>JSON.parse(await fs.readFile(p,"utf8"));
const digest=b=>createHash("sha256").update(b).digest("hex");
const ref=async p=>{const b=await fs.readFile(p);return {path:p,bytes:b.length,sha256:digest(b)};};
const context=await json(run+"/context.json");
assert.equal(execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),context.repositoryHead);
const manifestPath="openspec/delivery-groups/"+context.deliveryId+".yaml";
const current=await fs.readFile(manifestPath,"utf8");
const ownerBlock='  - ref: "owner:12fef2c5dd7f8622a724723c97b244f30d2c51732319f36247a056597f8dbc16"\n    decision: "activate-change"\n    deliveryId: "20260908-05-lightweight-workflow-management"\n    changeId: "invoke-git-at-workflow-boundaries"\n    sourceRef: "owner-input:2026-09-09:activate-change:invoke-git-at-workflow-boundaries:proof-explore"\n    scope:\n      - "explore"\n\n';
assert(current.includes(ownerBlock));
const restored=current.replace(/(  - id: "invoke-git-at-workflow-boundaries"[\s\S]*?    state: )active\n    projectOrdinal: 38\n/,"$1planned\n").replace(ownerBlock,"");
assert(Buffer.from(restored).equals(execFileSync("git",["show","HEAD:"+manifestPath])));
const manifest=parse(current);
assert.equal(manifest.changes.filter(c=>c.state==="active").length,1);
assert.equal(manifest.changes.find(c=>c.id===context.changeId).projectOrdinal,38);
assert.equal(manifest.changes.filter(c=>c.state==="completed").length,5);
const ordinals=new Set();
for(const f of await fs.readdir("openspec/delivery-groups"))if(f.endsWith(".yaml"))for(const c of parse(await fs.readFile("openspec/delivery-groups/"+f,"utf8")).changes??[])if(c.projectOrdinal!==undefined){assert(Number.isInteger(c.projectOrdinal)&&c.projectOrdinal>0);assert(!ordinals.has(c.projectOrdinal));ordinals.add(c.projectOrdinal);}
const allowed=[proof+"/",run+"/","openspec/changes/"+context.changeId+"/"];
const entries=execFileSync("git",["status","--porcelain=v1","-z","-uall"],{encoding:"utf8"}).split("\0").filter(Boolean);
for(const e of entries)assert(e.slice(3)===manifestPath||allowed.some(p=>e.slice(3).startsWith(p)),"out-of-scope mutation "+e);
assert.deepEqual((await fs.readdir("openspec/changes/"+context.changeId)).sort(),[".openspec.yaml","explore.md"]);
const observations=await json(proof+"/observations.json");assert.equal(observations.observations.length,8);assert(observations.observations.every(o=>o.expectedCurrentBehaviorConfirmed));
const native=await json(proof+"/native-git-observations.json");
for(const c of native.commands)for(const x of [c.stdout,c.stderr]){const b=await fs.readFile(proof+"/"+x.file);assert.equal(b.length,x.bytes);assert.equal(digest(b),x.sha256);}
for(const id of ["probe-02","native-git-01","openspec-status"]){const c=await json(proof+"/"+id+"/command.json");assert.equal(c.exitCode,0);for(const x of [c.stdout,c.stderr])assert.deepEqual(await ref(x.path),x);}
const sourcePaths=["src/domain/delivery-repository-integration-execution.ts","src/domain/delivery-repository-integration-operation.ts","src/internal/delivery-repository-integration-git.ts","src/internal/delivery-repository-integration-source.ts","src/cli/checkpoint-authorization.ts","src/cli/entrypoint.ts","skills/delivery/repository-integration/SKILL.md","openspec/specs/repository-integration-and-next-base-continuity/spec.md","openspec/specs/delivery-operation-execution-and-start-continuity/spec.md","openspec/specs/foundation-cli-surface/spec.md","flowkit-next-delivery-change-plan.md","tests/unit/domain/delivery-integration-fixture.ts"];
await fs.writeFile(proof+"/source-index.json",JSON.stringify(await Promise.all(sourcePaths.map(ref)),null,2)+"\n",{flag:"wx"});
const proofRefs=[];
async function walk(d){for(const e of await fs.readdir(d,{withFileTypes:true})){const p=d+"/"+e.name;if(e.isDirectory())await walk(p);else{assert(e.isFile());proofRefs.push(await ref(p));}}}
await walk(proof);
await fs.writeFile(proof+"/evidence-index.json",JSON.stringify(proofRefs,null,2)+"\n",{flag:"wx"});
const result={
kind:"external-orchestrator-explore-result",canonicalFlowkitRuntimeRun:false,executionMode:"independent-bootstrap",role:"author",action:"explore",
deliveryId:context.deliveryId,changeId:context.changeId,projectOrdinal:38,runId:context.runId,previousRunId:null,
previousDeliveryRun:await ref(context.previousDeliveryRun),status:"terminal",authorConclusion:"PASS",
meaning:"有界 Explore 已完成，待独立 review-explore；不是 Proposal 批准、实现验收、实际 D05 Full Test 或 Git authority",
startedAt:context.startedAt,completedAt:new Date().toISOString(),
findings:[{id:"E054-01",classification:"planned-contract-change",summary:"当前 clean/parent/count 强制限制与 D05 目标不一致，按 Owner 明确操作收敛。"},
{id:"E054-02",classification:"host-range-obligation",summary:"限定 git add 不足以防止夹带原有范围外 staged，需提交前核对实际 index。"},
{id:"E054-03",classification:"bounded-handoff",summary:"复用既有失败只读确认，明确 commit/远端未完成事实，不建设 provider 平台或自动重试。"}],
blockingUnknowns:[],limitations:["本轮是 Windows 原生 Git fixture；未验证 Linux 新 probe 或真实网络/凭据/PR/merge。","合成 Final/Owner/source 不是实际 lifecycle acceptance；Apply 必须产生当前实现新证据。"],
proof:{currentBehaviorCases:8,nativeGitCommands:native.commands.length,platform:process.platform,node:process.version,initialFailure:"probe-01 sandbox spawn EPERM；同 probe 获准后 probe-02 exit 0",productionAcceptance:false,formalD05FullTest:false},
artifacts:await Promise.all([manifestPath,"openspec/changes/"+context.changeId+"/.openspec.yaml","openspec/changes/"+context.changeId+"/explore.md",run+"/action.md",run+"/context.json"].map(ref)),
proofRefs:await Promise.all([proof+"/evidence-index.json",proof+"/source-index.json",proof+"/observations.json",proof+"/native-git-observations.json"].map(ref)),
ownerDecisionsRelevant:context.ownerDecisionsRelevant,removedPaths:[],
scopeVerification:{nonTargetManifestBytesPreserved:true,onlyCurrentChangeActivated:true,productionTestsSkillsMainSpecsUnchanged:true,repositoryHeadUnchanged:true,gitMutationInTarget:false,gitFixtureOnly:true},
nextBoundary:"review-explore",reviewerVerdict:null,proposalCreated:false,applyExecuted:false,formalD05FullTestExecuted:false,stop:true};
await fs.writeFile(run+"/result.json",JSON.stringify(result,null,2)+"\n",{flag:"wx"});
assert.deepEqual(await json(run+"/result.json"),result);
assert.deepEqual((await fs.readdir(run)).sort(),["action.md","context.json","result.json"]);
console.log(JSON.stringify({readBack:true,result:await ref(run+"/result.json"),authorConclusion:result.authorConclusion,nextBoundary:result.nextBoundary,projectOrdinal:38,stop:true}));
