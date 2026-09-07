import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { withUnreadableGuidanceFixture } from "./unreadable-guidance-fixture.js";

import {
  deriveApplicableCheckCandidateManifest,
  deriveApplicableCheckCandidateRef,
  deriveApplicableCheckObjectCandidateRef,
  deriveApplicableCheckObjectManifest,
  deriveApplicableCheckRef,
  isActionPackage,
  isApplicableCheckExecutionInput,
  isApplicableCheckPlanInput,
  isApplicableCheckReuseEligible,
  resolveApplicableCheckExecutionInput,
  type ActionPackage,
  type ApplicableCheckDeclaration,
  type ApplicableCheckPlanInput,
  type ApplicableCheckPriorFact,
} from "../../../src/domain/index.js";

const execFileAsync = promisify(execFile);

async function git(root: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  return stdout.trim();
}

async function createGitFixture(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-applicable-check-"));
  await git(root, "init", "-q");
  await git(root, "config", "user.email", "flowkit@example.invalid");
  await git(root, "config", "user.name", "Flowkit Test");
  await git(root, "config", "core.filemode", "true");
  await git(root, "config", "core.autocrlf", "false");
  await writeFile(path.join(root, ".gitignore"), "ignored.txt\n", "utf8");
  await writeFile(path.join(root, "source.txt"), "base\n", "utf8");
  await writeFile(path.join(root, "check.sh"), "echo ok\n", "utf8");
  if (process.platform !== "win32") {
    await chmod(path.join(root, "check.sh"), 0o755);
  }
  await git(root, "add", ".gitignore", "source.txt", "check.sh");
  await git(root, "commit", "-qm", "fixture");
  return root;
}

function actionPackage(sequence = 62): ActionPackage {
  const value: ActionPackage = {
    runId: `20260831-${String(sequence).padStart(3, "0")}-apply`,
    occurrence: { date: "20260831", sequence, actionId: "apply" },
    actionIdentity: {
      deliveryId: "delivery-checks",
      changeId: "change-checks",
      actionId: "apply",
    },
    role: "author",
    lifecycleState: "prepared",
    ownerAuthority: null,
    previousRunId: null,
    guidanceRef: {
      path: "skills/actions/apply/SKILL.md",
      contentSha256: "a".repeat(64),
    },
  };
  assert.equal(isActionPackage(value), true);
  return value;
}

function declaration(
  checkId: string,
  overrides: Partial<ApplicableCheckDeclaration> = {},
): ApplicableCheckDeclaration {
  return {
    checkId,
    program: process.execPath,
    args: ["-e", "process.exit(0)"],
    configRefs: ["config:tsconfig"],
    toolRefs: ["tool:node-22.23.2"],
    environmentRefs: ["environment:linux-x64"],
    ...overrides,
  };
}

function plan(
  ...checks: ApplicableCheckDeclaration[]
): ApplicableCheckPlanInput {
  return { checks };
}

async function resolve(
  root: string,
  inputPlan: ApplicableCheckPlanInput,
  pkg = actionPackage(),
) {
  const value = await resolveApplicableCheckExecutionInput(
    root,
    pkg,
    inputPlan,
  );
  assert.notEqual(value, null);
  return value!;
}

test("plan is closed and rejects caller-owned identity/root fields", () => {
  const base = plan(declaration("typecheck"));
  assert.equal(isApplicableCheckPlanInput(base), true);
  assert.equal(
    isApplicableCheckPlanInput({ ...base, repositoryRoot: "/other" }),
    false,
  );
  assert.equal(
    isApplicableCheckPlanInput({
      ...base,
      candidateRef: `candidate:sha256:${"0".repeat(64)}`,
    }),
    false,
  );
  assert.equal(
    isApplicableCheckPlanInput({
      checks: [declaration("typecheck"), declaration("typecheck")],
    }),
    false,
  );
  assert.equal(
    isApplicableCheckPlanInput(
      plan(declaration("typecheck", { configRefs: ["config:a", "config:a"] })),
    ),
    false,
  );
});

