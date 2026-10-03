import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { contextFixture } from "./action-context-fixture.js";
import { nextDeliveryRunSequence } from "../../../src/cli/current-run-chain.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

const run = promisify(execFile);
const entry = fileURLToPath(
  new URL("../../../src/cli/entrypoint.ts", import.meta.url),
);

test("a new Change starts at the next verified Delivery Run sequence", async () => {
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
    const firstManifest = JSON.parse(await readFile(manifest, "utf8")) as {
      id: string;
      changes: Record<string, unknown>[];
      ownerDecisions: Record<string, unknown>[];
    };
    firstManifest.changes[0].projectOrdinal = 1;
    await writeFile(manifest, JSON.stringify(firstManifest));
    const base = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
    };
    const cli = async (command: string, request: Record<string, unknown>) => {
      const input = path.join(fixture.repositoryRoot, "request.json");
      await writeFile(input, JSON.stringify(request));
      const output = await run(
        process.execPath,
        ["--import", "tsx", entry, ...command.split(" "), "--input", input],
        { cwd: path.dirname(entry), timeout: 30_000 },
      );
      return JSON.parse(output.stdout) as Record<string, unknown>;
    };
    const finishExplore = async (
      changeId: string,
      runId: string,
      ordinal: number,
    ) => {
      const artifact = `openspec/changes/${changeId}/explore.md`;
      const file = path.join(fixture.repositoryRoot, artifact);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, `# ${changeId}\n\nBounded fixture observation.\n`);
      const sha = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
      return cli("action finish", {
        ...base,
        changeId,
        runId,
        role: "author",
        terminal: true,
        result: {
          runId,
          actionIdentity: {
            deliveryId: base.deliveryId,
            changeId,
            actionId: "explore",
          },
          authorConclusion: "PASS",
          reviewerVerdict: null,
          verificationVerdict: null,
          nextBoundary: "review-explore",
          facts: {
            projectOrdinal: ordinal,
            exploreArtifact: artifact,
            exploreSha256: sha,
            proofRefs: [],
          },
        },
      });
    };

    const first = await cli("action start", {
      ...base,
      changeId: "change-one",
      actionId: "explore",
      role: "author",
    });
    assert.match(first.runId as string, /-001-explore$/);
    assert.equal(
      (await finishExplore("change-one", first.runId as string, 1)).effect,
      "confirmed",
    );

    const secondManifest = {
      ...firstManifest,
      changes: [
        { ...firstManifest.changes[0], state: "completed" },
        {
          id: "change-two",
          state: "active",
          dependsOn: ["change-one"],
          projectOrdinal: 2,
        },
      ],
      ownerDecisions: [
        ...firstManifest.ownerDecisions,
        {
          ref: `owner:${"b".repeat(64)}`,
          decision: "activate-change",
          deliveryId: base.deliveryId,
          changeId: "change-two",
          sourceRef: "fixture-second-activation",
          scope: ["explore"],
        },
      ],
    };
    await writeFile(manifest, JSON.stringify(secondManifest));
    await fixture.observe(["change-two"]);
    assert.equal(
      await nextDeliveryRunSequence({ ...base, changeId: "change-two" }),
      2,
    );

    const second = await cli("action start", {
      ...base,
      changeId: "change-two",
      actionId: "explore",
      role: "author",
    });
    assert.match(second.runId as string, /-002-explore$/);
    assert.match(second.directory as string, /002-change-two/);
    assert.equal(
      (await finishExplore("change-two", second.runId as string, 2)).effect,
      "confirmed",
    );
    const next = await cli("next", { ...base, changeId: "change-two" });
    assert.deepEqual(next.decision, {
      kind: "ready-action",
      actionId: "review-explore",
    });
  } finally {
    await fixture.cleanup();
  }
});
