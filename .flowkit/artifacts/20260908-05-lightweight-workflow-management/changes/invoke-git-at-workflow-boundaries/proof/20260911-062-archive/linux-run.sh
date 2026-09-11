#!/bin/sh
set -eu
node /evidence/linux-prepare.mjs
cd /work/project
node /root/.cache/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs install --offline --frozen-lockfile --store-dir /store
chown -R node:node /work
su node -s /bin/sh -c 'node /evidence/verify-converged.mjs'
