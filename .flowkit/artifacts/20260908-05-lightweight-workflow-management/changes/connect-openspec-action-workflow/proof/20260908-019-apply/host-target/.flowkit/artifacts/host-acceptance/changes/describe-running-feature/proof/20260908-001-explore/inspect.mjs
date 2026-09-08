import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const out = path.dirname(fileURLToPath(import.meta.url));
const runtime = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
const commands = [];
for (const [label, args] of [
  ['version', [runtime, '--version']],
  ['scaffold', [runtime, 'new', 'change', 'describe-running-feature']],
  ['status', [runtime, 'status', '--change', 'describe-running-feature', '--json']],
]) {
  const startedAt = new Date().toISOString();
  const outcome = spawnSync(process.execPath, args, { cwd: process.cwd() });
  for (const stream of ['stdout', 'stderr']) await fs.writeFile(path.join(out, `${label}.${stream}.txt`), outcome[stream] ?? Buffer.alloc(0), { flag: 'wx' });
  commands.push({ label, executable: process.execPath, args, startedAt, finishedAt: new Date().toISOString(), exitCode: outcome.status, error: outcome.error?.message ?? null });
  if (outcome.status !== 0) throw new Error(`${label} failed`);
}
const entries = await fs.readdir(process.cwd());
await fs.writeFile(path.join(out, 'inspection.json'), JSON.stringify({ node: process.version, platform: process.platform, entries, commands, scope: 'isolated host acceptance fixture only' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ commands, entries }));
