import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveRunChain, ActionContextError } from "../src/cli/current-run-chain.js";
import { requireNewManagedEvidenceBytes } from "../src/internal/managed-evidence-checkpoint.js";
import { gitBytes } from "../src/internal/git-checkpoint-scope.js";

const deliveryId = "delivery-one", changeId = "change-one";
const runId = "20260924-005-apply";
const proofPath = `.flowkit/artifacts/${deliveryId}/changes/${changeId}/proof/${runId}/proof.txt`;
const runRoot = `.flowkit/runs/${deliveryId}/001-${changeId}/${runId}`;
const bytes = Buffer.from("authentic fixture bytes\r\n");
const proofRef = { path: proofPath, bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  deliveryId, changeId, runId, purpose: "bounded-checkpoint-probe" };
function record(sequence, actionId, parent = null) {
  const occurrence = { date: "20260924", sequence, actionId };
  const id = `20260924-${String(sequence).padStart(3, "0")}-${actionId}`;
  const actionIdentity = { deliveryId, changeId, actionId };
  const reviewer = actionId.startsWith("review-");
  return { actionMarkdown: "# Fixture only\n",
    context: { runId: id, occurrence, actionIdentity,
      role: reviewer ? "reviewer" : "author", lifecycleState: "terminal",
      ownerAuthority: null, previousRunId: parent?.context.runId ?? null },
    result: { runId: id, actionIdentity,
      authorConclusion: reviewer ? null : "PASS",
      reviewerVerdict: reviewer ? "approved" : null,
      verificationVerdict: null, nextBoundary: null, facts: {} } };
}
const explore = record(1, "explore");
const reviewExplore = record(2, "review-explore", explore);
const propose = record(3, "propose", reviewExplore);
const reviewPropose = record(4, "review-propose", propose);
const apply = record(5, "apply", reviewPropose);
const prepared = { ...apply,
  context: { ...apply.context, lifecycleState: "prepared" },
  result: { ...apply.result, authorConclusion: null, nextBoundary: null,
    facts: { proofRefs: [proofRef], reason: "interrupted after proof" } } };
const prefix = [explore, reviewExplore, propose, reviewPropose];
const authority = (target) => ({ ref: `owner:${"a".repeat(64)}`,
  decision: "revise-action", deliveryId, changeId,
  sourceRef: "fixture-owner-correction", scope: [target] });
const revision = record(6, "revise-propose", prepared);
const corrected = { ...revision, context: { ...revision.context,
  ownerAuthority: authority("revise-propose") } };
const continuation = record(6, "apply", prepared);
assert.equal(resolveRunChain([...prefix, prepared]), prepared);
assert.equal(resolveRunChain([...prefix, prepared, corrected]), corrected);
assert.equal(resolveRunChain([...prefix, prepared, continuation]), continuation);
assert.throws(() => resolveRunChain([...prefix, prepared, revision]), ActionContextError);
assert.throws(() => resolveRunChain([...prefix, prepared, corrected, continuation]), ActionContextError);
assert.throws(() => resolveRunChain([...prefix, {
  ...prepared, result: { ...prepared.result, authorConclusion: "PASS" },
}, corrected]), ActionContextError);
const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-d07-f-explore-"));
let terminalAccepted = false, preparedRejection = "";
try {
  await gitBytes(root, ["init", "-b", "main"]);
  await gitBytes(root, ["config", "user.name", "Fixture"]);
  await gitBytes(root, ["config", "user.email", "fixture@example.invalid"]);
  await writeFile(path.join(root, ".gitattributes"),
    "* text=auto eol=lf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n");
  await gitBytes(root, ["add", ".gitattributes"]);
  await gitBytes(root, ["commit", "-m", "fixture-base"]);
  await mkdir(path.dirname(path.join(root, proofPath)), { recursive: true });
  await mkdir(path.join(root, runRoot), { recursive: true });
  await writeFile(path.join(root, proofPath), bytes);
  const writeOwner = async (record) => {
    await writeFile(path.join(root, runRoot, "context.json"),
      JSON.stringify(record.context) + "\n");
    await writeFile(path.join(root, runRoot, "result.json"),
      JSON.stringify(record.result) + "\n");
    await gitBytes(root, ["add", "--", proofPath,
      `${runRoot}/context.json`, `${runRoot}/result.json`]);
  };
  await writeOwner({ ...apply, result: { ...apply.result,
    facts: { proofRefs: [proofRef] } } });
  await requireNewManagedEvidenceBytes(root);
  terminalAccepted = true;
  await writeOwner(prepared);
  await assert.rejects(requireNewManagedEvidenceBytes(root), (error) => {
    preparedRejection = error.message;
    return /Managed proof Result invalid/.test(error.message);
  });
} finally {
  await rm(root, { recursive: true, force: true });
}
process.stdout.write(JSON.stringify({ fixtureOnly: true, terminalAccepted,
  canonicalPreparedSupersession: true, canonicalPreparedContinuation: true,
  canonicalPreparedTipIsNotEligible: true, illegalEdgeForkAndFakeVerdictRejected: true,
  preparedCheckpointRejection: preparedRejection }) + "\n");
