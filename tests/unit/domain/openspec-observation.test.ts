import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ManagedToolResolutionError,
  OpenSpecObservationError,
  observeOpenSpecActiveChanges,
  observeOpenSpecChangeStatus,
} from "../../../src/domain/index.js";

interface Fixture {
  readonly root: string;
  readonly repositoryRoot: string;
  readonly flowkitHome: string;
  readonly entrypoint: string;
  readonly invocationLog: string;
}

async function createFixture(
  handlerSource: string,
  reportedRoot?: string,
): Promise<Fixture> {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-openspec-observe-"),
  );
  const repositoryRoot = path.join(root, "repo");
  const flowkitHome = path.join(root, "home");
  const runtimeRoot = path.join(flowkitHome, "tools", "openspec", "1.10.0");
  const entrypoint = path.join(runtimeRoot, "bin", "openspec.js");
  const invocationLog = path.join(root, "invocations.jsonl");
  await mkdir(path.join(repositoryRoot, "config", "tools"), {
    recursive: true,
  });
  await mkdir(path.dirname(entrypoint), { recursive: true });
  await writeFile(
    path.join(repositoryRoot, "config", "tools", "toolchain.lock.json"),
    JSON.stringify({
      schemaVersion: 1,
      generatedFor: "test",
      openspec: {
        packageName: "@fission-ai/openspec",
        version: "1.10.0",
        runtimeRoot: "${FLOWKIT_HOME}/tools/openspec/1.10.0",
        entrypoint: "bin/openspec.js",
      },
    }),
  );
  await writeFile(
    path.join(runtimeRoot, "package.json"),
    JSON.stringify({ name: "@fission-ai/openspec", version: "1.10.0" }),
  );
  const actualReportedRoot = reportedRoot ?? repositoryRoot;
  await writeFile(
    entrypoint,
    `import { appendFileSync } from "node:fs";\n` +
      `appendFileSync(${JSON.stringify(invocationLog)}, JSON.stringify(process.argv.slice(2)) + "\\n");\n` +
      `const repositoryRoot = ${JSON.stringify(actualReportedRoot)};\n` +
      handlerSource,
  );
  return { root, repositoryRoot, flowkitHome, entrypoint, invocationLog };
}

async function cleanup(fixture: Fixture): Promise<void> {
  await rm(fixture.root, { recursive: true, force: true });
}

function successHandler(options?: {
  readonly listChanges?: unknown[];
  readonly changeName?: string;
  readonly artifacts?: unknown[];
}): string {
  const listChanges = options?.listChanges ?? [
    { name: "alpha-change", completedTasks: 99, status: "free-text" },
  ];
  const changeName = options?.changeName ?? "alpha-change";
  const artifacts = options?.artifacts ?? [
    { id: "proposal", status: "done", requires: [] },
    {
      id: "specs",
      status: "blocked",
      requires: ["proposal"],
      missingDeps: ["proposal"],
    },
    { id: "design", status: "ready", requires: ["proposal"] },
    { id: "tasks", status: "skipped", requires: ["specs", "design"] },
  ];
  return `
const args = process.argv.slice(2);
if (args[0] === "list" && args[1] === "--json") {
  console.log(JSON.stringify({ changes: ${JSON.stringify(listChanges)}, root: { path: repositoryRoot, source: "nearest" } }));
  process.exit(0);
}
if (args[0] === "status" && args[1] === "--change" && args[3] === "--json") {
  console.log(JSON.stringify({
    changeName: ${JSON.stringify(changeName)},
    schemaName: "spec-driven",
    changeRoot: repositoryRoot + "/openspec/changes/" + args[2],
    isPlanningComplete: true,
    isComplete: false,
    artifacts: ${JSON.stringify(artifacts)},
    nextSteps: ["not-public"],
    actionContext: { mode: "not-public" },
    root: { path: repositoryRoot, source: "nearest" }
  }));
  process.exit(0);
}
console.log(JSON.stringify({ status: [{ severity: "error" }] }));
process.exit(1);
`;
}

