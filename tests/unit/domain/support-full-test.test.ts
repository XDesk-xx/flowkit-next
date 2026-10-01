import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runFullTest } from "../../../src/cli/support-full-test.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";

const deliveryId = "support-full-test";
const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const owner = (letter: string) => ({
  ref: `owner:${letter.repeat(64)}`,
  decision: "authorize-formal-full-test",
  deliveryId,
  sourceRef: `test:owner-${letter}`,
  scope: ["delivery-full-test"],
});

test("fixed Full Test request retries are read-only and a new attempt needs distinct Owner fact", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flowkit-support-ft-"));
  try {
    for (const dir of [
      "config/verification",
      ".flowkit",
      ".tmp",
      "openspec/delivery-groups",
      "skills/delivery/full-test",
    ])
      await fs.mkdir(path.join(root, dir), { recursive: true });
    await fs.writeFile(
      path.join(root, ".flowkit/project.json"),
      '{"projectId":"test-project"}\n',
    );
    await fs.writeFile(path.join(root, "source.txt"), "base\n");
    await fs.writeFile(
      path.join(root, "skills/delivery/full-test/SKILL.md"),
      "# Full Test\n",
    );
    await fs.writeFile(
      path.join(root, `openspec/delivery-groups/${deliveryId}.yaml`),
      `id: ${deliveryId}\ndelivery:\n  state: active\n  fullTestStatus: pending\n  finalizationStatus: pending\n`,
    );
    const script =
      "const fs=require('fs');const p='.tmp/count';let n=0;try{n=Number(fs.readFileSync(p,'utf8'))}catch{}fs.writeFileSync(p,String(n+1))";
    await fs.writeFile(
      path.join(root, "config/verification/full-test.json"),
      JSON.stringify({
        inputs: ["source.txt"],
        exclude: [".flowkit", ".tmp"],
        environment: [],
        checks: [
          {
            checkId: "count",
            program: process.execPath,
            args: ["-e", script],
            cwd: ".",
          },
        ],
      }),
    );
    const installation = fixtureInstallation(root);
    const first = {
      repositoryRoot: root,
      deliveryId,
      ownerAuthority: owner("a"),
      attemptId: firstId,
      expectedCurrentAttemptId: null,
    };
    const outcome = await runFullTest(first, installation);
    assert.equal(outcome.status, "completed", JSON.stringify(outcome));
    assert.equal(await fs.readFile(path.join(root, ".tmp/count"), "utf8"), "1");
    const retry = await runFullTest(first, installation);
    assert.equal(retry.status, "completed", JSON.stringify(retry));
    assert.equal(retry.effect, "readback");
    assert.equal(await fs.readFile(path.join(root, ".tmp/count"), "utf8"), "1");
    const sameOwner = await runFullTest(
      { ...first, attemptId: secondId, expectedCurrentAttemptId: firstId },
      installation,
    );
    assert.equal(sameOwner.status, "incomplete");
    assert.equal(await fs.readFile(path.join(root, ".tmp/count"), "utf8"), "1");
    const second = await runFullTest(
      {
        ...first,
        ownerAuthority: owner("b"),
        attemptId: secondId,
        expectedCurrentAttemptId: firstId,
      },
      installation,
    );
    assert.equal(second.status, "completed", JSON.stringify(second));
    assert.equal(await fs.readFile(path.join(root, ".tmp/count"), "utf8"), "2");
    const historical = await runFullTest(first, installation);
    assert.equal(historical.status, "completed", JSON.stringify(historical));
    assert.equal(historical.currentStatus, "historical");
    const stream = path.join(
      root,
      `.flowkit/artifacts/${deliveryId}/full-test/${firstId}/checks/count/stdout.txt`,
    );
    await fs.unlink(stream);
    const damaged = await runFullTest(first, installation);
    assert.equal(damaged.status, "incomplete", JSON.stringify(damaged));
    assert.equal(damaged.reason, "attempt-material-unconfirmed");
    assert.equal(await fs.readFile(path.join(root, ".tmp/count"), "utf8"), "2");
    const conflict = await runFullTest(
      { ...first, ownerAuthority: owner("c") },
      installation,
    );
    assert.equal(conflict.status, "incomplete");
    assert.equal(await fs.readFile(path.join(root, ".tmp/count"), "utf8"), "2");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
