import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
const root = process.cwd();
const directory = import.meta.dirname;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = async file => hash(await readFile(file));
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const records = [];
for (const id of ['domain', 'acceptance', 'native', 'typecheck', 'gate-r2', 'build', 'dependencies', 'entropy', 'ownership', 'probe', 'openspec']) {
  const file = path.join(directory, id, 'command.json');
  const record = await json(file);
  assert.equal(record.exitCode, 0, id);
  assert.equal(record.sourceUnchanged, true, id);
  for (const [relative, recorded] of Object.entries(record.sourceInputs)) assert.equal(await digest(path.join(root, relative)), recorded, `${id}: ${relative}`);
  records.push({ id, commandSha256: await digest(file), exitCode: record.exitCode, inputCount: Object.keys(record.sourceInputs).length });
}
const windows = await json(path.join(directory, 'native/command.json'));
const linux = await json(path.join(directory, 'linux/source-inputs.json'));
assert.deepEqual(linux, windows.sourceInputs, 'Linux and native Windows use the exact same code/config/HOW inputs');
const linuxRecords = [];
for (const id of ['dependency-install', 'typecheck', 'quality-gate', 'build', 'test-domain', 'test-acceptance', 'quality-dependency-health', 'quality-entropy', 'quality-owned-source']) {
  const file = path.join(directory, 'linux', id, 'command.json');
  const record = await json(file);
  assert.equal(record.exitCode, 0, id);
  assert.equal(record.sourceUnchanged, true, id);
  assert.equal(record.uid, 1000, id);
  linuxRecords.push({ id, commandSha256: await digest(file), exitCode: record.exitCode });
}
const probes = await json(path.join(directory, 'probe-results.json'));
assert.equal(probes.length, 6);
for (const probe of probes) {
  assert.equal(probe.unexpectedError, undefined);
  assert.equal(probe.preparedRead, 'passed');
  assert.equal(probe.terminalRead, 'passed');
  assert.equal(probe.finish.effect, 'confirmed');
  assert.equal(probe.originalUnchanged, true);
}
const previousReview = '.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/review/20261003-181100';
const previousManifest = await json(path.join(previousReview, 'evidence-identities.json'));
for (const [relative, recorded] of Object.entries(previousManifest.files)) assert.equal(await digest(path.join(previousReview, relative)), recorded, `Preserve Reviewer evidence: ${relative}`);
const before = await json(path.join(previousReview, 'focused/command.json'));
const changed = [];
for (const [relative, recorded] of Object.entries(before.sourceInputs)) if (await digest(path.join(root, relative)) !== recorded) changed.push(relative);
const allowed = ['src/cli/run-effective-facts.ts', 'src/cli/action-correct.ts', 'tests/unit/domain/action-correction-continuation.test.ts', 'tests/unit/domain/action-correction.test.ts', 'openspec/changes/repair-real-project-execution-and-recovery-gaps/verification.md'];
assert.ok(changed.every(file => allowed.includes(file)), 'Revision stays within the two findings');
const nativeIdentity = await json(path.join(directory, 'native-evidence/source-identities.json'));
assert.equal(nativeIdentity.sourceUnchanged, true);
assert.equal(nativeIdentity.finish.effect, 'confirmed');
assert.equal(nativeIdentity.realCheckFailureCovered, true);
assert.equal(nativeIdentity.actualDomainChecks, 8);
const domainOutput = await readFile(path.join(directory, 'domain/stdout.txt'), 'utf8');
const domainCount = Number(/^# tests (\d+)$/m.exec(domainOutput)[1]);
assert.deepEqual(nativeIdentity.actualDomainCounts, [domainCount, domainCount]);
const commands = [];
async function visit(relative) {
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) await visit(file);
    else if (entry.isFile() && entry.name === 'command.json') {
      const record = await json(path.join(directory, file));
      commands.push({ path: file.replaceAll('\\', '/'), exitCode: record.exitCode, program: record.program, args: record.args });
    }
  }
}
await visit('native-evidence/all-attempts');
assert.equal(commands.filter(record => record.path.includes('check-test%3Adomain%3A') && record.exitCode === 0).length, 8);
assert.equal(commands.filter(record => record.path.includes('check-full-checks') && record.exitCode === 0).length, 2);
assert.equal(commands.filter(record => record.path.includes('check-full-checks') && record.exitCode === 1).length, 1);
const exec = promisify(execFile);
for (const [id, args] of [['head', ['rev-parse', 'HEAD']], ['status', ['status', '--short']], ['diff-check', ['diff', '--check']]]) {
  const result = await exec('git', args, { encoding: 'buffer', windowsHide: true });
  await writeFile(path.join(directory, `${id}.stdout.txt`), result.stdout, { flag: 'wx' });
  await writeFile(path.join(directory, `${id}.stderr.txt`), result.stderr, { flag: 'wx' });
}
const summary = { formalRun: false, deliveryFullTest: false, ownerSourceRef: 'Owner direct instruction: 直接修复这两个问题', records, linuxRecords, linuxWindowsInputDrift: [], changedSinceReview: changed, previousReviewEvidenceUnchanged: true, probeCases: probes.map(({ verdict, declaredMap, terminalRead, originalUnchanged }) => ({ verdict, declaredMap, terminalRead, originalUnchanged })), nativeActualDomainCounts: nativeIdentity.actualDomainCounts, nativeCommands: commands };
await writeFile(path.join(directory, 'audit.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ windowsCommands: records.length, linuxCommands: linuxRecords.length, changed, nativeActualDomainCounts: nativeIdentity.actualDomainCounts, nativeCommands: commands.length, linuxWindowsInputDrift: 0, previousReviewEvidenceUnchanged: true }));
