import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
const proof='.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/decouple-full-test-from-repository-tracking/proof/20260909-030-explore';
const run='.flowkit/runs/20260908-05-lightweight-workflow-management/004-decouple-full-test-from-repository-tracking/20260909-030-explore';
const manifest='openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml';
const old= parse(execFileSync('git',['show','HEAD:'+manifest],{encoding:'utf8'}));
const current=parse(fs.readFileSync(manifest,'utf8'));
const selected=current.changes.find(c=>c.id==='decouple-full-test-from-repository-tracking');
assert.equal(selected.state,'active');assert.equal(selected.projectOrdinal,36);
selected.state='planned';delete selected.projectOrdinal;
const owner=current.ownerDecisions.pop();
assert.equal(owner.changeId,'decouple-full-test-from-repository-tracking');
assert.equal(owner.decision,'activate-change');assert.match(owner.ref,/^owner:[a-f0-9]{64}$/);
assert.deepEqual(current,old);
const changed=execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split('\n');
assert.deepEqual(changed,[manifest]);
const untracked=execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n');
assert(untracked.every(p=>p.startsWith(proof+'/')||p.startsWith(run+'/')||p.startsWith('openspec/changes/decouple-full-test-from-repository-tracking/')));
assert(!fs.existsSync('.flowkit/runs/20260908-05-lightweight-workflow-management/decouple-full-test-from-repository-tracking'));
assert.deepEqual(fs.readdirSync('openspec/changes/decouple-full-test-from-repository-tracking').sort(),['.openspec.yaml','explore.md']);
const ref=p=>{const bytes=fs.readFileSync(p);return {path:p,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};};
const evidence=[];
for(const label of ['probe','scope-probe']) {
 const p=proof+'/'+label+'/command.json';const cmd=JSON.parse(fs.readFileSync(p));
 assert.equal(cmd.exitCode,0); evidence.push(ref(p));
 for(const stream of ['stdout','stderr']) {assert.deepEqual(ref(cmd[stream].path),cmd[stream]);evidence.push(cmd[stream]);}
}
const sourcePaths=['src/internal/applicable-check-candidate.ts','src/internal/applicable-check-process.ts','src/domain/delivery-full-test-execution.ts','src/domain/delivery-operation-execution.ts','src/domain/delivery-final-execution.ts','src/internal/delivery-final-coordination.ts','src/internal/delivery-required-evidence-source.ts','src/cli/checkpoint-authorization.ts','openspec/specs/formal-full-test-execution-and-correction/spec.md','openspec/specs/lightweight-engineering-gate/spec.md','package.json','AGENTS.md','skills/delivery/full-test/SKILL.md'];
console.log(JSON.stringify({checkedAt:new Date().toISOString(),platform:process.platform,node:process.version,
 manifest:ref(manifest),owner,scope:'only selected activation/ordinal/new Owner fact; other manifest semantics unchanged',
 physicalRunPath:run,priorHistoryChanged:false,productionChanged:false,proposalCreated:false,
 evidence,sources:sourcePaths.map(ref),artifacts:[ref('openspec/changes/decouple-full-test-from-repository-tracking/.openspec.yaml'),ref('openspec/changes/decouple-full-test-from-repository-tracking/explore.md'),...['capture.mjs','probe.mjs','scope-probe.mjs','verify.mjs'].map(p=>ref(proof+'/'+p))],
 startRecords:['action.md','context.json'].map(p=>ref(run+'/'+p))},null,2));
