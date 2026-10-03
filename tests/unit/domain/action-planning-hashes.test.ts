import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  checkPlanningArtifactHashes,
  checkResultArtifactsOnFinish,
} from "../../../src/cli/action-artifact-hashes.js";
import { packageReadiness } from "../../../src/cli/action-readiness.js";
import type { FinishRequest } from "../../../src/cli/action-request.js";
import {
  writeDurableRun,
  type DurableRunRecord,
} from "../../../src/domain/run-result-persistence.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import { contextFixture } from "./action-context-fixture.js";

test("Propose hashes use project-root paths at producer and Reviewer boundaries", async () => {
  const fixture = await contextFixture();
  try {
    await gitBytes(fixture.repositoryRoot, ["init"]);
    const target = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const changeRoot = path.join(
      target.repositoryRoot,
      "openspec/changes/change-one",
    );
    await mkdir(path.join(changeRoot, "specs/engineering-baseline"), {
      recursive: true,
    });
    const hashes: Record<string, string> = {};
    for (const name of [
      "proposal.md",
      "design.md",
      "tasks.md",
      "specs/engineering-baseline/spec.md",
    ]) {
      const file = path.join(changeRoot, ...name.split("/"));
      await writeFile(file, `# ${name}\n`);
      hashes[`openspec/changes/change-one/${name}`] = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
    }
    await checkPlanningArtifactHashes(target, hashes);
    for (const invalid of [
      { ...hashes, "openspec/changes/other/proposal.md": "0".repeat(64) },
      { ...hashes, "../proposal.md": "0".repeat(64) },
      { ...hashes, "openspec/changes/change-one/explore.md": "0".repeat(64) },
      { ...hashes, "C:/absolute.md": "0".repeat(64) },
      { ...hashes, "openspec/changes/change-one/proposal.md": "0".repeat(64) },
    ])
      await assert.rejects(checkPlanningArtifactHashes(target, invalid));

    const runId = "20261002-003-propose";
    const actionIdentity = {
      deliveryId: target.deliveryId,
      changeId: target.changeId,
      actionId: "propose" as const,
    };
    const predecessor: DurableRunRecord = {
      actionMarkdown: "# fixture propose\n",
      context: {
        runId,
        occurrence: { date: "20261002", sequence: 3, actionId: "propose" },
        actionIdentity,
        role: "author",
        lifecycleState: "terminal",
        ownerAuthority: null,
        previousRunId: "20261002-002-review-explore",
      },
      result: {
        runId,
        actionIdentity,
        authorConclusion: "PASS",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: "review-propose",
        facts: { artifactHashes: hashes, proofRefs: [] },
      },
    };
    for (const [sequence, actionId, parent] of [
      [1, "explore", null],
      [2, "review-explore", "20261002-001-explore"],
    ] as const) {
      const runId = `20261002-${String(sequence).padStart(3, "0")}-${actionId}`;
      const identity = { ...actionIdentity, actionId };
      const occurrence = { date: "20261002", sequence, actionId };
      const reviewer = actionId === "review-explore";
      await writeDurableRun(
        { ...target, changeStartSequence: 1, occurrence },
        {
          actionMarkdown: "# Synthetic prior chain\n",
          context: {
            ...predecessor.context,
            runId,
            occurrence,
            actionIdentity: identity,
            role: reviewer ? "reviewer" : "author",
            previousRunId: parent,
          },
          result: {
            ...predecessor.result,
            runId,
            actionIdentity: identity,
            authorConclusion: reviewer ? null : "PASS",
            reviewerVerdict: reviewer ? "approved" : null,
            nextBoundary: reviewer ? "propose" : "review-explore",
            facts: {},
          },
        },
      );
    }
    await writeDurableRun(
      {
        ...target,
        changeStartSequence: 1,
        occurrence: predecessor.context.occurrence,
      },
      predecessor,
    );
    assert.equal(
      await packageReadiness(
        { ...target, actionId: "review-propose", role: "reviewer" },
        "20261002-004-review-propose",
        predecessor,
        fixture.installation,
      ),
      "ready",
    );
    const legacyPredecessor: DurableRunRecord = {
      ...predecessor,
      result: {
        ...predecessor.result,
        facts: {
          artifactHashes: {
            "openspec/changes/change-one/proposal.md":
              hashes["openspec/changes/change-one/proposal.md"],
          },
          proofRefs: [],
        },
      },
    };
    await checkPlanningArtifactHashes(
      target,
      legacyPredecessor.result.facts.artifactHashes,
    );
    await writeFile(path.join(changeRoot, "proposal.md"), "changed\n");
    await assert.rejects(
      packageReadiness(
        { ...target, actionId: "review-propose", role: "reviewer" },
        "20261002-004-review-propose",
        predecessor,
        fixture.installation,
      ),
      /Candidate artifact changed/,
    );
    const source = path.join(target.repositoryRoot, "candidate.txt");
    await writeFile(source, "source artifact\n");
    const applyId = "20261002-005-apply";
    const applyIdentity = { ...actionIdentity, actionId: "apply" as const };
    const apply: DurableRunRecord = {
      ...predecessor,
      context: {
        ...predecessor.context,
        runId: applyId,
        actionIdentity: applyIdentity,
        occurrence: { date: "20261002", sequence: 5, actionId: "apply" },
      },
      result: {
        ...predecessor.result,
        runId: applyId,
        actionIdentity: applyIdentity,
        nextBoundary: "review-apply",
        facts: {
          artifactHashes: {
            "candidate.txt": createHash("sha256")
              .update(await readFile(source))
              .digest("hex"),
          },
          proofRefs: [],
        },
      },
    };
    await writeDurableRun(
      {
        ...target,
        changeStartSequence: 1,
        occurrence: apply.context.occurrence,
      },
      apply,
    );
    assert.equal(
      await packageReadiness(
        { ...target, actionId: "review-apply", role: "reviewer" },
        "20261002-006-review-apply",
        apply,
        fixture.installation,
      ),
      "ready",
    );
  } finally {
    await fixture.cleanup();
  }
});

