#!/bin/sh
set -eu
node /evidence/linux-prepare.mjs
cd /work/project
node /root/.cache/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs install --offline --frozen-lockfile --store-dir /store > "$EVIDENCE_DIR/linux-dependencies.stdout.txt" 2> "$EVIDENCE_DIR/linux-dependencies.stderr.txt"
chown -R node:node /work
su node -s /bin/sh -c 'node scripts/build-production.mjs && node /evidence/linux-fixture.mjs'
