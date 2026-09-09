import assert from "node:assert/strict";
import test from "node:test";
import {
  formDeliveryOperationPackage,
  deriveDeliveryRepositoryIntegrationRef,
  isDeliveryRepositoryIntegrationRecordForPackage,
} from "../../../src/domain/index.js";

test("Integration local projection golden vector, property ordering and old shape rejection", () => {
  const facts = {
    deliveryFinalizationRef: "delivery-finalization:sha256:" + "1".repeat(64),
    preIntegrationHead: "2".repeat(40),
    checkpointOperation: { kind: "create-new" },
    deliveryBranch: "delivery/test",
    targetMainRef: "refs/heads/main",
    targetMainPreIntegrationCommit: "4".repeat(40),
    acceptedBaseCommit: "6".repeat(40),
  };
  const formed = formDeliveryOperationPackage(
    "test-delivery",
    "delivery-repository-integration",
    {
      ref: "owner:" + "a".repeat(64),
      decision: "authorize-repository-integration",
      deliveryId: "test-delivery",
      sourceRef: "test:owner",
      scope: ["delivery-repository-integration"],
    },
    facts,
    {
      path: "skills/delivery/repository-integration/SKILL.md",
      contentSha256: "b".repeat(64),
    },
  );
  assert.notEqual(formed, null);
  const ref =
    "repository-integration:sha256:5e3754e0e6df438553481c07bc228b5ae6c256d6f61ce77bf5305a5b2fcbd300";
  assert.equal(
    deriveDeliveryRepositoryIntegrationRef(
      formed,
      "3".repeat(40),
      "5".repeat(40),
    ),
    ref,
  );
  assert.equal(
    deriveDeliveryRepositoryIntegrationRef(
      {
        ...formed,
        operationFacts: Object.fromEntries(Object.entries(facts).reverse()),
      },
      "3".repeat(40),
      "5".repeat(40),
    ),
    ref,
  );
  assert.equal(
    deriveDeliveryRepositoryIntegrationRef(
      {
        ...formed,
        operationFacts: {
          ...facts,
          finalizedCandidateRef: "candidate:sha256:" + "f".repeat(64),
        },
      },
      "3".repeat(40),
      "5".repeat(40),
    ),
    null,
  );
  const record = {
    repositoryIntegrationRef: ref,
    deliveryFinalizationRef: facts.deliveryFinalizationRef,
    preIntegrationHead: facts.preIntegrationHead,
    checkpointOperation: facts.checkpointOperation,
    finalCommit: "3".repeat(40),
    targetMainRef: facts.targetMainRef,
    targetMainPreIntegrationCommit: facts.targetMainPreIntegrationCommit,
    acceptedMainCommit: "5".repeat(40),
    nextDeliveryBase: "5".repeat(40),
  };
  assert.equal(
    isDeliveryRepositoryIntegrationRecordForPackage(record, formed),
    true,
  );
  for (const key of Object.keys(record)) {
    assert.equal(
      isDeliveryRepositoryIntegrationRecordForPackage(
        Object.fromEntries(
          Object.entries(record).filter(([name]) => name !== key),
        ),
        formed,
      ),
      false,
    );
  }
  assert.equal(
    isDeliveryRepositoryIntegrationRecordForPackage(
      { ...record, requiredEvidence: {} },
      formed,
    ),
    false,
  );
});
