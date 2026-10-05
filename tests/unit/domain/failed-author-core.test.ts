import assert from "node:assert/strict";
import test from "node:test";
import {
  transitionCurrentAction,
  reviseFailedTerminalAuthor,
} from "../../../src/domain/action-lifecycle.js";
import { invokeSingleAction } from "../../../src/domain/single-action-execution.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
import type {
  RunContextRecord,
  RunResultRecord,
} from "../../../src/domain/run-result-persistence.js";

for (const actionId of [
  "revise-explore",
  "revise-propose",
  "revise-apply",
] as const)
  test(`${actionId} requires exact failed source in the kernel; bare READY and ordinary prepare do not reopen terminal`, async () => {
    const identity = {
      deliveryId: "delivery-one",
      changeId: "change-one",
      actionId,
    };
    const current = { identity, state: "terminal" } as const;
    const owner = {
      ref: `owner:${"a".repeat(64)}`,
      decision: "revise-action",
      deliveryId: identity.deliveryId,
      changeId: identity.changeId,
      scope: [actionId],
      sourceRef: "synthetic:kernel-owner",
    };
    const parent: RunContextRecord = {
      runId: `20261005-040-${actionId}`,
      occurrence: { date: "20261005", sequence: 40, actionId },
      actionIdentity: identity,
      role: "author",
      lifecycleState: "terminal",
      ownerAuthority: null,
      previousRunId: null,
    };
    const result: RunResultRecord = {
      runId: parent.runId,
      actionIdentity: identity,
      authorConclusion: "FAIL",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: null,
      facts: {},
    };
    const context: RunContextRecord = {
      ...parent,
      runId: `20261005-041-${actionId}`,
      occurrence: { ...parent.occurrence, sequence: 41 },
      lifecycleState: "prepared",
      ownerAuthority: owner,
      previousRunId: parent.runId,
    };
    const source = {
      changeState: "active",
      terminalRunContext: parent,
      terminalResult: result,
      ownerAuthority: owner,
    };
    const ready = { kind: "ready-action", actionId };
    assert.equal(
      transitionCurrentAction(current, { type: "prepare", identity }),
      null,
    );
    assert.deepEqual(reviseFailedTerminalAuthor(current, identity, ready), {
      identity,
      state: "prepared",
    });
    assert.deepEqual(current, { identity, state: "terminal" });
    let executed = 0;
    const execute = () => {
      executed++;
      return {
        ...result,
        runId: context.runId,
        authorConclusion: "PASS",
        nextBoundary: actionId.replace("revise-", "review-"),
      };
    };
    const installation = loadManagerInstallation();
    const invoke = (
      proof: unknown,
      targetContext: unknown = context,
      prepare: () => "ready" | "blocked" = () => "ready",
    ) =>
      invokeSingleAction(
        installation,
        current,
        identity,
        targetContext,
        execute,
        prepare,
        ready,
        proof,
      );
    for (const proof of [
      undefined,
      null,
      { ...source, extra: true },
      { ...source, terminalResult: { ...result, authorConclusion: "PASS" } },
      { ...source, terminalResult: { ...result, authorConclusion: "UNKNOWN" } },
      { ...source, terminalRunContext: { ...parent, role: "reviewer" } },
      { ...source, ownerAuthority: { ...owner, scope: ["review-apply"] } },
    ]) {
      const outcome = await invoke(proof);
      assert.equal(outcome.status, "failed");
      assert.deepEqual(outcome.currentAction, current);
    }
    for (const targetContext of [
      { ...context, previousRunId: null },
      { ...context, ownerAuthority: null },
      { ...context, occurrence: { ...context.occurrence, sequence: 42 } },
      { ...context, lifecycleState: "terminal" },
    ])
      assert.equal((await invoke(source, targetContext)).status, "failed");
    assert.equal(
      (await invoke(source, context, () => "blocked")).status,
      "failed",
    );
    assert.equal(
      (
        await invokeSingleAction(
          { root: "missing" },
          current,
          identity,
          context,
          execute,
          () => "ready",
          undefined,
          source,
        )
      ).status,
      "failed",
    );
    assert.equal(executed, 0);
    const outcome = await invoke(source);
    assert.equal(outcome.status, "terminal");
    assert.equal(executed, 1);
    assert.equal(outcome.nextBoundary, actionId.replace("revise-", "review-"));
    assert.deepEqual(current, { identity, state: "terminal" });
  });
