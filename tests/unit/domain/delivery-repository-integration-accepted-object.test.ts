import { fixtureInstallation } from "./manager-installation-fixture.js";
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
  type DeliveryCheckpointOperation,
  type ReadDeliveryRequiredEvidence,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";
import { deriveDeliveryRequiredEvidenceFromSource } from "../../../src/internal/delivery-required-evidence-source.js";
import type { ReadRepositoryIntegrationSource } from "../../../src/internal/delivery-repository-integration-source.js";
import {
  acceptedEvidenceOutcomes,
  evidenceSourceFor,
} from "./delivery-evidence-outcome-fixture.js";
import { admittedRunMaterial } from "./delivery-run-evidence-fixture.js";

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
  readRequiredEvidence: ReadDeliveryRequiredEvidence;
  input: {
    deliveryId: typeof deliveryId;
    ownerAuthority: OwnerAuthorityFact;
    deliveryFinalOutcome: DeliveryFinalInvocationTerminal;
    deliveryBranch: string;
    targetMainRef: string;
    acceptedBaseCommit: string;
    checkpointOperation: { readonly kind: "create-new" };
  };
  integrationSource: (
    operation?:
      | { readonly kind: "create-new" }
      | {
          readonly kind: "reuse-existing";
          readonly checkpointCommit: string;
        },
    acceptedMain?: () => string | Promise<string>,
    finalCommit?: () => string | Promise<string>,
  ) => ReadRepositoryIntegrationSource;
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
  await mkdir(path.join(root, ".flowkit"), { recursive: true });
  await writeFile(
    path.join(root, ".flowkit", "project.json"),
    '{"projectId":"flowkit-next"}\n',
  );

  const reviewApplyRunId = "20260901-001-review-apply";
  const archiveRunId = "20260901-002-archive";
  const runRoot = `.flowkit/runs/${deliveryId}/001-change-one`;
  const makeRun = (
    runId: string,
    sequence: number,
    actionId: "review-apply" | "archive",
    previousRunId: string | null,
  ) => {
    const actionIdentity = { deliveryId, changeId: "change-one", actionId };
    return admittedRunMaterial({
      runId,
      artifactRoot: `${runRoot}/${runId}`,
      actionMarkdown: Buffer.from(`# ${actionId}\n`),
      contextJson: Buffer.from(
        `${JSON.stringify({
          runId,
          occurrence: { date: "20260901", sequence, actionId },
          actionIdentity,
          role: actionId === "review-apply" ? "reviewer" : "author",
          lifecycleState: "prepared",
          ownerAuthority: null,
          previousRunId,
        })}\n`,
      ),
      resultJson: Buffer.from(
        `${JSON.stringify({
          runId,
          actionIdentity,
          authorConclusion: actionId === "archive" ? "PASS" : null,
          reviewerVerdict: actionId === "review-apply" ? "approved" : null,
          verificationVerdict: null,
          nextBoundary: actionId === "review-apply" ? "archive" : "checkpoint",
          facts: {},
        })}\n`,
      ),
    });
  };
  const runMaterials = [
    makeRun(reviewApplyRunId, 1, "review-apply", null),
    makeRun(archiveRunId, 2, "archive", reviewApplyRunId),
  ];
  for (const run of runMaterials) {
    const target = path.join(root, ...run.artifactRoot.split("/"));
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "action.md"), run.actionMarkdown);
    await writeFile(path.join(target, "context.json"), run.contextJson);
    await writeFile(path.join(target, "result.json"), run.resultJson);
  }

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
  const evidenceOutcomes = await acceptedEvidenceOutcomes(deliveryId, root);
  const readRequiredEvidence: ReadDeliveryRequiredEvidence = evidenceSourceFor(
    root,
    deliveryId,
    [
      {
        changeId: "change-one",
        archiveRunId,
        reviewApplyRunId,
        runs: runMaterials,
      },
    ],
    evidenceOutcomes,
  );
  const requiredEvidence = await deriveDeliveryRequiredEvidenceFromSource(
    readRequiredEvidence,
    {
      repositoryRoot: root,
      projectId: "flowkit-next",
      deliveryId,
      changeIds: ["change-one"],
      fullTestExecutionRef: evidenceOutcomes.fullTest.record.executionRef,
    },
  );
  assert.notEqual(requiredEvidence, null);
  const finalFacts = {
    verifiedCandidateRef: evidenceOutcomes.fullTest.record.inputRef,
    fullTestExecutionRef: evidenceOutcomes.fullTest.record.executionRef,
    coordinationPrestateRef: {
      artifact: `openspec/delivery-groups/${deliveryId}.yaml`,
      contentSha256: "5".repeat(64),
      bytes: 100,
    },
    completedRequiredChangeIds: ["change-one"],
    requiredEvidence: requiredEvidence!,
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
    `id: ${deliveryId}\ndelivery:\n  state: completed\n  fullTestStatus: passed\n  fullTestAttempt: ${evidenceOutcomes.fullTest.record.attemptId}\n`,
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
      coordinationRef,
      finalizedCandidateRef: finalizedCandidateRef!,
    },
  };
  const preIntegrationHead = await git(root, "rev-parse", "HEAD");
  const integrationSource = (
    operation: DeliveryCheckpointOperation = { kind: "create-new" },
    acceptedMain?: () => string | Promise<string>,
    acceptedFinal?: () => string | Promise<string>,
  ): ReadRepositoryIntegrationSource => ({
    readAuthorization: () => ({
      sourceRef: "test:owner-repository-integration",
      ownerAuthorityRef: `owner:${"c".repeat(64)}`,
      ownerAuthoritySourceRef: "test:repo-integration",
      deliveryId,
      deliveryBranch: "delivery/d04",
      targetMainRef: "refs/heads/main",
      targetMainPreIntegrationCommit: acceptedBaseCommit,
      preIntegrationHead:
        operation.kind === "reuse-existing"
          ? operation.checkpointCommit
          : preIntegrationHead,
      acceptedBaseCommit,
      checkpointOperation: operation,
      reuseCheckpointSourceRef:
        operation.kind === "reuse-existing"
          ? "test:authorized-checkpoint"
          : null,
    }),
    readAcceptance: async () => {
      const finalCommit =
        acceptedFinal !== undefined
          ? await acceptedFinal()
          : operation.kind === "reuse-existing"
            ? operation.checkpointCommit
            : await git(root, "rev-parse", "HEAD");
      return {
        sourceRef: "test:accepted-repository-operation",
        ownerAuthorityRef: `owner:${"c".repeat(64)}`,
        deliveryId,
        targetMainRef: "refs/heads/main",
        targetMainPreIntegrationCommit: acceptedBaseCommit,
        checkpointOperation: operation,
        finalCommit,
        acceptedMainCommit:
          acceptedMain === undefined ? finalCommit : await acceptedMain(),
      };
    },
  });

  return {
    root,
    readRequiredEvidence,
    integrationSource,
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
      checkpointOperation: { kind: "create-new" as const },
    },
  };
}

test("accepted object may use different history when its exact product and required evidence match", async () => {
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
      fixture.readRequiredEvidence,
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
      fixture.readRequiredEvidence,
      fixture.integrationSource(),
      fixtureInstallation(fixture.root),
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

test("accepted object with product-equivalent but damaged required Run evidence is rejected", async () => {
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
        await writeFile(resultPath, '{"damaged":true}\n');
        await git(fixture.root, "add", ".flowkit/runs");
        await git(fixture.root, "commit", "-m", "damage accepted evidence");
        acceptedMainCommit = await git(fixture.root, "rev-parse", "HEAD");
        return { status: "repository-acceptance-complete" };
      },
      fixture.readRequiredEvidence,
      fixture.integrationSource(
        undefined,
        () => acceptedMainCommit,
        () => finalCheckpoint,
      ),
      fixtureInstallation(fixture.root),
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
        fixture.readRequiredEvidence,
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
        fixture.readRequiredEvidence,
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
        fixture.readRequiredEvidence,
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
        fixture.readRequiredEvidence,
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
        fixture.readRequiredEvidence,
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
        fixture.readRequiredEvidence,
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
      fixture.readRequiredEvidence,
      fixture.integrationSource(),
      fixtureInstallation(fixture.root),
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
