import assert from "node:assert/strict";
import { execFile } from "node:child_process";
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

import {
  APPLICABLE_CHECK_FACTS_KEY,
  admitApplicableCheckActionResult,
  attachApplicableCheckFacts,
  deriveApplicableCheckCandidateRef,
  deriveApplicableCheckRef,
  executeApplicableChecks,
  isActionPackage,
  isApplicableCheckExecutionInput,
  isApplicableCheckPlanInput,
  isApplicableCheckReuseEligible,
  isRunResultRecord,
  readApplicableCheckFacts,
  resolveApplicableCheckExecutionInput,
  type ActionPackage,
  type ApplicableCheckDeclaration,
  type ApplicableCheckFactSet,
  type ApplicableCheckPlanInput,
  type ApplicableCheckPriorFact,
  type RunResultRecord,
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

function resultFor(
  pkg: ActionPackage,
  overrides: Partial<RunResultRecord> = {},
): RunResultRecord {
  return {
    runId: pkg.runId,
    actionIdentity: { ...pkg.actionIdentity },
    authorConclusion: "implemented",
    reviewerVerdict: null,
    verificationVerdict: null,
    nextBoundary: "review-apply",
    facts: { stable: true },
    ...overrides,
  };
}

function changedHashRef(ref: string): string {
  const last = ref.at(-1) === "0" ? "1" : "0";
  return `${ref.slice(0, -1)}${last}`;
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

test("tracked deletion is candidate material", async () => {
  const root = await createGitFixture();
  try {
    const first = await deriveApplicableCheckCandidateRef(root);
    await unlink(path.join(root, "source.txt"));
    const deleted = await deriveApplicableCheckCandidateRef(root);
    assert.notEqual(first, deleted);
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

test("exact runner records passed, failed, and process-failed facts", async () => {
  const root = await createGitFixture();
  try {
    const input = await resolve(
      root,
      plan(
        declaration("cwd-pass", {
          args: [
            "-e",
            `process.exit(process.cwd() === ${JSON.stringify(root)} ? 0 : 9)`,
          ],
        }),
        declaration("exit-seven", { args: ["-e", "process.exit(7)"] }),
        declaration("missing-program", {
          program: path.join(root, "definitely-missing-program"),
          args: [],
        }),
      ),
    );
    const facts = await executeApplicableChecks(root, input);
    assert.notEqual(facts, null);
    const byId = new Map(facts!.checks.map((fact) => [fact.checkId, fact]));
    assert.equal(byId.get("cwd-pass")?.status, "passed");
    assert.equal(byId.get("cwd-pass")?.exitCode, 0);
    assert.equal(byId.get("exit-seven")?.status, "failed");
    assert.equal(byId.get("exit-seven")?.exitCode, 7);
    assert.equal(byId.get("missing-program")?.status, "process-failed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reserved applicable-check facts remain inside existing RunResult facts", async () => {
  const root = await createGitFixture();
  try {
    const pkg = actionPackage();
    const input = await resolve(root, plan(declaration("typecheck")), pkg);
    const facts = await executeApplicableChecks(root, input);
    assert.notEqual(facts, null);
    const base = resultFor(pkg);
    assert.equal(isRunResultRecord(base), true);
    assert.equal(readApplicableCheckFacts(base), null);
    const attached = attachApplicableCheckFacts(base, facts);
    assert.notEqual(attached, null);
    assert.equal(isRunResultRecord(attached), true);
    assert.deepEqual(readApplicableCheckFacts(attached), facts);
    assert.equal(attached!.reviewerVerdict, null);
    assert.equal(attached!.verificationVerdict, null);
    assert.equal(Object.hasOwn(attached!, "applicableChecks"), false);
    assert.equal(
      Object.hasOwn(attached!.facts, APPLICABLE_CHECK_FACTS_KEY),
      true,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("explicit exact prior success reuses, while failed or stale prior facts execute", async () => {
  const root = await createGitFixture();
  try {
    const input = await resolve(root, plan(declaration("typecheck")));
    const check = input.checks[0];
    const exactPrior: ApplicableCheckPriorFact = {
      candidateRef: input.candidateRef,
      checkId: check.checkId,
      checkRef: check.checkRef,
      status: "passed",
    };
    assert.equal(
      isApplicableCheckReuseEligible(input.candidateRef, check, exactPrior),
      true,
    );
    const reused = await executeApplicableChecks(root, input, [exactPrior]);
    assert.equal(reused?.checks[0].status, "reused-passed");

    const reusedPrior = { ...exactPrior, status: "reused-passed" as const };
    assert.equal(
      isApplicableCheckReuseEligible(input.candidateRef, check, reusedPrior),
      false,
    );
    const rerunFromReused = await executeApplicableChecks(root, input, [
      reusedPrior,
    ]);
    assert.equal(rerunFromReused?.checks[0].status, "passed");

    const failedPrior = { ...exactPrior, status: "failed" as const };
    const executed = await executeApplicableChecks(root, input, [failedPrior]);
    assert.equal(executed?.checks[0].status, "passed");

    const stalePrior = {
      ...exactPrior,
      candidateRef: changedHashRef(input.candidateRef),
    };
    const staleExecuted = await executeApplicableChecks(root, input, [
      stalePrior,
    ]);
    assert.equal(staleExecuted?.checks[0].status, "passed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reused-passed prior never recursively reuses and current check really executes", async () => {
  const root = await createGitFixture();
  try {
    const input = await resolve(
      root,
      plan(
        declaration("recursive-reuse-proof", {
          args: ["-e", "process.exit(7)"],
        }),
      ),
    );
    const check = input.checks[0];
    const reusedPrior: ApplicableCheckPriorFact = {
      candidateRef: input.candidateRef,
      checkId: check.checkId,
      checkRef: check.checkRef,
      status: "reused-passed",
    };

    assert.equal(
      isApplicableCheckReuseEligible(input.candidateRef, check, reusedPrior),
      false,
    );
    const facts = await executeApplicableChecks(root, input, [reusedPrior]);
    assert.equal(facts?.checks[0].status, "failed");
    assert.equal(facts?.checks[0].exitCode, 7);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("config/tool/environment drift makes prior success ineligible", async () => {
  const root = await createGitFixture();
  try {
    const first = await resolve(root, plan(declaration("typecheck")));
    const prior: ApplicableCheckPriorFact = {
      candidateRef: first.candidateRef,
      checkId: first.checks[0].checkId,
      checkRef: first.checks[0].checkRef,
      status: "passed",
    };
    for (const changed of [
      declaration("typecheck", { configRefs: ["config:other"] }),
      declaration("typecheck", { toolRefs: ["tool:other"] }),
      declaration("typecheck", { environmentRefs: ["environment:windows"] }),
    ]) {
      const next = await resolve(root, plan(changed));
      assert.notEqual(next.checks[0].checkRef, prior.checkRef);
      assert.equal(
        isApplicableCheckReuseEligible(
          next.candidateRef,
          next.checks[0],
          prior,
        ),
        false,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("admission accepts exact complete facts and rechecks current candidate", async () => {
  const root = await createGitFixture();
  try {
    const pkg = actionPackage();
    const input = await resolve(
      root,
      plan(
        declaration("a"),
        declaration("b", { args: ["-e", "process.exit(0)", "b"] }),
      ),
      pkg,
    );
    const facts = await executeApplicableChecks(root, input);
    const candidate = attachApplicableCheckFacts(resultFor(pkg), facts);
    assert.notEqual(candidate, null);
    const currentAction = {
      identity: { ...pkg.actionIdentity },
      state: "prepared" as const,
    };
    const admitted = await admitApplicableCheckActionResult(
      root,
      input,
      pkg,
      currentAction,
      pkg.occurrence,
      candidate,
    );
    assert.notEqual(admitted, null);

    await writeFile(path.join(root, "source.txt"), "drift\n", "utf8");
    assert.equal(
      await admitApplicableCheckActionResult(
        root,
        input,
        pkg,
        currentAction,
        pkg.occurrence,
        candidate,
      ),
      null,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("admission rejects execution/candidate/fact-set mismatches", async () => {
  const root = await createGitFixture();
  try {
    const pkg = actionPackage();
    const input = await resolve(
      root,
      plan(declaration("a"), declaration("b")),
      pkg,
    );
    const facts = (await executeApplicableChecks(root, input))!;
    const currentAction = {
      identity: { ...pkg.actionIdentity },
      state: "prepared" as const,
    };

    async function rejects(mutated: ApplicableCheckFactSet) {
      const candidate = attachApplicableCheckFacts(resultFor(pkg), mutated);
      assert.notEqual(candidate, null);
      assert.equal(
        await admitApplicableCheckActionResult(
          root,
          input,
          pkg,
          currentAction,
          pkg.occurrence,
          candidate,
        ),
        null,
      );
    }

    await rejects({
      ...facts,
      executionInputRef: changedHashRef(facts.executionInputRef),
    });
    await rejects({
      ...facts,
      candidateRef: changedHashRef(facts.candidateRef),
    });
    await rejects({ ...facts, checks: facts.checks.slice(0, 1) });
    await rejects({
      ...facts,
      checks: [
        {
          ...facts.checks[0],
          checkRef: changedHashRef(facts.checks[0].checkRef),
        },
        facts.checks[1],
      ],
    });
    await rejects({
      ...facts,
      checks: [{ ...facts.checks[0], checkId: "unexpected" }, facts.checks[1]],
    });

    const duplicateRawResult = resultFor(pkg, {
      facts: JSON.parse(
        JSON.stringify({
          [APPLICABLE_CHECK_FACTS_KEY]: {
            executionInputRef: facts.executionInputRef,
            candidateRef: facts.candidateRef,
            checks: [facts.checks[0], facts.checks[0]],
          },
        }),
      ),
    });
    assert.equal(isRunResultRecord(duplicateRawResult), false);
    assert.equal(
      await admitApplicableCheckActionResult(
        root,
        input,
        pkg,
        currentAction,
        pkg.occurrence,
        duplicateRawResult,
      ),
      null,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reuse never scans Run history and current Result records explicit reused-passed", async () => {
  const root = await createGitFixture();
  try {
    const failingCheck = declaration("history-proof", {
      args: ["-e", "process.exit(7)"],
    });
    const input = await resolve(root, plan(failingCheck));
    await mkdir(path.join(root, ".flowkit", "runs", "historical"), {
      recursive: true,
    });
    await writeFile(
      path.join(root, ".flowkit", "runs", "historical", "result.json"),
      JSON.stringify({
        candidateRef: input.candidateRef,
        checkId: input.checks[0].checkId,
        checkRef: input.checks[0].checkRef,
        status: "passed",
      }),
      "utf8",
    );
    const withoutExplicitPrior = await executeApplicableChecks(root, input);
    assert.equal(withoutExplicitPrior?.checks[0].status, "failed");

    const explicitPrior: ApplicableCheckPriorFact = {
      candidateRef: input.candidateRef,
      checkId: input.checks[0].checkId,
      checkRef: input.checks[0].checkRef,
      status: "passed",
    };
    const withExplicitPrior = await executeApplicableChecks(root, input, [
      explicitPrior,
    ]);
    assert.equal(withExplicitPrior?.checks[0].status, "reused-passed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("mechanical applicable-check success does not create review/verification/owner/policy authority", async () => {
  const root = await createGitFixture();
  try {
    const pkg = actionPackage();
    const input = await resolve(root, plan(declaration("typecheck")), pkg);
    const facts = await executeApplicableChecks(root, input);
    const base = resultFor(pkg, {
      authorConclusion: null,
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: null,
    });
    const attached = attachApplicableCheckFacts(base, facts);
    assert.notEqual(attached, null);
    assert.equal(attached!.authorConclusion, null);
    assert.equal(attached!.reviewerVerdict, null);
    assert.equal(attached!.verificationVerdict, null);
    assert.equal(attached!.nextBoundary, null);
    assert.equal(pkg.ownerAuthority, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
