import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
const root = process.cwd();
async function inputs() {
  const values = {};
  async function visit(relative) {
    for (const entry of await readdir(relative, { withFileTypes: true })) {
      const file = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) values[file] = createHash('sha256').update(await readFile(file)).digest('hex');
    }
  }
  for (const directory of ['src', 'tests', 'config', 'openspec/changes/repair-real-project-execution-and-recovery-gaps']) await visit(directory);
  for (const file of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'eslint.config.mjs', 'AGENTS.md']) values[file] = createHash('sha256').update(await readFile(file)).digest('hex');
  return values;
}
const id = process.argv[2];
const commands = {
  probe: ['--import', 'tsx', path.join(import.meta.dirname, 'probe.mjs')],
  downstream: ['--import', 'tsx', path.join(import.meta.dirname, 'downstream.mjs')],
  focused: ['--import', 'tsx', '--test', '--test-concurrency=4', 'tests/unit/domain/action-correction-continuation.test.ts', 'tests/unit/domain/action-correction.test.ts', 'tests/unit/domain/archive-isolation-diagnostics.test.ts', 'tests/unit/domain/domain-file-reporter.test.ts', 'tests/unit/domain/action-archive-readiness.test.ts'],
  originalProbe: ['--import', 'tsx', '.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/review/20261003-173712/reproduce.mjs'],
};
if (!Object.hasOwn(commands, id)) throw Error('Unknown command');
const directory = path.join(import.meta.dirname, id);
await mkdir(directory);
const before = await inputs();
const startedAt = new Date().toISOString();
const stdout = [], stderr = [];
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;
const child = spawn(process.execPath, commands[id], { cwd: root, env, windowsHide: true });
child.stdout.on('data', bytes => stdout.push(bytes));
child.stderr.on('data', bytes => stderr.push(bytes));
let spawnError;
child.on('error', error => { spawnError = error.message; });
const result = await new Promise(resolve => child.on('close', (exitCode, signal) => resolve({ exitCode, signal })));
await writeFile(path.join(directory, 'stdout.txt'), Buffer.concat(stdout), { flag: 'wx' });
await writeFile(path.join(directory, 'stderr.txt'), Buffer.concat(stderr), { flag: 'wx' });
const metadata = { id, formalRun: false, program: process.execPath, args: commands[id], startedAt, finishedAt: new Date().toISOString(), ...result, spawnError, sourceInputs: before, sourceUnchanged: isDeepStrictEqual(before, await inputs()) };
await writeFile(path.join(directory, 'command.json'), JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ id, ...result, sourceUnchanged: metadata.sourceUnchanged }));
console.log(Buffer.concat(stdout).toString().slice(-2400));
console.error(Buffer.concat(stderr).toString().slice(-1200));
process.exitCode = result.exitCode ?? 1;
