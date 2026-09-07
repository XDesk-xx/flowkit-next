import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { resolveManagedTool } from "../domain/managed-tool-resolution.js";

const execFileAsync = promisify(execFile);

async function runManagedArchify(
  repositoryRoot: string,
  flowkitHome: string,
  args: readonly string[],
): Promise<boolean> {
  try {
    const resolved = await resolveManagedTool({
      repositoryRoot,
      flowkitHome,
      toolId: "archify",
    });
    await execFileAsync(process.execPath, [resolved.entrypoint, ...args], {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

export async function validateArchitectureFinalizationWithManagedArchify(
  repositoryRoot: string,
  flowkitHome: string,
  stagingRoot: string,
  currentPath: string,
  plannedPath: string,
  actualPath: string,
  workflowPath: string,
  lifecyclePath: string,
  dataFlowPath: string,
): Promise<boolean> {
  const validations: readonly [string, string][] = [
    ["architecture", actualPath],
    ["workflow", workflowPath],
    ["lifecycle", lifecyclePath],
    ["dataflow", dataFlowPath],
  ];
  for (const [type, artifact] of validations) {
    if (
      !(await runManagedArchify(repositoryRoot, flowkitHome, [
        "validate",
        type,
        artifact,
        "--quality",
        "showcase",
        "--json",
        "--repo-root",
        repositoryRoot,
      ]))
    ) {
      return false;
    }
  }

  for (const [label, leftPath] of [
    ["current", currentPath],
    ["planned", plannedPath],
  ] as const) {
    if (
      !(await runManagedArchify(repositoryRoot, flowkitHome, [
        "compare",
        "architecture",
        leftPath,
        actualPath,
        path.join(stagingRoot, `${label}-to-actual.html`),
        "--receipt",
        path.join(stagingRoot, `${label}-to-actual.archify-receipt.json`),
        "--json",
        "--quality",
        "showcase",
        "--repo-root",
        repositoryRoot,
      ]))
    ) {
      return false;
    }
  }
  return true;
}
