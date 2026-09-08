import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const [label, executable, ...args] = process.argv.slice(2);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), label);
await fs.mkdir(root);
const result = spawnSync(executable === 'node' ? process.execPath : executable, args, {
  cwd: process.cwd(), encoding: 'buffer', timeout: 600000, maxBuffer: 32 * 1024 * 1024,
});
await fs.writeFile(path.join(root, 'stdout.txt'), result.stdout || Buffer.alloc(0), { flag: 'wx' });
await fs.writeFile(path.join(root, 'stderr.txt'), result.stderr || Buffer.alloc(0), { flag: 'wx' });
const record = { executable, args, cwd: process.cwd(), completedAt: new Date().toISOString(),
  exitCode: result.status, signal: result.signal, error: result.error?.message || null };
await fs.writeFile(path.join(root, 'result.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(record));
if (result.status !== 0) console.log((result.stdout || '').toString().slice(-7000), (result.stderr || '').toString().slice(-3000));
process.exitCode = result.status === 0 && !result.error ? 0 : 1;
