import { mkdir, open, readFile, realpath, lstat } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import { observeOpenSpecActiveChanges } from "../domain/openspec-observation.js";

export type ProjectInitResult =
  | {
      readonly status: "completed";
      readonly effect: "created" | "reused";
      readonly project: ProjectIdentity;
    }
  | {
      readonly status: "incomplete";
      readonly effect: "none" | "unknown";
      readonly reason: string;
    };

interface ProjectIdentity {
  readonly formatVersion: 1;
  readonly projectId: string;
  readonly repository: string;
  readonly runtimeFamily: string;
  readonly state: "initialized";
}

export async function initializeProject(
  request: Record<string, unknown>,
  installation: ManagerInstallation,
): Promise<ProjectInitResult> {
  const root = request.repositoryRoot as string;
  const project: ProjectIdentity = {
    formatVersion: 1,
    projectId: request.projectId as string,
    repository: request.repository as string,
    runtimeFamily: request.runtimeFamily as string,
    state: "initialized",
  };
  let effect: "none" | "unknown" = "none";
  try {
    const canonicalRoot = await realpath(root);
    const openspec = path.join(canonicalRoot, "openspec");
    if (
      !(await lstat(openspec)).isDirectory() ||
      !(await lstat(path.join(openspec, "config.yaml"))).isFile()
    )
      throw new Error("openspec-root-invalid");
    await observeOpenSpecActiveChanges({
      repositoryRoot: canonicalRoot,
      flowkitHome: request.flowkitHome as string,
      installation,
    });
    const directory = path.join(canonicalRoot, ".flowkit");
    try {
      await mkdir(directory);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    if (
      !(await lstat(directory)).isDirectory() ||
      (await realpath(directory)) !== directory
    )
      throw new Error("project-directory-invalid");
    const target = path.join(directory, "project.json");
    const bytes = Buffer.from(JSON.stringify(project, null, 2) + "\n");
    try {
      const handle = await open(target, "wx");
      effect = "unknown";
      try {
        await handle.writeFile(bytes);
        await handle.sync();
      } finally {
        await handle.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existing: unknown = JSON.parse(await readFile(target, "utf8"));
      if (!isDeepStrictEqual(existing, project))
        throw new Error("project-identity-conflict");
      return { status: "completed", effect: "reused", project };
    }
    if (
      !(await lstat(target)).isFile() ||
      !(await readFile(target)).equals(bytes)
    )
      throw new Error("project-readback-failed");
    return { status: "completed", effect: "created", project };
  } catch (error) {
    return {
      status: "incomplete",
      effect,
      reason: error instanceof Error ? error.message : "project-init-failed",
    };
  }
}
