import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as domain from "../../../src/domain/index.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
import { readSelectedRunChain } from "../../../src/cli/current-run-chain.js";
import { inputs, loadHow } from "./agent-how-fixture.js";

test("all ten HOWs reuse exact prepared identity and reject a different prepared target", async () => {
  for (const actionId of [
    "explore",
    "propose",
    "apply",
    "archive",
    "revise-explore",
    "revise-propose",
    "revise-apply",
    "review-explore",
    "review-propose",
    "review-apply",
  ] as const) {
    const how = await loadHow(actionId);
    const identity = {
      deliveryId: "delivery-one",
      changeId: "change-one",
      actionId,
    };
    const current = domain.transitionCurrentAction(null, {
      type: "prepare",
      identity,
    })!;
    assert.deepEqual(how.currentForExecution(domain, null, identity), current);
    assert.equal(how.currentForExecution(domain, current, identity), current);
    assert.equal(
      domain.transitionCurrentAction(current, { type: "prepare", identity }),
      null,
    );
    for (const wrong of [
      { ...identity, deliveryId: "different-delivery" },
      { ...identity, changeId: "different-change" },
      {
        ...identity,
        actionId: actionId === "explore" ? "propose" : "explore",
      } as domain.ActionIdentity,
    ])
      assert.equal(how.currentForExecution(domain, current, wrong), null);
    const terminal = { ...current, state: "terminal" as const };
    assert.equal(how.currentForExecution(domain, terminal, identity), null);
    const nextIdentity = {
      ...identity,
      actionId: actionId === "explore" ? "review-explore" : "explore",
    } as domain.ActionIdentity;
    assert.deepEqual(
      how.currentForExecution(domain, terminal, nextIdentity),
      domain.transitionCurrentAction(terminal, {
        type: "prepare",
        identity: nextIdentity,
      }),
    );
  }
});

test("HOW prepared failure then explicitly selected new execution records a new occurrence without rewriting old bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-how-prepared-"));
  try {
    const how = await loadHow("explore");
    const f = inputs(root);
    const identity = f.context.actionIdentity;
    const guidance = (await domain.resolveActionGuidanceRef(
      loadManagerInstallation(),
      "explore",
    ))!;
    const firstCurrent = how.currentForExecution(domain, null, identity)!;
    const first = await how.startRecord(
      domain,
      loadManagerInstallation(),
      f.input,
      firstCurrent,
      f.context,
      guidance,
      () => "ready",
    );
    const failure = {
      ...f.result,
      authorConclusion: null,
      nextBoundary: null,
      facts: {
        synthetic: true,
        reason: "bounded admission failure fixture, not real Review",
      },
    };
    await how.finishRecord(domain, first, failure, true, false);
    const names = ["action.md", "context.json", "result.json"];
    const before = await Promise.all(
      names.map((name) => readFile(path.join(first.directory, name))),
    );
    const selected = await readSelectedRunChain(f.input);
    assert.equal(selected.current?.context.lifecycleState, "prepared");
    const previousAction = {
      identity,
      state: selected.current!.context.lifecycleState!,
    };
    const decision = domain.evaluatePolicyAndNextBoundary({
      deliveryId: identity.deliveryId,
      changeId: identity.changeId,
      changeState: "active",
      currentAction: previousAction,
      terminalRunContext: null,
      terminalResult: null,
    });
    assert.deepEqual(decision, { kind: "ready-action", actionId: "explore" });
    // Explicit synthetic second invocation, not automatic replay of the first work.
    const current = how.currentForExecution(domain, previousAction, identity)!;
    assert.equal(current, previousAction);
    const occurrence = { ...f.input.occurrence, sequence: 2 };
    const context = {
      ...f.context,
      occurrence,
      runId: domain.formatRunOccurrenceId(occurrence)!,
      previousRunId: f.context.runId,
    };
    const input = { ...f.input, occurrence };
    const second = await how.startRecord(
      domain,
      loadManagerInstallation(),
      input,
      current,
      context,
      guidance,
      () => "ready",
    );
    assert.notEqual(second.actionPackage.runId, first.actionPackage.runId);
    assert.deepEqual(
      second.actionPackage.actionIdentity,
      first.actionPackage.actionIdentity,
    );
    const result = { ...f.result, runId: context.runId };
    await how.finishRecord(domain, second, result, true);
    const after = await Promise.all(
      names.map((name) => readFile(path.join(first.directory, name))),
    );
    assert.deepEqual(after, before);
    assert.equal(
      (await readSelectedRunChain(input)).current?.context.runId,
      context.runId,
    );
    await assert.rejects(
      how.startRecord(
        domain,
        loadManagerInstallation(),
        input,
        current,
        context,
        guidance,
        () => "ready",
      ),
      /sequence already exists/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
