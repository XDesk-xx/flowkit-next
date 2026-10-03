// Reviewer-only reproduction; synthetic lifecycle facts are disposable fixtures.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const load = file => import(pathToFileURL(path.join(process.cwd(), file)).href);
const { executionFixture } = await load('tests/unit/domain/execution-recovery-fixture.ts');
const { runMaterialLocation, readEffectiveRun, sha256 } = await load('src/cli/run-effective-facts.ts');
const results = [];
for (const verdict of ['approved', 'rejected']) {
  for (const declaredMap of [false]) {
    const f = await executionFixture(4);
    const observation = { verdict, declaredMap };
    try {
      const original = await runMaterialLocation(f.base, f.lastId);
      const manifest = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${f.lastId}/candidate.json`;
      const bytes = Buffer.from(JSON.stringify({ artifactHashes: f.candidate }) + '\n');
      await mkdir(path.dirname(path.join(f.repositoryRoot, manifest)), { recursive: true });
      await writeFile(path.join(f.repositoryRoot, manifest), bytes);
      original.record.result.facts = { proofRefs: [{ path: manifest, bytes: bytes.length, sha256: sha256(bytes), deliveryId: 'delivery-one', changeId: 'change-one', runId: f.lastId, purpose: 'synthetic review candidate' }] };
      await writeFile(path.join(f.repositoryRoot, original.runRoot, 'result.json'), JSON.stringify(original.record.result) + '\n');
      const before = await runMaterialLocation(f.base, f.lastId);
      observation.correct = await f.call('action correct', { ...f.base, runId: f.lastId, role: 'author', ownerAuthority: { ref: 'owner:' + 'c'.repeat(64), decision: 'correct-run-metadata', deliveryId: 'delivery-one', changeId: 'change-one', scope: ['correct-run-metadata'], sourceRef: 'synthetic:reviewer-reproduction' }, expectedRunHashes: before.originalHashes, additions: { artifactHashes: f.candidate }, candidateEvidenceRef: manifest });
      const started = await f.call('action start', { ...f.base, actionId: 'review-apply', role: 'reviewer' });
      observation.start = started.effect;
      await readEffectiveRun(f.base, f.lastId);
      observation.preparedRead = 'passed';
      observation.finish = await f.call('action finish', { ...f.base, runId: started.runId, role: 'reviewer', terminal: true, result: { runId: started.runId, actionIdentity: { deliveryId: 'delivery-one', changeId: 'change-one', actionId: 'review-apply' }, authorConclusion: null, reviewerVerdict: verdict, verificationVerdict: null, nextBoundary: verdict === 'approved' ? 'archive' : verdict === 'changes-requested' ? 'revise-apply' : null, facts: { reviewedRunId: f.lastId, ...(declaredMap ? { artifactHashes: f.candidate } : {}), proofRefs: [] } } });
      try { await readEffectiveRun(f.base, f.lastId); observation.terminalRead = 'passed'; }
      catch (error) { observation.terminalRead = error.message; }
      for (const command of ['status', 'next']) {
        try { observation[command] = await f.call(command, f.base); }
        catch (error) { observation[command] = { error: error.stdout || error.message }; }
      }
      
      try {
        observation.downstream = await f.call('action start', {
          ...f.base, role: 'author', actionId: verdict === 'approved' ? 'archive' : 'revise-apply',
          ...(verdict === 'approved' ? { applicableChecks: [{ id: 'test:domain', reason: 'synthetic downstream reproduction' }] } : { ownerAuthority: { ref: 'owner:' + 'd'.repeat(64), decision: 'revise-action', deliveryId: 'delivery-one', changeId: 'change-one', scope: ['revise-apply'], sourceRef: 'synthetic:reviewer-downstream-probe' } }),
        });
      } catch (error) { observation.downstream = { error: error.stdout || error.message }; }
      const after = await runMaterialLocation(f.base, f.lastId);
      observation.originalUnchanged = JSON.stringify(before.originalHashes) === JSON.stringify(after.originalHashes);
    } catch (error) { observation.unexpectedError = error.stdout || error.stack; }
    finally { await f.cleanup(); }
    results.push(observation);
    console.log(JSON.stringify(observation));
  }
}
await writeFile(path.join(import.meta.dirname, 'downstream-results.json'), JSON.stringify(results, null, 2) + '\n', { flag: 'wx' });
if (results.some(item => item.unexpectedError)) process.exitCode = 1;
