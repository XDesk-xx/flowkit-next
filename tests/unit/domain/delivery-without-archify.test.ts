import { fixtureInstallation } from "./manager-installation-fixture.js";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  invokeDeliveryStartOperation,
  invokeDeliveryFullTestOperation,
  invokeDeliveryFinalOperation,
  invokeDeliveryRepositoryIntegrationOperation,
  prepareDeliveryFinalOperationPackage,
  isDeliveryFinalizationRecordForPackage,
  isDeliveryOperationPackage,
  type ReadRepositoryIntegrationSource,
} from "../../../src/domain/index.js";
import {
  createFixture,
  cleanup,
  git,
  deliveryId,
  authority,
  acceptedOutcomes,
  evidenceSource,
  finalInput,
} from "./delivery-final-fixture.js";
import { createStartValidationFixture } from "./delivery-start-validation-fixture.js";

test("without Archify: real Start/checks/Final/local Git integration; OpenSpec and remote are simulated", async () => {
  const fixture = await createFixture();
  const { root } = fixture;
  try {
    await git(root, "branch", "-M", "main");
    const deliveryBranch = `delivery/${deliveryId}`;
    await git(root, "switch", "-c", deliveryBranch);
    for (const operation of ["start", "repository-integration"]) {
      const target = path.join(
        root,
        "skills",
        "delivery",
        operation,
        "SKILL.md",
      );
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, `# simulated ${operation} HOW\n`);
    }
    const planningBytes = Buffer.from("# isolated approved plan\n");
    await writeFile(path.join(root, "plan.md"), planningBytes);
    await git(root, "add", ".");
    await git(root, "commit", "-qm", "fixture prerequisites");
    const acceptedBaseCommit = await git(root, "rev-parse", "HEAD");
    await git(root, "update-ref", "refs/heads/main", acceptedBaseCommit);
    const planningReference = {
      artifact: "plan.md",
      contentSha256: createHash("sha256").update(planningBytes).digest("hex"),
    };
    const validation = await createStartValidationFixture(root, {
      deliveryId,
      acceptedBaseCommit,
      planningReference,
    });
    const start = await invokeDeliveryStartOperation(
      root,
      {
        deliveryId,
        ownerAuthority: {
          ref: `owner:${"d".repeat(64)}`,
          decision: "create-delivery",
          deliveryId,
          sourceRef: "test:start-owner",
          scope: ["delivery-start"],
        },
        operationFacts: { acceptedBaseCommit, planningReference },
      },
      async () => ({
        headCommit: await git(root, "rev-parse", "HEAD"),
        workingTreeClean: (await git(root, "status", "--porcelain")) === "",
        planningReference,
      }),
      validation.surface,
      validation.read,
      undefined,
      fixtureInstallation(root),
    );
    assert.equal(start.status, "terminal");
    const outcomes = await acceptedOutcomes(fixture);
    const readRequiredEvidence = evidenceSource(outcomes, root);
    assert.deepEqual(Object.keys(readRequiredEvidence), ["readChangeClosure"]);
    const final = await invokeDeliveryFinalOperation(
      root,
      finalInput(fixture, outcomes),
      () => ({ status: "ready" }),
      readRequiredEvidence,
      fixtureInstallation(root),
    );
    assert.equal(final.status, "terminal");
    if (final.status !== "terminal") throw new Error("Final failed");
    assert.equal(
      final.record.verifiedCandidateRef,
      outcomes.fullTest.record.inputRef,
    );
    assert.notEqual(
      final.record.finalizedCandidateRef,
      final.record.verifiedCandidateRef,
    );
    const ownerAuthority = {
      ref: `owner:${"c".repeat(64)}`,
      decision: "authorize-repository-integration" as const,
      deliveryId,
      sourceRef: "test:integration-owner",
      scope: ["delivery-repository-integration"],
    };
    const checkpointOperation = { kind: "create-new" as const };
    const source: ReadRepositoryIntegrationSource = {
      readAuthorization: () => ({
        sourceRef: "test:integration-authorization",
        ownerAuthorityRef: ownerAuthority.ref,
        ownerAuthoritySourceRef: ownerAuthority.sourceRef,
        deliveryId,
        deliveryBranch,
        targetMainRef: "refs/heads/main",
        targetMainPreIntegrationCommit: acceptedBaseCommit,
        preIntegrationHead: acceptedBaseCommit,
        acceptedBaseCommit,
        checkpointOperation,
        reuseCheckpointSourceRef: null,
      }),
      readAcceptance: async () => ({
        sourceRef: "test:simulated-remote-acceptance",
        ownerAuthorityRef: ownerAuthority.ref,
        deliveryId,
        targetMainRef: "refs/heads/main",
        targetMainPreIntegrationCommit: acceptedBaseCommit,
        checkpointOperation,
        finalCommit: await git(root, "rev-parse", "HEAD"),
        acceptedMainCommit: await git(root, "rev-parse", "refs/heads/main"),
      }),
    };
    const integrated = await invokeDeliveryRepositoryIntegrationOperation(
      root,
      {
        deliveryId,
        ownerAuthority,
        deliveryFinalOutcome: final,
        deliveryBranch,
        targetMainRef: "refs/heads/main",
        acceptedBaseCommit,
        checkpointOperation,
      },
      async () => {
        await git(root, "add", ".");
        await git(root, "commit", "-qm", "fixture final checkpoint");
        return { status: "committed" };
      },
      async ({ finalCommit }) => {
        await git(root, "update-ref", "refs/heads/main", finalCommit);
        return { status: "repository-acceptance-complete" };
      },
      readRequiredEvidence,
      source,
      fixtureInstallation(root),
    );
    assert.equal(integrated.status, "terminal");
    await assert.rejects(access(path.join(root, "architecture")), {
      code: "ENOENT",
    });
    await assert.rejects(
      access(path.join(fixture.flowkitHome, "tools", "archify")),
      { code: "ENOENT" },
    );
    assert.doesNotMatch(
      await readFile(fixture.manifestPath, "utf8"),
      /architecture/i,
    );
    assert.equal(
      isDeliveryFinalizationRecordForPackage(
        {
          ...final.record,
          architectureFinalizationRef: `architecture-finalization:sha256:${"e".repeat(64)}`,
        },
        final.operationPackage,
      ),
      false,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("Final rejects a real failed check, incomplete checks and legacy preparation input", async () => {
  const fixture = await createFixture();
  try {
    await mkdir(path.join(fixture.root, "config/verification"), {
      recursive: true,
    });
    await writeFile(
      path.join(fixture.root, "config/verification/full-test.json"),
      JSON.stringify({
        inputs: ["source.txt"],
        exclude: [".flowkit"],
        environment: [],
        checks: [
          {
            checkId: "real-failure",
            program: process.execPath,
            args: ["-e", "process.exit(7)"],
            cwd: ".",
          },
        ],
      }),
    );
    const failed = await invokeDeliveryFullTestOperation(
      fixture.root,
      {
        deliveryId,
        ownerAuthority: authority("authorize-formal-full-test"),
      },
      fixtureInstallation(fixture.root),
    );
    assert.equal(failed.status, "terminal");
    if (failed.status !== "terminal") throw new Error("check did not execute");
    assert.equal(failed.verdict, "failed");
    const passed = await acceptedOutcomes(fixture);
    const read = evidenceSource(passed, fixture.root);
    for (const input of [
      { ...finalInput(fixture, passed), fullTestOutcome: failed },
      {
        ...finalInput(fixture, passed),
        fullTestOutcome: {
          ...passed.fullTest,
          record: { ...passed.fullTest.record, checks: [] },
        },
      },
      { ...finalInput(fixture, passed), architectureOutcome: {} },
    ])
      assert.equal(
        await prepareDeliveryFinalOperationPackage(
          fixture.root,
          input,
          read,
          fixtureInstallation(fixture.root),
        ),
        null,
      );
  } finally {
    await cleanup(fixture);
  }
});

test("frozen legacy bytes remain readable without becoming current execution input", async () => {
  const fixture = await createFixture();
  try {
    const frozen = await readFile(
      new URL(
        "../../fixtures/delivery/legacy-architecture-package.json",
        import.meta.url,
      ),
    );
    const target = path.join(fixture.root, "legacy-history.json");
    await writeFile(target, frozen);
    const before = createHash("sha256").update(frozen).digest("hex");
    assert.equal(
      before,
      "ecf402d3ca4d3d27d8d545428c6e5ea6ee6d5990cd051bf3db29adbff3d2b964",
    );
    const read = await readFile(target);
    assert.equal(
      JSON.parse(read.toString()).operationId,
      "delivery-architecture-finalization",
    );
    assert.equal(
      isDeliveryOperationPackage(JSON.parse(read.toString())),
      false,
    );
    assert.deepEqual(await readFile(target), frozen);
    assert.equal(
      createHash("sha256")
        .update(await readFile(target))
        .digest("hex"),
      before,
    );
  } finally {
    await cleanup(fixture);
  }
});
