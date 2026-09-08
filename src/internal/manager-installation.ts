import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Host-owned installation input, never supplied by target request JSON. */
export interface ManagerInstallation {
  readonly root: string;
  readonly name: string;
  readonly version: string;
}

export class ManagerInstallationError extends Error {
  readonly kind = "invalid-manager-installation";
}

export function isManagerInstallation(
  value: unknown,
): value is ManagerInstallation {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<ManagerInstallation>;
  return (
    typeof item.root === "string" &&
    path.isAbsolute(item.root) &&
    typeof item.name === "string" &&
    item.name.length > 0 &&
    typeof item.version === "string" &&
    item.version.length > 0
  );
}

/** The optional root is a trusted host/test seam, not a discovery input. */
export function loadManagerInstallation(
  root: string = fileURLToPath(new URL("../../", import.meta.url)),
): ManagerInstallation {
  try {
    const canonicalRoot = realpathSync(root);
    const metadata: unknown = JSON.parse(
      readFileSync(path.join(canonicalRoot, "package.json"), "utf8"),
    );
    if (typeof metadata !== "object" || metadata === null) {
      throw new Error("package metadata must be an object");
    }
    const { name, version } = metadata as Record<string, unknown>;
    const installation = { root: canonicalRoot, name, version };
    if (!isManagerInstallation(installation)) {
      throw new Error("package name/version must be non-empty strings");
    }
    return Object.freeze(installation);
  } catch (cause) {
    throw new ManagerInstallationError(
      "Cannot load manager installation metadata",
      { cause },
    );
  }
}
