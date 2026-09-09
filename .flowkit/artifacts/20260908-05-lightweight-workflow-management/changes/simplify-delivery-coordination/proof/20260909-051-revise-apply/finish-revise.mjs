import assert from "node:assert/strict";
import fs from "node:fs";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
const base=path.dirname(fileURLToPath(import.meta.url));
const rel=p=>path.relative(process.cwd(),p).split(path.sep).join("/");
const proof=rel(base);
const group=".flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination";
const run=group+"/20260909-051-revise-apply";
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const hash=b=>createHash("sha256").update(b).digest("hex");
const ref=p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:hash(b)}};
const check=r=>assert.deepEqual(ref(r.path),{path:r.path,bytes:r.bytes,sha256:r.sha256});
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+"\n",{flag:"wx"});
const reviewPath=group+"/20260909-050-review-apply/result.json";
const review=read(reviewPath), ancestor=read(review.reviewedResult.path), context=read(run+"/context.json");
assert.equal(review.nextBoundary,"revise-apply");
assert.equal(review.verdict,"changes-requested");
assert.equal(review.contractBlocker,false);
assert.deepEqual(review.findings.map(f=>f.id),["R050-01"]);
for(const r of [review.reviewedResult,review.approvedProposal,review.approvedReview,review.reviewReport,
  review.findings[0].evidence,review.runArtifacts.action,review.runArtifacts.context]) check(r);
