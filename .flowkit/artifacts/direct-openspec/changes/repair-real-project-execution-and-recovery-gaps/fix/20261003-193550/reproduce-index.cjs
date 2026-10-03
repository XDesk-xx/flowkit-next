const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'flowkit-index-cache-'));
const file = '.flowkit/artifacts/proof.txt';
const original = Buffer.from('original\r\n');
const observations = [];
function git(args) {
  const result = spawnSync('git', args, { cwd: root, windowsHide: true });
  if (result.status !== 0) throw Error(result.stderr.toString());
  return result.stdout;
}
try {
  git(['init']);
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), original);
  for (let round = 0; round < 5; round++) {
    fs.writeFileSync(path.join(root, '.gitattributes'), '* text=auto eol=lf\n');
    git(['add', '--renormalize', '--', file]);
    git(['add', '--', file]);
    const stat = fs.statSync(path.join(root, file));
    fs.writeFileSync(path.join(root, '.gitattributes'), '* text=auto eol=lf\n.flowkit/artifacts/** -text\n');
    git(['add', '--', file]);
    const plain = git(['show', ':' + file]);
    git(['add', '--renormalize', '--', file]);
    const explicit = git(['show', ':' + file]);
    observations.push({ round, mtimeMs: stat.mtimeMs, rawBytes: original.length, plainAddBytes: plain.length, renormalizedBytes: explicit.length, explicitEqual: explicit.equals(original), sourceUnchanged: fs.readFileSync(path.join(root, file)).equals(original) });
  }
  console.log(JSON.stringify(observations));
  fs.writeFileSync(path.join(__dirname, 'index-cache-reproduction.json'), JSON.stringify(observations, null, 2) + '\n', { flag: 'wx' });
} finally { fs.rmSync(root, { recursive: true, force: true }); }
