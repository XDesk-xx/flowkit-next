import assert from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { executionFixture } from "./execution-recovery-fixture.js";
import { limitCli } from "./lifecycle-limit-fixture.js";
import { sha256 } from "../../../src/cli/run-effective-facts.js";
import type { JsonObject } from "../../../src/domain/run-result-persistence.js";

for (const [stage, index] of [
  ["explore", -1],
  ["propose", 1],
  ["apply", 3],
] as const)
  test(`${stage} FAIL and its revise FAIL create exact new Owner-authorized successors across processes`, async () => {
    const f = await executionFixture(index);
    const call = limitCli(f);
    const revise = `revise-${stage}`;
    const owner = {
      ref: `owner:${"c".repeat(64)}`,
      decision: "revise-action",
      deliveryId: f.base.deliveryId,
      changeId: f.base.changeId,
      scope: [revise],
      sourceRef: "synthetic:explicit-owner-limit-test",
    };
    try {
      const original = await call("action start", {
        ...f.base,
        actionId: stage,
        role: "author",
      });
      async function finish(
        runId: string,
        actionId: string,
        conclusion: "FAIL" | "PASS",
        facts: JsonObject = { proofRefs: [] },
      ) {
        return call("action finish", {
          ...f.base,
          runId,
          role: "author",
          terminal: true,
          result: {
            runId,
            actionIdentity: {
              deliveryId: f.base.deliveryId,
              changeId: f.base.changeId,
              actionId,
            },
            authorConclusion: conclusion,
            reviewerVerdict: null,
            verificationVerdict: null,
            nextBoundary: conclusion === "PASS" ? `review-${stage}` : null,
            facts,
          },
        });
      }
      await finish(original.runId, stage, "FAIL");
      const originalBytes = await Promise.all(
        ["action.md", "context.json", "result.json"].map((name) =>
          readFile(path.join(original.directory, name)),
        ),
      );
      const query = await call("next", f.base);
      assert.equal(
        query.decision.reason,
        "unrecognized-or-unsuccessful-author-outcome",
      );
      const unauthorized = await call(
        "action start",
        { ...f.base, actionId: revise, role: "author" },
        false,
      );
      assert.equal(unauthorized.error.kind, "policy-boundary-mismatch");
      const corrected = await call("action start", {
        ...f.base,
        actionId: revise,
        role: "author",
        ownerAuthority: owner,
      });
      assert.equal(corrected.effect, "started");
      const descriptor = JSON.parse(
        (
          await readFile(path.join(corrected.directory, "action.md"), "utf8")
        ).slice("# Action started\n\n".length),
      );
      assert.equal(descriptor.preparedContext.previousRunId, original.runId);
      assert.deepEqual(descriptor.preparedContext.ownerAuthority, owner);
      assert.equal(
        (await call("action inspect", { ...f.base, runId: corrected.runId }))
          .completeness,
        "descriptor-only",
      );
      await finish(corrected.runId, revise, "FAIL");
      const correctedBytes = await Promise.all(
        ["action.md", "context.json", "result.json"].map((name) =>
          readFile(path.join(corrected.directory, name)),
        ),
      );
      const second = await call("action start", {
        ...f.base,
        actionId: revise,
        role: "author",
        ownerAuthority: owner,
      });
      const secondDescriptor = JSON.parse(
        (
          await readFile(path.join(second.directory, "action.md"), "utf8")
        ).slice("# Action started\n\n".length),
      );
      assert.equal(
        secondDescriptor.preparedContext.previousRunId,
        corrected.runId,
      );
      const before = await readFile(path.join(second.directory, "action.md"));
      await writeFile(
        path.join(second.directory, "action.md"),
        "# Action started\n\n" +
          JSON.stringify({
            ...secondDescriptor,
            preparedContext: {
              ...secondDescriptor.preparedContext,
              previousRunId: original.runId,
            },
          }),
      );
      assert.equal(
        (await call("action inspect", { ...f.base, runId: second.runId }))
          .effect,
        "blocked",
      );
      await writeFile(path.join(second.directory, "action.md"), before);
      assert.equal(
        (await call("action inspect", { ...f.base, runId: second.runId }))
          .effect,
        "observed",
      );
      await assert.rejects(
        call("action start", {
          ...f.base,
          actionId: revise,
          role: "author",
          ownerAuthority: owner,
        }),
      );
      const changedPath =
        stage === "explore"
          ? `${f.source}/explore.md`
          : stage === "propose"
            ? `${f.source}/design.md`
            : "candidate.txt";
      const changedBytes = Buffer.from(
        `# Actual isolated ${revise} correction\n`,
      );
      await writeFile(path.join(f.repositoryRoot, changedPath), changedBytes);
      const correctedHashes = {
        ...(stage === "propose" ? f.planning : f.candidate),
        [changedPath]: sha256(changedBytes),
      };
      const facts: JsonObject =
        stage === "explore"
          ? {
              projectOrdinal: 1,
              exploreArtifact: `${f.source}/explore.md`,
              exploreSha256: sha256(
                await readFile(
                  path.join(f.repositoryRoot, f.source, "explore.md"),
                ),
              ),
              proofRefs: [],
            }
          : {
              artifactHashes: correctedHashes,
              proofRefs: [],
            };
      assert.equal(
        (await finish(second.runId, revise, "PASS", facts)).effect,
        "confirmed",
      );
      assert.deepEqual((await call("next", f.base)).decision, {
        kind: "ready-action",
        actionId: `review-${stage}`,
      });
      assert.equal(
        (await call("action inspect", { ...f.base, runId: second.runId }))
          .completeness,
        "complete",
      );
      for (const [directory, bytes] of [
        [original.directory, originalBytes],
        [corrected.directory, correctedBytes],
      ] as const)
        assert.deepEqual(
          await Promise.all(
            ["action.md", "context.json", "result.json"].map((name) =>
              readFile(path.join(directory, name)),
            ),
          ),
          bytes,
        );
      assert.equal(
        (await readdir(path.dirname(second.directory))).length,
        index + 4,
      );
      const noRetryPass = await call(
        "action start",
        { ...f.base, actionId: revise, role: "author", ownerAuthority: owner },
        false,
      );
      assert.equal(noRetryPass.error.kind, "policy-boundary-mismatch");
      const review = await call("action start", {
        ...f.base,
        actionId: `review-${stage}`,
        role: "reviewer",
      });
      const reviewDescriptor = JSON.parse(
        (
          await readFile(path.join(review.directory, "action.md"), "utf8")
        ).slice("# Action started\n\n".length),
      );
      assert.equal(
        reviewDescriptor.preparedContext.previousRunId,
        second.runId,
      );
    } finally {
      await f.cleanup();
    }
  });
