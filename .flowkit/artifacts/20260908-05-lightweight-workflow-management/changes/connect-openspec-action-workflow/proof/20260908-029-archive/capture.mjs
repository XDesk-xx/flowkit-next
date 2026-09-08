import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const [label, executable, ...args] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label ?? '') || !executable) throw new Error('command required');
const output = path.join(path.dirname(fileURLToPath(import.meta.url)), label);
await fs.mkdir(output);
const startedAt = new Date().toISOString();
const run = spawnSync(executable, args, { cwd: process.cwd(), maxBuffer: 32 * 1024 * 1024 });
const refs = {};
for (const stream of ['stdout', 'stderr']) {
  const bytes = run[stream] ?? Buffer.alloc(0);
  const file = path.join(output, stream + '.txt');
  await fs.writeFile(file, bytes, { flag: 'wx' });
  refs[stream] = { path: path.relative(process.cwd(), file).split(path.sep).join('/'),
    bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
const record = { executable, args, cwd: process.cwd(), startedAt, finishedAt: new Date().toISOString(),
  exitCode: run.status, signal: run.signal, error: run.error?.message ?? null, ...refs };
await fs.writeFile(path.join(output, 'command.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
process.stdout.write(run.stdout ?? Buffer.alloc(0));
process.stderr.write(run.stderr ?? Buffer.alloc(0));
console.log(JSON.stringify(record));
process.exitCode = run.status ?? 1;
