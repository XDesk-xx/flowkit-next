import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = async file => hash(await readFile(file));
const evidence = import.meta.dirname;
const originalRoot = '.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/verification/20261003-190005-final';
const original = JSON.parse(await readFile(`${originalRoot}/native-windows/command.json`, 'utf8'));
const drift = [];
for (const [file, previous] of Object.entries(original.sourceInputs)) {
  const current = await digest(file);
  if (current !== previous) drift.push({ file, previous, current });
}
const currentInputs = JSON.parse(await readFile(path.join(evidence, 'focused/command.json'), 'utf8')).sourceInputs;
const added = Object.keys(currentInputs).filter(file => !Object.hasOwn(original.sourceInputs, file));
await writeFile(path.join(evidence, 'native-input-comparison.json'), JSON.stringify({ oldEvidence: `${originalRoot}/native-windows/command.json`, oldEvidenceSha256: await digest(`${originalRoot}/native-windows/command.json`), oldExitCode: original.exitCode, oldStartedAt: original.startedAt, oldFinishedAt: original.finishedAt, drift, added }, null, 2) + '\n', { flag: 'wx' });
const git = promisify(execFile);
const facts = {};
for (const [id, args] of [['branch', ['branch', '--show-current']], ['head', ['rev-parse', 'HEAD']], ['status', ['status', '--short']], ['diff-check', ['diff', '--check']]]) {
  const startedAt = new Date().toISOString();
  const result = await git('git', args, { encoding: 'buffer', windowsHide: true }).catch(error => ({ stdout: error.stdout, stderr: error.stderr, code: error.code }));
  await writeFile(path.join(evidence, `${id}.stdout.txt`), result.stdout, { flag: 'wx' });
  await writeFile(path.join(evidence, `${id}.stderr.txt`), result.stderr, { flag: 'wx' });
  facts[id] = { program: 'git', args, startedAt, finishedAt: new Date().toISOString(), exitCode: result.code ?? 0, stdoutSha256: hash(result.stdout), stderrSha256: hash(result.stderr) };
}
await writeFile(path.join(evidence, 'git-facts.json'), JSON.stringify(facts, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ oldNativeExit: original.exitCode, changed: drift.map(item => item.file), newFiles: added, gitExitCodes: Object.fromEntries(Object.entries(facts).map(([id, value]) => [id, value.exitCode])) }));
