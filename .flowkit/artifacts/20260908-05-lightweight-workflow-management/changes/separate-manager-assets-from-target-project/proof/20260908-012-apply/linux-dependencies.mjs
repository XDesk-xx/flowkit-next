import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
const { parse } = createRequire('/work/project/package.json')('yaml');
const manifest = JSON.parse(readFileSync('/source/package.json'));
const lock = parse(readFileSync('/source/pnpm-lock.yaml','utf8'));
assert.deepEqual(parse(readFileSync('/work/project/node_modules/.pnpm/lock.yaml','utf8')),lock);
for (const group of ['dependencies','devDependencies']) for (const [name,specifier] of Object.entries(manifest[group])) {
 const entry=lock.importers['.'][group][name];
 assert.equal(entry.specifier,specifier);
 const location=realpathSync('/work/project/node_modules/'+name);
 assert.ok(location.startsWith('/work/project/node_modules/.pnpm/'));
 assert.equal(JSON.parse(readFileSync(location+'/package.json')).version,entry.version.split('(')[0]);
}
console.log('Fresh offline frozen Linux dependency graph matches current package and lock');
