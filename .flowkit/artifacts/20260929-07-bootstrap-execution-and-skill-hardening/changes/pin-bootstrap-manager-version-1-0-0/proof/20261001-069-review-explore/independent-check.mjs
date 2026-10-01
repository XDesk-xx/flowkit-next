import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
const root=process.cwd();assert.equal(path.resolve(root).toLowerCase(),'d:\\projects\\flowkit-next');
const prefix='.flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/',prior=prefix+'pin-bootstrap-manager-version-1-0-0/proof/20261001-068-explore/',own=prefix+'pin-bootstrap-manager-version-1-0-0/proof/20261001-069-review-explore/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const report=JSON.parse(await fs.readFile(prior+'version-probe-report.json','utf8'));
for(const [p,h]of [['package.json',report.sourcePackageSha256],['docs/onboarding.md',report.sourceDocsSha256],['pnpm-lock.yaml',report.lockSha256]])assert.equal(hash(await fs.readFile(p)),h);
assert.equal(hash(await fs.readFile(path.join(report.scratch,'pnpm-lock.yaml'))),report.lockSha256);
for(const c of report.commands){assert.equal(c.exitCode,0);for(const k of ['stdout','stderr']){const b=await fs.readFile(prior+c.id+'.'+k+'.txt');assert.equal(b.length,c[k+'Bytes']);assert.equal(hash(b),c[k+'Sha256']);}}
function unpack(b){const result=new Map(),str=b=>b.toString('utf8').split('\0')[0];for(let pos=0;pos+512<=b.length;){const h=b.subarray(pos,pos+512);if(h.every(v=>v===0))break;const name=[str(h.subarray(345,500)),str(h.subarray(0,100))].filter(Boolean).join('/'),size=parseInt(str(h.subarray(124,136)).trim(),8)||0,type=str(h.subarray(156,157));assert.ok(type==='0'||type==='');assert.ok(name.startsWith('package/')&&!name.includes('..')&&!result.has(name));result.set(name,b.subarray(pos+512,pos+512+size));pos+=512+Math.ceil(size/512)*512;}return result;}
const bytes=await fs.readFile(prior+report.package.file);assert.equal(hash(bytes),report.package.sha256);
const current=unpack(gunzipSync(bytes)),old=unpack(gunzipSync(await fs.readFile(prefix+'validate-and-freeze-bootstrap-manager/proof/20261001-065-apply/flowkit-next-0.1.0.tgz')));
assert.deepEqual([...current.keys()].sort(),[...old.keys()].sort());const changed=[];
for(const [name,b]of current){assert.ok(b.equals(await fs.readFile(path.join(report.scratch,'installation/node_modules/flowkit-next',name.slice(8)))));if(!b.equals(old.get(name)))changed.push(name);}
assert.deepEqual(changed.sort(),['package/docs/onboarding.md','package/package.json']);
const expected=JSON.parse(old.get('package/package.json'));expected.version='1.0.0';assert.deepEqual(JSON.parse(current.get('package/package.json')),expected);
assert.equal(current.get('package/docs/onboarding.md').toString('utf8'),old.get('package/docs/onboarding.md').toString('utf8').replace('flowkit-next-0.1.0.tgz','flowkit-next-1.0.0.tgz'));
const scratch=await fs.mkdtemp(path.join(root,'.tmp','reviewer069-input-'));
const config=JSON.parse(await fs.readFile('config/verification/full-test.json','utf8'));
for(const relative of config.inputs)await fs.cp(path.join(root,relative),path.join(scratch,relative),{recursive:true});
await fs.mkdir(path.join(scratch,'docs'),{recursive:true});const docs=await fs.readFile('docs/onboarding.md');await fs.writeFile(path.join(scratch,'docs/onboarding.md'),docs);
config.checks=[{checkId:'identity-probe',program:process.execPath,args:['-e','process.exit(0)'],cwd:'.'}];
const save=()=>fs.writeFile(path.join(scratch,'config/verification/full-test.json'),JSON.stringify(config)+'\n');await save();
const {readFullTestInput}=await import(pathToFileURL(path.join(root,'src/internal/full-test-input.ts')));
const baseline=await readFullTestInput(scratch);await fs.writeFile(path.join(scratch,'docs/onboarding.md'),Buffer.concat([docs,Buffer.from('\nreviewer drift\n')]));
const ignored=await readFullTestInput(scratch);assert.equal(baseline.inputRef,ignored.inputRef);
await fs.writeFile(path.join(scratch,'docs/onboarding.md'),docs);config.inputs.push('docs/onboarding.md');await save();const included=await readFullTestInput(scratch);
await fs.writeFile(path.join(scratch,'docs/onboarding.md'),Buffer.concat([docs,Buffer.from('\nreviewer drift\n')]));const detected=await readFullTestInput(scratch);assert.notEqual(included.inputRef,detected.inputRef);assert.ok(included.files.includes('docs/onboarding.md'));
const result={packageSha256:hash(bytes),members:current.size,changedMembers:changed,installedMembersMatch:true,frozenLockMatches:true,rawCommandsVerified:report.commands.length,scratch,inputProbe:{currentIgnoresDrift:baseline.inputRef===ignored.inputRef,selectedDetectsDrift:included.inputRef!==detected.inputRef,baselineInputRef:baseline.inputRef,selectedInputRef:included.inputRef,driftedInputRef:detected.inputRef},scope:'Actual package bytes and installed copy compared to preserved E package. Fresh input-selection fixture uses current inputs/excludes/environment and a fixed no-op Node check definition instead of production check resources. No checks or Formal Full Test executed.'};
await fs.writeFile(own+'checks.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
