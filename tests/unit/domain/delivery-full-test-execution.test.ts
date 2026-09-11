import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { mock } from "node:test";
import {
  invokeDeliveryFullTestOperation,
  prepareDeliveryFullTestOperationPackage,
  isFormalFullTestAuthorityForDelivery,
  isDeliveryFullTestOperationFacts,
  deriveDeliveryFullTestExecutionRef,
  readCurrentDeliveryFullTest,
} from "../../../src/domain/index.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";
import {
  FULL_TEST_CONFIG,
  readFullTestInput,
  deriveFullTestCheckRef,
} from "../../../src/internal/full-test-input.js";
import { executeFullTestCheck } from "../../../src/internal/full-test-process.js";

const deliveryId = "test-full-test";
const ownerAuthority = {
  ref: "owner:" + "a".repeat(64),
  decision: "authorize-formal-full-test",
  deliveryId,
  sourceRef: "test:owner-input",
  scope: ["delivery-full-test"],
} as const;
const input = { deliveryId, ownerAuthority };
async function fixture(
  scripts: string[] = ["process.stdout.write(Buffer.from([0,255,13,10]))"],
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flowkit-ft-"));
  const checks = scripts.map((script, index) => ({
    checkId: "check-" + index,
    program: process.execPath,
    args: ["-e", script],
    cwd: ".",
  }));
  for (const dir of [
    "config/verification",
    ".flowkit",
    "openspec/delivery-groups",
    "skills/delivery/full-test",
  ])
    await fs.mkdir(path.join(root, dir), { recursive: true });
  await fs.writeFile(path.join(root, "source.txt"), "base\n");
  await fs.writeFile(
    path.join(root, ".flowkit/project.json"),
    '{"projectId":"test-project"}',
  );
  await fs.writeFile(
    path.join(root, "skills/delivery/full-test/SKILL.md"),
    "# Full Test\n",
  );
  await fs.writeFile(
    path.join(root, "openspec/delivery-groups/" + deliveryId + ".yaml"),
    "id: " +
      deliveryId +
      "\ndelivery:\n  state: active\n  fullTestStatus: pending\n  finalizationStatus: pending\n# retained\n",
  );
  await fs.writeFile(
    path.join(root, FULL_TEST_CONFIG),
    JSON.stringify({
      inputs: ["source.txt"],
      exclude: [".flowkit"],
      environment: [],
      checks,
    }),
  );
  return root;
}
const invoke = (root: string) =>
  invokeDeliveryFullTestOperation(root, input, fixtureInstallation(root));
const remove = (root: string) => fs.rm(root, { recursive: true, force: true });

test("exact Full Test authority and closed configuration reject caller overrides", async () => {
  assert.equal(
    isFormalFullTestAuthorityForDelivery(ownerAuthority, deliveryId),
    true,
  );
  for (const overrides of [
    { scope: ["delivery-full-test", "git"] },
    { changeId: "change" },
    { decision: "create-delivery" },
    { deliveryId: "wrong" },
  ])
    assert.equal(
      isFormalFullTestAuthorityForDelivery(
        { ...ownerAuthority, ...overrides },
        deliveryId,
      ),
      false,
    );
  const root = await fixture();
  try {
    assert.equal(
      await prepareDeliveryFullTestOperationPackage(
        root,
        { ...input, checks: [] },
        fixtureInstallation(root),
      ),
      null,
    );
    const a = await prepareDeliveryFullTestOperationPackage(
      root,
      input,
      fixtureInstallation(root),
    );
    const b = await prepareDeliveryFullTestOperationPackage(
      root,
      input,
      fixtureInstallation(root),
    );
    assert.ok(a && b);
    assert.ok(isDeliveryFullTestOperationFacts(a.operationFacts));
    assert.equal(
      isDeliveryFullTestOperationFacts({
        ...a.operationFacts,
        candidateRef: "old",
      }),
      false,
    );
    assert.equal(
      isDeliveryFullTestOperationFacts({
        ...a.operationFacts,
        orderedChecks: [
          ...a.operationFacts.orderedChecks,
          ...a.operationFacts.orderedChecks,
        ],
      }),
      false,
    );
    assert.notEqual(
      deriveDeliveryFullTestExecutionRef(a),
      deriveDeliveryFullTestExecutionRef(b),
    );
  } finally {
    await remove(root);
  }
});

