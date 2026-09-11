import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
test("bootstrap Author material handling remains independent", async () => {
  for (const skillId of [
    "explore-proof-based",
    "proposal-convergence",
    "revise-propose",
  ]) {
    const body = await readFile(
      path.join(REPOSITORY_ROOT, ".agents", "skills", skillId, "SKILL.md"),
      "utf8",
    );
    assert.match(body, /Owner decision/i);
    assert.match(body, /Explore experiment/i);
    assert.match(body, /current implementation (?:acceptance evidence|PASS)/i);
    assert.doesNotMatch(body, /proof (?:registry|database)/i);
  }
});
