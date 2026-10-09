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

test("a descriptor-only Run finishes with all 254 long proof references and remains reviewable", async () => {
  const f = await executionFixture(3);
  const call = limitCli(f, 360_000);
  try {
    const started = await call("action start", {
      ...f.base,
      actionId: "apply",
      role: "author",
    });
    const descriptor = await readFile(
      path.join(started.directory, "action.md"),
    );
    const proofRoot = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${started.runId}`;
    await mkdir(path.join(f.repositoryRoot, proofRoot), { recursive: true });
    const proofRefs = [];
    for (let i = 0; i < 254; i++) {
      const relative = `${proofRoot}/${String(i).padStart(3, "0")}-${"long-proof-name-".repeat(8)}.stdout.txt`;
      const bytes = Buffer.from(`proof ${i}\r\n`);
      await writeFile(path.join(f.repositoryRoot, relative), bytes);
      proofRefs.push({
        path: relative,
        bytes: bytes.length,
        sha256: sha256(bytes),
        deliveryId: f.base.deliveryId,
        changeId: f.base.changeId,
        runId: started.runId,
        purpose:
          "complete isolated proof directory, not an actual project verdict; ".repeat(
            3,
          ),
      });
    }
    const request = {
      ...f.base,
      runId: started.runId,
      role: "author",
      terminal: true,
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
        facts: {
          artifactHashes: {
            "candidate.txt": sha256(
              await readFile(path.join(f.repositoryRoot, "candidate.txt")),
            ),
          },
          proofRefs,
        },
      },
    };
    assert.ok(
      Buffer.byteLength(JSON.stringify(request.result.facts)) > 126_881,
    );
    const bad = {
      ...request,
      result: {
        ...request.result,
        facts: { ...request.result.facts, proofRefs: [] },
      },
    };
    const rejected = await call("action finish", bad, false);
    assert.equal(rejected.error.kind, "proof-invalid");
    assert.deepEqual(await readdir(started.directory), ["action.md"]);
    assert.deepEqual(
      await readFile(path.join(started.directory, "action.md")),
      descriptor,
    );
    const changedHash = await call(
      "action finish",
      {
        ...request,
        result: {
          ...request.result,
          facts: {
            ...request.result.facts,
            proofRefs: proofRefs.map((ref, i) =>
              i === 0 ? { ...ref, sha256: "0".repeat(64) } : ref,
            ),
          },
        },
      },
      false,
    );
    assert.equal(changedHash.error.kind, "proof-invalid");
    assert.deepEqual(await readdir(started.directory), ["action.md"]);
    const finished = await call("action finish", request);
    assert.equal(finished.effect, "confirmed");
    const saved = await runMaterialLocation(f.base, started.runId);
    assert.deepEqual(saved.record.result.facts.proofRefs, proofRefs);
    const resultBytes = await readFile(
      path.join(started.directory, "result.json"),
    );
    assert.deepEqual(
      await readFile(path.join(started.directory, "action.md")),
      descriptor,
    );
    const review = await call("action start", {
      ...f.base,
      actionId: "review-apply",
      role: "reviewer",
    });
    assert.equal(review.effect, "started");
    assert.deepEqual(
      await readFile(path.join(started.directory, "result.json")),
      resultBytes,
    );
  } finally {
    await f.cleanup();
  }
});
