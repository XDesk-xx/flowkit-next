import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { stringify } from "yaml";
import { deriveDeliveryFinalizationRef } from "../../../src/domain/delivery-finalization.js";
import type { DeliveryCheckpointOperation } from "../../../src/domain/delivery-repository-integration-operation.js";
import type { ReadRepositoryIntegrationSource } from "../../../src/internal/delivery-repository-integration-source.js";
import { git } from "./delivery-final-fixture.js";
export { git } from "./delivery-final-fixture.js";
export const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";

/** Synthetic confirmed record: tests Git consumption, not a real independent Review/Full Test. */
export async function makeFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-integration-"));
  await git(root, "init", "-b", "main");
  await git(root, "config", "user.name", "Flowkit Test");
  await git(root, "config", "user.email", "flowkit@example.invalid");
  await writeFile(path.join(root, "product.txt"), "base\n");
  await git(root, "add", ".");
  await git(root, "commit", "-m", "base");
  const acceptedBaseCommit = await git(root, "rev-parse", "HEAD");
  await git(root, "checkout", "-b", "delivery/d04");
  await mkdir(path.join(root, "skills/delivery/repository-integration"), {
    recursive: true,
  });
  await writeFile(
    path.join(root, "skills/delivery/repository-integration/SKILL.md"),
    "# Integration\n",
  );
  await writeFile(path.join(root, "product.txt"), "finalized\n");
  await mkdir(path.join(root, ".flowkit"));
  await writeFile(
    path.join(root, ".flowkit/project.json"),
    '{"projectId":"flowkit-next"}\n',
  );
  const links = {
    projectId: "flowkit-next",
    deliveryId,
    ownerAuthorityRef: "owner:" + "a".repeat(64),
    sourceRef: "test:delivery-final",
    fullTestAttempt: "12345678-1234-4123-8123-123456789abc",
    verifiedCandidateRef: "full-test-input:sha256:" + "b".repeat(64),
    fullTestExecutionRef: "full-test-execution:sha256:" + "c".repeat(64),
  };
  const confirmationRef = deriveDeliveryFinalizationRef(links)!;
  const { projectId: _project, deliveryId: _delivery, ...finalLinks } = links;
  const manifestPath = path.join(
    root,
    `openspec/delivery-groups/${deliveryId}.yaml`,
  );
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    stringify({
      id: deliveryId,
      delivery: {
        state: "completed",
        fullTestStatus: "passed",
        fullTestAttempt: links.fullTestAttempt,
        finalizationStatus: "completed",
      },
      finalization: { state: "completed", ...finalLinks, confirmationRef },
    }),
  );
  const input = {
    deliveryId,
    ownerAuthority: {
      ref: "owner:" + "c".repeat(64),
      decision: "authorize-repository-integration",
      deliveryId,
      sourceRef: "test:repo-integration",
      scope: ["delivery-repository-integration"],
    },
    deliveryBranch: "delivery/d04",
    targetMainRef: "refs/heads/main",
    acceptedBaseCommit,
    checkpointOperation: { kind: "create-new" as const },
  };
  const integrationSource = (
    operation: DeliveryCheckpointOperation = { kind: "create-new" },
    acceptedMain?: () => string | Promise<string>,
    acceptedFinal?: () => string | Promise<string>,
  ): ReadRepositoryIntegrationSource => ({
    readAuthorization: () => ({
      sourceRef: "test:owner-integration",
      ownerAuthorityRef: input.ownerAuthority.ref,
      ownerAuthoritySourceRef: input.ownerAuthority.sourceRef,
      deliveryId,
      deliveryBranch: input.deliveryBranch,
      targetMainRef: input.targetMainRef,
      targetMainPreIntegrationCommit: acceptedBaseCommit,
      preIntegrationHead:
        operation.kind === "reuse-existing"
          ? operation.checkpointCommit
          : acceptedBaseCommit,
      acceptedBaseCommit,
      checkpointOperation: operation,
      reuseCheckpointSourceRef:
        operation.kind === "reuse-existing"
          ? "test:authorized-checkpoint"
          : null,
    }),
    readAcceptance: async () => {
      const finalCommit = acceptedFinal
        ? await acceptedFinal()
        : operation.kind === "reuse-existing"
          ? operation.checkpointCommit
          : await git(root, "rev-parse", "HEAD");
      return {
        sourceRef: "test:accepted-operation",
        ownerAuthorityRef: input.ownerAuthority.ref,
        deliveryId,
        targetMainRef: input.targetMainRef,
        targetMainPreIntegrationCommit: acceptedBaseCommit,
        checkpointOperation: operation,
        finalCommit,
        acceptedMainCommit: acceptedMain ? await acceptedMain() : finalCommit,
      };
    },
  });
  return { root, input, integrationSource, manifestPath, confirmationRef };
}
