// Independent Reviewer readback and focused checks; no Author seal or product mutation.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, lstat, readFile, readdir, realpath, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = await realpath(process.cwd());
const own = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2];
assert.match(attempt ?? '', /^attempt-[0-9]+$/);
const out = path.join(own, attempt);
await mkdir(out);
const startedAt = new Date().toISOString();
const runRoot = '.flowkit/runs/20260908-05-lightweight-workflow-management/remove-archify-from-delivery-workflow';
const hash = b => createHash('sha256').update(b).digest('hex');
const json = v => JSON.stringify(v, null, 2) + '\n';
const save = (name, value) => writeFile(path.join(out, name), value, { flag: 'wx' });
async function read(file) {
  assert.ok(!path.isAbsolute(file) && !file.split(/[\\/]/).includes('..'));
  const target = path.join(root, file);
  const stat = await lstat(target);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), file);
  assert.equal((await realpath(target)).toLowerCase(), target.toLowerCase(), file);
  return readFile(target);
}
const parse = async file => JSON.parse((await read(file)).toString('utf8'));
async function verify(ref) {
  const value = await read(ref.path);
  assert.equal(hash(value), ref.sha256, ref.path);
  if (ref.bytes !== undefined) assert.equal(value.length, ref.bytes, ref.path);
}
const results = {};
async function command(label, program, args) {
  const start = new Date().toISOString();
  const result = spawnSync(program, args, {cwd: root, windowsHide: true, encoding: 'utf8', timeout: 180000, maxBuffer: 32*1024*1024});
  await save(label+'.stdout.txt',result.stdout??'');
  await save(label+'.stderr.txt',result.stderr??'');
  const meta={program,args,cwd:root,startedAt:start,finishedAt:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message??null};
  await save(label+'.command.json',json(meta));
  results[label]=meta;
  assert.equal(result.status,0,label+': '+(result.error??result.stderr));
  return result.stdout;
}
try {
  const author = await parse(runRoot+'/20260908-005-apply/result.json');
  const context = await parse(runRoot+'/20260908-005-apply/context.json');
  assert.equal(author.status,'terminal');
  assert.equal(author.authorConclusion,'PASS');
  assert.equal(author.action,'apply');
  assert.equal(author.nextBoundary,'review-apply');
  assert.equal(author.previousRunId,'20260908-004-review-propose');
  await verify({path:runRoot+'/'+context.previousRunId+'/result.json',sha256:context.previousResultSha256});
  const previous = await parse(runRoot+'/'+context.previousRunId+'/result.json');
  assert.equal(previous.verdict,'approved');
  await verify({path:runRoot+'/20260908-005-apply/action.md',sha256:author.artifactHashes.actionSha256});
  await verify({path:runRoot+'/20260908-005-apply/context.json',sha256:author.artifactHashes.contextSha256});
  for (const ref of Object.values(previous.runArtifacts)) await verify(ref);
  const priorContext=await parse(previous.runArtifacts.context.path);
  for (const ref of priorContext.reviewedArtifacts) {
    if(ref.path.endsWith('/tasks.md')) {
      const tasks=(await read(ref.path)).toString('utf8');
      assert.equal(hash(Buffer.from(tasks.replace(/^- \[x\] /gm,'- [ ] '))),ref.sha256,'Only task markers may change');
    } else await verify(ref);
  }
  await verify(author.verification);
  const summary = await parse(author.verification.path);
  const sourceRefs = summary.sourceScope;
  for(const ref of [...author.changedArtifacts,...sourceRefs,...summary.checks.flatMap(c=>c.artifacts),summary.implementationReport]) await verify(ref);
  for(const file of author.deletedArtifacts) await assert.rejects(access(file),{code:'ENOENT'});
  assert.equal(hash(Buffer.from(JSON.stringify(sourceRefs))),summary.sourceScopeSha256);
  const tests = [
    'delivery-without-archify','delivery-final-execution','delivery-final-projection',
    'delivery-operation-execution','delivery-repository-integration-execution',
    'delivery-repository-integration-accepted-object','delivery-required-evidence-source',
    'delivery-start-execution','delivery-continuity-semantic-boundaries',
    'managed-tool-resolution','foundation-cli-surface','delivery-full-test-execution'
  ].map(name=>'tests/unit/domain/'+name+'.test.ts');
  await command('typecheck',process.execPath,['node_modules/typescript/bin/tsc','--noEmit']);
  const stdout = await command('focused-tests',process.execPath,['--import','tsx','--test',...tests]);
  const counts=Object.fromEntries([...stdout.matchAll(/^# (tests|pass|fail|skipped) (\d+)\s*$/gm)].map(m=>[m[1],Number(m[2])]));
  assert.equal(counts.fail,0);assert.equal(counts.skipped,0);assert.equal(counts.tests,counts.pass);
  await command('openspec-validate',process.execPath,['C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js','validate','remove-archify-from-delivery-workflow','--strict']);
  await command('git-diff-check','git',['diff','--check']);
  for(const ref of [...author.changedArtifacts,...sourceRefs]) await verify(ref);
  const outputs=[];
  for(const file of (await readdir(out)).sort()) {
    const value=await readFile(path.join(out,file));
    outputs.push({file,bytes:value.length,sha256:hash(value)});
  }
  const report={kind:'independent-review-apply-checks',reviewedRunId:author.runId,reviewRunId:'20260908-006-review-apply',startedAt,completedAt:new Date().toISOString(),
    platform:process.platform,node:process.version,reviewedResultSha256:hash(await read(runRoot+'/20260908-005-apply/result.json')),
    authorVerificationRef:author.verification,sourceScopeSha256:summary.sourceScopeSha256,
    readback:{changedArtifacts:author.changedArtifacts.length,sourceInputs:sourceRefs.length,deletedArtifacts:author.deletedArtifacts.length,approvedPlanningSemanticsUnchanged:true,allBoundBytesMatch:true},
    focusedTests:{files:tests.length,...counts},commands:results,outputs,
    limits:['Reviewer focused checks only, not Formal Full Test; Linux evidence is separately read back, not re-executed here.','No candidate Reviewer Guidance or lifecycle authority was invoked.']};
  await save('summary.json',json(report));
  console.log(json({saved:path.relative(root,out),readback:report.readback,focusedTests:report.focusedTests}));
} catch(error) {
  await save('failure.json',json({startedAt,completedAt:new Date().toISOString(),commands:results,error:String(error),stack:error.stack}));
  throw error;
}
