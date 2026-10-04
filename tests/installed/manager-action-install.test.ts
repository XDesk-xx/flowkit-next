import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { contextFixture } from "../unit/domain/action-context-fixture.js";
import { gitBytes } from "../../src/internal/git-checkpoint-scope.js";
import { archiveFixture } from "../unit/domain/archive-contract-fixture.js";

// Detached installation check: invoke directly with final and previous CLI paths.
// This file is outside the fixed test:domain and test:acceptance globs.
const [finalEntry, previousEntry] = process.argv
  .slice(2)
  .map((entry) => path.resolve(entry));
if (!finalEntry || !previousEntry)
  throw new Error(
    "Usage: manager-action-install.test.ts FINAL_ENTRY PREVIOUS_ENTRY",
  );
const run = promisify(execFile);

test("detached installed manager preserves version-2 failed Run and finishes a new Archive occurrence", async () => {
  const f = await archiveFixture();
  let request = 0;
  const call = async (action: string[], value: unknown) => {
    const input = path.join(f.root, `installed-${++request}.json`);
    await writeFile(input, JSON.stringify(value));
    const args =
      action[0] === "change"
        ? [
            ...action,
            "--repository-root",
            f.repositoryRoot,
            "--delivery-id",
            f.base.deliveryId,
            "--change-id",
            f.base.changeId,
          ]
        : action;
    return cli(finalEntry, args, input).catch((error: { stdout?: string }) => {
      if (action[0] === "change" && error.stdout)
        return JSON.parse(error.stdout);
      throw error;
    });
  };
  try {
    await writeFile(path.join(f.repositoryRoot, "fail-native"), "fault\n");
    const start = await call(["action", "start"], {
      ...f.base,
      actionId: "archive",
      role: "author",
    });
    const failed = await call(["change", "archive"], {
      ...f.base,
      runId: start.runId,
    });
    assert.deepEqual(failed.archiveOutcome, {
      kind: "failed",
      effect: "no-mutation",
      retryable: true,
    });
    const finish = (runId: unknown, value: Record<string, unknown>) =>
      call(["action", "finish"], {
        ...f.base,
        runId,
        role: "author",
        terminal: true,
        result: {
          runId,
          actionIdentity: {
            deliveryId: f.base.deliveryId,
            changeId: f.base.changeId,
            actionId: "archive",
          },
          authorConclusion: value.status === "completed" ? "PASS" : "FAIL",
          reviewerVerdict: null,
          verificationVerdict: null,
          nextBoundary: value.status === "completed" ? "checkpoint" : null,
          facts: {
            archiveOutcome: value.archiveOutcome,
            archiveMaterialRefs: value.archiveMaterialRefs,
            archivePath: value.archivePath,
            projectOrdinal: 1,
            proofRefs: [],
          },
        },
      });
    await finish(start.runId, failed);
    const saved = await readFile(
      path.join(start.directory as string, "result.json"),
    );
    await rm(path.join(f.repositoryRoot, "fail-native"));
    const retry = await call(["action", "start"], {
      ...f.base,
      actionId: "archive",
      role: "author",
    });
    const archived = await call(["change", "archive"], {
      ...f.base,
      runId: retry.runId,
    });
    assert.equal(archived.status, "completed", JSON.stringify(archived));
    await finish(retry.runId, archived);
    assert.equal((await call(["status"], f.base)).status, "archived");
    assert.deepEqual(
      await readFile(path.join(start.directory as string, "result.json")),
      saved,
    );
    assert.equal(
      await readFile(path.join(f.repositoryRoot, "archive-count.txt"), "utf8"),
      "2",
    );
  } finally {
    await f.cleanup();
  }
});

