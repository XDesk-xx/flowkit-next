import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = 'D:/Projects/flowkit-next';
const change = 'repair-real-project-execution-and-recovery-gaps';
const proof = path.join(root, '.flowkit/artifacts/direct-openspec/changes', change, 'archive/20261003-native');
const runtime = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
const scratch = path.join(root, '.tmp/direct-openspec-archive-20261003-native');
const archiveName = '2026-10-03-' + change;
const relativeChange = 'openspec/changes/' + change;
const relativeArchive = 'openspec/changes/archive/' + archiveName;
const digest = b => createHash('sha256').update(b).digest('hex');
function files(directory) {
  const result = {};
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const p = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), 'Unexpected linked input: ' + p);
    if (entry.isDirectory()) {
      for (const [suffix, hash] of Object.entries(files(p))) result[entry.name + '/' + suffix] = hash;
    } else if (entry.isFile()) result[entry.name] = digest(readFileSync(p));
    else throw new Error('Unexpected input: ' + p);
  }
  return result;
}
function save(name, value) {
  writeFileSync(path.join(proof, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}
function command(id, args, cwd = root) {
  const dir = path.join(proof, id);
  mkdirSync(dir);
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, [runtime, ...args], { cwd, windowsHide: true, timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
  writeFileSync(path.join(dir, 'stdout.txt'), result.stdout ?? Buffer.alloc(0));
  writeFileSync(path.join(dir, 'stderr.txt'), result.stderr ?? Buffer.alloc(0));
  writeFileSync(path.join(dir, 'command.json'), JSON.stringify({ program: process.execPath, args: [runtime, ...args], cwd, startedAt, finishedAt: new Date().toISOString(), exitCode: result.status, signal: result.signal, error: result.error?.message ?? null, formalRun: false }, null, 2) + '\n');
  assert.equal(result.status, 0, id + ': ' + result.stderr?.toString());
  return result.stdout.toString();
}
if (process.argv[2] === 'prepare') {
  assert(!existsSync(scratch), 'Scratch collision');
  assert(!existsSync(path.join(root, relativeArchive)), 'Archive collision');
  const status = JSON.parse(command('status', ['status', '--change', change, '--json']));
  assert(status.isComplete);
  const instructions = JSON.parse(command('spec-instructions', ['instructions', 'specs', '--change', change, '--json']));
  assert.equal(instructions.artifactId, 'specs');
  save('archive-instructions.json', JSON.parse(command('archive-instructions', ['instructions', 'archive', '--change', change, '--json'])));
  const tasks = readFileSync(path.join(root, relativeChange, 'tasks.md'), 'utf8');
  assert(!/^\s*- \[ \]/m.test(tasks));
  const deltas = status.artifactPaths.specs.existingOutputPaths;
  const capabilities = deltas.map(p => path.relative(path.join(root, relativeChange, 'specs'), path.dirname(p)).replaceAll('\\', '/'));
  save('before.json', { change, archiveName, capabilities, changeFiles: files(path.join(root, relativeChange)), mainSpecs: files(path.join(root, 'openspec/specs')), tasksCompleted: (tasks.match(/^\s*- \[x\]/gm) ?? []).length, ownerInstruction: '直接 走 openspec 的 archive 功能  同步 并归档', sourceRef: 'codex://threads/01a10026-be73-7c00-a7ad-32538e1db290', reviewApproved: false, formalRun: false });
  mkdirSync(path.join(scratch, 'openspec/changes'), { recursive: true });
  cpSync(path.join(root, 'openspec/config.yaml'), path.join(scratch, 'openspec/config.yaml'));
  cpSync(path.join(root, 'openspec/specs'), path.join(scratch, 'openspec/specs'), { recursive: true });
  cpSync(path.join(root, relativeChange), path.join(scratch, relativeChange), { recursive: true });
  console.log(command('dry-archive', ['archive', change, '--yes', '--json'], scratch));
  for (const [i, capability] of capabilities.entries()) command('dry-spec-' + i, ['validate', capability, '--type', 'spec', '--strict'], scratch);
  assert.deepEqual(files(path.join(scratch, relativeArchive)), files(path.join(root, relativeChange)));
  save('expected-specs.json', files(path.join(scratch, 'openspec/specs')));
  console.log(JSON.stringify({ dryArchiveConfirmed: true, affectedSpecs: capabilities.length, archiveName }));
} else if (process.argv[2] === 'archive') {
  const before = JSON.parse(readFileSync(path.join(proof, 'before.json')));
  assert.deepEqual(files(path.join(root, relativeChange)), before.changeFiles, 'Change drift');
  assert.deepEqual(files(path.join(root, 'openspec/specs')), before.mainSpecs, 'Spec drift');
  assert(!existsSync(path.join(root, relativeArchive)), 'Archive collision');
  console.log(command('actual-archive', ['archive', change, '--yes', '--json']));
  assert(!existsSync(path.join(root, relativeChange)), 'Active Change remains');
  assert.deepEqual(files(path.join(root, relativeArchive)), before.changeFiles, 'Archive byte drift');
  assert.deepEqual(files(path.join(root, 'openspec/specs')), JSON.parse(readFileSync(path.join(proof, 'expected-specs.json'))), 'Spec convergence mismatch');
  for (const [i, capability] of before.capabilities.entries()) command('actual-spec-' + i, ['validate', capability, '--type', 'spec', '--strict']);
  const list = JSON.parse(command('active-list', ['list', '--json']));
  assert(!(list.changes ?? []).some(c => c.name === change), 'Archived Change still active');
  save('readback.json', { change, archivePath: path.join(root, relativeArchive), syncedCapabilities: before.capabilities, archivedFiles: before.changeFiles, mainSpecs: files(path.join(root, 'openspec/specs')), activeChangeRemoved: true, archivedBytesPreserved: true, specsMatchDryConvergence: true, reviewerVerdictUnchanged: true, formalRun: false, gitMutation: false, finishedAt: new Date().toISOString() });
  console.log(JSON.stringify({ archived: true, syncedSpecs: before.capabilities.length, path: path.join(root, relativeArchive) }));
} else throw new Error('Expected prepare or archive');
