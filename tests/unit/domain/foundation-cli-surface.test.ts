import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { executeFoundationCliRequest } from "../../../src/cli/foundation-cli.js";
import { evaluateCheckpointAuthorization } from "../../../src/cli/checkpoint-authorization.js";
import {
  FoundationCliInputError,
  parseFoundationCliArguments,
  parseFoundationCliRequest,
} from "../../../src/cli/request.js";
import {
  writeDurableRun,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";
import { contextFixture } from "./action-context-fixture.js";
const DELIVERY = "delivery-one";
const CHANGE = "change-one";

test("closed requests resolve current and reject legacy selectors and caller authority overrides", () => {
  assert.deepEqual(
    parseFoundationCliArguments(["status", "--input", "r.json"]),
    { command: "status", inputPath: "r.json" },
  );
  assert.throws(
    () => parseFoundationCliArguments(["archive", "--input", "r.json"]),
    FoundationCliInputError,
  );
  const common = { repositoryRoot: "/repo", flowkitHome: "/home" };
  assert.equal(parseFoundationCliRequest("next", common).command, "next");
  for (const field of [
    "currentRunId",
    "changeStartSequence",
    "changeState",
    "managerRoot",
    "guidanceFile",
  ]) {
    assert.throws(
      () => parseFoundationCliRequest("next", { ...common, [field]: null }),
      FoundationCliInputError,
    );
  }
  assert.throws(
    () =>
      parseFoundationCliRequest("doctor", { ...common, deliveryId: DELIVERY }),
    FoundationCliInputError,
  );
});

test("next empty target reaches Explore; unrelated high Run cannot be hidden by caller null", async () => {
  const f = await contextFixture();
  const request = {
    repositoryRoot: f.repositoryRoot,
    flowkitHome: f.flowkitHome,
  };
  try {
    assert.deepEqual(
      await executeFoundationCliRequest({ command: "next", request }),
      {
        kind: "next",
        decision: { kind: "ready-action", actionId: "explore" },
        checkpoint: { authorized: false, reason: "policy-not-ready" },
      },
    );
    await mkdir(
      path.join(
        f.repositoryRoot,
        ".flowkit",
        "runs",
        DELIVERY,
        "001-change-one",
        "20260908-999-archive",
      ),
      { recursive: true },
    );
    await assert.rejects(
      executeFoundationCliRequest({ command: "next", request }),
      /Incomplete Run/,
    );
  } finally {
    await f.cleanup();
  }
});

test("status and next read exact terminal without Run selectors or unrelated proof inspection", async () => {
  const f = await contextFixture();
  try {
    const occurrence = {
      date: "20260908",
      sequence: 1,
      actionId: "explore" as const,
    };
    const runId = "20260908-001-explore";
    const actionIdentity = {
      deliveryId: DELIVERY,
      changeId: CHANGE,
      actionId: "explore" as const,
    };
    await writeDurableRun(
      {
        repositoryRoot: f.repositoryRoot,
        deliveryId: DELIVERY,
        changeId: CHANGE,
        changeStartSequence: 9,
        occurrence,
      },
      {
        actionMarkdown: "# Fixture\n",
        context: {
          runId,
          occurrence,
          actionIdentity,
          role: "author",
          lifecycleState: "terminal",
          ownerAuthority: null,
          previousRunId: null,
        },
        result: {
          runId,
          actionIdentity,
          authorConclusion: "PASS",
          reviewerVerdict: null,
          verificationVerdict: null,
          nextBoundary: "review-explore",
          facts: {
            proofRefs: [
              { path: ".flowkit/artifacts/missing/obsolete-proof.txt" },
            ],
            note: "synthetic old proof is irrelevant to Policy, not evidence of PASS",
          },
        },
      },
    );
    const request = {
      repositoryRoot: f.repositoryRoot,
      flowkitHome: f.flowkitHome,
    };
    const recordPath = path.join(
      f.repositoryRoot,
      ".flowkit",
      "runs",
      DELIVERY,
      "009-change-one",
      runId,
      "result.json",
    );
    const originalRecord = await readFile(recordPath);
    const status = await executeFoundationCliRequest({
      command: "status",
      request,
    });
    assert.equal(status.kind, "status");
    assert.equal(status.currentRun?.runId, runId);
    assert.equal(status.status, "current");
    assert.equal(status.openSpec.exactChange?.changeId, CHANGE);
    const next = await executeFoundationCliRequest({
      command: "next",
      request,
    });
    assert.equal(next.kind, "next");
    assert.deepEqual(next.decision, {
      kind: "ready-action",
      actionId: "review-explore",
    });
    assert.deepEqual(await readFile(recordPath), originalRecord);
    await f.manifest(DELIVERY, CHANGE, "planned");
    await assert.rejects(
      executeFoundationCliRequest({
        command: "status",
        request: { ...request, changeId: CHANGE },
      }),
      /Planned Change has/,
    );
  } finally {
    await f.cleanup();
  }
});

test("planned next stays formal blocked; doctor retains bounded tool diagnostics", async () => {
  const f = await contextFixture();
  try {
    await f.manifest(DELIVERY, CHANGE, "planned");
    const request = {
      repositoryRoot: f.repositoryRoot,
      flowkitHome: f.flowkitHome,
    };
    const blocked = await executeFoundationCliRequest({
      command: "next",
      request: { ...request, changeId: CHANGE },
    });
    assert.equal(blocked.kind, "next");
    assert.deepEqual(blocked.decision, {
      kind: "blocked",
      reason: "change-not-active",
    });
    const doctor = await executeFoundationCliRequest({
      command: "doctor",
      request,
    });
    assert.equal(doctor.kind, "doctor");
    assert.equal(doctor.status, "pass");
    assert.deepEqual(
      doctor.diagnostics.map((item) => item.id),
      ["openspec-runtime", "openspec-root"],
    );
    await writeFile(
      path.join(f.flowkitHome, "tools", "openspec", "1.10.0", "package.json"),
      "{}",
    );
    const failed = await executeFoundationCliRequest({
      command: "doctor",
      request,
    });
    assert.equal(failed.kind, "doctor");
    assert.equal(failed.status, "fail");
  } finally {
    await f.cleanup();
  }
});

test("checkpoint authorization is exact, pure, and never inferred", () => {
  const authority: OwnerAuthorityFact = {
    ref: `owner:${"a".repeat(64)}`,
    decision: "authorize-checkpoint",
    deliveryId: DELIVERY,
    changeId: CHANGE,
    sourceRef: "owner-message",
    scope: ["checkpoint"],
  };
  assert.deepEqual(
    evaluateCheckpointAuthorization({
      policyDecision: { kind: "ready-checkpoint-evaluation" },
      ownerAuthority: authority,
      deliveryId: DELIVERY,
      changeId: CHANGE,
    }),
    { authorized: true, reason: "authorized" },
  );
  assert.deepEqual(
    evaluateCheckpointAuthorization({
      policyDecision: { kind: "ready-checkpoint-evaluation" },
      ownerAuthority: { ...authority, changeId: "other-change" },
      deliveryId: DELIVERY,
      changeId: CHANGE,
    }),
    { authorized: false, reason: "owner-authority-mismatch" },
  );
  assert.deepEqual(
    evaluateCheckpointAuthorization({
      policyDecision: { kind: "ready-action", actionId: "explore" },
      ownerAuthority: authority,
      deliveryId: DELIVERY,
      changeId: CHANGE,
    }),
    { authorized: false, reason: "policy-not-ready" },
  );
});
