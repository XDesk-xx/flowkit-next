import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildRunAddress,
  formatRunOccurrenceId,
  isRunContextRecord,
  isRunOccurrence,
  isRunResultRecord,
  listChangeRunHistory,
  parseRunOccurrenceId,
  readDurableRun,
  writeDurableRun,
  type ActionIdentity,
  type DurableRunRecord,
  type RunAddressInput,
  type RunContextRecord,
  type RunOccurrence,
  type RunResultRecord,
} from "../../../src/domain/index.js";

const deliveryId = "20260824-01-foundation-lifecycle-kernel";
const changeId = "establish-run-result-persistence";
const changeStartSequence = 21;

function occurrence(
  sequence: number,
  actionId: RunOccurrence["actionId"] = "review-explore",
  date = "20260825",
): RunOccurrence {
  return { date, sequence, actionId };
}

function identity(actionId: ActionIdentity["actionId"]): ActionIdentity {
  return { deliveryId, changeId, actionId };
}

function ownerAuthority() {
  return {
    ref: `owner:${"a".repeat(64)}`,
    decision: "authorize-apply",
    deliveryId,
    changeId,
    sourceRef: "owner-input:2026-08-25:authorize-apply",
    scope: ["apply"],
  } as const;
}

function context(
  runOccurrence: RunOccurrence,
  options: Partial<RunContextRecord> = {},
): RunContextRecord {
  const runId = formatRunOccurrenceId(runOccurrence)!;
  return {
    runId,
    occurrence: runOccurrence,
    actionIdentity: identity(runOccurrence.actionId),
    role: runOccurrence.actionId.startsWith("review-") ? "reviewer" : "author",
    lifecycleState: "terminal",
    ownerAuthority: null,
    previousRunId: null,
    ...options,
  };
}

function result(
  runOccurrence: RunOccurrence,
  options: Partial<RunResultRecord> = {},
): RunResultRecord {
  const reviewer = runOccurrence.actionId.startsWith("review-");
  return {
    runId: formatRunOccurrenceId(runOccurrence)!,
    actionIdentity: identity(runOccurrence.actionId),
    authorConclusion: reviewer ? null : "PASS",
    reviewerVerdict: reviewer ? "approved" : null,
    verificationVerdict: null,
    nextBoundary: reviewer ? "propose" : "review-explore",
    facts: { stableTransfer: true },
    ...options,
  };
}

function record(
  runOccurrence: RunOccurrence,
  options: {
    context?: Partial<RunContextRecord>;
    result?: Partial<RunResultRecord>;
    actionMarkdown?: string;
  } = {},
): DurableRunRecord {
  return {
    actionMarkdown:
      options.actionMarkdown ?? `# Action: ${runOccurrence.actionId}\n`,
    context: context(runOccurrence, options.context),
    result: result(runOccurrence, options.result),
  };
}

function addressInput(
  repositoryRoot: string,
  runOccurrence: RunOccurrence,
): RunAddressInput {
  return {
    repositoryRoot,
    deliveryId,
    changeId,
    changeStartSequence,
    occurrence: runOccurrence,
  };
}

