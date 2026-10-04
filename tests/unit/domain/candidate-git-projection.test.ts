import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile, utimes, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { candidateGitProjection } from "../../../src/internal/candidate-git-bytes.js";
import {
  gitBytes,
  gitText,
} from "../../../src/internal/git-checkpoint-scope.js";
import { isCandidateGit } from "../../../src/internal/candidate-git-facts.js";

const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const roots: string[] = [];
after(async () => {
  for (const root of roots) {
    if (
      path.dirname(root) !== path.resolve(tmpdir()) ||
      !path.basename(root).startsWith("flowkit-projection-")
    )
      throw Error("Unsafe fixture cleanup path");
    await rm(root, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  }
});
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-projection-"));
  roots.push(root);
  await gitText(root, ["init", "-q"]);
  await gitText(root, ["config", "core.autocrlf", "false"]);
  await gitText(root, ["config", "core.safecrlf", "false"]);
  return root;
}
async function write(root: string, text: string) {
  const bytes = Buffer.from(text);
  await writeFile(path.join(root, "a.txt"), bytes);
  return { "a.txt": sha(bytes) };
}
async function attributes(root: string, value: string) {
  await writeFile(path.join(root, ".gitattributes"), `*.txt ${value}\n`);
  await gitText(root, ["add", "--", ".gitattributes"]);
}

test("new CRLF text binds LF; prediction writes neither worktree nor objects/index", async () => {
  const root = await fixture();
  await attributes(root, "text eol=crlf");
  const hashes = await write(root, "new\r\n");
  const before = await readFile(path.join(root, ".git/index"));
  const objects = await gitText(root, ["count-objects", "-v"]);
  const binding = await candidateGitProjection(root, hashes);
  assert.equal(isCandidateGit(binding), true);
  assert.equal(binding.files["a.txt"].conversion, "crlf-to-lf");
  assert.deepEqual(await readFile(path.join(root, ".git/index")), before);
  assert.equal(await gitText(root, ["count-objects", "-v"]), objects);
  assert.equal(
    (await readFile(path.join(root, "a.txt"))).toString(),
    "new\r\n",
  );
  await gitText(root, ["add", "--", "a.txt"]);
  assert.equal(
    await gitText(root, ["rev-parse", ":a.txt"]),
    binding.files["a.txt"].blobOid,
  );
  assert.deepEqual(
    await candidateGitProjection(root, hashes, binding),
    binding,
  );
});

test("auto and inherited autocrlf preserve modified existing CRLF index", async () => {
  for (const mode of ["auto", "auto-lf", "auto-crlf", "true", "input"]) {
    const root = await fixture();
    await write(root, "old\r\n");
    await gitText(root, ["add", "--", "a.txt"]);
    if (mode.startsWith("auto"))
      await attributes(
        root,
        "text=auto" + (mode === "auto" ? "" : ` eol=${mode.slice(5)}`),
      );
    else await gitText(root, ["config", "core.autocrlf", mode]);
    const hashes = await write(root, "new longer\r\n");
    const binding = await candidateGitProjection(root, hashes);
    assert.equal(binding.files["a.txt"].conversion, "identity");
    await gitText(root, ["add", "--", "a.txt"]);
    assert.equal(
      await gitText(root, ["rev-parse", ":a.txt"]),
      binding.files["a.txt"].blobOid,
    );
    assert.deepEqual(
      await candidateGitProjection(root, hashes, binding),
      binding,
    );
  }
});

test("attribute-only clean ambiguity rejects before admission, including only stat changes", async () => {
  const root = await fixture();
  await attributes(root, "-text");
  const hashes = await write(root, "same\r\n");
  const old = new Date(Date.now() - 60_000);
  await utimes(path.join(root, "a.txt"), old, old);
  await gitText(root, ["add", "--", "a.txt"]);
  const oid = await gitText(root, ["rev-parse", ":a.txt"]);
  await attributes(root, "text eol=crlf");
  const before = await readFile(path.join(root, ".git/index"));
  await assert.rejects(
    candidateGitProjection(root, hashes),
    /stat-cache output ambiguous/,
  );
  assert.deepEqual(await readFile(path.join(root, ".git/index")), before);
  await gitText(root, ["add", "--", "a.txt"]);
  assert.equal(await gitText(root, ["rev-parse", ":a.txt"]), oid);
  const now = new Date();
  await utimes(path.join(root, "a.txt"), now, now);
  await assert.rejects(
    candidateGitProjection(root, hashes),
    /stat-cache output ambiguous/,
  );
  await gitText(root, ["add", "--", "a.txt"]);
  assert.notEqual(await gitText(root, ["rev-parse", ":a.txt"]), oid);
});

