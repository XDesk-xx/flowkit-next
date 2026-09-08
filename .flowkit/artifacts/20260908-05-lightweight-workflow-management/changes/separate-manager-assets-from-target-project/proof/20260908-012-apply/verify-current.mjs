import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const capture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'capture.mjs');
const checks = [
 ['typecheck-01','node','node_modules/typescript/bin/tsc','--noEmit'],
 ['format-01','node','node_modules/prettier/bin/prettier.cjs','--check','src','tests','tsconfig.json','tsconfig.build.json','package.json','eslint.config.mjs','scripts/check-forbidden-tracked-artifacts.mjs','scripts/build-production.mjs'],
 ['lint-01','node','node_modules/eslint/bin/eslint.js','src','tests'],
 ['dependency-health-01','node','node_modules/dependency-cruiser/bin/dependency-cruise.mjs','--config','dependency-cruiser.config.mjs','--output-type','err','src','tests'],
 ['entropy-tests-01','node','--test','tests/unit/quality/production-reachability.test.mjs'],
 ['entropy-01','node','scripts/check-production-reachability.mjs'],
 ['forbidden-01','node','scripts/check-forbidden-tracked-artifacts.mjs'],
 ['diff-check-01','git','diff','--check','HEAD'],
 ['openspec-01','node',path.join(process.env.FLOWKIT_HOME,'tools/openspec/1.10.0/bin/openspec.js'),'validate','separate-manager-assets-from-target-project','--strict'],
 ['domain-03','node','--import','tsx','--test','tests/unit/domain/*.test.ts'],
];
let failed = false;
for (const check of checks) {
 const r = spawnSync(process.execPath,[capture,...check],{stdio:'inherit'});
 if (r.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
