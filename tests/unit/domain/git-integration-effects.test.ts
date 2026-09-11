import assert from "node:assert/strict";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { invokeDeliveryRepositoryIntegrationOperation } from "../../../src/domain/delivery-repository-integration-execution.js";
import { runIntegration } from "../../../src/domain/git-workflow-integration-host.js";
import type { GitHostRequest } from "../../../src/domain/git-workflow-host.js";
import { makeFixture, git } from "./delivery-integration-fixture.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";

test("null shape admits an explicitly authorized two-object scoped callback, not a global clean gate", async () => {
  const f = await makeFixture();
  try {
    const operation = { ...f.input.checkpointOperation, commitShape: null };
    const result = await invokeDeliveryRepositoryIntegrationOperation(
      f.root,
      { ...f.input, checkpointOperation: operation },
      async () => {
        await git(f.root, "add", ".");
        await git(f.root, "commit", "-m", "authorized first");
        await writeFile(path.join(f.root, "product.txt"), "authorized second");
        await git(f.root, "add", "product.txt");
        await git(f.root, "commit", "-m", "authorized second");
        await writeFile(path.join(f.root, "unrelated.txt"), "preserve");
        return { status: "committed" };
      },
      async ({ finalCommit }) => {
        await git(f.root, "update-ref", "refs/heads/main", finalCommit);
        return { status: "repository-acceptance-complete" };
      },
      f.integrationSource(operation),
      fixtureInstallation(f.root),
    );
    assert.equal(result.status, "terminal", JSON.stringify(result));
    assert.equal(
      await readFile(path.join(f.root, "unrelated.txt"), "utf8"),
      "preserve",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("intermediate out-of-scope commit cannot hide behind a final net diff", async () => {
  const f = await makeFixture();
  try {
    const operation = { ...f.input.checkpointOperation, commitShape: null };
    let called = false;
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      f.root,
      { ...f.input, checkpointOperation: operation },
      async () => {
        await writeFile(path.join(f.root, "outside.txt"), "outside");
        await git(f.root, "add", ".");
        await git(f.root, "commit", "-m", "outside");
        await git(f.root, "rm", "outside.txt");
        await git(f.root, "commit", "-m", "remove outside");
        return { status: "committed" };
      },
      () => {
        called = true;
        return { status: "repository-acceptance-complete" };
      },
      f.integrationSource(operation),
      fixtureInstallation(f.root),
    );
    assert.equal(outcome.status, "failed");
    assert.equal(called, false);
    if (outcome.status === "failed")
      assert.equal(
        outcome.gitEffects?.checkpointCommit,
        await git(f.root, "rev-parse", "HEAD"),
      );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("commit response loss preserves known object; failed readback stays unknown", async (t) => {
  for (const unreadable of [false, true])
    await t.test(String(unreadable), async () => {
      const f = await makeFixture();
      try {
        let committed = "";
        let accepted = false;
        const outcome = await invokeDeliveryRepositoryIntegrationOperation(
          f.root,
          f.input,
          async () => {
            await git(f.root, "add", ".");
            await git(f.root, "commit", "-m", "checkpoint");
            committed = await git(f.root, "rev-parse", "HEAD");
            if (unreadable)
              await rename(
                path.join(f.root, ".git"),
                path.join(f.root, ".git-unavailable"),
              );
            throw Error("fixture lost response");
          },
          () => {
            accepted = true;
            return null;
          },
          f.integrationSource(),
          fixtureInstallation(f.root),
        );
        assert.equal(accepted, false);
        assert.equal(outcome.status, "failed");
        if (outcome.status === "failed") {
          assert.equal(outcome.record, null);
          assert.equal(
            outcome.gitEffects?.checkpointCommit,
            unreadable ? null : committed,
          );
          assert.equal(
            outcome.gitEffects?.effect,
            unreadable ? "unknown" : "confirmed",
          );
        }
      } finally {
        await rm(f.root, { recursive: true, force: true });
      }
    });
});

test("manager host with no provider hands off checkpoint; explicit reuse with pending PR creates no extra commit", async () => {
  const f = await makeFixture();
  try {
    const request: GitHostRequest = {
      targetRoot: f.root,
      node: "repository-integration",
      deliveryId: f.input.deliveryId,
      changeId: null,
      expectedBranch: f.input.deliveryBranch,
      ownerSourceRef: f.input.ownerAuthority.sourceRef,
      operation: f.input.checkpointOperation,
    };
    const pending = await runIntegration(request, {
      input: f.input,
      readOwner: async () => ({ request }),
      readIntegrationSource: f.integrationSource(),
    });
    assert.equal(pending.status, "incomplete", JSON.stringify(pending));
    assert.equal(pending.phase, "acceptance");
    assert.equal(pending.effect, "confirmed");
    const commit = pending.observed.checkpointCommit!;
    assert.equal(commit, await git(f.root, "rev-parse", "HEAD"));
    const operation = {
      kind: "reuse-existing" as const,
      checkpointCommit: commit,
    };
    const reused = { ...request, operation };
    const second = await runIntegration(reused, {
      input: { ...f.input, checkpointOperation: operation },
      readOwner: async () => ({ request: reused }),
      readIntegrationSource: f.integrationSource(operation),
      performAcceptance: () => ({ status: "pending", pr: "test:synthetic-pr" }),
    });
    assert.equal(second.status, "incomplete");
    assert.equal(second.observed.checkpointCommit, commit);
    assert.equal(await git(f.root, "rev-parse", "HEAD"), commit);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
