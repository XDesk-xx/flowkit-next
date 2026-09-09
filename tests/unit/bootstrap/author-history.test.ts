import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
type DeliveryChangeEntry = {
  readonly id: string;
  readonly state?: string;
  readonly projectOrdinal?: unknown;
};
async function readAllDeliveryChangeEntries(): Promise<DeliveryChangeEntry[]> {
  const root = path.join(REPOSITORY_ROOT, "openspec", "delivery-groups");
  const names = (await readdir(root)).filter((name) => name.endsWith(".yaml"));
  const changes: DeliveryChangeEntry[] = [];

  for (const name of names) {
    const parsed = parse(await readFile(path.join(root, name), "utf8")) as {
      changes?: DeliveryChangeEntry[];
    };
    changes.push(...(parsed.changes ?? []));
  }

  return changes;
}

test("project ordinal namespace stays distinct from Run sequence, changeStartSequence and physical group prefix", async () => {
  const runGroup = path.join(
    REPOSITORY_ROOT,
    ".flowkit",
    "runs",
    "20260831-03-action-guidance-bounded-agent-execution",
    "002-converge-author-action-guidance",
  );
  const runNames = (await readdir(runGroup)).sort();

  assert.equal(runNames[0]?.startsWith("20260901-014-explore"), true);
  assert.equal(
    runNames.some((name) => name.includes("-030-review-propose")),
    true,
  );

  const allChanges = await readAllDeliveryChangeEntries();
  const current = allChanges.find(
    (change) => change.id === "converge-author-action-guidance",
  );
  assert.equal(current?.projectOrdinal, 21);
  assert.notEqual(current?.projectOrdinal, 14);
  assert.notEqual(current?.projectOrdinal, 30);
  assert.notEqual(current?.projectOrdinal, 2);
});

test("historical D01 archive preserves the cancelled 008 gap as lineage evidence", async () => {
  const d01ManifestPath = path.join(
    REPOSITORY_ROOT,
    "openspec",
    "delivery-groups",
    "20260824-01-foundation-lifecycle-kernel.yaml",
  );
  const d01Manifest = parse(await readFile(d01ManifestPath, "utf8")) as {
    changes: Array<{ id: string; state?: string }>;
  };

  assert.equal(
    d01Manifest.changes[7]?.id,
    "establish-mutation-and-git-checkpoint-boundary",
  );
  assert.equal(d01Manifest.changes[7]?.state, "cancelled");

  const archiveEntries = await readdir(
    path.join(REPOSITORY_ROOT, "openspec", "changes", "archive"),
  );
  assert.equal(
    archiveEntries.includes(
      "2026-08-27-009-establish-managed-toolchain-resolution",
    ),
    true,
  );
});

test("bootstrap Explore/archive ordinal parity stays independent from product candidate", async () => {
  const bootstrapExplore = await readFile(
    path.join(
      REPOSITORY_ROOT,
      ".agents",
      "skills",
      "explore-proof-based",
      "SKILL.md",
    ),
    "utf8",
  );
  assert.match(
    bootstrapExplore,
    /max\(existing assigned projectOrdinal\) \+ 1/,
  );
  assert.match(bootstrapExplore, /persist it exactly once/);
  assert.match(
    bootstrapExplore,
    /MUST NOT read or execute candidate `skills\/actions\/explore\/SKILL\.md`/,
  );
  assert.match(bootstrapExplore, /STOP fail-closed/);

  const bootstrapArchive = await readFile(
    path.join(REPOSITORY_ROOT, ".agents", "skills", "archive", "SKILL.md"),
    "utf8",
  );

  assert.match(
    bootstrapArchive,
    /\.agents\/skills\/openspec-archive-change\/SKILL\.md/,
  );
  assert.match(
    bootstrapArchive,
    /MUST NOT read, execute, or delegate to `skills\/actions\/archive\/SKILL\.md`/,
  );
  assert.match(
    bootstrapArchive,
    /existing valid positive-integer `projectOrdinal`/,
  );
  assert.match(
    bootstrapArchive,
    /YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>/,
  );
  assert.match(
    bootstrapArchive,
    /MUST NOT allocate, increment, compact, repair or recompute/,
  );

  const archiveEntries = await readdir(
    path.join(REPOSITORY_ROOT, "openspec", "changes", "archive"),
  );
  const normalizedHistoricalArchives = [
    "2026-08-30-014-establish-trusted-change-coordination-state-binding",
    "2026-08-30-015-establish-lightweight-incremental-engineering-gate",
    "2026-08-30-016-establish-structural-dependency-health-fitness",
    "2026-08-30-017-establish-high-confidence-repository-entropy-hygiene",
    "2026-08-31-018-correct-openspec-observation-process-failure-portability",
    "2026-08-31-019-establish-explicit-applicable-check-execution",
    "2026-09-01-020-establish-action-guidance-execution-contract",
  ];

  for (const archiveName of normalizedHistoricalArchives) {
    assert.equal(archiveEntries.includes(archiveName), true);
  }
});

