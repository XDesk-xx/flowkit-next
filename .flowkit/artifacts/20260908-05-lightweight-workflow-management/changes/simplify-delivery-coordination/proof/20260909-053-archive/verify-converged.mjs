import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const evidence=process.env.EVIDENCE_DIR;
const cfg=JSON.parse(await fs.readFile('config/verification/full-test.json','utf8'));
const checks=[...cfg.checks,{checkId:'specs-strict',program:'node',args:['/runtime/tools/openspec/1.10.0/bin/openspec.js','validate','--specs','--strict'],cwd:'.'}];
const results=[];
for(const c of checks){
 const start=new Date().toISOString();const out=spawnSync(process.execPath,c.args,{cwd:process.cwd(),encoding:null,maxBuffer:64*1024*1024});
 const ref=async (name,b)=>{await fs.writeFile(evidence+'/'+name,b,{flag:'wx'});return {file:name,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};};
 const stdout=await ref(c.checkId+'.stdout.txt',out.stdout??Buffer.alloc(0));const stderr=await ref(c.checkId+'.stderr.txt',out.stderr??Buffer.alloc(0));
 const record={checkId:c.checkId,program:process.execPath,args:c.args,cwd:process.cwd(),startedAt:start,finishedAt:new Date().toISOString(),exitCode:out.status,signal:out.signal,error:out.error?.message??null,stdout,stderr};
 await fs.writeFile(evidence+'/'+c.checkId+'.command.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 results.push(record);console.log(c.checkId+': '+out.status);
}
await fs.writeFile(evidence+'/verification.json',JSON.stringify({fixtureOnly:true,canonicalConvergence:true,formalD05FullTest:false,results},null,2)+'\n',{flag:'wx'});
process.exitCode=results.every(c=>c.exitCode===0)?0:1;
