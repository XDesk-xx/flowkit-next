#!/bin/sh
set -eu
cd /work
node /evidence/run-check.mjs linux-typecheck pnpm typecheck
node /evidence/run-check.mjs linux-build pnpm build
node /evidence/run-check.mjs linux-openspec-install npm install --prefix /work/revision-tools --no-audit --no-fund @fission-ai/openspec@1.10.0
mkdir -p /work/revision-home/tools/openspec
cp -a /work/revision-tools/node_modules/@fission-ai/openspec /work/revision-home/tools/openspec/1.10.0
cp -a /work/revision-tools/node_modules /work/revision-home/tools/openspec/1.10.0/node_modules
export FLOWKIT_HOME=/work/revision-home
node /evidence/run-check.mjs linux-openspec-version node /work/revision-home/tools/openspec/1.10.0/bin/openspec.js --version
node /evidence/run-check.mjs linux-acceptance node --import tsx --test tests/acceptance/git-host.acceptance.test.ts tests/acceptance/foundation-manager.acceptance.test.ts
export FLOWKIT_NATIVE_ARCHIVE_ACCEPTANCE=1
export FLOWKIT_NATIVE_ARCHIVE_EVIDENCE=/evidence/linux-native-materials
node /evidence/run-check.mjs linux-native-archive node --import tsx --test /evidence/native-linux.test.mts
