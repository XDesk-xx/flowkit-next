import { createHash } from "node:crypto";
import type { DeliveryRepositoryIntegrationOperationPackage } from "../domain/delivery-operation-execution.js";
import { cloneDeliveryRepositoryIntegrationOperationFacts } from "../domain/delivery-repository-integration-operation.js";

export function deriveDeliveryRepositoryIntegrationRef(
  operationPackage: DeliveryRepositoryIntegrationOperationPackage,
  finalCommit: string,
  acceptedMainCommit: string,
): string {
  const digest = createHash("sha256")
    .update("flowkit-repository-integration\0")
    .update(
      JSON.stringify({
        deliveryId: operationPackage.deliveryId,
        deliveryFinalizationRef:
          operationPackage.operationFacts.deliveryFinalizationRef,
        finalizedCandidateRef:
          operationPackage.operationFacts.finalizedCandidateRef,
        preIntegrationHead: operationPackage.operationFacts.preIntegrationHead,
        checkpointOperation: cloneDeliveryRepositoryIntegrationOperationFacts(
          operationPackage.operationFacts,
        ).checkpointOperation,
        finalCommit,
        targetMainRef: operationPackage.operationFacts.targetMainRef,
        targetMainPreIntegrationCommit:
          operationPackage.operationFacts.targetMainPreIntegrationCommit,
        acceptedMainCommit,
      }),
    )
    .digest("hex");
  return `repository-integration:sha256:${digest}`;
}
