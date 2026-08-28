import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

interface ProcessResult {
  readonly code: number;
  readonly stdout: string;
}

async function runSourceCli(args: readonly string[]): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "src/cli/entrypoint.ts", ...args],
      { cwd: process.cwd(), shell: false, stdio: ["ignore", "pipe", "ignore"] },
    );
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === null) {
        reject(new Error("CLI did not exit normally"));
        return;
      }
      resolve({ code, stdout });
    });
  });
}

test("entrypoint returns machine error for unknown command", async () => {
  const result = await runSourceCli(["archive", "--input", "missing.json"]);
  assert.equal(result.code, 2);
  assert.deepEqual(JSON.parse(result.stdout), {
    kind: "error",
    error: { kind: "invalid-command" },
  });
});

test("entrypoint distinguishes malformed JSON and formal Policy blocked outcome", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-cli-entry-"));
  try {
    const malformed = path.join(root, "malformed.json");
    await writeFile(malformed, "{");
    const malformedResult = await runSourceCli(["next", "--input", malformed]);
    assert.equal(malformedResult.code, 2);
    assert.deepEqual(JSON.parse(malformedResult.stdout), {
      kind: "error",
      error: { kind: "invalid-request-json" },
    });

    const blocked = path.join(root, "blocked.json");
    await writeFile(
      blocked,
      JSON.stringify({
        repositoryRoot: root,
        deliveryId: "delivery-one",
        changeId: "cli-change",
        changeState: "planned",
        changeStartSequence: 100,
        currentRunId: null,
        flowkitHome: root,
      }),
    );
    const blockedResult = await runSourceCli(["next", "--input", blocked]);
    assert.equal(blockedResult.code, 0);
    assert.deepEqual(JSON.parse(blockedResult.stdout), {
      kind: "next",
      decision: { kind: "blocked", reason: "change-not-active" },
      checkpoint: { authorized: false, reason: "policy-not-ready" },
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
