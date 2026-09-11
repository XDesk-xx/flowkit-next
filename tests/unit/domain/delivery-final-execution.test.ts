import { fixtureInstallation } from "./manager-installation-fixture.js";
import { readFullTestInput } from "../../../src/internal/full-test-input.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
import assert from "node:assert/strict";
import fs, { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { mock } from "node:test";

import {
  invokeDeliveryFinalOperation,
  isDeliveryFinalizationRecordForPackage,
  readDeliveryFinalization,
  prepareDeliveryFinalOperationPackage,
} from "../../../src/domain/index.js";
import {
  readDeliveryFinalCoordinationPrestate,
  writeDeliveryFinalCoordinationClosure,
} from "../../../src/internal/delivery-final-coordination.js";
import {
  acceptedOutcomes,
  cleanup,
  createFixture,
  deliveryId,
  evidenceSource,
  finalInput,
  git,
  manifest,
  presentationSensitiveManifest,
} from "./delivery-final-fixture.js";
test("Delivery Final prepares complete prerequisites and materializes one bounded closure", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    await mkdir(path.join(fixture.root, ".flowkit", "runs"), {
      recursive: true,
    });
    await writeFile(
      path.join(fixture.root, ".flowkit", "runs", "proof.json"),
      "{}\n",
    );
    assert.equal(
      (await readFullTestInput(fixture.root)).inputRef,
      outcomes.fullTest.record.inputRef,
    );
    const prepared = await prepareDeliveryFinalOperationPackage(
      fixture.root,
      finalInput(fixture, outcomes),
      evidenceSource(outcomes, fixture.root),
      fixtureInstallation(fixture.root),
    );
    assert.equal(prepared?.operationId, "delivery-final");
    assert.deepEqual(prepared?.operationFacts.completedRequiredChangeIds, [
      "first-change",
      "second-change",
    ]);

    const before = (await git(fixture.root, "status", "--short")).split(
      /\r?\n/,
    );
    const outcome = await invokeDeliveryFinalOperation(
      fixture.root,
      finalInput(fixture, outcomes),
      () => ({ status: "ready" }),
      evidenceSource(outcomes, fixture.root),
      loadManagerInstallation(),
    );
    assert.equal(outcome.status, "terminal");
    if (outcome.status !== "terminal") throw new Error("Final failed");
    assert.equal(
      isDeliveryFinalizationRecordForPackage(
        outcome.record,
        outcome.operationPackage,
      ),
      true,
    );
    assert.equal(Object.hasOwn(outcome.record, "finalizedCandidateRef"), false);
    assert.deepEqual(
      (await readDeliveryFinalization(fixture.root, deliveryId)).record,
      outcome.record,
    );
    const manifestBytes = await readFile(fixture.manifestPath, "utf8");
    assert.match(manifestBytes, /state: completed/);
    assert.match(manifestBytes, /fullTestStatus: "passed"/);
    assert.match(
      manifestBytes,
      /confirmationRef: "delivery-finalization:sha256:[0-9a-f]{64}"/,
    );
    assert.equal(manifestBytes.includes("finalizedCandidateRef"), false);
    const after = (await git(fixture.root, "status", "--short")).split(/\r?\n/);
    assert.deepEqual(
      after.filter((line) => !before.includes(line)),
      [],
    );
  } finally {
    await cleanup(fixture);
  }
});

test("Delivery Final writer preserves all non-target manifest bytes and ordering", async () => {
  const fixture = await createFixture(presentationSensitiveManifest());
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const prepared = await prepareDeliveryFinalOperationPackage(
      fixture.root,
      finalInput(fixture, outcomes),
      evidenceSource(outcomes, fixture.root),
      fixtureInstallation(fixture.root),
    );
    assert.notEqual(prepared, null);
    if (prepared === null) return;

    const before = await readFile(fixture.manifestPath, "utf8");
    const facts = prepared.operationFacts;
    const expected = before
      .replace(
        "  state: active # retain this delivery-state comment\n",
        "  state: completed # retain this delivery-state comment\n",
      )
      .replace(
        "  finalizationStatus: pending\n",
        "  finalizationStatus: completed\n",
      )
      .replace(
        `  fullTestAttempt: "${outcomes.fullTest.record.attemptId}"\n`,
        [
          `  fullTestAttempt: "${outcomes.fullTest.record.attemptId}"`,
          "finalization:",
          "  state: completed",
          `  verifiedCandidateRef: ${JSON.stringify(facts.verifiedCandidateRef)}`,
          `  fullTestExecutionRef: ${JSON.stringify(facts.fullTestExecutionRef)}`,
          `  ownerAuthorityRef: ${JSON.stringify(prepared.ownerAuthority.ref)}`,
          `  sourceRef: ${JSON.stringify(prepared.ownerAuthority.sourceRef)}`,
          `  fullTestAttempt: ${JSON.stringify(facts.fullTestAttempt)}`,
          "  confirmationRef: null",
          "",
        ].join("\n"),
      );

    const stages: string[] = [];
    const result = await writeDeliveryFinalCoordinationClosure(
      fixture.root,
      prepared,
      async () => {
        stages.push(await readFile(fixture.manifestPath, "utf8"));
        return true;
      },
    );
    assert.equal(result.status, "confirmed");
    if (result.status !== "confirmed") throw new Error("write failed");
    assert.deepEqual(stages, [expected, expected]);
    assert.equal(
      await readFile(fixture.manifestPath, "utf8"),
      expected.replace(
        "confirmationRef: null",
        "confirmationRef: " +
          JSON.stringify(result.record.deliveryFinalizationRef),
      ),
    );
  } finally {
    await cleanup(fixture);
  }
});

