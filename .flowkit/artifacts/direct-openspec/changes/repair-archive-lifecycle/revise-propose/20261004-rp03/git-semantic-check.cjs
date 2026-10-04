// Design semantics only; no Flowkit implementation acceptance or Reviewer verdict.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const evidence = __dirname;
const repository = path.resolve(evidence, '../../../../../../..');
const commands = [];
const stdout = [];
const stderr = [];
let outOffset = 0;
let errOffset = 0;
function git(cwd, ...args) {
  const start = new Date().toISOString();
  const result = cp.spawnSync('git', args, { cwd, maxBuffer: 1024 * 1024 });
  const out = result.stdout || Buffer.alloc(0);
  const err = result.stderr || Buffer.alloc(0);
  commands.push({ cwd, args, start, end: new Date().toISOString(), exitCode: result.status,
    signal: result.signal, spawnError: result.error?.message || null,
    stdout: [outOffset, out.length], stderr: [errOffset, err.length] });
  stdout.push(out);
  stderr.push(err);
  outOffset += out.length;
  errOffset += err.length;
  if (result.status !== 0) throw Error(JSON.stringify(commands.at(-1)));
  return out.toString('utf8').trim();
}
function hashFile(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}
function repositoryIdentity() {
  return { head: git(repository, 'rev-parse', 'HEAD'),
    index: hashFile(path.join(repository, '.git/index')),
    config: hashFile(path.join(repository, '.git/config')),
    reviewer: hashFile(path.join(repository, 'openspec/changes/repair-archive-lifecycle/review-propose.md')),
    reviewer02: hashFile(path.join(repository, 'openspec/changes/repair-archive-lifecycle/review-propose-02.md')),
    revision01: hashFile(path.join(repository, 'openspec/changes/repair-archive-lifecycle/revise-propose.md')) };
}
const before = repositoryIdentity();
let summary;
try {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'flowkit-rp03-author-'));
  git(root, 'init', '-q');
  git(root, 'config', 'core.autocrlf', 'false');
  git(root, 'config', 'core.safecrlf', 'false');
  const file = path.join(root, 'a.txt');
  const attrs = path.join(root, '.gitattributes');
  fs.writeFileSync(file, 'same\r\n');
  fs.writeFileSync(attrs, '*.txt -text\n');
  const old = new Date(Date.now() - 60000);
  fs.utimesSync(file, old, old);
  git(root, 'add', '--', '.gitattributes', 'a.txt');
  const original = git(root, 'rev-parse', ':a.txt');
  const raw = git(root, 'hash-object', '--no-filters', '--', 'a.txt');
  fs.writeFileSync(attrs, '*.txt text eol=crlf\n');
  git(root, 'add', '--', '.gitattributes');
  const clean = git(root, 'hash-object', '--path=a.txt', '--', 'a.txt');
  git(root, 'add', '--', 'a.txt');
  const cached = git(root, 'rev-parse', ':a.txt');
  const cachedEol = git(root, 'ls-files', '--eol', '--', 'a.txt');
  const now = new Date();
  fs.utimesSync(file, now, now);
  git(root, 'add', '--', 'a.txt');
  const touched = git(root, 'rev-parse', ':a.txt');
  const touchedEol = git(root, 'ls-files', '--eol', '--', 'a.txt');
  assert.equal(original, raw);
  assert.notEqual(clean, raw);
  assert.equal(cached, raw);
  assert.equal(touched, clean);
  assert.equal(fs.readFileSync(file).toString('hex'), '73616d650d0a');
  const after = repositoryIdentity();
  assert.deepEqual(after, before);
  summary = { kind: 'git-design-semantics', gitVersion: git(root, '--version'), fixture: root,
    original, raw, clean, cached, touched, cachedEol, touchedEol,
    rawHex: fs.readFileSync(file).toString('hex'),
    interpretation: 'Both pre-add states are excluded by the proposed raw-equals-old-blob/clean-differs boundary, irrespective of stat; this script does not execute the candidate guard.',
    repositoryBefore: before, repositoryAfter: after, assertionsPassed: true };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
} finally {
  fs.writeFileSync(path.join(evidence, 'stdout.txt'), Buffer.concat(stdout), { flag: 'wx' });
  fs.writeFileSync(path.join(evidence, 'stderr.txt'), Buffer.concat(stderr), { flag: 'wx' });
  fs.writeFileSync(path.join(evidence, 'commands.json'), JSON.stringify(commands, null, 2) + '\n', { flag: 'wx' });
  if (summary) fs.writeFileSync(path.join(evidence, 'git-semantics.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
}
