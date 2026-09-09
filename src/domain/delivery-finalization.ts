import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import {
  hasExactlyFields,
  hashReference,
  isPlainRecord,
} from "../internal/applicable-check-identity.js";
import { fullTestPath, isFullTestRef } from "../internal/full-test-input.js";
import { isAttemptId } from "../internal/full-test-storage.js";
import { isOwnerAuthorityRef } from "./authority.js";
import { isSemanticId } from "./identity.js";

export interface DeliveryFinalizationLinks {
  readonly projectId: string;
  readonly deliveryId: string;
  readonly ownerAuthorityRef: string;
  readonly sourceRef: string;
  readonly fullTestAttempt: string;
  readonly verifiedCandidateRef: string;
  readonly fullTestExecutionRef: string;
}

export interface DeliveryFinalizationRecord extends DeliveryFinalizationLinks {
  readonly deliveryFinalizationRef: string;
}

const LINK_FIELDS = [
  "projectId",
  "deliveryId",
  "ownerAuthorityRef",
  "sourceRef",
  "fullTestAttempt",
  "verifiedCandidateRef",
  "fullTestExecutionRef",
] as const;

function validLinks(value: Record<string, unknown>): boolean {
  return (
    isSemanticId(value.projectId) &&
    isSemanticId(value.deliveryId) &&
    isOwnerAuthorityRef(value.ownerAuthorityRef) &&
    typeof value.sourceRef === "string" &&
    /^[!-~]{1,512}$/.test(value.sourceRef) &&
    isAttemptId(value.fullTestAttempt) &&
    isFullTestRef(value.verifiedCandidateRef, "full-test-input") &&
    typeof value.fullTestExecutionRef === "string" &&
    /^full-test-execution:sha256:[0-9a-f]{64}$/.test(value.fullTestExecutionRef)
  );
}

export function deriveDeliveryFinalizationRef(value: unknown): string | null {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, LINK_FIELDS) ||
    !validLinks(value)
  )
    return null;
  return hashReference(
    "delivery-finalization",
    "flowkit-delivery-finalization",
    Object.fromEntries(LINK_FIELDS.map((field) => [field, value[field]])),
  );
}

export function isDeliveryFinalizationRecord(
  value: unknown,
): value is DeliveryFinalizationRecord {
  if (
    !isPlainRecord(value) ||
    !hasExactlyFields(value, [...LINK_FIELDS, "deliveryFinalizationRef"])
  )
    return false;
  const links = Object.fromEntries(LINK_FIELDS.map((key) => [key, value[key]]));
  const ref = deriveDeliveryFinalizationRef(links);
  return ref !== null && value.deliveryFinalizationRef === ref;
}

export type DeliveryFinalizationObservation =
  | {
      readonly status: "completed";
      readonly record: DeliveryFinalizationRecord;
    }
  | {
      readonly status: "not-completed" | "unconfirmed";
      readonly record: null;
      readonly reason: string;
    };

/** Recognition of the published commit point, not new verification or authority. */
export async function readDeliveryFinalization(
  repositoryRoot: string,
  deliveryId: string,
): Promise<DeliveryFinalizationObservation> {
  const unconfirmed = (reason: string): DeliveryFinalizationObservation => ({
    status: "unconfirmed",
    record: null,
    reason,
  });
  if (!isSemanticId(deliveryId)) return unconfirmed("invalid-delivery-id");
  try {
    const manifestPath = await fullTestPath(
      repositoryRoot,
      `openspec/delivery-groups/${deliveryId}.yaml`,
    );
    const original = await readFile(manifestPath);
    const manifest: unknown = parse(original.toString("utf8"));
    if (
      !isPlainRecord(manifest) ||
      manifest.id !== deliveryId ||
      !isPlainRecord(manifest.delivery)
    )
      return unconfirmed("invalid-coordination");
    const delivery = manifest.delivery;
    if (
      delivery.state !== "completed" &&
      delivery.finalizationStatus !== "completed" &&
      !Object.hasOwn(manifest, "finalization")
    ) {
      return {
        status: "not-completed",
        record: null,
        reason: "final-not-entered",
      };
    }
    const finalization = manifest.finalization;
    if (
      delivery.state !== "completed" ||
      delivery.fullTestStatus !== "passed" ||
      delivery.finalizationStatus !== "completed" ||
      !isPlainRecord(finalization) ||
      !hasExactlyFields(finalization, [
        "state",
        "ownerAuthorityRef",
        "sourceRef",
        "fullTestAttempt",
        "verifiedCandidateRef",
        "fullTestExecutionRef",
        "confirmationRef",
      ]) ||
      finalization.state !== "completed" ||
      delivery.fullTestAttempt !== finalization.fullTestAttempt
    ) {
      return unconfirmed("inconsistent-finalization");
    }
    const project: unknown = JSON.parse(
      await readFile(
        await fullTestPath(repositoryRoot, ".flowkit/project.json"),
        "utf8",
      ),
    );
    if (!isPlainRecord(project)) return unconfirmed("project-unreadable");
    const links = {
      projectId: project.projectId,
      deliveryId,
      ownerAuthorityRef: finalization.ownerAuthorityRef,
      sourceRef: finalization.sourceRef,
      fullTestAttempt: finalization.fullTestAttempt,
      verifiedCandidateRef: finalization.verifiedCandidateRef,
      fullTestExecutionRef: finalization.fullTestExecutionRef,
    };
    const ref = deriveDeliveryFinalizationRef(links);
    const record = { ...links, deliveryFinalizationRef: ref };
    if (
      ref === null ||
      finalization.confirmationRef !== ref ||
      !isDeliveryFinalizationRecord(record)
    )
      return unconfirmed("confirmation-missing-or-mismatched");
    if (
      !(
        await readFile(
          await fullTestPath(
            repositoryRoot,
            `openspec/delivery-groups/${deliveryId}.yaml`,
          ),
        )
      ).equals(original)
    ) {
      return unconfirmed("coordination-drift");
    }
    return { status: "completed", record };
  } catch {
    return unconfirmed("related-material-unreadable");
  }
}
