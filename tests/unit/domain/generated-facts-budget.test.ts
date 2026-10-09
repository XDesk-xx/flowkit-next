import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { executionFixture } from "./execution-recovery-fixture.js";
import { limitCli } from "./lifecycle-limit-fixture.js";
import {
  sha256,
  runMaterialLocation,
} from "../../../src/cli/run-effective-facts.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import {
  measureRunFacts,
  isRunResultRecord,
  MAX_RUN_FACTS_JSON_BYTES,
} from "../../../src/domain/run-result-persistence.js";

async function candidates(root: string, count: number) {
  const hashes: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    const relative = `f${i}`;
    const bytes = Buffer.from(`candidate ${i}\n`);
    await writeFile(path.join(root, relative), bytes);
    hashes[relative] = sha256(bytes);
  }
  return hashes;
}

test("generated facts byte/node overflow leaves descriptor and proof intact, then same Run finishes corrected input", async () => {
  const f = await executionFixture(3);
  const call = limitCli(f);
  try {
    const hashes = await candidates(f.repositoryRoot, 100);
    const started = await call("action start", {
      ...f.base,
      actionId: "apply",
      role: "author",
    });
    const descriptor = await readFile(
      path.join(started.directory, "action.md"),
    );
    const relative = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${started.runId}/stdout.txt`;
    await mkdir(path.dirname(path.join(f.repositoryRoot, relative)), {
      recursive: true,
    });
    const raw = Buffer.from("retained raw proof\r\n");
    await writeFile(path.join(f.repositoryRoot, relative), raw);
    const proofRefs = [
      {
        path: relative,
        bytes: raw.length,
        sha256: sha256(raw),
        runId: started.runId,
        deliveryId: f.base.deliveryId,
        changeId: f.base.changeId,
        purpose: "isolated budget probe",
      },
    ];
    const request = {
      ...f.base,
      runId: started.runId,
      terminal: true,
      role: "author",
      result: {
        runId: started.runId,
        actionIdentity: {
          deliveryId: f.base.deliveryId,
          changeId: f.base.changeId,
          actionId: "apply",
        },
        authorConclusion: "PASS",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: "review-apply",
        facts: { artifactHashes: hashes, proofRefs },
      },
    };
    for (const [padding, dimension] of [
      ["x".repeat(MAX_RUN_FACTS_JSON_BYTES - 20_000), "bytes"],
      [Array(3_900).fill(0), "nodes"],
    ] as const) {
      const oversized = {
        ...request,
        result: {
          ...request.result,
          facts: { ...request.result.facts, padding },
        },
      };
      assert.equal(measureRunFacts(oversized.result.facts).valid, true);
      assert.ok(Buffer.byteLength(JSON.stringify(oversized)) < 1_048_576);
      const rejected = await call("action finish", oversized, false);
      assert.equal(rejected.error.kind, "result-admission-rejected");
      assert.equal(rejected.runId, started.runId);
      assert.equal(rejected.effect, "blocked");
      assert.equal(rejected.error.budget.subject, "result-facts");
      assert.equal(rejected.error.budget.dimension, dimension);
      assert.deepEqual(await readdir(started.directory), ["action.md"]);
      assert.deepEqual(
        await readFile(path.join(started.directory, "action.md")),
        descriptor,
      );
      assert.deepEqual(
        await readFile(path.join(f.repositoryRoot, relative)),
        raw,
      );
    }
    assert.equal((await call("action finish", request)).effect, "confirmed");
    assert.equal(
      (await call("action inspect", { ...f.base, runId: started.runId }))
        .completeness,
      "complete",
    );
  } finally {
    await f.cleanup();
  }
});

for (const [count, indexed] of [
  [206, false],
  [164, true],
] as const)
  test(`bounded ${indexed ? "entry" : "absent"} candidate of ${count} files is accepted by finish/readback/Review/Archive; immutable oversized readback rejects`, async () => {
    const f = await executionFixture(3);
    const call = limitCli(f);
    try {
      const hashes = await candidates(f.repositoryRoot, count);
      if (indexed)
        await gitBytes(f.repositoryRoot, ["add", "--", ...Object.keys(hashes)]);
      const started = await call("action start", {
        ...f.base,
        actionId: "apply",
        role: "author",
      });
      await call("action finish", {
        ...f.base,
        runId: started.runId,
        terminal: true,
        role: "author",
        result: {
          runId: started.runId,
          actionIdentity: {
            deliveryId: f.base.deliveryId,
            changeId: f.base.changeId,
            actionId: "apply",
          },
          authorConclusion: "PASS",
          reviewerVerdict: null,
          verificationVerdict: null,
          nextBoundary: "review-apply",
          facts: { artifactHashes: hashes, proofRefs: [] },
        },
      });
      const saved = await runMaterialLocation(f.base, started.runId);
      assert.ok(
        Buffer.byteLength(JSON.stringify(saved.record.result.facts)) < 65_536,
      );
      assert.equal(isRunResultRecord(saved.record.result), true);
      assert.equal(
        Object.values(
          (
            saved.record.result.facts.candidateGit as {
              files: Record<string, { indexBasis: { kind: string } }>;
            }
          ).files,
        )[0].indexBasis.kind,
        indexed ? "entry" : "absent",
      );
      const resultFile = path.join(started.directory, "result.json");
      const before = await readFile(resultFile);
      const oversized = {
        ...saved.record.result,
        facts: { ...saved.record.result.facts, tooMany: Array(4_097).fill(0) },
      };
      assert.equal(isRunResultRecord(oversized), false);
      await writeFile(resultFile, JSON.stringify(oversized));
      await assert.rejects(runMaterialLocation(f.base, started.runId));
      const denied = await call(
        "action start",
        { ...f.base, actionId: "review-apply", role: "reviewer" },
        false,
      );
      assert.equal(denied.kind, "error");
      await writeFile(resultFile, before);
      const review = await call("action start", {
        ...f.base,
        actionId: "review-apply",
        role: "reviewer",
      });
      await call("action finish", {
        ...f.base,
        runId: review.runId,
        terminal: true,
        role: "reviewer",
        result: {
          runId: review.runId,
          actionIdentity: {
            deliveryId: f.base.deliveryId,
            changeId: f.base.changeId,
            actionId: "review-apply",
          },
          authorConclusion: null,
          reviewerVerdict: "approved",
          verificationVerdict: null,
          nextBoundary: "archive",
          facts: { reviewedRunId: started.runId, proofRefs: [] },
        },
      });
      const archive = await call("action start", {
        ...f.base,
        actionId: "archive",
        role: "author",
      });
      assert.equal(archive.effect, "started");
      assert.deepEqual(await readFile(resultFile), before);
      assert.deepEqual(await readdir(archive.directory), ["action.md"]);
    } finally {
      await f.cleanup();
    }
  });
