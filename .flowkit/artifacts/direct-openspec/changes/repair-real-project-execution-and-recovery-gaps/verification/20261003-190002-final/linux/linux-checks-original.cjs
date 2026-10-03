const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root='/candidate', output='/verification/final-current';
fs.mkdirSync(output,{recursive:true});
function snapshot(){const result={};function visit(relative){for(const e of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){const p=relative+'/'+e.name;if(e.isDirectory())visit(p);else if(e.isFile())result[p]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');else throw Error('Source alias '+p);}}for(const p of ['src','tests','scripts','skills','config'])visit(p);for(const p of ['docs/onboarding.md','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','tsconfig.json','tsconfig.build.json','eslint.config.mjs','dependency-cruiser.config.mjs','.node-version','.gitattributes'])result[p]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');return result;}
const before=snapshot(), results=[];
for(const id of ['typecheck','quality:gate','build','test:domain','test:acceptance','quality:dependency-health','quality:entropy','quality:owned-source']){
 const folder=path.join(output,id.replaceAll(':','-'));fs.mkdirSync(folder,{recursive:true});
 const stdout=fs.openSync(path.join(folder,'stdout.txt'),'wx'),stderr=fs.openSync(path.join(folder,'stderr.txt'),'wx');
 const startedAt=new Date().toISOString();
 const result=spawnSync('pnpm',[id],{cwd:root,env:{...process.env,FLOWKIT_HOME:'/home'},stdio:['ignore',stdout,stderr]});
 fs.closeSync(stdout);fs.closeSync(stderr);
 const record={id,program:'pnpm',args:[id],node:process.version,startedAt,finishedAt:new Date().toISOString(),exitCode:result.status,signal:result.signal,sourceUnchanged:JSON.stringify(before)===JSON.stringify(snapshot()),mode:'direct-openspec-verification',formalRun:false,deliveryFullTest:false};
 fs.writeFileSync(path.join(folder,'command.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});results.push(record);process.stdout.write(JSON.stringify(record)+'\n');
}
fs.writeFileSync(path.join(output,'source-inputs.json'),JSON.stringify(before,null,2)+'\n',{flag:'wx'});
process.exitCode=results.every(r=>r.exitCode===0&&r.sourceUnchanged)?0:1;
