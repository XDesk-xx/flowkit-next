set -eu
mkdir /work/project
find /source -mindepth 1 -maxdepth 1 ! -name node_modules ! -name .git ! -name .tmp ! -name dist -exec cp -a {} /work/project/ \;
cd /work/project
PNPM_CLI=/root/.cache/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs
test "$(node "$PNPM_CLI" --version)" = 11.22.0
node "$PNPM_CLI" install --frozen-lockfile --store-dir /root/.local/share/pnpm/store/v11
cmp /source/package.json package.json
cmp /source/pnpm-lock.yaml pnpm-lock.yaml
chown -R 1000:1000 /work/project