test("no Git target executes fresh attempts and saves exact raw bytes for cross-session reading", async () => {
  const root = await fixture();
  try {
    const first = await invoke(root);
    assert.equal(first.status, "terminal", JSON.stringify(first));
    if (first.status !== "terminal") throw Error("not terminal");
    assert.equal(first.verdict, "passed");
    const base =
      ".flowkit/artifacts/" +
      deliveryId +
      "/full-test/" +
      first.record.attemptId;
    assert.deepEqual(
      await fs.readFile(path.join(root, base, "checks/check-0/stdout.txt")),
      Buffer.from([0, 255, 13, 10]),
    );
    assert.equal(
      (await readCurrentDeliveryFullTest(root, deliveryId)).status,
      "passed",
    );
    const second = await invoke(root);
    assert.equal(second.status, "terminal");
    if (second.status !== "terminal") throw Error("not terminal");
    assert.notEqual(second.record.executionRef, first.record.executionRef);
    assert.equal(second.record.inputRef, first.record.inputRef);
    await fs.appendFile(path.join(root, "source.txt"), "drift");
    assert.equal(
      (await readCurrentDeliveryFullTest(root, deliveryId)).status,
      "stale",
    );
  } finally {
    await remove(root);
  }
});

test("failed current attempt never falls back to a previous pass", async () => {
  const root = await fixture([
    "const fs=require('fs');process.exit(fs.existsSync('.tmp-fail')?1:0)",
  ]);
  try {
    assert.equal((await invoke(root)).status, "terminal");
    await fs.writeFile(path.join(root, ".tmp-fail"), "fail");
    const second = await invoke(root);
    assert.equal(second.status, "terminal");
    if (second.status !== "terminal") throw Error("not terminal");
    assert.equal(second.verdict, "failed");
    assert.equal(
      (await readCurrentDeliveryFullTest(root, deliveryId)).status,
      "failed",
    );
  } finally {
    await remove(root);
  }
});

test("selected source drift stops later checks and is saved as a real failed attempt", async () => {
  const root = await fixture([
    "require('fs').appendFileSync('source.txt','changed')",
    "throw Error('must not execute')",
  ]);
  try {
    const result = await invoke(root);
    assert.equal(result.status, "terminal");
    if (result.status !== "terminal") throw Error("not terminal");
    assert.equal(result.verdict, "failed");
    assert.equal(result.record.checks[1].status, "not-executed");
  } finally {
    await remove(root);
  }
});

test("saved stream damage and incomplete latest results cannot be consumed as PASS", async () => {
  const root = await fixture();
  try {
    const result = await invoke(root);
    if (result.status !== "terminal") throw Error(JSON.stringify(result));
    const base = path.join(
      root,
      ".flowkit/artifacts",
      deliveryId,
      "full-test",
      result.record.attemptId,
    );
    await fs.appendFile(path.join(base, "checks/check-0/stdout.txt"), "damage");
    assert.equal(
      (await readCurrentDeliveryFullTest(root, deliveryId)).status,
      "invalid",
    );
    await fs.rm(path.join(base, "result.json"));
    assert.equal(
      (await readCurrentDeliveryFullTest(root, deliveryId)).status,
      "invalid",
    );
  } finally {
    await remove(root);
  }
});
test("start, stream-open, stream-write, result and status-publication failures never expose old PASS", async () => {
  for (const phase of [
    "start",
    "select",
    "stdout",
    "stream-write",
    "result",
    "publish",
  ]) {
    const root = await fixture();
    try {
      const previous = await invoke(root);
      assert.equal(previous.status, "terminal");
      const originalOpen = fs.open;
      const originalRename = fs.rename;
      let renames = 0;
      if (phase === "publish" || phase === "select")
        mock.method(
          fs,
          "rename",
          async (...args: Parameters<typeof fs.rename>) => {
            renames += 1;
            if (renames === (phase === "select" ? 1 : 2))
              throw new Error("fixture status publication failure");
            return originalRename(...args);
          },
        );
      else
        mock.method(fs, "open", async (...args: Parameters<typeof fs.open>) => {
          const target = String(args[0]);
          if (
            (phase === "start" && target.endsWith("start.json")) ||
            (phase === "stdout" && target.endsWith("stdout.txt")) ||
            (phase === "result" && target.endsWith("result.json"))
          )
            throw new Error("fixture save failure");
          const handle = await originalOpen(...args);
          if (phase === "stream-write" && target.endsWith("stdout.txt"))
            mock.method(handle, "writeFile", async () => {
              throw Error("fixture stream failure");
            });
          return handle;
        });
      const failed = await invoke(root);
      assert.equal(failed.status, "failed", phase);
      mock.restoreAll();
      const current = await readCurrentDeliveryFullTest(root, deliveryId);
      assert.equal(
        current.status,
        phase === "start" || phase === "select" ? "passed" : "incomplete",
        phase,
      );
      // Having reported the incomplete current attempt, a new explicit invocation replaces it without rewriting it.
      assert.equal((await invoke(root)).status, "terminal");
    } finally {
      mock.restoreAll();
      await remove(root);
    }
  }
});

