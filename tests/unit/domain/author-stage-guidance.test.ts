import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

async function readProductGuidance(actionId: string): Promise<string> {
  return readFile(
    path.join(REPOSITORY_ROOT, "skills", "actions", actionId, "SKILL.md"),
    "utf8",
  );
}

test("Author Guidance converges canonical artifacts to current truth instead of revision chronology", async () => {
  const explore = await readProductGuidance("explore");
  assert.match(explore, /current bounded proof\/rationale/);
  assert.match(explore, /not as an append-only revision chronology/);
  assert.match(
    explore,
    /current rationale rather than as `Reviewer correction`/,
  );
  assert.match(
    explore,
    /Run surface only at the bounded level required by the existing concise Run contract/,
  );
  assert.match(explore, /Prefer concise exact Run\/finding references/);
  assert.match(explore, /Git preserves exact repository history/);
  assert.doesNotMatch(
    explore,
    /Detailed execution\/review chronology belongs to the existing Run\/Git history surfaces/,
  );
  assert.match(explore, /diagnostic signals only/);
  assert.match(explore, /not correctness Gates/);

  const reviseExplore = await readProductGuidance("revise-explore");
  assert.match(reviseExplore, /replace\/remove superseded text/);
  assert.match(reviseExplore, /current rationale, not a revision diary/);
  assert.match(reviseExplore, /Do not append `Reviewer correction`/);
  assert.match(reviseExplore, /Do not copy the full Explore\/proof transcript/);

  const propose = await readProductGuidance("propose");
  assert.match(propose, /current implementation-relevant decisions/);
  assert.match(propose, /Do not copy the approved Explore proof transcript/);
  assert.match(propose, /cross-artifact or Run\/finding references/);
  assert.match(propose, /not correctness Gates/);

  const revisePropose = await readProductGuidance("revise-propose");
  assert.match(
    revisePropose,
    /Converge affected Proposal\/Design\/spec\/task claims in place/,
  );
  assert.match(
    revisePropose,
    /instead of appending review\/revision chronology/,
  );
  assert.match(
    revisePropose,
    /Do not restate the full Proposal\/Design or proof transcript/,
  );
});

test("Author stage HOW carries relevant Owner material boundaries and separates proof classes", async () => {
  const productBodies = await Promise.all([
    readProductGuidance("explore"),
    readProductGuidance("propose"),
    readProductGuidance("revise-propose"),
  ]);
  for (const body of productBodies) {
    assert.match(body, /materially relevant Owner decisions/i);
    assert.match(body, /(?:full|whole) (?:chat|conversation)/i);
    assert.match(body, /Explore experiments?/i);
    assert.match(body, /current implementation (?:acceptance evidence|PASS)/i);
  }
});
