import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { contextFixture } from "./action-context-fixture.js";
import { inspectActionProof } from "../../../src/cli/action-proof.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

const run = promisify(execFile);
const entry = fileURLToPath(
  new URL("../../../src/cli/entrypoint.ts", import.meta.url),
);
const cliEntryArgs = (...args: string[]) => ["--import", "tsx", entry, ...args];

test("fixed CLI starts and finishes one Author Run across processes, then confirms exact retry", async () => {
  const fixture = await contextFixture();
  try {
    await gitBytes(fixture.repositoryRoot, ["init"]);
    await writeFile(
      path.join(fixture.repositoryRoot, ".gitattributes"),
      ".flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    const manifest = path.join(
      fixture.repositoryRoot,
      "openspec/delivery-groups/delivery-one.yaml",
    );
    const original = JSON.parse(await readFile(manifest, "utf8")) as Record<
      string,
      unknown
    >;
    const changes = original.changes as Record<string, unknown>[];
    changes[0].projectOrdinal = 1;
    await writeFile(manifest, JSON.stringify(original));
    const base = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const request = path.join(fixture.repositoryRoot, "start.json");
    await writeFile(
      request,
      JSON.stringify({ ...base, actionId: "explore", role: "author" }),
    );
    const cli = async (args: string[]) => {
      const result = await run(process.execPath, cliEntryArgs(...args), {
        cwd: path.dirname(entry),
        timeout: 30_000,
      });
      return JSON.parse(result.stdout) as Record<string, unknown>;
    };
    const started = await cli(["action", "start", "--input", request]);
    assert.equal(started.effect, "started");
    const runId = started.runId as string;
    assert.deepEqual(await readdir(started.directory as string), ["action.md"]);
    const note = path.join(
      fixture.repositoryRoot,
      "openspec/changes/change-one/explore.md",
    );
    await mkdir(path.dirname(note), { recursive: true });
    await writeFile(
      note,
      "# Exact Author probe\n\nObserved a persisted start in another process.\n",
    );
    const sha = createHash("sha256")
      .update(await readFile(note))
      .digest("hex");
    const result = {
      runId,
      actionIdentity: {
        deliveryId: "delivery-one",
        changeId: "change-one",
        actionId: "explore",
      },
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-explore",
      facts: {
        projectOrdinal: 1,
        exploreArtifact: "openspec/changes/change-one/explore.md",
        exploreSha256: sha,
        proofRefs: [],
      },
    };
    const finish = path.join(fixture.repositoryRoot, "finish.json");
    await writeFile(
      finish,
      JSON.stringify({
        ...base,
        runId,
        role: "author",
        terminal: true,
        result,
      }),
    );
    const first = await cli(["action", "finish", "--input", finish]);
    assert.equal(first.effect, "confirmed");
    assert.equal(first.duplicate, false);
    const repeat = await cli(["action", "finish", "--input", finish]);
    assert.equal(repeat.effect, "confirmed");
    assert.equal(repeat.duplicate, true);
    const conflict = path.join(fixture.repositoryRoot, "conflict.json");
    await writeFile(
      conflict,
      JSON.stringify({
        ...base,
        runId,
        role: "author",
        terminal: true,
        result: { ...result, authorConclusion: "FAIL", nextBoundary: null },
      }),
    );
    await assert.rejects(
      cli(["action", "finish", "--input", conflict]),
      (error: unknown) =>
        JSON.parse((error as { stdout?: string }).stdout ?? "{}").error
          ?.kind === "duplicate-finish-conflict",
    );
    const query = path.join(fixture.repositoryRoot, "query.json");
    await writeFile(query, JSON.stringify(base));
    const next = await cli(["next", "--input", query]);
    assert.deepEqual(next.decision, {
      kind: "ready-action",
      actionId: "review-explore",
    });
    const reviewStart = path.join(fixture.repositoryRoot, "review-start.json");
    await writeFile(
      reviewStart,
      JSON.stringify({ ...base, actionId: "review-explore", role: "reviewer" }),
    );
    const review = await cli(["action", "start", "--input", reviewStart]);
    assert.equal(review.effect, "started");
    const reviewId = review.runId as string;
    const failedFinish = async (verdict: string, boundary: string | null) => {
      const candidate = {
        runId: reviewId,
        actionIdentity: {
          ...result.actionIdentity,
          actionId: "review-explore",
        },
        authorConclusion: null,
        reviewerVerdict: verdict,
        verificationVerdict: null,
        nextBoundary: boundary,
        facts: { proofRefs: [] },
      };
      const file = path.join(
        fixture.repositoryRoot,
        `review-${verdict}-${boundary ?? "null"}.json`,
      );
      await writeFile(
        file,
        JSON.stringify({
          ...base,
          runId: reviewId,
          role: "reviewer",
          terminal: true,
          result: candidate,
        }),
      );
      try {
        await cli(["action", "finish", "--input", file]);
        assert.fail("invalid Reviewer outcome was accepted");
      } catch (error) {
        const stdout = (error as { stdout?: string }).stdout;
        const envelope = JSON.parse(stdout ?? "{}");
        assert.equal(envelope.error?.kind, "outcome-unsupported");
        if (verdict === "rejected") assert.equal(envelope.effect, "incomplete");
      }
    };
    await failedFinish("approved", "archive");
    await failedFinish("rejected", null);
    assert.deepEqual(await readdir(review.directory as string), ["action.md"]);
    const proofPath = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${reviewId}/stdout.txt`;
    await mkdir(path.dirname(path.join(fixture.repositoryRoot, proofPath)), {
      recursive: true,
    });
    await writeFile(
      path.join(fixture.repositoryRoot, proofPath),
      Buffer.from([0, 13, 10, 255]),
    );
    const proofRequest = path.join(fixture.repositoryRoot, "proof.json");
    await writeFile(
      proofRequest,
      JSON.stringify({ ...base, runId: reviewId, path: proofPath }),
    );
    const proof = await cli(["proof", "inspect", "--input", proofRequest]);
    assert.equal(proof.effect, "confirmed");
    assert.equal(proof.bytes, 4);
    assert.equal(
      proof.sha256,
      createHash("sha256")
        .update(Buffer.from([0, 13, 10, 255]))
        .digest("hex"),
    );
    const extraPaths = Array.from({ length: 39 }, (_, index) =>
      proofPath.replace("stdout.txt", `extra-${index}.txt`),
    );
    for (const [index, relative] of extraPaths.entries())
      await writeFile(
        path.join(fixture.repositoryRoot, relative),
        `extra ${index}\n`,
      );
    const inspected = await Promise.all(
      [proofPath, ...extraPaths].map((relative) =>
        inspectActionProof(base, reviewId, relative),
      ),
    );
    assert.equal(inspected.length, 40);
    const currentRefs = await Promise.all(
      [proofPath, ...extraPaths].map(async (relative) => {
        const bytes = await readFile(
          path.join(fixture.repositoryRoot, relative),
        );
        return {
          path: relative,
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          deliveryId: "delivery-one",
          changeId: "change-one",
          runId: reviewId,
          purpose: "bounded fixture",
        };
      }),
    );
    const reviewResult = {
      runId: reviewId,
      actionIdentity: { ...result.actionIdentity, actionId: "review-explore" },
      authorConclusion: null,
      reviewerVerdict: "changes-requested",
      verificationVerdict: null,
      nextBoundary: "revise-explore",
      facts: { proofRefs: currentRefs },
    };
    for (const [name, refs] of [
      ["empty", []],
      ["one", currentRefs.slice(0, 1)],
    ] as const) {
      const file = path.join(fixture.repositoryRoot, `incomplete-${name}.json`);
      await writeFile(
        file,
        JSON.stringify({
          ...base,
          runId: reviewId,
          role: "reviewer",
          terminal: true,
          result: { ...reviewResult, facts: { proofRefs: refs } },
        }),
      );
      await assert.rejects(
        cli(["action", "finish", "--input", file]),
        (error: unknown) =>
          JSON.parse((error as { stdout?: string }).stdout ?? "{}").error
            ?.kind === "proof-invalid",
      );
      assert.deepEqual(await readdir(review.directory as string), [
        "action.md",
      ]);
    }
    const badProof = path.join(fixture.repositoryRoot, "bad-proof-finish.json");
    await writeFile(
      badProof,
      JSON.stringify({
        ...base,
        runId: reviewId,
        role: "reviewer",
        terminal: true,
        result: {
          runId: reviewId,
          actionIdentity: {
            ...result.actionIdentity,
            actionId: "review-explore",
          },
          authorConclusion: null,
          reviewerVerdict: "changes-requested",
          verificationVerdict: null,
          nextBoundary: "revise-explore",
          facts: {
            proofRefs: [
              {
                path: proofPath,
                bytes: 4,
                sha256: "0".repeat(64),
                deliveryId: "delivery-one",
                changeId: "change-one",
                runId: reviewId,
                purpose: "fixture",
              },
            ],
          },
        },
      }),
    );
    await assert.rejects(
      cli(["action", "finish", "--input", badProof]),
      (error: unknown) =>
        JSON.parse((error as { stdout?: string }).stdout ?? "{}").error
          ?.kind === "proof-invalid",
    );
    assert.deepEqual(await readdir(review.directory as string), ["action.md"]);
    const complete = path.join(
      fixture.repositoryRoot,
      "complete-proof-finish.json",
    );
    await writeFile(
      complete,
      JSON.stringify({
        ...base,
        runId: reviewId,
        role: "reviewer",
        terminal: true,
        result: reviewResult,
      }),
    );
    assert.equal(
      (await cli(["action", "finish", "--input", complete])).effect,
      "confirmed",
    );
    assert.equal((await readdir(review.directory as string)).length, 3);
  } finally {
    await fixture.cleanup();
  }
});

test("Propose finish rejects wrong planning hashes before writing and Review reads project-root paths", async () => {
  const fixture = await contextFixture();
  try {
    const root = fixture.repositoryRoot;
    await gitBytes(root, ["init"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    const manifest = path.join(
      root,
      "openspec/delivery-groups/delivery-one.yaml",
    );
    const data = JSON.parse(await readFile(manifest, "utf8")) as {
      changes: Record<string, unknown>[];
    };
    data.changes[0].projectOrdinal = 1;
    await writeFile(manifest, JSON.stringify(data));
    const base = {
      repositoryRoot: root,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const cli = async (command: string, value: unknown) => {
      const request = path.join(root, `request-${command}.json`);
      await writeFile(request, JSON.stringify(value));
      const result = await run(
        process.execPath,
        cliEntryArgs("action", command, "--input", request),
        { cwd: path.dirname(entry), timeout: 30_000 },
      );
      return JSON.parse(result.stdout) as Record<string, unknown>;
    };
    const identity = (actionId: string) => ({
      deliveryId: "delivery-one",
      changeId: "change-one",
      actionId,
    });
    const changeRoot = path.join(root, "openspec/changes/change-one");
    await mkdir(changeRoot, { recursive: true });
    const exploreFile = path.join(changeRoot, "explore.md");
    await writeFile(exploreFile, "# fixture Explore\n");
    const explore = await cli("start", {
      ...base,
      actionId: "explore",
      role: "author",
    });
    await cli("finish", {
      ...base,
      runId: explore.runId,
      role: "author",
      terminal: true,
      result: {
        runId: explore.runId,
        actionIdentity: identity("explore"),
        authorConclusion: "PASS",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: "review-explore",
        facts: {
          projectOrdinal: 1,
          exploreArtifact: "openspec/changes/change-one/explore.md",
          exploreSha256: createHash("sha256")
            .update(await readFile(exploreFile))
            .digest("hex"),
          proofRefs: [],
        },
      },
    });
    const review = await cli("start", {
      ...base,
      actionId: "review-explore",
      role: "reviewer",
    });
    await cli("finish", {
      ...base,
      runId: review.runId,
      role: "reviewer",
      terminal: true,
      result: {
        runId: review.runId,
        actionIdentity: identity("review-explore"),
        authorConclusion: null,
        reviewerVerdict: "approved",
        verificationVerdict: null,
        nextBoundary: "propose",
        facts: { proofRefs: [] },
      },
    });
    const proposal = await cli("start", {
      ...base,
      actionId: "propose",
      role: "author",
    });
    const hashes: Record<string, string> = {};
    for (const name of ["proposal.md", "design.md", "tasks.md"]) {
      const file = path.join(changeRoot, name);
      await writeFile(file, `# ${name}\n`);
      hashes[`openspec/changes/change-one/${name}`] = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
    }
    const semanticProof = `.flowkit/artifacts/delivery-one/changes/change-one/proof/${proposal.runId}/note.txt`;
    await mkdir(path.dirname(path.join(root, semanticProof)), {
      recursive: true,
    });
    await writeFile(path.join(root, semanticProof), "legacy layout\n");
    const proofBytes = await readFile(path.join(root, semanticProof));
    const proofRefs = [
      {
        path: semanticProof,
        bytes: proofBytes.length,
        sha256: createHash("sha256").update(proofBytes).digest("hex"),
        deliveryId: "delivery-one",
        changeId: "change-one",
        runId: proposal.runId,
        purpose: "semantic compatibility fixture",
      },
    ];
    const proposalResult = {
      runId: proposal.runId,
      actionIdentity: identity("propose"),
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-propose",
      facts: { artifactHashes: hashes, proofRefs },
    };
    await fixture.observe(["change-one"], root, false);
    await assert.rejects(
      cli("finish", {
        ...base,
        runId: proposal.runId,
        role: "author",
        terminal: true,
        result: proposalResult,
      }),
    );
    assert.deepEqual(await readdir(proposal.directory as string), [
      "action.md",
    ]);
    await fixture.observe(["change-one"]);
    const missingRequired = { ...hashes };
    delete missingRequired["openspec/changes/change-one/design.md"];
    await assert.rejects(
      cli("finish", {
        ...base,
        runId: proposal.runId,
        role: "author",
        terminal: true,
        result: {
          ...proposalResult,
          facts: { artifactHashes: missingRequired, proofRefs },
        },
      }),
    );
    assert.deepEqual(await readdir(proposal.directory as string), [
      "action.md",
    ]);
    await assert.rejects(
      cli("finish", {
        ...base,
        runId: proposal.runId,
        role: "author",
        terminal: true,
        result: {
          ...proposalResult,
          facts: {
            artifactHashes: {
              ...hashes,
              "openspec/changes/other/proposal.md": "0".repeat(64),
            },
            proofRefs,
          },
        },
      }),
    );
    assert.deepEqual(await readdir(proposal.directory as string), [
      "action.md",
    ]);
    assert.equal(
      (
        await cli("finish", {
          ...base,
          runId: proposal.runId,
          role: "author",
          terminal: true,
          result: proposalResult,
        })
      ).effect,
      "confirmed",
    );
    const proposalFile = path.join(changeRoot, "proposal.md");
    const originalProposal = await readFile(proposalFile);
    await writeFile(proposalFile, "changed after finish\n");
    await assert.rejects(
      cli("start", { ...base, actionId: "review-propose", role: "reviewer" }),
    );
    await writeFile(proposalFile, originalProposal);
    const reviewProposal = await cli("start", {
      ...base,
      actionId: "review-propose",
      role: "reviewer",
    });
    assert.equal(reviewProposal.effect, "started");
    assert.equal(
      (
        await cli("finish", {
          ...base,
          runId: reviewProposal.runId,
          role: "reviewer",
          terminal: true,
          result: {
            runId: reviewProposal.runId,
            actionIdentity: identity("review-propose"),
            authorConclusion: null,
            reviewerVerdict: "approved",
            verificationVerdict: null,
            nextBoundary: "apply",
            facts: { reviewedRunId: proposal.runId, proofRefs: [] },
          },
        })
      ).effect,
      "confirmed",
    );
    const apply = await cli("start", {
      ...base,
      actionId: "apply",
      role: "author",
    });
    assert.equal(apply.effect, "started");
    const candidate = path.join(root, "candidate.txt");
    await writeFile(candidate, "candidate bytes\n");
    const candidateBytes = await readFile(candidate);
    const candidateHash = createHash("sha256")
      .update(candidateBytes)
      .digest("hex");
    const linked = path.join(root, "candidate-link.txt");
    await symlink(candidate, linked, "file");
    const applyResult = {
      runId: apply.runId,
      actionIdentity: identity("apply"),
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-apply",
      facts: {
        artifactHashes: { "candidate.txt": candidateHash },
        proofRefs: [],
      },
    };
    const finishApply = (artifactHashes?: unknown) =>
      cli("finish", {
        ...base,
        runId: apply.runId,
        role: "author",
        terminal: true,
        result: {
          ...applyResult,
          facts: { artifactHashes, proofRefs: [] },
        },
      });
    for (const invalid of [
      undefined,
      {},
      { "candidate.txt": "0".repeat(64) },
      { "candidate.txt": "invalid" },
      { "missing.txt": candidateHash },
      { "candidate-link.txt": candidateHash },
    ]) {
      await assert.rejects(finishApply(invalid));
      assert.deepEqual(await readdir(apply.directory as string), ["action.md"]);
      assert.deepEqual(await readFile(candidate), candidateBytes);
    }
    assert.equal(
      (await finishApply(applyResult.facts.artifactHashes)).effect,
      "confirmed",
    );
    assert.equal(
      (await finishApply(applyResult.facts.artifactHashes)).duplicate,
      true,
    );
    await writeFile(candidate, "changed after finish\n");
    await assert.rejects(
      cli("start", { ...base, actionId: "review-apply", role: "reviewer" }),
    );
    await writeFile(candidate, candidateBytes);
    assert.equal(
      (
        await cli("start", {
          ...base,
          actionId: "review-apply",
          role: "reviewer",
        })
      ).effect,
      "started",
    );
  } finally {
    await fixture.cleanup();
  }
});

