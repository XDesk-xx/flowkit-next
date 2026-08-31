import { createHash } from "node:crypto";

const SHA_REF_PATTERN =
  /^(candidate|check|execution|action-package):sha256:[0-9a-f]{64}$/;

export function isPlainRecord(
  value: unknown,
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function hasExactlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === fields.length &&
    fields.every((field) => Object.hasOwn(value, field))
  );
}

export function isSafeText(
  value: unknown,
  allowEmpty = false,
): value is string {
  return (
    typeof value === "string" &&
    (allowEmpty || value.length > 0) &&
    !value.includes("\0")
  );
}

export function isMaterialRef(value: unknown): value is string {
  if (!isSafeText(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) return false;
  }
  return true;
}

export function isHashRef(value: unknown, prefix: string): value is string {
  return (
    typeof value === "string" &&
    SHA_REF_PATTERN.test(value) &&
    value.startsWith(`${prefix}:sha256:`)
  );
}

export function hasNoDuplicates(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export function isMaterialRefArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every(isMaterialRef) && hasNoDuplicates(value)
  );
}

export function isArgumentArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => isSafeText(item, true));
}

export function canonicalRefs(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function isCanonicalRefSet(values: readonly string[]): boolean {
  if (!hasNoDuplicates(values)) return false;
  return values.every(
    (value, index) => index === 0 || values[index - 1].localeCompare(value) < 0,
  );
}

export function hashReference(
  prefix: string,
  domain: string,
  value: unknown,
): string {
  const digest = createHash("sha256")
    .update(domain)
    .update("\0")
    .update(JSON.stringify(value))
    .digest("hex");
  return `${prefix}:sha256:${digest}`;
}
