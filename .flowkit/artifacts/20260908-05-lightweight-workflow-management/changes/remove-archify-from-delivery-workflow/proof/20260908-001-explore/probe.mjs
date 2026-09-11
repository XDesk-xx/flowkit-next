// Bounded Explore experiment, NOT product implementation or lifecycle authority.
// From repository root: node --import tsx <this-file> <new-attempt-name>
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const root = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2];
assert.match(attempt ?? '', /^[a-z0-9][a-z0-9-]*$/);
const out = path.join(proof, attempt);
await mkdir(out); // Existing attempts are never overwritten.
const startedAt = new Date().toISOString();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function save(name, bytes) {
  const target = path.join(out, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes, { flag: 'wx' });
}
const json = value => JSON.stringify(value, null, 2) + '\n';
async function command(label, program, args) {
  const result = spawnSync(program, args, {
    cwd: root, encoding: 'utf8', windowsHide: true,
    timeout: 120000, maxBuffer: 16 * 1024 * 1024,
  });
  await save(`${label}.stdout.txt`, result.stdout ?? '');
  await save(`${label}.stderr.txt`, result.stderr ?? '');
  const record = {
    program, args, cwd: root, exitCode: result.status,
    signal: result.signal, error: result.error?.message ?? null,
  };
  await save(`${label}.command.json`, json(record));
  return { ...record, stdout: result.stdout ?? '' };
}
async function moduleAt(relative) {
  return import(pathToFileURL(path.join(root, relative)).href);
}
const observations = [];
try {
  const head = await command('source-head', 'git', ['rev-parse', 'HEAD']);
  assert.equal(head.exitCode, 0);
  const ordinals = [];
  for (const name of await readdir(path.join(root, 'openspec/delivery-groups'))) {
    if (!name.endsWith('.yaml')) continue;
    const manifest = parse(await readFile(path.join(root, 'openspec/delivery-groups', name), 'utf8'));
    for (const change of manifest.changes ?? []) {
      if (change.projectOrdinal === undefined) continue;
      assert.ok(Number.isSafeInteger(change.projectOrdinal) && change.projectOrdinal > 0);
      ordinals.push({ deliveryId: manifest.id, changeId: change.id, ordinal: change.projectOrdinal });
    }
  }
  assert.equal(new Set(ordinals.map(x => x.ordinal)).size, ordinals.length);
  assert.equal(Math.max(...ordinals.map(x => x.ordinal)), 33);
  await save('ordinal-inputs.json', json(ordinals));

  const inventory = await command('direct-consumers', 'rg', [
    '-n', '-i', 'archify|architecture-finalization|architectureOutcome|architectureMaterialized|readArchitecture',
    'src', 'openspec/specs', 'skills/delivery', 'skills/tools', 'config/tools', 'scripts', 'AGENTS.md', 'README.md',
  ]);
  assert.equal(inventory.exitCode, 0);
  const tests = [
    'managed-tool-resolution', 'foundation-cli-surface', 'delivery-operation-execution',
    'delivery-start-execution', 'delivery-final-execution', 'delivery-required-evidence-source',
    'delivery-repository-integration-execution',
  ].map(name => `tests/unit/domain/${name}.test.ts`);
  const files = new Set(inventory.stdout.split(/\r?\n/).filter(Boolean).map(line => line.split(':')[0]));
  for (const file of tests) files.add(file);
  for (const file of ['package.json', 'pnpm-lock.yaml', 'flowkit-next-delivery-change-plan.md', 'flowkit-next-d05-decoupling-analysis.md']) files.add(file);
  const inputs = [];
  for (const file of [...files].sort()) {
    const bytes = await readFile(path.join(root, file));
    inputs.push({ path: file.replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) });
  }
  await save('source-inputs.json', json({ head: head.stdout.trim(), inputs }));

  // Simulated OpenSpec CLI fixture. No external runtime is installed, removed, or invoked.
  const fixture = path.join(out, 'fixture');
  const repo = path.join(fixture, 'repo');
  const home = path.join(fixture, 'home');
  const lock = JSON.parse(await readFile(path.join(root, 'config/tools/toolchain.lock.json'), 'utf8'));
  await save('fixture/repo/config/tools/toolchain.lock.json', json(lock));
  await save('fixture/home/tools/openspec/1.10.0/package.json', json({ name: '@fission-ai/openspec', version: '1.10.0' }));
  await save('fixture/home/tools/openspec/1.10.0/bin/openspec.js',
    `// Simulated list-only fixture, not the actual OpenSpec runtime.\nconsole.log(JSON.stringify(${JSON.stringify({ changes: [], root: { path: repo, source: 'nearest' } })}));\n`);
  const { executeFoundationCliRequest } = await moduleAt('src/cli/foundation-cli.ts');
  const doctor = await executeFoundationCliRequest({ command: 'doctor', request: { repositoryRoot: repo, flowkitHome: home } });
  await save('doctor-observation.json', json(doctor));
  assert.equal(doctor.status, 'fail');
  assert.equal(doctor.diagnostics.find(x => x.id === 'openspec-runtime').status, 'pass');
  assert.equal(doctor.diagnostics.find(x => x.id === 'openspec-root').status, 'pass');
  assert.equal(doctor.diagnostics.find(x => x.id === 'archify-runtime').diagnosticKind, 'missing-runtime');
  observations.push({ id: 'doctor-missing-archify', established: 'With a valid simulated OpenSpec observation, doctor fails solely for missing Archify.', limitation: 'Fixture test, not actual installed OpenSpec execution or lifecycle invocation.' });

  // Isolate the missing fixed-output guard; deliberately do not pretend the other Start prerequisites passed.
  await save('fixture/repo/.flowkit/project.json', json({ projectId: 'probe-project' }));
  await save('fixture/repo/openspec/delivery-groups/probe-delivery.yaml', 'id: probe-delivery\nchanges: []\n');
  const { formDeliveryStartContentCompletion } = await moduleAt('src/internal/delivery-start-content.ts');
  let readValidationCalled = false;
  const completion = await formDeliveryStartContentCompletion(repo, 'probe-delivery', 'a'.repeat(40),
    { artifact: 'plan.md', contentSha256: 'a'.repeat(64) },
    { status: 'validated', validation: { sourceRef: 'probe:validation', artifacts: [] } },
    () => { readValidationCalled = true; throw new Error('Should not reach validation reader'); });
  assert.equal(completion, null);
  assert.equal(readValidationCalled, false);
  await save('start-observation.json', json({ completion, readValidationCalled, missing: ['current.architecture.json', 'planned.architecture.json', 'current-to-planned.compare.json'], limitation: 'Only early fixed-output rejection; no claim of otherwise valid whole Start.' }));
  observations.push({ id: 'start-fixed-output', established: 'Missing diagrams rejects content formation before validation callback.', limitation: 'Early guard only; source inventory establishes the exact mandatory paths.' });

  // Pure shape counterexample. These synthetic hashes and refs are NOT accepted execution evidence.
  const { isDeliveryRequiredEvidence } = await moduleAt('src/internal/delivery-required-evidence.ts');
  const ref = artifact => ({ artifact, contentSha256: 'a'.repeat(64), bytes: 1 });
  const runId = '20260908-001-archive';
  const evidence = {
    projectId: 'probe-project', deliveryId: 'probe-delivery',
    changeClosures: [{ changeId: 'probe-change', archiveRunId: runId, reviewApplyRunId: runId,
      runs: [{ runId, artifacts: ['action.md', 'context.json', 'result.json'].map(ref) }] }],
    fullTest: { executionRef: `full-test-execution:sha256:${'b'.repeat(64)}`, sourceRef: 'probe:full-test', artifacts: [ref('full-test.json')] },
    architecture: { architectureFinalizationRef: `architecture-finalization:sha256:${'c'.repeat(64)}`, sourceRef: 'probe:architecture', artifacts: [ref('architecture.json')] },
  };
  const { architecture, ...withoutArchitecture } = evidence;
  const withArchitectureAccepted = isDeliveryRequiredEvidence(evidence);
  const withoutArchitectureAccepted = isDeliveryRequiredEvidence(withoutArchitecture);
  assert.equal(withArchitectureAccepted, true);
  assert.equal(withoutArchitectureAccepted, false);
  await save('required-evidence-input.json', json({ fixtureOnly: true, evidence }));
  await save('required-evidence-observation.json', json({ withArchitectureAccepted, withoutArchitectureAccepted, limitation: 'Shape validation only; no real Run, Review or Full Test admission.' }));
  observations.push({ id: 'required-evidence-shape', established: 'Removing only architecture from an otherwise shape-valid synthetic record makes the shared validator reject.', limitation: 'Not semantic admission; Final and Integration source consumers must converge together.' });

  const focused = await command('focused-tests', process.execPath, ['--import', 'tsx', '--test', ...tests]);
  assert.equal(focused.exitCode, 0, 'Focused baseline suite did not pass; keep this attempt and diagnose.');
  // Confirm the source inputs were unchanged by the experiment.
  for (const input of inputs) assert.equal(hash(await readFile(path.join(root, input.path))), input.sha256);
  await save('summary.json', json({
    kind: 'bounded-explore-observations', projectId: 'flowkit-next',
    deliveryId: '20260908-05-lightweight-workflow-management', changeId: 'remove-archify-from-delivery-workflow',
    runId: '20260908-001-explore', attempt, startedAt, finishedAt: new Date().toISOString(),
    node: process.version, platform: process.platform, arch: process.arch,
    sourceHead: head.stdout.trim(), sourceInputsUnchanged: true,
    observations, focusedTestsExitCode: focused.exitCode,
    conclusion: 'Bounded existing-coupling observations confirmed; no D05 implementation or Formal Full Test PASS claimed.',
  }));
  console.log(`Saved actual observations and focused baseline outputs: ${out}`);
} catch (error) {
  await save('failure.json', json({ startedAt, finishedAt: new Date().toISOString(), observations, error: String(error), stack: error.stack }));
  throw error;
}
