set -eu
mkdir -p /work/project
cd /work/project
cp /source/package.json /source/pnpm-lock.yaml /source/pnpm-workspace.yaml /source/tsconfig.json /source/tsconfig.build.json /source/eslint.config.mjs /source/dependency-cruiser.config.mjs /source/.gitattributes .
cp -a /source/src /source/tests /source/skills /source/config /source/scripts /source/openspec /source/.agents /source/AGENTS.md .
mkdir .flowkit
cp -a /source/.flowkit/runs /source/.flowkit/project.json /source/.flowkit/memos.json .flowkit/
PNPM=/root/.cache/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs
node --version
getconf GNU_LIBC_VERSION
node "$PNPM" --version
node "$PNPM" install --offline --frozen-lockfile --store-dir /root/.local/share/pnpm/store/v11
node scripts/build-production.mjs
node node_modules/typescript/bin/tsc --noEmit
chown -R 1000:1000 /work
runuser -u node -- node --import tsx --test tests/unit/domain/*.test.ts
runuser -u node -- env FLOWKIT_HOME=/runtime FLOWKIT_ACCEPTANCE_INSTALLATION=/work/project node --import tsx --test tests/acceptance/foundation-manager.acceptance.test.ts
