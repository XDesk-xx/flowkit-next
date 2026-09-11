import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Bounded Explore fixture only; never edits the repository index or attributes.
const repo = process.cwd();
const root = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2] ?? 'attempt-01';
assert.match(attempt, /^attempt-\d{2}$/);
const out = path.join(root, attempt);
await fs.mkdir(out, { recursive: false });
await fs.mkdir(path.join(repo, '.tmp'), { recursive: true });
const scratch = await fs.mkdtemp(path.join(repo, '.tmp/d05-action-explore-'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = (p, value) => fs.writeFile(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const commands = [];
async function command(label, executable, args, cwd = repo, expected = 0) {
  const startedAt = new Date().toISOString();
  const r = spawnSync(executable, args, { cwd, maxBuffer: 16 * 1024 * 1024 });
  const stdout = r.stdout ?? Buffer.alloc(0), stderr = r.stderr ?? Buffer.alloc(0);
  await fs.writeFile(path.join(out, label + '.stdout.txt'), stdout, { flag: 'wx' });
  await fs.writeFile(path.join(out, label + '.stderr.txt'), stderr, { flag: 'wx' });
  const record = { label, executable, args, cwd, startedAt, finishedAt: new Date().toISOString(),
    exitCode: r.status, error: r.error?.message ?? null,
    stdoutSha256: hash(stdout), stderrSha256: hash(stderr) };
  await json(path.join(out, label + '.command.json'), record);
  commands.push(record);
  assert.equal(r.status, expected, `${label}: ${stderr} ${r.error?.message ?? ''}`);
  return stdout;
}
const attributes = await fs.readFile('.gitattributes');
await fs.writeFile(path.join(out, 'baseline.gitattributes'), attributes, { flag: 'wx' });
const patterns = ['**/stdout.txt', '**/stderr.txt', '**/*.stdout.txt', '**/*.stderr.txt']
  .map(p => `.flowkit/artifacts/${p} -text -whitespace`).join('\n') + '\n';
await fs.writeFile(path.join(out, 'candidate-attributes.txt'), patterns, { flag: 'wx' });
const raw = Buffer.from('first line  \r\nsecond line\r\n\r\n');
await fs.writeFile(path.join(out, 'fixture-input.bin'), raw, { flag: 'wx' });
const paths = [
  '.flowkit/artifacts/future-delivery/changes/another-change/proof/run/stdout.txt',
  '.flowkit/artifacts/future-delivery/changes/another-change/proof/run/check.stderr.txt',
  '.flowkit/artifacts/future-delivery/full-test/attempt/stdout.txt',
  '.flowkit/artifacts/future-delivery/full-test/attempt/check.stdout.txt',
];
async function fixture(name, generalized) {
  const cwd = path.join(scratch, name);
  await fs.mkdir(cwd);
  await command(name + '-init', 'git', ['init', '--quiet'], cwd);
  await fs.writeFile(path.join(cwd, '.gitattributes'), Buffer.concat([attributes, Buffer.from(generalized ? '\n' + patterns : '')]));
  for (const p of paths) {
    await fs.mkdir(path.dirname(path.join(cwd, p)), { recursive: true });
    await fs.writeFile(path.join(cwd, p), raw);
  }
  await command(name + '-attributes', 'git', ['check-attr', 'text', 'whitespace', '--', ...paths], cwd);
  await command(name + '-add', 'git', ['-c', 'core.autocrlf=false', '-c', 'core.safecrlf=false', 'add', '--', '.gitattributes', ...paths], cwd);
  const checks = await command(name + '-check', 'git', ['diff', '--cached', '--check'], cwd, generalized ? 0 : 2);
  const identities = [];
  for (const [i, p] of paths.entries()) {
    const indexed = await command(name + '-blob-' + i, 'git', ['show', ':' + p], cwd);
    identities.push({ path: p, inputSha256: hash(raw), indexSha256: hash(indexed), exactBytes: indexed.equals(raw) });
    assert.equal(indexed.equals(raw), generalized);
  }
  if (generalized) {
    await fs.mkdir(path.join(cwd, 'src'));
    await fs.writeFile(path.join(cwd, 'src/control.ts'), 'export const control = 1;  \n');
    await command(name + '-source-add', 'git', ['add', '--', 'src/control.ts'], cwd);
    const sourceCheck = await command(name + '-source-check', 'git', ['diff', '--cached', '--check'], cwd, 2);
    assert.match(sourceCheck.toString(), /src\/control.ts/);
    assert.doesNotMatch(sourceCheck.toString(), /\.flowkit\/artifacts/);
  } else assert.match(checks.toString(), /trailing whitespace/);
  return identities;
}
const baseline = await fixture('baseline', false);
const candidate = await fixture('generalized', true);
const sources = ['src/cli/request.ts', 'src/cli/foundation-cli.ts', 'src/cli/trusted-change-coordination.ts',
  'src/domain/single-action-execution.ts', 'src/domain/run-result-persistence.ts',
  'src/domain/action-package-result-admission.ts', '.gitattributes'];
const sourceRefs = [];
for (const p of sources) {
  const bytes = await fs.readFile(p);
  sourceRefs.push({ path: p, bytes: bytes.length, sha256: hash(bytes) });
}
const testOutput = await command('existing-focused-tests', process.execPath, ['--import', 'tsx', '--test',
  'tests/unit/domain/single-action-execution.test.ts',
  'tests/unit/domain/run-result-persistence.test.ts',
  'tests/unit/domain/foundation-cli-surface.test.ts']);
assert.match(testOutput.toString(), /# fail 0\r?\n/);
assert.match(testOutput.toString(), /# skipped 0\r?\n/);
assert.deepEqual(await fs.readFile('.gitattributes'), attributes);
await json(path.join(out, 'summary.json'), { status: 'PASS', platform: process.platform,
  node: process.version, fixtureRoot: scratch, baseline, candidate, sourceRefs, commands,
  sourceWhitespaceStillRejected: true, repositoryAttributesUnchanged: true,
  testMeaning: 'Existing seam regression only, not actual host integration acceptance',
  limits: ['仅 Windows 原生 Git 实验，未运行 Linux', '通用模式覆盖声明的 stdout/stderr 命名，不覆盖任意报告格式',
    '未实施宿主接入、上下文自动选择或证据接纳；不声称新产品 PASS'] });
console.log(JSON.stringify({ status: 'PASS', baselineNormalized: baseline.length, candidateExact: candidate.length, proof: out }));
