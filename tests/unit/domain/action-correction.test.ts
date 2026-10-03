import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { correctAction } from "../../../src/cli/action-correct.js";
import { parseActionCommandRequest } from "../../../src/cli/action-request.js";
import {
  readEffectiveRun,
  runMaterialLocation,
  sha256,
} from "../../../src/cli/run-effective-facts.js";
import {
  writeDurableRun,
  type JsonObject,
} from "../../../src/domain/run-result-persistence.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import { contextFixture } from "./action-context-fixture.js";
import { parseFoundationCliRequestJson } from "../../../src/cli/request.js";
import { checkpointCandidateTree } from "../../../src/internal/checkpoint-candidate-tree.js";
import { reviewedCheckpointCandidate } from "../../../src/internal/reviewed-checkpoint-candidate.js";
import { directoryHashes } from "../../../src/internal/archive-file-identities.js";

async function correctionFixture(authorMissing = false, reviewMissing = true) {
  const fixture = await contextFixture();
  const target = {
    repositoryRoot: fixture.repositoryRoot,
    flowkitHome: fixture.flowkitHome,
    deliveryId: "delivery-one",
    changeId: "change-one",
  };
  await gitBytes(target.repositoryRoot, ["init"]);
  await writeFile(
    path.join(target.repositoryRoot, ".gitattributes"),
    ".flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
  );
  await writeFile(
    path.join(target.repositoryRoot, "candidate.txt"),
    "candidate\n",
  );
  const hashes = { "candidate.txt": sha256(Buffer.from("candidate\n")) };
  const authorId = "20261003-005-apply";
  const manifest = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${authorId}/candidate.json`;
  const bytes = Buffer.from(JSON.stringify({ artifactHashes: hashes }) + "\n");
  await mkdir(path.dirname(path.join(target.repositoryRoot, manifest)), {
    recursive: true,
  });
  await writeFile(path.join(target.repositoryRoot, manifest), bytes);
  let previous: string | null = null;
  const actions = [
    "explore",
    "review-explore",
    "propose",
    "review-propose",
    "apply",
    "review-apply",
  ] as const;
  for (const [index, actionId] of actions.entries()) {
    const occurrence = { date: "20261003", sequence: index + 1, actionId };
    const runId = `20261003-${String(index + 1).padStart(3, "0")}-${actionId}`;
    const actionIdentity = {
      deliveryId: target.deliveryId,
      changeId: target.changeId,
      actionId,
    };
    const reviewer = actionId.startsWith("review-");
    let facts: JsonObject = {};
    if (actionId === "apply")
      facts = {
        ...(authorMissing ? {} : { artifactHashes: hashes }),
        proofRefs: [
          {
            path: manifest,
            bytes: bytes.length,
            sha256: sha256(bytes),
            deliveryId: target.deliveryId,
            changeId: target.changeId,
            runId,
            purpose: "synthetic original candidate manifest",
          },
        ],
      };
    if (actionId === "review-apply")
      facts = {
        artifactHashes: hashes,
        ...(reviewMissing ? {} : { reviewedRunId: previous }),
      };
    await writeDurableRun(
      { ...target, changeStartSequence: 1, occurrence },
      {
        actionMarkdown:
          "# Synthetic correction fixture; no independent review claim\n",
        context: {
          runId,
          occurrence,
          actionIdentity,
          role: reviewer ? "reviewer" : "author",
          lifecycleState: "terminal",
          ownerAuthority: null,
          previousRunId: previous,
        },
        result: {
          runId,
          actionIdentity,
          authorConclusion: reviewer ? null : "PASS",
          reviewerVerdict: reviewer ? "approved" : null,
          verificationVerdict: null,
          nextBoundary: null,
          facts,
        },
      },
    );
    previous = runId;
  }
  const ownerAuthority = {
    ref: `owner:${"c".repeat(64)}`,
    decision: "correct-run-metadata",
    deliveryId: target.deliveryId,
    changeId: target.changeId,
    scope: ["correct-run-metadata"],
    sourceRef: "synthetic-owner-correction-test",
  };
  return {
    ...fixture,
    target,
    hashes,
    manifest,
    authorId,
    reviewId: previous!,
    ownerAuthority,
  };
}

test("Reviewer correction appends once, replays read-only, rejects conflicts and preserves all original bytes", async () => {
  const f = await correctionFixture();
  try {
    const original = await runMaterialLocation(f.target, f.reviewId);
    const input = {
      ...f.target,
      runId: f.reviewId,
      role: "reviewer",
      ownerAuthority: f.ownerAuthority,
      expectedRunHashes: original.originalHashes,
      additions: { reviewedRunId: f.authorId },
      candidateEvidenceRef: null,
    };
    const parsed = parseActionCommandRequest("action correct", input);
    assert.equal(parsed.command, "action correct");
    if (parsed.command !== "action correct") throw Error("unreachable");
    const first = await correctAction(parsed.request, f.installation);
    assert.equal(first.duplicate, false);
    const correctionFile = path.join(f.repositoryRoot, first.correctionRef!);
    const saved = await readFile(correctionFile);
    assert.equal(
      (await correctAction(parsed.request, f.installation)).duplicate,
      true,
    );
    assert.deepEqual(await readFile(correctionFile), saved);
    assert.deepEqual(
      (await runMaterialLocation(f.target, f.reviewId)).originalHashes,
      original.originalHashes,
    );
    assert.equal(
      (await readEffectiveRun(f.target, f.reviewId)).effectiveFacts
        .reviewedRunId,
      f.authorId,
    );
    const bad = parseActionCommandRequest("action correct", {
      ...input,
      additions: { reviewedAuthorRunId: f.authorId },
    });
    if (bad.command !== "action correct") throw Error("unreachable");
    await assert.rejects(
      correctAction(bad.request, f.installation),
      /Existing correction differs/,
    );
    await writeFile(
      correctionFile,
      saved.toString().replace(f.authorId, "20261003-001-explore"),
    );
    await assert.rejects(readEffectiveRun(f.target, f.reviewId));
  } finally {
    await f.cleanup();
  }
});

test("Author correction requires original manifest and a consistent direct Review, never current worktree alone", async () => {
  const f = await correctionFixture(true, false);
  try {
    const original = await runMaterialLocation(f.target, f.authorId);
    const input = {
      ...f.target,
      runId: f.authorId,
      role: "author",
      ownerAuthority: f.ownerAuthority,
      expectedRunHashes: original.originalHashes,
      additions: { artifactHashes: f.hashes },
      candidateEvidenceRef: f.manifest,
    };
    const parsed = parseActionCommandRequest("action correct", input);
    if (parsed.command !== "action correct") throw Error("unreachable");
    const missing = { ...parsed.request, candidateEvidenceRef: null };
    await assert.rejects(
      correctAction(missing, f.installation),
      /original candidate manifest/,
    );
    const result = await correctAction(parsed.request, f.installation);
    assert.equal(result.effect, "confirmed");
    assert.deepEqual(
      (await readEffectiveRun(f.target, f.authorId)).effectiveFacts
        .artifactHashes,
      f.hashes,
    );
    assert.deepEqual(
      (await runMaterialLocation(f.target, f.authorId)).originalHashes,
      original.originalHashes,
    );
    await writeFile(path.join(f.repositoryRoot, f.manifest), "{}\n");
    await assert.rejects(readEffectiveRun(f.target, f.authorId));
  } finally {
    await f.cleanup();
  }
});

test("correction closed parser and current Role/hash reject misuse before any append", async () => {
  const f = await correctionFixture();
  try {
    const original = await runMaterialLocation(f.target, f.reviewId);
    const input = {
      ...f.target,
      runId: f.reviewId,
      role: "reviewer",
      ownerAuthority: f.ownerAuthority,
      expectedRunHashes: original.originalHashes,
      additions: { reviewedRunId: f.authorId },
      candidateEvidenceRef: null,
    };
    for (const invalid of [
      { ...input, unexpected: true },
      { ...input, role: "owner" },
      { ...input, additions: { reviewerVerdict: "approved" } },
      {
        ...input,
        ownerAuthority: { ...f.ownerAuthority, scope: ["revise-apply"] },
      },
      {
        ...input,
        ownerAuthority: { ...f.ownerAuthority, sourceRef: "bad source" },
      },
      {
        ...input,
        ownerAuthority: { ...f.ownerAuthority, changeId: "other-change" },
      },
      { ...input, expectedRunHashes: { "action.md": "0".repeat(64) } },
    ])
      assert.throws(() => parseActionCommandRequest("action correct", invalid));
    assert.throws(() =>
      parseFoundationCliRequestJson('{"role":"author","role":"reviewer"}'),
    );
    const parse = (value: unknown) => {
      const parsed = parseActionCommandRequest("action correct", value);
      if (parsed.command !== "action correct") throw Error("unreachable");
      return parsed.request;
    };
    for (const invalid of [
      { ...input, role: "author" },
      {
        ...input,
        expectedRunHashes: {
          ...original.originalHashes,
          "action.md": "0".repeat(64),
        },
      },
      { ...input, additions: { reviewedRunId: "20261003-001-explore" } },
      { ...input, additions: { artifactHashes: f.hashes } },
    ])
      await assert.rejects(correctAction(parse(invalid), f.installation));
    assert.deepEqual(
      (await runMaterialLocation(f.target, f.reviewId)).originalHashes,
      original.originalHashes,
    );
    const directory = path.dirname(
      path.join(f.repositoryRoot, original.correctionPath),
    );
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "partial.json"), "{}\n");
    await assert.rejects(
      correctAction(parse(input), f.installation),
      /Partial/,
    );
    assert.deepEqual(
      (await runMaterialLocation(f.target, f.reviewId)).originalHashes,
      original.originalHashes,
    );
  } finally {
    await f.cleanup();
  }
});

test("Author correction checkpoint requires original Run, manifest and supplement in the candidate tree", async () => {
  const f = await correctionFixture(true, false);
  try {
    const original = await runMaterialLocation(f.target, f.authorId);
    const parsed = parseActionCommandRequest("action correct", {
      ...f.target,
      runId: f.authorId,
      role: "author",
      ownerAuthority: f.ownerAuthority,
      expectedRunHashes: original.originalHashes,
      additions: { artifactHashes: f.hashes },
      candidateEvidenceRef: f.manifest,
    });
    if (parsed.command !== "action correct") throw Error("unreachable");
    const corrected = await correctAction(parsed.request, f.installation);
    const prefix = ".flowkit/runs/delivery-one/001-change-one";
    const runFiles = Object.keys(
      (await directoryHashes(f.repositoryRoot, prefix))!,
    ).map((suffix) => `${prefix}/${suffix}`);
    const paths = [
      ...runFiles,
      corrected.correctionRef!,
      "candidate.txt",
      f.manifest,
    ];
    for (const excluded of [
      f.manifest,
      corrected.correctionRef!,
      ...runFiles.filter((file) => file.endsWith(`${f.authorId}/result.json`)),
    ]) {
      const projection = await checkpointCandidateTree(
        f.repositoryRoot,
        paths.filter((file) => file !== excluded),
      );
      await assert.rejects(
        reviewedCheckpointCandidate(
          f.repositoryRoot,
          projection,
          f.target,
          paths,
        ),
      );
    }
    const valid = await checkpointCandidateTree(f.repositoryRoot, paths);
    const expected = await reviewedCheckpointCandidate(
      f.repositoryRoot,
      valid,
      f.target,
      paths,
    );
    assert.equal(
      expected.get(f.manifest),
      sha256(await readFile(path.join(f.repositoryRoot, f.manifest))),
    );
    const unknownCorrection = corrected.correctionRef!.replace(
      `/corrections/${f.authorId}/`,
      "/corrections/unknown-run/",
    );
    await mkdir(path.dirname(path.join(f.repositoryRoot, unknownCorrection)), {
      recursive: true,
    });
    await writeFile(path.join(f.repositoryRoot, unknownCorrection), "{}\n");
    const extraPaths = [...paths, unknownCorrection];
    await assert.rejects(
      reviewedCheckpointCandidate(
        f.repositoryRoot,
        await checkpointCandidateTree(f.repositoryRoot, extraPaths),
        null,
        extraPaths,
      ),
      /no immutable original Run/,
    );
    assert.deepEqual(
      (await runMaterialLocation(f.target, f.authorId)).originalHashes,
      original.originalHashes,
    );
    await writeFile(
      path.join(f.repositoryRoot, original.runRoot, "action.md"),
      "original tampered\n",
    );
    await assert.rejects(
      readEffectiveRun(f.target, f.authorId),
      /identity\/hash drift/,
    );
  } finally {
    await f.cleanup();
  }
});

for (const candidate of ["conflicting", "omitted"] as const)
  test(`Author correction cannot inherit a ${candidate} direct Reviewer candidate`, async () => {
    const f = await correctionFixture(true, false);
    try {
      const author = await runMaterialLocation(f.target, f.authorId);
      const review = await runMaterialLocation(f.target, f.reviewId);
      const changed = {
        ...review.record.result,
        facts: {
          ...review.record.result.facts,
          artifactHashes: { "candidate.txt": "0".repeat(64) },
        },
      };
      if (candidate === "omitted")
        delete (changed.facts as Record<string, unknown>).artifactHashes;
      await writeFile(
        path.join(f.repositoryRoot, review.runRoot, "result.json"),
        JSON.stringify(changed) + "\n",
      );
      const parsed = parseActionCommandRequest("action correct", {
        ...f.target,
        runId: f.authorId,
        role: "author",
        ownerAuthority: f.ownerAuthority,
        expectedRunHashes: author.originalHashes,
        additions: { artifactHashes: f.hashes },
        candidateEvidenceRef: f.manifest,
      });
      if (parsed.command !== "action correct") throw Error("unreachable");
      await assert.rejects(
        correctAction(parsed.request, f.installation),
        /inconsistent or unproven/,
      );
      await assert.rejects(
        readFile(path.join(f.repositoryRoot, author.correctionPath)),
        /ENOENT/,
      );
      assert.deepEqual(
        (await runMaterialLocation(f.target, f.authorId)).originalHashes,
        author.originalHashes,
      );
    } finally {
      await f.cleanup();
    }
  });
