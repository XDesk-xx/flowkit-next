import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const sha = b => createHash('sha256').update(b).digest('hex');
// Synthetic topology counterexamples; not a product resolver or fabricated Runs.
function tip(records) {
  if (!records.length) return 'idle';
  const ids = new Set(records.map(r => r.id));
  if (ids.size !== records.length) return 'duplicate';
  if (records.some(r => r.previous !== null && !ids.has(r.previous))) return 'missing';
  const roots = records.filter(r => r.previous === null);
  if (roots.length !== 1) return 'ambiguous';
  const visited = new Set();
  let current = roots[0];
  while (current) {
    if (visited.has(current.id)) return 'cycle';
    visited.add(current.id);
    const children = records.filter(r => r.previous === current.id);
    if (children.length > 1) return 'ambiguous';
    if (!children.length) return visited.size === records.length ? current.id : 'disconnected';
    current = children[0];
  }
}
const linear = [{ id: 'a', previous: null }, { id: 'b', previous: 'a' }];
const scenarios = [
  ['empty', [], 'idle'], ['linear', linear, 'b'], ['reordered', [...linear].reverse(), 'b'],
  ['higher-unrelated', [...linear, { id: '999', previous: null }], 'ambiguous'],
  ['missing-parent', [{ id: 'b', previous: 'absent' }], 'missing'],
  ['fork', [...linear, { id: 'c', previous: 'a' }], 'ambiguous'],
  ['disconnected-cycle', [...linear, { id: 'x', previous: 'y' }, { id: 'y', previous: 'x' }], 'disconnected'],
];
const checks = scenarios.map(([name, records, expected]) => {
  const actual = tip(records);
  assert.equal(actual, expected);
  return { name, actual, expected };
});
// File-based handoff durability, with disposable scratch independent of retained bytes.
const retainedPath = path.join(root, 'retained-input.bin');
const bytes = Buffer.from('necessary experiment input\r\n');
await fs.writeFile(retainedPath, bytes, { flag: 'wx' });
const scratch = await fs.mkdtemp(path.join(process.cwd(), '.tmp/d05-proof-disposable-'));
const scratchPath = path.join(scratch, 'duplicate.bin');
await fs.writeFile(scratchPath, bytes);
await fs.unlink(scratchPath);
await fs.rmdir(scratch); // Empty, exact directory created by this experiment only.
const readback = await fs.readFile(retainedPath);
assert.equal(sha(readback), sha(bytes));
assert.notEqual(sha(Buffer.concat([readback, Buffer.from('tamper')])), sha(bytes));
const wrongOwner = { changeId: 'another-change', sha256: sha(bytes) };
assert.notEqual(wrongOwner.changeId, 'connect-openspec-action-workflow');
await assert.rejects(fs.writeFile(retainedPath, bytes, { flag: 'wx' }), { code: 'EEXIST' });
await assert.rejects(fs.readFile(path.join(root, 'absent-required-input.bin')), { code: 'ENOENT' });
const summary = { status: 'PASS', checks, retainedSha256: sha(readback),
  scratchRemoved: true, retainedReadback: true, overwriteRejected: true, missingRejected: true,
  limits: ['拓扑模型不决定 Policy legality；产品还须按真实 schema、Role、身份与边界验证每条链边',
    'hash/归属反例不证明来源真实；本实验不是产品证据接纳器或独立 Review',
    '不支持多 writer、进程崩溃自动恢复或迁移 bootstrap history'] };
await fs.writeFile(path.join(root, 'continuity-summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary));
