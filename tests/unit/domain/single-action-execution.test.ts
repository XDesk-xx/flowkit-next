import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";

import {
  admitActionResult,
  canonicalActionGuidancePath,
  formActionPackage,
  invokeSingleAction,
  type ActionGuidanceRef,
  type ActionIdentity,
  type CurrentAction,
  type RunContextRecord,
  type RunOccurrence,
  type RunResultRecord,
} from "../../../src/domain/index.js";

const deliveryId = "20260824-01-foundation-lifecycle-kernel";
const changeId = "establish-single-action-execution-terminal-boundary";

const applyIdentity: ActionIdentity = {
  deliveryId,
  changeId,
  actionId: "apply",
};
const reviewIdentity: ActionIdentity = {
  deliveryId,
  changeId,
  actionId: "review-apply",
};
const archiveIdentity: ActionIdentity = {
  deliveryId,
  changeId,
  actionId: "archive",
};

let guidanceRoot = "";

before(async () => {
  guidanceRoot = await mkdtemp(
    path.join(tmpdir(), "flowkit-single-action-guidance-"),
  );
  for (const actionId of ["apply", "review-apply", "archive"] as const) {
    const entry = path.join(
      guidanceRoot,
      "skills",
      "actions",
      actionId,
      "SKILL.md",
    );
    await mkdir(path.dirname(entry), { recursive: true });
    await writeFile(entry, `# ${actionId}\n`, "utf8");
  }
});

after(async () => {
  if (guidanceRoot.length > 0) {
    await rm(guidanceRoot, { recursive: true, force: true });
  }
});

function guidanceRef(actionId: "apply" | "review-apply"): ActionGuidanceRef {
  return {
    path: canonicalActionGuidancePath(actionId)!,
    contentSha256: "a".repeat(64),
  };
}

function occurrence(
  sequence: number,
  actionId: "apply" | "review-apply",
): RunOccurrence {
  return { date: "20260826", sequence, actionId };
}

function runId(sequence: number, actionId: "apply" | "review-apply"): string {
  return `20260826-${String(sequence).padStart(3, "0")}-${actionId}`;
}

function context(
  sequence: number,
  identity: ActionIdentity = applyIdentity,
): RunContextRecord {
  return {
    runId: runId(sequence, identity.actionId as "apply" | "review-apply"),
    occurrence: occurrence(
      sequence,
      identity.actionId as "apply" | "review-apply",
    ),
    actionIdentity: identity,
    role: identity.actionId === "review-apply" ? "reviewer" : "author",
    lifecycleState: "prepared",
    ownerAuthority: null,
    previousRunId: null,
  };
}

function result(
  sequence: number,
  identity: ActionIdentity = applyIdentity,
  options: Partial<RunResultRecord> = {},
): RunResultRecord {
  const reviewer = identity.actionId === "review-apply";
  return {
    runId: runId(sequence, identity.actionId as "apply" | "review-apply"),
    actionIdentity: identity,
    authorConclusion: reviewer ? null : "PASS",
    reviewerVerdict: reviewer ? "approved" : null,
    verificationVerdict: null,
    nextBoundary: reviewer ? "archive" : "review-apply",
    facts: { stable: true },
    ...options,
  };
}

function prepared(identity: ActionIdentity = applyIdentity): CurrentAction {
  return { identity, state: "prepared" };
}

function terminal(identity: ActionIdentity = applyIdentity): CurrentAction {
  return { identity, state: "terminal" };
}

test("internally prepares an empty slot and completes one invocation", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    guidanceRoot,
    null,
    applyIdentity,
    context(54),
    (actionPackage) => {
      calls += 1;
      assert.equal(actionPackage.lifecycleState, "prepared");
      assert.equal(
        actionPackage.guidanceRef.path,
        "skills/actions/apply/SKILL.md",
      );
      return result(54);
    },
  );

  assert.equal(calls, 1);
  assert.equal(outcome.status, "terminal");
  assert.deepEqual(outcome.currentAction, terminal());
  assert.equal(outcome.nextBoundary, "review-apply");
});

