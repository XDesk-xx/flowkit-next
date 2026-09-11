import type { ManagerInstallation } from "../../../src/internal/manager-installation.js";

/** Explicit trusted fixture installation; never inferred by production from target. */
export function fixtureInstallation(root: unknown): ManagerInstallation {
  return {
    root: typeof root === "string" ? root : "",
    name: "flowkit-fixture",
    version: "0.0.0",
  };
}
