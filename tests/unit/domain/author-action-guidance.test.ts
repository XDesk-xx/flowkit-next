import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

import {
  resolveActionGuidanceRef,
  type StandardActionId,
} from "../../../src/domain/index.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

const AUTHOR_ACTIONS = [
  "explore",
  "revise-explore",
  "propose",
  "revise-propose",
  "apply",
  "revise-apply",
  "archive",
] as const satisfies readonly StandardActionId[];

const REVIEWER_ACTIONS = new Set<StandardActionId>([
  "review-explore",
  "review-propose",
  "review-apply",
]);

const TERMINAL_BOUNDARY: Record<(typeof AUTHOR_ACTIONS)[number], string> = {
  explore: "review-explore",
  "revise-explore": "review-explore",
  propose: "review-propose",
  "revise-propose": "review-propose",
  apply: "review-apply",
  "revise-apply": "review-apply",
  archive: "STOP",
};

type DeliveryChangeEntry = {
  readonly id: string;
  readonly state?: string;
  readonly projectOrdinal?: unknown;
};

async function readProductGuidance(
  actionId: (typeof AUTHOR_ACTIONS)[number],
): Promise<string> {
  return readFile(
    path.join(REPOSITORY_ROOT, "skills", "actions", actionId, "SKILL.md"),
    "utf8",
  );
}

function validateAssignedProjectOrdinals(
  changes: readonly DeliveryChangeEntry[],
): number[] | null {
  const seen = new Set<number>();
  const assigned: number[] = [];

  for (const change of changes) {
    if (change.projectOrdinal === undefined) continue;
    if (
      typeof change.projectOrdinal !== "number" ||
      !Number.isInteger(change.projectOrdinal) ||
      change.projectOrdinal <= 0 ||
      seen.has(change.projectOrdinal)
    ) {
      return null;
    }
    seen.add(change.projectOrdinal);
    assigned.push(change.projectOrdinal);
  }

  return assigned.sort((left, right) => left - right);
}

function deriveNextProjectOrdinal(
  changes: readonly DeliveryChangeEntry[],
): number | null {
  const assigned = validateAssignedProjectOrdinals(changes);
  if (assigned === null || assigned.length === 0) return null;
  return assigned.at(-1)! + 1;
}

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

test("all seven Author Standard Actions have canonical identity-complete product Guidance", async () => {
  for (const actionId of AUTHOR_ACTIONS) {
    const body = await readProductGuidance(actionId);

    assert.match(body, new RegExp(`^name: ${actionId}$`, "m"));
    assert.match(body, /## Authority/);
    assert.match(body, /## Terminal boundary/);
    assert.match(body, /STOP/);
    assert.doesNotMatch(body, /\.agents\/skills\//);

    if (actionId !== "archive") {
      assert.match(body, new RegExp(TERMINAL_BOUNDARY[actionId]));
    }
  }
});

test("product Action Guidance top-level identities stay bounded to Standard Actions", async () => {
  const actionsRoot = path.join(REPOSITORY_ROOT, "skills", "actions");
  const entries = await readdir(actionsRoot, { withFileTypes: true });
  const skillActions = new Set(
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          try {
            await readFile(path.join(actionsRoot, entry.name, "SKILL.md"));
            return entry.name;
          } catch {
            return null;
          }
        }),
    ),
  );
  skillActions.delete(null);

  for (const actionId of AUTHOR_ACTIONS) {
    assert.equal(skillActions.has(actionId), true, `missing ${actionId}`);
  }

  const allowed = new Set<string>([...AUTHOR_ACTIONS, ...REVIEWER_ACTIONS]);
  for (const actionId of skillActions) {
    assert.equal(
      allowed.has(actionId as string),
      true,
      `unexpected top-level product Guidance identity: ${String(actionId)}`,
    );
  }
});

test("canonical Author files carry Action-significant HOW inside the hashed file", async () => {
  const explore = await readProductGuidance("explore");
  assert.match(explore, /proof before platform/i);
  assert.match(explore, /fact \/ assumption \/ unknown \/ future possibility/);
  assert.match(explore, /First-Explore project ordinal materialization/);
  assert.match(explore, /max\(existing assigned projectOrdinal\) \+ 1/);
  assert.match(explore, /persist it exactly once/);
  assert.match(explore, /complexity \/ scope-drift/i);

  const propose = await readProductGuidance("propose");
  assert.match(propose, /Preserve approved Explore/);
  assert.match(propose, /Keep implementation out/);

  const apply = await readProductGuidance("apply");
  assert.match(apply, /Implementation convergence/);
  assert.match(apply, /Mechanical Preflight — internal phase/);
  assert.match(apply, /Structural Dependency Health/);
  assert.match(apply, /Repository Entropy Hygiene/);
  assert.match(apply, /Applicable Check facts/);

  for (const actionId of [
    "revise-explore",
    "revise-propose",
    "revise-apply",
  ] as const) {
    const body = await readProductGuidance(actionId);
    assert.match(
      body,
      /exact Reviewer finding|exact Reviewer findings|Reviewer finding IDs/i,
    );
    assert.match(body, /Preserve|preserve/);
    assert.match(body, /Rerun only|rerun only/);
  }

  const archive = await readProductGuidance("archive");
  assert.match(archive, /Change is still `active`/);
  assert.match(archive, /MUST NOT require a pre-existing `completed`/);
  assert.match(archive, /existing valid positive-integer `projectOrdinal`/);
  assert.match(archive, /YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>/);
  assert.match(
    archive,
    /MUST NOT allocate, increment, compact, repair, or recompute/,
  );
  assert.match(archive, /missing, malformed, duplicated or inconsistent/);
  assert.match(archive, /No hidden next-Change activation/);
});

