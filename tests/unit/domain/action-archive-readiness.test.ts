import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { packageReadiness } from "../../../src/cli/action-readiness.js";
import {
  writeDurableRun,
  type DurableRunRecord,
} from "../../../src/domain/run-result-persistence.js";
import { contextFixture } from "./action-context-fixture.js";

test("Propose preparation does not require artifacts that this Action must create", async () => {
  const fixture = await contextFixture();
  try {
    const target = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    for (const actionId of ["propose", "revise-propose"] as const) {
      assert.equal(
        await packageReadiness(
          { ...target, actionId, role: "author" },
          `20260930-002-${actionId}`,
          null,
          fixture.installation,
        ),
        "ready",
      );
    }
  } finally {
    await fixture.cleanup();
  }
});

test("archive machine preparation blocks candidate drift and unsuccessful isolated convergence", async () => {
  const fixture = await contextFixture();
  try {
    const root = fixture.repositoryRoot;
    const manifest = path.join(
      root,
      "openspec/delivery-groups/delivery-one.yaml",
    );
    const data = JSON.parse(await readFile(manifest, "utf8")) as {
      changes: Record<string, unknown>[];
    };
    data.changes[0].projectOrdinal = 1;
    await writeFile(manifest, JSON.stringify(data));
    const changeRoot = path.join(root, "openspec/changes/change-one");
    await mkdir(changeRoot, { recursive: true });
    for (const name of ["proposal.md", "design.md", "tasks.md"])
      await writeFile(path.join(changeRoot, name), `# ${name}\n`);
    await writeFile(path.join(root, "candidate.txt"), "candidate A\n");
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ scripts: { "test:acceptance": "node --test" } }),
    );
    await mkdir(path.join(root, "node_modules"));
    const target = {
      repositoryRoot: root,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const actionIdentity = {
      deliveryId: target.deliveryId,
      changeId: target.changeId,
      actionId: "apply" as const,
    };
    const occurrence = {
      date: "20260930",
      sequence: 1,
      actionId: "apply" as const,
    };
    const authorId = "20260930-001-apply";
    const sha = createHash("sha256")
      .update(await readFile(path.join(root, "candidate.txt")))
      .digest("hex");
    const author: DurableRunRecord = {
      actionMarkdown: "# fixture apply\n",
      context: {
        runId: authorId,
        occurrence,
        actionIdentity,
        role: "author",
        lifecycleState: "terminal",
        ownerAuthority: null,
        previousRunId: null,
      },
      result: {
        runId: authorId,
        actionIdentity,
        authorConclusion: "PASS",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: "review-apply",
        facts: { artifactHashes: { "candidate.txt": sha } },
      },
    };
    await writeDurableRun(
      { ...target, changeStartSequence: 1, occurrence },
      author,
    );
    const reviewIdentity = {
      ...actionIdentity,
      actionId: "review-apply" as const,
    };
    const reviewId = "20260930-002-review-apply";
    const review: DurableRunRecord = {
      actionMarkdown: "# fixture review\n",
      context: {
        runId: reviewId,
        occurrence: { date: "20260930", sequence: 2, actionId: "review-apply" },
        actionIdentity: reviewIdentity,
        role: "reviewer",
        lifecycleState: "terminal",
        ownerAuthority: null,
        previousRunId: authorId,
      },
      result: {
        runId: reviewId,
        actionIdentity: reviewIdentity,
        authorConclusion: null,
        reviewerVerdict: "approved",
        verificationVerdict: null,
        nextBoundary: "archive",
        facts: { reviewedRunId: authorId },
      },
    };
    const request = {
      ...target,
      actionId: "archive" as const,
      role: "author" as const,
      applicableChecks: [
        { id: "test:acceptance", reason: "affected acceptance verification" },
      ],
    };
    await writeFile(path.join(root, "candidate.txt"), "drifted\n");
    await assert.rejects(
      packageReadiness(
        request,
        "20260930-003-archive",
        review,
        fixture.installation,
      ),
      /Reviewed candidate changed/,
    );
    await writeFile(path.join(root, "candidate.txt"), "candidate A\n");
    await assert.rejects(
      packageReadiness(
        request,
        "20260930-003-archive",
        review,
        fixture.installation,
      ),
      /convergence|archive target/i,
    );
    const runtime = path.join(
      fixture.flowkitHome,
      "tools/openspec/1.10.0/bin/openspec.js",
    );
    await writeFile(
      runtime,
      `const fs=require('node:fs'); const path=require('node:path'); const args=process.argv.slice(2); if(args[0]==='archive'){const target=path.join(process.cwd(),'openspec','changes','archive',new Date().toISOString().slice(0,10)+'-'+args[1]); fs.mkdirSync(target,{recursive:true}); fs.writeFileSync(path.join(target,'marker.txt'),'converged');} process.exit(0);\n`,
    );
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({
        scripts: { "test:acceptance": 'node -e "process.exit(1)"' },
      }),
    );
    await assert.rejects(
      packageReadiness(
        request,
        "20260930-003-archive",
        review,
        fixture.installation,
      ),
      /Post-convergence check failed/,
    );
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({
        scripts: { "test:acceptance": 'node -e "process.exit(0)"' },
      }),
    );
    assert.equal(
      await packageReadiness(
        request,
        "20260930-003-archive",
        review,
        fixture.installation,
      ),
      "ready",
    );
    await assert.rejects(
      packageReadiness(
        {
          ...request,
          applicableChecks: [{ id: "not-configured", reason: "probe" }],
        },
        "20260930-003-archive",
        review,
        fixture.installation,
      ),
      /Unconfigured archive check/,
    );
    await rm(path.join(root, "package.json"));
    await rm(path.join(root, "node_modules"), { recursive: true });
    await mkdir(path.join(root, "config/verification"), { recursive: true });
    const checkConfig = path.join(root, "config/verification/full-test.json");
    const command = {
      checkId: "archive-integrity",
      program: "git",
      args: [
        "hash-object",
        `openspec/changes/archive/${new Date().toISOString().slice(0, 10)}-001-change-one/marker.txt`,
      ],
      cwd: ".",
    };
    const configured = (checks: unknown[]) =>
      JSON.stringify({
        inputs: ["openspec"],
        exclude: [],
        environment: [],
        checks,
      });
    await writeFile(checkConfig, configured([command]));
    const nonNodeRequest = {
      ...request,
      applicableChecks: [
        { id: "archive-integrity", reason: "configured target check" },
      ],
    };
    assert.equal(
      await packageReadiness(
        nonNodeRequest,
        "20260930-003-archive",
        review,
        fixture.installation,
      ),
      "ready",
    );
    await writeFile(
      checkConfig,
      configured([{ ...command, args: ["hash-object", "missing.txt"] }]),
    );
    await assert.rejects(
      packageReadiness(
        nonNodeRequest,
        "20260930-003-archive",
        review,
        fixture.installation,
      ),
      /Post-convergence check failed/,
    );
    delete data.changes[0].projectOrdinal;
    await writeFile(manifest, JSON.stringify(data));
    await assert.rejects(
      packageReadiness(
        nonNodeRequest,
        "20260930-003-archive",
        review,
        fixture.installation,
      ),
      /project ordinal|durable baseline/i,
    );
  } finally {
    await fixture.cleanup();
  }
});
