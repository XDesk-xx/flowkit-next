import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("generic raw-stream attributes preserve index bytes across Change/Full Test paths without hiding structured whitespace", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-raw-attributes-"));
  const git = (...args: string[]) => {
    const result = spawnSync("git", args, { cwd: root });
    if (result.error) throw result.error;
    return result;
  };
  try {
    assert.equal(git("init").status, 0);
    const attributes = await readFile(".gitattributes");
    await writeFile(path.join(root, ".gitattributes"), attributes);
    assert.equal(git("add", ".gitattributes").status, 0);
    const raw = Buffer.from("raw output  \r\n\t\r\n");
    for (const delivery of ["delivery-one", "delivery-two"]) {
      for (const subroot of [
        "changes/change-one/proof/run-one",
        "changes/change-two/proof/run-two",
        "full-test/attempt-one",
      ]) {
        for (const name of [
          "stdout.txt",
          "stderr.txt",
          "check.stdout.txt",
          "check.stderr.txt",
        ]) {
          const relative = `.flowkit/artifacts/${delivery}/${subroot}/${name}`;
          const target = path.join(root, relative);
          await mkdir(path.dirname(target), { recursive: true });
          await writeFile(target, raw);
          assert.equal(git("add", "--", relative).status, 0);
          assert.deepEqual(git("show", `:${relative}`).stdout, raw);
          assert.equal(
            git("diff", "--cached", "--check", "--", relative).status,
            0,
          );
        }
      }
    }
    for (const relative of [
      "src/source.ts",
      ".flowkit/runs/delivery-one/001-change-one/run/result.json",
      ".flowkit/artifacts/delivery-one/changes/change-one/proof/run/summary.md",
    ]) {
      const target = path.join(root, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, "structured text  \n");
      assert.equal(git("add", "--", relative).status, 0);
      assert.equal(
        git("diff", "--cached", "--check", "--", relative).status,
        2,
      );
    }
    const structuredPath =
      ".flowkit/artifacts/delivery-one/changes/change-one/proof/run/command.json";
    const structuredBytes = Buffer.from('{"command":"run"}\r\n');
    await writeFile(path.join(root, structuredPath), structuredBytes);
    assert.equal(git("add", "--", structuredPath).status, 0);
    assert.deepEqual(git("show", ":" + structuredPath).stdout, structuredBytes);
    assert.match(
      git("check-attr", "whitespace", "--", structuredPath).stdout.toString(),
      /unspecified/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
