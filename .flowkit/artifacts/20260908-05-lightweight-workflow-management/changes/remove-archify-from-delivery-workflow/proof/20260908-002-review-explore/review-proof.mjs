// Independent Reviewer observations only; not a lifecycle runner or product test.
// Run from repository root: node --import tsx <this-file> <new-attempt-name>
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const root = await realpath(process.cwd());
const proofRoot = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2];
assert.match(attempt ?? '', /^[a-z0-9][a-z0-9-]*$/);
const out = path.join(proofRoot, attempt);
await mkdir(out); // Preserve every completed/failed prior attempt.
const startedAt = new Date().toISOString();
const deliveryId = '20260908-05-lightweight-workflow-management';
const changeId = 'remove-archify-from-delivery-workflow';
const reviewedRunId = '20260908-001-explore';
const reviewedRun = `.flowkit/runs/${deliveryId}/${changeId}/${reviewedRunId}`;
const authorProof = `.flowkit/artifacts/${deliveryId}/changes/${changeId}/proof/${reviewedRunId}`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const observations = {};
async function save(name, value) {
  await writeFile(path.join(out, name), value, { flag: 'wx' });
}
async function read(relative) {
  assert.ok(!path.isAbsolute(relative) && !relative.split(/[\\/]/).includes('..'));
  const file = path.join(root, relative);
  const stat = await lstat(file);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), relative);
  const resolved = await realpath(file);
  assert.ok(resolved.startsWith(root + path.sep), relative);
  assert.equal(resolved.toLowerCase(), file.toLowerCase(), relative);
  return readFile(file);
}
async function readJson(relative) { return JSON.parse((await read(relative)).toString('utf8')); }
async function verify(entry) {
  const bytes = await read(entry.path);
  assert.equal(bytes.length, entry.bytes, entry.path);
  assert.equal(digest(bytes), entry.sha256, entry.path);
}
async function command(label, program, args) {
  const before = new Date().toISOString();
  const result = spawnSync(program, args, {
    cwd: root, encoding: 'utf8', windowsHide: true,
    timeout: 120000, maxBuffer: 16 * 1024 * 1024,
  });
  await save(`${label}.stdout.txt`, result.stdout ?? '');
  await save(`${label}.stderr.txt`, result.stderr ?? '');
  const record = { program, args, cwd: root, startedAt: before,
    finishedAt: new Date().toISOString(), exitCode: result.status,
    signal: result.signal, error: result.error?.message ?? null };
  await save(`${label}.command.json`, json(record));
  assert.equal(result.status, 0, `${label}: ${result.error ?? result.stderr}`);
  return result.stdout;
}
const moduleAt = relative => import(pathToFileURL(path.join(root, relative)).href);
try {
  const authorResult = await readJson(`${reviewedRun}/result.json`);
  const authorContext = await readJson(`${reviewedRun}/context.json`);
  assert.deepEqual((await readdir(path.join(root, reviewedRun))).sort(), ['action.md', 'context.json', 'result.json']);
  for (const record of [authorResult, authorContext]) {
    assert.equal(record.deliveryId, deliveryId);
    assert.equal(record.changeId, changeId);
    assert.equal(record.runId, reviewedRunId);
    assert.equal(record.action, 'explore');
    assert.equal(record.role, 'author');
    assert.equal(record.canonicalFlowkitRuntimeRun, false);
    assert.equal(record.previousRunId, null);
  }
  assert.equal(authorResult.status, 'terminal');
  assert.equal(authorResult.nextBoundary, 'review-explore');
  const manifest = parse((await read(`openspec/delivery-groups/${deliveryId}.yaml`)).toString('utf8'));
  assert.equal(manifest.bootstrap.mode, 'independent-bootstrap');
  const active = manifest.changes.filter(change => change.state === 'active');
  assert.equal(active.length, 1);
  assert.equal(active[0].id, changeId);
  assert.equal(active[0].projectOrdinal, authorResult.projectOrdinal);
  assert.equal(authorContext.projectOrdinal, authorResult.projectOrdinal);
  assert.ok(manifest.changes.filter(change => change.id !== changeId).every(change => change.state === 'planned'));
  const activation = manifest.ownerDecisions.find(decision => decision.ref === authorResult.ownerActivationRef);
  assert.equal(activation.decision, 'activate-change');
  assert.equal(activation.changeId, changeId);
  assert.deepEqual(activation.scope, ['explore']);
  const ordinalInputs = await readJson(`${authorProof}/attempt-01/ordinal-inputs.json`);
  const currentOrdinals = [];
  for (const name of await readdir(path.join(root, 'openspec/delivery-groups'))) {
    if (!name.endsWith('.yaml')) continue;
    const group = parse((await read(`openspec/delivery-groups/${name}`)).toString('utf8'));
    for (const change of group.changes ?? []) {
      if (change.projectOrdinal === undefined) continue;
      currentOrdinals.push({ deliveryId: group.id, changeId: change.id, ordinal: change.projectOrdinal });
    }
  }
  assert.deepEqual(currentOrdinals, ordinalInputs);
  assert.equal(new Set(currentOrdinals.map(item => item.ordinal)).size, currentOrdinals.length);
  observations.chain = { reviewedRunId, projectOrdinal: active[0].projectOrdinal,
    soleActiveChange: true, ordinalFactsMatch: true, independentBootstrap: true };

  const auditBytes = await read(authorResult.handoffAudit.path);
  assert.equal(digest(auditBytes), authorResult.handoffAudit.sha256);
  const audit = JSON.parse(auditBytes.toString('utf8'));
  const inputs = await readJson(`${authorProof}/attempt-01/source-inputs.json`);
  for (const entry of [...audit.artifacts, ...inputs.inputs, ...audit.historicalReadback]) await verify(entry);
  const head = (await command('source-head', 'git', ['rev-parse', 'HEAD'])).trim();
  // HEAD records observed provenance, not permission or an Explore admission gate.
  observations.integrity = { authorResultSha256: digest(await read(`${reviewedRun}/result.json`)),
    handoffAuditSha256: digest(auditBytes), handoffFiles: audit.artifacts.length,
    sourceInputs: inputs.inputs.length, historicalFiles: audit.historicalReadback.length,
    allListedBytesMatch: true, sourceHead: head, authorSourceHead: inputs.head };

  const fixture = path.join(root, authorProof, 'attempt-01/fixture');
  const repo = path.join(fixture, 'repo');
  const { executeFoundationCliRequest } = await moduleAt('src/cli/foundation-cli.ts');
  const doctor = await executeFoundationCliRequest({ command: 'doctor', request: {
    repositoryRoot: repo, flowkitHome: path.join(fixture, 'home') } });
  await save('doctor-observation.json', json(doctor));
  assert.deepEqual(doctor, await readJson(`${authorProof}/attempt-01/doctor-observation.json`));
  assert.equal(doctor.status, 'fail');
  assert.deepEqual(doctor.diagnostics.filter(item => item.status === 'fail').map(item => item.id), ['archify-runtime']);

  const { formDeliveryStartContentCompletion } = await moduleAt('src/internal/delivery-start-content.ts');
  let validationReaderCalls = 0;
  const completion = await formDeliveryStartContentCompletion(repo, 'probe-delivery', 'a'.repeat(40),
    { artifact: 'plan.md', contentSha256: 'a'.repeat(64) },
    { status: 'validated', validation: { sourceRef: 'probe:validation', artifacts: [] } },
    () => { validationReaderCalls++; throw new Error('Unexpected validation call'); });
  assert.equal(completion, null);
  assert.equal(validationReaderCalls, 0);
  await save('start-observation.json', json({ completion, validationReaderCalls,
    limitation: 'Missing fixed-output early guard only; other Start prerequisites are not proven valid.' }));

  const { isDeliveryRequiredEvidence } = await moduleAt('src/internal/delivery-required-evidence.ts');
  const synthetic = await readJson(`${authorProof}/attempt-01/required-evidence-input.json`);
  assert.equal(synthetic.fixtureOnly, true);
  const { architecture, ...withoutArchitecture } = synthetic.evidence;
  const shape = { withArchitectureAccepted: isDeliveryRequiredEvidence(synthetic.evidence),
    withoutArchitectureAccepted: isDeliveryRequiredEvidence(withoutArchitecture) };
  assert.deepEqual(shape, { withArchitectureAccepted: true, withoutArchitectureAccepted: false });
  await save('required-evidence-observation.json', json({ ...shape,
    limitation: 'Synthetic shape check, not accepted Run/Review/Full Test/Final evidence.' }));
  observations.counterexamples = { doctor: 'same missing-Archify-only diagnostic',
    start: 'same early fixed-output rejection', sharedEvidence: 'same mandatory architecture shape',
    limitation: 'Candidate functions are fixture test objects, not lifecycle authority or D05 implementation acceptance.' };

  const tests = ['managed-tool-resolution', 'foundation-cli-surface', 'delivery-operation-execution',
    'delivery-start-execution', 'delivery-final-execution', 'delivery-required-evidence-source',
    'delivery-repository-integration-execution'].map(name => `tests/unit/domain/${name}.test.ts`);
  const stdout = await command('focused-tests', process.execPath, ['--import', 'tsx', '--test', ...tests]);
  const counts = Object.fromEntries([...stdout.matchAll(/^# (tests|pass|fail|skipped) (\d+)\s*$/gm)].map(match => [match[1], Number(match[2])]));
  assert.equal(counts.fail, 0);
  assert.equal(counts.skipped, 0);
  assert.equal(counts.tests, counts.pass);
  observations.focusedBaseline = { files: tests.length, ...counts, formalFullTest: false,
    limitation: 'Existing D04 contract regression baseline only; no D05 implementation acceptance.' };
  for (const entry of [...audit.artifacts, ...inputs.inputs, ...audit.historicalReadback]) await verify(entry);
  const outputs = [];
  for (const name of (await readdir(out)).sort()) {
    const bytes = await readFile(path.join(out, name));
    outputs.push({ file: name, bytes: bytes.length, sha256: digest(bytes) });
  }
  await save('summary.json', json({ kind: 'independent-review-explore-observations',
    deliveryId, changeId, reviewedRunId, reviewRunId: '20260908-002-review-explore', attempt,
    startedAt, finishedAt: new Date().toISOString(), node: process.version,
    platform: process.platform, arch: process.arch, observations, outputs,
    sourceAndAuthorProofUnchanged: true, formalFullTestExecuted: false }));
  console.log(json({ saved: path.relative(root, out).replaceAll('\\', '/'), observations }));
} catch (error) {
  await save('failure.json', json({ startedAt, finishedAt: new Date().toISOString(),
    observations, error: String(error), stack: error.stack }));
  throw error;
}
