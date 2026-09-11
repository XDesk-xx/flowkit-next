import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
function run(program,args,cwd='/work'){
  const r=spawnSync(program,args,{cwd,env:process.env,stdio:'inherit'});
  assert.equal(r.status,0,`${program} ${args.join(' ')}`);
}
fs.mkdirSync('/work');
const deps='/build/flowkit-next-dependency-environment/node_modules';
const yaml=fs.realpathSync(deps+'/yaml');
run('npm',['pack',yaml,'--pack-destination','/work']);
const tgz=fs.readdirSync('/work').find(n=>n.startsWith('yaml-')&&n.endsWith('.tgz'));
run('npm',['install','--prefix','/work/install','--offline','--omit=dev','--no-audit','--no-fund','/repo/.tmp/onboarding-039-pack-final/flowkit-next-0.1.0.tgz','/work/'+tgz]);
const manager='/work/install/node_modules/flowkit-next';
for(const p of ['README.md','docs/onboarding.md'])assert(fs.readFileSync(manager+'/'+p).equals(fs.readFileSync('/repo/'+p)));
fs.mkdirSync('/work/testbed');
for(const p of ['tests','src','docs','README.md','package.json','tsconfig.json','skills','config/tools']){
  fs.cpSync('/repo/'+p,'/work/testbed/'+p,{recursive:true});
}
fs.symlinkSync(deps,'/work/testbed/node_modules','dir');
process.env.FLOWKIT_HOME='/tool-home';
process.env.FLOWKIT_ACCEPTANCE_INSTALLATION=manager;
run('node',['--import','tsx','--test','tests/unit/domain/project-onboarding.test.ts','tests/acceptance/foundation-manager.acceptance.test.ts'],'/work/testbed');
console.log(JSON.stringify({platform:process.platform,node:process.version,actualPackageInstalled:true,docsEqual:true,regression:'passed',freshAgentSession:false}));