test("independent bootstrap Author and Reviewer HOW preserve bounded provenance without product self-hosting", async () => {
  const bootstrapExplore = await readFile(
    path.join(
      REPOSITORY_ROOT,
      ".agents",
      "skills",
      "explore-proof-based",
      "SKILL.md",
    ),
    "utf8",
  );
  assert.match(bootstrapExplore, /current bounded proof, conclusions/);
  assert.match(bootstrapExplore, /not an append-only diary/);
  assert.match(
    bootstrapExplore,
    /MUST NOT read or execute candidate `skills\/actions\/explore\/SKILL\.md`/,
  );

  const bootstrapReviseExplore = await readFile(
    path.join(
      REPOSITORY_ROOT,
      ".agents",
      "skills",
      "revise-explore",
      "SKILL.md",
    ),
    "utf8",
  );
  assert.match(
    bootstrapReviseExplore,
    /Converge the canonical Explore in place/,
  );
  assert.match(
    bootstrapReviseExplore,
    /current rationale rather than as a revision diary/,
  );

  const reviewerSkillIds = [
    "review-explore",
    "review-propose",
    "review-apply",
  ] as const;
  for (const actionId of reviewerSkillIds) {
    const body = await readFile(
      path.join(REPOSITORY_ROOT, ".agents", "skills", actionId, "SKILL.md"),
      "utf8",
    );
    assert.match(body, /exact affected/);
    assert.match(body, /Do not restate the whole|Do not restate the full/);
    assert.match(body, /mutation-free/);
  }

  const reviewExplore = await readFile(
    path.join(
      REPOSITORY_ROOT,
      ".agents",
      "skills",
      "review-explore",
      "SKILL.md",
    ),
    "utf8",
  );
  assert.match(reviewExplore, /chronology that leaked into canonical Explore/);

  const reviewPropose = await readFile(
    path.join(
      REPOSITORY_ROOT,
      ".agents",
      "skills",
      "review-propose",
      "SKILL.md",
    ),
    "utf8",
  );
  assert.match(
    reviewPropose,
    /revision chronology or superseded planning text/,
  );
});

test("bootstrap archive preparation and Explore HOW preserve independent boundaries", async () => {
  const bootstrapArchive = await readFile(
    path.join(REPOSITORY_ROOT, ".agents", "skills", "archive", "SKILL.md"),
    "utf8",
  );
  assert.match(bootstrapArchive, /Package-bound archive preparation/);
  assert.match(bootstrapArchive, /completion-transition readiness/);
  assert.match(
    bootstrapArchive,
    /canonical convergence in an isolated dry-run/,
  );
  assert.match(bootstrapArchive, /post-convergence verification failure/);
  assert.match(bootstrapArchive, /affected domain verification/);
  assert.match(
    bootstrapArchive,
    /does not require a second Owner archive execution authorization/,
  );
  assert.match(
    bootstrapArchive,
    /all materially required uncommitted ancestor state/,
  );
  assert.match(
    bootstrapArchive,
    /MUST NOT consume candidate product archive Guidance/,
  );

  const bootstrapExplore = await readFile(
    path.join(
      REPOSITORY_ROOT,
      ".agents",
      "skills",
      "explore-proof-based",
      "SKILL.md",
    ),
    "utf8",
  );
  assert.match(
    bootstrapExplore,
    /Check concept ownership and mutation\/failure ordering when relevant/,
  );
  assert.match(
    bootstrapExplore,
    /existing capability\/entity, operation, state, configuration/,
  );
  assert.match(bootstrapExplore, /mutation\/commit point/);
  assert.match(
    bootstrapExplore,
    /simple non-mutating work does not need artificial lifecycle analysis/,
  );
});
