// Derive a distinct downstream reproduction without overwriting the first probe.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const source = await readFile(path.join(import.meta.dirname, 'probe.mjs'), 'utf8');
const downstream = source
  .replace("['approved', 'changes-requested', 'rejected']", "['approved', 'rejected']")
  .replace('[false, true]', '[false]')
  .replace("'probe-results.json'", "'downstream-results.json'")
  .replace('const after = await runMaterialLocation', `
      try {
        observation.downstream = await f.call('action start', {
          ...f.base, role: 'author', actionId: verdict === 'approved' ? 'archive' : 'revise-apply',
          ...(verdict === 'approved' ? { applicableChecks: [{ id: 'test:domain', reason: 'synthetic downstream reproduction' }] } : { ownerAuthority: { ref: 'owner:' + 'd'.repeat(64), decision: 'revise-action', deliveryId: 'delivery-one', changeId: 'change-one', scope: ['revise-apply'], sourceRef: 'synthetic:reviewer-downstream-probe' } }),
        });
      } catch (error) { observation.downstream = { error: error.stdout || error.message }; }
      const after = await runMaterialLocation`);
const file = path.join(import.meta.dirname, 'downstream-derived.mjs');
await writeFile(file, downstream, { flag: 'wx' });
await import('./downstream-derived.mjs');
