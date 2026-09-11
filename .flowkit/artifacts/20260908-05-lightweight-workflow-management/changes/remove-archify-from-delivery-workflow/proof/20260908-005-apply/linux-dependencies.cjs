const assert = require('node:assert/strict');
const { readFileSync, realpathSync, readdirSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { parse } = require('/work/project/node_modules/yaml');
const base = '/work/project';
const sourcePackage = JSON.parse(readFileSync('/source/package.json'));
const sourceLock = parse(readFileSync('/source/pnpm-lock.yaml', 'utf8'));
const installedLock = parse(readFileSync(base + '/node_modules/.pnpm/lock.yaml', 'utf8'));
assert.equal(process.versions.node, '22.23.2');
assert.equal(sourcePackage.packageManager, 'pnpm@11.22.0');
assert.deepEqual(installedLock, sourceLock);
const installed = {};
for (const group of ['dependencies', 'devDependencies']) {
  for (const name of Object.keys(sourcePackage[group])) {
    const entry = sourceLock.importers['.'][group][name];
    assert.equal(entry.specifier, sourcePackage[group][name]);
    const path = realpathSync(base + '/node_modules/' + name);
    assert.ok(path.startsWith(base + '/node_modules/.pnpm/'));
    const version = JSON.parse(readFileSync(path + '/package.json')).version;
    assert.equal(version, entry.version.split('(')[0]);
    installed[name] = { version, resolved: entry.version };
  }
}
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
function files(root, relative = '') {
  return readdirSync(root + '/' + relative, {withFileTypes:true}).flatMap(entry => {
    const name = relative ? relative + '/' + entry.name : entry.name;
    return entry.isDirectory() ? files(root, name) : [name];
  }).sort();
}
for (const root of ['src', 'tests', 'skills', 'config', '.agents/skills']) {
  const expected = files('/source/' + root);
  assert.deepEqual(files(base + '/' + root), expected, root + ' inventory');
  for (const file of expected) assert.equal(hash(base + '/' + root + '/' + file), hash('/source/' + root + '/' + file), root + '/' + file);
}
console.log('source-copy-bytes: PASS');
console.log(JSON.stringify({ dependencyPreflight: 'PASS', freshFrozenInstall: true, installedResolvedLockEqualsSource: true, sourcePackageSha256: hash('/source/package.json'), sourceLockSha256: hash('/source/pnpm-lock.yaml'), installed }));
