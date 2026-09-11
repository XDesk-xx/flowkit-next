import { open } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  loadManagerInstallation,
  type ManagerInstallation,
} from "../internal/manager-installation.js";
import {
  hasExactlyFields,
  isPlainRecord,
} from "../internal/applicable-check-identity.js";
import { fullTestPath, fullTestDigest } from "../internal/full-test-input.js";
import { isSemanticId, type DeliveryId } from "./identity.js";
import type { OwnerAuthorityFact } from "./authority.js";
import {
  formDeliveryOperationPackage,
  isDeliveryPlanningReference,
  isDeliveryStartAuthorityForDelivery,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryStartOperationPackage,
  type DeliveryPlanningReference,
} from "./delivery-operation-execution.js";
import {
  formDeliveryStartContentCompletion,
  readStartFacts,
  readStartManifest,
  validStartManifest,
  type DeliveryStartContentCompletion,
} from "../internal/delivery-start-content.js";
export type { DeliveryStartContentCompletion } from "../internal/delivery-start-content.js";

export interface DeliveryStartPreparationInput {
  readonly deliveryId: DeliveryId;
  readonly ownerAuthority: OwnerAuthorityFact;
  readonly planningReference: DeliveryPlanningReference;
}
function isPreparationInput(
  value: unknown,
): value is DeliveryStartPreparationInput {
  return (
    isPlainRecord(value) &&
    hasExactlyFields(value, [
      "deliveryId",
      "ownerAuthority",
      "planningReference",
    ]) &&
    isSemanticId(value.deliveryId) &&
    isDeliveryPlanningReference(value.planningReference) &&
    isDeliveryStartAuthorityForDelivery(value.ownerAuthority, value.deliveryId)
  );
}
export async function prepareDeliveryStartOperationPackage(
  repositoryRoot: unknown,
  input: unknown,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryStartOperationPackage | null> {
  if (typeof repositoryRoot !== "string" || !isPreparationInput(input))
    return null;
  const facts = await readStartFacts(
    repositoryRoot,
    input.deliveryId,
    input.planningReference,
  );
  const guidanceRef = await resolveDeliveryGuidanceRef(
    installation,
    "delivery-start",
  );
  if (facts === null || guidanceRef === null) return null;
  const formed = formDeliveryOperationPackage(
    input.deliveryId,
    "delivery-start",
    input.ownerAuthority,
    facts,
    guidanceRef,
  );
  return formed?.operationId === "delivery-start" ? formed : null;
}
export type DeliveryStartExecutionCallback = (input: {
  readonly operationPackage: DeliveryStartOperationPackage;
  readonly guidance: Buffer;
  /** Only fixed manifest output; host validates scope and performs create-once. */
  readonly writeManifest: (bytes: Uint8Array) => Promise<void>;
}) => unknown | Promise<unknown>;
export interface DeliveryStartInvocationFailure {
  readonly status: "failed";
  readonly reason: string;
  readonly mutationStatus: "not-written" | "written-unconfirmed" | "unknown";
  readonly contentCompletion: null;
}
export interface DeliveryStartInvocationTerminal {
  readonly status: "terminal";
  readonly operationPackage: DeliveryStartOperationPackage;
  readonly contentCompletion: DeliveryStartContentCompletion;
}
export type DeliveryStartInvocationOutcome =
  DeliveryStartInvocationFailure | DeliveryStartInvocationTerminal;

export async function invokeDeliveryStartOperation(
  repositoryRoot: unknown,
  input: unknown,
  executeSurface: DeliveryStartExecutionCallback,
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<DeliveryStartInvocationOutcome> {
  let mutationStatus: DeliveryStartInvocationFailure["mutationStatus"] =
    "not-written";
  const failure = (reason: string): DeliveryStartInvocationFailure => ({
    status: "failed",
    reason,
    mutationStatus,
    contentCompletion: null,
  });
  const operationPackage = await prepareDeliveryStartOperationPackage(
    repositoryRoot,
    input,
    installation,
  );
  if (operationPackage === null || typeof repositoryRoot !== "string")
    return failure("package-formation-rejected");
  const guidance = await readExactDeliveryGuidance(
    installation,
    operationPackage.guidanceRef,
  );
  if (guidance === null) return failure("guidance-drift-rejected");
  const revalidated = await prepareDeliveryStartOperationPackage(
    repositoryRoot,
    input,
    installation,
  );
  if (!isDeepStrictEqual(revalidated, operationPackage))
    return failure("start-prestate-drift");
  const facts = operationPackage.operationFacts;
  let before: Buffer | null;
  try {
    before = await readStartManifest(
      repositoryRoot,
      operationPackage.deliveryId,
    );
  } catch {
    return failure("start-prestate-unreadable");
  }
  const expectedPrestate = facts.coordinationPrestate.contentRef;
  if (
    before === null
      ? expectedPrestate !== null
      : expectedPrestate === null ||
        before.length !== expectedPrestate.bytes ||
        fullTestDigest(before) !== expectedPrestate.contentSha256
  )
    return failure("start-prestate-drift");
  let writtenBytes: Buffer | null = null;
  if (before === null) {
    if (typeof executeSurface !== "function") return failure("surface-missing");
    let written = false;
    try {
      const callbackPackage = structuredClone(operationPackage);
      const result = await executeSurface({
        operationPackage: callbackPackage,
        guidance: Buffer.from(guidance),
        writeManifest: async (bytes) => {
          const output =
            bytes instanceof Uint8Array ? Buffer.from(bytes) : null;
          if (
            written ||
            output === null ||
            !validStartManifest(
              output,
              facts.projectId,
              operationPackage.deliveryId,
              facts.planningReference,
            )
          )
            throw new Error("invalid or repeated manifest output");
          const current = await prepareDeliveryStartOperationPackage(
            repositoryRoot,
            input,
            installation,
          );
          if (!isDeepStrictEqual(current, operationPackage))
            throw new Error("start-prestate-drift");
          const parent = await fullTestPath(
            repositoryRoot,
            "openspec/delivery-groups",
          );
          const handle = await open(
            path.join(parent, operationPackage.deliveryId + ".yaml"),
            "wx",
          );
          mutationStatus = "written-unconfirmed";
          written = true;
          writtenBytes = output;
          try {
            await handle.writeFile(output);
            await handle.sync();
          } finally {
            await handle.close();
          }
        },
      });
      if (
        !isPlainRecord(result) ||
        !hasExactlyFields(result, ["status"]) ||
        result.status !== "ready"
      ) {
        throw new Error("surface-result-rejected");
      }
    } catch {
      try {
        const current = await readStartManifest(
          repositoryRoot,
          operationPackage.deliveryId,
        );
        if (current !== null) mutationStatus = "written-unconfirmed";
      } catch {
        mutationStatus = "unknown";
      }
      return failure("surface-execution-failed");
    }
  }
  const contentCompletion = await formDeliveryStartContentCompletion(
    repositoryRoot,
    operationPackage.deliveryId,
    facts,
  );
  if (contentCompletion === null) return failure("content-validation-failed");
  try {
    const expectedBytes = before ?? writtenBytes;
    if (
      expectedBytes === null ||
      !expectedBytes.equals(
        (await readStartManifest(
          repositoryRoot,
          operationPackage.deliveryId,
        )) ?? Buffer.alloc(0),
      )
    ) {
      return failure("start-prestate-drift");
    }
  } catch {
    return failure("start-readback-unavailable");
  }
  return { status: "terminal", operationPackage, contentCompletion };
}
