// Non-production proof of explicit filesystem scope; not a proposed public schema.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const repo = process.cwd();
const root = await fs.mkdtemp(path.join(repo, '.tmp', 'd05-030-scope-'));
const { invokeDeliveryFullTestOperation } = await import(pathToFileURL(path.join(repo, 'src/domain/delivery-full-test-execution.ts')));
const declared = ['src', 'tests', 'package.json'];
const put = async (p, s) => { await fs.mkdir(path.dirname(path.join(root,p)),{recursive:true}); await fs.writeFile(path.join(root,p),s); };
await put('src/code.js', 'product\n');
await put('tests/check.js', 'test\n');
await put('package.json', '{}\n');
async function files(p) {
  const s = await fs.lstat(path.join(root,p));
  assert(!s.isSymbolicLink(), 'proof bounds: regular directories/files only');
  if(s.isDirectory()) return (await Promise.all((await fs.readdir(path.join(root,p))).sort().map(x=>files(p+'/'+x)))).flat();
  assert(s.isFile()); return [p];
}
async function snapshot() {
  const paths=(await Promise.all(declared.map(files))).flat().sort();
  const h=createHash('sha256');
  for(const p of paths) h.update(p).update(await fs.readFile(path.join(root,p)));
  return {paths,digest:h.digest('hex')};
}
const initial=await snapshot();
await put('.gitignore','src/\n');
await put('.flowkit/artifacts/proof/stdout.txt','observation  \r\n');
await put('architecture/diagram.json','{}\n');
assert.deepEqual(await snapshot(),initial);
await put('src/code.js','changed product\n');
const changed=await snapshot();assert.notEqual(initial.digest,changed.digest);
// Current API rejects a plain project before checks, independently of a first commit.
const deliveryId='synthetic-scope-probe';
const noGit=await invokeDeliveryFullTestOperation(root,{
 deliveryId,ownerAuthority:{ref:'owner:'+'b'.repeat(64),decision:'authorize-formal-full-test',deliveryId,sourceRef:'fixture:synthetic',scope:['delivery-full-test']},
 checks:[{checkId:'probe',program:process.execPath,args:['-e','process.exit(0)'],configRefs:[],toolRefs:[],environmentRefs:[]}]
});
assert.equal(noGit.status,'failed');assert.equal(noGit.reason,'package-formation-rejected');
console.log(JSON.stringify({kind:'bounded Explore feasibility, not implementation acceptance',root,initial,changed,
 ignoreAndArtifactChangesDoNotAffectExplicitScope:true,ignoredProductChangeDetected:true,noGit,
 limitation:'Only declared regular inputs are modeled; excludes/pattern syntax, actual configured commands and durable attempt writer require Proposal/Apply.'},null,2));
