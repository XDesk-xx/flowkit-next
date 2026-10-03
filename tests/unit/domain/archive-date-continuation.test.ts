import assert from "node:assert/strict";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { inspectAction } from "../../../src/cli/action-inspect.js";
import { archiveChange } from "../../../src/cli/support-change-archive.js";
import { directoryHashes } from "../../../src/internal/archive-file-identities.js";
import { executionFixture } from "./execution-recovery-fixture.js";

test("Archive inspection agrees with execution across midnight without blocking completed OpenSpec effects", async (t) => {
  const f = await executionFixture();
  try {
    const runtime = path.join(
      f.flowkitHome,
      "tools/openspec/1.10.0/bin/openspec.js",
    );
    const original = await readFile(runtime, "utf8");
    // Synthetic OpenSpec succeeds in scratch; the actual invocation loses its response before/after effects.
    await writeFile(
      runtime,
      `if(process.argv[2]==='archive'){const fs=require('node:fs');const path=require('node:path');const root=process.cwd();const actual=!root.includes('flowkit-archive-');if(actual&&fs.existsSync('before-effect'))process.exit(9);const n=new Date();const date=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');const target=path.join(root,'openspec/changes/archive',date+'-'+process.argv[3]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(path.join(root,'openspec/changes',process.argv[3]),target);const state=JSON.parse(fs.readFileSync('observation.json'));state.changes=[];fs.writeFileSync('observation.json',JSON.stringify(state));process.exit(actual?9:0)}\n` +
        original,
    );
    await writeFile(
      path.join(f.repositoryRoot, "before-effect"),
      "synthetic fault\n",
    );
    await mkdir(path.join(f.repositoryRoot, "config/verification"), {
      recursive: true,
    });
    await writeFile(
      path.join(f.repositoryRoot, "config/verification/full-test.json"),
      JSON.stringify({
        inputs: ["openspec"],
        exclude: [],
        environment: [],
        checks: [
          {
            checkId: "candidate-check",
            program: "git",
            args: ["hash-object", "candidate.txt"],
            cwd: ".",
          },
        ],
      }),
    );
    const started = await f.call("action start", {
      ...f.base,
      actionId: "archive",
      role: "author",
      applicableChecks: [
        { id: "candidate-check", reason: "synthetic date regression" },
      ],
    });
    const target = { ...f.base, runId: started.runId };
    const first = await archiveChange(target, f.installation);
    assert.equal(first.status, "incomplete");
    assert.match(String(first.reason), /Archive failed/);
    const prestate = path.join(
      f.repositoryRoot,
      ".flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects",
      started.runId,
      "prestate.json",
    );
    const saved = await readFile(prestate);
    const sameDay = await inspectAction(target, f.installation);
    assert.equal(sameDay.actualEffect, "none");
    assert.equal(sameDay.canContinue, true);
    const before = await directoryHashes(f.repositoryRoot, ".flowkit");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    t.mock.timers.enable({ apis: ["Date"], now: tomorrow });
    const inspected = await inspectAction(target, f.installation);
    assert.equal(inspected.effect, "blocked");
    assert.equal(inspected.canContinue, false);
    assert.equal(
      "reason" in inspected && inspected.reason,
      "archive-date-drift",
    );
    const blocked = await archiveChange(target, f.installation);
    assert.equal(blocked.status, "incomplete");
    assert.equal(blocked.effect, "none");
    assert.equal(blocked.reason, "archive-date-drift");
    assert.deepEqual(
      await directoryHashes(f.repositoryRoot, ".flowkit"),
      before,
    );
    t.mock.timers.reset();

    // Once OpenSpec has actually moved the source, next-day recovery must only finish remaining steps.
    await unlink(path.join(f.repositoryRoot, "before-effect"));
    assert.equal(
      (await archiveChange(target, f.installation)).status,
      "incomplete",
    );
    t.mock.timers.enable({ apis: ["Date"], now: tomorrow });
    const afterEffect = await inspectAction(target, f.installation);
    assert.equal(afterEffect.actualEffect, "openspec");
    assert.equal(afterEffect.canContinue, true);
    const continued = await archiveChange(target, f.installation);
    assert.equal(continued.status, "completed");
    assert.equal(continued.archivePath, first.archivePath);
    assert.deepEqual(await readFile(prestate), saved);
  } finally {
    t.mock.timers.reset();
    await f.cleanup();
  }
});
