import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { evaluateCheckpointAuthorization } from "../../../src/cli/checkpoint-authorization.js";
import {
  FoundationCliCommandError,
  executeFoundationCliRequest,
} from "../../../src/cli/foundation-cli.js";
import {
  FoundationCliInputError,
  parseFoundationCliArguments,
  parseFoundationCliRequest,
} from "../../../src/cli/request.js";
import {
  writeDurableRun,
  type DurableRunRecord,
  type OwnerAuthorityFact,
  type RunOccurrence,
} from "../../../src/domain/index.js";

const DELIVERY = "delivery-one";
const CHANGE = "cli-change";
const START = 100;

interface Fixture {
  readonly root: string;
  readonly repositoryRoot: string;
  readonly flowkitHome: string;
  readonly archifyMarker: string;
}

async function writeCoordinationManifest(
  repositoryRoot: string,
  state: "planned" | "active" | "completed" | "cancelled" = "active",
): Promise<void> {
  const dir = path.join(repositoryRoot, "openspec", "delivery-groups");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${DELIVERY}.yaml`),
    `id: ${DELIVERY}
changes:
  - id: ${CHANGE}
    state: ${state}
    dependsOn: []
ownerDecisions:
  - ref: owner:${"a".repeat(64)}
    decision: activate-change
    deliveryId: ${DELIVERY}
    changeId: ${CHANGE}
    sourceRef: owner-test
    scope:
      - explore
`,
  );
}

async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-cli-"));
  const repositoryRoot = path.join(root, "repo");
  const flowkitHome = path.join(root, "home");
  const archifyMarker = path.join(root, "archify-invoked");
  await mkdir(path.join(repositoryRoot, "config", "tools"), {
    recursive: true,
  });

  const tools = {
    openspec: {
      packageName: "@fission-ai/openspec",
      version: "1.10.0",
      entrypoint: "bin/openspec.js",
    },
    archify: {
      packageName: "archify",
      version: "2.15.0",
      entrypoint: "bin/archify.mjs",
    },
  } as const;

  await writeFile(
    path.join(repositoryRoot, "config", "tools", "toolchain.lock.json"),
    JSON.stringify({
      schemaVersion: 1,
      generatedFor: "test",
      openspec: {
        ...tools.openspec,
        runtimeRoot: "${FLOWKIT_HOME}/tools/openspec/1.10.0",
      },
      archify: {
        ...tools.archify,
        runtimeRoot: "${FLOWKIT_HOME}/tools/archify/2.15.0",
      },
    }),
  );

  for (const [toolId, entry] of Object.entries(tools)) {
    const runtimeRoot = path.join(flowkitHome, "tools", toolId, entry.version);
    const entrypoint = path.join(runtimeRoot, entry.entrypoint);
    await mkdir(path.dirname(entrypoint), { recursive: true });
    await writeFile(
      path.join(runtimeRoot, "package.json"),
      JSON.stringify({ name: entry.packageName, version: entry.version }),
    );
    if (toolId === "archify") {
      await writeFile(
        entrypoint,
        `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(archifyMarker)}, "used");`,
      );
    } else {
      await writeFile(
        entrypoint,
        `
