#!/bin/sh
set -eu
mkdir -p /work
cp -a /snapshot/. /work/
cd /work
node /evidence/run-check.mjs tooling sh -c 'apt-get update && apt-get install -y --no-install-recommends git ca-certificates && corepack enable && corepack prepare pnpm@11.22.0 --activate'
chown -R node:node /work
su -s /bin/sh node /evidence/linux-checks.sh
