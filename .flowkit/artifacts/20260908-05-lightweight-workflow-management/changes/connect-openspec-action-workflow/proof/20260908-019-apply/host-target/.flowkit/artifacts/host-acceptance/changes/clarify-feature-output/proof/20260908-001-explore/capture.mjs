import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd();
const out = import.meta.dirname;
const tool = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
const commands = [
  ['version', [tool, '--version']],
  ['list', [tool, 'list', '--json']],
  ['no-args', ['feature.mjs']],
  ['help-baseline', ['feature.mjs', '--help']],
  ['scaffold', [tool, 'new', 'change', 'clarify-feature-output']],
  ['status', [tool, 'status', '--change', 'clarify-feature-output', '--json']],
];
const records = [];
for (const [name, args] of commands) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, args, { cwd: root, env: { ...process.env, OPENSPEC_TELEMETRY: '0' } });
  writeFileSync(resolve(out, `${name}.stdout.txt`), result.stdout ?? Buffer.alloc(0));
  writeFileSync(resolve(out, `${name}.stderr.txt`), result.stderr ?? Buffer.alloc(0));
  records.push({ name, command: [process.execPath, ...args], cwd: root, startedAt, finishedAt: new Date().toISOString(), exitCode: result.status, signal: result.signal, error: result.error?.message ?? null });
  writeFileSync(resolve(out, 'commands.json'), `${JSON.stringify(records, null, 2)}\n`);
  if (result.error || result.status !== 0) process.exit(1);
}
