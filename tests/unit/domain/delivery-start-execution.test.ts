import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  invokeDeliveryStartOperation,
  prepareDeliveryStartOperationPackage,
  type DeliveryStartPreparationInput,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";

const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";
const acceptedBaseCommit = "a".repeat(40);
const planningReference = {
  artifact: "flowkit-next-d04-stable-core-closure-final-reference.md",
  contentSha256: "b".repeat(64),
};

function authority(commit = false): OwnerAuthorityFact {
  return {
    ref: `owner:${"c".repeat(64)}`,
    decision: "create-delivery",
    deliveryId,
    sourceRef: "conversation:owner-delivery-start",
    scope: commit
      ? ["delivery-start", "single-delivery-start-fixed-point-commit"]
      : ["delivery-start"],
  };
}

function input(commit = false): DeliveryStartPreparationInput {
  return {
    deliveryId,
    operationFacts: { acceptedBaseCommit, planningReference },
    ownerAuthority: authority(commit),
  };
}

function observed(overrides: Record<string, unknown> = {}) {
  return {
    headCommit: acceptedBaseCommit,
    workingTreeClean: true,
    planningReference,
    ...overrides,
  };
}

async function makeProductRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-delivery-start-"));
  const entry = path.join(root, "skills", "delivery", "start", "SKILL.md");
  await mkdir(path.dirname(entry), { recursive: true });
  await writeFile(entry, "# exact delivery start\n", "utf8");
  return root;
}

test("Start preparation validates trusted exact repository/planning facts before package formation", async () => {
  const root = await makeProductRoot();
  try {
    let observations = 0;
    const prepared = await prepareDeliveryStartOperationPackage(
      root,
      input(),
      () => {
        observations += 1;
        return observed();
      },
    );
    assert.equal(observations, 1);
    assert.notEqual(prepared, null);
    assert.equal(prepared!.operationId, "delivery-start");
    assert.equal(
      prepared!.operationFacts.acceptedBaseCommit,
      acceptedBaseCommit,
    );
    assert.match(prepared!.guidanceRef.contentSha256, /^[0-9a-f]{64}$/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stale head, dirty tree, or wrong planning reference reject before Agent execution", async () => {
  const root = await makeProductRoot();
  try {
    assert.equal(
      await prepareDeliveryStartOperationPackage(root, input(), () =>
        observed({ headCommit: "d".repeat(40) }),
      ),
      null,
    );
    assert.equal(
      await prepareDeliveryStartOperationPackage(root, input(), () =>
        observed({ workingTreeClean: false }),
      ),
      null,
    );
    assert.equal(
      await prepareDeliveryStartOperationPackage(root, input(), () =>
        observed({
          planningReference: {
            ...planningReference,
            contentSha256: "e".repeat(64),
          },
        }),
      ),
      null,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing or mismatched Start authority rejects package formation and calls execution zero times", async () => {
  const root = await makeProductRoot();
  try {
    let executeCalls = 0;
    const outcome = await invokeDeliveryStartOperation(
      root,
      {
        ...input(),
        ownerAuthority: { ...authority(), decision: "activate-change" },
      },
      () => observed(),
      () => {
        executeCalls += 1;
        return { status: "validated" };
      },
    );
    assert.equal(outcome.status, "failed");
    assert.equal(executeCalls, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("execution callback receives the exact package and matching canonical Guidance bytes", async () => {
  const root = await makeProductRoot();
  try {
    let seenPackage: unknown = null;
    let seenGuidance = "";
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(),
      () => observed(),
      (operationPackage, guidanceBytes) => {
        seenPackage = operationPackage;
        seenGuidance = guidanceBytes.toString("utf8");
        return { status: "validated" };
      },
    );

    assert.equal(outcome.status, "stopped-before-commit");
    assert.equal(
      seenPackage,
      outcome.status === "stopped-before-commit"
        ? outcome.operationPackage
        : null,
    );
    assert.equal(seenGuidance, "# exact delivery start\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("successful validation without commit authority stops before Git mutation", async () => {
  const root = await makeProductRoot();
  try {
    let executeCalls = 0;
    let commitCalls = 0;
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(false),
      () => observed(),
      () => {
        executeCalls += 1;
        return { status: "validated" };
      },
      () => {
        commitCalls += 1;
        return "f".repeat(40);
      },
    );
    assert.equal(executeCalls, 1);
    assert.equal(commitCalls, 0);
    assert.equal(outcome.status, "stopped-before-commit");
    assert.equal(outcome.fixedPointCommit, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bounded commit authority permits exactly one fixed-point commit callback then stops terminal", async () => {
  const root = await makeProductRoot();
  try {
    let executeCalls = 0;
    let commitCalls = 0;
    let executedPackage: unknown = null;
    let committedPackage: unknown = null;
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(true),
      () => observed(),
      (operationPackage) => {
        executeCalls += 1;
        executedPackage = operationPackage;
        return { status: "validated" };
      },
      (operationPackage) => {
        commitCalls += 1;
        committedPackage = operationPackage;
        return "f".repeat(40);
      },
    );

    assert.equal(executeCalls, 1);
    assert.equal(commitCalls, 1);
    assert.equal(executedPackage, committedPackage);
    assert.equal(outcome.status, "terminal");
    assert.equal(outcome.fixedPointCommit, "f".repeat(40));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("commit authority without a commit callback fails closed after validation", async () => {
  const root = await makeProductRoot();
  try {
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(true),
      () => observed(),
      () => ({ status: "validated" }),
    );
    assert.equal(outcome.status, "failed");
    if (outcome.status === "failed") {
      assert.equal(outcome.reason, "commit-callback-missing");
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("invalid surface result or invalid fixed-point SHA fails closed", async () => {
  const root = await makeProductRoot();
  try {
    const invalidSurface = await invokeDeliveryStartOperation(
      root,
      input(false),
      () => observed(),
      () => ({ status: "partial" }),
    );
    assert.equal(invalidSurface.status, "failed");

    const invalidCommit = await invokeDeliveryStartOperation(
      root,
      input(true),
      () => observed(),
      () => ({ status: "validated" }),
      () => "not-a-commit",
    );
    assert.equal(invalidCommit.status, "failed");
    if (invalidCommit.status === "failed") {
      assert.equal(invalidCommit.reason, "fixed-point-commit-rejected");
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("no candidate product Guidance means package formation fails even when .agents bootstrap exists", async () => {
  const root = await mkdtemp(
    path.join(tmpdir(), "flowkit-delivery-start-bootstrap-"),
  );
  try {
    const bootstrap = path.join(
      root,
      ".agents",
      "skills",
      "delivery-start",
      "SKILL.md",
    );
    await mkdir(path.dirname(bootstrap), { recursive: true });
    await writeFile(bootstrap, "# bootstrap\n", "utf8");
    let executeCalls = 0;
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(),
      () => observed(),
      () => {
        executeCalls += 1;
        return { status: "validated" };
      },
    );
    assert.equal(outcome.status, "failed");
    assert.equal(executeCalls, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
