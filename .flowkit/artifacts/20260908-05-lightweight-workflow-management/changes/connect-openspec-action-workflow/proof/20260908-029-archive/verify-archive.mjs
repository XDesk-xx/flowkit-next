import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
const proof = '.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-029-archive';
const before = JSON.parse(fs.readFileSync(proof + '/preflight/stdout.txt'));
const ref = p => { const b = fs.readFileSync(p); return { path:p, bytes:b.length, sha256:createHash('sha256').update(b).digest('hex') }; };
const assertRef = (expected, actualPath = expected.path) => {
  const actual = ref(actualPath);
  assert.equal(actual.bytes, expected.bytes, actualPath);
  assert.equal(actual.sha256, expected.sha256, actualPath);
  return actual;
};
assertRef(before.review);
assertRef(before.apply);
const oldRoot = 'openspec/changes/connect-openspec-action-workflow';
assert(!fs.existsSync(oldRoot));
const moves = before.changeFiles.map(a => ({ from:a.path,
  ...assertRef(a, a.path.replace(oldRoot, before.archivePath)) }));
const mainSpecs = before.converged.map(a => assertRef(a,
  a.path.replace(proof + '/converged-specs', 'openspec/specs')));
const manifestText = fs.readFileSync(before.manifest.path, 'utf8');
const pattern = /(  - id: "connect-openspec-action-workflow"[\s\S]*?    state: )completed/;
assert(pattern.test(manifestText));
const reversed = Buffer.from(manifestText.replace(pattern, '$1active'));
assert.equal(reversed.length, before.manifest.bytes);
assert.equal(createHash('sha256').update(reversed).digest('hex'), before.manifest.sha256);
assert.equal(parse(manifestText).changes.find(c=>c.id==='connect-openspec-action-workflow').projectOrdinal,35);
const apply = JSON.parse(fs.readFileSync(before.apply.path));
let unchanged = 0;
for(const a of apply.artifacts) {
  if(a.path === before.manifest.path || a.path.startsWith(oldRoot + '/')) continue;
  assertRef(a); unchanged++;
}
for(const p of before.inheritedRemovals.paths) assert(!fs.existsSync(p), p);
console.log(JSON.stringify({ verifiedAt:new Date().toISOString(), archivePath:before.archivePath,
  projectOrdinal:35, movedFiles:moves, mainSpecs, manifest:ref(before.manifest.path),
  manifestChange:'exact selected state active -> completed; all other bytes unchanged',
  unchangedReviewedArtifacts:unchanged, inheritedRemovals:before.inheritedRemovals,
  semanticConvergence:'all four canonical files exactly equal the inspected and dry-run verified merge',
  historicalRunRewritten:false, productionMutation:false },null,2));