test("reuses exact prepared A without duplicate prepare", async () => {
  const current = prepared();
  const outcome = await invokeSingleAction(
    guidanceRoot,
    current,
    { ...applyIdentity },
    context(54),
    () => result(54),
  );

  assert.equal(outcome.status, "terminal");
  assert.equal(current.state, "prepared");
});

test("prepares a different target after terminal but rejects a different target over prepared", async () => {
  const afterTerminal = await invokeSingleAction(
    guidanceRoot,
    terminal(reviewIdentity),
    applyIdentity,
    context(54),
    () => result(54),
  );
  assert.equal(afterTerminal.status, "terminal");

  let calls = 0;
  const rejected = await invokeSingleAction(
    guidanceRoot,
    prepared(reviewIdentity),
    applyIdentity,
    context(54),
    () => {
      calls += 1;
      return result(54);
    },
  );
  assert.equal(rejected.status, "failed");
  assert.equal(rejected.reason, "entry-rejected");
  assert.equal(calls, 0);
});

test("package formation failure invokes host callback zero times", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    guidanceRoot,
    prepared(),
    applyIdentity,
    context(54, reviewIdentity),
    () => {
      calls += 1;
      return result(54);
    },
  );

  assert.equal(outcome.status, "failed");
  assert.equal(outcome.reason, "package-formation-rejected");
  assert.deepEqual(outcome.currentAction, prepared());
  assert.equal(calls, 0);
});

test("missing canonical Guidance fails package formation before callback", async () => {
  const emptyRoot = await mkdtemp(
    path.join(tmpdir(), "flowkit-single-action-missing-guidance-"),
  );
  try {
    await mkdir(path.join(emptyRoot, ".agents", "skills", "apply"), {
      recursive: true,
    });
    await writeFile(
      path.join(emptyRoot, ".agents", "skills", "apply", "SKILL.md"),
      "# bootstrap only\n",
      "utf8",
    );

    let calls = 0;
    const outcome = await invokeSingleAction(
      emptyRoot,
      prepared(),
      applyIdentity,
      context(54),
      () => {
        calls += 1;
        return result(54);
      },
    );

    assert.equal(outcome.status, "failed");
    assert.equal(outcome.reason, "package-formation-rejected");
    assert.equal(calls, 0);
  } finally {
    await rm(emptyRoot, { recursive: true, force: true });
  }
});

test("callback failure preserves prepared Action and stops", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    guidanceRoot,
    prepared(),
    applyIdentity,
    context(54),
    () => {
      calls += 1;
      throw new Error("host failed");
    },
  );

  assert.equal(calls, 1);
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.reason, "execution-failed");
  assert.deepEqual(outcome.currentAction, prepared());
});

test("admission failure leaves exact Action prepared and executes callback only once", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    guidanceRoot,
    prepared(),
    applyIdentity,
    context(54),
    () => {
      calls += 1;
      return result(55);
    },
  );

  assert.equal(calls, 1);
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.reason, "result-admission-rejected");
  assert.deepEqual(outcome.currentAction, prepared());
});

test("later invocation reuses same prepared A with a new Run occurrence", async () => {
  const current = prepared();

  const first = await invokeSingleAction(
    guidanceRoot,
    current,
    applyIdentity,
    context(54),
    () => result(55),
  );
  assert.equal(first.status, "failed");
  assert.deepEqual(first.currentAction, current);

  const stalePackage = formActionPackage(
    current,
    context(54),
    guidanceRef("apply"),
  )!;
  assert.equal(
    admitActionResult(
      stalePackage,
      current,
      occurrence(55, "apply"),
      result(54),
    ),
    null,
  );

  let secondCalls = 0;
  const second = await invokeSingleAction(
    guidanceRoot,
    current,
    applyIdentity,
    context(55),
    () => {
      secondCalls += 1;
      return result(55);
    },
  );
  assert.equal(secondCalls, 1);
  assert.equal(second.status, "terminal");
  assert.deepEqual(second.currentAction, terminal());
});

