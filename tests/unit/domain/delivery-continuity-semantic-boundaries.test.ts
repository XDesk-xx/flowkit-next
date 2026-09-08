import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  deriveApplicableCheckCandidateRef,
  invokeDeliveryFinalOperation,
  invokeDeliveryStartOperation,
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
import { isDeliveryStartValidatedSurface } from "../../../src/internal/delivery-start-content.js";
import {
  acceptedOutcomes,
  cleanup,
  createFixture,
  deliveryId,
  evidenceSource,
  finalInput,
  git,
} from "./delivery-final-fixture.js";
import { createStartValidationFixture } from "./delivery-start-validation-fixture.js";

function reverseFields<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).reverse()) as T;
}

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
  );
  assert.equal(deliveryFinalOutcome.status, "terminal");
  if (deliveryFinalOutcome.status !== "terminal") {
    throw new Error("expected terminal Delivery Final fixture");
  }
  const finalizedCandidateRef = await deriveApplicableCheckCandidateRef(
    fixture.root,
  );
  assert.equal(
    finalizedCandidateRef,
    deliveryFinalOutcome.record.finalizedCandidateRef,
  );
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
    deliveryFinalOutcome,
    deliveryBranch: "delivery/decoupling-probe",
    targetMainRef: "refs/heads/main",
    acceptedBaseCommit,
    checkpointOperation: { kind: "create-new" as const },
  };
  return {
    fixture,
    input,
    ownerAuthority,
    readRequiredEvidence,
    finalizedCandidateRef: finalizedCandidateRef!,
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
    const { fixture, input, readRequiredEvidence } = state;
    const root = fixture.root;
    const baseline = await prepareDeliveryRepositoryIntegrationOperationPackage(
      root,
      input,
      readRequiredEvidence,
      await integrationSource(root, input, input.checkpointOperation),
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
        readRequiredEvidence,
        await integrationSource(root, input, input.checkpointOperation),
      ),
      null,
    );
    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        root,
        input,
        readRequiredEvidence,
        await integrationSource(
          root,
          input,
          input.checkpointOperation,
          input.checkpointOperation,
          orphan,
        ),
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
    assert.equal(
      await deriveApplicableCheckCandidateRef(root),
      state.finalizedCandidateRef,
    );
    assert.notEqual(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        root,
        input,
        readRequiredEvidence,
        await integrationSource(root, input, input.checkpointOperation),
      ),
      null,
    );

    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        root,
        { ...input, acceptedBaseCommit: "f".repeat(40) },
        readRequiredEvidence,
        await integrationSource(root, input, input.checkpointOperation),
      ),
      null,
    );
  } finally {
    await cleanup(state.fixture);
  }
});

