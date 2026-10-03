// Independent review probes. Synthetic lifecycle facts exist only in disposable fixtures.
import { mkdir, readFile, writeFile, readdir, symlink, realpath } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const repo = process.cwd();
const load = p => import(pathToFileURL(path.join(repo, p)).href);
const { executionFixture } = await load('tests/unit/domain/execution-recovery-fixture.ts');
const { runMaterialLocation, readEffectiveRun, sha256 } = await load('src/cli/run-effective-facts.ts');
const { assertArchiveSourceFiles } = await load('src/internal/archive-dependency-snapshot.ts');
const f = await executionFixture(4);
try {
  const loc = await runMaterialLocation(f.base, f.lastId);
  const manifest = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${f.lastId}/candidate.json`;
  const bytes = Buffer.from(JSON.stringify({ artifactHashes: f.candidate }) + '\n');
  await mkdir(path.dirname(path.join(f.repositoryRoot, manifest)), { recursive: true });
  await writeFile(path.join(f.repositoryRoot, manifest), bytes);
  const original = loc.record.result;
  original.facts = { proofRefs: [{ path: manifest, bytes: bytes.length, sha256: sha256(bytes), deliveryId: 'delivery-one', changeId: 'change-one', runId: f.lastId, purpose: 'synthetic review reproduction candidate' }] };
  await writeFile(path.join(f.repositoryRoot, loc.runRoot, 'result.json'), JSON.stringify(original) + '\n');
  const current = await runMaterialLocation(f.base, f.lastId);
  console.log('CORRECT', JSON.stringify(await f.call('action correct', {
    ...f.base, runId: f.lastId, role: 'author',
    ownerAuthority: { ref: 'owner:' + 'c'.repeat(64), decision: 'correct-run-metadata', deliveryId: 'delivery-one', changeId: 'change-one', scope: ['correct-run-metadata'], sourceRef: 'synthetic:independent-review-probe' },
    expectedRunHashes: current.originalHashes, additions: { artifactHashes: f.candidate }, candidateEvidenceRef: manifest,
  })));
  const started = await f.call('action start', { ...f.base, actionId: 'review-apply', role: 'reviewer' });
  console.log('START', JSON.stringify(started));
  try { await readEffectiveRun(f.base, f.lastId); console.log('EFFECTIVE_AUTHOR_OK'); }
  catch (e) { console.log('EFFECTIVE_AUTHOR_FAILED', e.message); }
  try {
    console.log('FINISH', JSON.stringify(await f.call('action finish', {
      ...f.base, runId: started.runId, role: 'reviewer', terminal: true,
      result: { runId: started.runId, actionIdentity: { deliveryId: 'delivery-one', changeId: 'change-one', actionId: 'review-apply' }, authorConclusion: null, reviewerVerdict: 'approved', verificationVerdict: null, nextBoundary: 'archive', facts: { reviewedRunId: f.lastId, artifactHashes: f.candidate, proofRefs: [] } },
    })));
  } catch (e) { console.log('FINISH_FAILED', e.stdout || e.message); }
  console.log('REVIEW_FILES', JSON.stringify(await readdir(started.directory)));

  const module = path.join(f.repositoryRoot, 'node_modules/.pnpm/example@1.0.0/node_modules/example');
  const nested = path.join(f.repositoryRoot, 'packages/app/node_modules/example');
  await mkdir(module, { recursive: true });
  await writeFile(path.join(module, 'package.json'), '{"name":"example","version":"1.0.0"}\n');
  await mkdir(path.dirname(nested), { recursive: true });
  await symlink(module, nested, process.platform === 'win32' ? 'junction' : 'dir');
  console.log('WORKSPACE_LINK_RESOLVES_INSIDE_TARGET', path.relative(f.repositoryRoot, await realpath(nested)));
  try { await assertArchiveSourceFiles(path.join(f.repositoryRoot, 'packages')); console.log('WORKSPACE_SOURCE_OK'); }
  catch (e) { console.log('WORKSPACE_SOURCE_FAILED', e.message); }
} finally { await f.cleanup(); }
