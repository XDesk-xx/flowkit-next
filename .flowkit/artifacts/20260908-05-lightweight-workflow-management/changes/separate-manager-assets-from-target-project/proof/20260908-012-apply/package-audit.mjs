import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const archive = '.tmp/d05-012-package/flowkit-next-0.1.0.tgz';
const listed = spawnSync('tar',['-tf',archive],{encoding:'utf8'});
assert.equal(listed.status,0,listed.stderr);
const files = listed.stdout.trim().split(/\r?\n/).filter(x=>!x.endsWith('/')).map(x=>x.replace(/^package\//,''));
assert.equal(new Set(files).size,files.length);
for (const file of files) assert.ok(/^(dist\/|skills\/(actions|delivery|tools\/openspec|vendors\/openspec)\/|config\/tools\/toolchain.lock.json$|package.json$|README.md$)/.test(file),file);
assert.ok(!files.some(x=>/archify|node_modules|\.agents|\.flowkit|stale-entry/.test(x)));
async function walk(root, prefix='') {
 const files=[];
 for(const entry of await readdir(root,{withFileTypes:true})) {
  const relative=prefix+entry.name;
  if(entry.isDirectory())files.push(...await walk(path.join(root,entry.name),relative+'/'));
  else files.push(relative);
 }
 return files;
}
const expected=(await walk('src')).filter(x=>x.endsWith('.ts')).map(x=>'dist/'+x.slice(0,-3)+'.js').sort();
assert.deepEqual(files.filter(x=>x.startsWith('dist/')).sort(),expected);
const installed='.tmp/d05-012-install/node_modules/flowkit-next';
for (const file of files) {
 const archived=spawnSync('tar',['-xOf',archive,'package/'+file],{maxBuffer:1024*1024});
 assert.equal(archived.status,0);
 assert.deepEqual(await readFile(path.join(installed,file)),archived.stdout,file);
 if(file !== 'package.json') assert.deepEqual(archived.stdout,await readFile(file),file);
}
const manifest=JSON.parse(await readFile(path.join(installed,'package.json'),'utf8'));
assert.deepEqual(Object.keys(manifest.dependencies),['yaml']);
const sourceManifest=JSON.parse(await readFile('package.json','utf8'));
for(const key of ['name','version','type','engines','dependencies','bin','files']) assert.deepEqual(manifest[key],sourceManifest[key],key);
assert.ok(files.includes(manifest.bin.flowkit));
for(const file of files.filter(x=>x.endsWith('SKILL.md'))) {
 const body=await readFile(path.join(installed,file),'utf8');
 for(const match of body.matchAll(/skills\/(?:tools|vendors|actions|delivery)\/[a-z0-9/.-]+\/SKILL\.md/g)) assert.ok(files.includes(match[0]),match[0]);
}
console.log(JSON.stringify({archive,sha256:createHash('sha256').update(await readFile(archive)).digest('hex'),fileCount:files.length,emittedModuleCount:expected.length,installedBytesMatchCurrentSource:true,files},null,2));
