import { readFile } from "node:fs/promises";
import { stringify } from "yaml";
import { createHash } from "node:crypto";
import { isOwnerAuthorityFact } from "../domain/authority.js";
import { isSemanticId } from "../domain/identity.js";
import { invokeDeliveryStartOperation } from "../domain/delivery-start-execution.js";
import {
  readStartManifest,
  readStartProjectId,
} from "../internal/delivery-start-content.js";
import { fullTestPath } from "../internal/full-test-input.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";

function data(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("manifest-data-invalid");
  return value as Record<string, unknown>;
}
function only(value: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(value).some((key) => !keys.includes(key)))
    throw new Error("manifest-field-invalid");
}
function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonempty);
}

function makeManifest(
  raw: unknown,
  projectId: string,
  deliveryId: string,
  planningReference: { artifact: string; contentSha256: string },
  ownerAuthority: unknown,
): Record<string, unknown> {
  const value = data(raw);
  only(value, [
    "createdAt",
    "branch",
    "base",
    "goal",
    "changes",
    "reference",
    "scope",
    "bootstrap",
  ]);
  for (const key of ["createdAt", "branch", "base", "goal"])
    if (!nonempty(value[key])) throw new Error(`manifest-${key}-invalid`);
  if (!Array.isArray(value.changes) || !value.changes.length)
    throw new Error("manifest-changes-invalid");
  const ids = new Set<string>();
  const changes = value.changes.map((rawChange: unknown) => {
    const change = data(rawChange);
    only(change, ["id", "group", "goal", "required", "dependsOn"]);
    if (
      !isSemanticId(change.id) ||
      ids.has(change.id) ||
      !nonempty(change.goal) ||
      typeof change.required !== "boolean" ||
      !Array.isArray(change.dependsOn) ||
      !change.dependsOn.every(isSemanticId) ||
      new Set(change.dependsOn).size !== change.dependsOn.length ||
      (change.group !== undefined && !isSemanticId(change.group))
    )
      throw new Error("manifest-change-invalid");
    ids.add(change.id);
    return {
      id: change.id,
      ...(change.group ? { group: change.group } : {}),
      goal: change.goal,
      required: change.required,
      dependsOn: change.dependsOn,
      state: "planned",
    };
  });
  for (const change of changes)
    if (change.dependsOn.some((id: string) => !ids.has(id) || id === change.id))
      throw new Error("manifest-dependency-invalid");
  let reference: Record<string, unknown> | undefined;
  if (value.reference !== undefined) {
    reference = data(value.reference);
    only(reference, ["kind", "artifact"]);
    if (!nonempty(reference.kind) || !nonempty(reference.artifact))
      throw new Error("manifest-reference-invalid");
  }
  let scope: Record<string, unknown> | undefined;
  if (value.scope !== undefined) {
    scope = data(value.scope);
    only(scope, ["included", "excluded"]);
    if (!strings(scope.included) || !strings(scope.excluded))
      throw new Error("manifest-scope-invalid");
  }
  let bootstrap: Record<string, unknown> | undefined;
  if (value.bootstrap !== undefined) {
    bootstrap = data(value.bootstrap);
    only(bootstrap, [
      "mode",
      "stableSourceCommit",
      "managerPackageSha256",
      "note",
    ]);
    if (
      !nonempty(bootstrap.mode) ||
      !nonempty(bootstrap.note) ||
      (bootstrap.stableSourceCommit !== undefined &&
        !nonempty(bootstrap.stableSourceCommit)) ||
      (bootstrap.managerPackageSha256 !== undefined &&
        !nonempty(bootstrap.managerPackageSha256))
    )
      throw new Error("manifest-bootstrap-invalid");
  }
  return {
    id: deliveryId,
    projectId,
    createdAt: value.createdAt,
    branch: value.branch,
    base: value.base,
    goal: value.goal,
    planningReference,
    delivery: {
      state: "active",
      fullTestStatus: "pending",
      finalizationStatus: "pending",
    },
    changes,
    ownerDecisions: [ownerAuthority],
    ...(reference ? { reference } : {}),
    ...(scope ? { scope } : {}),
    ...(bootstrap ? { bootstrap } : {}),
  };
}

export async function startDelivery(
  request: Record<string, unknown>,
  installation: ManagerInstallation,
): Promise<Record<string, unknown>> {
  const root = request.repositoryRoot as string;
  const deliveryId = request.deliveryId as string;
  const ownerAuthority = request.ownerAuthority;
  try {
    if (
      !isOwnerAuthorityFact(ownerAuthority) ||
      ownerAuthority.deliveryId !== deliveryId ||
      ownerAuthority.changeId !== undefined ||
      ownerAuthority.decision !== "create-delivery" ||
      !ownerAuthority.scope.includes("delivery-start")
    )
      throw new Error("start-authority-invalid");
    const planningInput = data(request.planningReference);
    only(planningInput, ["artifact"]);
    if (
      !nonempty(planningInput.artifact) ||
      !/^[A-Za-z0-9_./-]+\.md$/.test(planningInput.artifact) ||
      planningInput.artifact
        .split("/")
        .some((part: string) => !part || part === "." || part === "..")
    )
      throw new Error("planning-artifact-invalid");
    const artifact = planningInput.artifact;
    const planningBytes = await readFile(await fullTestPath(root, artifact));
    const planningReference = {
      artifact,
      contentSha256: createHash("sha256").update(planningBytes).digest("hex"),
    };
    const projectId = await readStartProjectId(root);
    const manifest = makeManifest(
      request.manifest,
      projectId,
      deliveryId,
      planningReference,
      ownerAuthority,
    );
    const bytes = Buffer.from(
      stringify(manifest, { sortMapEntries: true, lineWidth: 0 }),
    );
    const existing = await readStartManifest(root, deliveryId);
    if (existing !== null && !existing.equals(bytes))
      throw new Error("start-manifest-conflict");
    const outcome = await invokeDeliveryStartOperation(
      root,
      { deliveryId, ownerAuthority, planningReference },
      async ({ writeManifest }) => {
        await writeManifest(bytes);
        return { status: "ready" };
      },
      installation,
    );
    if (outcome.status === "terminal") {
      if (!(await readStartManifest(root, deliveryId))?.equals(bytes))
        throw new Error("start-manifest-conflict");
      return {
        status: "completed",
        effect: "confirmed",
        completion: outcome.contentCompletion,
      };
    }
    return {
      status: "incomplete",
      effect: outcome.mutationStatus,
      reason: outcome.reason,
    };
  } catch (error) {
    return {
      status: "incomplete",
      effect: "none",
      reason: error instanceof Error ? error.message : "delivery-start-failed",
    };
  }
}
