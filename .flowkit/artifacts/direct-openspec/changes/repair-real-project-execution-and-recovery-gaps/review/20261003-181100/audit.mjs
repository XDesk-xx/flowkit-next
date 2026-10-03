import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const repo = process.cwd();
const digest = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const reports = [];
const fixRoot = '.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/fix/20261003-174945';
for (const id of ['domain', 'acceptance', 'typecheck', 'gate', 'build', 'dependencies', 'entropy', 'ownership', 'probe']) {
  const relative = `${fixRoot}/${id}/command.json`;
  const metadata = JSON.parse(await readFile(relative, 'utf8'));
  const drift = [];
  for (const [file, hash] of Object.entries(metadata.sourceInputs)) if (await digest(file) !== hash) drift.push(file);
  reports.push({ relative, metadataSha256: await digest(relative), inputCount: Object.keys(metadata.sourceInputs).length, exitCode: metadata.exitCode, sourceUnchanged: metadata.sourceUnchanged, drift, startedAt: metadata.startedAt, finishedAt: metadata.finishedAt });
}
await writeFile(path.join(import.meta.dirname, 'fix-evidence-audit.json'), JSON.stringify(reports, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(reports.map(item => ({ id: item.relative.split('/').at(-2), exitCode: item.exitCode, inputCount: item.inputCount, drift: item.drift }))));
const manager = 'D:/tools/flowkit-manager/node_modules/flowkit-next';
const input = path.join(import.meta.dirname, 'target.json');
const doctorInput = path.join(import.meta.dirname, 'doctor-target.json');
await writeFile(input, JSON.stringify({ repositoryRoot: repo, flowkitHome: 'C:/Users/xuser/.flowkit', changeId: 'repair-real-project-execution-and-recovery-gaps' }) + '\n', { flag: 'wx' });
await writeFile(doctorInput, JSON.stringify({ repositoryRoot: repo, flowkitHome: 'C:/Users/xuser/.flowkit' }) + '\n', { flag: 'wx' });
const queries = await Promise.all(['status', 'next', 'doctor'].map(async command => {
  const directory = path.join(import.meta.dirname, `manager-${command}`);
  await mkdir(directory);
  const args = [path.join(manager, 'dist/cli/entrypoint.js'), command, '--input', command === 'doctor' ? doctorInput : input];
  const startedAt = new Date().toISOString();
  const stdout = [], stderr = [];
  const child = spawn(process.execPath, args, { cwd: repo, windowsHide: true });
  child.stdout.on('data', data => stdout.push(data));
  child.stderr.on('data', data => stderr.push(data));
  const result = await new Promise(resolve => child.on('close', (exitCode, signal) => resolve({ exitCode, signal })));
  await writeFile(path.join(directory, 'stdout.txt'), Buffer.concat(stdout), { flag: 'wx' });
  await writeFile(path.join(directory, 'stderr.txt'), Buffer.concat(stderr), { flag: 'wx' });
  await writeFile(path.join(directory, 'command.json'), JSON.stringify({ program: process.execPath, args, startedAt, finishedAt: new Date().toISOString(), ...result, managerPackageSha256: await digest(path.join(manager, 'package.json')), managerEntrySha256: await digest(args[0]) }, null, 2) + '\n', { flag: 'wx' });
  return { command, ...result, stdout: Buffer.concat(stdout).toString().slice(0, 2500), stderr: Buffer.concat(stderr).toString().slice(0, 300) };
}));
console.log(JSON.stringify(queries));