test("package-bound preparation uses the same exact ActionPackage identity as execution", async () => {
  let preparedPackage: unknown = null;
  let executedPackage: unknown = null;
  const outcome = await invokeSingleAction(
    guidanceRoot,
    null,
    applyIdentity,
    context(54),
    (actionPackage) => {
      executedPackage = actionPackage;
      return result(54);
    },
    (actionPackage) => {
      preparedPackage = actionPackage;
      return "ready";
    },
  );

  assert.equal(outcome.status, "terminal");
  assert.notEqual(preparedPackage, null);
  assert.equal(preparedPackage, executedPackage);
});

test("blocked preparation discards a newly staged prepared Action and skips execution", async () => {
  let executionCalls = 0;
  const prior = terminal(reviewIdentity);
  const archiveContext: RunContextRecord = {
    runId: "20260826-055-archive",
    occurrence: { date: "20260826", sequence: 55, actionId: "archive" },
    actionIdentity: archiveIdentity,
    role: "author",
    lifecycleState: "prepared",
    ownerAuthority: null,
    previousRunId: null,
  };
  const outcome = await invokeSingleAction(
    guidanceRoot,
    prior,
    archiveIdentity,
    archiveContext,
    () => {
      executionCalls += 1;
      throw new Error("must not execute");
    },
    () => "blocked",
  );

  assert.equal(outcome.status, "failed");
  assert.equal(outcome.reason, "preparation-blocked");
  assert.deepEqual(outcome.currentAction, prior);
  assert.equal(executionCalls, 0);
});

test("preparation failure preserves an already-prepared Action for retry", async () => {
  const current = prepared();
  let executionCalls = 0;
  const outcome = await invokeSingleAction(
    guidanceRoot,
    current,
    applyIdentity,
    context(54),
    () => {
      executionCalls += 1;
      return result(54);
    },
    () => {
      throw new Error("readiness failed");
    },
  );
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.reason, "preparation-blocked");
  assert.deepEqual(outcome.currentAction, current);
  assert.equal(executionCalls, 0);
});

test("pre-preparation package failures do not leak a newly staged prepared Action", async () => {
  let preparationCalls = 0;
  let executionCalls = 0;
  const prior = terminal(reviewIdentity);

  const invalidContext = await invokeSingleAction(
    guidanceRoot,
    prior,
    applyIdentity,
    { bad: true },
    () => {
      executionCalls += 1;
      return result(54);
    },
    () => {
      preparationCalls += 1;
      return "ready";
    },
  );
  assert.equal(invalidContext.status, "failed");
  assert.equal(invalidContext.reason, "package-formation-rejected");
  assert.deepEqual(invalidContext.currentAction, prior);

  const mismatchedContext = await invokeSingleAction(
    guidanceRoot,
    prior,
    applyIdentity,
    context(54, reviewIdentity),
    () => {
      executionCalls += 1;
      return result(54);
    },
    () => {
      preparationCalls += 1;
      return "ready";
    },
  );
  assert.equal(mismatchedContext.status, "failed");
  assert.equal(mismatchedContext.reason, "package-formation-rejected");
  assert.deepEqual(mismatchedContext.currentAction, prior);

  const missingGuidanceRoot = await mkdtemp(
    path.join(tmpdir(), "flowkit-staged-missing-guidance-"),
  );
  try {
    const missingGuidance = await invokeSingleAction(
      missingGuidanceRoot,
      prior,
      applyIdentity,
      context(54),
      () => {
        executionCalls += 1;
        return result(54);
      },
      () => {
        preparationCalls += 1;
        return "ready";
      },
    );
    assert.equal(missingGuidance.status, "failed");
    assert.equal(missingGuidance.reason, "package-formation-rejected");
    assert.deepEqual(missingGuidance.currentAction, prior);
  } finally {
    await rm(missingGuidanceRoot, { recursive: true, force: true });
  }

  assert.equal(preparationCalls, 0);
  assert.equal(executionCalls, 0);
});

test("successful invocation preserves opaque nextBoundary and never executes a second callback", async () => {
  let calls = 0;
  const outcome = await invokeSingleAction(
    guidanceRoot,
    prepared(),
    applyIdentity,
    context(54),
    () => {
      calls += 1;
      return result(54, applyIdentity, { nextBoundary: "review-apply" });
    },
  );

  assert.equal(calls, 1);
  assert.equal(outcome.status, "terminal");
  assert.equal(outcome.nextBoundary, "review-apply");
});
