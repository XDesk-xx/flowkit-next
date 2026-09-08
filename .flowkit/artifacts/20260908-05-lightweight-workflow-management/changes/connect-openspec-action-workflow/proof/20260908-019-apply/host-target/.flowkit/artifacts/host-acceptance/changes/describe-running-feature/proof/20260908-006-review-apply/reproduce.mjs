import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = process.cwd();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const identities = ['feature.mjs', 'feature.test.mjs', 'openspec/changes/describe-running-feature/tasks.md'].map(file => {
  const bytes = fs.readFileSync(path.join(root, file));
  return { path: file, bytes: bytes.length, sha256: hash(bytes) };
});
const records = [];
for (const [label, args] of [['execute', ['feature.mjs']], ['test', ['--test', 'feature.test.mjs']]]) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, args, { cwd: root });
  const record = { label, executable: process.execPath, args, startedAt, finishedAt: new Date().toISOString(), exitCode: result.status, signal: result.signal, error: result.error?.message ?? null };
  for (const stream of ['stdout', 'stderr']) {
    const bytes = result[stream] ?? Buffer.alloc(0);
    fs.writeFileSync(path.join(import.meta.dirname, `${label}.${stream}.txt`), bytes, { flag: 'wx' });
    record[stream] = { bytes: bytes.length, sha256: hash(bytes) };
  }
  records.push(record);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
  assert.equal(result.signal, null);
  assert.deepEqual(result.stderr, Buffer.alloc(0));
  if (label === 'execute') assert.deepEqual(result.stdout, Buffer.from('status: available\n'));
}
fs.writeFileSync(path.join(import.meta.dirname, 'reproduction.json'), JSON.stringify({ node: process.version, platform: process.platform, identities, records }, null, 2) + '\n', { flag: 'wx' });
console.log('Independent reproduction passed: exact stdout, empty stderr, exit 0, native test.');
