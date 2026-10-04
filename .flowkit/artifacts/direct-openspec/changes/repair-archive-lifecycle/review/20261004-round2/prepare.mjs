import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=process.cwd(), proof=import.meta.dirname;
const ocr='C:/nvm4w/nodejs/node_modules/@alibaba-group/open-code-review/bin/ocr.js';
for(const [name,args] of [['preview',['delegate','preview','--format','json','--exclude','.flowkit/**,openspec/**,docs/**,skills/**,AGENTS.md,README.md','--background','Re-review repair-archive-lifecycle RA-01 to RA-03 fixes against prior review. Direct artifact review only; verify exact unchanged scope and real Linux executable mode, archive source exclusion and date continuation.']]]){
  const r=spawnSync(process.execPath,[ocr,...args],{cwd:root,maxBuffer:32*1024*1024});
  await writeFile(path.join(proof,name+'.json'),r.stdout);if(r.status!==0)throw Error(r.stderr.toString());
}
const preview=JSON.parse(await readFile(path.join(proof,'preview.json')));
const rules=spawnSync(process.execPath,[ocr,'delegate','rule','--format','json',...preview.reviewable_files.map(f=>f.path)],{cwd:root,maxBuffer:32*1024*1024});
if(rules.status!==0)throw Error(rules.stderr.toString());
await writeFile(path.join(proof,'rules.json'),rules.stdout);
const old=JSON.parse(await readFile(path.join(root,'.flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/review/20261004-ocr-linux/snapshot-inputs.json')));
const hashes={},changed=[];
const snapshot=path.join(root,'.tmp/ocr-archive-round2-snapshot');
for(const [file,prior] of Object.entries(old)){
  const bytes=await readFile(path.join(root,file));
  hashes[file]=createHash('sha256').update(bytes).digest('hex');
  if(hashes[file]!==prior)changed.push(file);
  await mkdir(path.dirname(path.join(snapshot,file)),{recursive:true});
  await writeFile(path.join(snapshot,file),bytes);
}
await writeFile(path.join(proof,'snapshot-inputs.json'),JSON.stringify(hashes,null,2)+'\n');
await writeFile(path.join(proof,'delta-files.json'),JSON.stringify(changed,null,2)+'\n');
for(const file of ['run-check.mjs','boundary-probes.mjs'])await copyFile(path.join(root,'.flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/review/20261004-ocr-linux',file),path.join(proof,file));
console.log(JSON.stringify({reviewable:preview.reviewable_files.length,snapshotFiles:Object.keys(hashes).length,changed}));