async function withTempRepository(
  fn: (repositoryRoot: string) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-run-persistence-"),
  );
  try {
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("keeps repeated Standard Action executions as distinct Change-scoped occurrences", () => {
  const first = occurrence(22, "review-explore");
  const second = occurrence(24, "review-explore");
  assert.equal(isRunOccurrence(first), true);
  assert.equal(isRunOccurrence(second), true);
  assert.equal(first.actionId, second.actionId);
  assert.notEqual(formatRunOccurrenceId(first), formatRunOccurrenceId(second));
  assert.deepEqual(identity(first.actionId), identity(second.actionId));
});

test("generates canonical dated direct-child addresses from controlled inputs", () => {
  const generated = buildRunAddress(
    addressInput("/tmp/repository", occurrence(33, "apply")),
  );
  assert.notEqual(generated, null);
  assert.equal(generated!.runId, "20260825-033-apply");
  assert.equal(path.basename(generated!.runDirectory), generated!.runId);
  assert.equal(path.dirname(generated!.runDirectory), generated!.changeRoot);
  assert.equal(
    path.relative(generated!.repositoryRoot, generated!.runDirectory),
    path.join(
      ".flowkit",
      "runs",
      deliveryId,
      "021-establish-run-result-persistence",
      "20260825-033-apply",
    ),
  );
  assert.deepEqual(
    parseRunOccurrenceId(generated!.runId),
    occurrence(33, "apply"),
  );
});

test("rejects invalid controlled address inputs before filesystem use", async () => {
  await withTempRepository(async (repositoryRoot) => {
    for (const invalid of [
      occurrence(1, "apply", "20260230"),
      { ...occurrence(1, "apply"), sequence: 0 },
      { ...occurrence(1, "apply"), sequence: 1_000_000 },
      { ...occurrence(1, "apply"), actionId: "APPLY" },
    ] as unknown as RunOccurrence[]) {
      await assert.rejects(
        writeDurableRun(
          addressInput(repositoryRoot, invalid),
          record(occurrence(1, "apply")),
        ),
        /Invalid controlled Run address input/,
      );
    }

    const invalidIdentityInput = {
      ...addressInput(repositoryRoot, occurrence(1, "apply")),
      changeId: "../escape",
    } as RunAddressInput;
    await assert.rejects(
      writeDurableRun(invalidIdentityInput, record(occurrence(1, "apply"))),
      /Invalid controlled Run address input/,
    );
    await assert.rejects(readdir(path.join(repositoryRoot, ".flowkit")), {
      code: "ENOENT",
    });
  });
});

test("validates exact context and preserves explicit or absent Owner authority", async () => {
  await withTempRepository(async (repositoryRoot) => {
    const runOccurrence = occurrence(33, "apply");
    const explicit = record(runOccurrence, {
      context: { ownerAuthority: ownerAuthority() },
    });
    assert.equal(isRunContextRecord(explicit.context), true);
    await writeDurableRun(
      addressInput(repositoryRoot, runOccurrence),
      explicit,
    );
    const reread = await readDurableRun(
      addressInput(repositoryRoot, runOccurrence),
    );
    assert.deepEqual(reread.context.ownerAuthority, ownerAuthority());

    const absentOccurrence = occurrence(34, "review-apply");
    const absent = record(absentOccurrence);
    await writeDurableRun(
      addressInput(repositoryRoot, absentOccurrence),
      absent,
    );
    const rereadAbsent = await readDurableRun(
      addressInput(repositoryRoot, absentOccurrence),
    );
    assert.equal(rereadAbsent.context.ownerAuthority, null);

    assert.equal(
      isRunContextRecord({ ...absent.context, unexpected: true }),
      false,
    );
  });
});

test("keeps Author, Reviewer and Verification outcomes separate and preserves next boundary as data", async () => {
  await withTempRepository(async (repositoryRoot) => {
    const reviewerOccurrence = occurrence(32, "review-propose");
    const reviewerRecord = record(reviewerOccurrence, {
      result: {
        authorConclusion: null,
        reviewerVerdict: "approved",
        verificationVerdict: null,
        nextBoundary: "apply",
        facts: { findingCount: 0, note: "durable data only" },
      },
    });
    assert.equal(isRunResultRecord(reviewerRecord.result), true);
    await writeDurableRun(
      addressInput(repositoryRoot, reviewerOccurrence),
      reviewerRecord,
    );
    const reread = await readDurableRun(
      addressInput(repositoryRoot, reviewerOccurrence),
    );
    assert.equal(reread.result.authorConclusion, null);
    assert.equal(reread.result.reviewerVerdict, "approved");
    assert.equal(reread.result.verificationVerdict, null);
    assert.equal(reread.result.nextBoundary, "apply");
    assert.deepEqual(reread.result.facts, reviewerRecord.result.facts);
  });
});

test("rejects context/result linkage mismatch and unknown envelope fields", async () => {
  await withTempRepository(async (repositoryRoot) => {
    const runOccurrence = occurrence(33, "apply");
    const mismatched = record(runOccurrence, {
      result: { runId: "20260825-034-apply" },
    });
    await assert.rejects(
      writeDurableRun(addressInput(repositoryRoot, runOccurrence), mismatched),
      /linkage/,
    );

    assert.equal(
      isRunResultRecord({ ...result(runOccurrence), extra: true }),
      false,
    );
    assert.equal(
      isRunContextRecord({
        ...context(runOccurrence),
        occurrence: { ...runOccurrence, extra: true },
      }),
      false,
    );
  });
});

test("writes the stable three-file surface once and preserves prior bytes on collision", async () => {
  await withTempRepository(async (repositoryRoot) => {
    const runOccurrence = occurrence(33, "apply");
    const input = addressInput(repositoryRoot, runOccurrence);
    const written = await writeDurableRun(input, record(runOccurrence));
    assert.deepEqual((await readdir(written.runDirectory)).sort(), [
      "action.md",
      "context.json",
      "result.json",
    ]);

    const before = await Promise.all(
      ["action.md", "context.json", "result.json"].map((name) =>
        readFile(path.join(written.runDirectory, name)),
      ),
    );
    await assert.rejects(
      writeDurableRun(
        input,
        record(runOccurrence, { actionMarkdown: "# replacement\n" }),
      ),
      /(already exists|sequence already exists)/,
    );
    const after = await Promise.all(
      ["action.md", "context.json", "result.json"].map((name) =>
        readFile(path.join(written.runDirectory, name)),
      ),
    );
    assert.deepEqual(after, before);
  });
});

test("rejects duplicate controlled sequence even when date or Action differs", async () => {
  await withTempRepository(async (repositoryRoot) => {
    await writeDurableRun(
      addressInput(repositoryRoot, occurrence(33, "apply")),
      record(occurrence(33, "apply")),
    );
    const duplicate = occurrence(33, "review-apply", "20260826");
    await assert.rejects(
      writeDurableRun(
        addressInput(repositoryRoot, duplicate),
        record(duplicate),
      ),
      /Run sequence already exists: 33/,
    );
  });
});

test("fails closed on missing, truncated or malformed machine records", async () => {
  await withTempRepository(async (repositoryRoot) => {
    const runOccurrence = occurrence(33, "apply");
    const input = addressInput(repositoryRoot, runOccurrence);
    const address = await writeDurableRun(input, record(runOccurrence));

    await unlink(path.join(address.runDirectory, "result.json"));
    await assert.rejects(readDurableRun(input), /Incomplete Run record/);

    await writeFile(
      path.join(address.runDirectory, "result.json"),
      '{"broken":',
      "utf8",
    );
    await assert.rejects(readDurableRun(input), /Invalid JSON in result.json/);

    await writeFile(
      path.join(address.runDirectory, "result.json"),
      `${JSON.stringify(result(runOccurrence), null, 2)}\n`,
      "utf8",
    );
    const malformedContext = {
      ...context(runOccurrence),
      ownerAuthority: { ...ownerAuthority(), ref: "owner:bad" },
    };
    await writeFile(
      path.join(address.runDirectory, "context.json"),
      `${JSON.stringify(malformedContext, null, 2)}\n`,
      "utf8",
    );
    await assert.rejects(readDurableRun(input), /Invalid Run context record/);
  });
});

test("lists Change-local Author → Reviewer → Author history in controlled sequence order without auto-execution", async () => {
  await withTempRepository(async (repositoryRoot) => {
    const runs = [
      occurrence(23, "revise-explore"),
      occurrence(21, "explore"),
      occurrence(22, "review-explore"),
    ];
    const previous = new Map<number, string | null>([
      [21, null],
      [22, "20260825-021-explore"],
      [23, "20260825-022-review-explore"],
    ]);
    for (const item of runs) {
      await writeDurableRun(
        addressInput(repositoryRoot, item),
        record(item, {
          context: { previousRunId: previous.get(item.sequence) ?? null },
          result: {
            nextBoundary:
              item.sequence === 21
                ? "review-explore"
                : item.sequence === 22
                  ? "revise-explore"
                  : "review-explore",
          },
        }),
      );
    }

    const history = await listChangeRunHistory({
      repositoryRoot,
      deliveryId,
      changeId,
      changeStartSequence,
    });
    assert.deepEqual(
      history.map((item) => item.context.occurrence.sequence),
      [21, 22, 23],
    );
    assert.deepEqual(
      history.map((item) => item.context.role),
      ["author", "reviewer", "author"],
    );
    assert.equal(
      history[2].context.previousRunId,
      "20260825-022-review-explore",
    );
    assert.equal(history[2].result.nextBoundary, "review-explore");
    assert.equal("executeNext" in history[2].result, false);
  });
});
