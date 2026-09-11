import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const proof = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const scratch = await fs.mkdtemp(path.join(root, ".tmp/d05-060-pack/example-"));
const target = path.join(scratch, "target 项目");
const unpack = path.join(scratch, "unpacked");
const manager = path.join(scratch, "manager relocated");
const remote = path.join(scratch, "remote.git");
const commands = [];
async function command(program, args, cwd) {
  const result = spawnSync(program, args, { cwd, encoding: "buffer", windowsHide: true });
  const number = String(commands.length + 1).padStart(2, "0");
  for (const stream of ["stdout", "stderr"]) await fs.writeFile(path.join(proof, `example-${number}.${stream}.txt`), result[stream] ?? Buffer.alloc(0), { flag: "wx" });
  commands.push({ program, args, cwd, exitCode: result.status, signal: result.signal });
  assert.equal(result.status, 0, result.stderr?.toString());
  return result.stdout.toString("utf8").trim();
}
const git = (...args) => command("git", args, target);
await fs.mkdir(unpack);
await fs.mkdir(target);
await fs.mkdir(remote);
const archive = path.join(root, ".tmp/d05-060-pack/flowkit-next-0.1.0.tgz");
await command("tar", ["-xf", archive, "-C", unpack], root);
await fs.rename(path.join(unpack, "package"), manager);
await fs.cp(path.dirname(createRequire(path.join(root, "package.json")).resolve("yaml/package.json")), path.join(manager, "node_modules/yaml"), { recursive: true, dereference: true });
const reference = "skills/delivery/repository-integration/references/git-host.mjs";
const host = await import(pathToFileURL(path.join(manager, reference)).href);
assert.deepEqual(Object.keys(host).sort(), ["runCheckpoint", "runIntegration", "runPush"]);
await assert.rejects(fs.stat(path.join(target, ".git")), { code: "ENOENT" });
await git("init", "-b", "main");
await git("config", "user.name", "Flowkit bounded Apply example");
await git("config", "user.email", "fixture@example.invalid");
await fs.writeFile(path.join(target, "说明.txt"), "first\n");
await fs.writeFile(path.join(target, "unrelated.txt"), "preserve\n");
const contextPath = ".flowkit/runs/20260908-05-lightweight-workflow-management/006-invoke-git-at-workflow-boundaries/20260911-060-revise-apply/context.json";
const sourceRef = contextPath + "#ownerInstruction";
const contextBytes = await fs.readFile(path.join(root, contextPath));
assert.equal(JSON.parse(contextBytes).ownerInstruction, "根据最新run，revise apply");
// Real Owner Apply instruction authorizes the approved bounded test job, NOT D05 Git or independent Review.
// These exact disposable targets/operations are the Author's implementation of approved task 5.1.
let job;
const handoffs = [];
async function readOwner(source) {
  assert.equal(source, sourceRef);
  assert.deepEqual(await fs.readFile(path.join(root, contextPath)), contextBytes);
  return job;
}
function authorizeTestJob(request, checkpointAuthorization) {
  assert.equal(request.targetRoot, target);
  job = { request: structuredClone(request), ...(checkpointAuthorization ? { checkpointAuthorization } : {}) };
  handoffs.push({ request: structuredClone(request), sourceRef, scope: "approved Apply task 5.1 disposable Git example", syntheticEvaluatorFact: !!checkpointAuthorization });
}
const base = { targetRoot: target, node: "delivery-start", deliveryId: "bounded-example", changeId: null, ownerSourceRef: sourceRef, expectedBranch: "main" };
const firstRequest = { ...base, operation: { kind: "create-new", paths: ["说明.txt"], commitMessage: "first scoped fixture", commitShape: null } };
authorizeTestJob(firstRequest);
const first = await host.runCheckpoint(firstRequest, readOwner);
assert.equal(first.status, "completed", JSON.stringify(first));
assert.equal(await git("rev-parse", "HEAD"), first.observed.checkpointCommit);
await fs.writeFile(path.join(target, "说明.txt"), "change\n");
const nextRequest = { ...base, node: "change-checkpoint", changeId: "bounded-change", operation: { ...firstRequest.operation, commitMessage: "change(bounded-change): scoped fixture" } };
authorizeTestJob(nextRequest, { policyDecision: { kind: "ready-checkpoint-evaluation" }, deliveryId: base.deliveryId, changeId: nextRequest.changeId,
  ownerAuthority: { ref: "owner:" + "b".repeat(64), decision: "authorize-checkpoint", deliveryId: base.deliveryId, changeId: nextRequest.changeId, sourceRef, scope: ["checkpoint"] } });
