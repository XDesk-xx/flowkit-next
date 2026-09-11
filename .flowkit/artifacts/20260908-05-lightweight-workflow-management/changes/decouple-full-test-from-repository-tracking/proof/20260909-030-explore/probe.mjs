// Explore-only counterexamples. All Git mutations are inside a disposable fixture.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const repo=process.cwd();
const {deriveApplicableCheckCandidateManifest,deriveApplicableCheckCandidateRef}=await import(pathToFileURL(path.join(repo,'src/internal/applicable-check-candidate.ts')));
const {executeExactApplicableCheckProcess}=await import(pathToFileURL(path.join(repo,'src/internal/applicable-check-process.ts')));
const {invokeDeliveryFullTestOperation,priorFactsFromDeliveryFullTestRecord,isTrustedPassedFullTestOutcome}=await import(pathToFileURL(path.join(repo,'src/domain/delivery-full-test-execution.ts')));
await fs.mkdir(path.join(repo,'.tmp'),{recursive:true});
const root=await fs.mkdtemp(path.join(repo,'.tmp','d05-030-proof-'));
const commands=[];
function git(...args) {
 const r=spawnSync('git',['-c','core.longpaths=true',...args],{cwd:root});
 commands.push({args,exitCode:r.status,stdout:r.stdout.toString(),stderr:r.stderr.toString()});
 if(r.status!==0) throw Error('fixture git failed '+args.join(' '));
 return r.stdout.toString();
}
async function put(p,b){await fs.mkdir(path.dirname(path.join(root,p)),{recursive:true});await fs.writeFile(path.join(root,p),b);}
git('init','-q');git('config','user.name','Explore fixture');git('config','user.email','fixture@example.invalid');
await put('source.txt','product\n');await put('.gitattributes',await fs.readFile('.gitattributes'));
git('add','source.txt','.gitattributes');git('commit','-qm','synthetic fixture baseline');
await put('extra-product.txt','untracked product\n');
const initial=await deriveApplicableCheckCandidateManifest(root);assert(initial);
await put('.git/info/exclude','extra-product.txt\n');
const ignored=await deriveApplicableCheckCandidateManifest(root);assert(ignored);
assert(initial.some(x=>x.path==='extra-product.txt'));assert(!ignored.some(x=>x.path==='extra-product.txt'));
await put('extra-product.txt','changed ignored product\n');
const ignoredChanged=await deriveApplicableCheckCandidateRef(root);
const ignoredRef=await deriveApplicableCheckCandidateRef(root);
assert.equal(ignoredChanged,ignoredRef);
await put('.git/info/exclude','');
const beforeArtifact=await deriveApplicableCheckCandidateRef(root);
await put('.flowkit/artifacts/synthetic-delivery/full-test/attempt/stdout.txt',Buffer.from('raw  \r\n\r\n'));
const afterArtifact=await deriveApplicableCheckCandidateRef(root);assert.notEqual(afterArtifact,beforeArtifact);
await put('.flowkit/runs/synthetic-delivery/001-fixture/20260909-001-explore/action.md','synthetic only\n');
assert.equal(await deriveApplicableCheckCandidateRef(root),afterArtifact);
const untrackedWhitespace=spawnSync('git',['diff','--check'],{cwd:root});assert.equal(untrackedWhitespace.status,0);
await put('.flowkit/artifacts/synthetic-delivery/proof/input.bin',Buffer.from('test input  \r\n\r\n'));
await put('.flowkit/artifacts/synthetic-delivery/proof/audit.mjs','// historic fixture\n\n');
git('add','.flowkit/artifacts');
const stagedWhitespace=spawnSync('git',['diff','--cached','--check'],{cwd:root});
assert.notEqual(stagedWhitespace.status,0);
assert(stagedWhitespace.stdout.toString().includes('input.bin'));assert(!stagedWhitespace.stdout.toString().includes('stdout.txt:'));
const processOutcome=await executeExactApplicableCheckProcess(root,process.execPath,['-e',"process.stdout.write('out  \\r\\n');process.stderr.write('err  \\r\\n')"]);
assert.equal(processOutcome.status,'passed');assert(!('stdout' in processOutcome));assert(!('stderr' in processOutcome));
const deliveryId='synthetic-proof-delivery';
const input={deliveryId,ownerAuthority:{ref:'owner:'+'a'.repeat(64),decision:'authorize-formal-full-test',deliveryId,sourceRef:'fixture:synthetic-not-owner-authority',scope:['delivery-full-test']},
checks:[{checkId:'probe',program:process.execPath,args:['-e','process.exit(Number(process.env.FLOWKIT_EXPLORE_PROBE_EXIT??0))'],configRefs:['config:fixture'],toolRefs:['tool:node'],environmentRefs:['environment:synthetic-probe']}]};
process.env.FLOWKIT_EXPLORE_PROBE_EXIT='0';
const passed=await invokeDeliveryFullTestOperation(root,input);
assert.equal(passed.status,'terminal');assert.equal(passed.verdict,'passed');
process.env.FLOWKIT_EXPLORE_PROBE_EXIT='7';
const failed=await invokeDeliveryFullTestOperation(root,input);
assert.equal(failed.status,'terminal');assert.equal(failed.verdict,'failed');
assert.equal(passed.record.executionRef,failed.record.executionRef);
assert(isTrustedPassedFullTestOutcome(passed,deliveryId));
const reused=await invokeDeliveryFullTestOperation(root,input,priorFactsFromDeliveryFullTestRecord(passed.record));
assert.equal(reused.status,'terminal');assert.equal(reused.verdict,'passed');
assert.equal(reused.record.checks[0].status,'reused-passed');
delete process.env.FLOWKIT_EXPLORE_PROBE_EXIT;
console.log(JSON.stringify({kind:'Explore observations, not production acceptance or Formal Full Test',platform:process.platform,node:process.version,fixtureRoot:root,
gitVisibility:{before:initial.map(x=>x.path),afterIgnored:ignored.map(x=>x.path),sameProductBytesDifferentSelection:true},
artifactDrift:{beforeArtifact,afterArtifact,runExcluded:true},
whitespace:{untrackedExit:untrackedWhitespace.status,stagedExit:stagedWhitespace.status,diagnostic:stagedWhitespace.stdout.toString(),rawStdoutExcluded:true},
processOutcome,
attempts:{passed,failed,reused,oldPassValidatorStillTrue:true,limitation:'Synthetic authority and changing controlled environment; proves missing durable current-attempt selection at this API, not actual Final bypass'},
commands},null,2));