test("Delivery Final coordination reader rejects missing, mismatched, duplicate, and incomplete manifests", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-final-manifest-"));
  const target = path.join(
    root,
    "openspec",
    "delivery-groups",
    `${deliveryId}.yaml`,
  );
  try {
    assert.equal(
      await readDeliveryFinalCoordinationPrestate(root, deliveryId),
      null,
    );
    await mkdir(path.dirname(target), { recursive: true });
    for (const invalid of [
      manifest("wrong-delivery"),
      manifest(deliveryId, "active"),
      `${manifest()}  - id: first-change\n    required: false\n    state: completed\n`,
      "not: [valid",
    ]) {
      await writeFile(target, invalid);
      assert.equal(
        await readDeliveryFinalCoordinationPrestate(root, deliveryId),
        null,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Delivery Final coordination writer never returns success on staging, replace, or readback failure", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const prepared = await prepareDeliveryFinalOperationPackage(
      fixture.root,
      finalInput(fixture, outcomes),
      evidenceSource(outcomes, fixture.root),
      fixtureInstallation(fixture.root),
    );
    assert.notEqual(prepared, null);
    if (prepared === null) return;
    const original = await readFile(fixture.manifestPath);

    const stagingFailure = mock.method(fs, "open", async () => {
      throw new Error("injected staging failure");
    });
    assert.equal(
      (
        await writeDeliveryFinalCoordinationClosure(
          fixture.root,
          prepared,
          async () => true,
        )
      ).status,
      "failed",
    );
    stagingFailure.mock.restore();
    assert.deepEqual(await readFile(fixture.manifestPath), original);

    const replaceFailure = mock.method(fs, "rename", async () => {
      throw new Error("injected replace failure");
    });
    assert.equal(
      (
        await writeDeliveryFinalCoordinationClosure(
          fixture.root,
          prepared,
          async () => true,
        )
      ).status,
      "failed",
    );
    replaceFailure.mock.restore();
    assert.deepEqual(await readFile(fixture.manifestPath), original);

    const originalReadFile = fs.readFile.bind(fs);
    let manifestReads = 0;
    const readbackFailure = mock.method(
      fs,
      "readFile",
      async (target: Parameters<typeof fs.readFile>[0]) => {
        if (String(target) === fixture.manifestPath && ++manifestReads === 3) {
          throw new Error("injected readback failure");
        }
        return originalReadFile(target);
      },
    );
    assert.equal(
      (
        await writeDeliveryFinalCoordinationClosure(
          fixture.root,
          prepared,
          async () => true,
        )
      ).status,
      "failed",
    );
    readbackFailure.mock.restore();
    assert.match(
      await readFile(fixture.manifestPath, "utf8"),
      /state: completed/,
    );
    const entries = await fs.readdir(path.dirname(fixture.manifestPath));
    assert.equal(
      entries.some((entry) => entry.endsWith(".tmp")),
      false,
    );
  } finally {
    mock.restoreAll();
    await cleanup(fixture);
  }
});

