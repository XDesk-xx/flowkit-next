import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const domain = await import(pathToFileURL(path.resolve("dist/domain/index.js")));
const held = JSON.parse(await readFile(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-025-apply/example-held.json", "utf8"));
const markdown = await readFile("skills/actions/explore/SKILL.md", "utf8");
assert.equal(createHash("sha256").update(Buffer.from(markdown)).digest("hex"), held.actionPackage.guidanceRef.contentSha256);
const source = [...markdown.matchAll(/```js\r?\n(\/\/ agent-[\s\S]*?)```/g)].map(m => m[1]).join("\n");
const how = await import("data:text/javascript;base64," + Buffer.from(source + "\nexport {finishRecord,checkProof};").toString("base64"));
const identity = { deliveryId: "example-delivery", changeId: "describe-greeting", runId: held.actionPackage.runId };
const prefix = `.flowkit/artifacts/${identity.deliveryId}/changes/${identity.changeId}/proof/${identity.runId}/`;
const proofRefs = [];
for (const name of ["inspect.mjs", "observation.json", "stdout.txt", "stderr.txt", "conclusion.md"]) {
  const bytes = await readFile(path.join(held.input.repositoryRoot, prefix, name));
  const ref = { ...identity, path: prefix + name, bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"), purpose: "actual bounded Explore observation" };
  assert.deepEqual(await how.checkProof(held.input.repositoryRoot, ref, identity), bytes);
  proofRefs.push(ref);
}
assert.equal(new Set(proofRefs.map(ref => ref.path)).size, proofRefs.length);
const observed = JSON.parse(await readFile(path.join(held.input.repositoryRoot, prefix, "observation.json"), "utf8"));
assert.equal(observed.exitCode, 0);
assert.equal(observed.nullInput, "TypeError");
assert.deepEqual(observed.cases.map(row => row.actual), ["Hello, Ada!", "Hello, Ada!", "Hello, !"]);
assert.match(await readFile(path.join(held.input.repositoryRoot, "openspec/changes/describe-greeting/explore.md"), "utf8"), /不修改实现/);
const result = { runId: identity.runId, actionIdentity: held.actionPackage.actionIdentity,
  authorConclusion: "PASS", reviewerVerdict: null, verificationVerdict: null, nextBoundary: "review-explore",
  facts: { proofRefs, handoff: { summary: "已实际核实问候函数输入行为；只做 Explore",
    ownerDecisions: [{ sourceRef: "owner-input:2026-09-08:apply-approved-024:task-5.1-bounded-example",
      summary: "本轮允许一个有界真实 Author 示例，不执行后续 Review" }],
    evidenceRefs: proofRefs.map(ref => ({ sourceRunId: identity.runId, path: ref.path })) } } };
const next = domain.evaluatePolicyAndNextBoundary({ deliveryId: identity.deliveryId, changeId: identity.changeId,
  changeState: "active", currentAction: { identity: result.actionIdentity, state: "terminal" },
  terminalRunContext: { ...held.preparedContext, lifecycleState: "terminal" }, terminalResult: result });
assert.deepEqual(next, { kind: "ready-action", actionId: "review-explore" });
const saved = await how.finishRecord(domain, held, result, true);
console.log(JSON.stringify({ runId: saved.context.runId, state: saved.context.lifecycleState, next }));
