import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

const repo = process.cwd();
const proof = path.dirname(fileURLToPath(import.meta.url));
const attempt = path.join(proof, process.argv[2] || 'attempt-01');
fs.mkdirSync(attempt);
const deliveryId = '20260908-05-lightweight-workflow-management';
const changeId = 'separate-manager-assets-from-target-project';
const authorRun = '.flowkit/runs/' + deliveryId + '/' + changeId + '/20260908-008-explore';
const startedAt = new Date().toISOString();
const hash = data => createHash('sha256').update(data).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const relative = p => path.relative(repo, path.resolve(p)).split(path.sep).join('/');
const ref = p => {
  const absolute = path.resolve(p), stat = fs.lstatSync(absolute);
  assert(stat.isFile() && !stat.isSymbolicLink(), p);
  assert.equal(fs.realpathSync(absolute), absolute, p);
  const bytes = fs.readFileSync(absolute);
  return { path: relative(p), bytes: bytes.length, sha256: hash(bytes) };
};
const save = (name, value) => fs.writeFileSync(path.join(attempt, name),
  JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const verified = new Map();
function check(expected) {
  assert.deepEqual(ref(expected.path), expected);
  verified.set(expected.path, expected);
}
function refsIn(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.path === 'string' && typeof value.bytes === 'number' &&
      typeof value.sha256 === 'string') check(value);
  for (const child of Object.values(value)) refsIn(child);
}
function command(label, program, args, cwd) {
  const begin = new Date().toISOString();
  const result = spawnSync(program, args, { cwd, encoding: 'buffer', timeout: 45000 });
  for (const stream of ['stdout', 'stderr']) fs.writeFileSync(path.join(attempt, label + '.' + stream + '.txt'),
    result[stream] || Buffer.alloc(0), { flag: 'wx' });
  save(label + '.command.json', { program, args, cwd, startedAt: begin,
    completedAt: new Date().toISOString(), exitCode: result.status,
    signal: result.signal, error: result.error?.message || null });
  assert.equal(result.error, undefined, label + ': ' + result.error?.message);
  assert.equal(result.status, 0, label + ': ' + result.stderr?.toString());
  return result.stdout.toString('utf8');
}

