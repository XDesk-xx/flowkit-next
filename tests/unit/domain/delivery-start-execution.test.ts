import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  invokeDeliveryStartOperation,
  prepareDeliveryStartOperationPackage,
  type DeliveryStartPreparationInput,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";
import { createStartValidationFixture } from "./delivery-start-validation-fixture.js";

const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";
const acceptedBaseCommit = "a".repeat(40);
const planningReference = {
  artifact: "flowkit-next-d04-stable-core-closure-final-reference.md",
  contentSha256: "b".repeat(64),
};
const execFileAsync = promisify(execFile);

async function git(root: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  return stdout.trim();
}

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

function input(
  commit = false,
  base = acceptedBaseCommit,
): DeliveryStartPreparationInput {
  return {
    deliveryId,
    operationFacts: { acceptedBaseCommit: base, planningReference },
    ownerAuthority: authority(commit),
  };
}

function observed(
  overrides: Record<string, unknown> = {},
  base = acceptedBaseCommit,
) {
  return {
    headCommit: base,
    workingTreeClean: true,
    planningReference,
    ...overrides,
  };
}

async function trustedValidation(
  root: string,
  base = acceptedBaseCommit,
  requestedExitCode = 0,
  transformOutcome?: (value: Record<string, unknown>) => unknown,
) {
  return createStartValidationFixture(
    root,
    {
      deliveryId,
      acceptedBaseCommit: base,
      planningReference,
    },
    requestedExitCode,
    transformOutcome,
  );
}

