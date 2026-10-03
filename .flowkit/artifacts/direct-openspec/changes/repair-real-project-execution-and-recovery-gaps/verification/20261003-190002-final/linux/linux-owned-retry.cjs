const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const folder='/verification/final-current/quality-owned-source-confirmed';
fs.mkdirSync(folder);
const out=fs.openSync(folder+'/stdout.txt','wx'),err=fs.openSync(folder+'/stderr.txt','wx');
const startedAt=new Date().toISOString();
const r=spawnSync('pnpm',['quality:owned-source'],{cwd:'/candidate',stdio:['ignore',out,err]});
fs.closeSync(out);fs.closeSync(err);
fs.writeFileSync(folder+'/command.json',JSON.stringify({program:'pnpm',args:['quality:owned-source'],node:process.version,startedAt,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,fixtureCorrection:'Capture helper moved out of candidate root to /verification',mode:'direct-openspec-verification',formalRun:false,deliveryFullTest:false},null,2)+'\n',{flag:'wx'});
process.exitCode=r.status===0?0:1;
