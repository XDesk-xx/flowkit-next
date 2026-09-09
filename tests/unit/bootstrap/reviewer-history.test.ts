import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const REVIEWER_ACTIONS = [
  "review-explore",
  "review-propose",
  "review-apply",
] as const;
async function readBootstrap(actionId: (typeof REVIEWER_ACTIONS)[number]) {
  return readFile(
    path.join(REPOSITORY_ROOT, ".agents", "skills", actionId, "SKILL.md"),
    "utf8",
  );
}

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

test("bootstrap review-propose checks material ownership before blocking", async () => {
  const body = await readBootstrap("review-propose");
  assert.match(body, /first (?:inspect|check) (?:the )?current path/i);
  assert.match(body, /not (?:proof of|establish) `not authorized`/i);
  assert.match(body, /concrete (?:effect|impact)/i);
  assert.match(body, /exact planning claim/i);
  assert.match(body, /permanent retention of raw Explore proof/i);
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
