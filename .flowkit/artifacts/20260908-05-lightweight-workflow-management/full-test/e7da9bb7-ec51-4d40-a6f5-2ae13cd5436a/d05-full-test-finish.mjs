import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const d='20260908-05-lightweight-workflow-management',id='e7da9bb7-ec51-4d40-a6f5-2ae13cd5436a';
const p=`.flowkit/artifacts/${d}/full-test/${id}`;
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const ref=f=>{const b=fs.readFileSync(f);return {path:f,bytes:b.length,sha256:hash(b)};};
const start=read(p+'/start.json');
const platforms=['linux','windows'].map(name=>{
 const r=read(p+'/'+name+'/result.json');assert.equal(r.results.length,9);
 for(const [file,digest] of r.files)assert.equal(hash(fs.readFileSync(file)),digest,'current input drift: '+file);
 for(const check of r.results){const command=read(p+'/'+name+'/'+check.checkId+'/command.json');assert.deepEqual(command,check);for(const s of check.streams){const b=fs.readFileSync(p+'/'+name+'/'+s.path);assert.equal(b.length,s.bytes);assert.equal(hash(b),s.sha256);}}
 return {platform:name,status:r.status,failedChecks:r.results.filter(c=>c.status!=='passed').map(c=>c.checkId),result:ref(p+'/'+name+'/result.json'),inputHash:r.inputHash};
});
assert.equal(platforms[0].inputHash,platforms[1].inputHash);
const result={kind:'independent-bootstrap-full-test-result',canonicalFlowkitRuntimeOperation:false,projectId:'flowkit-next',deliveryId:d,attemptId:id,startedAt:start.startedAt,finishedAt:new Date().toISOString(),status:platforms.every(p=>p.status==='passed')?'passed':'failed',ownerAuthority:start.ownerAuthority,config:start.config,platforms,inputIdentityMatchesCurrent:true,rawStreamsVerified:true,standardActionRunCreated:false,productionMutation:false,gitMutation:false,deliveryFinalExecuted:false,nextBoundary:'owner-decision',note:'本记录为 D05 independent-bootstrap 真实验证结果，不伪装 candidate 生命周期接纳。Linux 初始容器 root 执行导致 chmod(000) 读取拒绝用例失败；原始失败保留，不计为 PASS。'};
fs.writeFileSync(p+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});assert.deepEqual(read(p+'/result.json'),result);fs.copyFileSync('.tmp/d05-full-test-finish.mjs',p+'/d05-full-test-finish.mjs',fs.constants.COPYFILE_EXCL);console.log(JSON.stringify({result:ref(p+'/result.json'),status:result.status,platforms}));
