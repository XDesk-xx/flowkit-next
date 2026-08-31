import { spawn } from "node:child_process";

export type ApplicableCheckProcessStatus =
  "passed" | "failed" | "process-failed";

export interface ApplicableCheckProcessOutcome {
  readonly status: ApplicableCheckProcessStatus;
  readonly exitCode: number | null;
  readonly signal: string | null;
}

export async function executeExactApplicableCheckProcess(
  repositoryRoot: string,
  program: string,
  args: readonly string[],
): Promise<ApplicableCheckProcessOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    const child = spawn(program, [...args], {
      cwd: repositoryRoot,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "ignore", "ignore"],
    });
    child.once("error", () => {
      if (settled) return;
      settled = true;
      resolve({ status: "process-failed", exitCode: null, signal: null });
    });
    child.once("close", (code, signal) => {
      if (settled) return;
      settled = true;
      if (code === null || signal !== null) {
        resolve({ status: "process-failed", exitCode: null, signal });
        return;
      }
      resolve({
        status: code === 0 ? "passed" : "failed",
        exitCode: code,
        signal: null,
      });
    });
  });
}
