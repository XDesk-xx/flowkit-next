import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
function lint(input: string) {
  return spawnSync(
    process.execPath,
    [
      "node_modules/eslint/bin/eslint.js",
      "--stdin",
      "--stdin-filename",
      "src/gate-fixture.ts",
      "--format",
      "json",
    ],
    { cwd: root, input, encoding: "utf8" },
  );
}
test("code gate retains formatting, lint and exact 650-line rule independently from Git", async () => {
  const pkg = JSON.parse(
    await fs.readFile(path.join(root, "package.json"), "utf8"),
  );
  assert.equal(pkg.scripts["quality:gate"], "pnpm format:check && pnpm lint");
  assert.equal(
    pkg.scripts["check:forbidden-tracked-artifacts"],
    "node scripts/check-forbidden-tracked-artifacts.mjs",
  );
  const formatted = spawnSync(
    process.execPath,
    [
      "node_modules/prettier/bin/prettier.cjs",
      "--check",
      "--stdin-filepath",
      "src/gate-fixture.ts",
    ],
    { cwd: root, input: "export const value=1", encoding: "utf8" },
  );
  assert.equal(formatted.status, 1, formatted.stderr);
  assert.equal(lint("export {};\n").status, 0);
  const unused = lint("const unused = 1;\n");
  assert.equal(unused.status, 1, unused.stderr);
  assert.match(unused.stdout, /no-unused-vars/);
  const exactly = lint("export {};\n" + "// line\n".repeat(649));
  assert.equal(exactly.status, 0, exactly.stdout);
  const above = lint("export {};\n" + "// line\n".repeat(650));
  assert.equal(above.status, 1, above.stderr);
  assert.match(above.stdout, /max-lines/);
});

test("historical raw proof whitespace is a Git diagnostic, not a code verdict", async () => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "flowkit-gate-"));
  const git = (...args: string[]) =>
    spawnSync("git", args, { cwd: fixture, encoding: "utf8" });
  try {
    assert.equal(git("init").status, 0);
    const proof = path.join(fixture, ".flowkit/artifacts/history/proof");
    await fs.mkdir(proof, { recursive: true });
    for (const name of ["proof.bin", "proof.mjs", "stdout.txt"])
      await fs.writeFile(path.join(proof, name), "old\n");
    assert.equal(git("add", ".").status, 0);
    for (const name of ["proof.bin", "proof.mjs", "stdout.txt"])
      await fs.writeFile(
        path.join(proof, name),
        Buffer.from("old\nraw line  \n\n"),
      );
    const diagnostic = git(
      "-c",
      "core.whitespace=trailing-space,blank-at-eof",
      "diff",
      "--check",
    );
    assert.notEqual(diagnostic.status, 0);
    assert.match(diagnostic.stdout, /trailing whitespace/);
    assert.equal(lint("export const valid = true;\n").status, 0);
    const raw = await fs.readFile(path.join(proof, "stdout.txt"));
    assert.deepEqual(raw, Buffer.from("old\nraw line  \n\n"));
  } finally {
    await fs.rm(fixture, { recursive: true, force: true });
  }
});
