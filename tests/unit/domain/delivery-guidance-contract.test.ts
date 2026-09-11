import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  resolveDeliveryGuidanceRef,
  DELIVERY_OPERATIONS,
  canonicalDeliveryGuidancePath,
  isDeliveryOperationId,
} from "../../../src/domain/index.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";
const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";

test("DeliveryOperationId is a closed exact four-value catalog with deterministic Guidance mapping", () => {
  assert.deepEqual(DELIVERY_OPERATIONS, [
    "delivery-start",
    "delivery-full-test",
    "delivery-final",
    "delivery-repository-integration",
  ]);

  const expected = new Map([
    ["delivery-start", "skills/delivery/start/SKILL.md"],
    ["delivery-full-test", "skills/delivery/full-test/SKILL.md"],
    ["delivery-final", "skills/delivery/final/SKILL.md"],
    [
      "delivery-repository-integration",
      "skills/delivery/repository-integration/SKILL.md",
    ],
  ]);

  for (const operationId of DELIVERY_OPERATIONS) {
    assert.equal(isDeliveryOperationId(operationId), true);
    assert.equal(
      canonicalDeliveryGuidancePath(operationId),
      expected.get(operationId),
    );
  }

  assert.equal(
    isDeliveryOperationId("delivery-architecture-finalization"),
    false,
  );
  assert.equal(
    canonicalDeliveryGuidancePath("delivery-architecture-finalization"),
    null,
  );
  assert.equal(isDeliveryOperationId("start"), false);
  assert.equal(isDeliveryOperationId("Delivery-Start"), false);
  assert.equal(canonicalDeliveryGuidancePath("delivery_start"), null);
  assert.equal(canonicalDeliveryGuidancePath("../delivery-start"), null);
});

test("canonical Delivery Final Guidance is generic, content-bound, and operation-bounded", async () => {
  const body = await readFile("skills/delivery/final/SKILL.md", "utf8");
  assert.equal(body.includes(deliveryId), false);
  const ref = await resolveDeliveryGuidanceRef(
    fixtureInstallation(process.cwd()),
    "delivery-final",
  );
  assert.equal(ref?.path, "skills/delivery/final/SKILL.md");
  assert.equal(
    ref?.contentSha256,
    createHash("sha256").update(body).digest("hex"),
  );
});

test("product Author HOW separates code verdict, Git diagnostics and current Full Test", async () => {
  for (const action of ["apply", "revise-apply"]) {
    const body = await readFile(
      "skills/actions/" + action + "/SKILL.md",
      "utf8",
    );
    assert.match(body, /bounded formatting、lint/);
    assert.match(body, /空白不自动阻断 checkpoint/);
    assert.match(body, /不逐 Change 加 attributes/);
    assert.match(body, /不创建提交权限/);
    assert.match(body, /不继承普通 Action 的 candidate\/reuse/);
  }
});
