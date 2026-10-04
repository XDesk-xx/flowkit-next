import assert from "node:assert/strict";
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { packageReadiness } from "../../../src/cli/action-readiness.js";
import { contextFixture } from "./action-context-fixture.js";
import { executionFixture } from "./execution-recovery-fixture.js";
import { inspectAction } from "../../../src/cli/action-inspect.js";
import { archiveChange } from "../../../src/cli/support-change-archive.js";

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

test("Archive admission ignores unreviewed dependencies/data, absent checks and native task validation", async () => {
  const f = await executionFixture();
  try {
    await mkdir(path.join(f.repositoryRoot, "node_modules/.bin"), {
      recursive: true,
    });
    await writeFile(
      path.join(f.repositoryRoot, "node_modules/.bin/pnpm.cmd"),
      '@"%~dp0\\..\\pnpm\\bin\\pnpm.cjs" %*\r\n',
    );
    await symlink(
      f.flowkitHome,
      path.join(f.repositoryRoot, "ignored-data"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await rm(path.join(f.repositoryRoot, f.source, "tasks.md"));
    const started = await f.call("action start", {
      ...f.base,
      actionId: "archive",
      role: "author",
    });
    assert.equal(started.effect, "started");
    const descriptor = await readFile(
      path.join(started.directory, "action.md"),
      "utf8",
    );
    assert.match(descriptor, /"archiveContractVersion": 2/);
    assert.doesNotMatch(descriptor, /applicableChecks/);
    await assert.rejects(
      readFile(
        path.join(
          f.repositoryRoot,
          ".flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects",
          started.runId,
          "prestate.json",
        ),
      ),
    );
  } finally {
    await f.cleanup();
  }
});

test("Archive admission still rejects reviewed raw drift and retired check requests", async () => {
  const f = await executionFixture();
  try {
    await assert.rejects(
      f.call("action start", {
        ...f.base,
        actionId: "archive",
        role: "author",
        applicableChecks: [{ id: "not-configured", reason: "probe" }],
      }),
      /no longer accepts applicableChecks/,
    );
    await writeFile(path.join(f.repositoryRoot, "candidate.txt"), "changed\n");
    await assert.rejects(
      f.call("action start", {
        ...f.base,
        actionId: "archive",
        role: "author",
      }),
      /Candidate artifact changed/,
    );
  } finally {
    await f.cleanup();
  }
});

test("legacy descriptor shape remains readable but cannot be continued by version-2 manager", async () => {
  const f = await executionFixture();
  try {
    const started = await f.call("action start", {
      ...f.base,
      actionId: "archive",
      role: "author",
    });
    const file = path.join(started.directory, "action.md");
    const descriptor = JSON.parse(
      (await readFile(file, "utf8")).slice("# Action started\n\n".length),
    );
    delete descriptor.archiveContractVersion;
    descriptor.applicableChecks = [
      { id: "legacy-check", reason: "historical shape fixture" },
    ];
    const old = Buffer.from(
      "# Action started\n\n" + JSON.stringify(descriptor, null, 2) + "\n",
    );
    await writeFile(file, old);
    const target = { ...f.base, runId: started.runId };
    const inspected = await inspectAction(target, f.installation);
    assert.equal(inspected.canContinue, false);
    assert.match(
      String("reason" in inspected ? inspected.reason : ""),
      /incompatible/,
    );
    assert.equal(
      (await archiveChange(target, f.installation)).status,
      "incomplete",
    );
    assert.deepEqual(await readFile(file), old);
  } finally {
    await f.cleanup();
  }
});
