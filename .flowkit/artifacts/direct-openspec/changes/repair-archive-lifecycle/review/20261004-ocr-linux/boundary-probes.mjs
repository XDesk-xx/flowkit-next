import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { executeScopedCheckpoint } from '/work/src/internal/git-checkpoint-execution.ts';
import { gitText } from '/work/src/internal/git-checkpoint-scope.ts';
import { archiveFixture } from '/work/tests/unit/domain/archive-contract-fixture.ts';
import { archiveChange } from '/work/src/cli/support-change-archive.ts';
import { inspectAction } from '/work/src/cli/action-inspect.ts';
import { directoryHashes } from '/work/src/internal/archive-file-identities.ts';
const emit = (id, value) => console.log(JSON.stringify({id,...value}));
const operation = paths => ({kind:'create-new',paths:[...new Set(paths)].sort(),commitMessage:'reviewer disposable fixture',commitShape:null});
const setup = async root => {
  await gitText(root,['config','user.name','ReviewerFixture']);
  await gitText(root,['config','user.email','reviewer@fixture.invalid']);
};
// Real native Linux staging; no production repository mutation.
for (const existing of [false,true]) {
  const root = await mkdtemp('/tmp/reviewer-executable-');
  await gitText(root,['init','-b','main']); await setup(root);
  await writeFile(path.join(root,'run.sh'),'#!/bin/sh\necho reviewed\n');
  if(existing){await gitText(root,['add','run.sh']);await gitText(root,['commit','-m','fixture baseline']);}
  await chmod(path.join(root,'run.sh'),0o755);
  const outcome = await executeScopedCheckpoint(root,'main',operation(['run.sh']),async()=>true);
  emit('executable-'+(existing?'mode-change':'new-file'),{outcome,index:await gitText(root,['ls-files','--stage'])});
}
// Inject a clock boundary after prestate formation, before command intent.
{
  const f=await archiveFixture();
  try {
    const started=await f.start(),target={...f.base,runId:started.runId};
    const RealDate=Date; let calls=0;
    globalThis.Date=class extends RealDate {
      constructor(...args){if(args.length)super(...args);else {super();if(++calls===1)this.setDate(this.getDate()-1);}}
    };
    let interrupted;
    try { interrupted=await archiveChange(target,f.installation); } finally {globalThis.Date=RealDate;}
    const inspection=await inspectAction(target,f.installation);
    const continuation=await archiveChange(target,f.installation);
    emit('midnight-pre-intent',{calls,interrupted,inspection,continuation});
  } finally {await f.cleanup();}
}
// Completed archive cannot leave an active source directory in checkpoint.
{
  const f=await archiveFixture();
  try {
    const root=f.repositoryRoot; await setup(root); await gitText(root,['checkout','-b','main']);
    await gitText(root,['add','--','.gitattributes','candidate.txt','openspec']);
    await gitText(root,['commit','-m','fixture baseline']);
    const started=await f.start();
    const archived=await archiveChange({...f.base,runId:started.runId},f.installation);
    assert.equal(archived.status,'completed',JSON.stringify(archived));
    assert.equal((await f.finish(started.runId,archived)).effect,'confirmed');
    const extra='openspec/changes/change-one/unreviewed.md';
    await mkdir(path.dirname(path.join(root,extra)),{recursive:true});
    await writeFile(path.join(root,extra),'active source resurrected after archive\n');
    const paths=[...Object.keys(f.candidate),extra,'openspec/specs/fixture/nested/spec.md'];
    for(const prefix of [archived.archivePath,'.flowkit/runs/delivery-one/001-change-one','.flowkit/artifacts/delivery-one/changes/001-change-one'])
      paths.push(...Object.keys(await directoryHashes(root,prefix)).map(s=>`${prefix}/${s}`));
    const outcome=await executeScopedCheckpoint(root,'main',operation(paths),async()=>true,f.base);
    emit('archive-source-resurrection',{outcome,sourceInHead:outcome.status==='completed'?await gitText(root,['show',`HEAD:${extra}`]):null});
  } finally {await f.cleanup();}
}
