import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = process.cwd();
const proof = path.relative(root,path.dirname(fileURLToPath(import.meta.url))).replaceAll('\\','/');
const delivery='20260908-05-lightweight-workflow-management';
const change='separate-manager-assets-from-target-project';
const runId='20260908-012-apply';
const run='.flowkit/runs/'+delivery+'/'+change+'/'+runId;
const reviewPath='.flowkit/runs/'+delivery+'/'+change+'/20260908-011-review-propose/result.json';
const readJson=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
const refBytes=(p,b)=>({path:p,bytes:Buffer.byteLength(b),sha256:digest(b)});
const ref=async p=>refBytes(p,await fs.readFile(p));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const review=await readJson(reviewPath),context=await readJson(run+'/context.json');
assert.equal(review.verdict,'approved');
assert.equal(review.nextBoundary,'apply');
assert.equal(git('rev-parse','HEAD'),context.sourceHead);
assert.equal(git('branch','--show-current'),'delivery/'+delivery);
assert.equal(context.previousRunId,review.runId);
const tasks=await fs.readFile('openspec/changes/'+change+'/tasks.md','utf8');
assert.equal((tasks.match(/^- \[x\]/gm)||[]).length,12);
assert.equal((tasks.match(/^- \[ \]/gm)||[]).length,0);
const labels=['build-02','typecheck-01','format-01','lint-01','dependency-health-01','entropy-tests-01','entropy-01','forbidden-01','domain-03','pack-01','package-audit-02','installed-windows-05','linux-runtime-03','linux-cache-01','linux-acceptance-05','openspec-final-01','diff-check-final-01'];
const checks=[];
for(const label of labels){
 const directory=proof+'/'+label;
 const result=await readJson(directory+'/result.json');
 assert.equal(result.exitCode,0,label);
 assert.equal(result.error,null,label);
 checks.push({label,...result,result:await ref(directory+'/result.json'),stdout:await ref(directory+'/stdout.txt'),stderr:await ref(directory+'/stderr.txt')});
}
const win=await fs.readFile(proof+'/installed-windows-05/stdout.txt','utf8');
const linux=await fs.readFile(proof+'/linux-acceptance-05/stdout.txt','utf8');
assert.match(win,/# tests 6[\s\S]*# pass 6[\s\S]*# fail 0/);
assert.match(linux,/# tests 262[\s\S]*# pass 262[\s\S]*# fail 0/);
assert.match(linux,/# tests 6[\s\S]*# pass 6[\s\S]*# fail 0/);
assert.match(linux,/Fresh offline frozen Linux dependency graph matches/);
async function walk(dir){
 const result=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const p=dir+'/'+entry.name;
  if(entry.isDirectory())result.push(...await walk(p));else result.push(p);
 }
 return result.sort();
}
const sourceLines=[];
for(const file of (await walk('src')).filter(p=>p.endsWith('.ts'))){
 const body=await fs.readFile(file,'utf8');
 const lines=body.split('\n').length-(body.endsWith('\n')?1:0);
 assert.ok(lines<=650,file+': '+lines);
 sourceLines.push({path:file,lines});
}
sourceLines.sort((a,b)=>b.lines-a.lines);
const modified=git('diff','--name-only','HEAD').split('\n').filter(Boolean);
assert.ok(!modified.some(p=>p.startsWith('.agents/')||p.startsWith('openspec/specs/')||p.startsWith('openspec/changes/archive/')));
const added=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean);
const candidatePaths=[...new Set([...modified,...added])].filter(p=>!p.startsWith('.flowkit/')).sort();
const candidateArtifacts=await Promise.all(candidatePaths.map(ref));
const headers=[];
for(const relative of ['actions/apply','actions/archive','actions/explore','actions/propose','tools/openspec','delivery/start','delivery/full-test','delivery/final','delivery/repository-integration']){
 const file='skills/'+relative+'/SKILL.md';
 const prior=git('show','HEAD:'+file), current=await fs.readFile(file,'utf8');
 const front=s=>s.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0].replaceAll('\r','')??null;
 assert.equal(front(prior),front(current),file);
 headers.push({path:file,frontmatterUnchanged:true});
}
const retainedProofFiles=await Promise.all((await walk(proof)).filter(p=>!['summary.json','candidate-files.json'].some(n=>p.endsWith('/'+n))).map(ref));
const candidatePath=proof+'/candidate-files.json';
const candidateText=JSON.stringify({sourceHead:context.sourceHead,scope:'当前工作树中的实现/测试/计划与所需未提交前序状态；前序 Run 通过 reviewSource 回溯，不覆盖历史',files:candidateArtifacts},null,2)+'\n';
const summaryPath=proof+'/summary.json';
const completedAt=new Date().toISOString();
const summary={
 kind:'current-apply-verification-summary',runId,deliveryId:delivery,changeId:change,completedAt,
 conclusion:'PASS',meaning:'当前 Author 实现及适用验证完成，不是 Reviewer verdict 或 Delivery Formal Full Test',
 reviewerVerdict:null,reviewSource:await ref(reviewPath),sourceHead:context.sourceHead,
 candidateInventory:refBytes(candidatePath,candidateText),handoff:await ref(proof+'/handoff.md'),
 completedTasks:12,maximumSourceLines:sourceLines[0],sourceLineGate:650,checks,
 platformResults:{windowsNative:{domain:262,acceptance:6,finalAttempt:'installed-windows-05'},linuxX64Glibc:{domain:262,acceptance:6,network:'none',finalAttempt:'linux-acceptance-05'}},
 packageAudit:JSON.parse(await fs.readFile(proof+'/package-audit-02/stdout.txt','utf8')),
 skillValidation:{genericValidatorPassed:['actions/apply','actions/archive','actions/explore','actions/propose','tools/openspec'],existingDeliveryFormatMismatch:'Start uses summary; other three have no YAML frontmatter. Not changed or introduced here; product tests and static closure apply.',headers},
 retainedProofFiles,
 nonGoalsPreserved:['no bootstrap Skill modification','no historical Run rewrite','no candidate self-management','no Formal Full Test','no Git mutation','no later D05 scope'],
 nextBoundary:'review-apply',stop:true
};
const summaryText=JSON.stringify(summary,null,2)+'\n';
const resultPath=run+'/result.json';
const result={
 kind:'external-orchestrator-apply-result',canonicalFlowkitRuntimeRun:false,executionMode:'independent-bootstrap',
 role:'author',action:'apply',deliveryId:delivery,changeId:change,runId,runNumber:12,projectOrdinal:34,
 previousRunId:review.runId,status:'terminal',verdict:'PASS',
 verdictMeaning:'Author 已实施已批准合同并完成本轮验证；不是独立 Reviewer approved，也不是 Delivery Formal Full Test',
 summary:'manager/target/FLOWKIT_HOME 分根、同源 Guidance 与最小发行完成；12/12 tasks，Windows/Linux 各 262 domain 与 6 installed acceptance PASS。',
 reviewSource:await ref(reviewPath),evidence:refBytes(summaryPath,summaryText),
 runArtifacts:{action:await ref(run+'/action.md'),context:await ref(run+'/context.json')},
 nextBoundary:'review-apply',reviewerVerdict:null,productionMutation:true,canonicalSpecMutation:false,
 applyExecuted:true,formalFullTestExecuted:false,gitMutationExecuted:false,completedAt,stop:true
};
let patch='*** Begin Patch\n';
for(const [file,body] of [[candidatePath,candidateText],[summaryPath,summaryText],[resultPath,JSON.stringify(result,null,2)+'\n']]){
 await assert.rejects(fs.access(file));
 patch+='*** Add File: '+file+'\n'+body.trimEnd().split('\n').map(line=>'+'+line).join('\n')+'\n';
}
console.log(patch+'*** End Patch');
