import { createHash } from "node:crypto";
import { isDeliveryOperationPackage } from "../domain/delivery-operation-execution.js";
import { cloneDeliveryRepositoryIntegrationOperationFacts } from "../domain/delivery-repository-integration-operation.js";

export function deriveDeliveryRepositoryIntegrationRef(
  operationPackage: unknown,
  finalCommit: unknown,
  acceptedMainCommit: unknown,
): string | null {
  if (
    !isDeliveryOperationPackage(operationPackage) ||
    operationPackage.operationId !== "delivery-repository-integration" ||
    typeof finalCommit !== "string" ||
    !/^[0-9a-f]{40}$/.test(finalCommit) ||
    typeof acceptedMainCommit !== "string" ||
    !/^[0-9a-f]{40}$/.test(acceptedMainCommit)
  )
    return null;
  const digest = createHash("sha256")
    .update("flowkit-repository-integration\0")
    .update(
      JSON.stringify({
        deliveryId: operationPackage.deliveryId,
        deliveryFinalizationRef:
          operationPackage.operationFacts.deliveryFinalizationRef,
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