test("Start artifact refs compare semantic fields while preserving strict values and array order", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-start-order-"));
  try {
    await git(root, "init", "-q");
    await git(root, "config", "user.name", "Flowkit Test");
    await git(root, "config", "user.email", "flowkit@example.invalid");
    await git(root, "config", "core.autocrlf", "false");
    await mkdir(path.join(root, "skills", "delivery", "start"), {
      recursive: true,
    });
    await writeFile(
      path.join(root, "skills", "delivery", "start", "SKILL.md"),
      "# synthetic Start\n",
    );
    await mkdir(path.join(root, ".flowkit"), { recursive: true });
    await writeFile(
      path.join(root, ".flowkit", "project.json"),
      '{"projectId":"flowkit-next"}\n',
    );
    const artifacts = [`openspec/delivery-groups/${deliveryId}.yaml`];
    for (const artifact of artifacts) {
      const target = path.join(root, ...artifact.split("/"));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, "{}\n");
    }
    await git(root, "add", ".");
    await git(root, "commit", "-qm", "synthetic Start base");
    const acceptedBaseCommit = await git(root, "rev-parse", "HEAD");
    const planningReference = {
      artifact: "plan.md",
      contentSha256: "b".repeat(64),
    };
    const input = {
      deliveryId,
      operationFacts: { acceptedBaseCommit, planningReference },
      ownerAuthority: {
        ref: `owner:${"c".repeat(64)}`,
        decision: "create-delivery" as const,
        deliveryId,
        sourceRef: "test:owner-start-only",
        scope: ["delivery-start"],
      },
    };
    const observe = () => ({
      headCommit: acceptedBaseCommit,
      workingTreeClean: true,
      planningReference,
    });
    const validation = await createStartValidationFixture(root, {
      deliveryId,
      acceptedBaseCommit,
      planningReference,
    });
    const material = validation.read();
    const surface = validation.surface();
    const reorderedOutputs = {
      ...material,
      outputs: material.outputs.map(reverseFields),
    };
    const reorderedSurface = {
      ...surface,
      validation: {
        ...surface.validation,
        artifacts: surface.validation.artifacts.map(reverseFields),
      },
    };
    assert.equal(isDeliveryStartValidatedSurface(reorderedSurface), true);
    assert.equal(
      (
        await invokeDeliveryStartOperation(
          root,
          input,
          observe,
          validation.surface,
          () => reorderedOutputs,
        )
      ).status,
      "terminal",
    );
    assert.equal(
      (
        await invokeDeliveryStartOperation(
          root,
          input,
          observe,
          () => reorderedSurface,
          validation.read,
        )
      ).status,
      "terminal",
    );

    const changedHash = {
      ...material,
      outputs: material.outputs.map((entry, index) =>
        index === 0 ? { ...entry, contentSha256: "f".repeat(64) } : entry,
      ),
    };
    const unknownField = {
      ...material,
      outputs: material.outputs.map((entry, index) =>
        index === 0 ? { ...entry, unexpected: true } : entry,
      ),
    };
    for (const rejected of [
      changedHash,
      unknownField,
      { ...material, outputs: [...material.outputs, material.outputs[0]] },
    ]) {
      assert.equal(
        (
          await invokeDeliveryStartOperation(
            root,
            input,
            observe,
            validation.surface,
            () => rejected,
          )
        ).status,
        "failed",
      );
    }

    const reversedChecks = await createStartValidationFixture(
      root,
      { deliveryId, acceptedBaseCommit, planningReference },
      0,
      (value) => ({
        ...value,
        checks: [...(value.checks as unknown[])].reverse(),
      }),
    );
    assert.equal(
      (
        await invokeDeliveryStartOperation(
          root,
          input,
          observe,
          reversedChecks.surface,
          reversedChecks.read,
        )
      ).status,
      "failed",
    );
    const allOutputHoles = new Array(material.outputs.length);
    const oneOutputHole = [...material.outputs];
    delete oneOutputHole[0];
    const sparseMaterialArtifacts = [...material.artifacts];
    delete sparseMaterialArtifacts[0];
    const malformedMaterials = [
      { ...material, outputs: undefined },
      { ...material, outputs: null },
      { ...material, outputs: { length: material.outputs.length } },
      { ...material, outputs: allOutputHoles },
      { ...material, outputs: oneOutputHole },
      { ...material, outputs: material.outputs.map(() => null) },
      { ...material, artifacts: sparseMaterialArtifacts },
    ];
    const commitInput = {
      ...input,
      ownerAuthority: {
        ...input.ownerAuthority,
        scope: ["delivery-start", "single-delivery-start-fixed-point-commit"],
      },
    };
    let checkpointCalls = 0;
    for (const malformed of malformedMaterials) {
      const outcome = await invokeDeliveryStartOperation(
        root,
        commitInput,
        observe,
        validation.surface,
        () => malformed as never,
        () => {
          checkpointCalls += 1;
          return "f".repeat(40);
        },
      );
      assert.deepEqual(outcome, {
        status: "failed",
        reason: "content-completion-rejected",
        fixedPointCommit: null,
        contentCompletion: null,
      });
    }

    const sparseSurfaceArtifacts = [...surface.validation.artifacts];
    delete sparseSurfaceArtifacts[0];
    const sparseSurface = {
      ...surface,
      validation: {
        ...surface.validation,
        artifacts: sparseSurfaceArtifacts,
      },
    };
    assert.equal(isDeliveryStartValidatedSurface(sparseSurface), false);
    assert.deepEqual(
      await invokeDeliveryStartOperation(
        root,
        commitInput,
        observe,
        () => sparseSurface as never,
        validation.read,
        () => {
          checkpointCalls += 1;
          return "f".repeat(40);
        },
      ),
      {
        status: "failed",
        reason: "surface-validation-failed",
        fixedPointCommit: null,
        contentCompletion: null,
      },
    );
    assert.equal(checkpointCalls, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Integration operation field order is non-semantic across source, ref and record consumers", async () => {
  const state = await integrationFixture();
  try {
    const { fixture, input, readRequiredEvidence } = state;
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
        readRequiredEvidence,
        await integrationSource(fixture.root, input, operation),
      );
    const reorderedInput =
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        { ...input, checkpointOperation: reorderedOperation },
        readRequiredEvidence,
        await integrationSource(fixture.root, input, operation),
      );
    const reorderedSource =
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        { ...input, checkpointOperation: operation },
        readRequiredEvidence,
        await integrationSource(
          fixture.root,
          input,
          operation,
          reorderedOperation,
        ),
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
      finalizedCandidateRef: canonical.operationFacts.finalizedCandidateRef,
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
