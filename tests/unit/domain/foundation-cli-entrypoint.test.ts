import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

    const deliveryDir = path.join(root, "openspec", "delivery-groups");
    await mkdir(deliveryDir, { recursive: true });
    await writeFile(
      path.join(deliveryDir, "delivery-one.yaml"),
      "id: delivery-one\nchanges:\n  - id: cli-change\n    state: planned\n    dependsOn: []\nownerDecisions: []\n",
    );

    const blocked = path.join(root, "blocked.json");
    await writeFile(
      blocked,
      JSON.stringify({
        repositoryRoot: root,
        deliveryId: "delivery-one",
        changeId: "cli-change",
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

    const untrusted = path.join(root, "untrusted.json");
    await writeFile(
      untrusted,
      JSON.stringify({
        repositoryRoot: path.join(root, "missing-repository"),
        deliveryId: "delivery-one",
        changeId: "cli-change",
        changeStartSequence: 100,
        currentRunId: null,
        flowkitHome: root,
      }),
    );
    const untrustedResult = await runSourceCli(["next", "--input", untrusted]);
    assert.equal(untrustedResult.code, 2);
    assert.deepEqual(JSON.parse(untrustedResult.stdout), {
      kind: "error",
      error: { kind: "coordination-resolution-failed" },
    });

    const untrustedStatus = path.join(root, "untrusted-status.json");
    await writeFile(
      untrustedStatus,
      JSON.stringify({
        repositoryRoot: path.join(root, "missing-repository"),
        deliveryId: "delivery-one",
        changeId: "cli-change",
        changeStartSequence: 100,
        currentRunId: "20260828-101-apply",
        flowkitHome: root,
      }),
    );
    const untrustedStatusResult = await runSourceCli([
      "status",
      "--input",
      untrustedStatus,
    ]);
    assert.equal(untrustedStatusResult.code, 2);
    assert.deepEqual(JSON.parse(untrustedStatusResult.stdout), {
      kind: "error",
      error: { kind: "coordination-resolution-failed" },
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
