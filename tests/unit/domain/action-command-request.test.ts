import assert from "node:assert/strict";
import test from "node:test";
import {
  assertVisibleTarget,
  parseActionArguments,
  parseActionCommandRequest,
} from "../../../src/cli/action-request.js";
import { parseFoundationCliRequestJson } from "../../../src/cli/request.js";

const target = {
  repositoryRoot: "C:/target",
  flowkitHome: "C:/home",
  deliveryId: "delivery-one",
  changeId: "change-one",
};

test("fixed Action request rejects duplicate keys and caller authority fields", () => {
  assert.throws(
    () => parseFoundationCliRequestJson('{"role":"author","role":"reviewer"}'),
    /not valid JSON/,
  );
  assert.throws(
    () =>
      parseActionCommandRequest("action start", {
        ...target,
        actionId: "explore",
        role: "author",
        currentRunId: "forged",
      }),
    /unsupported fields/,
  );
  assert.throws(
    () =>
      parseActionCommandRequest("action start", {
        ...target,
        actionId: "explore",
        role: "owner",
      }),
    /invalid execution Role/,
  );
  assert.throws(
    () =>
      parseActionCommandRequest("action start", {
        ...target,
        actionId: "explore",
        role: "author",
        callback: "run",
      }),
    /unsupported fields/,
  );
  const args = parseActionArguments([
    "--repository-root",
    "C:/other",
    "--input",
    "request.json",
  ]);
  assert.throws(
    () => assertVisibleTarget(args.visible, target),
    /conflicts with JSON target/,
  );
});

test("fixed finish only accepts an exact role Result envelope", () => {
  const result = {
    runId: "20260930-001-explore",
    actionIdentity: {
      deliveryId: "delivery-one",
      changeId: "change-one",
      actionId: "explore",
    },
    authorConclusion: "PASS",
    reviewerVerdict: null,
    verificationVerdict: null,
    nextBoundary: "review-explore",
    facts: {},
  };
  const parsed = parseActionCommandRequest("action finish", {
    ...target,
    runId: result.runId,
    role: "author",
    result,
    terminal: true,
  });
  assert.equal(parsed.command, "action finish");
  if (parsed.command === "action finish")
    assert.deepEqual(parsed.request.result, result);
  assert.throws(
    () =>
      parseActionCommandRequest("action finish", {
        ...target,
        runId: result.runId,
        role: "author",
        result,
        terminal: true,
        actionPackage: {},
      }),
    /unsupported fields/,
  );
});
