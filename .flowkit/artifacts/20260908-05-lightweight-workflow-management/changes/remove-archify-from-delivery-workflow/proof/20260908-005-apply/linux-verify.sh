set -eu
cd /work/project
PNPM_CLI=/root/.cache/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs
node "$PNPM_CLI" install --offline --frozen-lockfile --store-dir /root/.local/share/pnpm/store/v11
cmp /source/package.json package.json
cmp /source/pnpm-lock.yaml pnpm-lock.yaml
node /source/.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-005-apply/linux-dependencies.cjs
chown -R 1000:1000 /work/project
runuser -u node -- sh -c 'node --version; id; getconf GNU_LIBC_VERSION'
test ! -e /flowkit-home/tools/archify
runuser -u node -- node /flowkit-home/tools/openspec/1.10.0/bin/openspec.js --version
runuser -u node -- node ./node_modules/typescript/bin/tsc -p tsconfig.build.json
runuser -u node -- node --import tsx --test tests/unit/domain/*.test.ts
runuser -u node -- node --import tsx --test tests/acceptance/*.test.ts
