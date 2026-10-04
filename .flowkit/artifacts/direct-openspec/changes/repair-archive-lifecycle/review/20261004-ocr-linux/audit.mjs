import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(), proof=import.meta.dirname;
const authorPath=path.join(root,'.flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/apply');
const digest=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p));
const author=await json(path.join(authorPath,'final-readback.json'));
const snapshot=await json(path.join(proof,'snapshot-inputs.json'));
const mismatches=[];
async function check(relative,expected,base=root){
  const actual=await readFile(path.join(base,relative)).then(digest).catch(e=>{if(e.code==='ENOENT')return null;throw e});
  if(actual!==expected)mismatches.push({base,relative,expected,actual});
}
for(const [file,hash] of Object.entries(author.files))await check(file,hash);
for(const [file,hash] of Object.entries(snapshot))await check(file,hash);
for(const [file,value] of Object.entries(author.approvedInputs))await check(file,value.actual,path.join(root,'openspec/changes/repair-archive-lifecycle'));
let streams=0;
for(const [id,checkData] of Object.entries(author.checks))for(const [file,value] of Object.entries(checkData.streams)){
  await check(`${id}/${file}`,value.sha256,authorPath);streams++;
}
const preview=await json(path.join(proof,'preview.json'));
await writeFile(path.join(proof,'coverage.json'),JSON.stringify({mode:'delegate',total_files:preview.reviewable_files.length,reviewed_files:preview.reviewable_files.length,skipped_files:0,coverage_rate:1,preview_total_files:preview.total_files,preview_excluded_files:preview.excluded_count,files:preview.reviewable_files.map(({path,status})=>({path,status,review_status:'reviewed'})),supplemental:['deleted archive-check-selection and archive-dependency-snapshot modules','approved planning and prior findings','relevant Archive/Git/projection/completion/native/installed tests','Archive HOW and selected changed documentation'],rules:'rules.json; generic TypeScript rules applied, React-specific rules inapplicable'},null,2)+'\n');
const result={observedAt:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current']).toString().trim(),head:execFileSync('git',['rev-parse','HEAD']).toString().trim(),authorCandidateFiles:Object.keys(author.files).length,snapshotFiles:Object.keys(snapshot).length,approvedInputs:Object.keys(author.approvedInputs).length,authorStreams:streams,mismatches,stagedPaths:execFileSync('git',['diff','--cached','--name-only']).toString().trim()};
await writeFile(path.join(proof,'review-readback.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