test("all seven real Author entries resolve and exact canonical byte drift changes GuidanceRef", async () => {
  for (const actionId of AUTHOR_ACTIONS) {
    const ref = await resolveActionGuidanceRef(REPOSITORY_ROOT, actionId);
    assert.notEqual(ref, null, `failed to resolve ${actionId}`);
    assert.equal(ref!.path, `skills/actions/${actionId}/SKILL.md`);
    assert.match(ref!.contentSha256, /^[0-9a-f]{64}$/);
  }

  const tempRoot = await mkdtemp(
    path.join(tmpdir(), "flowkit-author-guidance-real-bytes-"),
  );
  try {
    const canonical = await readProductGuidance("apply");
    const entry = path.join(tempRoot, "skills", "actions", "apply", "SKILL.md");
    await mkdir(path.dirname(entry), { recursive: true });
    await writeFile(entry, canonical, "utf8");

    const before = await resolveActionGuidanceRef(tempRoot, "apply");
    assert.notEqual(before, null);

    await writeFile(entry, `${canonical}\n<!-- exact-byte-drift -->\n`, "utf8");
    const after = await resolveActionGuidanceRef(tempRoot, "apply");
    assert.notEqual(after, null);
    assert.notEqual(before!.contentSha256, after!.contentSha256);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("project ordinal allocation uses durable assigned facts only and fails closed on ambiguity", () => {
  assert.equal(
    deriveNextProjectOrdinal([
      { id: "a", projectOrdinal: 20 },
      { id: "b", projectOrdinal: 21 },
      { id: "planned", state: "planned" },
    ]),
    22,
  );

  assert.equal(
    deriveNextProjectOrdinal([
      { id: "cancelled", state: "cancelled", projectOrdinal: 8 },
    ]),
    9,
  );

  assert.equal(
    deriveNextProjectOrdinal([{ id: "planned", state: "planned" }]),
    null,
  );
  assert.equal(
    deriveNextProjectOrdinal([
      { id: "a", projectOrdinal: 21 },
      { id: "b", projectOrdinal: 21 },
    ]),
    null,
  );
  assert.equal(
    deriveNextProjectOrdinal([{ id: "bad", projectOrdinal: "21" }]),
    null,
  );
  assert.equal(
    deriveNextProjectOrdinal([{ id: "zero", projectOrdinal: 0 }]),
    null,
  );
});

test("project ordinal invariants survive legal lifecycle transitions", () => {
  const assigned = [
    { id: "completed-author", state: "completed", projectOrdinal: 21 },
    { id: "completed-corrective", state: "completed", projectOrdinal: 22 },
    { id: "current", state: "active", projectOrdinal: 23 },
    { id: "future", state: "planned" },
  ];

  assert.deepEqual(validateAssignedProjectOrdinals(assigned), [21, 22, 23]);
  assert.equal(deriveNextProjectOrdinal(assigned), 24);

  const afterCurrentCompletes = assigned.map((change) =>
    change.id === "current" ? { ...change, state: "completed" } : change,
  );
  assert.deepEqual(
    validateAssignedProjectOrdinals(afterCurrentCompletes),
    [21, 22, 23],
  );
  assert.equal(deriveNextProjectOrdinal(afterCurrentCompletes), 24);
});

test("projectOrdinal remains Guidance coordination data rather than a production Core identity", async () => {
  const sourceRoot = path.join(REPOSITORY_ROOT, "src");
  const sourceEntries = await readdir(sourceRoot, { recursive: true });

  for (const relative of sourceEntries) {
    if (!relative.endsWith(".ts")) continue;
    const body = await readFile(path.join(sourceRoot, relative), "utf8");
    assert.doesNotMatch(
      body,
      /projectOrdinal/,
      `production Core unexpectedly consumes projectOrdinal: ${relative}`,
    );
  }
});

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

  await readFile(
    path.join(REPOSITORY_ROOT, "TEMPORARY-RUN-SURFACE-GUIDANCE.md"),
    "utf8",
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

test("artifact-convergence correction adds no product Reviewer Guidance, hard size Gate, Run schema, or Core dependency", async () => {
  for (const actionId of REVIEWER_ACTIONS) {
    await assert.rejects(
      readFile(
        path.join(REPOSITORY_ROOT, "skills", "actions", actionId, "SKILL.md"),
        "utf8",
      ),
      (error: NodeJS.ErrnoException) => error.code === "ENOENT",
    );
  }

  const changedAuthorHow = await Promise.all([
    readProductGuidance("explore"),
    readProductGuidance("revise-explore"),
    readProductGuidance("propose"),
    readProductGuidance("revise-propose"),
  ]);
  for (const body of changedAuthorHow) {
    assert.doesNotMatch(
      body,
      /(?:>|>=)\s*\d+\s*(?:KB|KiB|lines?)\s*(?:→|=>|=)?\s*(?:FAIL|fail)/,
    );
  }

  const sourceRoot = path.join(REPOSITORY_ROOT, "src");
  const sourceEntries = await readdir(sourceRoot, { recursive: true });
  for (const relative of sourceEntries) {
    if (!relative.endsWith(".ts")) continue;
    const body = await readFile(path.join(sourceRoot, relative), "utf8");
    assert.doesNotMatch(
      body,
      /artifact-convergence|revision chronology|convergence-in-place/i,
    );
  }

  const temporaryRunGuidance = await readFile(
    path.join(REPOSITORY_ROOT, "TEMPORARY-RUN-SURFACE-GUIDANCE.md"),
    "utf8",
  );
  assert.match(temporaryRunGuidance, /action\.md/);
  assert.match(temporaryRunGuidance, /context\.json/);
  assert.match(temporaryRunGuidance, /result\.json/);
});
