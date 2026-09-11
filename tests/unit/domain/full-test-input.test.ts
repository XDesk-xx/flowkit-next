import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { mock } from "node:test";
import {
  readFullTestInput,
  FULL_TEST_CONFIG,
  isFullTestRef,
} from "../../../src/internal/full-test-input.js";

test("Full Test inputs use configured files without Git and ignore process artifacts", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flowkit-ft-input-"));
  try {
    await fs.mkdir(path.join(root, "config/verification"), { recursive: true });
    await fs.mkdir(path.join(root, "src"));
    const config = {
      inputs: ["src"],
      exclude: [".flowkit", ".tmp", "architecture"],
      environment: [],
      checks: [
        {
          checkId: "test",
          program: process.execPath,
          args: ["-e", "process.exit(0)"],
          cwd: ".",
        },
      ],
    };
    const save = () =>
      fs.writeFile(path.join(root, FULL_TEST_CONFIG), JSON.stringify(config));
    await save();
    await fs.writeFile(path.join(root, "src/ignored.ts"), "export {};\n");
    const first = await readFullTestInput(root);
    assert.ok(isFullTestRef(first.inputRef, "full-test-input"));
    assert.deepEqual(first.files, [FULL_TEST_CONFIG, "src/ignored.ts"]);
    await fs.writeFile(path.join(root, ".gitignore"), "src/ignored.ts\n");
    await fs.mkdir(path.join(root, ".flowkit/artifacts"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".flowkit/artifacts/stdout.txt"),
      "output\n",
    );
    assert.equal((await readFullTestInput(root)).inputRef, first.inputRef);
    await fs.writeFile(
      path.join(root, "src/ignored.ts"),
      "export const changed = true;\n",
    );
    assert.notEqual((await readFullTestInput(root)).inputRef, first.inputRef);
    config.exclude.push("config");
    await save();
    await assert.rejects(readFullTestInput(root), /cannot be excluded/);
    config.exclude.pop();
    config.inputs.push("missing");
    await save();
    await assert.rejects(readFullTestInput(root), /ENOENT/);
    config.inputs.pop();
    await fs.writeFile(
      path.join(root, FULL_TEST_CONFIG),
      JSON.stringify({ ...config, unknown: true }),
    );
    await assert.rejects(readFullTestInput(root), /invalid Full Test config/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
test("input parser rejects ambiguous paths and selected links, binds command and declared environment", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flowkit-ft-bounds-"));
  try {
    await fs.mkdir(path.join(root, "config/verification"), { recursive: true });
    await fs.mkdir(path.join(root, "src"));
    await fs.writeFile(path.join(root, "src/a.ts"), "export {};\n");
    const config = {
      inputs: ["src"],
      exclude: ["src-excluded"],
      environment: ["FLOWKIT_TEST_INPUT_ENV"],
      checks: [
        {
          checkId: "test",
          program: process.execPath,
          args: ["--version"],
          cwd: ".",
        },
      ],
    };
    const save = (value: unknown = config) =>
      fs.writeFile(path.join(root, FULL_TEST_CONFIG), JSON.stringify(value));
    await save();
    const before = await readFullTestInput(root);
    const oldEnv = process.env.FLOWKIT_TEST_INPUT_ENV;
    try {
      process.env.FLOWKIT_TEST_INPUT_ENV = "not-a-secret-fixture";
      const next = await readFullTestInput(root);
      assert.notEqual(next.inputRef, before.inputRef);
      assert.equal(
        JSON.stringify(next).includes("not-a-secret-fixture"),
        false,
      );
    } finally {
      if (oldEnv === undefined) delete process.env.FLOWKIT_TEST_INPUT_ENV;
      else process.env.FLOWKIT_TEST_INPUT_ENV = oldEnv;
    }
    for (const bad of [
      "../escape",
      "src/../src",
      "src//a.ts",
      "D:/outside",
      "src\\a.ts",
      "/outside",
    ]) {
      await save({ ...config, inputs: [bad] });
      await assert.rejects(readFullTestInput(root), /invalid Full Test config/);
    }
    for (const bad of [
      { ...config.checks[0], cwd: "missing" },
      { ...config.checks[0], args: [2] },
      { ...config.checks[0], program: "missing-fixture-tool" },
    ]) {
      await save({ ...config, checks: [bad] });
      await assert.rejects(readFullTestInput(root));
    }
    await save({ ...config, checks: [...config.checks, ...config.checks] });
    await assert.rejects(readFullTestInput(root), /invalid Full Test check/);
    await save();
    const read = fs.readFile;
    mock.method(
      fs,
      "readFile",
      async (...args: Parameters<typeof fs.readFile>) => {
        if (String(args[0]).endsWith("a.ts"))
          throw Object.assign(new Error("fixture unreadable"), {
            code: "EACCES",
          });
        return read(...args);
      },
    );
    await assert.rejects(readFullTestInput(root), /inputs\[0\].*EACCES/);
    mock.restoreAll();
    await fs.symlink(
      path.join(root, "src"),
      path.join(root, "linked"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await save({ ...config, inputs: ["linked"] });
    await assert.rejects(readFullTestInput(root), /unsupported input/);
    await save({
      ...config,
      inputs: ["."],
      exclude: ["linked", ".git", ".flowkit"],
    });
    assert.ok((await readFullTestInput(root)).files.includes("src/a.ts"));
  } finally {
    mock.restoreAll();
    await fs.rm(root, { recursive: true, force: true });
  }
});
