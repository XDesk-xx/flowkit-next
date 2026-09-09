import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { stringify } from "yaml";
import {
  deriveDeliveryFinalizationRef,
  isDeliveryFinalizationRecord,
  readDeliveryFinalization,
} from "../../../src/domain/delivery-finalization.js";

const links = {
  projectId: "test-project",
  deliveryId: "test-delivery",
  ownerAuthorityRef: `owner:${"a".repeat(64)}`,
  sourceRef: "owner-input:final",
  fullTestAttempt: "12345678-1234-4123-8123-123456789abc",
  verifiedCandidateRef: `full-test-input:sha256:${"b".repeat(64)}`,
  fullTestExecutionRef: `full-test-execution:sha256:${"c".repeat(64)}`,
};

test("Final local projection is ordered and closed, without confirmation self-reference", () => {
  const golden =
    "delivery-finalization:sha256:" +
    createHash("sha256")
      .update("flowkit-delivery-finalization\0" + JSON.stringify(links))
      .digest("hex");
  assert.equal(deriveDeliveryFinalizationRef(links), golden);
  assert.equal(
    deriveDeliveryFinalizationRef(
      Object.fromEntries(Object.entries(links).reverse()),
    ),
    golden,
  );
  assert.notEqual(
    deriveDeliveryFinalizationRef({ ...links, sourceRef: "owner-input:other" }),
    golden,
  );
  for (const field of Object.keys(links)) {
    const incomplete = { ...links } as Record<string, unknown>;
    delete incomplete[field];
    assert.equal(deriveDeliveryFinalizationRef(incomplete), null);
  }
  assert.equal(
    deriveDeliveryFinalizationRef({ ...links, confirmationRef: golden }),
    null,
  );
  assert.equal(
    isDeliveryFinalizationRecord({ ...links, deliveryFinalizationRef: golden }),
    true,
  );
  assert.equal(
    isDeliveryFinalizationRecord({
      ...links,
      finalizedCandidateRef: "old",
      deliveryFinalizationRef: golden,
    }),
    false,
  );
});

test("reader distinguishes unpublished content, valid confirmation and unrelated append without writing", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-final-reader-"));
  try {
    await mkdir(path.join(root, ".flowkit"));
    await mkdir(path.join(root, "openspec/delivery-groups"), {
      recursive: true,
    });
    await writeFile(
      path.join(root, ".flowkit/project.json"),
      JSON.stringify({ projectId: links.projectId }),
    );
    const manifestPath = path.join(
      root,
      "openspec/delivery-groups/test-delivery.yaml",
    );
    await writeFile(
      manifestPath,
      stringify({ id: links.deliveryId, delivery: { state: "active" } }),
    );
    assert.equal(
      (await readDeliveryFinalization(root, links.deliveryId)).status,
      "not-completed",
    );
    const { projectId: _project, deliveryId: _delivery, ...finalLinks } = links;
    const ref = deriveDeliveryFinalizationRef(links)!;
    for (const confirmationRef of [null, undefined, "wrong", ref]) {
      const bytes = stringify({
        id: links.deliveryId,
        delivery: {
          state: "completed",
          fullTestStatus: "passed",
          fullTestAttempt: links.fullTestAttempt,
          finalizationStatus: "completed",
        },
        finalization: { state: "completed", ...finalLinks, confirmationRef },
      });
      await writeFile(manifestPath, bytes);
      await writeFile(path.join(root, "unrelated.md"), "unrelated history\n");
      const observed = await readDeliveryFinalization(root, links.deliveryId);
      assert.equal(
        observed.status,
        confirmationRef === ref ? "completed" : "unconfirmed",
      );
      assert.deepEqual(
        observed.record,
        confirmationRef === ref
          ? { ...links, deliveryFinalizationRef: ref }
          : null,
      );
      assert.equal(await readFile(manifestPath, "utf8"), bytes);
    }
    const confirmedBytes = await readFile(manifestPath, "utf8");
    for (const bytes of [
      confirmedBytes.replace(
        links.fullTestAttempt,
        "22345678-1234-4123-8123-123456789abc",
      ),
      confirmedBytes.replace("ownerAuthorityRef:", "obsoleteOwnerRef:"),
      confirmedBytes.replace("id: test-delivery", "id: other-delivery"),
    ]) {
      await writeFile(manifestPath, bytes);
      assert.notEqual(
        (await readDeliveryFinalization(root, links.deliveryId)).status,
        "completed",
      );
      assert.equal(await readFile(manifestPath, "utf8"), bytes);
    }
    await writeFile(manifestPath, confirmedBytes);
    await writeFile(
      path.join(root, ".flowkit/project.json"),
      '{"projectId":"wrong-project"}',
    );
    assert.equal(
      (await readDeliveryFinalization(root, links.deliveryId)).status,
      "unconfirmed",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
