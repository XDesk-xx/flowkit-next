import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import readline from 'node:readline';

// Transport feasibility only: no canonical Action/Review or product implementation.
const root = path.dirname(fileURLToPath(import.meta.url));
const inputPath = 'openspec/changes/connect-openspec-action-workflow/.openspec.yaml';
const hash = b => createHash('sha256').update(b).digest('hex');
const bytes = await fs.readFile(inputPath);
const request = { kind: 'explore-host-transport-probe', role: 'author',
  task: 'Read the exact OpenSpec scaffold through the existing host and return its schema, date and sha256.',
  inputPath, expectedSchema: 'spec-driven', canonicalAction: false,
  ownerBoundary: 'Explore experiment only; no model launch, Review, implementation or automatic next' };
await fs.writeFile(path.join(root, 'host-request.json'), JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(request));
console.log('Waiting for the current host response on stdin; EOF or malformed response is not success.');
const lines = readline.createInterface({ input: process.stdin });
let received = false;
for await (const line of lines) {
  const response = JSON.parse(line);
  assert.equal(response.inputPath, inputPath);
  assert.equal(response.schema, 'spec-driven');
  assert.equal(response.sha256, hash(bytes));
  assert.match(bytes.toString(), new RegExp(`created: ${response.created}`));
  await fs.writeFile(path.join(root, 'host-response.json'), JSON.stringify(response, null, 2) + '\n', { flag: 'wx' });
  await fs.writeFile(path.join(root, 'host-summary.json'), JSON.stringify({
    status: 'PASS', completedAt: new Date().toISOString(), actualHost: 'current interactive Agent/terminal session',
    requestCount: 1, responseCount: 1, nextInvocations: 0, inputSha256: hash(bytes),
    meaning: 'Actual live-process request/read/response transport; not a canonical Action or two-Change acceptance',
  }, null, 2) + '\n', { flag: 'wx' });
  console.log('Transport probe completed; STOP. No Action was admitted.');
  received = true;
  break;
}
lines.close();
assert.ok(received, 'Missing host response');
process.exit(0);
