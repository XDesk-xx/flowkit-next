import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import YAML from 'yaml';

const repo=process.cwd(), proof=path.dirname(fileURLToPath(import.meta.url));
const attempt=path.join(proof,process.argv[2] || 'attempt-01');
fs.mkdirSync(attempt);
const delivery='20260908-05-lightweight-workflow-management';
const change='separate-manager-assets-from-target-project';
const runs='.flowkit/runs/'+delivery+'/'+change;
const author=runs+'/20260908-010-propose';
const startedAt=new Date().toISOString();
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ref=p=>{
  const absolute=path.resolve(p), stat=fs.lstatSync(absolute);
  assert(stat.isFile()&&!stat.isSymbolicLink(),p);
  assert.equal(fs.realpathSync(absolute),absolute,p);
  const b=fs.readFileSync(absolute);
  return {path:path.relative(repo,absolute).split(path.sep).join('/'),bytes:b.length,
    sha256:createHash('sha256').update(b).digest('hex')};
};
const inputs=new Map();
const check=r=>{assert.deepEqual(ref(r.path),r);inputs.set(r.path,r);};
const include=p=>check(ref(p));
function refsIn(v){
  if(!v||typeof v!=='object')return;
  if(typeof v.path==='string'&&typeof v.bytes==='number'&&typeof v.sha256==='string')check(v);
  for(const child of Object.values(v))refsIn(child);
}
const save=(file,value)=>fs.writeFileSync(path.join(attempt,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
function command(label,exe,args){
  const begin=new Date().toISOString();
  const r=spawnSync(exe,args,{cwd:repo,encoding:'buffer',timeout:45000});
  for(const stream of ['stdout','stderr'])fs.writeFileSync(path.join(attempt,label+'.'+stream+'.txt'),r[stream]||Buffer.alloc(0),{flag:'wx'});
  save(label+'.command.json',{exe,args,cwd:repo,startedAt:begin,completedAt:new Date().toISOString(),
    exitCode:r.status,signal:r.signal,error:r.error?.message||null});
  assert.equal(r.error,undefined,label+': '+r.error?.message);
  assert.equal(r.status,0,label+': '+r.stderr?.toString());
  return r.stdout.toString('utf8');
}
try{
  assert.deepEqual(fs.readdirSync(author).sort(),['action.md','context.json','result.json']);
  const result=read(author+'/result.json'), context=read(author+'/context.json');
  assert.equal(result.kind,'external-orchestrator-propose-result');
  assert.equal(result.canonicalFlowkitRuntimeRun,false);
  assert.equal(result.status,'terminal');assert.equal(result.verdict,'PASS');
  assert.equal(context.action,'propose');assert.equal(context.role,'author');
  assert.equal(result.nextBoundary,'review-propose');
  for(const key of ['runId','deliveryId','changeId','projectOrdinal','previousRunId'])assert.equal(result[key],context[key]);
  refsIn(result);include(author+'/result.json');
  const prior=read(result.reviewSource.path);
  assert.equal(prior.runId,result.previousRunId);assert.equal(prior.verdict,'approved');
  assert.equal(prior.nextBoundary,'propose');
  refsIn(prior.runArtifacts);check(prior.reviewedExplore);check(prior.reviewedResult);
  const validation=read(result.evidence.path);
  refsIn(validation);
  const manifest=YAML.parse(fs.readFileSync(validation.manifest.path,'utf8'));
  assert.equal(manifest.bootstrap.mode,'independent-bootstrap');
  assert.deepEqual(manifest.changes.filter(c=>c.state==='active').map(c=>c.id),[change]);
  assert.equal(manifest.changes.find(c=>c.id===change).projectOrdinal,result.projectOrdinal);
  const authority=manifest.ownerDecisions.find(d=>d.ref===context.ownerActivationRef);
  assert.equal(authority.decision,'activate-change');assert.equal(authority.changeId,change);
  assert.deepEqual(authority.scope,['explore']);
  const stats=[];
  for(const r of validation.artifacts){
    const text=fs.readFileSync(r.path,'utf8');
    assert(!text.includes('\r')&&!/[ \t]+$/m.test(text),r.path);
    assert(text.endsWith('\n')&&!text.endsWith('\n\n'),r.path);
    if(!r.path.includes('/specs/'))continue;
    const capability=path.basename(path.dirname(r.path));
    const basePath='openspec/specs/'+capability+'/spec.md';
    include(basePath);
    const base=fs.readFileSync(basePath,'utf8');
    let mode,added=0,modified=0,scenarios=0;
    for(const block of text.split(/(?=^## |^### Requirement: )/m)){
      if(block.startsWith('## '))mode=block.split('\n')[0];
      if(!block.startsWith('### Requirement: '))continue;
      const title=block.split('\n')[0].trim();
      const old=base.split(/(?=^### Requirement: )/m).find(b=>b.split('\n')[0].trim()===title);
      if(mode==='## MODIFIED Requirements'){
        assert(old,title);modified++;
        for(const scenario of old.match(/^#### Scenario: .+$/gm)||[])assert(block.includes(scenario.trim()),scenario);
      }else{
        assert.equal(mode,'## ADDED Requirements');assert.equal(old,undefined,title);added++;
      }
      assert.match(block,/\bSHALL\b/);assert.match(block,/^#### Scenario:/m);
      scenarios+=(block.match(/^#### Scenario:/gm)||[]).length;
    }
    stats.push({capability,added,modified,scenarios});
  }
  const tasks=fs.readFileSync('openspec/changes/'+change+'/tasks.md','utf8');
  const pending=(tasks.match(/^- \[ \] /gm)||[]).length;
  assert.equal(pending,validation.taskCount);assert.equal((tasks.match(/^- \[[xX]\] /gm)||[]).length,0);
  const authorProof=path.dirname(path.dirname(result.evidence.path));
  include(authorProof+'/check.mjs');
  const authorAttempt=path.dirname(result.evidence.path);
  for(const label of ['strict','status','diff-check','tracked-diff']){
    for(const suffix of ['command.json','stdout.txt','stderr.txt'])include(authorAttempt+'/'+label+'.'+suffix);
    const c=read(authorAttempt+'/'+label+'.command.json');
    assert.equal(c.exitCode,0);assert.equal(c.error,null);assert.equal(c.signal,null);
  }
  const priorStatus=read(authorAttempt+'/status.stdout.txt');
  assert.equal(priorStatus.isPlanningComplete,true);assert(priorStatus.artifacts.every(a=>a.status==='done'));
  const source=fs.readFileSync(authorProof+'/check.mjs','utf8');
  const recordObservation={
    code:'AUTHOR_RESULT_ACTION_KEY_OVERWRITE',
    resultActionType:typeof result.action,
    contextAction:context.action,
    resultKind:result.kind,
    actionArtifactMatches:result.action.sha256===ref(author+'/action.md').sha256,
    duplicateGeneratorKey:source.includes("action: 'propose'")&&source.includes('action: await ref('),
    meaning:'Non-canonical bootstrap record: stage is unambiguous from bound context/kind/chain; do not rewrite terminal bytes.'
  };
  assert.equal(recordObservation.resultActionType,'object');
  assert(recordObservation.actionArtifactMatches&&recordObservation.duplicateGeneratorKey);
  for(const p of ['AGENTS.md','config/tools/toolchain.lock.json','package.json',
    'flowkit-next-delivery-change-plan.md','flowkit-next-d05-decoupling-analysis.md',
    'src/domain/single-action-execution.ts','src/cli/entrypoint.ts'])include(p);
  const lock=read('config/tools/toolchain.lock.json');
  const runtime='C:/Users/xuser/.flowkit/tools/openspec/'+lock.openspec.version;
  const packageIdentity=read(runtime+'/package.json');
  assert.equal(packageIdentity.name,lock.openspec.packageName);
  assert.equal(packageIdentity.version,lock.openspec.version);
  const tool=path.join(runtime,lock.openspec.entrypoint);
  assert(fs.statSync(tool).isFile());
  const version=command('version',process.execPath,[tool,'--version']).trim();
  assert.equal(version,lock.openspec.version);
  command('strict',process.execPath,[tool,'validate',change,'--strict']);
  const status=JSON.parse(command('status',process.execPath,[tool,'status','--change',change,'--json']));
  assert.equal(status.changeName,change);
  assert.equal(fs.realpathSync(status.root.path),fs.realpathSync(repo));
  assert.equal(status.isPlanningComplete,true);assert(status.artifacts.every(a=>a.status==='done'));
  command('git-diff-check','git',['diff','--check']);
  assert.equal(command('git-tracked-diff','git',['diff','--name-only']).trim(),validation.manifest.path);
  for(const r of inputs.values())check(r);
  const outputs=fs.readdirSync(attempt).map(p=>ref(path.join(attempt,p)));
  save('summary.json',{kind:'independent-review-propose-checks',startedAt,completedAt:new Date().toISOString(),
    reviewedRunId:result.runId,status:'PASS',inputs:[...inputs.values()],outputs,stats,pendingTasks:pending,
    authorRecordObservation:recordObservation,openspecVersion:version,planningComplete:true,inputsUnchanged:true,
    limits:['Structure/readback is not semantic approval; independent Reviewer owns verdict.',
      'No implementation tests, package installation, candidate lifecycle or Formal Full Test executed.']});
  console.log(JSON.stringify({status:'PASS',inputs:inputs.size,stats,pendingTasks:pending,recordObservation}));
}catch(error){
  save('failure.json',{status:'FAIL',startedAt,failedAt:new Date().toISOString(),message:error.message,stack:error.stack});
  throw error;
}