const change = await host.runCheckpoint(nextRequest, readOwner);
assert.equal(change.status, "completed", JSON.stringify(change));
await command("git", ["init", "--bare"], remote);
await git("remote", "add", "origin", remote);
const pushRequest = { ...base, operation: { kind: "push", localCommit: change.observed.checkpointCommit, remote: "origin", targetRef: "refs/heads/main" } };
authorizeTestJob(pushRequest);
const push = await host.runPush(pushRequest, readOwner);
assert.equal(push.status, "completed", JSON.stringify(push));
assert.equal(push.observed.remoteCommit, await command("git", ["rev-parse", "refs/heads/main"], remote));
await git("add", "--", "unrelated.txt");
const reuseRequest = { ...base, operation: { kind: "reuse-existing", checkpointCommit: change.observed.checkpointCommit } };
authorizeTestJob(reuseRequest);
const reuse = await host.runCheckpoint(reuseRequest, readOwner);
assert.equal(reuse.status, "completed");
assert.equal(await git("diff", "--cached", "--name-only"), "unrelated.txt");
await assert.rejects(fs.stat(path.join(target, "skills")), { code: "ENOENT" });
const domain = await import(pathToFileURL(path.join(manager, "dist/domain/index.js")).href);
const yaml = createRequire(path.join(manager, "package.json"))("yaml");
const links = { projectId: "bounded-example", deliveryId: base.deliveryId, ownerAuthorityRef: "owner:" + "c".repeat(64), sourceRef: "test:synthetic-final",
  fullTestAttempt: "12345678-1234-4123-8123-123456789abc", verifiedCandidateRef: "full-test-input:sha256:" + "d".repeat(64), fullTestExecutionRef: "full-test-execution:sha256:" + "e".repeat(64) };
const { projectId, deliveryId, ...finalLinks } = links;
await fs.mkdir(path.join(target, ".flowkit"));
await fs.writeFile(path.join(target, ".flowkit/project.json"), JSON.stringify({ projectId }) + "\n");
await fs.mkdir(path.join(target, "openspec/delivery-groups"), { recursive: true });
await fs.writeFile(path.join(target, `openspec/delivery-groups/${deliveryId}.yaml`), yaml.stringify({ id: deliveryId,
  delivery: { state: "completed", fullTestStatus: "passed", fullTestAttempt: links.fullTestAttempt, finalizationStatus: "completed" },
  finalization: { state: "completed", ...finalLinks, confirmationRef: domain.deriveDeliveryFinalizationRef(links) } }));
const pendingRequest = { ...reuseRequest, node: "repository-integration" };
authorizeTestJob(pendingRequest);
const ownerAuthority = { ref: "owner:" + "f".repeat(64), decision: "authorize-repository-integration", deliveryId, sourceRef, scope: ["delivery-repository-integration"] };
const commit = change.observed.checkpointCommit;
const pending = await host.runIntegration(pendingRequest, { input: { deliveryId, ownerAuthority, deliveryBranch: "main", targetMainRef: "refs/heads/main", acceptedBaseCommit: first.observed.checkpointCommit, checkpointOperation: pendingRequest.operation }, readOwner,
  readIntegrationSource: { readAuthorization: () => ({ sourceRef: "test:synthetic-integration-source", ownerAuthorityRef: ownerAuthority.ref, ownerAuthoritySourceRef: sourceRef,
    deliveryId, deliveryBranch: "main", targetMainRef: "refs/heads/main", targetMainPreIntegrationCommit: commit, preIntegrationHead: commit,
    acceptedBaseCommit: first.observed.checkpointCommit, checkpointOperation: pendingRequest.operation, reuseCheckpointSourceRef: sourceRef }), readAcceptance: () => { throw Error("No actual acceptance; never called"); } } });
assert.equal(pending.status, "incomplete", JSON.stringify(pending));
assert.equal(pending.phase, "acceptance");
assert.equal(pending.observed.checkpointCommit, commit);
assert.equal(await git("rev-parse", "HEAD"), commit);
assert.equal(await fs.readFile(path.join(target, "unrelated.txt"), "utf8"), "preserve\n");
const archiveBytes = await fs.readFile(archive);
const report = { status: "passed", ownerInput: { sourceRef, text: JSON.parse(contextBytes).ownerInstruction }, handoffs,
  installation: { manager, reference, archiveSha256: createHash("sha256").update(archiveBytes).digest("hex") }, target,
  first, change, push, reuse, pending, commands,
  limits: ["Real current-build host and native Git under approved Apply test scope, not current repository Git authorization", "Evaluator authority/Final/source are explicitly synthetic fixture contracts, not real independent Review or Full Test", "Local bare remote is not public PR acceptance; pending remains incomplete", "Scratch installation, repositories and tarball are disposable .tmp; this report and raw streams are retained target evidence"] };
await fs.writeFile(path.join(proof, "packed-example.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(report));