test("prepared Owner correction binds conversation source across CLI processes without changing predecessor", async () => {
  const fixture = await contextFixture();
  try {
    await gitBytes(fixture.repositoryRoot, ["init"]);
    await writeFile(
      path.join(fixture.repositoryRoot, ".gitattributes"),
      ".flowkit/runs/** -text\n",
    );
    const manifest = path.join(
      fixture.repositoryRoot,
      "openspec/delivery-groups/delivery-one.yaml",
    );
    const data = JSON.parse(await readFile(manifest, "utf8")) as {
      changes: Record<string, unknown>[];
    };
    data.changes[0].projectOrdinal = 1;
    await writeFile(manifest, JSON.stringify(data));
    const base = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const cli = async (args: string[]) => {
      const output = await run(process.execPath, cliEntryArgs(...args), {
        cwd: path.dirname(entry),
        timeout: 30_000,
      });
      return JSON.parse(output.stdout) as Record<string, unknown>;
    };
    const file = async (name: string, value: unknown) => {
      const location = path.join(fixture.repositoryRoot, name);
      await writeFile(location, JSON.stringify(value));
      return location;
    };
    const original = await cli([
      "action",
      "start",
      "--input",
      await file("start.json", {
        ...base,
        actionId: "explore",
        role: "author",
      }),
    ]);
    const originalId = original.runId as string;
    const empty = {
      runId: originalId,
      actionIdentity: {
        deliveryId: "delivery-one",
        changeId: "change-one",
        actionId: "explore",
      },
      authorConclusion: null,
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: null,
      facts: { proofRefs: [] },
    };
    await cli([
      "action",
      "finish",
      "--input",
      await file("prepared.json", {
        ...base,
        runId: originalId,
        role: "author",
        terminal: false,
        result: empty,
      }),
    ]);
    const before = await Promise.all(
      ["action.md", "context.json", "result.json"].map((name) =>
        readFile(path.join(original.directory as string, name)),
      ),
    );
    const ownerAuthority = {
      ref: `owner:${"b".repeat(64)}`,
      decision: "revise-action",
      deliveryId: "delivery-one",
      changeId: "change-one",
      sourceRef: "conversation:explicit-owner-correction",
      scope: ["revise-explore"],
    };
    const revised = await cli([
      "action",
      "start",
      "--input",
      await file("correction.json", {
        ...base,
        actionId: "revise-explore",
        role: "author",
        ownerAuthority,
      }),
    ]);
    assert.equal(revised.effect, "started");
    const descriptor = await readFile(
      path.join(revised.directory as string, "action.md"),
      "utf8",
    );
    assert.match(descriptor, /conversation:explicit-owner-correction/);
    const revisedId = revised.runId as string;
    const exploreArtifact = "openspec/changes/change-one/explore.md";
    const exploreFile = path.join(fixture.repositoryRoot, exploreArtifact);
    await mkdir(path.dirname(exploreFile), { recursive: true });
    await writeFile(exploreFile, "# Revised Explore\n");
    const exploreSha256 = createHash("sha256")
      .update(await readFile(exploreFile))
      .digest("hex");
    const result = {
      runId: revisedId,
      actionIdentity: { ...empty.actionIdentity, actionId: "revise-explore" },
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-explore",
      facts: { exploreArtifact, exploreSha256, proofRefs: [] },
    };
    const finished = await cli([
      "action",
      "finish",
      "--input",
      await file("correction-finish.json", {
        ...base,
        runId: revisedId,
        role: "author",
        terminal: true,
        result,
      }),
    ]);
    assert.equal(finished.effect, "confirmed");
    const oldRetry = await cli([
      "action",
      "finish",
      "--input",
      path.join(fixture.repositoryRoot, "prepared.json"),
    ]);
    assert.equal(oldRetry.effect, "confirmed");
    assert.equal(oldRetry.duplicate, true);
    const after = await Promise.all(
      ["action.md", "context.json", "result.json"].map((name) =>
        readFile(path.join(original.directory as string, name)),
      ),
    );
    assert.deepEqual(after, before);
  } finally {
    await fixture.cleanup();
  }
});