test("revise candidates use success-only checks without changing FAIL or nonterminal results", async () => {
  const fixture = await contextFixture();
  try {
    await gitBytes(fixture.repositoryRoot, ["init"]);
    const target = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const changeRoot = path.join(
      target.repositoryRoot,
      "openspec/changes/change-one",
    );
    await mkdir(changeRoot, { recursive: true });
    const hashes: Record<string, string> = {};
    for (const name of ["proposal.md", "design.md", "tasks.md"]) {
      const file = path.join(changeRoot, name);
      await writeFile(file, `${name}\n`);
      hashes[`openspec/changes/change-one/${name}`] = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
    }
    const candidate = path.join(target.repositoryRoot, "candidate.txt");
    await writeFile(candidate, "candidate\n");
    const candidateHash = createHash("sha256")
      .update(await readFile(candidate))
      .digest("hex");
    const result = {
      runId: "20261002-003-revise-propose",
      actionIdentity: {
        deliveryId: target.deliveryId,
        changeId: target.changeId,
        actionId: "revise-propose" as const,
      },
      authorConclusion: "PASS" as const,
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-propose" as const,
      facts: { artifactHashes: hashes, proofRefs: [] },
    };
    const request: FinishRequest = {
      ...target,
      runId: result.runId,
      role: "author",
      terminal: true,
      result,
    };
    await checkResultArtifactsOnFinish(
      request,
      "revise-propose",
      result,
      fixture.installation,
    );
    await assert.rejects(
      checkResultArtifactsOnFinish(
        request,
        "revise-propose",
        {
          ...result,
          facts: {
            artifactHashes: {
              "openspec/changes/change-one/proposal.md":
                hashes["openspec/changes/change-one/proposal.md"],
            },
          },
        },
        fixture.installation,
      ),
      { kind: "artifact-hashes-missing" },
    );
    const applyFacts = {
      artifactHashes: { "candidate.txt": candidateHash },
      proofRefs: [],
    };
    await checkResultArtifactsOnFinish(
      request,
      "revise-apply",
      { ...result, facts: applyFacts },
      fixture.installation,
    );
    await assert.rejects(
      checkResultArtifactsOnFinish(
        request,
        "revise-apply",
        { ...result, facts: { artifactHashes: {}, proofRefs: [] } },
        fixture.installation,
      ),
      { kind: "artifact-hashes-missing" },
    );
    for (const actionId of [
      "propose",
      "revise-propose",
      "apply",
      "revise-apply",
    ]) {
      await checkResultArtifactsOnFinish(
        request,
        actionId,
        { authorConclusion: "FAIL", facts: { proofRefs: [] } },
        fixture.installation,
      );
      await checkResultArtifactsOnFinish(
        { ...request, terminal: false },
        actionId,
        { authorConclusion: null, facts: { proofRefs: [] } },
        fixture.installation,
      );
    }
  } finally {
    await fixture.cleanup();
  }
});
