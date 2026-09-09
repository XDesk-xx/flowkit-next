import { readFile, readdir, lstat } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { parse } from "yaml";
import { isSemanticId } from "../domain/identity.js";
import type {
  DeliveryPlanningReference,
  DeliveryStartOperationFacts,
} from "../domain/delivery-operation-execution.js";
import type { DeliveryCoordinationRef } from "../domain/delivery-final-operation.js";
import { isPlainRecord } from "./applicable-check-identity.js";
import { fullTestPath, fullTestDigest } from "./full-test-input.js";

export interface DeliveryStartContentCompletion {
  readonly projectId: string;
  readonly deliveryId: string;
  readonly planningReference: DeliveryPlanningReference;
  readonly coordinationRef: DeliveryCoordinationRef;
}
export async function readStartProjectId(root: string): Promise<string> {
  const project: unknown = JSON.parse(
    await readFile(await fullTestPath(root, ".flowkit/project.json"), "utf8"),
  );
  if (!isPlainRecord(project) || !isSemanticId(project.projectId))
    throw new Error("invalid project");
  return project.projectId;
}
export async function readStartManifest(
  root: string,
  deliveryId: string,
): Promise<Buffer | null> {
  const parent = await fullTestPath(root, "openspec/delivery-groups");
  const target = path.join(parent, deliveryId + ".yaml");
  try {
    await lstat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  return readFile(
    await fullTestPath(
      root,
      "openspec/delivery-groups/" + deliveryId + ".yaml",
    ),
  );
}
function coordinationRef(
  deliveryId: string,
  bytes: Buffer,
): DeliveryCoordinationRef {
  return {
    artifact: "openspec/delivery-groups/" + deliveryId + ".yaml",
    contentSha256: fullTestDigest(bytes),
    bytes: bytes.length,
  };
}
export function validStartManifest(
  bytes: Buffer,
  projectId: string,
  deliveryId: string,
  planningReference: DeliveryPlanningReference,
): boolean {
  try {
    const doc: unknown = parse(bytes.toString("utf8"));
    if (
      !isPlainRecord(doc) ||
      doc.id !== deliveryId ||
      doc.projectId !== projectId ||
      !isDeepStrictEqual(doc.planningReference, planningReference) ||
      !isPlainRecord(doc.delivery) ||
      doc.delivery.state !== "active" ||
      doc.delivery.fullTestStatus !== "pending" ||
      doc.delivery.finalizationStatus !== "pending" ||
      Object.hasOwn(doc, "finalization") ||
      !Array.isArray(doc.changes) ||
      !doc.changes.length
    )
      return false;
    const ids = new Set<string>();
    for (const change of doc.changes) {
      if (
        !isPlainRecord(change) ||
        !isSemanticId(change.id) ||
        ids.has(change.id) ||
        typeof change.required !== "boolean" ||
        change.state !== "planned"
      )
        return false;
      ids.add(change.id);
    }
    return true;
  } catch {
    return false;
  }
}
export async function readStartFacts(
  root: string,
  deliveryId: string,
  planningReference: DeliveryPlanningReference,
): Promise<DeliveryStartOperationFacts | null> {
  try {
    const projectId = await readStartProjectId(root);
    const planning = await readFile(
      await fullTestPath(root, planningReference.artifact),
    );
    if (fullTestDigest(planning) !== planningReference.contentSha256)
      return null;
    const directory = await fullTestPath(root, "openspec/delivery-groups");
    for (const name of await readdir(directory)) {
      if (!name.endsWith(".yaml") || name === deliveryId + ".yaml") continue;
      const other: unknown = parse(
        await readFile(
          await fullTestPath(root, "openspec/delivery-groups/" + name),
          "utf8",
        ),
      );
      if (!isPlainRecord(other) || !isPlainRecord(other.delivery)) return null;
      if (other.delivery.state === "active") return null;
    }
    const bytes = await readStartManifest(root, deliveryId);
    if (
      bytes !== null &&
      !validStartManifest(bytes, projectId, deliveryId, planningReference)
    )
      return null;
    return {
      projectId,
      planningReference: { ...planningReference },
      coordinationPrestate: {
        artifact: "openspec/delivery-groups/" + deliveryId + ".yaml",
        contentRef: bytes === null ? null : coordinationRef(deliveryId, bytes),
      },
    };
  } catch {
    return null;
  }
}
export async function formDeliveryStartContentCompletion(
  root: string,
  deliveryId: string,
  expected: DeliveryStartOperationFacts,
): Promise<DeliveryStartContentCompletion | null> {
  const facts = await readStartFacts(
    root,
    deliveryId,
    expected.planningReference,
  );
  if (
    facts === null ||
    facts.projectId !== expected.projectId ||
    facts.coordinationPrestate.contentRef === null
  )
    return null;
  const second = await readStartFacts(
    root,
    deliveryId,
    expected.planningReference,
  );
  if (!isDeepStrictEqual(second, facts)) return null;
  return {
    projectId: facts.projectId,
    deliveryId,
    planningReference: { ...facts.planningReference },
    coordinationRef: { ...facts.coordinationPrestate.contentRef },
  };
}
