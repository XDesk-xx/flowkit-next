import { fixtureInstallation } from "./manager-installation-fixture.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
import assert from "node:assert/strict";
import { rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  invokeDeliveryRepositoryIntegrationOperation,
  prepareDeliveryRepositoryIntegrationOperationPackage,
} from "../../../src/domain/index.js";
import {
  makeFixture,
  git,
  deliveryId,
} from "./delivery-integration-fixture.js";

test("confirmation lost during final authorization read rejects before Git callback", async () => {
  const f = await makeFixture();
  try {
    const source = f.integrationSource();
    let reads = 0;
    let callbacks = 0;
    const drifting = {
      ...source,
      readAuthorization: async (
        ...args: Parameters<typeof source.readAuthorization>
      ) => {
        const result = await source.readAuthorization(...args);
        if (++reads === 2) {
          const bytes = await readFile(f.manifestPath, "utf8");
          await writeFile(
            f.manifestPath,
            bytes.replace(f.confirmationRef, "unpublished"),
          );
        }
        return result;
      },
    };
    const before = await git(f.root, "rev-parse", "HEAD");
    const result = await invokeDeliveryRepositoryIntegrationOperation(
      f.root,
      f.input,
      () => {
        callbacks++;
        return { status: "committed" };
      },
      () => {
        callbacks++;
        return { status: "repository-acceptance-complete" };
      },
      drifting,
      fixtureInstallation(f.root),
    );
    assert.equal(result.status, "failed");
    assert.equal(callbacks, 0);
    assert.equal(await git(f.root, "rev-parse", "HEAD"), before);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("trusted preparation binds exact finalized state and pre-integration Git facts", async () => {
  const fixture = await makeFixture();
  try {
    const operationPackage =
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        fixture.input,
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
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

test("trusted Owner source rejects caller checkpoint-operation substitution", async () => {
  const fixture = await makeFixture();
  try {
    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        {
          ...fixture.input,
          checkpointOperation: {
            kind: "reuse-existing",
            checkpointCommit: fixture.input.acceptedBaseCommit,
          },
        },
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
      ),
      null,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("Integration rejects caller old Final packages instead of translating them", async () => {
  const fixture = await makeFixture();
  try {
    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        { ...fixture.input, deliveryFinalOutcome: { status: "terminal" } },
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
      ),
      null,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("coordination byte drift invalidates trusted preparation", async () => {
  const fixture = await makeFixture();
  try {
    const artifact = `openspec/delivery-groups/${deliveryId}.yaml`;
    await writeFile(
      path.join(fixture.root, ...artifact.split("/")),
      "drift\n",
      "utf8",
    );
    assert.equal(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        fixture.input,
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
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
      fixture.integrationSource(),
      loadManagerInstallation(),
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

test("repository integration reuses an explicitly bound existing checkpoint without creating a second commit", async () => {
  const fixture = await makeFixture();
  try {
    await git(fixture.root, "add", ".");
    await git(
      fixture.root,
      "commit",
      "-m",
      "chore(delivery): existing checkpoint",
    );
    const checkpointCommit = await git(fixture.root, "rev-parse", "HEAD");
    const checkpointOperation = {
      kind: "reuse-existing" as const,
      checkpointCommit,
    };
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      fixture.root,
      {
        ...fixture.input,
        checkpointOperation,
      },
      undefined,
      async ({ finalCommit }) => {
        await git(fixture.root, "update-ref", "refs/heads/main", finalCommit);
        return { status: "repository-acceptance-complete" };
      },
      fixture.integrationSource(checkpointOperation),
      fixtureInstallation(fixture.root),
    );
    assert.equal(outcome.status, "terminal");
    if (outcome.status !== "terminal") throw new Error("expected terminal");
    assert.equal(outcome.record.preIntegrationHead, checkpointCommit);
    assert.equal(outcome.record.finalCommit, checkpointCommit);
    assert.deepEqual(outcome.record.checkpointOperation, {
      kind: "reuse-existing",
      checkpointCommit,
    });
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
      fixture.integrationSource(),
      fixtureInstallation(fixture.root),
    );
    assert.deepEqual(outcome, {
      status: "failed",
      reason: "final-commit-rejected",
      record: null,
      gitEffects: {
        phase: "commit",
        effect: "confirmed",
        checkpointCommit: await git(fixture.root, "rev-parse", "HEAD"),
        remaining: ["核对 checkpoint 已有效果与当前权限"],
        observedHead: await git(fixture.root, "rev-parse", "HEAD"),
        observedTargetMainCommit: await git(
          fixture.root,
          "rev-parse",
          "refs/heads/main",
        ),
      },
    });
    assert.equal(providerCalled, false);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("trusted accepted operation does not reapply Final whole-tree equality", async () => {
  const fixture = await makeFixture();
  try {
    let acceptedMainCommit = "";
    let finalCommit = "";
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      fixture.root,
      fixture.input,
      async () => {
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "chore(delivery): final");
        return { status: "committed" };
      },
      async ({ finalCommit: committed }) => {
        finalCommit = committed;
        await git(fixture.root, "update-ref", "refs/heads/main", committed);
        await git(fixture.root, "checkout", "main");
        await writeFile(
          path.join(fixture.root, "unexpected.txt"),
          "extra\n",
          "utf8",
        );
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "unexpected concurrent bytes");
        acceptedMainCommit = await git(fixture.root, "rev-parse", "HEAD");
        return { status: "repository-acceptance-complete" };
      },
      fixture.integrationSource(
        undefined,
        () => acceptedMainCommit,
        () => finalCommit,
      ),
      fixtureInstallation(fixture.root),
    );
    assert.equal(outcome.status, "terminal");
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});