test("Delivery Final preparation rejects partial facts, active OpenSpec, output drift, and candidate drift", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const input = finalInput(fixture, outcomes) as Record<string, unknown>;
    assert.notEqual(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        evidenceSource(outcomes, fixture.root),
        fixtureInstallation(fixture.root),
      ),
      null,
    );
    const source = evidenceSource(outcomes, fixture.root);
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        { ...input, requiredEvidence: { selfSigned: true } },
        evidenceSource(outcomes, fixture.root),
        fixtureInstallation(fixture.root),
      ),
      null,
    );
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        {
          ...source,
          readChangeClosure: async (
            request: Parameters<typeof source.readChangeClosure>[0],
          ) => {
            if (request.changeId === "second-change") {
              throw new Error("missing accepted anchor");
            }
            return source.readChangeClosure(request);
          },
        },
        fixtureInstallation(fixture.root),
      ),
      null,
    );
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        {
          ...source,
          readChangeClosure: async (
            request: Parameters<typeof source.readChangeClosure>[0],
          ) => {
            const closure = await source.readChangeClosure(request);
            return request.changeId === "first-change"
              ? {
                  ...closure,
                  reviewApply: { ...closure.reviewApply, artifacts: [] },
                }
              : closure;
          },
        },
        fixtureInstallation(fixture.root),
      ),
      null,
    );
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        {
          ...source,
          readFullTest: () => {
            throw new Error("caller source must not be consumed");
          },
        },
        fixtureInstallation(fixture.root),
      ),
      null,
    );
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        {
          ...input,
          fullTestOutcome: { status: "passed" },
        },
        evidenceSource(outcomes, fixture.root),
        fixtureInstallation(fixture.root),
      ),
      null,
    );

    await writeFile(
      fixture.openspecEntrypoint,
      `console.log(JSON.stringify({changes:[{name:"active-change"}],root:{path:${JSON.stringify(fixture.root)},source:"nearest"}}));\n`,
    );
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        evidenceSource(outcomes, fixture.root),
        fixtureInstallation(fixture.root),
      ),
      null,
    );
    await writeFile(
      fixture.openspecEntrypoint,
      `console.log(JSON.stringify({changes:[],root:{path:${JSON.stringify(fixture.root)},source:"nearest"}}));\n`,
    );

    await writeFile(fixture.openspecEntrypoint, "process.exit(7);\n");
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        evidenceSource(outcomes, fixture.root),
        fixtureInstallation(fixture.root),
      ),
      null,
    );
    await writeFile(
      fixture.openspecEntrypoint,
      `console.log(JSON.stringify({changes:[],root:{path:${JSON.stringify(fixture.root)},source:"nearest"}}));\n`,
    );
    await writeFile(path.join(fixture.root, "source.txt"), "drift\n");
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        evidenceSource(outcomes, fixture.root),
        fixtureInstallation(fixture.root),
      ),
      null,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("Delivery Final rejects failed archive anchors and unrelated external outcome bytes", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const input = finalInput(fixture, outcomes);
    const source = evidenceSource(outcomes, fixture.root);
    const failedArchive = {
      ...source,
      readChangeClosure: async (
        request: Parameters<typeof source.readChangeClosure>[0],
      ) => {
        const closure = await source.readChangeClosure(request);
        return {
          ...closure,
          archive: { ...closure.archive, sourceRef: "" },
        };
      },
    };
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        failedArchive,
        fixtureInstallation(fixture.root),
      ),
      null,
    );

    const unrelated = Buffer.from('{"status":"passed"}\n');
    assert.equal(
      await prepareDeliveryFinalOperationPackage(
        fixture.root,
        input,
        {
          ...source,
          readFullTest: () => ({
            sourceRef: "test:full-test-source",
            outcomeJson: unrelated,
            artifacts: [
              { artifact: "full-test/outcome.json", bytes: unrelated },
            ],
          }),
        },
        fixtureInstallation(fixture.root),
      ),
      null,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("Delivery Final callback is defensive and correction or invalid results do not close coordination", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const input = finalInput(fixture, outcomes);
    const before = await readFile(fixture.manifestPath);
    const correction = await invokeDeliveryFinalOperation(
      fixture.root,
      input,
      ({ operationPackage }) => {
        (
          operationPackage.operationFacts.completedRequiredChangeIds as string[]
        )[0] = "mutated-change";
        (operationPackage.ownerAuthority.scope as string[])[0] = "git";
        return { status: "correction-required", reason: "needs correction" };
      },
      evidenceSource(outcomes, fixture.root),
      fixtureInstallation(fixture.root),
    );
    assert.equal(correction.status, "correction-required");
    assert.deepEqual(await readFile(fixture.manifestPath), before);
    if (correction.status === "correction-required") {
      assert.deepEqual(
        correction.operationPackage.operationFacts.completedRequiredChangeIds,
        ["first-change", "second-change"],
      );
      assert.deepEqual(correction.operationPackage.ownerAuthority.scope, [
        "delivery-final",
      ]);
    }
    const invalid = await invokeDeliveryFinalOperation(
      fixture.root,
      input,
      () => ({ status: "ready", extra: true }) as never,
      evidenceSource(outcomes, fixture.root),
      fixtureInstallation(fixture.root),
    );
    assert.deepEqual(invalid, {
      status: "failed",
      reason: "execution-result-rejected",
      mutationStatus: "not-written",
      record: null,
    });
    assert.deepEqual(await readFile(fixture.manifestPath), before);
    const drift = await invokeDeliveryFinalOperation(
      fixture.root,
      input,
      async () => {
        await writeFile(
          path.join(fixture.root, "source.txt"),
          "callback drift\n",
        );
        return { status: "ready" };
      },
      evidenceSource(outcomes, fixture.root),
      fixtureInstallation(fixture.root),
    );
    assert.equal(drift.status, "correction-required");
    assert.deepEqual(await readFile(fixture.manifestPath), before);
  } finally {
    await cleanup(fixture);
  }
});
