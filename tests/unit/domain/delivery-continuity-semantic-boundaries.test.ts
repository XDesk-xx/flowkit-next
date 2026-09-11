import { fixtureInstallation } from "./manager-installation-fixture.js";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  invokeDeliveryFinalOperation,
  prepareDeliveryRepositoryIntegrationOperationPackage,
  type DeliveryCheckpointOperation,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";
import {
  deriveDeliveryRepositoryIntegrationRef,
  isDeliveryRepositoryIntegrationRecordForPackage,
} from "../../../src/domain/delivery-repository-integration-execution.js";
import { isDeliveryCheckpointOperation } from "../../../src/domain/delivery-repository-integration-operation.js";
import {
  validateRepositoryIntegrationAcceptance,
  type ReadRepositoryIntegrationSource,
} from "../../../src/internal/delivery-repository-integration-source.js";
import {
  acceptedOutcomes,
  cleanup,
  createFixture,
  deliveryId,
  evidenceSource,
  finalInput,
  git,
} from "./delivery-final-fixture.js";

async function integrationFixture() {
  const fixture = await createFixture();
  const guidance = path.join(
    fixture.root,
    "skills",
    "delivery",
    "repository-integration",
    "SKILL.md",
  );
  await mkdir(path.dirname(guidance), { recursive: true });
  await writeFile(guidance, "# synthetic Integration guidance\n");
  await git(fixture.root, "add", ".");
  await git(fixture.root, "commit", "-qm", "synthetic integration guidance");
  await git(fixture.root, "branch", "-M", "delivery/decoupling-probe");
  const acceptedBaseCommit = await git(fixture.root, "rev-parse", "HEAD");
  await git(fixture.root, "branch", "main", acceptedBaseCommit);

  const outcomes = await acceptedOutcomes(fixture);
  const readRequiredEvidence = evidenceSource(outcomes, fixture.root);
  const deliveryFinalOutcome = await invokeDeliveryFinalOperation(
    fixture.root,
    finalInput(fixture, outcomes),
    () => ({ status: "ready" }),
    readRequiredEvidence,
    fixtureInstallation(fixture.root),
  );
  assert.equal(deliveryFinalOutcome.status, "terminal");
  if (deliveryFinalOutcome.status !== "terminal") {
    throw new Error("expected terminal Delivery Final fixture");
  }
  const ownerAuthority: OwnerAuthorityFact = {
    ref: `owner:${"c".repeat(64)}`,
    decision: "authorize-repository-integration",
    deliveryId,
    sourceRef: "test:explicit-operation-and-exact-prestate",
    scope: ["delivery-repository-integration"],
  };
  const input = {
    deliveryId,
    ownerAuthority,
    deliveryBranch: "delivery/decoupling-probe",
    targetMainRef: "refs/heads/main",
    acceptedBaseCommit,
    checkpointOperation: {
      kind: "create-new" as const,
      paths: [
        ...new Set(
          (
            await git(
              fixture.root,
              "ls-files",
              "--cached",
              "--others",
              "--exclude-standard",
              "-z",
            )
          )
            .split("\0")
            .filter(Boolean),
        ),
      ].sort(),
      commitMessage: "checkpoint",
      commitShape: null,
    },
  };
  return {
    fixture,
    input,
    ownerAuthority,
  };
}

async function integrationSource(
  root: string,
  input: Awaited<ReturnType<typeof integrationFixture>>["input"],
  operation: DeliveryCheckpointOperation,
  materialOperation: DeliveryCheckpointOperation = operation,
  materialAcceptedBase = input.acceptedBaseCommit,
): Promise<ReadRepositoryIntegrationSource> {
  const preIntegrationHead = await git(root, "rev-parse", "HEAD");
  const targetMainPreIntegrationCommit = await git(
    root,
    "rev-parse",
    input.targetMainRef,
  );
  return {
    readAuthorization: () => ({
      sourceRef: "test:trusted-independent-owner-decision",
      ownerAuthorityRef: input.ownerAuthority.ref,
      ownerAuthoritySourceRef: input.ownerAuthority.sourceRef,
      deliveryId,
      deliveryBranch: input.deliveryBranch,
      targetMainRef: input.targetMainRef,
      targetMainPreIntegrationCommit,
      preIntegrationHead,
      acceptedBaseCommit: materialAcceptedBase,
      checkpointOperation: materialOperation,
      reuseCheckpointSourceRef:
        materialOperation.kind === "reuse-existing"
          ? "test:authorized-existing-checkpoint"
          : null,
    }),
    readAcceptance: () => ({
      sourceRef: "test:trusted-exact-acceptance",
      ownerAuthorityRef: input.ownerAuthority.ref,
      deliveryId,
      targetMainRef: input.targetMainRef,
      targetMainPreIntegrationCommit,
      checkpointOperation: materialOperation,
      finalCommit:
        operation.kind === "reuse-existing"
          ? operation.checkpointCommit
          : preIntegrationHead,
      acceptedMainCommit:
        operation.kind === "reuse-existing"
          ? operation.checkpointCommit
          : preIntegrationHead,
    }),
  };
}

