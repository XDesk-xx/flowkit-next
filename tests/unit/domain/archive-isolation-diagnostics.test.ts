import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  archiveDiagnosticAttempt,
  runArchiveProcess,
} from "../../../src/internal/archive-process.js";
import { assertCandidateGitBytes } from "../../../src/internal/candidate-git-bytes.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

test("archive subprocess diagnostics preserve raw failure bytes, overflow prefix, missing command and timeout", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-diagnostics-"));
  try {
    await gitBytes(root, ["init"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/artifacts/** -text\n",
    );
    const attempt = await archiveDiagnosticAttempt(
      root,
      "delivery-one",
      "001-change-one",
      { trigger: "start", runId: null },
    );
    const raw = Buffer.from([0, 255, 13, 10]);
    await assert.rejects(
      runArchiveProcess(
        root,
        attempt,
        "failed",
        process.execPath,
        [
          "-e",
          "process.stdout.write(Buffer.from([0,255,13,10]));process.exit(7)",
        ],
        root,
        { timeout: 2000 },
      ),
      /Archive failed/,
    );
    assert.deepEqual(
      await readFile(path.join(root, attempt, "commands/failed/stdout.txt")),
      raw,
    );
    const command = JSON.parse(
      await readFile(
        path.join(root, attempt, "commands/failed/command.json"),
        "utf8",
      ),
    );
    assert.equal(command.exitCode, 7);
    assert.equal(command.status, "failed");
    await assert.rejects(
      runArchiveProcess(
        root,
        attempt,
        "overflow",
        process.execPath,
        ["-e", "process.stdout.write(Buffer.alloc(16*1024*1024+2048,255))"],
        root,
        { timeout: 5000 },
      ),
      /process-failed/,
    );
    assert.equal(
      (await readFile(path.join(root, attempt, "commands/overflow/stdout.txt")))
        .length,
      16 * 1024 * 1024,
    );
    await assert.rejects(
      runArchiveProcess(
        root,
        attempt,
        "missing",
        "flowkit-no-such-executable",
        [],
        root,
        { timeout: 2000 },
      ),
      /process-failed/,
    );
    await assert.rejects(
      runArchiveProcess(
        root,
        attempt,
        "timeout",
        process.execPath,
        ["-e", "setInterval(()=>{},1000)"],
        root,
        { timeout: 100 },
      ),
      /process-failed/,
    );
    const timed = JSON.parse(
      await readFile(
        path.join(root, attempt, "commands/timeout/command.json"),
        "utf8",
      ),
    );
    assert.equal(timed.timeout, true);
    const storage = path.join(root, attempt, "commands/storage/command.json");
    await mkdir(storage, { recursive: true });
    await assert.rejects(
      runArchiveProcess(
        root,
        attempt,
        "storage",
        process.execPath,
        ["-e", "process.stdout.write(Buffer.from([255,13,10]))"],
        root,
        { timeout: 2000 },
      ),
      /storage unconfirmed/,
    );
    assert.deepEqual(
      await readFile(path.join(root, attempt, "commands/storage/stdout.txt")),
      Buffer.from([255, 13, 10]),
    );
    await assert.rejects(
      runArchiveProcess(
        root,
        attempt,
        "failed",
        process.execPath,
        ["--version"],
        root,
        { timeout: 2000 },
      ),
      /storage failed/,
    );
    assert.deepEqual(
      await readFile(path.join(root, attempt, "commands/failed/stdout.txt")),
      raw,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("candidate guard refuses CRLF/filter failure without normalizing and accepts explicit -text", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-candidate-bytes-"),
  );
  try {
    await gitBytes(root, ["init"]);
    const bytes = Buffer.from("candidate\r\n");
    await writeFile(path.join(root, "candidate.txt"), bytes);
    await writeFile(path.join(root, ".gitattributes"), "*.txt text eol=lf\n");
    await assert.rejects(
      assertCandidateGitBytes(root, "candidate.txt"),
      /bytes differ/,
    );
    assert.deepEqual(await readFile(path.join(root, "candidate.txt")), bytes);
    await writeFile(path.join(root, ".gitattributes"), "*.txt -text\n");
    await assertCandidateGitBytes(root, "candidate.txt");
    await writeFile(path.join(root, ".gitattributes"), "*.txt filter=fail\n");
    await gitBytes(root, [
      "config",
      "filter.fail.clean",
      "flowkit-no-such-filter",
    ]);
    await gitBytes(root, ["config", "filter.fail.required", "true"]);
    await assert.rejects(assertCandidateGitBytes(root, "candidate.txt"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
