import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("no-argument execution has exact output and successful exit", () => {
  const run = spawnSync(process.execPath, ["feature.mjs"], {
    cwd: import.meta.dirname,
  });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 0);
  assert.equal(run.signal, null);
  assert.deepEqual(run.stdout, Buffer.from("status: available\n"));
  assert.deepEqual(run.stderr, Buffer.alloc(0));
});
