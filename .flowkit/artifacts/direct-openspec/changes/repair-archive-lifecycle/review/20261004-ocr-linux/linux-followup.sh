#!/bin/sh
set -eu
cd /work
node /evidence/run-check.mjs linux-domain-nonroot node --import tsx --test --test-concurrency=4 tests/unit/domain/*.test.ts
node /evidence/run-check.mjs linux-exact-tool-install npm install --prefix /work/review-tools --no-audit --no-fund @fission-ai/openspec@1.10.0
mkdir -p /work/review-home/tools/openspec
ln -s /work/review-tools/node_modules/@fission-ai/openspec /work/review-home/tools/openspec/1.10.0
export FLOWKIT_HOME=/work/review-home
node /evidence/run-check.mjs linux-acceptance node --import tsx --test tests/acceptance/git-host.acceptance.test.ts tests/acceptance/foundation-manager.acceptance.test.ts
