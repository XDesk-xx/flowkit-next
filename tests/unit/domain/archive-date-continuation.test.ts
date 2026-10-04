import assert from "node:assert/strict";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { archiveChange } from "../../../src/cli/support-change-archive.js";
import { inspectAction } from "../../../src/cli/action-inspect.js";
import { archiveFixture } from "./archive-contract-fixture.js";

test("pre-intent midnight drift is blocked by inspect and execution with immutable prestate", async () => {
  const f = await archiveFixture();
  const RealDate = Date;
  try {
    const started = await f.start(),
      target = { ...f.base, runId: started.runId };
    let calls = 0;
    globalThis.Date = class extends RealDate {
      constructor(value?: string | number) {
        super(value ?? RealDate.now());
        if (value === undefined && ++calls === 1)
          this.setDate(this.getDate() - 1);
      }
    } as DateConstructor;
    let interrupted;
    try {
      interrupted = await archiveChange(target, f.installation);
    } finally {
      globalThis.Date = RealDate;
    }
    assert.equal(interrupted.reason, "archive-date-drift");
    const effects = path.join(
      f.repositoryRoot,
      ".flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects",
      started.runId,
    );
    const prestate = await readFile(path.join(effects, "prestate.json"));
    const inspected = await inspectAction(target, f.installation);
    assert.equal(inspected.canContinue, false);
    assert.equal(inspected.effect, "blocked");
    assert.equal(inspected.reason, "archive-date-drift");
    assert.deepEqual(inspected.remaining, []);
    assert.equal(
      (await archiveChange(target, f.installation)).reason,
      "archive-date-drift",
    );
    assert.deepEqual(
      await readFile(path.join(effects, "prestate.json")),
      prestate,
    );
    await assert.rejects(access(path.join(effects, "openspec-intent.json")));
    await assert.rejects(
      access(path.join(f.repositoryRoot, "archive-count.txt")),
    );
  } finally {
    globalThis.Date = RealDate;
    await f.cleanup();
  }
});

test("acknowledged native success may finish remaining work across midnight", async (t) => {
  const f = await archiveFixture();
  try {
    const started = await f.start(),
      target = { ...f.base, runId: started.runId };
    const effects = path.join(
      f.repositoryRoot,
      ".flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects",
      started.runId,
    );
    await mkdir(path.join(effects, "openspec-observed.json"), {
      recursive: true,
    });
    assert.equal(
      (await archiveChange(target, f.installation)).status,
      "incomplete",
    );
    await rm(path.join(effects, "openspec-observed.json"), { recursive: true });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    t.mock.timers.enable({ apis: ["Date"], now: tomorrow });
    const inspection = await inspectAction(target, f.installation);
    assert.equal(inspection.canContinue, true);
    assert.deepEqual(inspection.remaining, [
      "observe-openspec",
      "rename",
      "coordination",
      "finish",
    ]);
    const completed = await archiveChange(target, f.installation);
    assert.equal(completed.status, "completed", JSON.stringify(completed));
    assert.equal(
      await readFile(path.join(f.repositoryRoot, "archive-count.txt"), "utf8"),
      "1",
    );
    assert.equal(
      (await f.finish(started.runId, completed)).effect,
      "confirmed",
    );
  } finally {
    t.mock.timers.reset();
    await f.cleanup();
  }
});

test("descriptor-only safe failure is finish-only across midnight, never a second invocation", async (t) => {
  const f = await archiveFixture();
  try {
    await writeFile(path.join(f.repositoryRoot, "fail-native"), "fault\n");
    const started = await f.start();
    const target = { ...f.base, runId: started.runId };
    const failed = await archiveChange(target, f.installation);
    assert.equal(failed.status, "failed");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    t.mock.timers.enable({ apis: ["Date"], now: tomorrow });
    assert.equal(
      (await archiveChange(target, f.installation)).status,
      "failed",
    );
    assert.equal(
      await readFile(path.join(f.repositoryRoot, "archive-count.txt"), "utf8"),
      "1",
    );
  } finally {
    t.mock.timers.reset();
    await f.cleanup();
  }
});
