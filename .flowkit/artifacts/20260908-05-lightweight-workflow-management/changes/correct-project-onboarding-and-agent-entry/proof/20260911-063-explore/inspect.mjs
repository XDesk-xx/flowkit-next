import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const proof='.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/correct-project-onboarding-and-agent-entry/proof/20260911-063-explore',head='7af7d85788503dafc50ee162b14deaaf679f99cb';
const digest=b=>createHash('sha256').update(b).digest('hex');
const documents=['flowkit-next-d04-stable-core-closure-final-reference(1).md','flowkit-next-d05-decoupling-analysis.md','flowkit-next-delivery-change-plan.md'];
const documentsAtCheckpoint=documents.map(path=>{
 const b=fs.readFileSync(path),historical=execFileSync('git',['show',head+':'+path],{windowsHide:true,maxBuffer:4*1024*1024});
 assert(b.equals(historical));return {path,bytes:b.length,sha256:digest(b),gitSource:head+':'+path};
});
const paths=['README.md','package.json','config/verification/full-test.json','src/cli/request.ts','src/cli/action-context.ts','src/cli/current-run-chain.ts','src/cli/trusted-change-coordination.ts','src/cli/foundation-cli.ts','src/internal/manager-installation.ts','src/internal/delivery-start-content.ts','src/domain/action-guidance-execution.ts','openspec/specs/foundation-cli-surface/spec.md','openspec/specs/author-action-guidance/spec.md','openspec/changes/archive/2026-09-08-035-connect-openspec-action-workflow/design.md'];
const inputs=paths.map(path=>{const b=fs.readFileSync(path);return {path,bytes:b.length,sha256:digest(b)};});
const refs=[];
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())scan(p);else if(/\.(md|ts|mjs|yaml|json)$/.test(p)){const lines=fs.readFileSync(p,'utf8').split('\n');lines.forEach((line,index)=>{for(const document of documents)if(line.includes(document))refs.push({path:p,line:index+1,document,text:line.trim()});});}}}
for(const d of ['src','tests','scripts','skills','config','.agents','openspec/delivery-groups'])scan(d);
const result={documentsAtCheckpoint,inputs,currentConsumerReferences:refs,interpretation:'三个根文件的 exact filename 在所查活动代码/测试/产品 HOW/config 中无读取；D04/D05 manifest 的 reference 是规划出处。Start 的任意 planningReference.artifact 仍是实际输入，不能推广为所有未来规划都可删除。旧历史引用不改写，删除仅限已明确三个文件，Git 保留原内容。',limitations:['未执行真实新会话；未安装新发行包；pack 是当前 build 的 dry-run 清单。','源码扫描不是运行时无依赖的完整证明，Apply 需验证删除后的相关消费者与实际接入路径。']};
fs.writeFileSync(proof+'/source-audit.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({documents:documentsAtCheckpoint.length,gitRecoverable:true,exactFilenameReferences:refs,inputs:inputs.length}));
