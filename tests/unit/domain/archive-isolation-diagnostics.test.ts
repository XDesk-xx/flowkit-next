import assert from "node:assert/strict";
import {
  cp,
  link,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  archiveChildEnvironment,
  assertArchiveSourceFiles,
  copyArchiveDependencies,
} from "../../../src/internal/archive-dependency-snapshot.js";
import {
  archiveDiagnosticAttempt,
  runArchiveProcess,
} from "../../../src/internal/archive-process.js";
import { assertCandidateGitBytes } from "../../../src/internal/candidate-git-bytes.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

test("workspace dependency roots relocate internal links and shims without exposing source writes", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-workspace-isolation-"),
  );
  try {
    const source = path.join(root, "source");
    const scratch = path.join(root, "scratch");
    const store = path.join(source, "node_modules/.pnpm/pkg/node_modules/pkg");
    const app = path.join(source, "packages/app");
    await mkdir(store, { recursive: true });
    await mkdir(path.join(app, "node_modules/.bin"), { recursive: true });
    await mkdir(path.join(source, "packages/lib"));
    await writeFile(path.join(store, "value.txt"), "original\n");
    await writeFile(path.join(app, "index.js"), "// workspace source\n");
    for (const [name, target] of [
      ["pkg", store],
      ["lib", path.join(source, "packages/lib")],
    ])
      await symlink(
        target,
        path.join(app, "node_modules", name),
        process.platform === "win32" ? "junction" : "dir",
      );
    await writeFile(
      path.join(app, "node_modules/.bin/pkg.cmd"),
      `@SET NODE_PATH=${store}\r\n@"%~dp0\\..\\pkg\\index.js" %*\r\n`,
    );
    const modules = await assertArchiveSourceFiles(
      path.join(source, "packages"),
    );
    assert.deepEqual(modules, [path.join(app, "node_modules")]);
    await cp(path.join(source, "packages"), path.join(scratch, "packages"), {
      recursive: true,
      filter: (file) => path.basename(file) !== "node_modules",
    });
    const mappings = await copyArchiveDependencies(
      source,
      scratch,
      modules.map((file) => path.relative(source, file)),
    );
    const pkg = path.join(scratch, "packages/app/node_modules/pkg");
    assert.equal(
      await realpath(pkg),
      await realpath(
        path.join(scratch, "node_modules/.pnpm/pkg/node_modules/pkg"),
      ),
    );
    assert.equal(
      await realpath(path.join(scratch, "packages/app/node_modules/lib")),
      await realpath(path.join(scratch, "packages/lib")),
    );
    assert.ok(
      mappings.some(
        (map) => map.source.includes("packages") && map.kind === "shim",
      ),
    );
    await writeFile(path.join(pkg, "value.txt"), "scratch mutation\n");
    assert.equal(
      await readFile(path.join(store, "value.txt"), "utf8"),
      "original\n",
    );
    await symlink(
      root,
      path.join(app, "node_modules/external"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await assert.rejects(
      copyArchiveDependencies(
        source,
        path.join(root, "bad-scratch"),
        modules.map((file) => path.relative(source, file)),
      ),
      /escapes target/,
    );
    await symlink(
      store,
      path.join(app, "source-alias"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await assert.rejects(assertArchiveSourceFiles(app), /source alias/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("dependency copies isolate hardlinks, relocate internal aliases/shims and reject escaping links", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-isolation-"));
  try {
    const source = path.join(root, "source");
    const scratch = path.join(root, "scratch");
    await mkdir(path.join(source, "node_modules/.bin"), { recursive: true });
    await mkdir(path.join(source, "node_modules/pkg"));
    await mkdir(scratch);
    const file = path.join(source, "node_modules/pkg/value.txt");
    await writeFile(file, "original\n");
    await link(file, path.join(source, "node_modules/hard.txt"));
    await symlink(
      path.dirname(file),
      path.join(source, "node_modules/alias"),
      process.platform === "win32" ? "junction" : "dir",
    );
    const shim = `@SET NODE_PATH=${source}\\node_modules\\pkg;%NODE_PATH%\r\n@"%~dp0\\..\\pkg\\index.js" %*\r\n`;
    await writeFile(path.join(source, "node_modules/.bin/pkg.cmd"), shim);
    if (process.platform === "win32") {
      const toWsl = (root: string) =>
        `/mnt/${root[0].toLowerCase()}/${root.slice(3).replaceAll("\\", "/")}`;
      await writeFile(
        path.join(source, "node_modules/.bin/pkg"),
        `#!/bin/sh\nbasedir=$(dirname "$0")\nexport NODE_PATH="${toWsl(source)}/node_modules/pkg:${toWsl(source)}/node_modules:$NODE_PATH"\n`,
      );
    }
    const mappings = await copyArchiveDependencies(source, scratch);
    assert.ok(mappings.some((map) => map.kind === "shim"));
    assert.ok(
      (await realpath(path.join(scratch, "node_modules/alias"))).startsWith(
        scratch,
      ),
    );
    await writeFile(
      path.join(scratch, "node_modules/hard.txt"),
      "changed scratch\n",
    );
    assert.equal(await readFile(file, "utf8"), "original\n");
    assert.equal(
      await readFile(path.join(source, "node_modules/.bin/pkg.cmd"), "utf8"),
      shim,
    );
    assert.ok(
      (
        await readFile(path.join(scratch, "node_modules/.bin/pkg.cmd"), "utf8")
      ).includes(scratch),
    );
    const scratch2 = path.join(root, "scratch2");
    await mkdir(scratch2);
    await symlink(
      root,
      path.join(source, "node_modules/external"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await assert.rejects(
      copyArchiveDependencies(source, scratch2),
      /escapes target/,
    );
    const before = { ...process.env };
    assert.equal(
      archiveChildEnvironment(true).pnpm_config_verify_deps_before_run,
      "false",
    );
    assert.ok(
      JSON.stringify({ ...process.env }) === JSON.stringify(before),
      "Host environment changed",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

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
        ["-e", "process.stdout.write(Buffer.alloc(2048,255))"],
        root,
        { timeout: 2000, limit: 1024 },
      ),
      /process-failed/,
    );
    assert.equal(
      (await readFile(path.join(root, attempt, "commands/overflow/stdout.txt")))
        .length,
      1024,
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
