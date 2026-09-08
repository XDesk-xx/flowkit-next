import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveDeliveryFinalizationRef,
  formDeliveryOperationPackage,
  resolveDeliveryGuidanceRef,
} from "../../../src/domain/index.js";
import { authority, deliveryId } from "./delivery-final-fixture.js";

test("Delivery Finalization ref has a fixed golden vector and ordered projection", async () => {
  const guidanceRef = {
    path: "skills/delivery/final/SKILL.md",
    contentSha256: "c".repeat(64),
  } as const;
  const operationPackage = formDeliveryOperationPackage(
    deliveryId,
    "delivery-final",
    authority("finalize-delivery"),
    {
      verifiedCandidateRef: `candidate:sha256:${"1".repeat(64)}`,
      fullTestExecutionRef: `full-test-execution:sha256:${"2".repeat(64)}`,
      coordinationPrestateRef: {
        artifact: `openspec/delivery-groups/${deliveryId}.yaml`,
        contentSha256: "5".repeat(64),
        bytes: 101,
      },
      completedRequiredChangeIds: ["first-change", "second-change"],
      requiredEvidence: {
        projectId: "flowkit-next",
        deliveryId,
        changeClosures: ["first-change", "second-change"].map(
          (changeId, index) => ({
            changeId,
            archiveRunId: `2026090${index + 1}-002-archive`,
            reviewApplyRunId: `2026090${index + 1}-001-review-apply`,
            runs: [
              `2026090${index + 1}-001-review-apply`,
              `2026090${index + 1}-002-archive`,
            ].map((runId) => ({
              runId,
              artifacts: ["action.md", "context.json", "result.json"].map(
                (name, artifactIndex) => ({
                  artifact: `runs/${name}`,
                  contentSha256: String(artifactIndex + 6).repeat(64),
                  bytes: 10,
                }),
              ),
            })),
          }),
        ),
        fullTest: {
          executionRef: `full-test-execution:sha256:${"2".repeat(64)}`,
          sourceRef: "test:full-test-source",
          artifacts: [
            {
              artifact: "full-test/outcome.json",
              contentSha256: "9".repeat(64),
              bytes: 10,
            },
          ],
        },
      },
    },
    guidanceRef,
  );
  assert.notEqual(operationPackage, null);
  if (operationPackage?.operationId !== "delivery-final") {
    throw new Error("invalid Final package fixture");
  }
  const coordinationRef = {
    artifact: `openspec/delivery-groups/${deliveryId}.yaml`,
    contentSha256: "6".repeat(64),
    bytes: 202,
  };
  const finalizedCandidateRef = `candidate:sha256:${"7".repeat(64)}`;
  const exact = deriveDeliveryFinalizationRef(
    operationPackage,
    coordinationRef,
    finalizedCandidateRef,
  );
  assert.equal(
    exact,
    "delivery-finalization:sha256:c46e34fec60f616675266c9260870fbb253078094ff02fdea84ecd8f482d5fc3",
  );
  assert.deepEqual(Object.keys(operationPackage.operationFacts), [
    "verifiedCandidateRef",
    "fullTestExecutionRef",
    "coordinationPrestateRef",
    "completedRequiredChangeIds",
    "requiredEvidence",
  ]);
  assert.deepEqual(
    Object.keys(operationPackage.operationFacts.requiredEvidence),
    ["projectId", "deliveryId", "changeClosures", "fullTest"],
  );
  for (const legacyFacts of [
    {
      ...operationPackage.operationFacts,
      architectureFinalizationRef: `architecture-finalization:sha256:${"3".repeat(64)}`,
    },
    {
      ...operationPackage.operationFacts,
      architectureMaterializedCandidateRef: `candidate:sha256:${"4".repeat(64)}`,
    },
    {
      ...operationPackage.operationFacts,
      requiredEvidence: {
        ...operationPackage.operationFacts.requiredEvidence,
        architecture: {},
      },
    },
  ]) {
    assert.equal(
      formDeliveryOperationPackage(
        deliveryId,
        "delivery-final",
        operationPackage.ownerAuthority,
        legacyFacts,
        guidanceRef,
      ),
      null,
    );
    assert.equal(
      deriveDeliveryFinalizationRef(
        { ...operationPackage, operationFacts: legacyFacts },
        coordinationRef,
        finalizedCandidateRef,
      ),
      null,
    );
  }
  const reverseFields = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(reverseFields);
    if (typeof value !== "object" || value === null) return value;
    return Object.fromEntries(
      Object.entries(value)
        .reverse()
        .map(([key, entry]) => [key, reverseFields(entry)]),
    );
  };
  const reordered = {
    ...operationPackage,
    operationFacts: {
      ...operationPackage.operationFacts,
      requiredEvidence: reverseFields(
        operationPackage.operationFacts.requiredEvidence,
      ),
    },
  };
  assert.equal(
    deriveDeliveryFinalizationRef(
      reordered,
      coordinationRef,
      finalizedCandidateRef,
    ),
    exact,
  );
  assert.equal(
    deriveDeliveryFinalizationRef(
      {
        guidanceRef,
        operationFacts: operationPackage.operationFacts,
        ownerAuthority: operationPackage.ownerAuthority,
        operationId: "delivery-final",
        deliveryId,
      },
      {
        bytes: 202,
        contentSha256: "6".repeat(64),
        artifact: coordinationRef.artifact,
      },
      finalizedCandidateRef,
    ),
    exact,
  );
  const reversed = formDeliveryOperationPackage(
    deliveryId,
    "delivery-final",
    authority("finalize-delivery"),
    {
      ...operationPackage.operationFacts,
      completedRequiredChangeIds: ["second-change", "first-change"],
      requiredEvidence: {
        ...operationPackage.operationFacts.requiredEvidence,
        changeClosures: [
          ...operationPackage.operationFacts.requiredEvidence.changeClosures,
        ].reverse(),
      },
    },
    guidanceRef,
  );
  assert.notEqual(reversed, null);
  assert.notEqual(
    deriveDeliveryFinalizationRef(
      reversed,
      coordinationRef,
      finalizedCandidateRef,
    ),
    exact,
  );
  assert.notEqual(
    deriveDeliveryFinalizationRef(
      operationPackage,
      { ...coordinationRef, bytes: 203 },
      finalizedCandidateRef,
    ),
    exact,
  );
  assert.equal(await resolveDeliveryGuidanceRef("", "delivery-final"), null);
});
