set -eu
mkdir -p /runtime/tools/openspec/1.10.0
cp -a node_modules /runtime/node_modules
cp -a /runtime/node_modules/.pnpm/@fission-ai+openspec@1.10.0/node_modules/@fission-ai/openspec/. /runtime/tools/openspec/1.10.0/
mkdir -p /runtime/tools/openspec/1.10.0/node_modules
for dependency in /runtime/node_modules/.pnpm/@fission-ai+openspec@1.10.0/node_modules/*; do
  ln -s "$dependency" /runtime/tools/openspec/1.10.0/node_modules/
done
node /runtime/tools/openspec/1.10.0/bin/openspec.js --version