test("Integration preparation accepts an exact authorized base across unrelated HEAD or target history", async () => {
  const state = await integrationFixture();
  try {
    const { fixture, input } = state;
    const root = fixture.root;
    const baseline = await prepareDeliveryRepositoryIntegrationOperationPackage(
      root,
      input,
      await integrationSource(root, input, input.checkpointOperation),
      fixtureInstallation(root),
    );
    assert.notEqual(baseline, null);

    const baseTree = await git(
      root,
      "rev-parse",
      `${input.acceptedBaseCommit}^{tree}`,
    );
    const orphan = await git(
      root,
      "commit-tree",
      baseTree,
      "-m",
      "same tree unrelated history",
    );
    await git(root, "update-ref", input.targetMainRef, orphan);
    assert.notEqual(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        root,
        input,
        await integrationSource(root, input, input.checkpointOperation),
        fixtureInstallation(root),
      ),
      null,
    );
    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        root,
        input,
        await integrationSource(
          root,
          input,
          input.checkpointOperation,
          input.checkpointOperation,
          orphan,
        ),
        fixtureInstallation(root),
      ),
      null,
    );

    await git(
      root,
      "update-ref",
      input.targetMainRef,
      input.acceptedBaseCommit,
    );
    await git(root, "update-ref", "HEAD", orphan);
    assert.notEqual(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        root,
        input,
        await integrationSource(root, input, input.checkpointOperation),
        fixtureInstallation(root),
      ),
      null,
    );

    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        root,
        { ...input, acceptedBaseCommit: "f".repeat(40) },
        await integrationSource(root, input, input.checkpointOperation),
        fixtureInstallation(root),
      ),
      null,
    );
  } finally {
    await cleanup(state.fixture);
  }
});

test("Integration operation field order is non-semantic across source, ref and record consumers", async () => {
  const state = await integrationFixture();
  try {
    const { fixture, input } = state;
    await git(fixture.root, "add", ".");
    await git(fixture.root, "commit", "-qm", "synthetic finalized checkpoint");
    const checkpointCommit = await git(fixture.root, "rev-parse", "HEAD");
    const operation = {
      kind: "reuse-existing" as const,
      checkpointCommit,
    };
    const reorderedOperation = {
      checkpointCommit,
      kind: "reuse-existing" as const,
    };
    assert.equal(isDeliveryCheckpointOperation(reorderedOperation), true);

    const canonical =
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        { ...input, checkpointOperation: operation },
        await integrationSource(fixture.root, input, operation),
        fixtureInstallation(fixture.root),
      );
    const reorderedInput =
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        { ...input, checkpointOperation: reorderedOperation },
        await integrationSource(fixture.root, input, operation),
        fixtureInstallation(fixture.root),
      );
    const reorderedSource =
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        { ...input, checkpointOperation: operation },
        await integrationSource(
          fixture.root,
          input,
          operation,
          reorderedOperation,
        ),
        fixtureInstallation(fixture.root),
      );
    assert.notEqual(canonical, null);
    assert.deepEqual(reorderedInput, canonical);
    assert.deepEqual(reorderedSource, canonical);
    if (canonical === null) throw new Error("expected Integration package");

    const reorderedPackage = {
      ...canonical,
      operationFacts: {
        ...canonical.operationFacts,
        checkpointOperation: reorderedOperation,
      },
    };
    const canonicalRef = deriveDeliveryRepositoryIntegrationRef(
      canonical,
      checkpointCommit,
      checkpointCommit,
    );
    assert.equal(
      deriveDeliveryRepositoryIntegrationRef(
        reorderedPackage,
        checkpointCommit,
        checkpointCommit,
      ),
      canonicalRef,
    );
    const record = {
      repositoryIntegrationRef: canonicalRef,
      deliveryFinalizationRef: canonical.operationFacts.deliveryFinalizationRef,
      preIntegrationHead: canonical.operationFacts.preIntegrationHead,
      checkpointOperation: reorderedOperation,
      finalCommit: checkpointCommit,
      targetMainRef: canonical.operationFacts.targetMainRef,
      targetMainPreIntegrationCommit:
        canonical.operationFacts.targetMainPreIntegrationCommit,
      acceptedMainCommit: checkpointCommit,
      nextDeliveryBase: checkpointCommit,
    };
    assert.equal(
      isDeliveryRepositoryIntegrationRecordForPackage(record, canonical),
      true,
    );

    const source = await integrationSource(
      fixture.root,
      input,
      operation,
      reorderedOperation,
    );
    assert.equal(
      await validateRepositoryIntegrationAcceptance(source, {
        ownerAuthority: input.ownerAuthority,
        deliveryId,
        targetMainRef: input.targetMainRef,
        targetMainPreIntegrationCommit:
          canonical.operationFacts.targetMainPreIntegrationCommit,
        checkpointOperation: operation,
        finalCommit: checkpointCommit,
        acceptedMainCommit: checkpointCommit,
      }),
      true,
    );
    assert.notEqual(
      deriveDeliveryRepositoryIntegrationRef(
        {
          ...canonical,
          operationFacts: {
            ...canonical.operationFacts,
            checkpointOperation: {
              kind: "reuse-existing",
              checkpointCommit: "e".repeat(40),
            },
          },
        },
        checkpointCommit,
        checkpointCommit,
      ),
      canonicalRef,
    );
    assert.equal(
      isDeliveryCheckpointOperation({
        kind: "create-new",
        unexpected: true,
      }),
      false,
    );
  } finally {
    await cleanup(state.fixture);
  }
});
