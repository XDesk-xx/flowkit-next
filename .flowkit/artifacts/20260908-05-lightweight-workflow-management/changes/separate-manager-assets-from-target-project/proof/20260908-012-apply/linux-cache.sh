set -eu
mkdir -p /work/project /work/manager-a
cp /source/package.json /source/pnpm-lock.yaml /source/pnpm-workspace.yaml /work/project/
cd /work/project
PNPM=/root/.cache/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs
node "$PNPM" install --frozen-lockfile --store-dir /root/.local/share/pnpm/store/v11
tar -xzf /source/.tmp/d05-012-package/flowkit-next-0.1.0.tgz -C /work/manager-a --strip-components=1
cd /work/manager-a
node "$PNPM" install --prod --ignore-scripts --store-dir /root/.local/share/pnpm/store/v11
