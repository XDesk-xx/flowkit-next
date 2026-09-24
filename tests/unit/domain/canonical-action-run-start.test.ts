import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildRunAddress,
  formActionPackage,
  isActionPackage,
  readDurableRun,
  resolveActionGuidanceRef,
  startCanonicalActionRun,
  transitionCurrentAction,
  type RunAddressInput,
  type RunContextRecord,
} from "../../../src/domain/index.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";

async function fixture() {
  const repositoryRoot = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-start-target-"),
  );
  const managerRoot = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-start-manager-"),
  );
  const entry = path.join(
    managerRoot,
    "skills",
    "actions",
    "apply",
    "SKILL.md",
  );
  await mkdir(path.dirname(entry), { recursive: true });
  await writeFile(entry, "# apply A\n");
  const occurrence = {
    date: "20260924",
    sequence: 1,
    actionId: "apply" as const,
  };
  const actionIdentity = {
    deliveryId: "delivery-one",
    changeId: "change-one",
    actionId: "apply" as const,
  };
  const input: RunAddressInput = {
    repositoryRoot,
    deliveryId: actionIdentity.deliveryId,
    changeId: actionIdentity.changeId,
    changeStartSequence: 1,
    occurrence,
  };
  const currentAction = transitionCurrentAction(null, {
    type: "prepare",
    identity: actionIdentity,
  })!;
  const context: RunContextRecord = {
    runId: "20260924-001-apply",
    occurrence,
    actionIdentity,
    role: "author",
    lifecycleState: "prepared",
    ownerAuthority: null,
    previousRunId: null,
  };
  const cleanup = async () => {
    await rm(repositoryRoot, { recursive: true, force: true });
    await rm(managerRoot, { recursive: true, force: true });
  };
  return {
    repositoryRoot,
    managerRoot,
    entry,
    input,
    currentAction,
    context,
    cleanup,
  };
}

test("trusted start writes current manager Guidance in the held package and action.md", async () => {
  const f = await fixture();
  try {
    const expected = await resolveActionGuidanceRef(
      fixtureInstallation(f.managerRoot),
      "apply",
    );
    assert.ok(expected);
    let preparedPackageSha: string | null = null;
    const held = await startCanonicalActionRun(
      fixtureInstallation(f.managerRoot),
      f.input,
      f.currentAction,
      f.context,
      expected,
      (actionPackage) => {
        preparedPackageSha = actionPackage.guidanceRef.contentSha256;
        return "ready";
      },
    );
    assert.equal(
      held.actionPackage.guidanceRef.contentSha256,
      preparedPackageSha,
    );
    assert.deepEqual(held.actionPackage.guidanceRef, expected);
    assert.deepEqual(await readdir(held.directory), ["action.md"]);
    assert.equal(
      await readFile(path.join(held.directory, "action.md"), "utf8"),
      held.actionMarkdown,
    );
    assert.deepEqual(
      JSON.parse(held.actionMarkdown.slice("# Action started\n\n".length))
        .actionPackage,
      held.actionPackage,
    );
    await assert.rejects(readDurableRun(f.input), /Incomplete Run/);
    await assert.rejects(
      startCanonicalActionRun(
        fixtureInstallation(f.managerRoot),
        f.input,
        f.currentAction,
        f.context,
        expected,
        () => "ready",
      ),
      /sequence already exists/,
    );
    assert.equal(
      await readFile(path.join(held.directory, "action.md"), "utf8"),
      held.actionMarkdown,
    );
  } finally {
    await f.cleanup();
  }
});

