import type {
  DeliveryArchitectureClosureOutputRef,
  DeliveryArchitectureFinalizationClosureRecord,
} from "../domain/delivery-architecture-finalization-identity.js";
import type { DeliveryArchitectureFinalizationOperationPackage } from "../domain/delivery-operation-execution.js";
import {
  ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS,
  architectureClosureRef,
  architectureContentSha256,
  canonicalRepositoryRoot,
  fixedDeliveryArchitecturePaths,
  parseJsonObject,
  readFixedRegularFile,
  validateThinArchitectureCompare,
} from "./delivery-architecture-finalization-artifacts.js";

function sameClosureRef(
  left: DeliveryArchitectureClosureOutputRef,
  right: DeliveryArchitectureClosureOutputRef,
): boolean {
  return (
    left.artifact === right.artifact &&
    left.contentSha256 === right.contentSha256 &&
    left.bytes === right.bytes
  );
}

export async function revalidateArchitectureFinalizationClosureOutputs(
  repositoryRoot: string,
  operationPackage: DeliveryArchitectureFinalizationOperationPackage,
  record: DeliveryArchitectureFinalizationClosureRecord,
): Promise<boolean> {
  const root = await canonicalRepositoryRoot(repositoryRoot);
  if (root === null) return false;
  const paths = fixedDeliveryArchitecturePaths(operationPackage.deliveryId);
  const artifacts = [
    paths.actual,
    paths.currentToActual,
    paths.plannedToActual,
    ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.workflow,
    ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.lifecycle,
    ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.dataFlow,
  ] as const;
  const reread = await Promise.all(
    artifacts.map((artifact) => readFixedRegularFile(root, artifact)),
  );
  if (reread.some((bytes) => bytes === null)) return false;
  const [
    actual,
    currentCompare,
    plannedCompare,
    workflow,
    lifecycle,
    dataFlow,
  ] = reread as readonly Buffer[];
  const expectedRefs = [
    record.outputs.actualArchitectureRef,
    record.outputs.currentToActualCompareRef,
    record.outputs.plannedToActualCompareRef,
    record.outputs.workflowRef,
    record.outputs.lifecycleRef,
    record.outputs.dataFlowRef,
  ] as const;
  if (
    expectedRefs.some(
      (expected, index) =>
        !sameClosureRef(
          expected,
          architectureClosureRef(artifacts[index], reread[index]!),
        ),
    )
  ) {
    return false;
  }

  const current = await readFixedRegularFile(root, paths.current);
  const planned = await readFixedRegularFile(root, paths.planned);
  if (
    current === null ||
    planned === null ||
    architectureContentSha256(current) !==
      operationPackage.operationFacts.currentArchitectureRef.contentSha256 ||
    architectureContentSha256(planned) !==
      operationPackage.operationFacts.plannedArchitectureRef.contentSha256
  ) {
    return false;
  }
  const actualRef = architectureClosureRef(paths.actual, actual);
  const actualSide = {
    ref: "./actual.architecture.json",
    sha256: actualRef.contentSha256,
    bytes: actualRef.bytes,
  } as const;
  return (
    parseJsonObject(actual.toString("utf8")) !== null &&
    validateThinArchitectureCompare(
      currentCompare.toString("utf8"),
      operationPackage.deliveryId,
      "current-to-actual",
      {
        ref: "./current.architecture.json",
        sha256: architectureContentSha256(current),
        bytes: current.length,
      },
      actualSide,
    ) &&
    validateThinArchitectureCompare(
      plannedCompare.toString("utf8"),
      operationPackage.deliveryId,
      "planned-to-actual",
      {
        ref: "./planned.architecture.json",
        sha256: architectureContentSha256(planned),
        bytes: planned.length,
      },
      actualSide,
    ) &&
    parseJsonObject(workflow.toString("utf8")) !== null &&
    parseJsonObject(lifecycle.toString("utf8")) !== null &&
    parseJsonObject(dataFlow.toString("utf8")) !== null
  );
}
