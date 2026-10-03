const { spawnSync } = require('node:child_process');
const path = require('node:path');
for (const id of ['typecheck', 'gate-r2', 'build', 'dependencies', 'entropy', 'ownership', 'acceptance', 'probe', 'openspec']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'capture.cjs'), id], { cwd: process.cwd(), windowsHide: true, stdio: 'inherit' });
  if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
}
