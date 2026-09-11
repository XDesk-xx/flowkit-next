import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import { contextFixture } from "./action-context-fixture.js";

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
  const result = await runSourceCli(["action", "--input", "missing.json"]);
  assert.equal(result.code, 2);
  assert.deepEqual(JSON.parse(result.stdout), {
    kind: "error",
    error: { kind: "invalid-command" },
  });
});

test("entrypoint distinguishes malformed JSON, obsolete selectors and formal Policy blocked", async () => {
  const f = await contextFixture();
  try {
    const requestPath = path.join(f.root, "request.json");
    await writeFile(requestPath, "{");
    const malformed = await runSourceCli(["next", "--input", requestPath]);
    assert.equal(malformed.code, 2);
    assert.equal(
      JSON.parse(malformed.stdout).error.kind,
      "invalid-request-json",
    );
    const request = {
      repositoryRoot: f.repositoryRoot,
      flowkitHome: f.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    await writeFile(
      requestPath,
      JSON.stringify({ ...request, currentRunId: null }),
    );
    const old = await runSourceCli(["next", "--input", requestPath]);
    assert.equal(old.code, 2);
    assert.equal(JSON.parse(old.stdout).error.kind, "invalid-request");
    assert.match(JSON.parse(old.stdout).error.message, /currentRunId/);
    await f.manifest("delivery-one", "change-one", "planned");
    await writeFile(requestPath, JSON.stringify(request));
    const blocked = await runSourceCli(["next", "--input", requestPath]);
    assert.equal(blocked.code, 0);
    assert.deepEqual(JSON.parse(blocked.stdout), {
      kind: "next",
      decision: { kind: "blocked", reason: "change-not-active" },
      checkpoint: { authorized: false, reason: "policy-not-ready" },
    });
    await writeFile(
      requestPath,
      JSON.stringify({ ...request, changeId: "missing" }),
    );
    const missing = await runSourceCli(["status", "--input", requestPath]);
    assert.equal(missing.code, 2);
    assert.equal(JSON.parse(missing.stdout).error.kind, "context-missing");
  } finally {
    await f.cleanup();
  }
});