test("terminal Author FAIL with null boundary is readable and does not advance Policy", async () => {
  const fixture = await contextFixture();
  try {
    await gitBytes(fixture.repositoryRoot, ["init"]);
    await writeFile(
      path.join(fixture.repositoryRoot, ".gitattributes"),
      ".flowkit/runs/** -text\n",
    );
    const manifest = path.join(
      fixture.repositoryRoot,
      "openspec/delivery-groups/delivery-one.yaml",
    );
    const data = JSON.parse(await readFile(manifest, "utf8")) as {
      changes: Record<string, unknown>[];
    };
    data.changes[0].projectOrdinal = 1;
    await writeFile(manifest, JSON.stringify(data));
    const base = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const call = async (kind: string, request: unknown) => {
      const file = path.join(fixture.repositoryRoot, `${kind}.json`);
      await writeFile(file, JSON.stringify(request));
      const output = await run(
        process.execPath,
        cliEntryArgs(...kind.split(" "), "--input", file),
        { cwd: path.dirname(entry), timeout: 30_000 },
      );
      return JSON.parse(output.stdout) as Record<string, unknown>;
    };
    const started = await call("action start", {
      ...base,
      actionId: "explore",
      role: "author",
    });
    const runId = started.runId as string;
    const result = {
      runId,
      actionIdentity: {
        deliveryId: "delivery-one",
        changeId: "change-one",
        actionId: "explore",
      },
      authorConclusion: "FAIL",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: null,
      facts: { reason: "bounded probe did not establish proof", proofRefs: [] },
    };
    const finished = await call("action finish", {
      ...base,
      runId,
      role: "author",
      terminal: true,
      result,
    });
    assert.equal(finished.effect, "confirmed");
    const next = await call("next", base);
    assert.equal((next.decision as { kind: string }).kind, "blocked");
  } finally {
    await fixture.cleanup();
  }
});
