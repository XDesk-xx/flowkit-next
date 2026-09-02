import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  canonicalActionGuidancePath,
  isActionGuidanceRef,
  isActionGuidanceRefForAction,
  resolveActionGuidanceRef,
} from "../../../src/domain/index.js";

async function makeRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "flowkit-action-guidance-"));
}

async function writeGuidance(
  root: string,
  actionId: "apply" | "review-apply",
  body: string,
): Promise<string> {
  const entry = path.join(root, "skills", "actions", actionId, "SKILL.md");
  await mkdir(path.dirname(entry), { recursive: true });
  await writeFile(entry, body, "utf8");
  return entry;
}

test("canonical Guidance path is deterministic for the closed Standard Action set", () => {
  assert.equal(
    canonicalActionGuidancePath("apply"),
    "skills/actions/apply/SKILL.md",
  );
  assert.equal(
    canonicalActionGuidancePath("review-apply"),
    "skills/actions/review-apply/SKILL.md",
  );
  assert.equal(canonicalActionGuidancePath("../apply"), null);
  assert.equal(canonicalActionGuidancePath("unknown-action"), null);
});

test("ActionGuidanceRef is a closed canonical path + lowercase SHA-256 envelope", () => {
  const valid = {
    path: "skills/actions/apply/SKILL.md",
    contentSha256: "a".repeat(64),
  };

  assert.equal(isActionGuidanceRef(valid), true);
  assert.equal(isActionGuidanceRefForAction(valid, "apply"), true);
  assert.equal(isActionGuidanceRefForAction(valid, "review-apply"), false);
  assert.equal(isActionGuidanceRef({ ...valid, extra: true }), false);
  assert.equal(
    isActionGuidanceRef({ ...valid, path: ".agents/skills/apply/SKILL.md" }),
    false,
  );
  assert.equal(
    isActionGuidanceRef({ ...valid, path: "skills/actions/../apply/SKILL.md" }),
    false,
  );
  assert.equal(
    isActionGuidanceRef({ ...valid, contentSha256: "A".repeat(64) }),
    false,
  );
  assert.equal(
    isActionGuidanceRef({ ...valid, contentSha256: "a".repeat(63) }),
    false,
  );
});

test("resolver binds exact canonical bytes and content drift changes identity", async () => {
  const root = await makeRoot();
  try {
    const entry = await writeGuidance(root, "apply", "# apply\nfirst\n");

    const first = await resolveActionGuidanceRef(root, "apply");
    assert.notEqual(first, null);
    assert.equal(first!.path, "skills/actions/apply/SKILL.md");
    assert.match(first!.contentSha256, /^[0-9a-f]{64}$/);

    await writeFile(entry, "# apply\nsecond\n", "utf8");
    const second = await resolveActionGuidanceRef(root, "apply");
    assert.notEqual(second, null);
    assert.notEqual(first!.contentSha256, second!.contentSha256);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing canonical product Guidance fails closed and never falls back to .agents", async () => {
  const root = await makeRoot();
  try {
    const bootstrap = path.join(root, ".agents", "skills", "apply", "SKILL.md");
    await mkdir(path.dirname(bootstrap), { recursive: true });
    await writeFile(bootstrap, "# bootstrap apply\n", "utf8");

    assert.equal(await resolveActionGuidanceRef(root, "apply"), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("non-regular and final-entry symlink Guidance fail closed", async (t) => {
  const root = await makeRoot();
  try {
    const directoryEntry = path.join(
      root,
      "skills",
      "actions",
      "apply",
      "SKILL.md",
    );
    await mkdir(directoryEntry, { recursive: true });
    assert.equal(await resolveActionGuidanceRef(root, "apply"), null);

    await rm(path.join(root, "skills"), { recursive: true, force: true });
    const target = path.join(root, "target.md");
    await writeFile(target, "# target\n", "utf8");
    const link = path.join(root, "skills", "actions", "apply", "SKILL.md");
    await mkdir(path.dirname(link), { recursive: true });
    try {
      await symlink(target, link, "file");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES" || code === "UNKNOWN") {
        t.skip("Host does not permit symlink fixtures");
        return;
      }
      throw error;
    }
    assert.equal(await resolveActionGuidanceRef(root, "apply"), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parent-path redirection through symlink fails closed", async (t) => {
  const root = await makeRoot();
  const outside = await makeRoot();
  try {
    const outsideEntry = await writeGuidance(outside, "apply", "# outside\n");
    const outsideActionDir = path.dirname(outsideEntry);
    const parent = path.join(root, "skills", "actions");
    await mkdir(parent, { recursive: true });
    try {
      await symlink(outsideActionDir, path.join(parent, "apply"), "dir");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES" || code === "UNKNOWN") {
        t.skip("Host does not permit symlink fixtures");
        return;
      }
      throw error;
    }

    assert.equal(await resolveActionGuidanceRef(root, "apply"), null);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("unreadable canonical Guidance fails closed when host permissions are enforceable", async () => {
  const root = await makeRoot();
  try {
    const entry = await writeGuidance(root, "apply", "# apply\n");

    if (process.getuid?.() === 0) {
      await chmod(root, 0o755);
      await chmod(path.join(root, "skills"), 0o755);
      await chmod(path.join(root, "skills", "actions"), 0o755);
      await chmod(path.join(root, "skills", "actions", "apply"), 0o755);
      await chmod(entry, 0o600);

      const moduleUrl = new URL(
        "../../../src/domain/action-guidance-execution.ts",
        import.meta.url,
      ).href;
      const child = spawnSync(
        process.execPath,
        [
          "--import",
          "tsx",
          "--input-type=module",
          "--eval",
          `import { resolveActionGuidanceRef } from ${JSON.stringify(moduleUrl)};
const result = await resolveActionGuidanceRef(${JSON.stringify(root)}, "apply");
if (result !== null) {
  console.error(JSON.stringify(result));
  process.exit(1);
}`,
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          uid: 65534,
          gid: 65534,
        },
      );

      assert.equal(
        child.status,
        0,
        `low-privilege child must observe unreadable Guidance and return null:\n${child.stderr}`,
      );
      return;
    }

    await chmod(entry, 0o000);
    assert.equal(await resolveActionGuidanceRef(root, "apply"), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
