import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const out = path.dirname(fileURLToPath(import.meta.url));
const commands = [];
const runtime = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
for (const [label, args] of [['status', ['status', '--change', 'describe-running-feature', '--json']], ['strict', ['validate', 'describe-running-feature', '--strict']]]) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, [runtime, ...args], { cwd: process.cwd() });
  for (const stream of ['stdout', 'stderr']) await fs.writeFile(path.join(out, `${label}.${stream}.txt`), result[stream] ?? Buffer.alloc(0), { flag: 'wx' });
  commands.push({ label, executable: process.execPath, args: [runtime, ...args], startedAt, finishedAt: new Date().toISOString(), exitCode: result.status });
  if (result.status !== 0) throw Error(`${label} failed`);
}
const artifacts = [];
for (const file of ['proposal.md', 'design.md', 'tasks.md', 'specs/feature-description/spec.md']) {
  const relative = 'openspec/changes/describe-running-feature/' + file;
  const bytes = await fs.readFile(relative);
  artifacts.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await fs.writeFile(path.join(out, 'validation.json'), JSON.stringify({ commands, artifacts, planningOnly: true, independentReview: false }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ commands, artifacts }));
