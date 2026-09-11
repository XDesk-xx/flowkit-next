set -eu
mkdir -p /work/project /work/manager-a
cd /work/project
cp /source/package.json /source/pnpm-lock.yaml /source/pnpm-workspace.yaml /source/tsconfig.json /source/tsconfig.build.json /source/eslint.config.mjs /source/dependency-cruiser.config.mjs .
cp -a /source/src /source/tests /source/skills /source/config /source/scripts .
cp -a /source/openspec /source/.agents /source/AGENTS.md .
mkdir .flowkit
cp -a /source/.flowkit/runs /source/.flowkit/project.json /source/.flowkit/memos.json .flowkit/
PNPM=/root/.cache/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs
node --version
getconf GNU_LIBC_VERSION
node "$PNPM" --version
node "$PNPM" install --offline --frozen-lockfile --store-dir /root/.local/share/pnpm/store/v11
node /source/.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/separate-manager-assets-from-target-project/proof/20260908-012-apply/linux-dependencies.mjs
node scripts/build-production.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/prettier/bin/prettier.cjs --check src tests package.json
node node_modules/eslint/bin/eslint.js src tests
node node_modules/dependency-cruiser/bin/dependency-cruise.mjs --config dependency-cruiser.config.mjs --output-type err src tests
node scripts/check-production-reachability.mjs
tar -xzf /source/.tmp/d05-012-package/flowkit-next-0.1.0.tgz -C /work/manager-a --strip-components=1
cd /work/manager-a
node "$PNPM" install --prod --offline --ignore-scripts --store-dir /root/.local/share/pnpm/store/v11
node -e 'const fs=require("fs"); console.log(fs.readdirSync("node_modules")); if(fs.existsSync("node_modules/tsx"))throw Error("unexpected dev dependency")'
cd /work/project
chown -R 1000:1000 /work
runuser -u node -- node --import tsx --test tests/unit/domain/*.test.ts
runuser -u node -- env FLOWKIT_HOME=/runtime FLOWKIT_ACCEPTANCE_INSTALLATION=/work/manager-a node --import tsx --test tests/acceptance/*.test.ts