test("real drift, unsupported filters, and ambiguous index flags cannot inherit a binding", async () => {
  const root = await fixture();
  await attributes(root, "text=auto");
  const hashes = await write(root, "source\n");
  const binding = await candidateGitProjection(root, hashes);
  await attributes(root, "filter=untrusted");
  await assert.rejects(candidateGitProjection(root, hashes, binding), /filter/);
  await attributes(root, "text=auto");
  await gitText(root, ["add", "--", "a.txt"]);
  await gitText(root, ["update-index", "--assume-unchanged", "a.txt"]);
  await assert.rejects(
    candidateGitProjection(root, hashes, binding),
    /index flags/,
  );
  assert.equal(
    (
      await gitBytes(root, ["cat-file", "blob", binding.files["a.txt"].blobOid])
    ).toString(),
    "source\n",
  );
});

test("LF and mixed index bases differ, UTF-8/BOM and binary/-text remain byte exact, unsafe conversions reject", async () => {
  for (const initial of ["old\n", "old\r\nold-lf\n"]) {
    const root = await fixture();
    await write(root, initial);
    await gitText(root, ["add", "--", "a.txt"]);
    await attributes(root, "text=auto eol=lf");
    const hashes = await write(root, "new longer\r\n");
    const binding = await candidateGitProjection(root, hashes);
    assert.equal(
      binding.files["a.txt"].conversion,
      initial.includes("\r") ? "identity" : "crlf-to-lf",
    );
    await gitText(root, ["add", "--", "a.txt"]);
    assert.equal(
      await gitText(root, ["rev-parse", ":a.txt"]),
      binding.files["a.txt"].blobOid,
    );
  }
  for (const [raw, rule, expected] of [
    [
      Buffer.from("\ufeffutf8 汉字\r\n"),
      "text eol=lf",
      Buffer.from("\ufeffutf8 汉字\n"),
    ],
    [
      Buffer.from("mixed\r\nlf\nend\r"),
      "text eol=lf",
      Buffer.from("mixed\nlf\nend\r"),
    ],
    [Buffer.from([0, 255, 13, 10]), "text=auto", Buffer.from([0, 255, 13, 10])],
    [Buffer.from([255, 13, 10]), "-text", Buffer.from([255, 13, 10])],
  ] as const) {
    const root = await fixture();
    await attributes(root, rule);
    await writeFile(path.join(root, "a.txt"), raw);
    const binding = await candidateGitProjection(root, { "a.txt": sha(raw) });
    await gitText(root, ["add", "--", "a.txt"]);
    assert.equal(
      await gitText(root, ["rev-parse", ":a.txt"]),
      binding.files["a.txt"].blobOid,
    );
    assert.deepEqual(
      await gitBytes(root, [
        "cat-file",
        "blob",
        binding.files["a.txt"].blobOid,
      ]),
      expected,
    );
    assert.deepEqual(await readFile(path.join(root, "a.txt")), raw);
  }
  const root = await fixture();
  await attributes(root, "text eol=lf");
  await writeFile(path.join(root, "a.txt"), Buffer.from([255, 13, 10]));
  await assert.rejects(
    candidateGitProjection(root, { "a.txt": sha(Buffer.from([255, 13, 10])) }),
    /safe UTF-8/,
  );
  await write(root, "safecrlf\r\n");
  await gitText(root, ["config", "core.safecrlf", "true"]);
  const safecrlf = await candidateGitProjection(root, {
    "a.txt": sha(Buffer.from("safecrlf\r\n")),
  });
  assert.equal(safecrlf.settings.safecrlf, "true");
  assert.equal(safecrlf.files["a.txt"].conversion, "crlf-to-lf");
  await assert.rejects(gitText(root, ["add", "--", "a.txt"]));
});

test("projection stays read-only while ordinary add enforces safecrlf", async () => {
  for (const [rule, raw, rejects] of [
    ["text eol=crlf", "safe\r\n", false],
    ["text eol=crlf", "unsafe\n", true],
    ["text eol=crlf", "mixed\r\nlf\n", true],
    ["text eol=lf", "safe\n", false],
    ["text=auto eol=crlf", "binary\0\n", false],
  ] as const) {
    const root = await fixture();
    await attributes(root, rule);
    const hashes = await write(root, raw);
    await gitText(root, ["config", "core.safecrlf", "true"]);
    const index = await readFile(path.join(root, ".git/index"));
    const binding = await candidateGitProjection(root, hashes);
    assert.equal(binding.settings.safecrlf, "true");
    assert.deepEqual(await readFile(path.join(root, ".git/index")), index);
    if (rejects) {
      await assert.rejects(gitText(root, ["add", "--", "a.txt"]));
      assert.deepEqual(await readFile(path.join(root, ".git/index")), index);
    } else {
      await gitText(root, ["add", "--", "a.txt"]);
      assert.equal(
        await gitText(root, ["rev-parse", ":a.txt"]),
        binding.files["a.txt"].blobOid,
      );
    }
  }
});