test("forged and wrong-Action hashes are shape-valid but rejected before target Run creation", async () => {
  const f = await fixture();
  try {
    const wrongActionEntry = path.join(
      f.managerRoot,
      "skills",
      "actions",
      "review-apply",
      "SKILL.md",
    );
    await mkdir(path.dirname(wrongActionEntry), { recursive: true });
    await writeFile(wrongActionEntry, "# review apply\n");
    const wrongActionSha = createHash("sha256")
      .update(await readFile(wrongActionEntry))
      .digest("hex");
    const address = buildRunAddress(f.input)!;
    for (const sha of ["a".repeat(64), wrongActionSha]) {
      const forged = {
        path: "skills/actions/apply/SKILL.md",
        contentSha256: sha,
      };
      assert.equal(
        isActionPackage(formActionPackage(f.currentAction, f.context, forged)),
        true,
      );
      await assert.rejects(
        startCanonicalActionRun(
          fixtureInstallation(f.managerRoot),
          f.input,
          f.currentAction,
          f.context,
          forged,
          () => "ready",
        ),
        /Expected Guidance differs/,
      );
      await assert.rejects(readdir(address.runDirectory), { code: "ENOENT" });
    }
  } finally {
    await f.cleanup();
  }
});

test("manager replacement and sequential content drift reject before target Run creation", async () => {
  const f = await fixture();
  const otherManager = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-start-manager-b-"),
  );
  try {
    const expected = await resolveActionGuidanceRef(
      fixtureInstallation(f.managerRoot),
      "apply",
    );
    assert.ok(expected);
    const otherEntry = path.join(
      otherManager,
      "skills",
      "actions",
      "apply",
      "SKILL.md",
    );
    await mkdir(path.dirname(otherEntry), { recursive: true });
    await writeFile(otherEntry, "# apply B\n");
    await assert.rejects(
      startCanonicalActionRun(
        fixtureInstallation(otherManager),
        f.input,
        f.currentAction,
        f.context,
        expected,
        () => "ready",
      ),
      /Expected Guidance differs/,
    );
    await assert.rejects(readdir(buildRunAddress(f.input)!.runDirectory), {
      code: "ENOENT",
    });
    await assert.rejects(
      startCanonicalActionRun(
        fixtureInstallation(f.managerRoot),
        f.input,
        f.currentAction,
        f.context,
        expected,
        async () => {
          await writeFile(f.entry, "# changed after readiness\n");
          return "ready" as const;
        },
      ),
      /Manager Guidance changed/,
    );
    await assert.rejects(readdir(buildRunAddress(f.input)!.runDirectory), {
      code: "ENOENT",
    });
    await writeFile(otherEntry, "# apply A\n");
    await writeFile(f.entry, "# apply A\n");
    const held = await startCanonicalActionRun(
      fixtureInstallation(otherManager),
      f.input,
      f.currentAction,
      f.context,
      expected,
      () => "ready",
    );
    assert.deepEqual(held.actionPackage.guidanceRef, expected);
  } finally {
    await rm(otherManager, { recursive: true, force: true });
    await f.cleanup();
  }
});

test("missing, non-regular, blocked, and mismatched starts leave no target Run", async (t) => {
  const f = await fixture();
  try {
    const installation = fixtureInstallation(f.managerRoot);
    const expected = await resolveActionGuidanceRef(installation, "apply");
    assert.ok(expected);
    const address = buildRunAddress(f.input)!;
    for (const [context, input] of [
      [{ ...f.context, role: "reviewer" }, f.input],
      [f.context, { ...f.input, changeId: "other-change" }],
      [
        f.context,
        { ...f.input, occurrence: { ...f.input.occurrence, sequence: 2 } },
      ],
    ] as const) {
      await assert.rejects(
        startCanonicalActionRun(
          installation,
          input,
          f.currentAction,
          context,
          expected,
          () => "ready",
        ),
      );
      await assert.rejects(readdir(buildRunAddress(input)!.runDirectory), {
        code: "ENOENT",
      });
    }
    await assert.rejects(
      startCanonicalActionRun(
        installation,
        f.input,
        f.currentAction,
        f.context,
        expected,
        () => "blocked",
      ),
      /preparation blocked/,
    );
    await rm(f.entry);
    await assert.rejects(
      startCanonicalActionRun(
        installation,
        f.input,
        f.currentAction,
        f.context,
        expected,
        () => "ready",
      ),
      /Guidance unavailable/,
    );
    await mkdir(f.entry);
    await assert.rejects(
      startCanonicalActionRun(
        installation,
        f.input,
        f.currentAction,
        f.context,
        expected,
        () => "ready",
      ),
      /Guidance unavailable/,
    );
    await rm(f.entry, { recursive: true });
    await writeFile(path.join(f.managerRoot, "target.md"), "# target\n");
    try {
      await symlink(path.join(f.managerRoot, "target.md"), f.entry, "file");
    } catch (error) {
      if (
        ["EPERM", "EACCES", "UNKNOWN"].includes(
          (error as NodeJS.ErrnoException).code ?? "",
        )
      ) {
        t.diagnostic("host does not permit symlink fixtures");
      } else {
        throw error;
      }
    }
    await assert.rejects(
      startCanonicalActionRun(
        installation,
        f.input,
        f.currentAction,
        f.context,
        expected,
        () => "ready",
      ),
      /Guidance unavailable/,
    );
    await assert.rejects(readdir(address.runDirectory), { code: "ENOENT" });
  } finally {
    await f.cleanup();
  }
});

