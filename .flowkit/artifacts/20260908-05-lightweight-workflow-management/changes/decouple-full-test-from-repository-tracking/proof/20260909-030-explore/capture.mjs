import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const [label, executable, ...args] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label ?? '') || !executable) throw Error('command required');
const output = path.join(path.dirname(fileURLToPath(import.meta.url)), label);
fs.mkdirSync(output);
const startedAt = new Date().toISOString();
const child = spawnSync(executable,args,{cwd:process.cwd(),maxBuffer:16*1024*1024});
const record = {executable,args,cwd:process.cwd(),startedAt,finishedAt:new Date().toISOString(),exitCode:child.status,error:child.error?.message??null};
for(const stream of ['stdout','stderr']) {
 const bytes=child[stream]??Buffer.alloc(0); const p=path.join(output,stream+'.txt');
 fs.writeFileSync(p,bytes,{flag:'wx'});
 record[stream]={path:path.relative(process.cwd(),p).replaceAll(path.sep,'/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
fs.writeFileSync(path.join(output,'command.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
process.stdout.write(child.stdout??Buffer.alloc(0));process.stderr.write(child.stderr??Buffer.alloc(0));
console.log(JSON.stringify(record));process.exitCode=child.status??1;
