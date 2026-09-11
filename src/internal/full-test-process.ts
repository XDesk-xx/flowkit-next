import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import {
  fullTestPath,
  fullTestHash,
  resolveFullTestProgram,
  type FullTestCheck,
} from "./full-test-input.js";
import { readFullTestToolMaterial } from "./full-test-tool.js";
import {
  ensureFullTestDirectory,
  fullTestArtifact,
  saveFullTestJson,
} from "./full-test-storage.js";
import type { EvidenceArtifactRef } from "./delivery-required-evidence.js";

export interface FullTestCheckResult {
  readonly checkId: string;
  readonly checkRef: string;
  readonly status: "passed" | "failed" | "process-failed" | "not-executed";
  readonly reason: string | null;
  readonly command: EvidenceArtifactRef | null;
}
export async function executeFullTestCheck(
  root: string,
  attempt: string,
  check: FullTestCheck,
): Promise<FullTestCheckResult> {
  const relative = attempt + "/checks/" + check.checkId;
  const output = await ensureFullTestDirectory(root, relative, true);
  const cwd = await fullTestPath(root, check.cwd);
  const executable = await resolveFullTestProgram(cwd, check.program);
  if (
    fullTestHash(
      "full-test-tool",
      await readFullTestToolMaterial(executable, cwd, check.args),
    ) !== check.toolRef
  )
    throw new Error("executable drift");
  const stdout = await fs.open(path.join(output, "stdout.txt"), "wx");
  let stderr;
  try {
    stderr = await fs.open(path.join(output, "stderr.txt"), "wx");
  } catch (error) {
    await stdout.close();
    throw error;
  }
  const startedAt = new Date().toISOString();
  let processError: string | null = null;
  let saveError: unknown = null;
  let exitCode: number | null = null;
  let signal: string | null = null;
  try {
    const child = spawn(executable, [...check.args], {
      cwd,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const closed = new Promise<void>((resolve) => {
      child.on("error", (error) => {
        processError = error.message;
      });
      child.on("close", (code, terminated) => {
        exitCode = code;
        signal = terminated;
        resolve();
      });
    });
    async function collect(
      stream: AsyncIterable<Buffer>,
      handle: fs.FileHandle,
    ) {
      try {
        for await (const bytes of stream) await handle.writeFile(bytes);
        await handle.sync();
      } catch (error) {
        saveError = error;
        child.kill();
      }
    }
    await Promise.all([
      closed,
      collect(child.stdout, stdout),
      collect(child.stderr, stderr),
    ]);
  } catch (error) {
    processError = error instanceof Error ? error.message : String(error);
  } finally {
    await stdout.close();
    await stderr.close();
  }
  if (saveError !== null) throw new Error("raw stream persistence failed");
  const status =
    processError !== null || signal !== null || exitCode === null
      ? "process-failed"
      : exitCode === 0
        ? "passed"
        : "failed";
  const command = await saveFullTestJson(root, relative + "/command.json", {
    checkId: check.checkId,
    checkRef: check.checkRef,
    program: executable,
    args: check.args,
    cwd: check.cwd,
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode,
    signal,
    processError,
    saveError: null,
    stdout: await fullTestArtifact(root, relative + "/stdout.txt"),
    stderr: await fullTestArtifact(root, relative + "/stderr.txt"),
  });
  return {
    checkId: check.checkId,
    checkRef: check.checkRef,
    status,
    reason: processError,
    command,
  };
}
