const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const id = process.argv[2];
const commands = {
  focused: ['node', '--import', 'tsx', '--test', '--test-concurrency=4', 'tests/unit/domain/action-correction-continuation.test.ts', 'tests/unit/domain/action-correction.test.ts', 'tests/unit/domain/rejected-review-recovery.test.ts', 'tests/unit/domain/action-archive-readiness.test.ts', 'tests/unit/domain/archive-isolation-diagnostics.test.ts', 'tests/unit/domain/domain-file-reporter.test.ts'],
  domain: ['node', '--import', 'tsx', '--test', '--test-concurrency=4', 'tests/unit/domain/*.test.ts'],
  acceptance: ['node', '--import', 'tsx', '--test', 'tests/acceptance/*.test.ts'],
  native: ['node', '--import', 'tsx', '--test', 'tests/acceptance/native-windows-archive.test.ts'],
  typecheck: ['pnpm', 'typecheck'], gate: ['pnpm', 'quality:gate'], 'gate-r2': ['pnpm', 'quality:gate'], build: ['pnpm', 'build'],
  dependencies: ['pnpm', 'quality:dependency-health'], entropy: ['pnpm', 'quality:entropy'], ownership: ['pnpm', 'quality:owned-source'],
  probe: ['node', '--import', 'tsx', path.join(__dirname, 'probe.mjs')],
  openspec: ['node', 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js', 'validate', 'repair-real-project-execution-and-recovery-gaps', '--strict'],
};
if (!commands[id]) throw Error('Unknown command');
function snapshot() {
  const values = {};
  function visit(relative) {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const file = relative + '/' + entry.name;
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) values[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
      else throw Error('Unexpected source alias: ' + file);
    }
  }
  for (const directory of ['src', 'tests', 'scripts', 'skills', 'config']) visit(directory);
  for (const file of ['docs/onboarding.md', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'tsconfig.build.json', 'eslint.config.mjs', 'dependency-cruiser.config.mjs', '.node-version', '.gitattributes']) values[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  return values;
}
const directory = path.join(__dirname, id);
fs.mkdirSync(directory);
const before = snapshot();
const [program, ...args] = commands[id];
const env = { ...process.env, FLOWKIT_HOME: 'C:/Users/xuser/.flowkit' };
delete env.NODE_TEST_CONTEXT;
if (id === 'native') {
  env.FLOWKIT_NATIVE_ARCHIVE_ACCEPTANCE = '1';
  env.FLOWKIT_NATIVE_ARCHIVE_EVIDENCE = path.join(__dirname, 'native-evidence');
}
const stdout = fs.openSync(path.join(directory, 'stdout.txt'), 'wx');
const stderr = fs.openSync(path.join(directory, 'stderr.txt'), 'wx');
const startedAt = new Date().toISOString();
const child = spawn(program === 'node' ? process.execPath : program, args, { cwd: root, env, shell: program === 'pnpm' && process.platform === 'win32', windowsHide: true, stdio: ['ignore', stdout, stderr] });
child.on('error', error => fs.writeSync(stderr, Buffer.from(error.message)));
child.on('close', (exitCode, signal) => {
  fs.closeSync(stdout); fs.closeSync(stderr);
  const metadata = { mode: 'direct-openspec-revise-apply', formalRun: false, deliveryFullTest: false, id, program: program === 'node' ? process.execPath : program, args, node: process.version, startedAt, finishedAt: new Date().toISOString(), exitCode, signal, sourceInputs: before, sourceUnchanged: JSON.stringify(before) === JSON.stringify(snapshot()), environmentOverrides: id === 'native' ? { FLOWKIT_HOME: env.FLOWKIT_HOME, FLOWKIT_NATIVE_ARCHIVE_ACCEPTANCE: '1', FLOWKIT_NATIVE_ARCHIVE_EVIDENCE: env.FLOWKIT_NATIVE_ARCHIVE_EVIDENCE } : { FLOWKIT_HOME: env.FLOWKIT_HOME } };
  fs.writeFileSync(path.join(directory, 'command.json'), JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ id, exitCode, signal, sourceUnchanged: metadata.sourceUnchanged }));
  console.log(fs.readFileSync(path.join(directory, 'stdout.txt'), 'utf8').slice(-1000));
  console.error(fs.readFileSync(path.join(directory, 'stderr.txt'), 'utf8').slice(-800));
  process.exitCode = exitCode === 0 && metadata.sourceUnchanged ? 0 : 1;
});