test("checkRef is stable for canonical ref sets and changes for material identity", () => {
  const base = declaration("typecheck", {
    configRefs: ["config:b", "config:a"],
    toolRefs: ["tool:b", "tool:a"],
    environmentRefs: ["environment:b", "environment:a"],
  });
  const canonicalReorder = declaration("typecheck", {
    configRefs: ["config:a", "config:b"],
    toolRefs: ["tool:a", "tool:b"],
    environmentRefs: ["environment:a", "environment:b"],
  });
  const ref = deriveApplicableCheckRef(base);
  assert.equal(ref, deriveApplicableCheckRef(canonicalReorder));
  assert.notEqual(
    ref,
    deriveApplicableCheckRef({ ...base, program: `${process.execPath}-other` }),
  );
  assert.notEqual(
    ref,
    deriveApplicableCheckRef({ ...base, args: [...base.args].reverse() }),
  );
  assert.notEqual(
    ref,
    deriveApplicableCheckRef({ ...base, configRefs: ["config:c"] }),
  );
  assert.notEqual(
    ref,
    deriveApplicableCheckRef({ ...base, toolRefs: ["tool:c"] }),
  );
  assert.notEqual(
    ref,
    deriveApplicableCheckRef({
      ...base,
      environmentRefs: ["environment:windows-x64"],
    }),
  );
});

test("v2 check identity uses UTF-8 byte ordering and preserves ordered argv", () => {
  const first = declaration("unicode-order", {
    args: ["second", "first"],
    configRefs: ["config:😀", "config:\uE000"],
    toolRefs: [],
    environmentRefs: [],
  });
  const reorderedRefs = {
    ...first,
    configRefs: [...first.configRefs].reverse(),
  };
  const reorderedArgs = { ...first, args: [...first.args].reverse() };
  const expected = createHash("sha256")
    .update("flowkit-applicable-check-v2")
    .update("\0")
    .update(
      JSON.stringify({
        checkId: "unicode-order",
        program: process.execPath,
        args: ["second", "first"],
        configRefs: ["config:\uE000", "config:😀"],
        toolRefs: [],
        environmentRefs: [],
      }),
    )
    .digest("hex");
  assert.equal(deriveApplicableCheckRef(first), `check:sha256:${expected}`);
  assert.equal(
    deriveApplicableCheckRef(reorderedRefs),
    `check:sha256:${expected}`,
  );
  assert.notEqual(
    deriveApplicableCheckRef(reorderedArgs),
    `check:sha256:${expected}`,
  );
});

