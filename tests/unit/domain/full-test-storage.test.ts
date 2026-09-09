import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  publishFullTestAttempt,
  readFullTestCoordination,
} from "../../../src/internal/full-test-storage.js";

test("attempt publication preserves all non-target YAML bytes and rejects drift", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flowkit-ft-yaml-"));
  try {
    await fs.mkdir(path.join(root, "openspec/delivery-groups"), {
      recursive: true,
    });
    const file = path.join(root, "openspec/delivery-groups/test-delivery.yaml");
    const before =
      "# retained\r\nid: test-delivery\r\ndelivery:\r\n    state: active # retained\r\n    fullTestStatus: pending # test\r\n    finalizationStatus: 'pending'\r\nother: [1, 2] # unchanged\r\n";
    await fs.writeFile(file, before);
    const attempt = "12345678-1234-4321-8123-123456789abc";
    await publishFullTestAttempt(
      root,
      "test-delivery",
      Buffer.from(before),
      attempt,
      "pending",
    );
    const expected = before
      .replace("fullTestStatus: pending", 'fullTestStatus: "pending"')
      .replace("other:", `    fullTestAttempt: "${attempt}"\r\nother:`);
    assert.deepEqual(await fs.readFile(file), Buffer.from(expected));
    const selected = await readFullTestCoordination(root, "test-delivery");
    assert.equal(selected.attemptId, attempt);
    await assert.rejects(
      publishFullTestAttempt(
        root,
        "test-delivery",
        Buffer.from(before),
        attempt,
        "passed",
      ),
      /coordination drift/,
    );
    await publishFullTestAttempt(
      root,
      "test-delivery",
      selected.bytes,
      attempt,
      "passed",
    );
    assert.deepEqual(
      await fs.readFile(file),
      Buffer.from(
        expected.replace(
          'fullTestStatus: "pending"',
          'fullTestStatus: "passed"',
        ),
      ),
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
