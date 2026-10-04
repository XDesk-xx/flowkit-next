#!/bin/sh
set -eu
cd /work
git init -q
git config user.name ReviewerFixture
git config user.email reviewer@fixture.invalid
node /evidence/run-check.mjs platform sh -c 'node --version; pnpm --version; git --version; uname -m; getconf GNU_LIBC_VERSION'
node /evidence/run-check.mjs install pnpm install --frozen-lockfile
node /evidence/run-check.mjs typecheck pnpm typecheck
node /evidence/run-check.mjs build pnpm build
node /evidence/run-check.mjs boundary-probes node --import tsx /evidence/boundary-probes.mjs
node /evidence/run-check.mjs domain node --import tsx --test --test-concurrency=4 tests/unit/domain/*.test.ts
