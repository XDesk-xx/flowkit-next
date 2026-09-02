import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  canonicalActionGuidancePath,
  resolveActionGuidanceRef,
  type StandardActionId,
} from "../../../src/domain/index.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const REVIEWER_ACTIONS = [
  "review-explore",
  "review-propose",
  "review-apply",
] as const satisfies readonly StandardActionId[];

async function readProduct(actionId: (typeof REVIEWER_ACTIONS)[number]) {
  return readFile(
    path.join(REPOSITORY_ROOT, "skills", "actions", actionId, "SKILL.md"),
    "utf8",
  );
}

async function readBootstrap(actionId: (typeof REVIEWER_ACTIONS)[number]) {
  return readFile(
    path.join(REPOSITORY_ROOT, ".agents", "skills", actionId, "SKILL.md"),
    "utf8",
  );
}

test("all three Reviewer Standard Actions have canonical identity-complete product Guidance", async () => {
  for (const actionId of REVIEWER_ACTIONS) {
    assert.equal(
      canonicalActionGuidancePath(actionId),
      `skills/actions/${actionId}/SKILL.md`,
    );

    const body = await readProduct(actionId);
    assert.match(body, new RegExp(`^name: ${actionId}$`, "m"));
    assert.match(body, /## Authority/);
    assert.match(body, /mutation-free/i);
    assert.match(body, /Current-step explanation/);
    assert.match(body, /Complexity \/ minimality/);
    assert.match(body, /New-content \/ scope-drift/);
    assert.match(body, /Semantic invariant \/ literal/);
    assert.match(body, /action\.md.*context\.json.*result\.json/s);
    assert.match(body, /STOP/);
    assert.doesNotMatch(body, /\.agents\/skills\//);
    assert.doesNotMatch(
      body,
      /skills\/(?:engineering|tools|vendors|shared)\//,
      `execution-critical Reviewer HOW must stay identity-complete in ${actionId}`,
    );

    const guidanceRef = await resolveActionGuidanceRef(
      REPOSITORY_ROOT,
      actionId,
    );
    assert.notEqual(guidanceRef, null, `resolver must bind ${actionId}`);
    assert.equal(guidanceRef!.path, `skills/actions/${actionId}/SKILL.md`);
    assert.match(guidanceRef!.contentSha256, /^[0-9a-f]{64}$/);
  }
});

test("Reviewer product Guidance keeps action-specific review focus and authority separation", async () => {
  const reviewExplore = await readProduct("review-explore");
  assert.match(reviewExplore, /truthful, bounded, sufficiently proven/i);
  assert.match(reviewExplore, /Proposal-ready/);
  assert.match(reviewExplore, /explicit non-goals/i);

  const reviewPropose = await readProduct("review-propose");
  assert.match(reviewPropose, /approved Explore/i);
  assert.match(reviewPropose, /smallest complete, testable contract/i);
  assert.match(reviewPropose, /untraceable/);
  assert.match(reviewPropose, /persistence \/ migration impact/i);

  const reviewApply = await readProduct("review-apply");
  assert.match(reviewApply, /approved Proposal\/Design\/spec\/tasks/);
  assert.match(reviewApply, /exact finding convergence/i);
  assert.match(reviewApply, /review-apply = approved/);
  assert.match(reviewApply, /not Delivery Verification PASS/);

  for (const actionId of REVIEWER_ACTIONS) {
    const body = await readProduct(actionId);
    assert.match(body, /does not create Owner authority/i);
    assert.match(body, /do not execute it|do not perform Author correction/i);
    assert.match(body, /Reviewer approval is Reviewer truth only/i);
  }
});

test("Reviewer Guidance rejects incidental lifecycle literals as durable invariants", async () => {
  for (const actionId of REVIEWER_ACTIONS) {
    const body = await readProduct(actionId);
    assert.match(body, /stable contract constant/i);
    assert.match(body, /configuration \/ environment value/i);
    assert.match(body, /incidental current-state|transient current-state/i);
    assert.match(body, /lifecycle-transient|transient lifecycle/i);
    assert.match(body, /stable semantic|durable semantic/i);
  }
});

test("Stable Core bootstrap Reviewer HOW remains independent and non-delegating", async () => {
  const reviewExplore = await readBootstrap("review-explore");
  assert.match(
    reviewExplore,
    /Owner goal \/ actors \/ input domain \/ non-goals/i,
  );

  const reviewPropose = await readBootstrap("review-propose");
  assert.match(reviewPropose, /persistence \/ migration impact/i);

  for (const actionId of REVIEWER_ACTIONS) {
    const body = await readBootstrap(actionId);
    assert.match(
      body,
      /independent flowkit-next self-development Reviewer HOW/i,
    );
    assert.match(body, /mutation-free/i);
    assert.match(body, /current-step explanation/i);
    assert.match(body, /complexity \/ minimality assessment/i);
    assert.match(body, /new-content \/ scope-drift assessment/i);
    assert.match(body, /Semantic invariant \/ literal challenge/);
    assert.match(body, /action\.md \+ context\.json \+ result\.json/);
    assert.match(body, /STOP/);
    assert.match(
      body,
      new RegExp(
        "MUST NOT read, execute, invoke, delegate to, or become a thin pointer to candidate `skills/actions/" +
          actionId +
          "/SKILL\\.md`",
      ),
    );
  }
});

test("live temporary Run bridge is retired without erasing historical provenance", async () => {
  await assert.rejects(
    readFile(
      path.join(REPOSITORY_ROOT, "TEMPORARY-RUN-SURFACE-GUIDANCE.md"),
      "utf8",
    ),
    (error: NodeJS.ErrnoException) => error.code === "ENOENT",
  );

  const agents = await readFile(
    path.join(REPOSITORY_ROOT, "AGENTS.md"),
    "utf8",
  );
  assert.doesNotMatch(agents, /TEMPORARY-RUN-SURFACE-GUIDANCE\.md/);
  assert.doesNotMatch(agents, /Temporary D03 bridge/);

  const runRoot = path.join(REPOSITORY_ROOT, ".flowkit", "runs");
  const deliveries = await readdir(runRoot);
  assert.ok(deliveries.length > 0, "historical Run provenance remains present");

  const historicalAuthorSpec = await readFile(
    path.join(
      REPOSITORY_ROOT,
      "openspec",
      "changes",
      "archive",
      "2026-09-01-021-converge-author-action-guidance",
      "specs",
      "author-action-guidance",
      "spec.md",
    ),
    "utf8",
  );
  assert.match(
    historicalAuthorSpec,
    /TEMPORARY-RUN-SURFACE-GUIDANCE\.md/,
    "historical archive provenance is preserved without pinning stale phase text into the current canonical spec",
  );
});