const args = process.argv.slice(2);
const root = ${JSON.stringify(repositoryRoot)};
if (args[0] === "list" && args[1] === "--json") {
  console.log(JSON.stringify({
    changes: [{ name: ${JSON.stringify(CHANGE)} }],
    root: { path: root, source: "nearest" }
  }));
  process.exit(0);
}
if (args[0] === "status" && args[1] === "--change" && args[3] === "--json") {
  console.log(JSON.stringify({
    changeName: args[2],
    schemaName: "spec-driven",
    changeRoot: root + "/openspec/changes/" + args[2],
    isPlanningComplete: true,
    isComplete: false,
    artifacts: [{ id: "proposal", status: "done", requires: [] }],
    root: { path: root, source: "nearest" }
  }));
  process.exit(0);
}
console.log(JSON.stringify({ status: [{ severity: "error", code: "unsupported", message: "unsupported" }] }));
process.exit(1);
`,
      );
    }
  }

  await writeCoordinationManifest(repositoryRoot);
  return { root, repositoryRoot, flowkitHome, archifyMarker };
}

async function cleanup(fixture: Fixture): Promise<void> {
  await rm(fixture.root, { recursive: true, force: true });
}

function occurrence(
  sequence: number,
  actionId: RunOccurrence["actionId"],
): RunOccurrence {
  return { date: "20260828", sequence, actionId };
}

function terminalRecord(
  sequence: number,
  actionId: RunOccurrence["actionId"],
  values: {
    readonly authorConclusion?: string | null;
    readonly reviewerVerdict?: string | null;
    readonly nextBoundary?: string | null;
  },
): DurableRunRecord {
  const runId = `20260828-${String(sequence).padStart(3, "0")}-${actionId}`;
  const identity = { deliveryId: DELIVERY, changeId: CHANGE, actionId };
  return {
    actionMarkdown: "# Action\n",
    context: {
      runId,
      occurrence: occurrence(sequence, actionId),
      actionIdentity: identity,
      role: actionId.startsWith("review-") ? "reviewer" : "author",
      lifecycleState: "terminal",
      ownerAuthority: null,
      previousRunId: null,
    },
    result: {
      runId,
      actionIdentity: identity,
      authorConclusion: values.authorConclusion ?? null,
      reviewerVerdict: values.reviewerVerdict ?? null,
      verificationVerdict: null,
      nextBoundary: values.nextBoundary ?? null,
      facts: {},
    },
  };
}

async function writeRun(
  fixture: Fixture,
  sequence: number,
  record: DurableRunRecord,
): Promise<void> {
  await writeDurableRun(
    {
      repositoryRoot: fixture.repositoryRoot,
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeStartSequence: START,
      occurrence: record.context.occurrence,
    },
    record,
  );
}

function common(fixture: Fixture) {
  return {
    repositoryRoot: fixture.repositoryRoot,
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeStartSequence: START,
    flowkitHome: fixture.flowkitHome,
  };
}

test("command and request parsing stay closed and distinguish explicit null", () => {
  assert.deepEqual(parseFoundationCliArguments(["next", "--input", "r.json"]), {
    command: "next",
    inputPath: "r.json",
  });
  assert.throws(
    () => parseFoundationCliArguments(["archive", "--input", "r.json"]),
    (error: unknown) =>
      error instanceof FoundationCliInputError &&
      error.kind === "invalid-command",
  );
  const parsed = parseFoundationCliRequest("next", {
    repositoryRoot: "/repo",
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeStartSequence: START,
    currentRunId: null,
    flowkitHome: "/home",
  });
  assert.equal(parsed.command, "next");
  assert.equal(parsed.request.currentRunId, null);
  assert.throws(
    () =>
      parseFoundationCliRequest("next", {
        repositoryRoot: "/repo",
        deliveryId: DELIVERY,
        changeId: CHANGE,
        changeState: "active",
        changeStartSequence: START,
        currentRunId: null,
        flowkitHome: "/home",
      }),
    (error: unknown) =>
      error instanceof FoundationCliInputError &&
      error.kind === "invalid-request",
  );
  assert.throws(
    () =>
      parseFoundationCliRequest("next", {
        repositoryRoot: "/repo",
        deliveryId: DELIVERY,
        changeId: CHANGE,
        changeStartSequence: START,
        flowkitHome: "/home",
      }),
    (error: unknown) =>
      error instanceof FoundationCliInputError &&
      error.kind === "invalid-request",
  );
  assert.throws(
    () =>
      parseFoundationCliRequest("doctor", {
        repositoryRoot: "/repo",
        flowkitHome: "/home",
        extra: true,
      }),
    FoundationCliInputError,
  );
});

test("next explicit null reaches canonical explore without reading Run history", async () => {
  const fixture = await createFixture();
  try {
    await writeRun(
      fixture,
      999,
      terminalRecord(999, "archive", {
        authorConclusion: "PASS",
        nextBoundary: "checkpoint",
      }),
    );
    const result = await executeFoundationCliRequest({
      command: "next",
      request: { ...common(fixture), currentRunId: null },
    });
    assert.deepEqual(result, {
      kind: "next",
      decision: { kind: "ready-action", actionId: "explore" },
      checkpoint: { authorized: false, reason: "policy-not-ready" },
    });
  } finally {
    await cleanup(fixture);
  }
});

test("next exact Run ignores disconnected higher sequence and uses selected terminal facts", async () => {
  const fixture = await createFixture();
  try {
    const selected = terminalRecord(101, "review-propose", {
      reviewerVerdict: "approved",
      nextBoundary: "apply",
    });
    await writeRun(fixture, 101, selected);
    await writeRun(
      fixture,
      999,
      terminalRecord(999, "archive", {
        authorConclusion: "PASS",
        nextBoundary: "checkpoint",
      }),
    );
    const result = await executeFoundationCliRequest({
      command: "next",
      request: { ...common(fixture), currentRunId: selected.context.runId },
    });
    assert.deepEqual(result, {
      kind: "next",
      decision: { kind: "ready-action", actionId: "apply" },
      checkpoint: { authorized: false, reason: "policy-not-ready" },
    });
  } finally {
    await cleanup(fixture);
  }
});

test("malformed or mismatched exact Run fails closed without alternate selection", async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      executeFoundationCliRequest({
        command: "next",
        request: { ...common(fixture), currentRunId: "bad-run" },
      }),
      (error: unknown) =>
        error instanceof FoundationCliCommandError &&
        error.kind === "invalid-current-run",
    );
    const other = terminalRecord(101, "review-propose", {
      reviewerVerdict: "approved",
      nextBoundary: "apply",
    });
    await writeRun(fixture, 101, other);
    await writeFile(
      path.join(
        fixture.repositoryRoot,
        "openspec",
        "delivery-groups",
        `${DELIVERY}.yaml`,
      ),
      `id: ${DELIVERY}
