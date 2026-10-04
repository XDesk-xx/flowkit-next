set -eu
mkdir -p /work
cp -a /snapshot/. /work/
cd /work
node /evidence/run-check.mjs linux-tooling sh -c 'apt-get update && apt-get install -y --no-install-recommends git ca-certificates && corepack enable && corepack prepare pnpm@11.22.0 --activate'
git init -q
git config user.name ReviewerFixture
git config user.email reviewer@fixture.invalid
node /evidence/run-check.mjs linux-install pnpm install --frozen-lockfile
node /evidence/run-check.mjs linux-typecheck pnpm typecheck
node /evidence/run-check.mjs linux-build pnpm build
node /evidence/run-check.mjs linux-domain node --import tsx --test --test-concurrency=4 tests/unit/domain/*.test.ts
node /evidence/run-check.mjs linux-acceptance node --import tsx --test tests/acceptance/git-host.acceptance.test.ts tests/acceptance/foundation-manager.acceptance.test.ts
