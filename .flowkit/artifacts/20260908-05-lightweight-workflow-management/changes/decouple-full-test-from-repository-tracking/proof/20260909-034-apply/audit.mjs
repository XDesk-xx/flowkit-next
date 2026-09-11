import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd();
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const paths=[...new Set((git('diff','--name-only','--','src','tests')+'\n'+git('ls-files','--others','--exclude-standard','--','src','tests')).split('\n').filter(Boolean))];
const files=[];
for(const file of paths){const bytes=await fs.readFile(file);const lines=bytes.toString('utf8').replace(/\n$/,'').split('\n').length;assert.ok(lines<=650,file+': '+lines);files.push({path:file,lines,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
for(const skill of ['.agents/skills/implementation-convergence','.agents/skills/revise-apply','skills/actions/apply','skills/actions/revise-apply']){
 const body=await fs.readFile(skill+'/SKILL.md','utf8');
 for(const clause of ['bounded formatting、lint','空白不自动阻断 checkpoint','不逐 Change 加 attributes','不创建提交权限','不继承普通 Action 的 candidate/reuse'])assert.ok(body.includes(clause),skill+': '+clause);
}
const agents=await fs.readFile('AGENTS.md','utf8');
assert.match(agents,/Git checkpoint 的空白诊断（不是统一提交阻断）/);
assert.match(agents,/bootstrap\/history 自检用 test:bootstrap/);
assert.equal(git('diff','--name-only','--','.flowkit/runs','architecture','.gitattributes','src/domain/policy-and-next-boundary.ts','src/domain/run-result-persistence.ts'),'');
const manifest=await fs.readFile('openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml');
assert.equal(createHash('sha256').update(manifest).digest('hex'),'8a9ebbdd2430da92b2bc5cee0cd9139c6b8e6385d71585219265bb27e570e84f');
console.log(JSON.stringify({status:'passed',changedSourceAndTests:files,maxLines:Math.max(...files.map(f=>f.lines)),manifestUnchangedSinceReview:true,historicalTrackedChanges:[],gateHowParity:true,head:git('rev-parse','HEAD'),branch:git('branch','--show-current')},null,2));
