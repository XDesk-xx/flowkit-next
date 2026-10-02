import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { checkPlanningArtifactHashes } from "../../../src/cli/action-artifact-hashes.js";
import { packageReadiness } from "../../../src/cli/action-readiness.js";
import type { DurableRunRecord } from "../../../src/domain/run-result-persistence.js";
import { contextFixture } from "./action-context-fixture.js";

test("Propose hashes use project-root paths at producer and Reviewer boundaries", async () => {
  const fixture = await contextFixture();
  try {
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
    assert.equal(
      await packageReadiness(
        { ...target, actionId: "review-propose", role: "reviewer" },
        "20261002-004-review-propose",
        predecessor,
        fixture.installation,
      ),
      "ready",
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
    assert.equal(
      await packageReadiness(
        { ...target, actionId: "review-apply", role: "reviewer" },
        "20261002-006-review-apply",
        {
          ...predecessor,
          context: {
            ...predecessor.context,
            runId: applyId,
            actionIdentity: applyIdentity,
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
        },
        fixture.installation,
      ),
      "ready",
    );
  } finally {
    await fixture.cleanup();
  }
});
