import assert from "node:assert/strict";
import { readFileSync, writeFileSync, readdirSync, lstatSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = path.dirname(fileURLToPath(import.meta.url));
const relative = (p) => path.relative(process.cwd(), p).split(path.sep).join("/");
const proof = relative(base);
const deliveryId = "20260908-05-lightweight-workflow-management";
const changeId = "simplify-delivery-coordination";
const group = ".flowkit/runs/" + deliveryId + "/005-" + changeId;
const run = group + "/20260909-049-apply";
const planning = "openspec/changes/" + changeId;
const digest = (b) => createHash("sha256").update(b).digest("hex");
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const ref = (p) => { const b = readFileSync(p); return { path:p, bytes:b.length, sha256:digest(b) }; };
const save = (p, value) => writeFileSync(p, JSON.stringify(value, null, 2) + "\n", { flag:"wx" });
const git = (...args) => execFileSync("git", args, {encoding:"utf8",windowsHide:true}).trim();
assert.equal(existsSync(run + "/result.json"), false);
const context = read(run + "/context.json");
assert.equal(context.previousRunId, "20260909-048-review-propose");
assert.equal(context.projectOrdinal, 37);
const reviewPath = group + "/20260909-048-review-propose/result.json";
const review = read(reviewPath);
assert.equal(review.verdict, "approved");
assert.equal(review.nextBoundary, "apply");
assert.deepEqual(ref(review.reviewedResult.path), review.reviewedResult);
const proposal = read(review.reviewedResult.path);
for (const r of proposal.artifacts) {
  if (r.path === planning + "/tasks.md") {
    const restored = readFileSync(r.path, "utf8").replace(/- \[x\]/g, "- [ ]");
    assert.equal(digest(Buffer.from(restored)), r.sha256, "tasks differ beyond checkboxes");
  } else assert.deepEqual(ref(r.path), r, r.path);
}
for (const r of [review.runArtifacts.action, review.runArtifacts.context, review.reviewReport])
  assert.deepEqual(ref(r.path), r);
const manifestRef = ref("openspec/delivery-groups/" + deliveryId + ".yaml");
assert.equal(manifestRef.sha256, "ce4274abfdda2dd2bf5c5f2ba1117a5eaac0f8de2f858397e231f4544923db1e");
const head = git("rev-parse", "HEAD");
assert.equal(head, "ba53f8ac9f48c71e334ec4d0ac3811a323fbd525");
assert.equal(git("branch", "--show-current"), "delivery/" + deliveryId);
assert.equal(git("diff", "--name-only", "--", ".flowkit/runs", "openspec/specs",
  "openspec/changes/archive", ".gitattributes", ".gitignore", "config/verification/full-test.json"), "");
assert.deepEqual(readdirSync(run).sort(), ["action.md","context.json"]);

const checks = read("config/verification/full-test.json").checks.map(c=>c.checkId);
const currentLabels = ["win-current","linux-current"].flatMap(p=>checks.map(c=>p+"-"+c));
currentLabels.push("linux-container-02", "linux-dependencies-02", "openspec-strict",
  "skill-start","skill-final","skill-integration","final-material-01");
for (const label of currentLabels) {
  const result = read(base + "/" + label + ".json");
  assert.equal(result.exitCode, 0, label);
  assert.equal(result.error, null, label);
  assert.equal(result.signal, null, label);
  for (const stream of ["stdout","stderr"]) readFileSync(base + "/" + label + "." + stream + ".txt");
}
for (const platform of ["win-current","linux-current"]) {
  for (const [suite,count] of [["domain",303],["acceptance",6],["entropy-tests",7]]) {
    const output = readFileSync(base + "/" + platform + "-" + suite + ".stdout.txt","utf8");
    assert.match(output, new RegExp("# pass " + count + "(?:\\r?\\n)"));
    assert.match(output, /# fail 0(?:\r?\n)/);
    assert.match(output, /# skipped 0(?:\r?\n)/);
  }
}
const linux = read(base + "/linux-source-02.json");
for (const item of linux.files) {
  const current = ref(item.artifact);
  assert.equal(current.bytes, item.bytes, item.artifact);
  assert.equal(current.sha256, item.contentSha256, item.artifact);
}
const trackedChanges = git("diff","--name-only","--","src","tests","skills","AGENTS.md").split("\n").filter(Boolean);
const newFiles = git("ls-files","--others","--exclude-standard","--","src","tests").split("\n").filter(Boolean);
const paths = [...new Set([...trackedChanges,...newFiles])].sort();
const removedPaths = paths.filter(p=>!existsSync(p));
assert.deepEqual(removedPaths, [
  "tests/unit/domain/delivery-evidence-outcome-fixture.ts",
  "tests/unit/domain/delivery-start-validation-fixture.ts"
]);
const candidates = paths.filter(p=>existsSync(p)).map(p=>({...ref(p),
  lines:readFileSync(p,"utf8").split("\n").length-1}));
const maxProductionLines = Math.max(...candidates.filter(r=>r.path.startsWith("src/")).map(r=>r.lines));
assert.ok(maxProductionLines<=650);
const tasks = readFileSync(planning + "/tasks.md","utf8");
assert.equal((tasks.match(/- \[x\]/g)||[]).length,19);
assert.equal((tasks.match(/- \[ \]/g)||[]).length,0);
const planningRefs = proposal.artifacts.filter(r=>r.path.startsWith(planning+"/")).map(r=>ref(r.path));
const walk = (directory) => readdirSync(directory).sort().flatMap(name=>{
  const p=path.join(directory,name);
  return lstatSync(p).isDirectory()?walk(p):[relative(p)];
});
const commandAttempts = readdirSync(base).filter(n=>n.endsWith(".json")).flatMap(name=>{
  const r=read(base+"/"+name);
  return Object.hasOwn(r,"exitCode")?[{label:name.slice(0,-5),exitCode:r.exitCode,error:r.error}]:[];
});
save(base + "/candidate-files.json", {
  kind:"current-apply-candidate-audit", headProvenanceOnly:head, candidates, removedPaths,
  maxProductionLines, linuxSourceMatchesCurrent:true, linuxSource:ref(proof+"/linux-source-02.json"),
  planningRefs, preservedManifest:manifestRef
});
const evidence = walk(base).map(ref);
save(base + "/evidence-index.json", {kind:"apply-proof-inventory",currentLabels,commandAttempts,files:evidence});
const result = {
  kind:"external-orchestrator-apply-result",canonicalFlowkitRuntimeRun:false,
  executionMode:"independent-bootstrap",role:"author",action:"apply",deliveryId,changeId,
  projectOrdinal:37,runId:"20260909-049-apply",previousRunId:context.previousRunId,
  status:"terminal",authorConclusion:"PASS",startedAt:context.startedAt,completedAt:new Date().toISOString(),
  approvedProposal:ref(review.reviewedResult.path),approvedReview:ref(reviewPath),
  tasks:{total:19,complete:19,remaining:0},implementationArtifacts:candidates,removedPaths,
  planningArtifacts:planningRefs,
  verification:{windowsDomain:303,linuxDomain:303,windowsAcceptance:6,linuxAcceptance:6,
    windowsEntropyTests:7,linuxEntropyTests:7,engineeringChecksPerPlatform:9,
    strictOpenSpec:"PASS",exactOpenSpecVersion:"1.10.0",maxProductionLines,
    currentCommandMetadata:currentLabels.map(label=>ref(proof+"/"+label+".json")),
    failureHistoryPreserved:true,formalD05FullTest:false,independentReviewerVerdict:false},
  facts:{proofRefs:[ref(proof+"/implementation-report.md"),ref(proof+"/evidence-index.json"),
    ref(proof+"/candidate-files.json")],approvedPlanningUnchangedExceptTaskCheckboxes:true,
    realManifestUnchanged:true,historicalRunMutation:false,gitMutation:false,
    runtimePolicyRunSchemaMutation:false,candidateLifecycleInvokedOnActualDelivery:false},
  ownerDecisionsRelevant:context.ownerDecisionsRelevant,
  runArtifacts:{action:ref(run+"/action.md"),context:ref(run+"/context.json")},
  nextBoundary:"review-apply",
  handoff:{nextBoundary:"review-apply",independentReviewRequired:true,
    report:proof+"/implementation-report.md",
    notExecuted:["review-apply","archive","D05 Formal Full Test","Git mutation"],stop:true},
  stop:true
};
save(run + "/result.json",result);
assert.deepEqual(read(run + "/result.json"), result);
assert.deepEqual(readdirSync(run).sort(),["action.md","context.json","result.json"]);
for (const r of [...result.implementationArtifacts,...result.planningArtifacts,
  ...result.facts.proofRefs,...Object.values(result.runArtifacts)]) {
  const actual=ref(r.path);
  assert.equal(actual.sha256,r.sha256);
  assert.equal(actual.bytes,r.bytes);
}
console.log(JSON.stringify({status:"PASS",run:ref(run+"/result.json"),tasks:result.tasks,
  maxProductionLines,proofFiles:evidence.length,linuxInputFiles:linux.files.length,
  nextBoundary:"review-apply",stop:true}));
