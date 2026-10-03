const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = '/candidate', output = process.argv[2] || '/verification/linux';
fs.mkdirSync(output);
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
const before = snapshot();
fs.writeFileSync(path.join(output, 'source-inputs.json'), JSON.stringify(before, null, 2) + '\n', { flag: 'wx' });
const results = [];
const env = { ...process.env, FLOWKIT_HOME: '/flowkit-home' };
delete env.NODE_TEST_CONTEXT;
for (const [id, args] of [['dependency-install', ['install', '--frozen-lockfile', '--ignore-scripts']], ...['typecheck', 'quality:gate', 'build', 'test:domain', 'test:acceptance', 'quality:dependency-health', 'quality:entropy', 'quality:owned-source'].map(id => [id, [id]])]) {
  const folder = path.join(output, id.replaceAll(':', '-'));
  fs.mkdirSync(folder);
  const stdout = fs.openSync(path.join(folder, 'stdout.txt'), 'wx');
  const stderr = fs.openSync(path.join(folder, 'stderr.txt'), 'wx');
  const startedAt = new Date().toISOString();
  const result = spawnSync('pnpm', args, { cwd: root, env, stdio: ['ignore', stdout, stderr] });
  fs.closeSync(stdout); fs.closeSync(stderr);
  const record = { mode: 'direct-openspec-revise-apply', formalRun: false, deliveryFullTest: false, id, program: 'pnpm', args, node: process.version, platform: process.platform, uid: process.getuid(), startedAt, finishedAt: new Date().toISOString(), exitCode: result.status, signal: result.signal, sourceUnchanged: JSON.stringify(before) === JSON.stringify(snapshot()) };
  fs.writeFileSync(path.join(folder, 'command.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  results.push(record);
  console.log(JSON.stringify(record));
  if (id === 'dependency-install' && result.status !== 0) break;
}
fs.writeFileSync(path.join(output, 'environment.json'), JSON.stringify({ platform: 'Linux x64 glibc', imageId: 'sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9', user: 'node', uid: process.getuid(), sourceMount: '/source (read-only)', candidateRoot: root, dependencies: 'Independent Linux frozen-lockfile install', node: process.version, pnpm: spawnSync('pnpm', ['--version'], { encoding: 'utf8' }).stdout.trim(), openspec: spawnSync(process.execPath, ['/flowkit-home/tools/openspec/1.10.0/bin/openspec.js', '--version'], { encoding: 'utf8' }).stdout.trim() }, null, 2) + '\n', { flag: 'wx' });
process.exitCode = results.length === 9 && results.every(item => item.exitCode === 0 && item.sourceUnchanged) ? 0 : 1;
