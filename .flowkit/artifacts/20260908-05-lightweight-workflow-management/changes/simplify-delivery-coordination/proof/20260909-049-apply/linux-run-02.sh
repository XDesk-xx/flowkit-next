#!/bin/sh
set -eu
node /evidence/linux-prepare-02.mjs
cd /work/project
node /evidence/verify.mjs linux-dependencies-02 node /root/.cache/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs install --offline --frozen-lockfile --store-dir /store
chown -R node:node /work
su node -s /bin/sh -c 'node /evidence/candidate-checks.mjs linux-current'
