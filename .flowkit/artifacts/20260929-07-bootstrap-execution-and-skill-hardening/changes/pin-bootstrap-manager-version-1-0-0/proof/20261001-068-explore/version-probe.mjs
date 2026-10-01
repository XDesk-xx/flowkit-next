import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
assert.equal(path.resolve(root).toLowerCase(), 'd:\\projects\\flowkit-next');
const deliveryId = '20260929-07-bootstrap-execution-and-skill-hardening';
const changeId = 'pin-bootstrap-manager-version-1-0-0';
const runId = '20261001-068-explore';
const proof = path.join(root, '.flowkit', 'artifacts', deliveryId, 'changes', changeId, 'proof', runId);
const scratch = await mkdtemp(path.join(root, '.tmp', 'd07-version-068-'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourcePackage = await readFile(path.join(root, 'package.json'));
const sourceDocs = await readFile(path.join(root, 'docs/onboarding.md'));
const sourceLock = await readFile(path.join(root, 'pnpm-lock.yaml'));
assert.equal(JSON.parse(sourcePackage).version, '0.1.0');
assert.equal(sourceDocs.toString('utf8').split('flowkit-next-0.1.0.tgz').length, 2);
const skip = new Set(['.git', '.flowkit', '.tmp', 'node_modules', 'dist', 'architecture', 'coverage', '.codebuddy']);
for (const name of await readdir(root)) {
  if (skip.has(name)) continue;
  await cp(path.join(root, name), path.join(scratch, name), { recursive: true, force: false });
}
const packagePath = path.join(scratch, 'package.json');
const docsPath = path.join(scratch, 'docs/onboarding.md');
const beforePackage = await readFile(packagePath, 'utf8');
const beforeDocs = await readFile(docsPath, 'utf8');
assert.equal(beforePackage.split('"version": "0.1.0"').length, 2);
assert.equal(beforeDocs.split('flowkit-next-0.1.0.tgz').length, 2);
await writeFile(packagePath, beforePackage.replace('"version": "0.1.0"', '"version": "1.0.0"'));
await writeFile(docsPath, beforeDocs.replace('flowkit-next-0.1.0.tgz', 'flowkit-next-1.0.0.tgz'));
assert.equal(digest(await readFile(path.join(scratch, 'pnpm-lock.yaml'))), digest(sourceLock));
const reports = [];
async function command(id, args) {
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, args, { cwd: scratch, windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'] });
  const chunks = { stdout: [], stderr: [] };
  child.stdout.on('data', (bytes) => chunks.stdout.push(bytes));
  child.stderr.on('data', (bytes) => chunks.stderr.push(bytes));
  const ended = await new Promise((resolve) => {
    child.on('error', (error) => resolve({ exitCode: null, signal: null, processError: error.message }));
    child.on('close', (exitCode, signal) => resolve({ exitCode, signal, processError: null }));
  });
  const stdout = Buffer.concat(chunks.stdout), stderr = Buffer.concat(chunks.stderr);
  await writeFile(path.join(proof, `${id}.stdout.txt`), stdout, { flag: 'wx' });
  await writeFile(path.join(proof, `${id}.stderr.txt`), stderr, { flag: 'wx' });
  const report = { id, command: [process.execPath, ...args], cwd: scratch,
    startedAt, finishedAt: new Date().toISOString(), ...ended,
    stdoutBytes: stdout.length, stdoutSha256: digest(stdout),
    stderrBytes: stderr.length, stderrSha256: digest(stderr) };
  reports.push(report);
  process.stdout.write(`${id}: ${ended.exitCode}\n`);
  assert.equal(ended.exitCode, 0, `${id} failed; raw streams retained`);
  assert.equal(ended.processError, null);
}
const pnpm = 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
await command('frozen-install', [pnpm, 'install', '--frozen-lockfile']);
await command('pack', [pnpm, 'pack', '--pack-destination', scratch]);
const tgzPath = path.join(scratch, 'flowkit-next-1.0.0.tgz');
assert.ok((await lstat(tgzPath)).isFile());
const tgzBytes = await readFile(tgzPath);
await writeFile(path.join(proof, 'flowkit-next-1.0.0-probe.tgz'), tgzBytes, { flag: 'wx' });
const npm = 'C:/nvm4w/nodejs/node_modules/npm/bin/npm-cli.js';
await command('production-install', [npm, 'install', '--prefix', path.join(scratch, 'installation'),
  '--omit=dev', '--no-audit', '--no-fund', tgzPath]);
const manager = path.join(scratch, 'installation', 'node_modules', 'flowkit-next');
const installedPackage = JSON.parse(await readFile(path.join(manager, 'package.json'), 'utf8'));
const installedDocs = await readFile(path.join(manager, 'docs/onboarding.md'), 'utf8');
assert.equal(installedPackage.name, 'flowkit-next');
assert.equal(installedPackage.version, '1.0.0');
assert.equal(installedPackage.bin.flowkit, 'dist/cli/entrypoint.js');
assert.ok(installedDocs.includes('flowkit-next-1.0.0.tgz'));
assert.equal(installedDocs.includes('flowkit-next-0.1.0.tgz'), false);
assert.equal(digest(await readFile(path.join(root, 'package.json'))), digest(sourcePackage));
assert.equal(digest(await readFile(path.join(root, 'docs/onboarding.md'))), digest(sourceDocs));
const report = { kind: 'd07-version-1-0-0-explore-probe', deliveryId, changeId, runId,
  sourceHead: 'f826f44587b25130a9f47d2426391cbba52520b1',
  scratch, sourceVersion: '0.1.0', targetVersion: '1.0.0',
  sourcePackageSha256: digest(sourcePackage), sourceDocsSha256: digest(sourceDocs),
  lockSha256: digest(sourceLock),
  package: { name: installedPackage.name, version: installedPackage.version,
    file: 'flowkit-next-1.0.0-probe.tgz', bytes: tgzBytes.length,
    sha256: digest(tgzBytes), bin: installedPackage.bin,
    dependencies: installedPackage.dependencies },
  installedDocsExample: 'flowkit-next-1.0.0.tgz',
  commands: reports,
  limitation: 'Isolated exploratory copy only; actual source version, final package, Formal Full Test and publication remain unverified.' };
await writeFile(path.join(proof, 'version-probe-report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
process.stdout.write(JSON.stringify({ scratch, packageSha256: report.package.sha256,
  packageBytes: report.package.bytes, checks: reports.map(({ id, exitCode }) => ({ id, exitCode })) }) + '\n');
