import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveDeliveryFinalizationRef,
  isDeliveryFinalizationRecord,
  formDeliveryOperationPackage,
  isDeliveryFinalizationRecordForPackage,
} from "../../../src/domain/index.js";
import { finalFacts } from "./delivery-operation-fixture.js";

test("Final local ref fixed golden vector rejects old packages and every missing/extra field", () => {
  const links = {
    projectId: "test-project",
    deliveryId: "test-delivery",
    ownerAuthorityRef: "owner:" + "a".repeat(64),
    sourceRef: "owner-input:final",
    fullTestAttempt: "12345678-1234-4123-8123-123456789abc",
    verifiedCandidateRef: "full-test-input:sha256:" + "b".repeat(64),
    fullTestExecutionRef: "full-test-execution:sha256:" + "c".repeat(64),
  };
  const ref =
    "delivery-finalization:sha256:28232af29234ec01048689bd3c5eae996a92806ff1c24150ee3734e238634b1e";
  assert.equal(deriveDeliveryFinalizationRef(links), ref);
  assert.equal(
    deriveDeliveryFinalizationRef(
      Object.fromEntries(Object.entries(links).reverse()),
    ),
    ref,
  );
  for (const key of Object.keys(links)) {
    const copy = { ...links } as Record<string, unknown>;
    delete copy[key];
    assert.equal(deriveDeliveryFinalizationRef(copy), null);
  }
  for (const key of [
    "requiredEvidence",
    "finalizedCandidateRef",
    "coordinationRef",
    "confirmationRef",
    "guidanceRef",
    "architecture",
  ]) {
    assert.equal(deriveDeliveryFinalizationRef({ ...links, [key]: {} }), null);
    assert.equal(
      isDeliveryFinalizationRecord({
        ...links,
        deliveryFinalizationRef: ref,
        [key]: {},
      }),
      false,
    );
  }
  const facts = finalFacts();
  const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";
  const ownerAuthority = {
    ref: links.ownerAuthorityRef,
    decision: "finalize-delivery",
    deliveryId,
    sourceRef: links.sourceRef,
    scope: ["delivery-final"],
  };
  const operationPackage = formDeliveryOperationPackage(
    deliveryId,
    "delivery-final",
    ownerAuthority,
    facts,
    { path: "skills/delivery/final/SKILL.md", contentSha256: "d".repeat(64) },
  );
  assert.notEqual(operationPackage, null);
  assert.equal(deriveDeliveryFinalizationRef(operationPackage), null);
  const matching = {
    ...links,
    deliveryId,
    projectId: facts.projectId,
    verifiedCandidateRef: facts.verifiedCandidateRef,
    fullTestExecutionRef: facts.fullTestExecutionRef,
  };
  const record = {
    ...matching,
    deliveryFinalizationRef: deriveDeliveryFinalizationRef(matching),
  };
  assert.equal(
    isDeliveryFinalizationRecordForPackage(record, operationPackage),
    true,
  );
  assert.equal(
    isDeliveryFinalizationRecordForPackage(
      { ...record, fullTestAttempt: "wrong" },
      operationPackage,
    ),
    false,
  );
});
