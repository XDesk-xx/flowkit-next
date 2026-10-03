// Read-only progress from the current disposable native acceptance target.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const started = fs.statSync(path.join(__dirname, 'native')).birthtimeMs;
const observations = [];
for (const entry of fs.readdirSync(os.tmpdir(), { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('flowkit-context-')) continue;
  const root = path.join(os.tmpdir(), entry.name);
  if (fs.statSync(root).birthtimeMs < started) continue;
  const target = path.join(root, 'target');
  if (!fs.existsSync(path.join(target, 'tests/native-full-checks.ts'))) continue;
  const directory = path.join(target, '.flowkit/artifacts/delivery-one/changes/001-change-one/archive-diagnostics');
  if (!fs.existsSync(directory)) continue;
  for (const attempt of fs.readdirSync(directory)) {
    const folder = path.join(directory, attempt, 'commands');
    if (!fs.existsSync(folder)) continue;
    observations.push({ attempt, commands: fs.readdirSync(folder).map(id => {
      const file = path.join(folder, id, 'command.json');
      if (fs.existsSync(file)) {
        const record = JSON.parse(fs.readFileSync(file));
        return { id, exitCode: record.exitCode, completed: true };
      }
      const stdout = path.join(folder, id, 'stdout.txt');
      const bytes = fs.existsSync(stdout) ? fs.readFileSync(stdout).toString() : '';
      return { id, completed: false, reportedFiles: [...new Set([...bytes.matchAll(/^# domain-file (.+)$/gm)].map(match => match[1]))].length, outputBytes: Buffer.byteLength(bytes) };
    }) });
  }
}
console.log(JSON.stringify({ observedAt: new Date().toISOString(), observations }));
