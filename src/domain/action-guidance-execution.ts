import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { isStandardActionId, type StandardActionId } from "./identity.js";

export interface ActionGuidanceRef {
  readonly path: string;
  readonly contentSha256: string;
}

const GUIDANCE_REF_FIELDS = ["path", "contentSha256"] as const;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function hasExactlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === fields.length &&
    fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
  );
}

export function canonicalActionGuidancePath(actionId: unknown): string | null {
  if (!isStandardActionId(actionId)) return null;
  return `skills/actions/${actionId}/SKILL.md`;
}

function actionIdFromCanonicalGuidancePath(
  value: unknown,
): StandardActionId | null {
  if (typeof value !== "string") return null;
  const match = /^skills\/actions\/([^/]+)\/SKILL\.md$/.exec(value);
  if (match === null || !isStandardActionId(match[1])) return null;
  return canonicalActionGuidancePath(match[1]) === value ? match[1] : null;
}

export function isActionGuidanceRef(
  value: unknown,
): value is ActionGuidanceRef {
  if (!isRecord(value) || !hasExactlyFields(value, GUIDANCE_REF_FIELDS)) {
    return false;
  }
  return (
    actionIdFromCanonicalGuidancePath(value.path) !== null &&
    typeof value.contentSha256 === "string" &&
    SHA256_HEX_PATTERN.test(value.contentSha256)
  );
}

export function isActionGuidanceRefForAction(
  value: unknown,
  actionId: unknown,
): value is ActionGuidanceRef {
  const expectedPath = canonicalActionGuidancePath(actionId);
  return (
    expectedPath !== null &&
    isActionGuidanceRef(value) &&
    value.path === expectedPath
  );
}

export async function resolveActionGuidanceRef(
  repositoryRoot: unknown,
  actionId: unknown,
): Promise<ActionGuidanceRef | null> {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    return null;
  }

  const relativePath = canonicalActionGuidancePath(actionId);
  if (relativePath === null) return null;

  try {
    const canonicalRoot = await realpath(repositoryRoot);
    const expectedPath = path.join(canonicalRoot, ...relativePath.split("/"));
    const entry = await lstat(expectedPath);
    if (!entry.isFile() || entry.isSymbolicLink()) return null;

    const resolvedPath = await realpath(expectedPath);
    if (resolvedPath !== expectedPath) return null;

    const bytes = await readFile(expectedPath);
    return {
      path: relativePath,
      contentSha256: createHash("sha256").update(bytes).digest("hex"),
    };
  } catch {
    return null;
  }
}
