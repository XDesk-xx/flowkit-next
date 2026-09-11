import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{spawnSync}from'node:child_process';import{isDeepStrictEqual}from'node:util';import{parse}from'yaml';
const repo=process.cwd(),own=path.dirname(fileURLToPath(import.meta.url)),name=process.argv[2];
if(!/^attempt-\d+$/.test(name??''))throw Error('new attempt required');
const out=path.join(own,name);fs.mkdirSync(out);
const old='.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-043-explore/';
const run='.flowkit/runs/20260908-05-lightweight-workflow-management/005-simplify-delivery-coordination/20260909-043-explore/';
const ref=p=>{const b=fs.readFileSync(p);return{path:path.relative(repo,p).replaceAll('\\','/'),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}};
const save=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
let checked=0;function verify(v){if(!v||typeof v!=='object')return;if(typeof v.path==='string'&&typeof v.sha256==='string'&&Number.isInteger(v.bytes)){const a=ref(v.path);if(a.bytes!==v.bytes||a.sha256!==v.sha256)throw Error('input drift '+v.path);checked++;}for(const x of Object.values(v))verify(x);}
const author=JSON.parse(fs.readFileSync(run+'result.json','utf8'));verify(author);
const observations=JSON.parse(fs.readFileSync(old+'observations.json','utf8'));verify(observations);
const context=JSON.parse(fs.readFileSync(run+'context.json','utf8'));const previous=JSON.parse(fs.readFileSync(context.previousDeliveryRun,'utf8'));
verify(previous.acceptedReview);for(const item of previous.specSync.artifacts)verify(item);
if(author.action!=='explore'||author.nextBoundary!=='review-explore'||author.status!=='terminal'||previous.verdict!=='archived')throw Error('invalid chain');
const manifest=parse(fs.readFileSync('openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml','utf8'));
const selected=manifest.changes.find(c=>c.id===author.changeId);if(selected.state!=='active'||selected.projectOrdinal!==37||!selected.dependsOn.every(id=>manifest.changes.some(c=>c.id===id&&c.state==='completed')))throw Error('coordination mismatch');
const authority=manifest.ownerDecisions.find(d=>d.sourceRef===author.ownerSourceRef);
if(!authority||authority.decision!=='activate-change'||authority.changeId!==author.changeId||!isDeepStrictEqual(authority.scope,['explore']))throw Error('activation mismatch');
save('input-audit.json',{reviewedResult:ref(run+'result.json'),previousArchive:ref(context.previousDeliveryRun),verifiedReferences:checked,observationCount:observations.rows.length,selectedChange:selected,ownerSourceRef:authority.sourceRef});
const target=path.join(out,'coordination-fixture/openspec/delivery-groups');fs.mkdirSync(target,{recursive:true});fs.writeFileSync(path.join(target,'coordination-proof.yaml'),fs.readFileSync(old+'coordination-input.yaml'),{flag:'wx'});
const commands=[];
function call(id,program,args){const start=new Date().toISOString(),r=spawnSync(program,args,{cwd:repo,windowsHide:true,encoding:null,maxBuffer:8*1024*1024});
for(const stream of ['stdout','stderr'])fs.writeFileSync(path.join(out,id+'.'+stream+'.txt'),r[stream]??Buffer.alloc(0),{flag:'wx'});
const c={id,program,args,cwd:repo,startedAt:start,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?.message??null,stdout:ref(path.join(out,id+'.stdout.txt')),stderr:ref(path.join(out,id+'.stderr.txt'))};commands.push(c);save(id+'.command.json',c);console.log(JSON.stringify({id,exitCode:c.exitCode,error:c.error}));}
call('bounded-proof',process.execPath,['--import','tsx',path.join(own,'probe.mjs'),out]);
call('openspec-version',process.execPath,['C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js','--version']);
call('openspec-active',process.execPath,['C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js','list','--json']);
let observationsMatch=null;if(fs.existsSync(path.join(out,'observations.json'))){const actual=JSON.parse(fs.readFileSync(path.join(out,'observations.json'),'utf8'));observationsMatch=isDeepStrictEqual(actual.rows,observations.rows)&&isDeepStrictEqual(actual.sources,observations.sources);}
const result={kind:'independent-review-explore-checks',inputAudit:ref(path.join(out,'input-audit.json')),commands,observationsMatch,allCommandsExitZero:commands.every(c=>c.exitCode===0&&!c.error),implementationAcceptance:false,formalD05FullTest:false};save('summary.json',result);console.log(JSON.stringify({verifiedReferences:checked,observationsMatch,allCommandsExitZero:result.allCommandsExitZero}));process.exitCode=result.allCommandsExitZero&&observationsMatch?0:1;