async function makeProductRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-delivery-start-"));
  const entry = path.join(root, "skills", "delivery", "start", "SKILL.md");
  await mkdir(path.dirname(entry), { recursive: true });
  await writeFile(entry, "# exact delivery start\n", "utf8");
  await mkdir(path.join(root, ".flowkit"), { recursive: true });
  await writeFile(
    path.join(root, ".flowkit", "project.json"),
    '{"projectId":"flowkit-next"}\n',
    "utf8",
  );
  const outputPaths = [
    path.join(root, "openspec", "delivery-groups", `${deliveryId}.yaml`),
  ];
  for (const output of outputPaths) {
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, "{}\n", "utf8");
  }
  await git(root, "init", "-q");
  await git(root, "config", "user.email", "flowkit@example.invalid");
  await git(root, "config", "user.name", "Flowkit Test");
  await git(root, "config", "core.autocrlf", "false");
  await git(root, "add", ".");
  await git(root, "commit", "-qm", "fixture");
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
    const validation = await trustedValidation(root);
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
        return validation.surface();
      },
      validation.read,
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
    const validation = await trustedValidation(root);
    let seenPackage: unknown = null;
    let seenGuidance = "";
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(),
      () => observed(),
      (operationPackage, guidanceBytes) => {
        seenPackage = operationPackage;
        seenGuidance = guidanceBytes.toString("utf8");
        return validation.surface();
      },
      validation.read,
    );

    assert.equal(outcome.status, "terminal");
    assert.notEqual(
      seenPackage,
      outcome.status === "terminal" ? outcome.operationPackage : null,
    );
    assert.deepEqual(
      seenPackage,
      outcome.status === "terminal" ? outcome.operationPackage : null,
    );
    assert.equal(seenGuidance, "# exact delivery start\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("successful validation without commit authority stops before Git mutation", async () => {
  const root = await makeProductRoot();
  try {
    const validation = await trustedValidation(root);
    let executeCalls = 0;
    let commitCalls = 0;
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(false),
      () => observed(),
      () => {
        executeCalls += 1;
        return validation.surface();
      },
      validation.read,
      () => {
        commitCalls += 1;
        return "f".repeat(40);
      },
    );
    assert.equal(executeCalls, 1);
    assert.equal(commitCalls, 0);
    assert.equal(outcome.status, "terminal");
    assert.equal(outcome.fixedPointCommit, null);
    if (outcome.status !== "terminal") throw new Error("expected terminal");
    assert.equal(outcome.contentCompletion.projectId, "flowkit-next");
    assert.equal(outcome.contentCompletion.deliveryId, deliveryId);
    assert.equal(
      outcome.contentCompletion.acceptedBaseCommit,
      acceptedBaseCommit,
    );
    assert.deepEqual(
      outcome.contentCompletion.planningReference,
      planningReference,
    );
    assert.deepEqual(
      outcome.contentCompletion.outputs.map((output) => output.artifact),
      [`openspec/delivery-groups/${deliveryId}.yaml`],
    );
    assert.match(
      outcome.contentCompletion.candidateRef,
      /^candidate:sha256:[0-9a-f]{64}$/,
    );
    assert.deepEqual(
      outcome.contentCompletion.validation,
      validation.surface().validation,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing validation source and callback authority escalation fail closed", async () => {
  const root = await makeProductRoot();
  try {
    const validation = await trustedValidation(root);
    const failedValidation = await trustedValidation(
      root,
      acceptedBaseCommit,
      1,
    );
    assert.equal(
      (
        await invokeDeliveryStartOperation(
          root,
          input(false),
          () => observed(),
          failedValidation.surface,
          failedValidation.read,
        )
      ).status,
      "failed",
    );
    const incomplete = await trustedValidation(
      root,
      acceptedBaseCommit,
      0,
      (outcome) => ({
        ...outcome,
        checks: (outcome.checks as unknown[]).slice(0, -1),
      }),
    );
    assert.equal(
      (
        await invokeDeliveryStartOperation(
          root,
          input(false),
          () => observed(),
          incomplete.surface,
          incomplete.read,
        )
      ).status,
      "failed",
    );
    const wrongInput = await trustedValidation(
      root,
      acceptedBaseCommit,
      0,
      (outcome) => ({
        ...outcome,
        checks: (outcome.checks as Record<string, unknown>[]).map(
          (check, index) =>
            index === 0
              ? { ...check, inputs: [`commit:${"f".repeat(40)}`] }
              : check,
        ),
      }),
    );
    assert.equal(
      (
        await invokeDeliveryStartOperation(
          root,
          input(false),
          () => observed(),
          wrongInput.surface,
          wrongInput.read,
        )
      ).status,
      "failed",
    );
    const missing = await invokeDeliveryStartOperation(
      root,
      input(false),
      () => observed(),
      validation.surface,
      async () => {
        throw new Error("validation source unavailable");
      },
    );
    assert.deepEqual(missing, {
      status: "failed",
      reason: "content-completion-rejected",
      fixedPointCommit: null,
      contentCompletion: null,
    });

    let commitCalls = 0;
    const escalated = await invokeDeliveryStartOperation(
      root,
      input(false),
      () => observed(),
      (operationPackage) => {
        (operationPackage.ownerAuthority!.scope as string[]).push(
          "single-delivery-start-fixed-point-commit",
        );
        return validation.surface();
      },
      validation.read,
      () => {
        commitCalls += 1;
        return "f".repeat(40);
      },
    );
    assert.equal(escalated.status, "terminal");
    assert.equal(commitCalls, 0);
    if (escalated.status === "terminal") {
      assert.deepEqual(escalated.operationPackage.ownerAuthority!.scope, [
        "delivery-start",
      ]);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bounded commit authority permits exactly one fixed-point commit callback then stops terminal", async () => {
  const root = await makeProductRoot();
  try {
    const base = await git(root, "rev-parse", "HEAD");
    const validation = await trustedValidation(root, base);
    let executeCalls = 0;
    let commitCalls = 0;
    let executedPackage: unknown = null;
    let committedPackage: unknown = null;
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(true, base),
      () => observed({}, base),
      (operationPackage) => {
        executeCalls += 1;
        executedPackage = operationPackage;
        return validation.surface();
      },
      validation.read,
      async (operationPackage) => {
        commitCalls += 1;
        committedPackage = operationPackage;
        await writeFile(
          path.join(root, ".flowkit", "memos.json"),
          '{"memos":[]}\n',
          "utf8",
        );
        await git(root, "add", ".flowkit/memos.json");
        await git(root, "commit", "-qm", "start checkpoint");
        return git(root, "rev-parse", "HEAD");
      },
    );

    assert.equal(executeCalls, 1);
    assert.equal(commitCalls, 1);
    assert.notEqual(executedPackage, committedPackage);
    assert.deepEqual(executedPackage, committedPackage);
    assert.equal(outcome.status, "terminal");
    assert.match(outcome.fixedPointCommit!, /^[0-9a-f]{40}$/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Start rejects a two-parent checkpoint even when the second parent is otherwise valid", async () => {
  const root = await makeProductRoot();
  try {
    const base = await git(root, "rev-parse", "HEAD");
    const validation = await trustedValidation(root, base);
    const baseTree = await git(root, "rev-parse", `${base}^{tree}`);
    const other = await git(root, "commit-tree", baseTree, "-m", "other root");
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(true, base),
      () => observed({}, base),
      validation.surface,
      validation.read,
      async () => {
        const tree = await git(root, "write-tree");
        const merge = await git(
          root,
          "commit-tree",
          tree,
          "-p",
          base,
          "-p",
          other,
          "-m",
          "invalid merge checkpoint",
        );
        await git(root, "update-ref", "HEAD", merge, base);
        return merge;
      },
    );
    assert.equal(outcome.status, "failed");
    if (outcome.status === "failed") {
      assert.equal(outcome.reason, "fixed-point-commit-rejected");
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("commit authority without a commit callback fails closed after validation", async () => {
  const root = await makeProductRoot();
  try {
    const validation = await trustedValidation(root);
    const outcome = await invokeDeliveryStartOperation(
      root,
      input(true),
      () => observed(),
      validation.surface,
      validation.read,
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
    const validation = await trustedValidation(root);
    const invalidSurface = await invokeDeliveryStartOperation(
      root,
      input(false),
      () => observed(),
      () => ({ status: "partial" }),
      validation.read,
    );
    assert.equal(invalidSurface.status, "failed");

    const invalidCommit = await invokeDeliveryStartOperation(
      root,
      input(true),
      () => observed(),
      validation.surface,
      validation.read,
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
        return { status: "partial" };
      },
      async () => {
        throw new Error("must not read validation");
      },
    );
    assert.equal(outcome.status, "failed");
    assert.equal(executeCalls, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
