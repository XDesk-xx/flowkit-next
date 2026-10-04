import assert from "node:assert/strict";
import test from "node:test";
import { isArchiveOutcome } from "../../../src/domain/archive-outcome.js";
import {
  retryTerminalArchive,
  transitionCurrentAction,
} from "../../../src/domain/action-lifecycle.js";
import { evaluatePolicyAndNextBoundary } from "../../../src/domain/policy-and-next-boundary.js";
import {
  isRunResultRecord,
  type DurableRunRecord,
  type JsonObject,
} from "../../../src/domain/run-result-persistence.js";
import {
  archiveReviewSource,
  resolveRunChain,
} from "../../../src/cli/current-run-chain.js";
import { isCandidateGit } from "../../../src/internal/candidate-git-facts.js";

const failed = { kind: "failed", effect: "no-mutation", retryable: true };
function record(
  actionId: string,
  sequence: number,
  previousRunId: string | null,
  facts: JsonObject = {},
  authorConclusion: string | null = "PASS",
): DurableRunRecord {
  const reviewer = actionId.startsWith("review-");
  const runId = `20261004-${String(sequence).padStart(3, "0")}-${actionId}`;
  const identity = {
    deliveryId: "delivery-one",
    changeId: "change-one",
    actionId,
  } as DurableRunRecord["context"]["actionIdentity"];
  return {
    actionMarkdown: "# Synthetic role fixture\n",
    context: {
      runId,
      occurrence: { date: "20261004", sequence, actionId: identity.actionId },
      actionIdentity: identity,
      role: reviewer ? "reviewer" : "author",
      lifecycleState: "terminal",
      previousRunId,
      ownerAuthority: null,
    },
    result: {
      runId,
      actionIdentity: identity,
      authorConclusion: reviewer ? null : authorConclusion,
      reviewerVerdict: reviewer ? "approved" : null,
      verificationVerdict: null,
      nextBoundary: null,
      facts,
    },
  };
}
function chain() {
  const result: DurableRunRecord[] = [];
  for (const [i, action] of [
    "explore",
    "review-explore",
    "propose",
    "review-propose",
    "apply",
    "review-apply",
  ].entries())
    result.push(
      record(
        action,
        i + 1,
        result.at(-1)?.context.runId ?? null,
        action === "review-apply"
          ? { reviewedRunId: result.at(-1)!.context.runId }
          : {},
      ),
    );
  for (let i = 0; i < 2; i++)
    result.push(
      record(
        "archive",
        7 + i,
        result.at(-1)!.context.runId,
        { archiveOutcome: failed },
        "FAIL",
      ),
    );
  return result;
}
test("archiveOutcome is closed, exact Role/outcome/next combinations are required; legacy records remain readable", () => {
  for (const outcome of [
    { kind: "completed" },
    failed,
    { kind: "failed", effect: "rolled-back", retryable: true },
    { kind: "partial", effect: "recovery-required", retryable: false },
  ]) {
    assert.equal(isArchiveOutcome(outcome), true);
    const item = record(
      "archive",
      7,
      null,
      { archiveOutcome: outcome },
      outcome.kind === "completed" ? "PASS" : "FAIL",
    ).result;
    assert.equal(isRunResultRecord(item), true);
    assert.equal(
      isRunResultRecord({
        ...item,
        authorConclusion: item.authorConclusion === "PASS" ? "FAIL" : "PASS",
      }),
      false,
    );
    assert.equal(
      isRunResultRecord({ ...item, reviewerVerdict: "approved" }),
      false,
    );
    assert.equal(
      isRunResultRecord({ ...item, nextBoundary: "review-apply" }),
      false,
    );
  }
  for (const value of [
    null,
    [],
    {},
    { ...failed, extra: 0 },
    { ...failed, retryable: false },
    { ...failed, effect: "unknown" },
    { kind: "completed", effect: "no-mutation" },
  ])
    assert.equal(isArchiveOutcome(value), false);
  assert.equal(
    isRunResultRecord(record("archive", 7, null, {}, "FAIL").result),
    true,
  );
  assert.equal(
    isRunResultRecord(
      record("apply", 7, null, { archiveOutcome: failed }, "FAIL").result,
    ),
    false,
  );
});
test("only the dedicated Policy-ready Archive seam opens a new occurrence; ordinary terminal prepare absorbs", () => {
  const item = chain().at(-1)!;
  const identity = item.context.actionIdentity,
    current = { identity, state: "terminal" as const };
  const input = {
    deliveryId: identity.deliveryId,
    changeId: identity.changeId,
    changeState: "active",
    currentAction: current,
    terminalRunContext: item.context,
    terminalResult: item.result,
  };
  const ready = evaluatePolicyAndNextBoundary(input);
  assert.deepEqual(ready, { kind: "ready-action", actionId: "archive" });
  assert.equal(
    transitionCurrentAction(current, { type: "prepare", identity }),
    null,
  );
  assert.deepEqual(retryTerminalArchive(current, identity, ready), {
    identity,
    state: "prepared",
  });
  for (const boundary of [
    { kind: "ready-action", actionId: "apply" },
    { kind: "blocked", reason: "archive-recovery-required" },
    { kind: "ready-action", actionId: "archive", extra: 1 },
  ])
    assert.equal(retryTerminalArchive(current, identity, boundary), null);
  for (const requestedAction of ["revise-apply", "revise-propose"]) {
    const authority = {
      ref: "owner:" + "a".repeat(64),
      decision: "revise-action",
      deliveryId: identity.deliveryId,
      changeId: identity.changeId,
      sourceRef: "synthetic:explicit-owner",
      scope: [requestedAction],
    };
    assert.deepEqual(
      evaluatePolicyAndNextBoundary({
        ...input,
        ownerCorrection: { requestedAction, authority },
      }),
      { kind: "ready-action", actionId: requestedAction },
    );
    assert.equal(
      evaluatePolicyAndNextBoundary({
        ...input,
        ownerCorrection: {
          requestedAction,
          authority: { ...authority, changeId: "wrong" },
        },
      }).kind,
      "blocked",
    );
  }
  const partial = {
    ...item.result,
    facts: {
      archiveOutcome: {
        kind: "partial",
        effect: "recovery-required",
        retryable: false,
      },
    },
  };
  assert.deepEqual(
    evaluatePolicyAndNextBoundary({ ...input, terminalResult: partial }),
    { kind: "blocked", reason: "archive-recovery-required" },
  );
  assert.equal(
    evaluatePolicyAndNextBoundary({
      ...input,
      terminalResult: { ...item.result, facts: {} },
    }).kind,
    "blocked",
  );
});
test("continuous safe failed parents resolve exact Review and Author, never skipped, forked, wrong-target, stale PASS or partial", () => {
  const original = chain();
  const source = archiveReviewSource(original, original.at(-1)!);
  assert.equal(source.review.context.runId, original[5].context.runId);
  assert.equal(source.author.context.runId, original[4].context.runId);
  assert.equal(
    resolveRunChain(original)?.context.runId,
    original.at(-1)!.context.runId,
  );
  for (const mutate of [
    (r: DurableRunRecord[]) => r.splice(6, 1),
    (r: DurableRunRecord[]) =>
      r.push(
        record(
          "archive",
          9,
          r[5].context.runId,
          { archiveOutcome: failed },
          "FAIL",
        ),
      ),
    (r: DurableRunRecord[]) => {
      r[6] = {
        ...r[6],
        context: {
          ...r[6].context,
          actionIdentity: { ...r[6].context.actionIdentity, changeId: "wrong" },
        },
      };
    },
    (r: DurableRunRecord[]) => {
      r[6] = {
        ...r[6],
        result: {
          ...r[6].result,
          authorConclusion: "PASS",
          facts: { archiveOutcome: { kind: "completed" } },
        },
      };
    },
    (r: DurableRunRecord[]) => {
      r[6] = {
        ...r[6],
        result: {
          ...r[6].result,
          facts: {
            archiveOutcome: {
              kind: "partial",
              effect: "recovery-required",
              retryable: false,
            },
          },
        },
      };
    },
    (r: DurableRunRecord[]) => {
      r[6] = { ...r[6], result: { ...r[6].result, facts: {} } };
    },
    (r: DurableRunRecord[]) => {
      r[6] = {
        ...r[6],
        context: {
          ...r[6].context,
          occurrence: { ...r[6].context.occurrence, sequence: 22 },
        },
      };
    },
  ]) {
    const r = structuredClone(original);
    mutate(r);
    assert.throws(() =>
      archiveReviewSource(
        r,
        r.find((i) => i.context.runId === original.at(-1)!.context.runId)!,
      ),
    );
  }
});
test("candidateGit has closed path/OID/settings/index shapes without coercion", () => {
  const value = {
    version: 1,
    objectFormat: "sha1",
    settings: { autocrlf: "false", eol: "native", safecrlf: "warn" },
    files: {
      "a.txt": {
        rawSha256: "a".repeat(64),
        blobOid: "b".repeat(40),
        conversion: "identity",
        text: "auto",
        eol: "unspecified",
        indexBasis: { kind: "absent" },
      },
    },
  };
  assert.equal(isCandidateGit(value), true);
  const authored = record("apply", 5, null, {
    artifactHashes: { "a.txt": "a".repeat(64) },
    candidateGit: value,
  }).result;
  assert.equal(isRunResultRecord(authored), true);
  assert.equal(
    isRunResultRecord({
      ...authored,
      facts: { ...authored.facts, artifactHashes: { "a.txt": "f".repeat(64) } },
    }),
    false,
  );
  assert.equal(
    isRunResultRecord({
      ...authored,
      facts: {
        ...authored.facts,
        artifactHashes: {
          "a.txt": "a".repeat(64),
          "extra.txt": "e".repeat(64),
        },
      },
    }),
    false,
  );
  for (const invalid of [
    { ...value, version: 2 },
    { ...value, extra: 0 },
    { ...value, files: {} },
    { ...value, settings: { ...value.settings, autocrlf: false } },
    { ...value, files: { "../outside": value.files["a.txt"] } },
    {
      ...value,
      files: { "a.txt": { ...value.files["a.txt"], blobOid: "c".repeat(64) } },
    },
    {
      ...value,
      files: {
        "a.txt": {
          ...value.files["a.txt"],
          indexBasis: {
            kind: "entry",
            mode: "120000",
            blobOid: "b".repeat(40),
            eol: "crlf",
          },
        },
      },
    },
  ])
    assert.equal(isCandidateGit(invalid), false);
  assert.equal(
    isCandidateGit({
      ...value,
      objectFormat: "sha256",
      files: {
        "a.txt": {
          ...value.files["a.txt"],
          blobOid: "b".repeat(64),
          indexBasis: {
            kind: "entry",
            mode: "100755",
            blobOid: "c".repeat(64),
            eol: "mixed",
          },
        },
      },
    }),
    true,
  );
});
