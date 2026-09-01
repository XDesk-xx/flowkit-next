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
});

test("current Change persists 021 while planned Reviewer Change reserves no ordinal", async () => {
  const currentManifestPath = path.join(
    REPOSITORY_ROOT,
    "openspec",
    "delivery-groups",
    "20260831-03-action-guidance-bounded-agent-execution.yaml",
  );
  const currentManifest = parse(
    await readFile(currentManifestPath, "utf8"),
  ) as {
    changes: DeliveryChangeEntry[];
  };

  const author = currentManifest.changes.find(
    (change) => change.id === "converge-author-action-guidance",
  );
  const reviewer = currentManifest.changes.find(
    (change) => change.id === "converge-reviewer-action-guidance",
  );

  assert.equal(author?.projectOrdinal, 21);
  assert.equal(reviewer?.state, "planned");
  assert.equal(reviewer?.projectOrdinal, undefined);

  const allChanges = await readAllDeliveryChangeEntries();
  assert.deepEqual(validateAssignedProjectOrdinals(allChanges), [21]);
  assert.equal(deriveNextProjectOrdinal(allChanges), 22);
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
  assert.equal(
    archiveEntries.includes(
      "2026-08-30-establish-lightweight-incremental-engineering-gate",
    ),
    true,
  );
  assert.equal(
    archiveEntries.includes(
      "2026-09-01-establish-action-guidance-execution-contract",
    ),
    true,
  );
});
