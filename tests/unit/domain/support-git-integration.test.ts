import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { integrateRepository } from "../../../src/cli/support-git-integrate.js";
import { git, makeFixture } from "./delivery-integration-fixture.js";

test("fixed Integration preserves pending checkpoint and confirms externally accepted ref", async () => {
  const fixture = await makeFixture();
  try {
    const { root, input } = fixture;
    const request = {
      repositoryRoot: root,
      deliveryId: input.deliveryId,
      ownerAuthority: input.ownerAuthority,
      gitRequest: {
        targetRoot: root,
        node: "repository-integration",
        deliveryId: input.deliveryId,
        changeId: null,
        ownerSourceRef: input.ownerAuthority.sourceRef,
        expectedBranch: input.deliveryBranch,
        operation: input.checkpointOperation,
      },
      integrationInput: {
        targetMainRef: input.targetMainRef,
        acceptedBaseCommit: input.acceptedBaseCommit,
        checkpointOperation: input.checkpointOperation,
      },
    };
    const outcome = await integrateRepository(request);
    assert.equal(outcome.status, "incomplete");
    assert.notEqual(outcome.effect, "none", JSON.stringify(outcome));
    const checkpoint = await git(root, "rev-parse", "HEAD");
    assert.notEqual(checkpoint, input.acceptedBaseCommit);
    await git(
      root,
      "update-ref",
      input.targetMainRef,
      checkpoint,
      input.acceptedBaseCommit,
    );
    const reused = {
      kind: "reuse-existing" as const,
      checkpointCommit: checkpoint,
    };
    const accepted = await integrateRepository({
      ...request,
      gitRequest: { ...request.gitRequest, operation: reused },
      integrationInput: {
        ...request.integrationInput,
        checkpointOperation: reused,
      },
    });
    assert.equal(accepted.status, "completed", JSON.stringify(accepted));
    assert.equal(
      (accepted.outcome as { observed: { checkpointCommit: string } }).observed
        .checkpointCommit,
      checkpoint,
    );
    const rejected = await integrateRepository({
      ...request,
      ownerAuthority: {
        ...input.ownerAuthority,
        sourceRef: "test:wrong-owner",
      },
    });
    assert.deepEqual(rejected, {
      status: "incomplete",
      effect: "none",
      reason: "integration-input-or-authority-invalid",
    });
  } finally {
    await fs.rm(fixture.root, { recursive: true, force: true });
  }
});
