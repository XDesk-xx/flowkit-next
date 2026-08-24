import {
  isSemanticId,
  type ChangeId,
  type DeliveryId,
  type SemanticId,
} from "./identity.js";

export const ACTOR_ROLES = ["owner", "author", "reviewer"] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

export const ACTION_EXECUTION_ROLES = ["author", "reviewer"] as const;
export type ActionExecutionRole = (typeof ACTION_EXECUTION_ROLES)[number];

export const AUTHORITY_SOURCES = [
  "owner",
  "author",
  "reviewer",
  "verification",
] as const;
export type AuthoritySource = (typeof AUTHORITY_SOURCES)[number];

export function isActorRole(value: unknown): value is ActorRole {
  return (
    typeof value === "string" &&
    (ACTOR_ROLES as readonly string[]).includes(value)
  );
}

export function isActionExecutionRole(
  value: unknown,
): value is ActionExecutionRole {
  return (
    typeof value === "string" &&
    (ACTION_EXECUTION_ROLES as readonly string[]).includes(value)
  );
}

export function isAuthoritySource(value: unknown): value is AuthoritySource {
  return (
    typeof value === "string" &&
    (AUTHORITY_SOURCES as readonly string[]).includes(value)
  );
}

export interface OwnerAuthorityFact {
  readonly ref: string;
  readonly decision: SemanticId;
  readonly deliveryId: DeliveryId;
  readonly changeId?: ChangeId;
  readonly sourceRef: string;
  readonly scope: readonly SemanticId[];
}

const OWNER_REF_PATTERN = /^owner:[0-9a-f]{64}$/;
const SOURCE_REF_PATTERN = /^[!-~]{1,512}$/;
const REQUIRED_FIELDS = [
  "ref",
  "decision",
  "deliveryId",
  "sourceRef",
  "scope",
] as const;
const ALLOWED_FIELDS = new Set([...REQUIRED_FIELDS, "changeId"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isCanonicalScope(value: unknown): value is readonly SemanticId[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 32)
    return false;
  if (!value.every(isSemanticId)) return false;
  for (let index = 1; index < value.length; index += 1) {
    if (value[index - 1] >= value[index]) return false;
  }
  return true;
}

export function isOwnerAuthorityFact(
  value: unknown,
): value is OwnerAuthorityFact {
  if (!isPlainObject(value)) return false;

  const keys = Object.keys(value);
  if (keys.some((key) => !ALLOWED_FIELDS.has(key))) return false;
  if (REQUIRED_FIELDS.some((key) => !Object.hasOwn(value, key))) return false;

  if (typeof value.ref !== "string" || !OWNER_REF_PATTERN.test(value.ref))
    return false;
  if (!isSemanticId(value.decision) || !isSemanticId(value.deliveryId))
    return false;
  if (Object.hasOwn(value, "changeId") && !isSemanticId(value.changeId))
    return false;
  if (
    typeof value.sourceRef !== "string" ||
    !SOURCE_REF_PATTERN.test(value.sourceRef)
  )
    return false;
  if (!isCanonicalScope(value.scope)) return false;

  return true;
}

export function asOwnerAuthorityFact(
  value: unknown,
): OwnerAuthorityFact | null {
  return isOwnerAuthorityFact(value) ? value : null;
}

export function hasExplicitOwnerAuthorityFact(value: unknown): boolean {
  return isOwnerAuthorityFact(value);
}