const delta=["src/domain/delivery-final-execution.ts","tests/unit/domain/delivery-final-confirmation.test.ts"];
for(const r of ancestor.implementationArtifacts) if(!delta.includes(r.path))check(r);
for(const r of ancestor.planningArtifacts)check(r);
for(const r of ancestor.facts.proofRefs)check(r);
const candidates=ancestor.implementationArtifacts.map(r=>({...ref(r.path),lines:fs.readFileSync(r.path,"utf8").split("\n").length-1}));
for(const p of ancestor.removedPaths)assert.equal(fs.existsSync(p),false);
const maxProductionLines=Math.max(...candidates.filter(r=>r.path.startsWith("src/")).map(r=>r.lines));
assert.ok(maxProductionLines<=650);
const manifest=ref("openspec/delivery-groups/"+context.deliveryId+".yaml");
assert.equal(manifest.sha256,"ce4274abfdda2dd2bf5c5f2ba1117a5eaac0f8de2f858397e231f4544923db1e");
const git=(...a)=>execFileSync("git",a,{encoding:"utf8",windowsHide:true}).trim();
assert.equal(git("rev-parse","HEAD"),"ba53f8ac9f48c71e334ec4d0ac3811a323fbd525");
assert.equal(git("diff","--name-only","--",".flowkit/runs","openspec/specs","openspec/changes/archive",".gitattributes","config/verification/full-test.json"),"");
const checks=read("config/verification/full-test.json").checks.map(c=>c.checkId);
const labels=["win-final","linux-final"].flatMap(p=>checks.map(c=>p+"-"+c));
labels.push("regression-after","openspec-strict","linux-container","linux-dependencies");
for(const label of labels){const c=read(base+"/"+label+".json");assert.equal(c.exitCode,0,label);assert.equal(c.error,null,label);assert.equal(c.signal,null,label);}
assert.equal(read(base+"/regression-before.json").exitCode,1);
for(const platform of ["win-final","linux-final"]){
  for(const [suite,count]of [["domain",309],["acceptance",6],["entropy-tests",7]]){
    const output=fs.readFileSync(base+"/"+platform+"-"+suite+".stdout.txt","utf8");
    assert.ok(output.includes("# pass "+count+"\n")||output.includes("# pass "+count+"\r\n"));
    assert.match(output,/# fail 0/);assert.match(output,/# skipped 0/);
  }
}
for(const item of read(base+"/linux-source.json").files){
  const current=ref(item.artifact);assert.equal(current.bytes,item.bytes);assert.equal(current.sha256,item.contentSha256);
}
assert.equal(context.previousRunId,"20260909-050-review-apply");
assert.deepEqual(fs.readdirSync(run).sort(),["action.md","context.json"]);
const report = [
"# 051 Revise Apply 交接",
"",
"R050-01 已作最小实现修正，待独立 review-apply；不是 Reviewer approved。",
"",
"## 修正",
"",
"- 仅修改 src/domain/delivery-final-execution.ts 与 tests/unit/domain/delivery-final-confirmation.test.ts。",
"- 既有 revalidateRelated 使用同一 target 与 flowkitHome 重读 active OpenSpec set；非空或进程/观察失败返回 false。复用内容写后与确认 staging 后的两个调用点，不改变 writer/reader/Integration、两笔提交点或 schema。",
"- 第一笔已写时保留 null confirmationRef；既有 content-validation-failed / confirmation-publication-failed 与 written-unconfirmed 准确区分失败阶段。无自动回滚/补确认/新 Action。",
"- 六个新增场景：调用前活动工作、内容写后活动工作、确认 staging 时活动工作、两阶段观察失败、确认发布后活动工作。新进程 reader/Integration 核对失败不取得成功，Git callbacks=0；确认提交后不再业务重验。",
"",
"## 真实验证",
"",
"- regression-before：四个新增确认前场景实际错误 completed；4 subtests 失败，含父节点计 5 fail。原始流保留，不作为 PASS。",
"- 同一测试修正后 15/15；Windows/Linux domain 各 309/309、acceptance 各 6/6、entropy tests 各 7/7；两平台各 9 个适用工程检查均 exit 0。",
"- OpenSpec 1.10.0 strict PASS；650 行 gate 未放宽，累计生产文件最大 "+maxProductionLines+" 行。",
"- Linux network none，独立 offline/frozen pnpm 安装，以非 root node 用户执行；linux-source.json 与当前代码逐项核对。",
"- Windows 是本机 Node/文件/Git 测试；既有 windows-compatibility-simulation 仍只声称 simulation。定向 fixture 使用合成 accepted-source 与观察真实目录的合成 OpenSpec 进程，不伪称独立 Review 或实际 D05 lifecycle。",
"- 工程命令直接执行，没有调用实际 D05 Full Test coordinator，没有修改 real fullTestAttempt。",
"",
"## 连续性与 Owner 边界",
"",
"保留 049 全部累计实现（本轮替换上述两文件引用）、049 的两个删除路径与 047/048/050 exact handoff。规划/tasks/HOW/AGENTS/真实 manifest 本轮未改，历史 Runs/proof 不改。详见 result 的 cumulativeArtifacts、ancestorApply、reviewedFindingsSource、removedPaths。",
"",
"Owner 决定沿用 050 result#ownerDecisionsRelevant：D05 independent-bootstrap；必要证据保留本 target artifacts，.tmp 只放可丢弃内容。历史实验/审查和旧 PASS 不替代当前实现验收。",
"",
"revise-apply / implementation-convergence / debugging-and-error-recovery 限定了本轮的先复现、最小修正、当前回归；incremental-implementation 的 Git 步骤被仓库权限边界排除。没有新平台/依赖、范围扩张或计划修订。",
"",
"下一边界：独立 review-apply。未执行 Review、Archive、Git 或实际 D05 Full Test；STOP。",""
].join("\n");
fs.writeFileSync(base+"/revision-report.md",report,{flag:"wx"});
const files=fs.readdirSync(base).sort().filter(n=>fs.statSync(base+"/"+n).isFile()).map(n=>ref(proof+"/"+n));
save(base+"/evidence-index.json",{kind:"current-revise-apply-proof",files,labels});
const result={
  kind:"external-orchestrator-revise-apply-result",canonicalFlowkitRuntimeRun:false,executionMode:"independent-bootstrap",
  role:"author",action:"revise-apply",deliveryId:context.deliveryId,changeId:context.changeId,projectOrdinal:37,
  runId:context.runId,previousRunId:context.previousRunId,status:"terminal",authorConclusion:"PASS",
  startedAt:context.startedAt,completedAt:new Date().toISOString(),
  reviewedFindingsSource:ref(reviewPath),ancestorApply:ref(review.reviewedResult.path),
  approvedProposal:review.approvedProposal,approvedReview:review.approvedReview,
  findingCorrections:[{id:"R050-01",classification:"implementation-defect",status:"corrected-pending-independent-review",
    before:ref(proof+"/regression-before.json"),after:ref(proof+"/regression-after.json")}],
  revisionArtifacts:delta.map(ref),cumulativeArtifacts:candidates,removedPaths:ancestor.removedPaths,
  newRemovedPaths:[],planningArtifacts:ancestor.planningArtifacts,tasks:ancestor.tasks,
  verification:{windowsDomain:309,linuxDomain:309,windowsAcceptance:6,linuxAcceptance:6,
    windowsEntropyTests:7,linuxEntropyTests:7,focused:15,maxProductionLines,strictOpenSpec:"PASS",
    commandMetadata:labels.map(l=>ref(proof+"/"+l+".json")),formalD05FullTest:false,independentReviewerVerdict:false},
  facts:{proofRefs:[ref(proof+"/revision-report.md"),ref(proof+"/evidence-index.json")],
    planningUnchanged:true,manifestUnchanged:true,skillsUnchanged:true,gitMutation:false,historicalRunMutation:false,
    runtimePolicyRunSchemaMutation:false,candidateLifecycleInvokedOnActualDelivery:false},
  ownerDecisionsRelevant:context.ownerDecisionsRelevant,
  runArtifacts:{action:ref(run+"/action.md"),context:ref(run+"/context.json")},
  nextBoundary:"review-apply",handoff:{independentReviewRequired:true,nextBoundary:"review-apply",
    report:proof+"/revision-report.md",notExecuted:["review-apply","archive","Git mutation","D05 Formal Full Test"],stop:true},stop:true
};
save(run+"/result.json",result);
assert.deepEqual(read(run+"/result.json"),result);
assert.deepEqual(fs.readdirSync(run).sort(),["action.md","context.json","result.json"]);
for(const r of [...candidates,...result.revisionArtifacts,...result.facts.proofRefs,...Object.values(result.runArtifacts)])check(r);
console.log(JSON.stringify({status:"PASS",run:ref(run+"/result.json"),corrected:"R050-01",maxProductionLines,nextBoundary:"review-apply",stop:true}));
