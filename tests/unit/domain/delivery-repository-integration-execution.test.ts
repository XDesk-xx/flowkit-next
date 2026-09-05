import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  deriveApplicableCheckCandidateRef,
  deriveDeliveryFinalizationRef,
  formDeliveryOperationPackage,
  invokeDeliveryRepositoryIntegrationOperation,
  prepareDeliveryRepositoryIntegrationOperationPackage,
  type DeliveryFinalInvocationTerminal,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";

const execFileAsync = promisify(execFile);
const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";

async function git(root: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: "utf8",
  });
  return stdout.trim();
}

async function makeFixture(): Promise<{
  root: string;
  input: {
    deliveryId: typeof deliveryId;
    ownerAuthority: OwnerAuthorityFact;
    deliveryFinalOutcome: DeliveryFinalInvocationTerminal;
    deliveryBranch: string;
    targetMainRef: string;
    acceptedBaseCommit: string;
  };
}> {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-repo-integration-"));
  await git(root, "init", "-b", "main");
  await git(root, "config", "user.name", "Flowkit Test");
  await git(root, "config", "user.email", "flowkit@example.invalid");
  await writeFile(path.join(root, "product.txt"), "base\n", "utf8");
  await git(root, "add", ".");
  await git(root, "commit", "-m", "base");
  const acceptedBaseCommit = await git(root, "rev-parse", "HEAD");

  await git(root, "checkout", "-b", "delivery/d04");
  await mkdir(path.join(root, "skills", "delivery", "repository-integration"), {
    recursive: true,
  });
  await writeFile(
    path.join(root, "skills", "delivery", "repository-integration", "SKILL.md"),
    "# repository integration\n",
    "utf8",
  );
  await writeFile(path.join(root, "product.txt"), "finalized\n", "utf8");

  const finalAuthority: OwnerAuthorityFact = {
    ref: `owner:${"a".repeat(64)}`,
    decision: "finalize-delivery",
    deliveryId,
    sourceRef: "test:delivery-final",
    scope: ["delivery-final"],
  };
  const finalGuidance = {
    path: "skills/delivery/final/SKILL.md",
    contentSha256: "b".repeat(64),
  };
  const finalFacts = {
    verifiedCandidateRef: `candidate:sha256:${"1".repeat(64)}`,
    fullTestExecutionRef: `full-test-execution:sha256:${"2".repeat(64)}`,
    architectureFinalizationRef: `architecture-finalization:sha256:${"3".repeat(64)}`,
    architectureMaterializedCandidateRef: `candidate:sha256:${"4".repeat(64)}`,
    coordinationPrestateRef: {
      artifact: `openspec/delivery-groups/${deliveryId}.yaml`,
      contentSha256: "5".repeat(64),
      bytes: 100,
    },
    completedRequiredChangeIds: ["change-one"],
  };
  const finalPackage = formDeliveryOperationPackage(
    deliveryId,
    "delivery-final",
    finalAuthority,
    finalFacts,
    finalGuidance,
  );
  assert.equal(finalPackage?.operationId, "delivery-final");
  if (finalPackage?.operationId !== "delivery-final")
    throw new Error("fixture");

  const coordinationArtifact = `openspec/delivery-groups/${deliveryId}.yaml`;
  const coordinationBytes = Buffer.from(
    `id: ${deliveryId}\nstate: completed\n`,
    "utf8",
  );
  const coordinationPath = path.join(root, ...coordinationArtifact.split("/"));
  await mkdir(path.dirname(coordinationPath), { recursive: true });
  await writeFile(coordinationPath, coordinationBytes);
  const coordinationRef = {
    artifact: coordinationArtifact,
    contentSha256: createHash("sha256").update(coordinationBytes).digest("hex"),
    bytes: coordinationBytes.length,
  };
  const finalizedCandidateRef = await deriveApplicableCheckCandidateRef(root);
  assert.notEqual(finalizedCandidateRef, null);
  const deliveryFinalizationRef = deriveDeliveryFinalizationRef(
    finalPackage,
    coordinationRef,
    finalizedCandidateRef!,
  );
  assert.notEqual(deliveryFinalizationRef, null);
  const deliveryFinalOutcome: DeliveryFinalInvocationTerminal = {
    status: "terminal",
    operationPackage: finalPackage,
    record: {
      deliveryFinalizationRef: deliveryFinalizationRef!,
      verifiedCandidateRef: finalFacts.verifiedCandidateRef,
      fullTestExecutionRef: finalFacts.fullTestExecutionRef,
      architectureFinalizationRef: finalFacts.architectureFinalizationRef,
      architectureMaterializedCandidateRef:
        finalFacts.architectureMaterializedCandidateRef,
      coordinationRef,
      finalizedCandidateRef: finalizedCandidateRef!,
    },
  };

  return {
    root,
    input: {
      deliveryId,
      ownerAuthority: {
        ref: `owner:${"c".repeat(64)}`,
        decision: "authorize-repository-integration",
        deliveryId,
        sourceRef: "test:repo-integration",
        scope: ["delivery-repository-integration"],
      },
      deliveryFinalOutcome,
      deliveryBranch: "delivery/d04",
      targetMainRef: "refs/heads/main",
      acceptedBaseCommit,
    },
  };
}

