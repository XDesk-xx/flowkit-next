import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import {
  deliveryRunOccupancy,
  nextActionRunSequence,
  nextDeliveryRunSequence,
  readSelectedRunChain,
} from "../../../src/cli/current-run-chain.js";
import {
  formatRunOccurrenceId,
  writeDurableRun,
  type DurableRunRecord,
  type RunOccurrence,
} from "../../../src/domain/run-result-persistence.js";
import { contextFixture } from "./action-context-fixture.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

test("legacy cross-Change overlap is readable, allocates 23 and leaves every original byte unchanged", async () => {
  const fixture = await contextFixture();
  try {
    const names = ["change-one", "change-two", "change-three", "change-four"];
    await writeFile(
      path.join(
        fixture.repositoryRoot,
        "openspec/delivery-groups/delivery-one.yaml",
      ),
      JSON.stringify({
        id: "delivery-one",
        changes: names.map((id, index) => ({
          id,
          state: "active",
          dependsOn: [],
          projectOrdinal: index + 1,
        })),
        ownerDecisions: names.map((changeId, index) => ({
          ref: `owner:${String(index + 1).padStart(64, "0")}`,
          decision: "activate-change",
          deliveryId: "delivery-one",
          changeId,
          sourceRef: "synthetic-owner",
          scope: ["explore"],
        })),
      }),
    );
    const hashes = new Map<string, string>();
    const digest = (bytes: Buffer) =>
      createHash("sha256").update(bytes).digest("hex");
    const actions: RunOccurrence["actionId"][] = [
      "explore",
      "review-explore",
      "propose",
      "review-propose",
      "apply",
      "review-apply",
      "revise-apply",
      "review-apply",
      "revise-apply",
      "review-apply",
      "revise-apply",
    ];
    for (const [index, start] of [1, 12, 1].entries()) {
      let previous: string | null = null;
      for (const [offset, actionId] of actions.entries()) {
        const occurrence = {
          date: offset < 5 ? "20261002" : "20261003",
          sequence: start + offset,
          actionId,
        };
        const runId = formatRunOccurrenceId(occurrence)!;
        const identity = {
          deliveryId: "delivery-one",
          changeId: names[index],
          actionId,
        };
        const reviewer = actionId.startsWith("review-");
        const proof = `.flowkit/artifacts/delivery-one/changes/${String(start).padStart(3, "0")}-${names[index]}/proof/${runId}/stdout.txt`;
        const proofBytes = Buffer.from([255, 13, 10, index, offset]);
        await mkdir(path.dirname(path.join(fixture.repositoryRoot, proof)), {
          recursive: true,
        });
        await writeFile(path.join(fixture.repositoryRoot, proof), proofBytes);
        hashes.set(
          path.join(fixture.repositoryRoot, proof),
          digest(proofBytes),
        );
        const record: DurableRunRecord = {
          actionMarkdown:
            "# Synthetic compatibility fixture; no independent review claim\n",
          context: {
            runId,
            occurrence,
            actionIdentity: identity,
            role: reviewer ? "reviewer" : "author",
            lifecycleState: "terminal",
            ownerAuthority: null,
            previousRunId: previous,
          },
          result: {
            runId,
            actionIdentity: identity,
            authorConclusion: reviewer ? null : "PASS",
            reviewerVerdict: reviewer
              ? actionId === "review-apply"
                ? "changes-requested"
                : "approved"
              : null,
            verificationVerdict: null,
            nextBoundary: null,
            facts: {
              proofRefs: [
                {
                  path: proof,
                  bytes: proofBytes.length,
                  sha256: digest(proofBytes),
                  deliveryId: identity.deliveryId,
                  changeId: identity.changeId,
                  runId,
                  purpose: "synthetic original proof",
                },
              ],
            },
          },
        };
        const address = await writeDurableRun(
          {
            ...identity,
            repositoryRoot: fixture.repositoryRoot,
            changeStartSequence: start,
            occurrence,
          },
          record,
        );
        for (const name of ["action.md", "context.json", "result.json"]) {
          const file = path.join(address.runDirectory, name);
          hashes.set(file, digest(await readFile(file)));
        }
        previous = runId;
      }
      assert.equal(
        (
          await readSelectedRunChain({
            repositoryRoot: fixture.repositoryRoot,
            deliveryId: "delivery-one",
            changeId: names[index],
          })
        ).records.length,
        11,
      );
    }
    const target = {
      repositoryRoot: fixture.repositoryRoot,
      deliveryId: "delivery-one",
      changeId: "change-four",
    };
    assert.equal(await nextDeliveryRunSequence(target), 23);
    assert.equal((await deliveryRunOccupancy(target)).warnings.length, 1);
    const first = await readSelectedRunChain({
      ...target,
      changeId: "change-one",
    });
    await assert.rejects(
      nextActionRunSequence(
        { ...target, changeId: "change-one" },
        first.current,
      ),
      /occupied.*12/,
    );
    for (const [file, hash] of hashes)
      assert.equal(digest(await readFile(file)), hash, file);
    await gitBytes(fixture.repositoryRoot, ["init"]);
    await writeFile(
      path.join(fixture.repositoryRoot, ".gitattributes"),
      ".flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    await fixture.observe(names);
    const base = { ...target, flowkitHome: fixture.flowkitHome };
    const entry = fileURLToPath(
      new URL("../../../src/cli/entrypoint.ts", import.meta.url),
    );
    const cli = async (command: string, value: unknown) => {
      const file = path.join(fixture.repositoryRoot, "request.json");
      await writeFile(file, JSON.stringify(value));
      return JSON.parse(
        (
          await promisify(execFile)(
            process.execPath,
            [
              "--import",
              import.meta.resolve("tsx"),
              entry,
              ...command.split(" "),
              "--input",
              file,
            ],
            { timeout: 30_000 },
          )
        ).stdout,
      );
    };
    const started = await cli("action start", {
      ...base,
      actionId: "explore",
      role: "author",
    });
    assert.match(started.runId, /-023-explore$/);
    const exploreArtifact = "openspec/changes/change-four/explore.md";
    await mkdir(
      path.dirname(path.join(fixture.repositoryRoot, exploreArtifact)),
      { recursive: true },
    );
    await writeFile(
      path.join(fixture.repositoryRoot, exploreArtifact),
      "# Bounded new Explore\n",
    );
    assert.equal(
      (
        await cli("action finish", {
          ...base,
          runId: started.runId,
          role: "author",
          terminal: true,
          result: {
            runId: started.runId,
            actionIdentity: {
              deliveryId: base.deliveryId,
              changeId: base.changeId,
              actionId: "explore",
            },
            authorConclusion: "PASS",
            reviewerVerdict: null,
            verificationVerdict: null,
            nextBoundary: "review-explore",
            facts: {
              projectOrdinal: 4,
              exploreArtifact,
              exploreSha256: digest(
                await readFile(
                  path.join(fixture.repositoryRoot, exploreArtifact),
                ),
              ),
              proofRefs: [],
            },
          },
        })
      ).effect,
      "confirmed",
    );
    const review = await cli("action start", {
      ...base,
      actionId: "review-explore",
      role: "reviewer",
    });
    assert.match(review.runId, /-024-review-explore$/);
    for (const changeId of names.slice(0, 3))
      assert.equal(
        (await cli("next", { ...base, changeId })).decision.actionId,
        "review-apply",
      );
    for (const [file, hash] of hashes)
      assert.equal(digest(await readFile(file)), hash, file);
  } finally {
    await fixture.cleanup();
  }
});
