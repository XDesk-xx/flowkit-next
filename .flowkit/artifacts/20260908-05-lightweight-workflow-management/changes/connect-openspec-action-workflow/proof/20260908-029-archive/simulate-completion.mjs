import fs from 'node:fs';
import assert from 'node:assert/strict';
assert.equal(process.cwd(), '/work/project');
const file = 'openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml';
const before = fs.readFileSync(file, 'utf8');
const pattern = /(  - id: "connect-openspec-action-workflow"[\s\S]*?    state: )active/;
assert(pattern.test(before));
fs.writeFileSync(file, before.replace(pattern, '$1completed'));
