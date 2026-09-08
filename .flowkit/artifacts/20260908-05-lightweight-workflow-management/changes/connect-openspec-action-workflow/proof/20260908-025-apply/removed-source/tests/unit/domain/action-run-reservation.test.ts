import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  reserveActionRun,
  ActionRunPersistenceError,
} from "../../../src/internal/action-run-reservation.js";
import {
  type RunContextRecord,
  type RunResultRecord,
} from "../../../src/domain/run-result-persistence.js";

async function fixture() {
  const repositoryRoot = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-reservation-"),
  );
  const occurrence = {
    date: "20260908",
    sequence: 1,
    actionId: "explore" as const,
  };
  const input = {
    repositoryRoot,
    deliveryId: "delivery-one",
    changeId: "change-one",
    changeStartSequence: 1,
    occurrence,
  };
  const context: RunContextRecord = {
    runId: "20260908-001-explore",
    occurrence,
    actionIdentity: {
      deliveryId: input.deliveryId,
      changeId: input.changeId,
      actionId: "explore",
    },
    role: "author",
    lifecycleState: "prepared",
    ownerAuthority: null,
    previousRunId: null,
  };
  const result: RunResultRecord = {
    runId: context.runId,
    actionIdentity: context.actionIdentity,
    authorConclusion: "PASS",
    reviewerVerdict: null,
    verificationVerdict: null,
    nextBoundary: "review-explore",
    facts: {},
  };
  return {
    input,
    context,
    result,
    cleanup: () => rm(repositoryRoot, { recursive: true, force: true }),
  };
}

test("reservation writes descriptor before dispatch and finishes three files once", async () => {
  const f = await fixture();
  try {
    const reservation = await reserveActionRun(
      f.input,
      f.context,
      "# Explore\n",
    );
    assert.deepEqual(await readdir(reservation.address.runDirectory), [
      "action.md",
    ]);
    const terminal = { ...f.context, lifecycleState: "terminal" as const };
    assert.deepEqual(
      (await reservation.finish(terminal, f.result)).context,
      terminal,
    );
    assert.deepEqual((await readdir(reservation.address.runDirectory)).sort(), [
      "action.md",
      "context.json",
      "result.json",
    ]);
    await assert.rejects(
      reservation.finish(terminal, f.result),
      ActionRunPersistenceError,
    );
    await assert.rejects(
      reserveActionRun(f.input, f.context, "# Other\n"),
      ActionRunPersistenceError,
    );
    assert.equal(
      await readFile(
        path.join(reservation.address.runDirectory, "action.md"),
        "utf8",
      ),
      "# Explore\n",
    );
  } finally {
    await f.cleanup();
  }
});

for (const failedFile of ["context.json", "result.json"]) {
  test(`write failure at ${failedFile} preserves partial and cannot be adopted`, async () => {
    const f = await fixture();
    try {
      const reservation = await reserveActionRun(
        f.input,
        f.context,
        "# Explore\n",
      );
      await mkdir(path.join(reservation.address.runDirectory, failedFile));
      await assert.rejects(
        reservation.finish(
          { ...f.context, lifecycleState: "terminal" },
          f.result,
        ),
        (error: unknown) =>
          error instanceof ActionRunPersistenceError &&
          error.persistence === "incomplete",
      );
      assert.equal(
        await readFile(
          path.join(reservation.address.runDirectory, "action.md"),
          "utf8",
        ),
        "# Explore\n",
      );
      if (failedFile === "result.json")
        assert.equal(
          JSON.parse(
            await readFile(
              path.join(reservation.address.runDirectory, "context.json"),
              "utf8",
            ),
          ).lifecycleState,
          "terminal",
        );
      await assert.rejects(
        reserveActionRun(f.input, f.context, "# Adopt\n"),
        ActionRunPersistenceError,
      );
    } finally {
      await f.cleanup();
    }
  });
}

test("preexisting raw bytes are never overwritten on completion", async () => {
  const f = await fixture();
  try {
    const reservation = await reserveActionRun(
      f.input,
      f.context,
      "# Explore\n",
    );
    const target = path.join(reservation.address.runDirectory, "result.json");
    await writeFile(target, "existing bytes\r\n");
    await assert.rejects(
      reservation.finish(
        { ...f.context, lifecycleState: "terminal" },
        f.result,
      ),
    );
    assert.equal(await readFile(target, "utf8"), "existing bytes\r\n");
  } finally {
    await f.cleanup();
  }
});
