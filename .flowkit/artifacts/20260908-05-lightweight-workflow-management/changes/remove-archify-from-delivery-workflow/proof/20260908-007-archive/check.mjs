// This execution's bootstrap command recorder, not a product runner.
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const [label, command] = process.argv.slice(2);
assert.match(label ?? '', /^[a-z0-9-]+$/);
assert.ok(command);
const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, label);
await mkdir(out);
const startedAt = new Date().toISOString();
const result = spawnSync('C:/Program Files/PowerShell/7/pwsh.exe', ['-NoProfile', '-Command', command], {
  cwd: process.cwd(), windowsHide: true, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 900000,
});
await writeFile(path.join(out, 'stdout.txt'), result.stdout ?? '', { flag: 'wx' });
await writeFile(path.join(out, 'stderr.txt'), result.stderr ?? '', { flag: 'wx' });
const record = { label, command, cwd: process.cwd(), startedAt, finishedAt: new Date().toISOString(),
  node: process.version, platform: process.platform, exitCode: result.status,
  signal: result.signal, error: result.error?.message ?? null,
  stdoutSha256: createHash('sha256').update(await readFile(path.join(out, 'stdout.txt'))).digest('hex'),
  stderrSha256: createHash('sha256').update(await readFile(path.join(out, 'stderr.txt'))).digest('hex') };
await writeFile(path.join(out, 'result.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(record, null, 2));
if (result.status !== 0) console.log((result.stdout ?? '') + (result.stderr ?? ''));
process.exitCode = result.status ?? 1;
