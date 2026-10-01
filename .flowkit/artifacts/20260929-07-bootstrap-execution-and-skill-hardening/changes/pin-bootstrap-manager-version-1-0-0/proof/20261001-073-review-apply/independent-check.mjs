import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=process.cwd(),proof=path.dirname(fileURLToPath(import.meta.url));
const delivery='20260929-07-bootstrap-execution-and-skill-hardening';
const author=path.join(root,`.flowkit/artifacts/${delivery}/changes/pin-bootstrap-manager-version-1-0-0/proof/20261001-072-apply`);
const old=path.join(root,`.flowkit/artifacts/${delivery}/changes/validate-and-freeze-bootstrap-manager/proof/20261001-065-apply/flowkit-next-0.1.0.tgz`),pkg=path.join(author,'flowkit-next-1.0.0.tgz');
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={commands:[],authorCommands:[],observations:{},initialAttempt:{exitCode:1,stage:'package/source: package.json',reason:'Reviewer initially assumed byte-identical source and packed package.json. Actual pack omits packageManager and scripts.prepack and reorders keys; the E package comparison already preserved the same transformation. Corrected to compare all metadata after these exact omissions. Initial extract-old/extract-new raw streams retained.'}};
const scratch=await fs.mkdtemp(path.join(root,'.tmp/reviewer073-'));
async function run(id,program,args){const start=new Date().toISOString(),out=[],err=[];const child=spawn(program,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>out.push(b));child.stderr.on('data',b=>err.push(b));const result=await new Promise(resolve=>{child.on('error',e=>resolve({exitCode:null,error:String(e)}));child.on('close',(exitCode,signal)=>resolve({exitCode,signal}));});const stdout=Buffer.concat(out),stderr=Buffer.concat(err);for(const [s,b]of [['stdout',stdout],['stderr',stderr]])await fs.writeFile(path.join(proof,`${id}.${s}.txt`),b,{flag:'wx'});report.commands.push({id,program,args,cwd:root,start,end:new Date().toISOString(),...result,stdoutSha256:hash(stdout),stderrSha256:hash(stderr)});assert.equal(result.exitCode,0,id);return stdout;}
for(const name of ['checks-report.json','package-report.json']){const r=JSON.parse(await fs.readFile(path.join(author,name)));for(const c of r.commands){for(const s of ['stdout','stderr']){const b=await fs.readFile(path.join(author,`${c.id}.${s}.txt`));assert.equal(b.length,c[`${s}Bytes`]);assert.equal(hash(b),c[`${s}Sha256`]);}assert.equal(c.exitCode,c.id==='frozen-install'?1:0);assert.equal(c.error,null);assert.equal(c.signal,null);report.authorCommands.push({id:c.id,exitCode:c.exitCode});}}
const failure=await fs.readFile(path.join(author,'frozen-install.stdout.txt'),'utf8');assert.match(failure,/NO_TTY|no TTY/i);report.observations.frozenInstallFailure=failure.trim();
assert.equal(hash(await fs.readFile(old)),'1b2c88c9263d5892946d3d9aacba79a6392eb3d8b3b37fa3c87aebcc1550cba0');
report.observations.packageSha256=hash(await fs.readFile(pkg));
for(const [id,archive]of [['old',old],['new',pkg]]){const dest=path.join(scratch,id);await fs.mkdir(dest);await run(`final-extract-${id}`,'tar',['-xzf',archive,'-C',dest]);}
async function members(dir,prefix=''){const map=new Map();for(const e of await fs.readdir(dir,{withFileTypes:true})){const relative=prefix+e.name,p=path.join(dir,e.name);if(e.isDirectory())for(const[k,v]of await members(p,relative+'/'))map.set(k,v);else{assert.ok(e.isFile());map.set(relative,hash(await fs.readFile(p)));}}return map;}
const oldMap=await members(path.join(scratch,'old/package')),newMap=await members(path.join(scratch,'new/package'));
assert.deepEqual([...oldMap.keys()].sort(),[...newMap.keys()].sort());const changed=[...newMap].filter(([k,v])=>v!==oldMap.get(k)).map(([k])=>k).sort();assert.deepEqual(changed,['docs/onboarding.md','package.json']);
const oldMeta=JSON.parse(await fs.readFile(path.join(scratch,'old/package/package.json'))),newMeta=JSON.parse(await fs.readFile(path.join(scratch,'new/package/package.json')));
assert.equal(newMeta.version,'1.0.0');assert.deepEqual({...newMeta,version:oldMeta.version},oldMeta);
const beforeDoc=await fs.readFile(path.join(scratch,'old/package/docs/onboarding.md'),'utf8'),afterDoc=await fs.readFile(path.join(scratch,'new/package/docs/onboarding.md'),'utf8');assert.equal(afterDoc,beforeDoc.replace('flowkit-next-0.1.0.tgz','flowkit-next-1.0.0.tgz'));
const sourceMeta=JSON.parse(await fs.readFile(path.join(root,'package.json')));delete sourceMeta.packageManager;delete sourceMeta.scripts.prepack;assert.deepEqual(newMeta,sourceMeta);
for(const[k,v]of newMap)if(k!=='package.json')assert.equal(hash(await fs.readFile(path.join(root,k))),v,`package/source: ${k}`);
const install=path.join(scratch,'install');await fs.mkdir(install);
await run('production-install',process.execPath,['C:/nvm4w/nodejs/node_modules/npm/bin/npm-cli.js','install','--prefix',install,'--omit=dev','--no-audit','--no-fund',pkg]);
const installed=path.join(install,'node_modules/flowkit-next');assert.deepEqual(await members(installed),newMap);
const help=JSON.parse((await run('installed-help',process.execPath,[path.join(installed,newMeta.bin.flowkit),'--help'])).toString());assert.equal(help.kind,'help');
report.observations.package={memberCount:newMap.size,changed,nonMetadataMembersByteMatchSource:true,metadataMatchesSourceAfterExactPackOmissions:['packageManager','scripts.prepack'],allInstalledMembersMatchPackage:true,version:newMeta.version,helpKind:help.kind};
const configBytes=await fs.readFile(path.join(root,'config/verification/full-test.json')),config=JSON.parse(configBytes);assert.equal(config.inputs.filter(p=>p==='docs/onboarding.md').length,1);
const fixture=path.join(scratch,'input');await fs.mkdir(fixture);for(const relative of config.inputs){const dest=path.join(fixture,relative);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.cp(path.join(root,relative),dest,{recursive:true});}
config.checks=[{checkId:'selection-only',program:'node',args:['--version'],cwd:'.'}];const configPath=path.join(fixture,'config/verification/full-test.json');await fs.writeFile(configPath,JSON.stringify(config));
const {readFullTestInput}=await import(pathToFileURL(path.join(root,'src/internal/full-test-input.ts')));
const doc=path.join(fixture,'docs/onboarding.md'),original=await fs.readFile(doc),baseline=await readFullTestInput(fixture);assert.ok(baseline.files.includes('docs/onboarding.md'));
await fs.writeFile(doc,Buffer.concat([original,Buffer.from('\nREVIEWER_CONTROLLED_DRIFT\n')]));const drift=await readFullTestInput(fixture);assert.notEqual(baseline.inputRef,drift.inputRef);
await fs.writeFile(doc,original);const restored=await readFullTestInput(fixture);assert.equal(restored.inputRef,baseline.inputRef);
report.observations.inputSelection={actualConfigSha256:hash(configBytes),baselineInputRef:baseline.inputRef,driftInputRef:drift.inputRef,restoredInputRef:restored.inputRef,checksExecuted:false};
report.limitations=['Windows isolated production installation and input-selection reproduction; no Formal Full Test or Linux acceptance rerun.','Author broad check results inspected and stream identities verified; not independently rerun.'];
await fs.writeFile(path.join(proof,'checks.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report.observations));
