import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import {
  appendFile,
  mkdtemp,
  open,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import {
  collectRequestInput,
  readRequestInput,
} from "../../../src/cli/request-input.js";
import {
  FoundationCliInputError,
  parseFoundationCliRequestJson,
  requestJsonLimit,
} from "../../../src/cli/request.js";
import {
  isJsonObject,
  measureRunFacts,
  runResultFactsBudget,
} from "../../../src/domain/run-result-persistence.js";
import { parseActionCommandRequest } from "../../../src/cli/action-request.js";

const exec = promisify(execFile);
const entry =
  process.env.FLOWKIT_APPLY_TEST_ENTRY ?? path.resolve("src/cli/entrypoint.ts");
const args = (...values: string[]) => [
  ...(entry.endsWith(".ts") ? ["--import", "tsx"] : []),
  entry,
  ...values,
];
async function cli(command: string[], payload: string, input: string) {
  if (input !== "-") {
    await writeFile(input, payload);
    const result = await exec(
      process.execPath,
      args(...command, "--input", input),
    ).catch((e: { stdout: string }) => e);
    return JSON.parse(result.stdout);
  }
  return new Promise<Record<string, any>>((resolve, reject) => {
    const child = spawn(process.execPath, args(...command, "--input", "-"), {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    let out = "";
    child.stdout.on("data", (b) => {
      out += b.toString();
    });
    child.on("error", reject);
    child.stdin.on("error", (e) => {
      if ((e as NodeJS.ErrnoException).code !== "EPIPE") reject(e);
    });
    child.on("close", () => {
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(e);
      }
    });
    child.stdin.end(payload);
  });
}

test("command-selected parser budgets preserve closed JSON and UTF-8 boundaries", () => {
  for (const command of ["git checkpoint", "git push", "git integrate"]) {
    assert.equal(requestJsonLimit(command), 1_048_576);
    const text = JSON.stringify({ x: "界".repeat(22_000) });
    assert.deepEqual(
      parseFoundationCliRequestJson(text, requestJsonLimit(command)),
      JSON.parse(text),
    );
    assert.throws(
      () => parseFoundationCliRequestJson(text),
      (e: unknown) =>
        e instanceof FoundationCliInputError && e.budget?.limit === 65_536,
    );
  }
  assert.equal(requestJsonLimit("action finish"), 65_536);
  assert.deepEqual(
    parseFoundationCliRequestJson("{}".padEnd(1_048_576), 1_048_576),
    {},
  );
  assert.throws(
    () => parseFoundationCliRequestJson("{}".padEnd(1_048_577), 1_048_576),
    (e: any) =>
      e.budget.observed === 1_048_577 && e.budget.measurement === "exact",
  );
  for (const text of ['{"a":1,"a":2}', "[".repeat(34) + "0" + "]".repeat(34)])
    assert.throws(
      () => parseFoundationCliRequestJson(text, 1_048_576),
      FoundationCliInputError,
    );
});

test("bounded collection counts growing file bytes and closes on overflow", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-input-"));
  try {
    const file = path.join(root, "input.json");
    await writeFile(file, "{}".padEnd(65_536));
    assert.equal((await readRequestInput(file)).length, 65_536);
    const handle = await open(file, "r");
    let closed = false;
    async function* growth() {
      try {
        const b = Buffer.alloc(65_536);
        await handle.read(b, 0, b.length, null);
        yield b;
        await appendFile(file, "界");
        const tail = Buffer.alloc(3);
        await handle.read(tail, 0, 3, null);
        yield tail;
      } finally {
        await handle.close();
        closed = true;
      }
    }
    await assert.rejects(
      collectRequestInput(growth()),
      (e: any) =>
        e.kind === "invalid-request-json" &&
        e.budget.observed === 65_539 &&
        e.budget.measurement === "lower-bound",
    );
    assert.equal(closed, true);
    await assert.rejects(
      readRequestInput(file),
      (e: any) => e.budget.limit === 65_536,
    );
    await assert.rejects(
      readRequestInput(path.join(root, "missing")),
      (e: any) => e.kind === "invalid-arguments" && e.budget === undefined,
    );
    assert.equal((await readFile(file)).length, 65_539);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("file/stdin CLI overflow stays safe and Git transport does not create authority", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-cli-budget-"));
  try {
    const input = path.join(root, "request.json");
    const target = ["--repository-root", root, "--delivery-id", "delivery-one"];
    const ownerAuthority = {
      ref: `owner:${"a".repeat(64)}`,
      decision: "authorize-checkpoint",
      deliveryId: "delivery-one",
      sourceRef: "test:capacity-owner",
      scope: ["wrong"],
    };
    const request = {
      repositoryRoot: root,
      flowkitHome: root,
      deliveryId: "delivery-one",
      ownerAuthority,
      gitRequest: {
        targetRoot: root,
        node: "delivery-start",
        deliveryId: "delivery-one",
        changeId: null,
        ownerSourceRef: ownerAuthority.sourceRef,
        expectedBranch: "main",
        operation: {
          kind: "create-new",
          paths: Array.from(
            { length: 910 },
            (_, i) => `src/${String(i).padStart(4, "0")}-${"a".repeat(130)}.ts`,
          ),
          commitMessage: "delivery(delivery-one): start",
          commitShape: { parents: ["a".repeat(40)], count: 1 },
        },
      },
    };
    const body = JSON.stringify(request);
    assert.ok(
      Buffer.byteLength(body) > 65_536 && Buffer.byteLength(body) < 1_048_576,
    );
    for (const transport of [input, "-"]) {
      const accepted = await cli(
        ["git", "checkpoint", ...target],
        body,
        transport,
      );
      assert.equal(accepted.reason, "git-target-or-authority-mismatch");
      const push = {
        ...request,
        gitRequest: {
          ...request.gitRequest,
          operation: {
            kind: "push",
            localCommit: "a".repeat(40),
            remote: "origin",
            targetRef: "refs/heads/main",
          },
        },
      };
      const pushed = await cli(
        ["git", "push", ...target],
        JSON.stringify(push).padEnd(131_072),
        transport,
      );
      assert.equal(pushed.reason, "git-target-or-authority-mismatch");
      const integrate = {
        ...request,
        gitRequest: { ...request.gitRequest, node: "repository-integration" },
        integrationInput: {
          targetMainRef: "refs/heads/main",
          acceptedBaseCommit: "a".repeat(40),
          checkpointOperation: request.gitRequest.operation,
        },
      };
      const integrated = await cli(
        ["git", "integrate", ...target],
        JSON.stringify(integrate),
        transport,
      );
      assert.equal(integrated.reason, "integration-input-or-authority-invalid");
      for (const op of ["checkpoint", "push", "integrate"]) {
        const overflow = await cli(
          ["git", op, ...target],
          body.padEnd(1_048_577),
          transport,
        );
        assert.equal(overflow.error.kind, "invalid-request-json");
        assert.equal(overflow.error.message, "request exceeds JSON limit");
        assert.equal(overflow.error.budget.limit, 1_048_576);
        assert.equal(overflow.error.budget.subject, "request");
        assert.equal(overflow.error.budget.measurement, "lower-bound");
        assert.deepEqual(Object.keys(overflow.error).sort(), [
          "budget",
          "kind",
          "message",
        ]);
        assert.equal(
          JSON.stringify(overflow).includes(ownerAuthority.sourceRef),
          false,
        );
      }
      const normal = await cli(["next"], body, transport);
      assert.equal(normal.error.budget.limit, 65_536);
    }
    const help = await exec(process.execPath, args("--help"));
    assert.match(JSON.parse(help.stdout).input, /65536.*1048576/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function nested(depth: number): any {
  let v: any = 0;
  for (let i = 0; i < depth; i++) v = { x: v };
  return v;
}
test("facts budget counts root/containers/values and retains bytes/depth", () => {
  assert.equal(isJsonObject({ a: Array(4094).fill(0) }), true);
  assert.deepEqual(measureRunFacts({ a: Array(4095).fill(0) }).budget, {
    subject: "result-facts",
    dimension: "nodes",
    limit: 4096,
    observed: 4097,
    measurement: "lower-bound",
  });
  assert.equal(isJsonObject(nested(16)), true);
  assert.equal(measureRunFacts(nested(17)).budget?.dimension, "depth");
  assert.equal(isJsonObject({ s: "x".repeat(65_528) }), true);
  assert.deepEqual(measureRunFacts({ s: "x".repeat(65_529) }).budget, {
    subject: "result-facts",
    dimension: "bytes",
    limit: 65_536,
    observed: 65_537,
    measurement: "exact",
  });
  assert.equal(
    measureRunFacts({ deep: nested(17), nodes: Array(4096).fill(0) }).budget
      ?.dimension,
    "depth",
  );
  assert.equal(
    measureRunFacts({ bad: undefined, nodes: Array(4096).fill(0) }).budget,
    undefined,
  );
  assert.equal(isJsonObject({ nonFinite: Infinity }), false);
});

test("finish caller facts diagnose capacity without masking invalid Result envelope", () => {
  const result = {
    runId: "20261005-001-apply",
    actionIdentity: {
      deliveryId: "delivery-one",
      changeId: "change-one",
      actionId: "apply",
    },
    authorConclusion: "FAIL",
    reviewerVerdict: null,
    verificationVerdict: null,
    nextBoundary: null,
    facts: { values: Array(4095).fill(0) },
  };
  const request = {
    repositoryRoot: "target",
    flowkitHome: "home",
    deliveryId: "delivery-one",
    changeId: "change-one",
    runId: result.runId,
    role: "author",
    terminal: true,
    result,
  };
  assert.throws(
    () => parseActionCommandRequest("action finish", request),
    (e: any) => e.kind === "invalid-request" && e.budget.dimension === "nodes",
  );
  assert.equal(runResultFactsBudget({ ...result, extra: true }), undefined);
  assert.throws(
    () =>
      parseActionCommandRequest("action finish", {
        ...request,
        result: { ...result, extra: true },
      }),
    (e: any) => e.kind === "invalid-request" && e.budget === undefined,
  );
});

test("finish file/stdin machine capacity errors distinguish caller facts from the outer request", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-finish-budget-"));
  const input = path.join(root, "request.json");
  const request = {
    repositoryRoot: root,
    flowkitHome: root,
    deliveryId: "delivery-one",
    changeId: "change-one",
    runId: "20261005-001-apply",
    role: "author",
    terminal: true,
    result: {
      runId: "20261005-001-apply",
      actionIdentity: {
        deliveryId: "delivery-one",
        changeId: "change-one",
        actionId: "apply",
      },
      authorConclusion: "FAIL",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: null,
      facts: {},
    },
  };
  try {
    for (const transport of [input, "-"]) {
      for (const [facts, dimension] of [
        [{ values: Array(4_095).fill(0) }, "nodes"],
        [{ deep: nested(17) }, "depth"],
      ] as const) {
        const rejected = await cli(
          ["action", "finish"],
          JSON.stringify({ ...request, result: { ...request.result, facts } }),
          transport,
        );
        assert.equal(rejected.error.kind, "invalid-request");
        assert.equal(rejected.error.budget.subject, "result-facts");
        assert.equal(rejected.error.budget.dimension, dimension);
        assert.equal(rejected.error.budget.measurement, "lower-bound");
        assert.deepEqual(Object.keys(rejected.error).sort(), [
          "budget",
          "kind",
          "message",
        ]);
      }
      const envelope = await cli(
        ["action", "finish"],
        JSON.stringify(request).padEnd(65_537),
        transport,
      );
      assert.equal(envelope.error.kind, "invalid-request-json");
      assert.equal(envelope.error.budget.subject, "request");
      assert.equal(envelope.error.budget.limit, 65_536);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
