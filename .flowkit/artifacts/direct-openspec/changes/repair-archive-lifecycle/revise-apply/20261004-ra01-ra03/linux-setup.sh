#!/bin/sh
set -eu
node /evidence/run-check.mjs linux-git-setup sh -c 'apt-get update && apt-get install -y --no-install-recommends git ca-certificates && corepack enable && corepack prepare pnpm@11.22.0 --activate'
mkdir -p /work
cp -a /snapshot/. /work/
chown -R node:node /work
chmod -R u+rwX /work
cd /work
git init -q
git config user.name AuthorFixture
git config user.email author@fixture.invalid
chown -R node:node /work/.git
