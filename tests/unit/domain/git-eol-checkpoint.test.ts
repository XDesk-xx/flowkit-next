import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  symlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { executeScopedCheckpoint } from "../../../src/internal/git-checkpoint-execution.js";
import {
  gitBytes,
  gitText,
} from "../../../src/internal/git-checkpoint-scope.js";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-eol-checkpoint-"));
  await gitText(root, ["init", "-b", "main"]);
  await gitText(root, ["config", "user.name", "Test"]);
  await gitText(root, ["config", "user.email", "fixture@example.invalid"]);
  await gitText(root, ["config", "core.autocrlf", "false"]);
  await gitText(root, ["config", "core.safecrlf", "false"]);
  return root;
}
const checkpoint = (
  root: string,
  paths: string[],
  validate = async () => true,
) =>
  executeScopedCheckpoint(
    root,
    "main",
    {
      kind: "create-new",
      paths: [...paths].sort(),
      commitMessage: "EOL fixture",
      commitShape: null,
    },
    validate,
  );

test(
  "ordinary Linux staging supports new executable and both authorized executable-bit changes",
  { skip: process.platform === "win32" },
  async () => {
    const root = await fixture();
    try {
      await gitText(root, ["config", "core.filemode", "true"]);
      await writeFile(path.join(root, "run.sh"), "#!/bin/sh\necho fixture\n");
      await chmod(path.join(root, "run.sh"), 0o755);
      assert.equal((await checkpoint(root, ["run.sh"])).status, "completed");
      assert.match(
        await gitText(root, ["ls-tree", "HEAD", "run.sh"]),
        /^100755 /,
      );
      for (const [mode, expected] of [
        [0o644, "100644"],
        [0o755, "100755"],
      ] as const) {
        await chmod(path.join(root, "run.sh"), mode);
        const result = await checkpoint(root, ["run.sh"]);
        assert.equal(result.status, "completed", JSON.stringify(result));
        assert.match(
          await gitText(root, ["ls-tree", "HEAD", "run.sh"]),
          new RegExp(`^${expected} `),
        );
      }
      await writeFile(path.join(root, "group.sh"), "group bit only\n");
      await chmod(path.join(root, "group.sh"), 0o654);
      assert.equal((await checkpoint(root, ["group.sh"])).status, "completed");
      assert.match(
        await gitText(root, ["ls-tree", "HEAD", "group.sh"]),
        /^100644 /,
      );
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  },
);

test(
  "filemode=false keeps an existing ordinary mode and gives new files 100644",
  { skip: process.platform === "win32" },
  async () => {
    const root = await fixture();
    try {
      await gitText(root, ["config", "core.filemode", "true"]);
      await writeFile(path.join(root, "old.sh"), "old executable\n");
      await chmod(path.join(root, "old.sh"), 0o755);
      assert.equal((await checkpoint(root, ["old.sh"])).status, "completed");
      await gitText(root, ["config", "core.filemode", "false"]);
      await chmod(path.join(root, "old.sh"), 0o644);
      await writeFile(
        path.join(root, "old.sh"),
        "changed executable contents\n",
      );
      await writeFile(path.join(root, "new.sh"), "new executable\n");
      await chmod(path.join(root, "new.sh"), 0o755);
      const result = await checkpoint(root, ["old.sh", "new.sh"]);
      assert.equal(result.status, "completed", JSON.stringify(result));
      assert.match(
        await gitText(root, ["ls-tree", "HEAD", "old.sh"]),
        /^100755 /,
      );
      assert.match(
        await gitText(root, ["ls-tree", "HEAD", "new.sh"]),
        /^100644 /,
      );
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  },
);

test(
  "executable mode drift and non-ordinary targets reject before staging",
  { skip: process.platform === "win32" },
  async () => {
    const root = await fixture();
    try {
      await gitText(root, ["config", "core.filemode", "true"]);
      await writeFile(path.join(root, "a.txt"), "mode drift\n");
      let calls = 0;
      const drift = await checkpoint(root, ["a.txt"], async () => {
        if (++calls === 2) await chmod(path.join(root, "a.txt"), 0o755);
        return true;
      });
      assert.equal(drift.effect, "none");
      assert.match(drift.reason!, /mode drift/);
      assert.equal(await gitText(root, ["ls-files", "--stage"]), "");
      await symlink("a.txt", path.join(root, "link.txt"));
      assert.equal((await checkpoint(root, ["link.txt"])).effect, "none");
      assert.equal(await gitText(root, ["ls-files", "--stage"]), "");
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  },
);
test("ordinary checkpoint requires bound rules in tree, commits LF blobs and preserves worktree CRLF", async () => {
  const root = await fixture();
  try {
    await writeFile(path.join(root, ".gitattributes"), "*.txt text eol=crlf\n");
    await writeFile(path.join(root, "a.txt"), "new\r\n");
    const rejected = await checkpoint(root, ["a.txt"]);
    assert.equal(rejected.effect, "none");
    assert.match(rejected.reason!, /attributes missing/);
    assert.equal(await gitText(root, ["ls-files", "--stage"]), "");
    const accepted = await checkpoint(root, [".gitattributes", "a.txt"]);
    assert.equal(accepted.status, "completed", JSON.stringify(accepted));
    assert.deepEqual(
      await gitBytes(root, ["show", "HEAD:a.txt"]),
      Buffer.from("new\n"),
    );
    assert.deepEqual(
      await readFile(path.join(root, "a.txt")),
      Buffer.from("new\r\n"),
    );
  } finally {
    await rm(root, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  }
});
test("safecrlf rejection remains a real Git failure without disabling settings or committing", async () => {
  const root = await fixture();
  try {
    await writeFile(path.join(root, ".gitattributes"), "*.txt text eol=lf\n");
    const baseline = await checkpoint(root, [".gitattributes"]);
    assert.equal(baseline.status, "completed");
    const head = await gitText(root, ["rev-parse", "HEAD"]);
    const index = await readFile(path.join(root, ".git/index"));
    await writeFile(path.join(root, "a.txt"), "unsafe\r\n");
    await gitText(root, ["config", "core.safecrlf", "true"]);
    const failed = await checkpoint(root, ["a.txt"]);
    assert.notEqual(failed.status, "completed");
    assert.equal(
      await gitText(root, ["config", "--get", "core.safecrlf"]),
      "true",
    );
    assert.equal(await gitText(root, ["rev-parse", "HEAD"]), head);
    assert.deepEqual(await readFile(path.join(root, ".git/index")), index);
    assert.deepEqual(
      await readFile(path.join(root, "a.txt")),
      Buffer.from("unsafe\r\n"),
    );
  } finally {
    await rm(root, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  }
});

test("ordinary checkpoint rejects attribute-only stat ambiguity before staging, including touch-only contrast", async () => {
  for (const touch of [false, true]) {
    const root = await fixture();
    try {
      await writeFile(path.join(root, ".gitattributes"), "*.txt -text\n");
      await writeFile(path.join(root, "a.txt"), "same\r\n");
      const old = new Date(Date.now() - 60_000);
      await utimes(path.join(root, "a.txt"), old, old);
      await gitText(root, ["add", "--", ".gitattributes", "a.txt"]);
      await gitText(root, ["commit", "-m", "baseline"]);
      await writeFile(
        path.join(root, ".gitattributes"),
        "*.txt text eol=crlf\n",
      );
      if (touch) await utimes(path.join(root, "a.txt"), new Date(), new Date()); // Independent semantic contrast only, never a product workaround.
      const before = await readFile(path.join(root, ".git/index"));
      const result = await checkpoint(root, [".gitattributes", "a.txt"]);
      assert.equal(result.effect, "none");
      assert.match(result.reason!, /stat-cache output ambiguous/);
      assert.deepEqual(await readFile(path.join(root, ".git/index")), before);
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  }
});
test("existing CRLF auto and inherited autocrlf stage identity, unexpected settings and unrelated index do not widen scope", async () => {
  for (const mode of ["auto", "true", "input"]) {
    const root = await fixture();
    try {
      await writeFile(path.join(root, "a.txt"), "old\r\n");
      await gitText(root, ["add", "--", "a.txt"]);
      await gitText(root, ["commit", "-m", "baseline"]);
      const paths = ["a.txt"];
      if (mode === "auto") {
        await writeFile(
          path.join(root, ".gitattributes"),
          "*.txt text=auto eol=crlf\n",
        );
        paths.push(".gitattributes");
      } else await gitText(root, ["config", "core.autocrlf", mode]);
      await writeFile(path.join(root, "a.txt"), "changed longer\r\n");
      const result = await checkpoint(root, paths);
      assert.equal(result.status, "completed", JSON.stringify(result));
      assert.deepEqual(
        await gitBytes(root, ["show", "HEAD:a.txt"]),
        Buffer.from("changed longer\r\n"),
      );
      await writeFile(path.join(root, "a.txt"), "another change\r\n");
      let calls = 0;
      const drift = await checkpoint(root, paths, async () => {
        if (++calls === 2)
          await gitText(root, ["config", "core.safecrlf", "warn"]);
        return true;
      });
      assert.equal(drift.effect, "none");
      assert.match(drift.reason!, /settings changed/);
      await writeFile(path.join(root, "outside.txt"), "outside\n");
      await gitText(root, ["add", "--", "outside.txt"]);
      const index = await readFile(path.join(root, ".git/index"));
      assert.equal((await checkpoint(root, paths)).effect, "none");
      assert.deepEqual(await readFile(path.join(root, ".git/index")), index);
    } finally {
      await rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  }
});
