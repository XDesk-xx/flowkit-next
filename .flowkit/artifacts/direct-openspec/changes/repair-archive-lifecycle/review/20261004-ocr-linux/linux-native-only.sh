#!/bin/sh
set -eu
cd /work
unlink /work/review-home/tools/openspec/1.10.0
cp -a /work/review-tools/node_modules/@fission-ai/openspec /work/review-home/tools/openspec/1.10.0
cp -a /work/review-tools/node_modules /work/review-home/tools/openspec/1.10.0/node_modules
export FLOWKIT_HOME=/work/review-home
export FLOWKIT_NATIVE_ARCHIVE_ACCEPTANCE=1
export FLOWKIT_NATIVE_ARCHIVE_EVIDENCE=/evidence/linux-native-materials
node /evidence/run-check.mjs linux-native-archive-esm node --import tsx --test /evidence/native-linux.test.mts