test("trusted preparation binds exact finalized state and pre-integration Git facts", async () => {
  const fixture = await makeFixture();
  try {
    const operationPackage =
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        fixture.input,
      );
    assert.equal(
      operationPackage?.operationId,
      "delivery-repository-integration",
    );
    assert.equal(
      operationPackage?.operationFacts.targetMainPreIntegrationCommit,
      fixture.input.acceptedBaseCommit,
    );
    assert.equal(
      Object.hasOwn(
        operationPackage?.operationFacts ?? {},
        "acceptedMainCommit",
      ),
      false,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("coordination byte drift invalidates trusted preparation", async () => {
  const fixture = await makeFixture();
  try {
    const artifact =
      fixture.input.deliveryFinalOutcome.record.coordinationRef.artifact;
    await writeFile(
      path.join(fixture.root, ...artifact.split("/")),
      "drift\n",
      "utf8",
    );
    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        fixture.input,
      ),
      null,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("repository integration proves one final commit and derives accepted main as next base", async () => {
  const fixture = await makeFixture();
  try {
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      fixture.root,
      fixture.input,
      async () => {
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "chore(delivery): final");
        return { status: "committed" };
      },
      async ({ finalCommit }) => {
        await git(fixture.root, "update-ref", "refs/heads/main", finalCommit);
        return { status: "repository-acceptance-complete", auditRef: "pr:1" };
      },
    );
    assert.equal(outcome.status, "terminal");
    if (outcome.status !== "terminal") throw new Error("expected terminal");
    assert.equal(outcome.record.acceptedMainCommit, outcome.record.finalCommit);
    assert.equal(
      outcome.record.nextDeliveryBase,
      outcome.record.acceptedMainCommit,
    );
    assert.match(
      outcome.record.repositoryIntegrationRef,
      /^repository-integration:sha256:[0-9a-f]{64}$/,
    );
    const {
      deriveDeliveryRepositoryIntegrationRef,
      isDeliveryRepositoryIntegrationRecordForPackage,
    } = await import("../../../src/domain/index.js");
    assert.equal(
      deriveDeliveryRepositoryIntegrationRef(
        outcome.operationPackage,
        outcome.record.finalCommit,
        outcome.record.acceptedMainCommit,
      ),
      outcome.record.repositoryIntegrationRef,
    );
    assert.equal(
      isDeliveryRepositoryIntegrationRecordForPackage(
        outcome.record,
        outcome.operationPackage,
      ),
      true,
    );
    assert.equal(
      isDeliveryRepositoryIntegrationRecordForPackage(
        {
          ...outcome.record,
          acceptedMainCommit: "f".repeat(40),
          nextDeliveryBase: "f".repeat(40),
        },
        outcome.operationPackage,
      ),
      false,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("target-main drift during final commit is rejected before repository acceptance", async () => {
  const fixture = await makeFixture();
  try {
    let providerCalled = false;
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      fixture.root,
      fixture.input,
      async () => {
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "chore(delivery): final");
        const finalCommit = await git(fixture.root, "rev-parse", "HEAD");
        await git(fixture.root, "update-ref", "refs/heads/main", finalCommit);
        return { status: "committed" };
      },
      async () => {
        providerCalled = true;
        return { status: "repository-acceptance-complete" };
      },
    );
    assert.deepEqual(outcome, {
      status: "failed",
      reason: "final-commit-rejected",
      record: null,
    });
    assert.equal(providerCalled, false);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("accepted main ancestry without exact tree equality is rejected", async () => {
  const fixture = await makeFixture();
  try {
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      fixture.root,
      fixture.input,
      async () => {
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "chore(delivery): final");
        return { status: "committed" };
      },
      async ({ finalCommit }) => {
        await git(fixture.root, "update-ref", "refs/heads/main", finalCommit);
        await git(fixture.root, "checkout", "main");
        await writeFile(
          path.join(fixture.root, "unexpected.txt"),
          "extra\n",
          "utf8",
        );
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "unexpected concurrent bytes");
        return { status: "repository-acceptance-complete" };
      },
    );
    assert.deepEqual(outcome, {
      status: "failed",
      reason: "accepted-main-content-rejected",
      record: null,
    });
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("wrong or broad Owner authority fails closed", async () => {
  const fixture = await makeFixture();
  try {
    const wrongDecision = {
      ...fixture.input,
      ownerAuthority: {
        ...fixture.input.ownerAuthority,
        decision: "finalize-delivery",
      },
    };
    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        wrongDecision,
      ),
      null,
    );

    const broad = {
      ...fixture.input,
      ownerAuthority: {
        ...fixture.input.ownerAuthority,
        scope: ["delivery-repository-integration", "git-write"].sort(),
      },
    };
    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        broad,
      ),
      null,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("zero, multiple, and candidate-changing final commits fail closed", async (t) => {
  await t.test("zero commit", async () => {
    const fixture = await makeFixture();
    try {
      const outcome = await invokeDeliveryRepositoryIntegrationOperation(
        fixture.root,
        fixture.input,
        async () => ({ status: "committed" }),
        async () => ({ status: "repository-acceptance-complete" }),
      );
      assert.equal(outcome.status, "failed");
      if (outcome.status === "failed")
        assert.equal(outcome.reason, "final-commit-rejected");
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  await t.test("multiple commits", async () => {
    const fixture = await makeFixture();
    try {
      const outcome = await invokeDeliveryRepositoryIntegrationOperation(
        fixture.root,
        fixture.input,
        async () => {
          await git(fixture.root, "add", ".");
          await git(fixture.root, "commit", "-m", "first final");
          await writeFile(
            path.join(fixture.root, "second.txt"),
            "second\n",
            "utf8",
          );
          await git(fixture.root, "add", ".");
          await git(fixture.root, "commit", "-m", "second final");
          return { status: "committed" };
        },
        async () => ({ status: "repository-acceptance-complete" }),
      );
      assert.equal(outcome.status, "failed");
      if (outcome.status === "failed")
        assert.equal(outcome.reason, "final-commit-rejected");
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  await t.test("candidate-changing commit", async () => {
    const fixture = await makeFixture();
    try {
      const outcome = await invokeDeliveryRepositoryIntegrationOperation(
        fixture.root,
        fixture.input,
        async () => {
          await writeFile(
            path.join(fixture.root, "product.txt"),
            "changed-after-finalization\n",
            "utf8",
          );
          await git(fixture.root, "add", ".");
          await git(fixture.root, "commit", "-m", "wrong final candidate");
          return { status: "committed" };
        },
        async () => ({ status: "repository-acceptance-complete" }),
      );
      assert.equal(outcome.status, "failed");
      if (outcome.status === "failed")
        assert.equal(outcome.reason, "final-commit-rejected");
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });
});

test("provider-reported accepted-main SHA is not admitted as truth", async () => {
  const fixture = await makeFixture();
  try {
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      fixture.root,
      fixture.input,
      async () => {
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "chore(delivery): final");
        return { status: "committed" };
      },
      async ({ finalCommit }) => {
        await git(fixture.root, "update-ref", "refs/heads/main", finalCommit);
        return {
          status: "repository-acceptance-complete",
          acceptedMainCommit: "f".repeat(40),
        };
      },
    );
    assert.deepEqual(outcome, {
      status: "failed",
      reason: "repository-acceptance-rejected",
      record: null,
    });
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});
