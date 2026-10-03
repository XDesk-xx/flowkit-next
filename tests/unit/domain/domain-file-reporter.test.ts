import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { assertDomainFiles } from "../../acceptance/domain-file-reporter.js";

test("native domain coverage accepts new test files and detects omitted shards from actual reporter output", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-domain-reporter-"),
  );
  try {
    await mkdir(path.join(root, "tests"));
    const files = ["first.test.ts", "second.test.ts"];
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const run = async () => {
      const outputs = [];
      for (let shard = 1; shard <= 2; shard++) {
        const result = await promisify(execFile)(
          process.execPath,
          [
            "--import",
            import.meta.resolve("tsx"),
            "--test",
            `--test-reporter=${new URL("../../acceptance/domain-file-reporter.ts", import.meta.url).href}`,
            `--test-shard=${shard}/2`,
            ...files.map((file) => path.join(root, "tests", file)),
          ],
          { cwd: root, env, windowsHide: true },
        );
        assert.match(result.stdout, /# fail 0/);
        outputs.push(result.stdout);
      }
      return outputs;
    };
    const writeTest = (file: string) =>
      writeFile(
        path.join(root, "tests", file),
        'import {test} from "node:test"; test("synthetic", () => {});\n',
      );
    for (const file of files) await writeTest(file);
    const initial = await run();
    assertDomainFiles(initial, files);
    assert.throws(
      () => assertDomainFiles(initial.slice(0, 1), files),
      /Every current domain/,
    );
    files.push("added.test.ts");
    await writeTest(files[2]);
    assert.throws(
      () => assertDomainFiles(initial, files),
      /Every current domain/,
    );
    assertDomainFiles(await run(), files);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
