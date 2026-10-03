// Synthetic disposable fixture. Only the host clock is advanced after a real prestate was saved.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const load = p => import(pathToFileURL(path.resolve(p)).href);
const { executionFixture } = await load('tests/unit/domain/execution-recovery-fixture.ts');
const { archiveChange } = await load('src/cli/support-change-archive.ts');
const { inspectAction } = await load('src/cli/action-inspect.ts');
const f = await executionFixture();
const RealDate = globalThis.Date;
try {
  const runtime = path.join(f.flowkitHome, 'tools/openspec/1.10.0/bin/openspec.js');
  const original = await readFile(runtime, 'utf8');
  await writeFile(runtime, `if(process.argv[2]==='archive'){const fs=require('node:fs');const path=require('node:path');const root=process.cwd();if(!root.includes('flowkit-archive-')){console.error('synthetic failure before business effect');process.exit(9)}const n=new Date();const date=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');const target=path.join(root,'openspec/changes/archive',date+'-'+process.argv[3]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(path.join(root,'openspec/changes',process.argv[3]),target);process.exit(0)}\n` + original);
  await mkdir(path.join(f.repositoryRoot, 'config/verification'), { recursive: true });
  await writeFile(path.join(f.repositoryRoot, 'config/verification/full-test.json'), JSON.stringify({ inputs: ['openspec'], exclude: [], environment: [], checks: [{ checkId: 'candidate-check', program: 'git', args: ['hash-object','candidate.txt'], cwd: '.' }] }));
  const started = await f.call('action start', { ...f.base, actionId: 'archive', role: 'author', applicableChecks: [{id:'candidate-check',reason:'synthetic diagnostic probe'}] });
  const target = { ...f.base, runId: started.runId };
  console.log('START', JSON.stringify(started));
  console.log('FIRST_ARCHIVE', JSON.stringify(await archiveChange(target, f.installation)));
  const prestate = path.join(f.repositoryRoot, '.flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects', started.runId, 'prestate.json');
  const before = await readFile(prestate);
  const tomorrow = new RealDate(); tomorrow.setDate(tomorrow.getDate()+1);
  globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [tomorrow.getTime()])); } };
  console.log('NEXT_DAY_INSPECT', JSON.stringify(await inspectAction(target, f.installation)));
  console.log('NEXT_DAY_ARCHIVE', JSON.stringify(await archiveChange(target, f.installation)));
  console.log('PRESTATE_UNCHANGED', before.equals(await readFile(prestate)));
} finally { globalThis.Date = RealDate; await f.cleanup(); }
