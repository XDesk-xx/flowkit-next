import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { executionFixture } from "./execution-recovery-fixture.js";

for (const [stage, authorIndex] of [
  ["explore", 0],
  ["propose", 2],
  ["apply", 4],
] as const) {
  test(`${stage} Review rejected/null persists across processes and exact Owner revise preserves verdict`, async () => {
    const f = await executionFixture(authorIndex);
    try {
      const started = await f.call("action start", {
        ...f.base,
        actionId: `review-${stage}`,
        role: "reviewer",
      });
      const runId = started.runId;
      const result = {
        runId,
        actionIdentity: {
          deliveryId: f.base.deliveryId,
          changeId: f.base.changeId,
          actionId: `review-${stage}`,
        },
        authorConclusion: null,
        reviewerVerdict: "rejected",
        verificationVerdict: null,
        nextBoundary: null,
        facts: { reviewedRunId: f.lastId, proofRefs: [] },
      };
      const finish = {
        ...f.base,
        runId,
        role: "reviewer",
        terminal: true,
        result,
      };
      for (const facts of [
        { proofRefs: [] },
        {
          reviewedRunId: "20260930-001-explore",
          reviewedAuthorRunId: "20260930-003-propose",
          proofRefs: [],
        },
        {
          reviewedRunId: f.lastId,
          artifactHashes: { "candidate.txt": "0".repeat(64) },
          proofRefs: [],
        },
      ]) {
        await assert.rejects(
          f.call("action finish", { ...finish, result: { ...result, facts } }),
        );
        assert.deepEqual(await readdir(started.directory), ["action.md"]);
      }
      for (const invalid of [
        { reviewerVerdict: "unknown" },
        { nextBoundary: `revise-${stage}` },
        { authorConclusion: "PASS" },
      ]) {
        await assert.rejects(
          f.call("action finish", {
            ...finish,
            result: { ...result, ...invalid },
          }),
        );
        assert.deepEqual(await readdir(started.directory), ["action.md"]);
      }
      assert.equal((await f.call("action finish", finish)).effect, "confirmed");
      assert.equal(
        (await f.call("next", f.base)).decision.reason,
        "review-rejected",
      );
      const bytes = await Promise.all(
        ["action.md", "context.json", "result.json"].map((name) =>
          readFile(path.join(started.directory, name)),
        ),
      );
      const revise = { ...f.base, actionId: `revise-${stage}`, role: "author" };
      await assert.rejects(f.call("action start", revise));
      const ownerAuthority = {
        ref: `owner:${"d".repeat(64)}`,
        decision: "revise-action",
        deliveryId: f.base.deliveryId,
        changeId: f.base.changeId,
        scope: [`revise-${stage}`],
        sourceRef: "synthetic:explicit-owner-revise",
      };
      await assert.rejects(
        f.call("action start", {
          ...revise,
          ownerAuthority: { ...ownerAuthority, changeId: "other-change" },
        }),
      );
      await assert.rejects(
        f.call("action start", {
          ...revise,
          actionId: stage === "apply" ? "revise-explore" : "revise-apply",
          ownerAuthority,
        }),
      );
      const revised = await f.call("action start", {
        ...revise,
        ownerAuthority,
      });
      assert.equal(revised.effect, "started");
      assert.match(
        await readFile(path.join(revised.directory, "action.md"), "utf8"),
        new RegExp(runId),
      );
      assert.deepEqual(
        await Promise.all(
          ["action.md", "context.json", "result.json"].map((name) =>
            readFile(path.join(started.directory, name)),
          ),
        ),
        bytes,
      );
    } finally {
      await f.cleanup();
    }
  });
}
