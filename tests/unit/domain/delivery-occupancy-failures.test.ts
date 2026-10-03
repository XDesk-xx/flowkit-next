import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { nextDeliveryRunSequence } from "../../../src/cli/current-run-chain.js";
import { writeDurableRun } from "../../../src/domain/run-result-persistence.js";
import { executionFixture } from "./execution-recovery-fixture.js";

for (const kind of [
  "unknown",
  "bootstrap",
  "exhaustion",
  "gap",
  "duplicate",
] as const) {
  test(`Delivery allocation refuses ${kind} occupancy without choosing a new identity`, async () => {
    const f = await executionFixture(-1);
    try {
      const manifest = path.join(
        f.repositoryRoot,
        "openspec/delivery-groups/delivery-one.yaml",
      );
      const value = JSON.parse(await readFile(manifest, "utf8"));
      value.changes.push({ id: "change-two", state: "active", dependsOn: [] });
      await writeFile(manifest, JSON.stringify(value));
      const root = path.join(f.repositoryRoot, ".flowkit/runs/delivery-one");
      if (kind === "unknown")
        await mkdir(path.join(root, "001-unknown-change"), { recursive: true });
      else if (kind === "bootstrap") {
        const directory = path.join(root, "change-one/20261003-001-explore");
        await mkdir(directory, { recursive: true });
        await writeFile(
          path.join(directory, "action.md"),
          "# legacy bootstrap\n",
        );
        const marker = {
          ...f.base,
          runId: "20261003-001-explore",
          kind: "external-orchestrator-explore",
          canonicalFlowkitRuntimeRun: false,
          executionMode: "independent-bootstrap",
        };
        for (const name of ["context.json", "result.json"])
          await writeFile(path.join(directory, name), JSON.stringify(marker));
      } else {
        const first = kind === "exhaustion" ? 999999 : 1;
        const id = `20261002-${String(first).padStart(3, "0")}-explore`;
        const occurrence = {
          date: "20261002",
          sequence: first,
          actionId: "explore" as const,
        };
        const identity = {
          deliveryId: f.base.deliveryId,
          changeId: f.base.changeId,
          actionId: "explore" as const,
        };
        await writeDurableRun(
          { ...f.base, changeStartSequence: first, occurrence },
          {
            actionMarkdown: "# synthetic occupancy\n",
            context: {
              runId: id,
              occurrence,
              actionIdentity: identity,
              role: "author",
              lifecycleState: "terminal",
              previousRunId: null,
              ownerAuthority: null,
            },
            result: {
              runId: id,
              actionIdentity: identity,
              authorConclusion: "PASS",
              reviewerVerdict: null,
              verificationVerdict: null,
              nextBoundary: null,
              facts: {},
            },
          },
        );
        if (kind !== "exhaustion") {
          const sequence = kind === "gap" ? 3 : 1;
          const child = {
            date: "20261003",
            sequence,
            actionId: "review-explore" as const,
          };
          const runId = `20261003-${String(sequence).padStart(3, "0")}-review-explore`;
          const actionIdentity = {
            ...identity,
            actionId: "review-explore" as const,
          };
          const record = {
            actionMarkdown: "# synthetic malformed successor\n",
            context: {
              runId,
              occurrence: child,
              actionIdentity,
              role: "reviewer" as const,
              lifecycleState: "terminal" as const,
              previousRunId: id,
              ownerAuthority: null,
            },
            result: {
              runId,
              actionIdentity,
              authorConclusion: null,
              reviewerVerdict: "approved",
              verificationVerdict: null,
              nextBoundary: null,
              facts: {},
            },
          };
          if (kind === "duplicate") {
            const directory = path.join(root, "001-change-one", runId);
            await mkdir(directory, { recursive: true });
            await writeFile(
              path.join(directory, "action.md"),
              record.actionMarkdown,
            );
            await writeFile(
              path.join(directory, "context.json"),
              JSON.stringify(record.context),
            );
            await writeFile(
              path.join(directory, "result.json"),
              JSON.stringify(record.result),
            );
          } else
            await writeDurableRun(
              { ...f.base, changeStartSequence: first, occurrence: child },
              record,
            );
        }
      }
      await assert.rejects(
        nextDeliveryRunSequence({ ...f.base, changeId: "change-two" }),
      );
    } finally {
      await f.cleanup();
    }
  });
}

test("valid partial descriptor contributes occupancy but blocks an unrelated new Change", async () => {
  const f = await executionFixture(-1);
  try {
    const started = await f.call("action start", {
      ...f.base,
      actionId: "explore",
      role: "author",
    });
    const file = path.join(
      f.repositoryRoot,
      "openspec/delivery-groups/delivery-one.yaml",
    );
    const manifest = JSON.parse(await readFile(file, "utf8"));
    manifest.changes.push({ id: "change-two", state: "active", dependsOn: [] });
    await writeFile(file, JSON.stringify(manifest));
    const before = await readFile(path.join(started.directory, "action.md"));
    await assert.rejects(
      nextDeliveryRunSequence({ ...f.base, changeId: "change-two" }),
      /partial|Incomplete/i,
    );
    assert.deepEqual(
      await readFile(path.join(started.directory, "action.md")),
      before,
    );
  } finally {
    await f.cleanup();
  }
});
