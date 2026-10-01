import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
assert.equal(path.resolve(root).toLowerCase(), 'd:\\projects\\flowkit-next');
const scratch = path.join(root, '.tmp', 'd07-version-068-GkVRgY');
const proof = path.join(root, '.flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/pin-bootstrap-manager-version-1-0-0/proof/20261001-068-explore');
const configPath = path.join(scratch, 'config/verification/full-test.json');
const docsPath = path.join(scratch, 'docs/onboarding.md');
const configBytes = await readFile(configPath);
const docsBytes = await readFile(docsPath);
const { readFullTestInput } = await import(pathToFileURL(path.join(root, 'src/internal/full-test-input.ts')).href);
let baseline, withoutDocsAfterDrift, withDocs, withDocsAfterDrift;
try {
  baseline = await readFullTestInput(scratch);
  assert.equal(baseline.files.includes('docs/onboarding.md'), false);
  await writeFile(docsPath, Buffer.concat([docsBytes, Buffer.from('\nEXPLORATORY_DOC_DRIFT\n')]));
  withoutDocsAfterDrift = await readFullTestInput(scratch);
  assert.equal(withoutDocsAfterDrift.inputRef, baseline.inputRef);
  await writeFile(docsPath, docsBytes);
  const config = JSON.parse(configBytes.toString('utf8'));
  assert.equal(config.inputs.includes('docs/onboarding.md'), false);
  config.inputs.push('docs/onboarding.md');
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  withDocs = await readFullTestInput(scratch);
  assert.equal(withDocs.files.includes('docs/onboarding.md'), true);
  await writeFile(docsPath, Buffer.concat([docsBytes, Buffer.from('\nEXPLORATORY_DOC_DRIFT\n')]));
  withDocsAfterDrift = await readFullTestInput(scratch);
  assert.notEqual(withDocsAfterDrift.inputRef, withDocs.inputRef);
} finally {
  await writeFile(configPath, configBytes);
  await writeFile(docsPath, docsBytes);
}
const report = {
  kind: 'd07-version-1-0-0-full-test-input-probe',
  scratch,
  baselineInputRef: baseline.inputRef,
  baselineSelectsOnboarding: baseline.files.includes('docs/onboarding.md'),
  currentConfigIgnoresOnboardingDrift: withoutDocsAfterDrift.inputRef === baseline.inputRef,
  selectedInputRef: withDocs.inputRef,
  selectedInputIncludesOnboarding: withDocs.files.includes('docs/onboarding.md'),
  selectedConfigDetectsOnboardingDrift: withDocsAfterDrift.inputRef !== withDocs.inputRef,
  limitation: 'Controlled input-identity probe only; no Formal Full Test attempt was executed.'
};
await writeFile(path.join(proof, 'full-test-input-report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
process.stdout.write(JSON.stringify({ currentIgnoresDrift: report.currentConfigIgnoresOnboardingDrift,
  selectedDetectsDrift: report.selectedConfigDetectsOnboardingDrift }) + '\n');
