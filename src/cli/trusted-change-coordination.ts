import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";

import { isOwnerAuthorityFact } from "../domain/authority.js";
import {
  isSemanticId,
  type ChangeId,
  type DeliveryId,
} from "../domain/identity.js";
import { isChangeState, type ChangeState } from "../domain/state.js";

export type TrustedChangeCoordinationErrorKind =
  | "manifest-read-failed"
  | "manifest-invalid"
  | "delivery-identity-mismatch"
  | "change-not-found"
  | "change-duplicate"
  | "activation-provenance-missing"
  | "dependency-invalid"
  | "dependency-unsatisfied";

export class TrustedChangeCoordinationError extends Error {
  readonly kind: TrustedChangeCoordinationErrorKind;

  constructor(
    kind: TrustedChangeCoordinationErrorKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "TrustedChangeCoordinationError";
    this.kind = kind;
  }
}

interface ChangeEntry {
  readonly id: ChangeId;
  readonly state: ChangeState;
  readonly dependsOn: readonly ChangeId[];
}

interface CoordinationManifest {
  readonly id: DeliveryId;
  readonly changes: readonly ChangeEntry[];
  readonly ownerDecisions: readonly unknown[];
}

function fail(
  kind: TrustedChangeCoordinationErrorKind,
  message: string,
  cause?: unknown,
): never {
  throw new TrustedChangeCoordinationError(
    kind,
    message,
    cause === undefined ? undefined : { cause },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDependsOn(
  value: unknown,
  changeId: ChangeId,
): readonly ChangeId[] {
  if (!Array.isArray(value)) {
    fail("manifest-invalid", `dependsOn is invalid for Change ${changeId}`);
  }
  const ids: ChangeId[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    if (!isSemanticId(candidate) || seen.has(candidate)) {
      fail("dependency-invalid", `dependsOn is invalid for Change ${changeId}`);
    }
    seen.add(candidate);
    ids.push(candidate);
  }
  return Object.freeze(ids);
}

function parseChange(value: unknown): ChangeEntry {
  if (
    !isRecord(value) ||
    !isSemanticId(value.id) ||
    !isChangeState(value.state)
  ) {
    fail(
      "manifest-invalid",
      "Delivery manifest contains an invalid Change entry",
    );
  }
  return Object.freeze({
    id: value.id,
    state: value.state,
    dependsOn: parseDependsOn(value.dependsOn, value.id),
  });
}

function parseManifest(value: unknown): CoordinationManifest {
  if (
    !isRecord(value) ||
    !isSemanticId(value.id) ||
    !Array.isArray(value.changes)
  ) {
    fail("manifest-invalid", "Delivery manifest coordination shape is invalid");
  }
  if (
    Object.hasOwn(value, "ownerDecisions") &&
    !Array.isArray(value.ownerDecisions)
  ) {
    fail("manifest-invalid", "ownerDecisions must be an array when present");
  }
  return Object.freeze({
    id: value.id,
    changes: Object.freeze(value.changes.map(parseChange)),
    ownerDecisions: Object.freeze(
      Array.isArray(value.ownerDecisions) ? [...value.ownerDecisions] : [],
    ),
  });
}

async function readManifest(
  repositoryRoot: string,
  deliveryId: DeliveryId,
): Promise<CoordinationManifest> {
  const manifestPath = path.join(
    path.resolve(repositoryRoot),
    "openspec",
    "delivery-groups",
    `${deliveryId}.yaml`,
  );
  let text: string;
  try {
    text = await readFile(manifestPath, "utf8");
  } catch (error) {
    fail("manifest-read-failed", "Delivery manifest cannot be read", error);
  }
  let parsed: unknown;
  try {
    parsed = parse(text);
  } catch (error) {
    fail("manifest-invalid", "Delivery manifest YAML is invalid", error);
  }
  return parseManifest(parsed);
}

function findExactChange(
  manifest: CoordinationManifest,
  changeId: ChangeId,
): ChangeEntry {
  const matches = manifest.changes.filter((entry) => entry.id === changeId);
  if (matches.length === 0) {
    fail("change-not-found", "exact Change is missing from Delivery manifest");
  }
  if (matches.length !== 1) {
    fail("change-duplicate", "exact Change is duplicated in Delivery manifest");
  }
  return matches[0];
}

function requireCompletedDependencies(
  manifest: CoordinationManifest,
  change: ChangeEntry,
): void {
  for (const dependencyId of change.dependsOn) {
    const matches = manifest.changes.filter(
      (entry) => entry.id === dependencyId,
    );
    if (matches.length !== 1) {
      fail(
        "dependency-invalid",
        `dependency ${dependencyId} must resolve to exactly one Change`,
      );
    }
    if (matches[0].state !== "completed") {
      fail(
        "dependency-unsatisfied",
        `dependency ${dependencyId} is not completed`,
      );
    }
  }
}

function hasExactActivationProvenance(
  manifest: CoordinationManifest,
  deliveryId: DeliveryId,
  changeId: ChangeId,
): boolean {
  return manifest.ownerDecisions.some(
    (decision) =>
      isOwnerAuthorityFact(decision) &&
      decision.decision === "activate-change" &&
      decision.deliveryId === deliveryId &&
      decision.changeId === changeId &&
      decision.scope.length === 1 &&
      decision.scope[0] === "explore",
  );
}

export interface TrustedChangeCoordinationInput {
  readonly repositoryRoot: string;
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
}

export async function resolveTrustedChangeCoordination(
  input: TrustedChangeCoordinationInput,
): Promise<ChangeState> {
  const manifest = await readManifest(input.repositoryRoot, input.deliveryId);
  if (manifest.id !== input.deliveryId) {
    fail(
      "delivery-identity-mismatch",
      "Delivery manifest id does not match requested Delivery",
    );
  }
  const change = findExactChange(manifest, input.changeId);

  if (change.state !== "active") return change.state;

  requireCompletedDependencies(manifest, change);
  if (
    !hasExactActivationProvenance(manifest, input.deliveryId, input.changeId)
  ) {
    fail(
      "activation-provenance-missing",
      "active Change lacks exact Owner activation provenance",
    );
  }

  return change.state;
}
