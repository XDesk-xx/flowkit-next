import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [rootArg,outArg,platformLabel]=process.argv.slice(2);
const root=path.resolve(rootArg),out=path.resolve(outArg);
const hash=b=>createHash('sha256').update(b).digest('hex');
const save=(f,v)=>fs.writeFileSync(path.join(out,f),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
fs.mkdirSync(out,{recursive:true});
const configBytes=fs.readFileSync(root+'/config/verification/full-test.json');
const config=JSON.parse(configBytes);assert.equal(config.checks.length,9);
function snapshot(){
 const files=new Map();
 function visit(p){if(config.exclude.some(e=>p===e||p.startsWith(e+'/')))return;const f=path.join(root,p),s=fs.lstatSync(f);assert(!s.isSymbolicLink());if(s.isDirectory())for(const n of fs.readdirSync(f).sort())visit(p+'/'+n);else{assert(s.isFile());files.set(p,hash(fs.readFileSync(f)));}}
 for(const p of config.inputs)visit(p);
 // Current onboarding tests consume these package documentation resources.
 for(const p of ['README.md','docs/onboarding.md'])visit(p);
 return [...files].sort(([a],[b])=>a.localeCompare(b));
}
const files=snapshot(),inputHash=hash(JSON.stringify(files));
const start={kind:'independent-bootstrap-full-test-platform',platformLabel,platform:process.platform,arch:process.arch,node:process.version,executableHash:hash(fs.readFileSync(process.execPath)),startedAt:new Date().toISOString(),configSha256:hash(configBytes),inputHash,files,environment:config.environment.map(n=>({name:n,valueHash:process.env[n]===undefined?null:hash(process.env[n])})),flowkitHome:process.env.FLOWKIT_HOME,checks:config.checks};save('start.json',start);
const results=[];
for(const check of config.checks){
 assert.equal(hash(JSON.stringify(snapshot())),inputHash,'test input drift');
 const dir=path.join(out,check.checkId);fs.mkdirSync(dir);
 const stdout=fs.openSync(dir+'/stdout.txt','wx'),stderr=fs.openSync(dir+'/stderr.txt','wx');
 const began=new Date().toISOString();assert.equal(check.program,'node');
 console.log('START '+platformLabel+' '+check.checkId);
 const r=spawnSync(process.execPath,check.args,{cwd:path.resolve(root,check.cwd),env:process.env,stdio:['ignore',stdout,stderr],windowsHide:true});
 fs.closeSync(stdout);fs.closeSync(stderr);
 const streams=['stdout.txt','stderr.txt'].map(n=>{const b=fs.readFileSync(dir+'/'+n);return {path:check.checkId+'/'+n,bytes:b.length,sha256:hash(b)};});
 const record={...check,program:process.execPath,startedAt:began,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?.message??null,status:r.status===0?'passed':'failed',streams};
 save(check.checkId+'/command.json',record);results.push(record);console.log('END '+platformLabel+' '+check.checkId+' '+record.status);
}
assert.equal(hash(JSON.stringify(snapshot())),inputHash,'final input drift');
const result={...start,finishedAt:new Date().toISOString(),status:results.every(r=>r.status==='passed')?'passed':'failed',results};save('result.json',result);assert.deepEqual(JSON.parse(fs.readFileSync(out+'/result.json')),result);console.log(JSON.stringify({platformLabel,status:result.status,inputHash,checks:results.map(r=>({checkId:r.checkId,status:r.status}))}));process.exitCode=result.status==='passed'?0:1;
