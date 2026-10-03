#!/bin/sh
set -eu
apt-get update
apt-get install -y --no-install-recommends git ca-certificates
npm install --global pnpm@11.22.0 --ignore-scripts
mkdir -p /candidate /flowkit-home/tools/openspec/1.10.0 /tool-install
npm install --prefix /tool-install @fission-ai/openspec@1.10.0 --ignore-scripts
cp -a /tool-install/node_modules/@fission-ai/openspec/. /flowkit-home/tools/openspec/1.10.0/
ln -s /tool-install/node_modules /flowkit-home/tools/openspec/1.10.0/node_modules
tar -C /source --exclude=.git --exclude=.flowkit --exclude=.tmp --exclude=node_modules --exclude=dist --exclude=architecture --exclude=.agents --exclude=.codebuddy --exclude='.tmp-*' -cf - . | tar -C /candidate -xf -
chown -R node:node /candidate
node --version
pnpm --version
node /flowkit-home/tools/openspec/1.10.0/bin/openspec.js --version
git --version
