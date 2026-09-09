import { fixtureInstallation } from "./manager-installation-fixture.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
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

function reverseObjectFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseObjectFields);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .map(([key, entry]) => [key, reverseObjectFields(entry)]),
  );
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

test("trusted preparation binds exact finalized state and pre-integration Git facts", async () => {
  const fixture = await makeFixture();
  try {
    const operationPackage =
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        fixture.input,
        fixture.readRequiredEvidence,
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

test("Integration accepts semantically identical reordered Final evidence", async () => {
  const fixture = await makeFixture();
  try {
    const outcome = fixture.input.deliveryFinalOutcome;
    const operationFacts = outcome.operationPackage.operationFacts;
    const reordered = {
      ...outcome,
      operationPackage: {
        ...outcome.operationPackage,
        operationFacts: {
          ...operationFacts,
          requiredEvidence: reverseObjectFields(
            operationFacts.requiredEvidence,
          ),
        },
      },
    } as DeliveryFinalInvocationTerminal;
    assert.notEqual(
      await prepareDeliveryRepositoryIntegrationOperationPackage(
        fixture.root,
        { ...fixture.input, deliveryFinalOutcome: reordered },
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
      fixture.readRequiredEvidence,
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
      fixture.readRequiredEvidence,
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
      fixture.readRequiredEvidence,
      fixture.integrationSource(),
      fixtureInstallation(fixture.root),
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
      fixture.readRequiredEvidence,
      fixture.integrationSource(
        undefined,
        () => acceptedMainCommit,
        () => finalCommit,
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
