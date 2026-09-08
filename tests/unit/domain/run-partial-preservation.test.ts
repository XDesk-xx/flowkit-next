import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildRunAddress,
  readDurableRun,
  writeDurableRun,
} from "../../../src/domain/run-result-persistence.js";

for (const failedFile of ["context.json", "result.json"]) {
  test(`writer preserves actual partial files when ${failedFile} fails`, async (t) => {
    const repositoryRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "flowkit-partial-"),
    );
    const occurrence = {
      date: "20260908",
      sequence: 1,
      actionId: "explore" as const,
    };
    const actionIdentity = {
      deliveryId: "test-delivery",
      changeId: "test-change",
      actionId: "explore" as const,
    };
    const input = {
      repositoryRoot,
      ...actionIdentity,
      changeStartSequence: 1,
      occurrence,
    };
    const address = buildRunAddress(input)!;
    const context = {
      runId: address.runId,
      occurrence,
      actionIdentity,
      role: "author" as const,
      lifecycleState: "terminal" as const,
      ownerAuthority: null,
      previousRunId: null,
    };
    const record = {
      actionMarkdown: "# Synthetic persistence fixture\n",
      context,
      result: {
        runId: address.runId,
        actionIdentity,
        authorConclusion: "PASS",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: "review-explore",
        facts: { synthetic: true },
      },
    };
    const original = fs.writeFile;
    try {
      t.mock.method(
        fs,
        "writeFile",
        async (...args: Parameters<typeof fs.writeFile>) => {
          if (String(args[0]) === path.join(address.runDirectory, failedFile))
            throw new Error("injected write failure");
          return original(...args);
        },
      );
      syncBuiltinESMExports();
      await assert.rejects(
        writeDurableRun(input, record),
        /injected write failure/,
      );
      t.mock.restoreAll();
      syncBuiltinESMExports();
      assert.deepEqual(
        (await fs.readdir(address.runDirectory)).sort(),
        failedFile === "context.json"
          ? ["action.md"]
          : ["action.md", "context.json"],
      );
      assert.equal(
        await fs.readFile(path.join(address.runDirectory, "action.md"), "utf8"),
        record.actionMarkdown,
      );
      await assert.rejects(readDurableRun(input), /Incomplete Run record/);
      await assert.rejects(
        writeDurableRun(input, record),
        /sequence already exists|occurrence already exists/i,
      );
      assert.equal(
        await fs.readFile(path.join(address.runDirectory, "action.md"), "utf8"),
        record.actionMarkdown,
      );
    } finally {
      t.mock.restoreAll();
      syncBuiltinESMExports();
      await fs.rm(repositoryRoot, { recursive: true, force: true });
    }
  });
}
