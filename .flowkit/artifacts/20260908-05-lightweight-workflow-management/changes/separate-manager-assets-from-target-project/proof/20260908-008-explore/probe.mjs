import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Bounded Explore experiment, not product implementation or lifecycle authority.
const repo = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = path.join(proof, process.argv[2] || 'attempt-01');
await fs.mkdir(attempt); // Never overwrite an earlier attempt.
const json = async (p, value) => {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
};
const write = async (p, text) => {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, text, { flag: 'wx' });
};
const sha = b => createHash('sha256').update(b).digest('hex');
const source = async p => import(pathToFileURL(path.join(repo, p)).href);
const { resolveManagedTool } = await source('src/domain/managed-tool-resolution.ts');
const { resolveActionGuidanceRef } = await source('src/domain/action-guidance-execution.ts');
const { resolveDeliveryGuidanceRef } = await source('src/domain/delivery-operation-execution.ts');
const { observeOpenSpecActiveChanges } = await source('src/domain/openspec-observation.ts');
const home = process.env.FLOWKIT_HOME || 'C:/Users/xuser/.flowkit';
const observations = [];
const run = async (label, args, cwd) => {
  const r = spawnSync(process.execPath, args, { cwd, encoding: 'buffer', timeout: 120000 });
  await write(path.join(attempt, label + '.stdout.txt'), r.stdout || Buffer.alloc(0));
  await write(path.join(attempt, label + '.stderr.txt'), r.stderr || Buffer.alloc(0));
  await json(path.join(attempt, label + '.command.json'), {
    executable: process.execPath, args, cwd, exitCode: r.status,
    signal: r.signal, error: r.error?.message || null,
  });
  assert.equal(r.error, undefined, label);
  assert.equal(r.status, 0, label);
  return r.stdout.toString('utf8');
};
const diagnose = async fn => {
  try { return { outcome: 'resolved', value: await fn() }; }
  catch (e) { return { outcome: 'rejected', kind: e.kind, message: e.message }; }
};
try {
  const target = path.join(attempt, 'target');
  const manager = path.join(attempt, 'manager-a');
  const moved = path.join(attempt, 'manager-b');
  await write(path.join(target, 'openspec/config.yaml'), 'schema: spec-driven\n');
  await fs.mkdir(path.join(target, 'openspec/changes'), { recursive: true });
  const lock = await fs.readFile(path.join(repo, 'config/tools/toolchain.lock.json'));
  for (const root of [manager, moved]) {
    await write(path.join(root, 'config/tools/toolchain.lock.json'), lock);
    // Synthetic inert assets: no candidate Skill HOW is read or executed.
    await write(path.join(root, 'skills/actions/apply/SKILL.md'), 'manager fixture guidance\n');
    await write(path.join(root, 'skills/delivery/start/SKILL.md'), 'manager delivery fixture\n');
  }
  const noLock = await diagnose(() => observeOpenSpecActiveChanges({ repositoryRoot: target, flowkitHome: home }));
  assert.equal(noLock.kind, 'invalid-lock');
  assert.equal(await resolveActionGuidanceRef(target, 'apply'), null);
  assert.equal(await resolveDeliveryGuidanceRef(target, 'delivery-start'), null);
  observations.push({ id: 'bare-target', noLock, actionGuidance: null, deliveryGuidance: null });
  const installedTool = await resolveManagedTool({ repositoryRoot: manager, flowkitHome: home, toolId: 'openspec' });
  const version = (await run('actual-version', [installedTool.entrypoint, '--version'], target)).trim();
  assert.equal(version, '1.10.0');
  const listing = JSON.parse(await run('actual-target-list', [installedTool.entrypoint, 'list', '--json'], target));
  assert.equal(await fs.realpath(listing.root.path), await fs.realpath(target));
  assert.deepEqual(listing.changes, []);
  observations.push({ id: 'split-root-composition', installedTool, version, listing,
    meaning: 'Existing resolver selected from manager; actual OpenSpec invoked at target. Not an implemented Flowkit adapter.' });
  const conflict = JSON.parse(lock.toString());
  conflict.openspec.version = '99.0.0';
  conflict.openspec.runtimeRoot = '${FLOWKIT_HOME}/tools/openspec/99.0.0';
  await json(path.join(target, 'config/tools/toolchain.lock.json'), conflict);
  await write(path.join(target, 'skills/actions/apply/SKILL.md'), 'target collision fixture\n');
  await write(path.join(target, 'skills/delivery/start/SKILL.md'), 'target delivery collision\n');
  const targetLock = await diagnose(() => resolveManagedTool({ repositoryRoot: target, flowkitHome: home, toolId: 'openspec' }));
  assert.equal(targetLock.kind, 'missing-runtime');
  const targetAction = await resolveActionGuidanceRef(target, 'apply');
  const managerAction = await resolveActionGuidanceRef(manager, 'apply');
  const targetDelivery = await resolveDeliveryGuidanceRef(target, 'delivery-start');
  const managerDelivery = await resolveDeliveryGuidanceRef(manager, 'delivery-start');
  assert.notEqual(targetAction.contentSha256, managerAction.contentSha256);
  assert.notEqual(targetDelivery.contentSha256, managerDelivery.contentSha256);
  observations.push({ id: 'same-name-collision', targetLock, targetAction, managerAction, targetDelivery, managerDelivery });
  const movedTool = await resolveManagedTool({ repositoryRoot: moved, flowkitHome: home, toolId: 'openspec' });
  assert.deepEqual(movedTool, installedTool);
  assert.deepEqual(await resolveActionGuidanceRef(moved, 'apply'), managerAction);
  assert.deepEqual(await resolveDeliveryGuidanceRef(moved, 'delivery-start'), managerDelivery);
  const missing = await diagnose(() => resolveManagedTool({ repositoryRoot: manager, flowkitHome: path.join(attempt, 'absent-home'), toolId: 'openspec' }));
  assert.equal(missing.kind, 'missing-runtime');
  observations.push({ id: 'relocated-assets-and-missing-runtime', movedTool, missing,
    limit: 'Asset relocation only, not a shipped/installed CLI relocation acceptance.' });
  await run('focused-tests', ['--import', 'tsx', '--test',
    'tests/unit/domain/action-guidance-execution.test.ts',
    'tests/unit/domain/managed-tool-resolution.test.ts',
    'tests/unit/domain/openspec-observation.test.ts'], repo);
  const sourceRefs = [];
  for (const p of ['src/domain/managed-tool-resolution.ts', 'src/domain/action-guidance-execution.ts',
    'src/domain/delivery-operation-execution.ts', 'src/domain/openspec-observation.ts',
    'src/domain/single-action-execution.ts', 'src/cli/foundation-cli.ts', 'package.json',
    'config/tools/toolchain.lock.json']) {
    const b = await fs.readFile(path.join(repo, p));
    sourceRefs.push({ path: p, bytes: b.length, sha256: sha(b) });
  }
  await json(path.join(attempt, 'summary.json'), {
    status: 'PASS', meaning: 'Bounded Explore assertions only; not implementation acceptance',
    completedAt: new Date().toISOString(), platform: process.platform, node: process.version,
    observations, sourceRefs, actualManagedOpenSpec: true, productionMutation: false,
    limitations: ['No full installed-manager end-to-end status or lifecycle execution',
      'No Full Test scope implementation or Git workflow change', 'Windows native experiment; no Linux acceptance claim'],
  });
  console.log('PASS: bare-target failure, collision, split-root actual OpenSpec, relocation and missing-runtime proofs');
} catch (error) {
  await json(path.join(attempt, 'failure.json'), { status: 'FAIL', message: error.message, stack: error.stack, observations });
  throw error;
}