test("historical Run remains readable after manager Skill changes", async () => {
  const f = await fixture();
  try {
    const installation = fixtureInstallation(f.managerRoot);
    const oldRef = await resolveActionGuidanceRef(installation, "apply");
    assert.ok(oldRef);
    const held = await startCanonicalActionRun(
      installation,
      f.input,
      f.currentAction,
      f.context,
      oldRef,
      () => "ready",
    );
    const terminalContext = {
      ...f.context,
      lifecycleState: "terminal" as const,
    };
    const result = {
      runId: f.context.runId,
      actionIdentity: f.context.actionIdentity,
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-apply",
      facts: { synthetic: true },
    };
    await writeFile(
      path.join(held.directory, "context.json"),
      JSON.stringify(terminalContext) + "\n",
      { flag: "wx" },
    );
    await writeFile(
      path.join(held.directory, "result.json"),
      JSON.stringify(result) + "\n",
      { flag: "wx" },
    );
    const before = await readFile(path.join(held.directory, "action.md"));
    await writeFile(f.entry, "# apply B\n");
    const currentRef = await resolveActionGuidanceRef(installation, "apply");
    assert.notDeepEqual(currentRef, oldRef);
    const historical = await readDurableRun(f.input);
    assert.equal(historical.actionMarkdown, held.actionMarkdown);
    assert.deepEqual(
      await readFile(path.join(held.directory, "action.md")),
      before,
    );
    const nextOccurrence = { ...f.input.occurrence, sequence: 2 };
    const nextInput = { ...f.input, occurrence: nextOccurrence };
    const nextContext = {
      ...f.context,
      runId: "20260924-002-apply",
      occurrence: nextOccurrence,
      previousRunId: f.context.runId,
    };
    await assert.rejects(
      startCanonicalActionRun(
        installation,
        nextInput,
        f.currentAction,
        nextContext,
        oldRef,
        () => "ready",
      ),
      /Expected Guidance differs/,
    );
    assert.deepEqual(
      await readFile(path.join(held.directory, "action.md")),
      before,
    );
  } finally {
    await f.cleanup();
  }
});

test("readiness cannot mutate the held package or controlled address before writing", async () => {
  for (const mutation of ["package", "address"]) {
    const f = await fixture();
    try {
      const installation = fixtureInstallation(f.managerRoot);
      const expected = await resolveActionGuidanceRef(installation, "apply");
      assert.ok(expected);
      const originalAddress = buildRunAddress(f.input)!;
      await assert.rejects(
        startCanonicalActionRun(
          installation,
          f.input,
          f.currentAction,
          f.context,
          expected,
          (actionPackage) => {
            if (mutation === "package") {
              Object.assign(actionPackage.guidanceRef, {
                contentSha256: "a".repeat(64),
              });
            } else {
              Object.assign(f.input, { changeId: "other-change" });
            }
            return "ready";
          },
        ),
        /package or address changed/,
      );
      await assert.rejects(readdir(originalAddress.runDirectory), {
        code: "ENOENT",
      });
    } finally {
      await f.cleanup();
    }
  }
});