test("active Change observation projects only canonical identifiers", async () => {
  const fixture = await createFixture(successHandler());
  try {
    const result = await observeOpenSpecActiveChanges(fixture);
    assert.deepEqual(result, { changeIds: ["alpha-change"] });
    assert.deepEqual(Object.keys(result), ["changeIds"]);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.changeIds), true);
    assert.deepEqual(
      JSON.parse((await readFile(fixture.invocationLog, "utf8")).trim()),
      ["list", "--json"],
    );
  } finally {
    await cleanup(fixture);
  }
});

test("active Change observation rejects invalid Change identifiers", async () => {
  const fixture = await createFixture(
    successHandler({ listChanges: [{ name: "INVALID CHANGE" }] }),
  );
  try {
    await assert.rejects(
      observeOpenSpecActiveChanges(fixture),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "invalid-machine-shape",
    );
  } finally {
    await cleanup(fixture);
  }
});

test("exact Change status projects only approved planning/artifact facts", async () => {
  const fixture = await createFixture(successHandler());
  try {
    const result = await observeOpenSpecChangeStatus({
      ...fixture,
      changeId: "alpha-change",
    });
    assert.equal(result.changeId, "alpha-change");
    assert.equal(result.schemaName, "spec-driven");
    assert.equal(result.isPlanningComplete, true);
    assert.equal(result.isComplete, false);
    assert.deepEqual(
      result.artifacts.map(({ id, status, requires, missingDeps }) => ({
        id,
        status,
        requires,
        missingDeps,
      })),
      [
        { id: "proposal", status: "done", requires: [], missingDeps: [] },
        {
          id: "specs",
          status: "blocked",
          requires: ["proposal"],
          missingDeps: ["proposal"],
        },
        {
          id: "design",
          status: "ready",
          requires: ["proposal"],
          missingDeps: [],
        },
        {
          id: "tasks",
          status: "skipped",
          requires: ["specs", "design"],
          missingDeps: [],
        },
      ],
    );
    assert.equal("nextSteps" in result, false);
    assert.equal("actionContext" in result, false);
  } finally {
    await cleanup(fixture);
  }
});

test("exact Change status rejects identity drift and malformed readiness", async () => {
  const identityFixture = await createFixture(
    successHandler({ changeName: "other-change" }),
  );
  const statusFixture = await createFixture(
    successHandler({
      artifacts: [{ id: "proposal", status: "unknown", requires: [] }],
    }),
  );
  try {
    await assert.rejects(
      observeOpenSpecChangeStatus({
        ...identityFixture,
        changeId: "alpha-change",
      }),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "invalid-machine-shape",
    );
    await assert.rejects(
      observeOpenSpecChangeStatus({
        ...statusFixture,
        changeId: "alpha-change",
      }),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "invalid-machine-shape",
    );
  } finally {
    await cleanup(identityFixture);
    await cleanup(statusFixture);
  }
});

test("invalid observation input fails before invoking OpenSpec", async () => {
  const fixture = await createFixture(successHandler());
  try {
    await assert.rejects(
      observeOpenSpecChangeStatus({ ...fixture, changeId: "INVALID CHANGE" }),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "invalid-observation-input",
    );
  } finally {
    await cleanup(fixture);
  }
});

test("fake PATH OpenSpec is ignored and managed-resolution failure never falls back", async () => {
  const fixture = await createFixture(successHandler());
  const fakeBin = path.join(fixture.root, "fake-bin");
  const fakeMarker = path.join(fixture.root, "path-openspec-used");
  await mkdir(fakeBin, { recursive: true });
  await writeFile(
    path.join(fakeBin, "openspec"),
    `#!/bin/sh\necho used > ${JSON.stringify(fakeMarker)}\n`,
    { mode: 0o755 },
  );
  const originalPath = process.env.PATH;
  process.env.PATH = `${fakeBin}${path.delimiter}${originalPath ?? ""}`;
  try {
    await observeOpenSpecActiveChanges(fixture);
    await assert.rejects(readFile(fakeMarker, "utf8"));
    await rm(fixture.entrypoint);
    await assert.rejects(
      observeOpenSpecActiveChanges(fixture),
      (error: unknown) =>
        error instanceof ManagedToolResolutionError &&
        error.kind === "missing-entrypoint",
    );
    await assert.rejects(readFile(fakeMarker, "utf8"));
  } finally {
    process.env.PATH = originalPath;
    await cleanup(fixture);
  }
});