// Only synthetic inert Guidance and isolated OpenSpec roots are written.
async function reproduce(fixtureRoot) {
  const assert = (await import('node:assert/strict')).default;
  const fs = await import('node:fs/promises');
  const path = (await import('node:path')).default;
  const { pathToFileURL } = await import('node:url');
  const moduleAt = p => import(pathToFileURL(path.resolve(p)).href);
  const { resolveManagedTool } = await moduleAt('src/domain/managed-tool-resolution.ts');
  const { resolveActionGuidanceRef } = await moduleAt('src/domain/action-guidance-execution.ts');
  const { resolveDeliveryGuidanceRef, readExactDeliveryGuidance } =
    await moduleAt('src/domain/delivery-operation-execution.ts');
  const { observeOpenSpecActiveChanges } = await moduleAt('src/domain/openspec-observation.ts');
  const flowkitHome = process.env.FLOWKIT_HOME || 'C:/Users/xuser/.flowkit';
  const write = async (p, bytes) => {
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, bytes, { flag: 'wx' });
  };
  const target = path.join(fixtureRoot, 'target');
  const managers = ['manager-a', 'manager-b'].map(p => path.join(fixtureRoot, p));
  const lock = await fs.readFile('config/tools/toolchain.lock.json');
  await write(path.join(target, 'openspec/config.yaml'), 'schema: spec-driven\n');
  await fs.mkdir(path.join(target, 'openspec/changes'));
  for (const root of managers) {
    await write(path.join(root, 'config/tools/toolchain.lock.json'), lock);
    await write(path.join(root, 'skills/actions/apply/SKILL.md'), 'inert reviewer manager Action fixture\n');
    await write(path.join(root, 'skills/delivery/start/SKILL.md'), 'inert reviewer manager Delivery fixture\n');
  }
  await assert.rejects(observeOpenSpecActiveChanges({ repositoryRoot: target, flowkitHome }),
    error => error.kind === 'invalid-lock');
  assert.equal(await resolveActionGuidanceRef(target, 'apply'), null);
  assert.equal(await resolveDeliveryGuidanceRef(target, 'delivery-start'), null);
  const tool = await resolveManagedTool({ repositoryRoot: managers[0], flowkitHome, toolId: 'openspec' });
  const action = await resolveActionGuidanceRef(managers[0], 'apply');
  const delivery = await resolveDeliveryGuidanceRef(managers[0], 'delivery-start');
  assert.deepEqual(await resolveActionGuidanceRef(managers[1], 'apply'), action);
  assert.deepEqual(await resolveDeliveryGuidanceRef(managers[1], 'delivery-start'), delivery);
  assert.deepEqual(await resolveManagedTool({ repositoryRoot: managers[1], flowkitHome, toolId: 'openspec' }), tool);
  assert.equal((await readExactDeliveryGuidance(managers[1], delivery)).toString(),
    'inert reviewer manager Delivery fixture\n');
  await assert.rejects(resolveManagedTool({ repositoryRoot: managers[0],
    flowkitHome: path.join(fixtureRoot, 'missing-home'), toolId: 'openspec' }),
    error => error.kind === 'missing-runtime');
  const collision = path.join(fixtureRoot, 'collision');
  const invalidLock = JSON.parse(lock);
  invalidLock.openspec.version = '99.0.0';
  invalidLock.openspec.runtimeRoot = '$' + '{FLOWKIT_HOME}/tools/openspec/99.0.0';
  await write(path.join(collision, 'config/tools/toolchain.lock.json'), JSON.stringify(invalidLock) + '\n');
  await write(path.join(collision, 'skills/actions/apply/SKILL.md'), 'inert target Action collision\n');
  await write(path.join(collision, 'skills/delivery/start/SKILL.md'), 'inert target Delivery collision\n');
  await assert.rejects(resolveManagedTool({ repositoryRoot: collision, flowkitHome, toolId: 'openspec' }),
    error => error.kind === 'missing-runtime');
  assert.notDeepEqual(await resolveActionGuidanceRef(collision, 'apply'), action);
  assert.notDeepEqual(await resolveDeliveryGuidanceRef(collision, 'delivery-start'), delivery);
  assert.equal(await readExactDeliveryGuidance(collision, delivery), null);
  assert.equal(await readExactDeliveryGuidance(target, delivery), null);
  console.log(JSON.stringify({ tool, target, action, delivery, checks: {
    bareTargetFailure: true, targetCollision: true, relocatedAssetIdentity: true,
    exactDeliveryReadRootAndContent: true, missingRuntime: true
  }}));
}
try {
  assert.deepEqual(fs.readdirSync(authorRun).sort(), ['action.md', 'context.json', 'result.json']);
  const result = read(authorRun + '/result.json'), context = read(authorRun + '/context.json');
  assert.equal(result.status, 'terminal'); assert.equal(result.action, 'explore');
  assert.equal(result.nextBoundary, 'review-explore'); assert.equal(result.verdict, 'PASS');
  assert.equal(result.previousRunId, null);
  const manifestPath = 'openspec/delivery-groups/' + deliveryId + '.yaml';
  const manifest = YAML.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.bootstrap.mode, 'independent-bootstrap');
  assert.deepEqual(manifest.changes.filter(c => c.state === 'active').map(c => c.id), [changeId]);
  assert.equal(manifest.changes.find(c => c.id === changeId).projectOrdinal, result.projectOrdinal);
  const authority = manifest.ownerDecisions.find(d => d.ref === result.ownerActivationRef);
  assert.equal(authority.decision, 'activate-change');
  assert.equal(authority.changeId, changeId); assert.deepEqual(authority.scope, ['explore']);
  assert.equal(context.ownerActivationRef, result.ownerActivationRef);
  const priorRoot = '.flowkit/runs/' + deliveryId + '/' + result.dependencyRun;
  const prior = read(priorRoot + '/result.json');
  assert.equal(prior.action, 'archive'); assert.equal(prior.executionStatus, 'completed');
  assert(fs.statSync(prior.archivePath).isDirectory());
  assert.equal(manifest.changes.find(c => c.id === prior.changeId).state, 'completed');
  refsIn(result);
  const handoff = read(result.handoffAudit.path), summary = read(result.proofSummary.path);
  refsIn(handoff); refsIn(summary);
  refsIn(prior.runArtifacts); check(prior.handoff.priorReview); check(prior.evidence);
  for (const moved of prior.handoff.moved) check({path: moved.to, bytes: moved.bytes, sha256: moved.sha256});
  for (const p of [authorRun + '/result.json', priorRoot + '/result.json',
    'flowkit-next-delivery-change-plan.md','flowkit-next-d05-decoupling-analysis.md']) check(ref(p));
  const authorAttempt = path.dirname(result.proofSummary.path);
  for (const name of ['actual-version','actual-target-list','focused-tests']) {
    const cmd = read(path.join(authorAttempt, name + '.command.json'));
    assert.equal(cmd.exitCode, 0); assert.equal(cmd.error, null); assert.equal(cmd.signal, null);
  }
  const tap = fs.readFileSync(path.join(authorAttempt,'focused-tests.stdout.txt'),'utf8');
  for (const [key,n] of [['tests',26],['pass',26],['fail',0],['skipped',0]]) assert.match(tap,new RegExp('# '+key+' '+n+'\\r?\\n'));
  const gitHead = command('git-head', 'git', ['rev-parse','HEAD'], repo).trim();
  assert.equal(gitHead, context.sourceHead);
  assert.equal(command('git-diff-names', 'git', ['diff','--name-only'], repo).trim(), manifestPath);
  assert.equal(command('git-index-names','git',['diff','--cached','--name-only'],repo).trim(),'');
  command('git-diff-check','git',['diff','--check'],repo);
  const observed = JSON.parse(command('independent-probe', process.execPath,
    ['--import','tsx','--input-type','module','--eval',
      '(' + reproduce.toString() + ')(' + JSON.stringify(path.join(attempt,'fixture')) + ')'], repo));
  const version = command('actual-version',process.execPath,[observed.tool.entrypoint,'--version'],observed.target).trim();
  assert.equal(version, '1.10.0');
  const listing = JSON.parse(command('actual-target-list',process.execPath,
    [observed.tool.entrypoint,'list','--json'],observed.target));
  assert.equal(fs.realpathSync(listing.root.path),fs.realpathSync(observed.target));
  assert.deepEqual(listing.changes,[]);
  assert(!fs.existsSync(path.join(observed.target,'config/tools/toolchain.lock.json')));
  assert(!fs.existsSync(path.join(observed.target,'skills')));
  assert(!fs.existsSync(path.join(observed.target,'package.json')));
  for (const r of verified.values()) check(r);
  const outputs = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      const p = path.join(dir,entry.name);
      if(entry.isDirectory()) walk(p);
      else outputs.push(ref(p));
    }
  };
  walk(attempt);
  save('summary.json', { kind:'independent-review-explore-proof', reviewedRunId:result.runId,
    status:'PASS', startedAt, completedAt:new Date().toISOString(), platform:process.platform,
    node:process.version, sourceHead:gitHead, checkedInputRefs:verified.size,
    inputs:[...verified.values()], outputs, observations:observed,
    actualOpenSpec:{version,listing,rootMatches:true}, authorTestsReadback:{tests:26,pass:26,fail:0,skipped:0},
    inputsUnchanged:true, productionMutation:false,
    limits:['Bounded source/asset composition only, not installed CLI acceptance.',
      'No candidate lifecycle, product Reviewer Guidance, implementation tests or Formal Full Test invoked.',
      'Windows native proof; no Linux acceptance claim.'] });
  console.log(JSON.stringify({status:'PASS',checkedInputRefs:verified.size,checks:observed.checks,actualOpenSpec:version}));
} catch (error) {
  save('failure.json',{status:'FAIL',startedAt,failedAt:new Date().toISOString(),
    message:error.message,stack:error.stack});
  throw error;
}