test("checks remain ordered, preserve large stderr and continue after command failure", async () => {
  const root = await fixture([
    "process.stderr.write(Buffer.alloc(1024*1024,255),()=>process.exit(7))",
    "process.stdout.write('second')",
  ]);
  try {
    const outcome = await invoke(root);
    if (outcome.status !== "terminal") throw Error(JSON.stringify(outcome));
    assert.equal(outcome.verdict, "failed");
    assert.deepEqual(
      outcome.record.checks.map((c) => c.status),
      ["failed", "passed"],
    );
    const base = path.join(
      root,
      ".flowkit/artifacts",
      deliveryId,
      "full-test",
      outcome.record.attemptId,
    );
    const stderr = await fs.readFile(
      path.join(base, "checks/check-0/stderr.txt"),
    );
    assert.equal(stderr.length, 1024 * 1024);
    assert.equal(stderr.equals(Buffer.alloc(1024 * 1024, 255)), true);
  } finally {
    await remove(root);
  }
});

test("spawn failure and process termination cannot become PASS", async () => {
  const root = await fixture(["process.kill(process.pid, 'SIGTERM')"]);
  try {
    const selected = await readFullTestInput(root);
    const check = { ...selected.orderedChecks[0], cwd: "source.txt" };
    check.checkRef = deriveFullTestCheckRef(check);
    const failed = await executeFullTestCheck(
      root,
      ".flowkit/artifacts/spawn-fixture",
      check,
    );
    assert.equal(failed.status, "process-failed");
    const outcome = await invoke(root);
    if (outcome.status !== "terminal") throw Error(JSON.stringify(outcome));
    assert.equal(outcome.verdict, "failed");
    assert.notEqual(outcome.record.checks[0].status, "passed");
    const command = JSON.parse(
      await fs.readFile(
        path.join(root, outcome.record.checks[0].command!.artifact),
        "utf8",
      ),
    );
    if (process.platform !== "win32") assert.equal(command.signal, "SIGTERM");
  } finally {
    await remove(root);
  }
});

test("current reader rejects wrong ownership, escaping and non-regular material", async () => {
  const root = await fixture();
  try {
    for (const damage of ["ownership", "escape", "directory", "junction"]) {
      const outcome = await invoke(root);
      if (outcome.status !== "terminal") throw Error(JSON.stringify(outcome));
      const base = path.join(
        root,
        ".flowkit/artifacts",
        deliveryId,
        "full-test",
        outcome.record.attemptId,
      );
      const resultPath = path.join(base, "result.json");
      const record = JSON.parse(await fs.readFile(resultPath, "utf8"));
      if (damage === "ownership") record.projectId = "wrong-project";
      if (damage === "escape") record.checks[0].command.artifact = "../outside";
      if (damage === "ownership" || damage === "escape")
        await fs.writeFile(resultPath, JSON.stringify(record));
      else if (damage === "directory") {
        await fs.rm(path.join(base, "checks/check-0/stdout.txt"));
        await fs.mkdir(path.join(base, "checks/check-0/stdout.txt"));
      } else {
        await fs.rename(
          path.join(base, "checks"),
          path.join(base, "original-checks"),
        );
        await fs.symlink(
          path.join(base, "original-checks"),
          path.join(base, "checks"),
          "junction",
        );
      }
      assert.equal(
        (await readCurrentDeliveryFullTest(root, deliveryId)).status,
        "invalid",
        damage,
      );
    }
  } finally {
    await remove(root);
  }
});