changes:
  - id: ${CHANGE}
    state: active
    dependsOn: []
  - id: other-change
    state: active
    dependsOn: []
ownerDecisions:
  - ref: owner:${"a".repeat(64)}
    decision: activate-change
    deliveryId: ${DELIVERY}
    changeId: ${CHANGE}
    sourceRef: owner-test
    scope:
      - explore
  - ref: owner:${"b".repeat(64)}
    decision: activate-change
    deliveryId: ${DELIVERY}
    changeId: other-change
    sourceRef: owner-test-other
    scope:
      - explore
`,
    );
    await assert.rejects(
      executeFoundationCliRequest({
        command: "next",
        request: {
          ...common(fixture),
          changeId: "other-change",
          currentRunId: other.context.runId,
        },
      }),
      (error: unknown) =>
        error instanceof FoundationCliCommandError &&
        error.kind === "run-read-failed",
    );
  } finally {
    await cleanup(fixture);
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

test("status reports exact selected Run and approved OpenSpec facts only", async () => {
  const fixture = await createFixture();
  try {
    const selected = terminalRecord(101, "review-propose", {
      reviewerVerdict: "approved",
      nextBoundary: "apply",
    });
    await writeRun(fixture, 101, selected);
    const result = await executeFoundationCliRequest({
      command: "status",
      request: { ...common(fixture), currentRunId: selected.context.runId },
    });
    assert.equal(result.kind, "status");
    assert.equal(result.changeState, "active");
    assert.equal(result.currentRun.runId, selected.context.runId);
    assert.equal(result.openSpec.exactChange?.changeId, CHANGE);
    assert.deepEqual(result.openSpec.activeChangeIds, [CHANGE]);
  } finally {
    await cleanup(fixture);
  }
});

test("doctor reports bounded diagnostics and never invokes Archify", async () => {
  const fixture = await createFixture();
  try {
    const result = await executeFoundationCliRequest({
      command: "doctor",
      request: {
        repositoryRoot: fixture.repositoryRoot,
        flowkitHome: fixture.flowkitHome,
      },
    });
    assert.equal(result.kind, "doctor");
    assert.equal(result.status, "pass");
    await assert.rejects(access(fixture.archifyMarker));

    await rm(path.join(fixture.flowkitHome, "tools", "archify"), {
      recursive: true,
      force: true,
    });
    const failed = await executeFoundationCliRequest({
      command: "doctor",
      request: {
        repositoryRoot: fixture.repositoryRoot,
        flowkitHome: fixture.flowkitHome,
      },
    });
    assert.equal(failed.kind, "doctor");
    assert.equal(failed.status, "fail");
    await assert.rejects(access(fixture.archifyMarker));
  } finally {
    await cleanup(fixture);
  }
});
