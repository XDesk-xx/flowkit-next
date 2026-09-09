import { fixtureInstallation } from "./manager-installation-fixture.js";
import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
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

test("trusted acceptance may identify an exact object with different history", async () => {
  const fixture = await makeFixture();
  try {
    let acceptedMainCommit = "";
    let finalCheckpoint = "";
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      fixture.root,
      fixture.input,
      async () => {
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "chore(delivery): final");
        return { status: "committed" };
      },
      async ({ finalCommit }) => {
        finalCheckpoint = finalCommit;
        const tree = await git(
          fixture.root,
          "rev-parse",
          `${finalCommit}^{tree}`,
        );
        const acceptedCommit = await git(
          fixture.root,
          "commit-tree",
          tree,
          "-p",
          fixture.input.acceptedBaseCommit,
          "-m",
          "accepted equivalent object",
        );
        acceptedMainCommit = acceptedCommit;
        await git(
          fixture.root,
          "update-ref",
          "refs/heads/main",
          acceptedCommit,
        );
        return { status: "repository-acceptance-complete" };
      },
      fixture.integrationSource(
        undefined,
        () => acceptedMainCommit,
        () => finalCheckpoint,
      ),
      fixtureInstallation(fixture.root),
    );
    assert.equal(outcome.status, "terminal");
    if (outcome.status !== "terminal") throw new Error("expected terminal");
    assert.notEqual(
      outcome.record.acceptedMainCommit,
      outcome.record.finalCommit,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("content-equivalent history replacement without trusted acceptance is rejected", async () => {
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
        const tree = await git(
          fixture.root,
          "rev-parse",
          `${finalCommit}^{tree}`,
        );
        const replacement = await git(
          fixture.root,
          "commit-tree",
          tree,
          "-m",
          "unbound replacement",
        );
        await git(fixture.root, "update-ref", "refs/heads/main", replacement);
        return { status: "repository-acceptance-complete" };
      },
      fixture.integrationSource(),
      fixtureInstallation(fixture.root),
    );
    assert.deepEqual(outcome, {
      status: "failed",
      reason: "repository-acceptance-rejected",
      record: null,
      gitEffects: {
        observedHead: await git(fixture.root, "rev-parse", "HEAD"),
        observedTargetMainCommit: await git(
          fixture.root,
          "rev-parse",
          "refs/heads/main",
        ),
      },
    });
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("Integration does not reread historical Run evidence outside its operation", async () => {
  const fixture = await makeFixture();
  try {
    let acceptedMainCommit = "";
    let finalCheckpoint = "";
    const outcome = await invokeDeliveryRepositoryIntegrationOperation(
      fixture.root,
      fixture.input,
      async () => {
        await git(fixture.root, "add", ".");
        await git(fixture.root, "commit", "-m", "chore(delivery): final");
        return { status: "committed" };
      },
      async ({ finalCommit }) => {
        finalCheckpoint = finalCommit;
        await git(fixture.root, "update-ref", "refs/heads/main", finalCommit);
        await git(fixture.root, "checkout", "main");
        const resultPath = path.join(
          fixture.root,
          ".flowkit",
          "runs",
          deliveryId,
          "001-change-one",
          "20260901-002-archive",
          "result.json",
        );
        await mkdir(path.dirname(resultPath), { recursive: true });
        await writeFile(resultPath, '{"damaged":true}\n');
        await git(fixture.root, "add", ".flowkit/runs");
        await git(fixture.root, "commit", "-m", "damage accepted evidence");
        acceptedMainCommit = await git(fixture.root, "rev-parse", "HEAD");
        return { status: "repository-acceptance-complete" };
      },
      fixture.integrationSource(
        undefined,
        () => acceptedMainCommit,
        () => finalCheckpoint,
      ),
      fixtureInstallation(fixture.root),
    );
    assert.equal(outcome.status, "terminal");
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
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
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
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
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
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
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
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
      );
      assert.equal(outcome.status, "failed");
      if (outcome.status === "failed")
        assert.equal(outcome.reason, "final-commit-rejected");
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  await t.test("two-parent commit", async () => {
    const fixture = await makeFixture();
    try {
      const outcome = await invokeDeliveryRepositoryIntegrationOperation(
        fixture.root,
        fixture.input,
        async () => {
          await git(fixture.root, "add", ".");
          const tree = await git(fixture.root, "write-tree");
          const head = await git(fixture.root, "rev-parse", "HEAD");
          const baseTree = await git(
            fixture.root,
            "rev-parse",
            `${fixture.input.acceptedBaseCommit}^{tree}`,
          );
          const other = await git(
            fixture.root,
            "commit-tree",
            baseTree,
            "-m",
            "other root",
          );
          const merge = await git(
            fixture.root,
            "commit-tree",
            tree,
            "-p",
            head,
            "-p",
            other,
            "-m",
            "invalid merge final",
          );
          await git(fixture.root, "update-ref", "HEAD", merge, head);
          return { status: "committed" };
        },
        async () => ({ status: "repository-acceptance-complete" }),
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
      );
      assert.equal(outcome.status, "failed");
      if (outcome.status === "failed") {
        assert.equal(outcome.reason, "final-commit-rejected");
      }
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
        fixture.integrationSource(),
        fixtureInstallation(fixture.root),
      );
      assert.equal(outcome.status, "failed");
      if (outcome.status === "failed")
        assert.equal(outcome.reason, "repository-acceptance-rejected");
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
      fixture.integrationSource(),
      fixtureInstallation(fixture.root),
    );
    assert.deepEqual(outcome, {
      status: "failed",
      reason: "repository-acceptance-rejected",
      record: null,
      gitEffects: {
        observedHead: await git(fixture.root, "rev-parse", "HEAD"),
        observedTargetMainCommit: await git(
          fixture.root,
          "rev-parse",
          "refs/heads/main",
        ),
      },
    });
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});
