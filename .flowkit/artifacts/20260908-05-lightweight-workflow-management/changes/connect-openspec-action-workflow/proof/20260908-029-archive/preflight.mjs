import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
const change = 'connect-openspec-action-workflow';
const delivery = '20260908-05-lightweight-workflow-management';
const root = '.flowkit/runs/' + delivery + '/' + change + '/';
const proof = '.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-029-archive';
const ref = p => { const b = fs.readFileSync(p); return { path:p, bytes:b.length, sha256:createHash('sha256').update(b).digest('hex') }; };
const apply = JSON.parse(fs.readFileSync(root + '20260908-027-revise-apply/result.json'));
const review = JSON.parse(fs.readFileSync(root + '20260908-028-review-apply/result.json'));
assert.equal(review.applyApproved, true);
assert.equal(review.nextBoundary, 'archive');
for (const a of apply.artifacts) assert.deepEqual(ref(a.path), a);
const ordinals = new Map();
for(const file of fs.readdirSync('openspec/delivery-groups').filter(x=>x.endsWith('.yaml'))) {
 const manifest = parse(fs.readFileSync('openspec/delivery-groups/'+file,'utf8'));
 for(const c of manifest.changes ?? []) if(c.projectOrdinal !== undefined) {
  assert(Number.isInteger(c.projectOrdinal) && c.projectOrdinal > 0);
  assert(!ordinals.has(c.projectOrdinal), 'duplicate ordinal');
  ordinals.set(c.projectOrdinal,c.id);
 }
}
const manifestPath = 'openspec/delivery-groups/'+delivery+'.yaml';
const manifestText = fs.readFileSync(manifestPath,'utf8');
const selected = parse(manifestText).changes.filter(c=>c.id===change);
assert.equal(selected.length,1); assert.equal(selected[0].state,'active'); assert.equal(selected[0].projectOrdinal,35);
const changeRoot='openspec/changes/'+change;
const archivePath='openspec/changes/archive/2026-09-08-035-'+change;
assert(!fs.existsSync(archivePath));
const tasks=fs.readFileSync(changeRoot+'/tasks.md','utf8');
assert(!/- \[ \]/.test(tasks));
const files = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name):[ref(dir+'/'+e.name)]);
const caps=['action-guidance-execution','foundation-cli-surface','run-result-persistence','single-action-execution-terminal-boundary'];
for(const cap of caps) {
 const main=fs.readFileSync('openspec/specs/'+cap+'/spec.md','utf8').replace(/\r\n/g,'\n');
 const delta=fs.readFileSync(changeRoot+'/specs/'+cap+'/spec.md','utf8').replace(/\r\n/g,'\n');
 const merged=fs.readFileSync(proof+'/converged-specs/'+cap+'/spec.md','utf8');
 assert(!/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/m.test(merged));
 assert.equal(merged.split('### Requirement: ')[0],main.split('### Requirement: ')[0]);
 const chunks=t=>t.split(/^### Requirement: /m).slice(1).map(b=>'### Requirement: '+b.trimEnd());
 const ds=delta.split(/^## (?:ADDED|MODIFIED) Requirements\s*$/m).slice(1).flatMap(chunks);
 for(const block of ds) assert(merged.includes(block),cap+' missing delta');
 for(const block of chunks(main)) {
  const name=block.split('\n')[0];
  const replacement=ds.find(b=>b.split('\n')[0]===name);
  if(!replacement) assert(merged.includes(block),cap+' lost untouched block');
  else for(const s of block.matchAll(/^#### Scenario: (.+)$/gm)) assert(replacement.includes(s[0]),'lost scenario');
 }
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),review:ref(root+'20260908-028-review-apply/result.json'),
 apply:ref(root+'20260908-027-revise-apply/result.json'),candidateFiles:apply.artifacts.length,projectOrdinal:35,
 archivePath,completedTasks:(tasks.match(/- \[x\]/g)||[]).length,manifest:ref(manifestPath),
 changeFiles:files(changeRoot),canonicalBefore:caps.map(c=>ref('openspec/specs/'+c+'/spec.md')),
 converged:caps.map(c=>ref(proof+'/converged-specs/'+c+'/spec.md')),
 specsRulesSnapshot:{source:'openspec instructions specs --change '+change+' --json',version:'1.10.0',fetchedBeforeDryRun:true,artifactId:'specs',rulesAbsent:true},
 inheritedRemovals:apply.inheritedRemovals,exactRemovals:apply.exactRemovals},null,2));
