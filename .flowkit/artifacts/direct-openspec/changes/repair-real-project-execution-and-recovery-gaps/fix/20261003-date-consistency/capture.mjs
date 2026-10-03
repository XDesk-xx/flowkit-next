import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
const id = process.argv[2];
const commands = {
  focused: [process.execPath, ['--import','tsx','--test','tests/unit/domain/archive-date-continuation.test.ts','tests/unit/domain/action-archive-cli.test.ts','tests/unit/domain/action-archive-readiness.test.ts','tests/unit/domain/support-archive-chain.test.ts'], false],
  probe: [process.execPath, ['--import', 'tsx', '.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/review/20261003-173712/reproduce.mjs'], false],
  domain: [process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=4', 'tests/unit/domain/*.test.ts'], false],
  acceptance: [process.execPath, ['--import', 'tsx', '--test', 'tests/acceptance/*.test.ts'], false],
  typecheck: ['pnpm', ['typecheck'], true],
  gate: ['pnpm', ['quality:gate'], true],
  build: ['pnpm', ['build'], true],
  dependencies: ['pnpm', ['quality:dependency-health'], true],
  entropy: ['pnpm', ['quality:entropy'], true],
  ownership: ['pnpm', ['quality:owned-source'], true],
};
if (!Object.hasOwn(commands, id)) throw Error('Unknown check');
const destination = path.join(import.meta.dirname, id);
await mkdir(destination);
async function inputs() {
  const values = {};
  async function visit(relative) {
    for (const entry of await readdir(relative, { withFileTypes: true })) {
      const file = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) values[file] = createHash('sha256').update(await readFile(file)).digest('hex');
    }
  }
  for (const root of ['src', 'tests', 'config']) await visit(root);
  for (const file of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'eslint.config.mjs'])
    values[file] = createHash('sha256').update(await readFile(file)).digest('hex');
  return values;
}
const sourceInputs = await inputs();
const [program, args, shell] = commands[id];
const startedAt = new Date().toISOString();
const stdout = [], stderr = [];
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;
const child = spawn(program, args, { shell: shell && process.platform === 'win32', windowsHide: true, env });
child.stdout.on('data', bytes => stdout.push(bytes));
child.stderr.on('data', bytes => stderr.push(bytes));
let spawnError;
child.on('error', error => { spawnError = error.message; });
const result = await new Promise(resolve => child.on('close', (exitCode, signal) => resolve({ exitCode, signal })));
await writeFile(path.join(destination, 'stdout.txt'), Buffer.concat(stdout));
await writeFile(path.join(destination, 'stderr.txt'), Buffer.concat(stderr));
const metadata = { id, formalRun: false, program, args, startedAt, finishedAt: new Date().toISOString(), ...result, spawnError, sourceInputs, sourceUnchanged: isDeepStrictEqual(sourceInputs, await inputs()) };
await writeFile(path.join(destination, 'command.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify({ id, ...result, sourceUnchanged: metadata.sourceUnchanged, destination }));
console.log(Buffer.concat(stdout).toString().slice(-1800));
console.error(Buffer.concat(stderr).toString().slice(-1800));
process.exitCode = result.exitCode ?? 1;
