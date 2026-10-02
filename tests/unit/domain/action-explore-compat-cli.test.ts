import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import { contextFixture } from "./action-context-fixture.js";

const run = promisify(execFile);
const entry = fileURLToPath(
  new URL("../../../src/cli/entrypoint.ts", import.meta.url),
);

test("finish rejects incomplete new Explore and Review accepts verified legacy Result", async () => {
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
    const coordination = JSON.parse(await readFile(manifest, "utf8")) as {
      changes: Record<string, unknown>[];
    };
    coordination.changes[0].projectOrdinal = 1;
    await writeFile(manifest, JSON.stringify(coordination));
    const target = {
      repositoryRoot: root,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const cli = async (command: string, request: object) => {
      const input = path.join(
        root,
        `request-${command.replace(" ", "-")}.json`,
      );
      await writeFile(input, JSON.stringify(request));
      const response = await run(
        process.execPath,
        ["--import", "tsx", entry, ...command.split(" "), "--input", input],
        { cwd: path.dirname(entry), timeout: 30_000 },
      );
      return JSON.parse(response.stdout) as Record<string, unknown>;
    };
    const started = await cli("action start", {
      ...target,
      actionId: "explore",
      role: "author",
    });
    assert.equal(started.effect, "started");
    const runId = started.runId as string;
    const directory = started.directory as string;
    const originalAction = await readFile(path.join(directory, "action.md"));
    const relative = "openspec/changes/change-one/explore.md";
    const exploreFile = path.join(root, relative);
    await mkdir(path.dirname(exploreFile), { recursive: true });
    await writeFile(exploreFile, "# Verified Explore\n");
    const originalExplore = await readFile(exploreFile);
    const sha = createHash("sha256").update(originalExplore).digest("hex");
    const result = {
      runId,
      actionIdentity: {
        deliveryId: target.deliveryId,
        changeId: target.changeId,
        actionId: "explore",
      },
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-explore",
      facts: {
        projectOrdinal: 1,
        exploreArtifact: relative,
        exploreSha256: sha,
        proofRefs: [],
      },
    };
    const finish = (candidate: object) =>
      cli("action finish", {
        ...target,
        runId,
        role: "author",
        terminal: true,
        result: candidate,
      });
    await assert.rejects(
      finish({
        ...result,
        facts: {
          projectOrdinal: 1,
          artifactHashes: { [relative]: sha },
          proofRefs: [],
        },
      }),
    );
    assert.deepEqual(await readdir(directory), ["action.md"]);
    assert.deepEqual(
      await readFile(path.join(directory, "action.md")),
      originalAction,
    );
    assert.deepEqual(await readFile(exploreFile), originalExplore);

    assert.equal((await finish(result)).effect, "confirmed");
    const legacyResult = {
      ...result,
      facts: {
        projectOrdinal: 1,
        artifactHashes: {
          [relative]: sha,
          "openspec/changes/change-one/.openspec.yaml": "0".repeat(64),
        },
        proofRefs: [],
      },
    };
    const resultFile = path.join(directory, "result.json");
    const group = path.dirname(directory);
    const reviewRequest = {
      ...target,
      actionId: "review-explore",
      role: "reviewer",
    };
    for (const invalidFacts of [
      { ...legacyResult.facts, exploreArtifact: relative },
      {
        ...legacyResult.facts,
        artifactHashes: {
          ...legacyResult.facts.artifactHashes,
          "openspec/changes/other/explore.md": sha,
        },
      },
      { ...legacyResult.facts, artifactHashes: { [relative]: "0".repeat(64) } },
    ]) {
      await writeFile(
        resultFile,
        JSON.stringify({ ...legacyResult, facts: invalidFacts }),
      );
      await assert.rejects(cli("action start", reviewRequest));
      assert.deepEqual(await readdir(group), [runId]);
    }
    const savedLegacyBytes = Buffer.from(JSON.stringify(legacyResult));
    await writeFile(resultFile, savedLegacyBytes);
    const review = await cli("action start", reviewRequest);
    assert.equal(review.effect, "started");
    assert.deepEqual(await readFile(resultFile), savedLegacyBytes);
    assert.deepEqual(await readFile(exploreFile), originalExplore);
  } finally {
    await fixture.cleanup();
  }
});
