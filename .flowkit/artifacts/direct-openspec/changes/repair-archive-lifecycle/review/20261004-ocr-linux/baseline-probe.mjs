import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { executeScopedCheckpoint } from '/work/baseline/src/internal/git-checkpoint-execution.ts';
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