async function cli(entry: string, action: string[], input: string) {
  const result = await run(
    process.execPath,
    [entry, ...action, "--input", input],
    { cwd: path.dirname(entry), timeout: 30_000 },
  );
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

async function fixtureWithOrdinal() {
  const fixture = await contextFixture();
  await gitBytes(fixture.repositoryRoot, ["init"]);
  await writeFile(
    path.join(fixture.repositoryRoot, ".gitattributes"),
    ".flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
  );
  const manifest = path.join(
    fixture.repositoryRoot,
    "openspec/delivery-groups/delivery-one.yaml",
  );
  const document = JSON.parse(await readFile(manifest, "utf8")) as {
    changes: { projectOrdinal?: number }[];
  };
  document.changes[0]!.projectOrdinal = 1;
  await writeFile(manifest, JSON.stringify(document));
  return fixture;
}

async function startedExplore(
  entry: string,
  fixture: Awaited<ReturnType<typeof fixtureWithOrdinal>>,
) {
  const base = {
    repositoryRoot: fixture.repositoryRoot,
    flowkitHome: fixture.flowkitHome,
    deliveryId: "delivery-one",
    changeId: "change-one",
  };
  const start = path.join(fixture.root, "start.json");
  await writeFile(
    start,
    JSON.stringify({ ...base, actionId: "explore", role: "author" }),
  );
  const started = await cli(entry, ["action", "start"], start);
  assert.equal(started.effect, "started");
  const runId = started.runId as string;
  const note = path.join(
    fixture.repositoryRoot,
    "openspec/changes/change-one/explore.md",
  );
  await mkdir(path.dirname(note), { recursive: true });
  await writeFile(note, "# Isolated installation probe\n");
  const exploreSha256 = createHash("sha256")
    .update(await readFile(note))
    .digest("hex");
  return { base, started, runId, exploreSha256 };
}

function exploreResult(
  runId: string,
  exploreSha256: string,
  proofRefs: object[],
) {
  return {
    runId,
    actionIdentity: {
      deliveryId: "delivery-one",
      changeId: "change-one",
      actionId: "explore",
    },
    authorConclusion: "PASS",
    reviewerVerdict: null,
    verificationVerdict: null,
    nextBoundary: "review-explore",
    facts: {
      projectOrdinal: 1,
      exploreArtifact: "openspec/changes/change-one/explore.md",
      exploreSha256,
      proofRefs,
    },
  };
}

test("final installation inspects numbered proof and finishes its own Run", async () => {
  const fixture = await fixtureWithOrdinal();
  try {
    const { base, started, runId, exploreSha256 } = await startedExplore(
      finalEntry,
      fixture,
    );
    const proofPath = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${runId}/stdout.txt`;
    const bytes = Buffer.from([0, 13, 10, 255]);
    await mkdir(path.dirname(path.join(fixture.repositoryRoot, proofPath)), {
      recursive: true,
    });
    await writeFile(path.join(fixture.repositoryRoot, proofPath), bytes);
    const inspect = path.join(fixture.root, "inspect.json");
    await writeFile(
      inspect,
      JSON.stringify({ ...base, runId, path: proofPath }),
    );
    const observed = await cli(finalEntry, ["proof", "inspect"], inspect);
    assert.equal(observed.effect, "confirmed");
    assert.equal(observed.bytes, bytes.length);
    const ref = {
      path: proofPath,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      deliveryId: "delivery-one",
      changeId: "change-one",
      runId,
      purpose: "fixture",
    };
    const finish = path.join(fixture.root, "finish.json");
    await writeFile(
      finish,
      JSON.stringify({
        ...base,
        runId,
        role: "author",
        terminal: true,
        result: exploreResult(runId, exploreSha256, [ref]),
      }),
    );
    const completed = await cli(finalEntry, ["action", "finish"], finish);
    assert.equal(completed.effect, "confirmed");
    assert.deepEqual(await readdir(started.directory as string), [
      "action.md",
      "context.json",
      "result.json",
    ]);
  } finally {
    await fixture.cleanup();
  }
});

test("final installation rejects a Run bound to previous Skill bytes", async () => {
  const fixture = await fixtureWithOrdinal();
  try {
    const { base, started, runId, exploreSha256 } = await startedExplore(
      previousEntry,
      fixture,
    );
    const finish = path.join(fixture.root, "finish.json");
    await writeFile(
      finish,
      JSON.stringify({
        ...base,
        runId,
        role: "author",
        terminal: true,
        result: exploreResult(runId, exploreSha256, []),
      }),
    );
    await assert.rejects(
      cli(finalEntry, ["action", "finish"], finish),
      (error: unknown) => {
        const payload = JSON.parse(
          (error as { stdout?: string }).stdout ?? "{}",
        ) as { error?: { kind?: string } };
        assert.equal(
          payload.error?.kind,
          "package-drift",
          JSON.stringify(payload),
        );
        return true;
      },
    );
    assert.deepEqual(await readdir(started.directory as string), ["action.md"]);
  } finally {
    await fixture.cleanup();
  }
});
