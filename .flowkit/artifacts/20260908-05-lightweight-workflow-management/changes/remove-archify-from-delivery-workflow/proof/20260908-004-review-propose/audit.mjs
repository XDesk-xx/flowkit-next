// Reviewer-only readback and planning diagnostics; never runs Author seal/validation scripts.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, lstat, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = await realpath(process.cwd());
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = process.argv[2];
assert.match(attempt ?? '', /^attempt-[0-9]+$/);
const out = path.join(proof, attempt);
await mkdir(out);
const startedAt = new Date().toISOString();
const deliveryId = '20260908-05-lightweight-workflow-management';
const changeId = 'remove-archify-from-delivery-workflow';
const runRoot = `.flowkit/runs/${deliveryId}/${changeId}`;
const change = `openspec/changes/${changeId}`;
const json = value => JSON.stringify(value, null, 2) + '\n';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const save = (name, value) => writeFile(path.join(out, name), value, { flag: 'wx' });
async function bytes(file) {
  assert.ok(!path.isAbsolute(file) && !file.split(/[\\/]/).includes('..'));
  const target = path.join(root, file);
  const stat = await lstat(target);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), file);
  assert.equal((await realpath(target)).toLowerCase(), target.toLowerCase(), file);
  return readFile(target);
}
async function readJson(file) { return JSON.parse((await bytes(file)).toString('utf8')); }
async function verify(ref) {
  const value = await bytes(ref.path);
  assert.equal(hash(value), ref.sha256, ref.path);
  if (ref.bytes !== undefined) assert.equal(value.length, ref.bytes, ref.path);
}
async function command(label, program, args) {
  const result = spawnSync(program, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  await save(label + '.stdout.txt', result.stdout ?? '');
  await save(label + '.stderr.txt', result.stderr ?? '');
  await save(label + '.command.json', json({ program, args, cwd: root,
    exitCode: result.status, signal: result.signal, error: result.error?.message ?? null }));
  assert.equal(result.status, 0, `${label}: ${result.error ?? result.stderr}`);
  return result.stdout;
}
try {
  const author = await readJson(runRoot + '/20260908-003-propose/result.json');
  const context = await readJson(runRoot + '/20260908-003-propose/context.json');
  assert.equal(author.action, 'propose');
  assert.equal(author.status, 'terminal');
  assert.equal(author.verdict, 'PASS');
  assert.equal(author.nextBoundary, 'review-propose');
  assert.equal(author.canonicalFlowkitRuntimeRun, false);
  assert.equal(author.previousRunId, '20260908-002-review-explore');
  assert.equal(author.previousResultSha256, context.previousResultSha256);
  const previousPath = runRoot + '/' + author.previousRunId + '/result.json';
  await verify({ path: previousPath, sha256: author.previousResultSha256 });
  const previous = await readJson(previousPath);
  assert.equal(previous.verdict, 'approved');
  assert.equal(previous.nextBoundary, 'propose');
  assert.equal(previous.reviewedRunId, '20260908-001-explore');
  await verify({ path: previous.reviewedArtifact, sha256: previous.reviewedArtifactSha256 });
  await verify({ path: runRoot + '/' + previous.reviewedRunId + '/result.json', sha256: previous.reviewedResultSha256 });
  for (const ref of Object.values(previous.runArtifacts)) await verify(ref);
  for (const runId of ['20260908-001-explore', previous.runId, author.runId]) {
    assert.deepEqual((await readdir(runRoot + '/' + runId)).sort(), ['action.md', 'context.json', 'result.json']);
    for (const file of ['context.json', 'result.json']) {
      const record = await readJson(runRoot + '/' + runId + '/' + file);
      assert.equal(record.deliveryId, deliveryId);
      assert.equal(record.changeId, changeId);
      assert.equal(record.runId, runId);
      assert.equal(record.projectOrdinal, author.projectOrdinal);
    }
  }
  for (const ref of author.artifacts) await verify(ref);
  await verify(author.validation);
  const authorValidation = await readJson(author.validation.path);
  assert.equal(authorValidation.status, 'passed');
  assert.deepEqual(authorValidation.inputs, author.artifacts);
  const planInputs = author.artifacts;
  const tasks = (await bytes(change + '/tasks.md')).toString('utf8');
  const unchecked = (tasks.match(/^- \[ \] /gm) ?? []).length;
  assert.ok(unchecked > 0 && !/^- \[[xX]\]/m.test(tasks));
  const mapping = [];
  const sourceInputs = [];
  for (const capability of (await readdir(change + '/specs')).sort()) {
    const delta = (await bytes(change + '/specs/' + capability + '/spec.md')).toString('utf8');
    const basePath = 'openspec/specs/' + capability + '/spec.md';
    const base = await bytes(basePath);
    sourceInputs.push({ path: basePath, bytes: base.length, sha256: hash(base) });
    const names = new Set([...base.toString('utf8').matchAll(/^### Requirement: (.+)\r?$/gm)].map(match => match[1].trim()));
    const local = new Set();
    let operation;
    for (const line of delta.split(/\r?\n/)) {
      const heading = /^## (ADDED|MODIFIED|REMOVED) Requirements$/.exec(line);
      if (heading) operation = heading[1];
      if (!line.startsWith('### Requirement: ')) continue;
      const name = line.slice(17);
      assert.ok(operation && !local.has(name), name);
      local.add(name);
      assert.equal(names.has(name), operation !== 'ADDED', name);
      mapping.push({ capability, operation, requirement: name });
    }
  }
  const cli = 'C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js';
  const tool = JSON.parse(await readFile(path.resolve(cli, '../../package.json'), 'utf8'));
  assert.equal(tool.name, '@fission-ai/openspec');
  assert.equal(tool.version, '1.10.0');
  await command('openspec-validate', process.execPath, [cli, 'validate', changeId, '--strict']);
  const status = JSON.parse(await command('openspec-status', process.execPath, [cli, 'status', '--change', changeId, '--json']));
  assert.equal(status.changeName, changeId);
  assert.equal(status.isPlanningComplete, true);
  assert.ok(status.artifacts.every(item => item.status === 'done'));
  await command('git-diff-check', 'git', ['diff', '--check']);
  for (const ref of [...planInputs, ...sourceInputs]) await verify(ref);
  const outputs = [];
  for (const file of (await readdir(out)).sort()) {
    const value = await readFile(path.join(out, file));
    outputs.push({ file, bytes: value.length, sha256: hash(value) });
  }
  const summary = { kind: 'independent-review-propose-checks', deliveryId, changeId,
    reviewedRunId: author.runId, reviewRunId: '20260908-004-review-propose',
    startedAt, completedAt: new Date().toISOString(), platform: process.platform, node: process.version,
    chain: ['20260908-001-explore', previous.runId, author.runId],
    reviewedResultSha256: hash(await bytes(runRoot + '/' + author.runId + '/result.json')),
    predecessorResultSha256: author.previousResultSha256,
    planInputs, sourceInputs, mapping, outputs,
    checks: { exactChainAndArtifactHashes: true, authorValidationHash: true,
      requirementNamesMatchBase: true, openspecStrict: true, planningComplete: true,
      uncheckedTasks: unchecked, gitDiffCheck: true, inputsUnchanged: true },
    limitation: 'Planning diagnostics and local readback only; no implementation tests or Formal Full Test, no candidate lifecycle admission.' };
  await save('summary.json', json(summary));
  console.log(json({ saved: path.relative(root, out), checks: summary.checks, deltaRequirements: mapping.length }));
} catch (error) {
  await save('failure.json', json({ startedAt, completedAt: new Date().toISOString(), error: String(error), stack: error.stack }));
  throw error;
}
