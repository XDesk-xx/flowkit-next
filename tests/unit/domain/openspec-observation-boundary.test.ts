import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  OpenSpecObservationError,
  observeOpenSpecActiveChanges,
  observeOpenSpecChangeStatus,
} from "../../../src/domain/index.js";
import { classifyManagedOpenSpecClose } from "../../../src/internal/openspec-process-outcome.js";
import * as publicDomain from "../../../src/domain/index.js";

interface Fixture {
  readonly root: string;
  readonly repositoryRoot: string;
  readonly flowkitHome: string;
}

async function fixtureWithScript(
  scriptBody: string,
  reportedRoot?: string,
): Promise<Fixture> {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-openspec-boundary-"),
  );
  const repositoryRoot = path.join(root, "repo");
  const flowkitHome = path.join(root, "home");
  const runtimeRoot = path.join(flowkitHome, "tools", "openspec", "1.10.0");
  await mkdir(path.join(repositoryRoot, "config", "tools"), {
    recursive: true,
  });
  await mkdir(path.join(runtimeRoot, "bin"), { recursive: true });
  await writeFile(
    path.join(repositoryRoot, "config", "tools", "toolchain.lock.json"),
    JSON.stringify({
      schemaVersion: 1,
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
  await writeFile(
    path.join(runtimeRoot, "bin", "openspec.js"),
    `const repositoryRoot = ${JSON.stringify(reportedRoot ?? repositoryRoot)};\n${scriptBody}`,
  );
  return { root, repositoryRoot, flowkitHome };
}

async function cleanup(fixture: Fixture): Promise<void> {
  await rm(fixture.root, { recursive: true, force: true });
}

const validListScript = `
console.log(JSON.stringify({ changes: [], root: { path: repositoryRoot } }));
process.exit(0);
`;

test("valid non-zero OpenSpec status envelope is a formal outcome", async () => {
  const fixture = await fixtureWithScript(`
console.log(JSON.stringify({ status: [{ severity: "error", code: "change_error", message: "not interpreted" }] }));
process.exit(1);
`);
  try {
    await assert.rejects(
      observeOpenSpecChangeStatus({ ...fixture, changeId: "missing-change" }),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "openspec-formal-outcome",
    );
  } finally {
    await cleanup(fixture);
  }
});

test("valid non-zero list null-shape is also a formal outcome", async () => {
  const fixture = await fixtureWithScript(`
console.log(JSON.stringify({
  changes: [],
  root: null,
  status: [{ severity: "error", code: "list_error", message: "not interpreted" }]
}));
process.exit(1);
`);
  try {
    await assert.rejects(
      observeOpenSpecActiveChanges(fixture),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "openspec-formal-outcome",
    );
  } finally {
    await cleanup(fixture);
  }
});

test("arbitrary object-shaped non-zero JSON fails machine-shape validation", async () => {
  const fixtures = await Promise.all([
    fixtureWithScript(`console.log(JSON.stringify({})); process.exit(1);`),
    fixtureWithScript(
      `console.log(JSON.stringify({ hello: "world" })); process.exit(1);`,
    ),
  ]);
  try {
    for (const fixture of fixtures) {
      await assert.rejects(
        observeOpenSpecChangeStatus({ ...fixture, changeId: "missing-change" }),
        (error: unknown) =>
          error instanceof OpenSpecObservationError &&
          error.kind === "invalid-machine-shape",
      );
    }
  } finally {
    await Promise.all(fixtures.map(cleanup));
  }
});

test("malformed machine output remains distinct", async () => {
  const fixture = await fixtureWithScript(
    `console.log("not-json"); process.exit(1);`,
  );
  try {
    await assert.rejects(
      observeOpenSpecActiveChanges(fixture),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "malformed-machine-output",
    );
  } finally {
    await cleanup(fixture);
  }
});

test("numeric close with empty required output is malformed machine output", async () => {
  const fixture = await fixtureWithScript(`process.exit(1);`);
  try {
    await assert.rejects(
      observeOpenSpecActiveChanges(fixture),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "malformed-machine-output",
    );
  } finally {
    await cleanup(fixture);
  }
});

test("host-observable missing numeric exit is a process failure", () => {
  assert.equal(
    classifyManagedOpenSpecClose(null, null),
    "openspec-process-failed",
  );
});

test("host-observable signal is a process failure", () => {
  assert.equal(
    classifyManagedOpenSpecClose(0, "SIGTERM"),
    "openspec-process-failed",
  );
});

test("numeric close remains a numeric outcome", () => {
  assert.deepEqual(classifyManagedOpenSpecClose(1, null), { exitCode: 1 });
});

test("close classifier is not part of the public domain surface", () => {
  assert.equal("classifyManagedOpenSpecClose" in publicDomain, false);
});

test("successful nearest-root drift is rejected", async () => {
  const fixture = await fixtureWithScript(validListScript, os.tmpdir());
  try {
    await assert.rejects(
      observeOpenSpecActiveChanges(fixture),
      (error: unknown) =>
        error instanceof OpenSpecObservationError &&
        error.kind === "openspec-root-mismatch",
    );
  } finally {
    await cleanup(fixture);
  }
});

test("missing or malformed success root fails closed", async () => {
  const missingRoot = await fixtureWithScript(
    `console.log(JSON.stringify({ changes: [] })); process.exit(0);`,
  );
  const missingPath = await fixtureWithScript(
    `console.log(JSON.stringify({ changes: [], root: {} })); process.exit(0);`,
  );
  try {
    for (const fixture of [missingRoot, missingPath]) {
      await assert.rejects(
        observeOpenSpecActiveChanges(fixture),
        (error: unknown) =>
          error instanceof OpenSpecObservationError &&
          error.kind === "invalid-machine-shape",
      );
    }
  } finally {
    await cleanup(missingRoot);
    await cleanup(missingPath);
  }
});

test("observation is transient and does not require .agents or create .flowkit state", async () => {
  const fixture = await fixtureWithScript(validListScript);
  try {
    await assert.rejects(stat(path.join(fixture.repositoryRoot, ".agents")));
    await assert.rejects(stat(path.join(fixture.repositoryRoot, ".flowkit")));
    await observeOpenSpecActiveChanges(fixture);
    await assert.rejects(stat(path.join(fixture.repositoryRoot, ".agents")));
    await assert.rejects(stat(path.join(fixture.repositoryRoot, ".flowkit")));
  } finally {
    await cleanup(fixture);
  }
});

test("status observation preserves OpenSpec readiness rather than inferring from files", async () => {
  const fixture = await fixtureWithScript(`
console.log(JSON.stringify({
  changeName: "alpha-change",
  schemaName: "spec-driven",
  changeRoot: repositoryRoot + "/openspec/changes/alpha-change",
  isPlanningComplete: false,
  isComplete: false,
  artifacts: [{ id: "proposal", status: "blocked", requires: ["seed"], missingDeps: ["seed"] }],
  root: { path: repositoryRoot }
}));
process.exit(0);
`);
  await mkdir(
    path.join(fixture.repositoryRoot, "openspec", "changes", "alpha-change"),
    { recursive: true },
  );
  await writeFile(
    path.join(
      fixture.repositoryRoot,
      "openspec",
      "changes",
      "alpha-change",
      "proposal.md",
    ),
    "exists",
  );
  try {
    const result = await observeOpenSpecChangeStatus({
      ...fixture,
      changeId: "alpha-change",
    });
    assert.equal(result.artifacts[0]?.status, "blocked");
    assert.deepEqual(result.artifacts[0]?.missingDeps, ["seed"]);
  } finally {
    await cleanup(fixture);
  }
});

test("public module source has no bootstrap or lifecycle coupling", async () => {
  const source = await readFile(
    new URL("../../../src/domain/openspec-observation.ts", import.meta.url),
    "utf8",
  );
  for (const forbidden of [
    ".agents",
    "policy-and-next-boundary",
    "cross-delivery-memo",
    "action-lifecycle",
    "run-result-persistence",
    "instructions",
    "archive",
    "validate",
    "runOpenSpec",
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `unexpected coupling: ${forbidden}`,
    );
  }
});