test("execution input is deterministic for a check set and changes with set/package identity", async () => {
  const root = await createGitFixture();
  try {
    const a = declaration("a");
    const b = declaration("b", { args: ["-e", "process.exit(0)", "b"] });
    const first = await resolve(root, plan(a, b));
    const reordered = await resolve(root, plan(b, a));
    assert.equal(first.executionInputRef, reordered.executionInputRef);
    assert.equal(isApplicableCheckExecutionInput(first), true);

    const removed = await resolve(root, plan(a));
    assert.notEqual(first.executionInputRef, removed.executionInputRef);
    const changed = await resolve(
      root,
      plan(a, { ...b, environmentRefs: ["environment:windows"] }),
    );
    assert.notEqual(first.executionInputRef, changed.executionInputRef);
    const otherPackage = await resolve(root, plan(a, b), actionPackage(63));
    assert.notEqual(first.executionInputRef, otherPackage.executionInputRef);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Guidance identity naturally changes ActionPackageRef and executionInputRef", async () => {
  const root = await createGitFixture();
  try {
    const firstPackage = actionPackage();
    const secondPackage: ActionPackage = {
      ...firstPackage,
      guidanceRef: {
        ...firstPackage.guidanceRef,
        contentSha256: "b".repeat(64),
      },
    };

    const first = await resolve(
      root,
      plan(declaration("typecheck")),
      firstPackage,
    );
    const second = await resolve(
      root,
      plan(declaration("typecheck")),
      secondPackage,
    );

    assert.notEqual(first.actionPackageRef, second.actionPackageRef);
    assert.notEqual(first.executionInputRef, second.executionInputRef);
    assert.equal(first.candidateRef, second.candidateRef);
    assert.deepEqual(first.checks, second.checks);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("candidate ignores ignored untracked and Run-only material but changes on source bytes", async () => {
  const root = await createGitFixture();
  try {
    const initial = await deriveApplicableCheckCandidateRef(root);
    assert.notEqual(initial, null);
    await writeFile(path.join(root, "ignored.txt"), "ignored\n", "utf8");
    assert.equal(await deriveApplicableCheckCandidateRef(root), initial);
    await mkdir(path.join(root, ".flowkit", "runs", "x"), { recursive: true });
    await writeFile(
      path.join(root, ".flowkit", "runs", "x", "result.json"),
      "{}\n",
      "utf8",
    );
    assert.equal(await deriveApplicableCheckCandidateRef(root), initial);
    await writeFile(path.join(root, "source.txt"), "changed\n", "utf8");
    assert.notEqual(await deriveApplicableCheckCandidateRef(root), initial);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("exact Memo bytes are isolated while Memo type and other .flowkit material remain visible", async (t) => {
  const root = await createGitFixture();
  try {
    await mkdir(path.join(root, ".flowkit"), { recursive: true });
    const memo = path.join(root, ".flowkit", "memos.json");
    await writeFile(memo, '{"memos":[]}\n', "utf8");
    await git(root, "add", ".flowkit/memos.json");
    await git(root, "commit", "-qm", "memo");
    const initial = await deriveApplicableCheckCandidateRef(root);
    await writeFile(memo, '{"memos":[{"id":"later"}]}\n', "utf8");
    assert.equal(await deriveApplicableCheckCandidateRef(root), initial);
    await writeFile(
      path.join(root, ".flowkit", "project.json"),
      "{}\n",
      "utf8",
    );
    assert.notEqual(await deriveApplicableCheckCandidateRef(root), initial);

    await unlink(memo);
    try {
      await symlink("../source.txt", memo, "file");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES" || code === "UNKNOWN") {
        t.diagnostic("Host does not permit Memo symlink fixture");
        return;
      }
      throw error;
    }
    assert.equal(await deriveApplicableCheckCandidateRef(root), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("same bytes with Git-visible executable mode change changes candidateRef", async () => {
  const root = await createGitFixture();
  try {
    const script = path.join(root, "check.sh");
    const bytes = await readFile(script);
    await git(root, "config", "core.filemode", "false");

    await git(root, "update-index", "--chmod=+x", "check.sh");
    assert.match(
      await git(root, "ls-files", "--stage", "check.sh"),
      /^100755 /,
    );
    const executable = await deriveApplicableCheckCandidateRef(root);
    const before = await resolve(root, plan(declaration("mode-proof")));
    const prior: ApplicableCheckPriorFact = {
      candidateRef: before.candidateRef,
      checkId: before.checks[0].checkId,
      checkRef: before.checks[0].checkRef,
      status: "passed",
    };

    await git(root, "update-index", "--chmod=-x", "check.sh");
    assert.match(
      await git(root, "ls-files", "--stage", "check.sh"),
      /^100644 /,
    );
    assert.deepEqual(await readFile(script), bytes);
    const regular = await deriveApplicableCheckCandidateRef(root);
    const after = await resolve(root, plan(declaration("mode-proof")));
    assert.notEqual(executable, regular);
    assert.equal(
      isApplicableCheckReuseEligible(
        after.candidateRef,
        after.checks[0],
        prior,
      ),
      false,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("symlink target mutation changes candidateRef when symlinks are supported", async (t) => {
  const root = await createGitFixture();
  try {
    const link = path.join(root, "link.txt");
    try {
      await symlink("source.txt", link, "file");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES" || code === "UNKNOWN") {
        t.skip("Host does not permit file symlink fixtures");
        return;
      }
      throw error;
    }
    await git(root, "add", "link.txt");
    await git(root, "commit", "-qm", "add symlink");
    const first = await deriveApplicableCheckCandidateRef(root);
    await unlink(link);
    await symlink("check.sh", link, "file");
    const second = await deriveApplicableCheckCandidateRef(root);
    assert.notEqual(first, second);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("confirmed deletion emits no record and is stable across unstaged staged and committed states", async () => {
  const root = await createGitFixture();
  try {
    const first = await deriveApplicableCheckCandidateRef(root);
    await unlink(path.join(root, "source.txt"));
    const unstaged = await deriveApplicableCheckCandidateRef(root);
    assert.notEqual(first, unstaged);
    assert.equal(
      (await deriveApplicableCheckCandidateManifest(root))?.some(
        (record) => record.path === "source.txt",
      ),
      false,
    );
    await git(root, "add", "-u");
    const staged = await deriveApplicableCheckCandidateRef(root);
    await git(root, "commit", "-qm", "delete source");
    const committed = await deriveApplicableCheckCandidateRef(root);
    assert.equal(unstaged, staged);
    assert.equal(staged, committed);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("worktree and exact object share the v2 binary material projection", async () => {
  const root = await createGitFixture();
  try {
    await writeFile(
      path.join(root, "binary.dat"),
      Buffer.from([0, 255, 13, 10, 32]),
    );
    await writeFile(path.join(root, "trailing.txt"), "value \r\n\r\n", "utf8");
    await git(root, "add", "binary.dat", "trailing.txt");
    await git(root, "commit", "-qm", "binary material");
    const head = await git(root, "rev-parse", "HEAD");
    const worktreeManifest = await deriveApplicableCheckCandidateManifest(root);
    const objectManifest = await deriveApplicableCheckObjectManifest(
      root,
      head,
    );
    assert.deepEqual(objectManifest, worktreeManifest);
    const worktree = await deriveApplicableCheckCandidateRef(root);
    const object = await deriveApplicableCheckObjectCandidateRef(root, head);
    assert.equal(object, worktree);
    assert.match(worktree!, /^candidate:sha256:[0-9a-f]{64}$/);

    await writeFile(
      path.join(root, "binary.dat"),
      Buffer.from([0, 255, 13, 10, 33]),
    );
    assert.notEqual(await deriveApplicableCheckCandidateRef(root), object);
    assert.equal(
      await deriveApplicableCheckObjectCandidateRef(root, head),
      object,
    );
    assert.equal(
      await deriveApplicableCheckObjectCandidateRef(root, head.toUpperCase()),
      null,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("old-domain successful fact cannot satisfy v2 candidate and check", async () => {
  const root = await createGitFixture();
  try {
    const input = await resolve(root, plan(declaration("old-domain")));
    const oldCheck = `check:sha256:${createHash("sha256")
      .update("flowkit-applicable-check")
      .update("\0")
      .update(JSON.stringify(declaration("old-domain")))
      .digest("hex")}`;
    const prior: ApplicableCheckPriorFact = {
      candidateRef: input.candidateRef,
      checkId: "old-domain",
      checkRef: oldCheck,
      status: "passed",
    };
    assert.notEqual(oldCheck, input.checks[0].checkRef);
    assert.equal(
      isApplicableCheckReuseEligible(
        input.candidateRef,
        input.checks[0],
        prior,
      ),
      false,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unsupported Git-visible path kinds fail candidate derivation closed", async () => {
  const root = await createGitFixture();
  try {
    const head = await git(root, "rev-parse", "HEAD");
    await git(
      root,
      "update-index",
      "--add",
      "--cacheinfo",
      `160000,${head},nested-repository`,
    );
    assert.equal(await deriveApplicableCheckCandidateRef(root), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("tracked and visible untracked read denial fail closed on the native host", async (t) => {
  for (const kind of ["tracked", "untracked"] as const) {
    await t.test(kind, async () => {
      const root = await createGitFixture();
      const entry =
        kind === "tracked"
          ? path.join(root, "source.txt")
          : path.join(root, "visible-untracked.txt");
      if (kind === "untracked") await writeFile(entry, "visible\n");
      await withUnreadableGuidanceFixture({
        root,
        entry,
        onCleanupOwnershipTaken: () => {},
        assertUnreadable: async () => {
          assert.equal(await deriveApplicableCheckCandidateRef(root), null);
        },
      });
    });
  }
});

test("unmerged index and SHA-256 repositories are rejected instead of partially projected", async (t) => {
  await t.test("unmerged index", async () => {
    const root = await createGitFixture();
    try {
      const initialBranch = await git(root, "branch", "--show-current");
      await git(root, "checkout", "-qb", "other");
      await writeFile(path.join(root, "source.txt"), "other\n");
      await git(root, "commit", "-qam", "other");
      await git(root, "checkout", initialBranch);
      await writeFile(path.join(root, "source.txt"), "current\n");
      await git(root, "commit", "-qam", "current");
      try {
        await git(root, "merge", "other");
      } catch {
        // The expected conflict leaves stage 1/2/3 entries for the reader.
      }
      assert.match(await git(root, "ls-files", "--unmerged"), /source\.txt/);
      assert.equal(await deriveApplicableCheckCandidateRef(root), null);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  await t.test("SHA-256 object format", async () => {
    const root = await mkdtemp(
      path.join(tmpdir(), "flowkit-sha256-repository-"),
    );
    try {
      await git(root, "init", "-q", "--object-format=sha256");
      await git(root, "config", "user.email", "flowkit@example.invalid");
      await git(root, "config", "user.name", "Flowkit Test");
      await writeFile(path.join(root, "source.txt"), "sha256\n");
      await git(root, "add", ".");
      await git(root, "commit", "-qm", "sha256 fixture");
      assert.equal(
        await git(root, "rev-parse", "--show-object-format"),
        "sha256",
      );
      assert.equal(await deriveApplicableCheckCandidateRef(root), null);
      assert.equal(
        await deriveApplicableCheckObjectCandidateRef(root, "a".repeat(40)),
        null,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
