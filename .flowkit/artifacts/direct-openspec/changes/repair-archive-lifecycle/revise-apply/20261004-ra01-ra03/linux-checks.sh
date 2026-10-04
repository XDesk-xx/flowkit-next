#!/bin/sh
set -eu
cd /work
node /evidence/run-check.mjs linux-install pnpm install --frozen-lockfile
node /evidence/run-check.mjs linux-platform sh -c 'node --version && pnpm --version && git --version && uname -m && getconf GNU_LIBC_VERSION'
node /evidence/run-check.mjs linux-focused node --import tsx --test --test-concurrency=4 tests/unit/domain/git-eol-checkpoint.test.ts tests/unit/domain/candidate-git-projection.test.ts tests/unit/domain/archive-date-continuation.test.ts tests/unit/domain/action-archive-cli.test.ts
node /evidence/run-check.mjs linux-domain node --import tsx --test --test-concurrency=4 tests/unit/domain/*.test.ts
