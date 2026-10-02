import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  checkExplorePredecessorForReview,
  checkExploreResultOnFinish,
} from "../../../src/cli/action-artifact-hashes.js";
import type {
  DurableRunRecord,
  JsonObject,
} from "../../../src/domain/run-result-persistence.js";
import { contextFixture } from "./action-context-fixture.js";

test("future successful Explore requires the exact dedicated file identity", async () => {
  const fixture = await contextFixture();
  try {
    const target = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const relative = "openspec/changes/change-one/explore.md";
    const file = path.join(target.repositoryRoot, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, "# Explore\n");
    const sha = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
    const request = {
      ...target,
      runId: "20261003-001-explore",
      role: "author" as const,
      terminal: true,
      result: {
        runId: "20261003-001-explore",
        actionIdentity: { ...target, actionId: "explore" as const },
        authorConclusion: "PASS",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: "review-explore",
        facts: { exploreArtifact: relative, exploreSha256: sha },
      },
    };
    const check = (facts: JsonObject) =>
      checkExploreResultOnFinish(request, "explore", {
        authorConclusion: "PASS",
        facts,
      });
    await check(request.result.facts);
    await check({ ...request.result.facts, artifactHashes: null });
    await assert.rejects(check({ artifactHashes: { [relative]: sha } }), {
      kind: "explore-artifact-missing",
    });
    await assert.rejects(check({ exploreArtifact: relative }), {
      kind: "explore-artifact-missing",
    });
    await assert.rejects(
      check({
        exploreArtifact: "openspec/changes/other/explore.md",
        exploreSha256: sha,
      }),
      { kind: "explore-artifact-invalid" },
    );
    await assert.rejects(
      check({ exploreArtifact: relative, exploreSha256: "invalid" }),
      { kind: "artifact-hash-invalid" },
    );
    await writeFile(file, "changed\n");
    await assert.rejects(check(request.result.facts), {
      kind: "artifact-drift",
    });
    await rm(file);
    await assert.rejects(check(request.result.facts));
    const source = path.join(target.repositoryRoot, "source.md");
    await writeFile(source, "# Explore\n");
    await symlink(source, file, "file");
    await assert.rejects(check(request.result.facts), {
      kind: "artifact-hash-invalid",
    });
    await checkExploreResultOnFinish(request, "explore", {
      authorConclusion: "FAIL",
      facts: {},
    });
    await checkExploreResultOnFinish(
      { ...request, terminal: false },
      "explore",
      {
        authorConclusion: null,
        facts: {},
      },
    );
  } finally {
    await fixture.cleanup();
  }
});

test("Review accepts only one matching legacy Explore hash and rejects conflicts", async () => {
  const fixture = await contextFixture();
  try {
    const target = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const relative = "openspec/changes/change-one/explore.md";
    const file = path.join(target.repositoryRoot, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, "# Legacy Explore\n");
    const sha = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
    const runId = "20261003-001-explore";
    const actionIdentity = {
      deliveryId: target.deliveryId,
      changeId: target.changeId,
      actionId: "explore" as const,
    };
    const legacyHashes = {
      "openspec/changes/change-one/.openspec.yaml": "0".repeat(64),
      [relative]: sha,
    };
    const predecessor: DurableRunRecord = {
      actionMarkdown: "# Explore\n",
      context: {
        runId,
        occurrence: { date: "20261003", sequence: 1, actionId: "explore" },
        actionIdentity,
        role: "author",
        lifecycleState: "terminal",
        ownerAuthority: null,
        previousRunId: null,
      },
      result: {
        runId,
        actionIdentity,
        authorConclusion: "PASS",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: "review-explore",
        facts: {
          artifactHashes: legacyHashes,
          proofRefs: [],
        },
      },
    };
    const check = (facts: DurableRunRecord["result"]["facts"]) =>
      checkExplorePredecessorForReview(target, {
        ...predecessor,
        result: { ...predecessor.result, facts },
      });
    await check(predecessor.result.facts);
    await assert.rejects(
      check({
        artifactHashes: {
          ...legacyHashes,
          "openspec/changes/other/explore.md": sha,
        },
      }),
      { kind: "explore-artifact-invalid" },
    );
    await assert.rejects(
      check({ artifactHashes: { "openspec/changes/other/explore.md": sha } }),
      { kind: "explore-artifact-invalid" },
    );
    await assert.rejects(
      check({ artifactHashes: { [relative]: sha }, exploreArtifact: relative }),
      { kind: "explore-artifact-missing" },
    );
    await assert.rejects(
      check({
        artifactHashes: { [relative]: sha },
        exploreArtifact: relative,
        exploreSha256: "0".repeat(64),
      }),
      { kind: "explore-artifact-invalid" },
    );
    await assert.rejects(check({ artifactHashes: { [relative]: "invalid" } }), {
      kind: "artifact-hash-invalid",
    });
    await writeFile(file, "changed\n");
    await assert.rejects(check(predecessor.result.facts), {
      kind: "artifact-drift",
    });
  } finally {
    await fixture.cleanup();
  }
});
