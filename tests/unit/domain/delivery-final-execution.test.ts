import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test, { mock } from "node:test";

import {
  deriveApplicableCheckCandidateRef,
  deriveDeliveryFinalizationRef,
  formDeliveryOperationPackage,
  invokeDeliveryArchitectureFinalizationOperation,
  invokeDeliveryFinalOperation,
  invokeDeliveryFullTestOperation,
  isDeliveryFinalizationRecordForPackage,
  prepareDeliveryFinalOperationPackage,
  resolveDeliveryGuidanceRef,
  type ApplicableCheckDeclaration,
  type DeliveryArchitectureFinalizationDerivedOutputs,
  type DeliveryArchitectureFinalizationTerminal,
  type DeliveryFullTestInvocationTerminal,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";
import {
  readDeliveryFinalCoordinationPrestate,
  writeDeliveryFinalCoordinationClosure,
} from "../../../src/internal/delivery-final-coordination.js";

const execFileAsync = promisify(execFile);
const deliveryId = "test-delivery-finalization";

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function git(root: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  return stdout.trim();
}

function authority(
  decision: "authorize-formal-full-test" | "finalize-delivery",
): OwnerAuthorityFact {
  return {
    ref: `owner:${(decision === "finalize-delivery" ? "b" : "a").repeat(64)}`,
    decision,
    deliveryId,
    sourceRef: `owner-input:${decision}`,
    scope: [
      decision === "finalize-delivery"
        ? "delivery-final"
        : "delivery-full-test",
    ],
  };
}

function noOpCheck(): ApplicableCheckDeclaration {
  return {
    checkId: "fixture-check",
    program: process.execPath,
    args: ["-e", "process.exit(0)"],
    configRefs: ["config:fixture"],
    toolRefs: ["tool:node"],
    environmentRefs: ["environment:test"],
  };
}

function architectureJson(label: string): string {
  return `${JSON.stringify({
    schema_version: 1,
    diagram_type: "architecture",
    meta: { title: label },
    boundaries: [],
    nodes: [],
    connections: [],
  })}\n`;
}

function systemViewJson(type: "workflow" | "lifecycle" | "dataflow"): string {
  return `${JSON.stringify({
    schema_version: 1,
    diagram_type: type,
    meta: { title: type },
    ...(type === "workflow" ? { lanes: [], steps: [], transitions: [] } : {}),
    ...(type === "lifecycle" ? { states: [], transitions: [] } : {}),
    ...(type === "dataflow" ? { stages: [], nodes: [], flows: [] } : {}),
  })}\n`;
}

function compareJson(
  pair: "current-to-actual" | "planned-to-actual",
  leftRef: "./current.architecture.json" | "./planned.architecture.json",
  left: string,
  actual: string,
): string {
  return `${JSON.stringify({
    schemaVersion: 1,
    kind: "architecture-thin-compare",
    deliveryId,
    pair,
    left: {
      ref: leftRef,
      sha256: sha256(left),
      bytes: Buffer.byteLength(left),
    },
    right: {
      ref: "./actual.architecture.json",
      sha256: sha256(actual),
      bytes: Buffer.byteLength(actual),
    },
    classification: ["semantic", "presentation"],
    summary: { semantic: "converged", presentation: "side by side" },
    presentation: {
      mode: "side-by-side",
      renderer: "flowkit-reference-side-by-side",
      leftPosition: "before",
      rightPosition: "after",
      equalFrame: true,
      interactive: true,
      overlay: false,
      deltaColumn: false,
      artifactPolicy: "disposable-html-not-retained-in-git",
      resolution: "resolve-left-right-ref-to-architecture-render",
    },
  })}\n`;
}

function manifest(id = deliveryId, secondState = "completed"): string {
  return `id: ${id}\ndelivery:\n  state: active\n  fullTestStatus: pending\n  finalizationStatus: pending\nchanges:\n  - id: first-change\n    required: true\n    state: completed\n  - id: second-change\n    required: true\n    state: ${secondState}\n`;
}

interface Fixture {
  readonly root: string;
  readonly flowkitHome: string;
  readonly manifestPath: string;
  readonly openspecEntrypoint: string;
  readonly current: string;
  readonly planned: string;
}

async function createFixture(
  manifestContent: string = manifest(),
): Promise<Fixture> {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-delivery-final-"));
  const flowkitHome = await mkdtemp(
    path.join(tmpdir(), "flowkit-delivery-final-home-"),
  );
  await git(root, "init", "-q");
  await git(root, "config", "user.email", "flowkit@example.invalid");
  await git(root, "config", "user.name", "Flowkit Test");
  await writeFile(path.join(root, "source.txt"), "base\n");

  for (const operation of ["full-test", "architecture-finalization", "final"]) {
    const target = path.join(root, "skills", "delivery", operation, "SKILL.md");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `# ${operation}\n`);
  }
  const manifestPath = path.join(
    root,
    "openspec",
    "delivery-groups",
    `${deliveryId}.yaml`,
  );
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, manifestContent);

  const architectureRoot = path.join(root, "architecture", deliveryId, "json");
  await mkdir(architectureRoot, { recursive: true });
  const current = architectureJson("Current");
  const planned = architectureJson("Planned");
  await writeFile(
    path.join(architectureRoot, "current.architecture.json"),
    current,
  );
  await writeFile(
    path.join(architectureRoot, "planned.architecture.json"),
    planned,
  );

  const runtimeOpenSpec = path.join(flowkitHome, "tools", "openspec", "1.10.0");
  const openspecEntrypoint = path.join(runtimeOpenSpec, "bin", "openspec.js");
  await mkdir(path.dirname(openspecEntrypoint), { recursive: true });
  await writeFile(
    path.join(runtimeOpenSpec, "package.json"),
    JSON.stringify({ name: "@fission-ai/openspec", version: "1.10.0" }),
  );
  await writeFile(
    openspecEntrypoint,
    `console.log(JSON.stringify({changes: [], root: {path: ${JSON.stringify(root)}, source: "nearest"}}));\n`,
  );

  const runtimeArchify = path.join(flowkitHome, "tools", "archify", "2.15.0");
  const archifyEntrypoint = path.join(runtimeArchify, "bin", "archify.mjs");
  await mkdir(path.dirname(archifyEntrypoint), { recursive: true });
  await writeFile(
    path.join(runtimeArchify, "package.json"),
    JSON.stringify({ name: "archify", version: "2.15.0" }),
  );
  await writeFile(
    archifyEntrypoint,
    `import fs from "node:fs"; const args=process.argv.slice(2); const i=args.indexOf("--receipt"); if(i>=0) fs.writeFileSync(args[i+1], "{}\\n"); process.exit(0);\n`,
  );

  const lock = path.join(root, "config", "tools", "toolchain.lock.json");
  await mkdir(path.dirname(lock), { recursive: true });
  await writeFile(
    lock,
    `${JSON.stringify({
      schemaVersion: 1,
      generatedFor: "delivery-final-test",
      openspec: {
        packageName: "@fission-ai/openspec",
        version: "1.10.0",
        runtimeRoot: "${FLOWKIT_HOME}/tools/openspec/1.10.0",
        entrypoint: "bin/openspec.js",
      },
      archify: {
        packageName: "archify",
        version: "2.15.0",
        runtimeRoot: "${FLOWKIT_HOME}/tools/archify/2.15.0",
        entrypoint: "bin/archify.mjs",
      },
    })}\n`,
  );
  await git(root, "add", ".");
  await git(root, "commit", "-qm", "fixture");
  return {
    root,
    flowkitHome,
    manifestPath,
    openspecEntrypoint,
    current,
    planned,
  };
}

function presentationSensitiveManifest(): string {
  return `# retained manifest header
id: "${deliveryId}"

delivery:
  state: active # retain this delivery-state comment
  fullTestStatus: pending
  finalizationStatus: pending

reference:
  kind: "quoted-kind"
  note: "This deliberately long quoted scalar must stay on exactly one source line after Delivery Final updates the approved closure fields."

unrelated:
  quoted: "preserve these quotes"
  literal: |-
    preserve
    these lines

changes:
  - id: first-change
    required: true
    state: completed

  - id: second-change
    required: true
    state: completed
`;
}

async function cleanup(fixture: Fixture): Promise<void> {
  await Promise.all([
    rm(fixture.root, { recursive: true, force: true }),
    rm(fixture.flowkitHome, { recursive: true, force: true }),
  ]);
}

async function acceptedOutcomes(fixture: Fixture): Promise<{
  readonly fullTest: DeliveryFullTestInvocationTerminal;
  readonly architecture: DeliveryArchitectureFinalizationTerminal;
}> {
  const fullTest = await invokeDeliveryFullTestOperation(fixture.root, {
    deliveryId,
    ownerAuthority: authority("authorize-formal-full-test"),
    checks: [noOpCheck()],
  });
  assert.equal(fullTest.status, "terminal");
  if (fullTest.status !== "terminal") throw new Error("Full Test failed");
  const actual = architectureJson("Actual");
  const outputs: DeliveryArchitectureFinalizationDerivedOutputs = {
    actualArchitecture: { intent: "materialize", content: actual },
    currentToActualCompare: {
      intent: "materialize",
      content: compareJson(
        "current-to-actual",
        "./current.architecture.json",
        fixture.current,
        actual,
      ),
    },
    plannedToActualCompare: {
      intent: "materialize",
      content: compareJson(
        "planned-to-actual",
        "./planned.architecture.json",
        fixture.planned,
        actual,
      ),
    },
    workflow: { intent: "materialize", content: systemViewJson("workflow") },
    lifecycle: { intent: "materialize", content: systemViewJson("lifecycle") },
    dataFlow: { intent: "materialize", content: systemViewJson("dataflow") },
  };
  const architecture = await invokeDeliveryArchitectureFinalizationOperation(
    fixture.root,
    { deliveryId, fullTestOutcome: fullTest, flowkitHome: fixture.flowkitHome },
    () => ({ status: "ready", outputs }),
  );
  assert.equal(architecture.status, "terminal");
  if (architecture.status !== "terminal") {
    throw new Error("Architecture Finalization failed");
  }
  return { fullTest, architecture };
}

function finalInput(
  fixture: Fixture,
  outcomes: Awaited<ReturnType<typeof acceptedOutcomes>>,
): object {
  return {
    deliveryId,
    ownerAuthority: authority("finalize-delivery"),
    fullTestOutcome: outcomes.fullTest,
    architectureOutcome: outcomes.architecture,
    flowkitHome: fixture.flowkitHome,
  };
}

test("Delivery Final prepares complete prerequisites and materializes one bounded closure", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    await mkdir(path.join(fixture.root, ".flowkit", "runs"), {
      recursive: true,
    });
    await writeFile(
      path.join(fixture.root, ".flowkit", "runs", "proof.json"),
      "{}\n",
    );
    assert.equal(
      await deriveApplicableCheckCandidateRef(fixture.root),
      outcomes.architecture.record.architectureMaterializedCandidateRef,
    );
    const prepared = await prepareDeliveryFinalOperationPackage(
      fixture.root,
      finalInput(fixture, outcomes),
    );
    assert.equal(prepared?.operationId, "delivery-final");
    assert.deepEqual(prepared?.operationFacts.completedRequiredChangeIds, [
      "first-change",
      "second-change",
    ]);

    const before = (await git(fixture.root, "status", "--short")).split(
      /\r?\n/,
    );
    const outcome = await invokeDeliveryFinalOperation(
      fixture.root,
      finalInput(fixture, outcomes),
      () => ({ status: "ready" }),
    );
    assert.equal(outcome.status, "terminal");
    if (outcome.status !== "terminal") throw new Error("Final failed");
    assert.equal(
      isDeliveryFinalizationRecordForPackage(
        outcome.record,
        outcome.operationPackage,
      ),
      true,
    );
    assert.notEqual(
      outcome.record.finalizedCandidateRef,
      outcome.record.architectureMaterializedCandidateRef,
    );
    const manifestBytes = await readFile(fixture.manifestPath, "utf8");
    assert.match(manifestBytes, /state: completed/);
    assert.match(manifestBytes, /fullTestStatus: passed/);
    assert.match(
      manifestBytes,
      /gitCheckpoint: pending-owner-authorized-local-delivery-commit/,
    );
    assert.equal(manifestBytes.includes("finalizedCandidateRef"), false);
    const after = (await git(fixture.root, "status", "--short")).split(/\r?\n/);
    assert.deepEqual(
      after.filter((line) => !before.includes(line)),
      [`M openspec/delivery-groups/${deliveryId}.yaml`],
    );
  } finally {
    await cleanup(fixture);
  }
});

test("Delivery Final writer preserves all non-target manifest bytes and ordering", async () => {
  const fixture = await createFixture(presentationSensitiveManifest());
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const prepared = await prepareDeliveryFinalOperationPackage(
      fixture.root,
      finalInput(fixture, outcomes),
    );
    assert.notEqual(prepared, null);
    if (prepared === null) return;

    const before = await readFile(fixture.manifestPath, "utf8");
    const facts = prepared.operationFacts;
    const expected = before
      .replace(
        "  state: active # retain this delivery-state comment\n",
        "  state: completed # retain this delivery-state comment\n",
      )
      .replace("  fullTestStatus: pending\n", "  fullTestStatus: passed\n")
      .replace(
        "  finalizationStatus: pending\n",
        [
          "  finalizationStatus: completed",
          `  formalVerificationCandidate: ${JSON.stringify(facts.verifiedCandidateRef)}`,
          "finalization:",
          "  state: completed",
          `  verifiedCandidateRef: ${JSON.stringify(facts.verifiedCandidateRef)}`,
          `  fullTestExecutionRef: ${JSON.stringify(facts.fullTestExecutionRef)}`,
          `  architectureFinalizationRef: ${JSON.stringify(facts.architectureFinalizationRef)}`,
          `  architectureMaterializedCandidateRef: ${JSON.stringify(facts.architectureMaterializedCandidateRef)}`,
          "  gitCheckpoint: pending-owner-authorized-local-delivery-commit",
          "",
        ].join("\n"),
      );

    assert.notEqual(
      await writeDeliveryFinalCoordinationClosure(fixture.root, prepared),
      null,
    );
    assert.equal(await readFile(fixture.manifestPath, "utf8"), expected);
  } finally {
    await cleanup(fixture);
  }
});

test("Delivery Final coordination reader rejects missing, mismatched, duplicate, and incomplete manifests", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-final-manifest-"));
  const target = path.join(
    root,
    "openspec",
    "delivery-groups",
    `${deliveryId}.yaml`,
  );
  try {
    assert.equal(
      await readDeliveryFinalCoordinationPrestate(root, deliveryId),
      null,
    );
    await mkdir(path.dirname(target), { recursive: true });
    for (const invalid of [
      manifest("wrong-delivery"),
      manifest(deliveryId, "active"),
      `${manifest()}  - id: first-change\n    required: false\n    state: completed\n`,
      "not: [valid",
    ]) {
      await writeFile(target, invalid);
      assert.equal(
        await readDeliveryFinalCoordinationPrestate(root, deliveryId),
        null,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Delivery Final coordination writer never returns success on staging, replace, or readback failure", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const prepared = await prepareDeliveryFinalOperationPackage(
      fixture.root,
      finalInput(fixture, outcomes),
    );
    assert.notEqual(prepared, null);
    if (prepared === null) return;
    const original = await readFile(fixture.manifestPath);

    const stagingFailure = mock.method(fs, "open", async () => {
      throw new Error("injected staging failure");
    });
    assert.equal(
      await writeDeliveryFinalCoordinationClosure(fixture.root, prepared),
      null,
    );
    stagingFailure.mock.restore();
    assert.deepEqual(await readFile(fixture.manifestPath), original);

    const replaceFailure = mock.method(fs, "rename", async () => {
      throw new Error("injected replace failure");
    });
    assert.equal(
      await writeDeliveryFinalCoordinationClosure(fixture.root, prepared),
      null,
    );
    replaceFailure.mock.restore();
    assert.deepEqual(await readFile(fixture.manifestPath), original);

    const originalReadFile = fs.readFile.bind(fs);
    let manifestReads = 0;
    const readbackFailure = mock.method(
      fs,
      "readFile",
      async (target: Parameters<typeof fs.readFile>[0]) => {
        if (String(target) === fixture.manifestPath && ++manifestReads === 3) {
          throw new Error("injected readback failure");
        }
        return originalReadFile(target);
      },
    );
    assert.equal(
      await writeDeliveryFinalCoordinationClosure(fixture.root, prepared),
      null,
    );
    readbackFailure.mock.restore();
    assert.match(
      await readFile(fixture.manifestPath, "utf8"),
      /state: completed/,
    );
    const entries = await fs.readdir(path.dirname(fixture.manifestPath));
    assert.equal(
      entries.some((entry) => entry.endsWith(".tmp")),
      false,
    );
  } finally {
    mock.restoreAll();
    await cleanup(fixture);
  }
});

test("Delivery Final preparation rejects partial facts, active OpenSpec, output drift, and candidate drift", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const input = finalInput(fixture, outcomes) as Record<string, unknown>;
    assert.notEqual(
      await prepareDeliveryFinalOperationPackage(fixture.root, input),
      null,
    );
    assert.equal(
      await prepareDeliveryFinalOperationPackage(fixture.root, {
        ...input,
        fullTestOutcome: { status: "passed" },
      }),
      null,
    );

    await writeFile(
      fixture.openspecEntrypoint,
      `console.log(JSON.stringify({changes:[{name:"active-change"}],root:{path:${JSON.stringify(fixture.root)},source:"nearest"}}));\n`,
    );
    assert.equal(
      await prepareDeliveryFinalOperationPackage(fixture.root, input),
      null,
    );
    await writeFile(
      fixture.openspecEntrypoint,
      `console.log(JSON.stringify({changes:[],root:{path:${JSON.stringify(fixture.root)},source:"nearest"}}));\n`,
    );

    const actualPath = path.join(
      fixture.root,
      "architecture",
      deliveryId,
      "json",
      "actual.architecture.json",
    );
    const actual = await readFile(actualPath);
    await writeFile(actualPath, "{}\n");
    assert.equal(
      await prepareDeliveryFinalOperationPackage(fixture.root, input),
      null,
    );
    await writeFile(actualPath, actual);
    await writeFile(fixture.openspecEntrypoint, "process.exit(7);\n");
    assert.equal(
      await prepareDeliveryFinalOperationPackage(fixture.root, input),
      null,
    );
    await writeFile(
      fixture.openspecEntrypoint,
      `console.log(JSON.stringify({changes:[],root:{path:${JSON.stringify(fixture.root)},source:"nearest"}}));\n`,
    );
    await writeFile(path.join(fixture.root, "source.txt"), "drift\n");
    assert.equal(
      await prepareDeliveryFinalOperationPackage(fixture.root, input),
      null,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("Delivery Final callback is defensive and correction or invalid results do not close coordination", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const input = finalInput(fixture, outcomes);
    const before = await readFile(fixture.manifestPath);
    const correction = await invokeDeliveryFinalOperation(
      fixture.root,
      input,
      ({ operationPackage }) => {
        (
          operationPackage.operationFacts.completedRequiredChangeIds as string[]
        )[0] = "mutated-change";
        (operationPackage.ownerAuthority.scope as string[])[0] = "git";
        return { status: "correction-required", reason: "needs correction" };
      },
    );
    assert.equal(correction.status, "correction-required");
    assert.deepEqual(await readFile(fixture.manifestPath), before);
    if (correction.status === "correction-required") {
      assert.deepEqual(
        correction.operationPackage.operationFacts.completedRequiredChangeIds,
        ["first-change", "second-change"],
      );
      assert.deepEqual(correction.operationPackage.ownerAuthority.scope, [
        "delivery-final",
      ]);
    }
    const invalid = await invokeDeliveryFinalOperation(
      fixture.root,
      input,
      () => ({ status: "ready", extra: true }) as never,
    );
    assert.deepEqual(invalid, {
      status: "failed",
      reason: "execution-result-rejected",
      record: null,
    });
    assert.deepEqual(await readFile(fixture.manifestPath), before);
    const drift = await invokeDeliveryFinalOperation(
      fixture.root,
      input,
      async () => {
        await writeFile(
          path.join(fixture.root, "source.txt"),
          "callback drift\n",
        );
        return { status: "ready" };
      },
    );
    assert.equal(drift.status, "correction-required");
    assert.deepEqual(await readFile(fixture.manifestPath), before);
  } finally {
    await cleanup(fixture);
  }
});

test("Delivery Finalization ref has a fixed golden vector and ordered projection", async () => {
  const guidanceRef = {
    path: "skills/delivery/final/SKILL.md",
    contentSha256: "c".repeat(64),
  } as const;
  const operationPackage = formDeliveryOperationPackage(
    deliveryId,
    "delivery-final",
    authority("finalize-delivery"),
    {
      verifiedCandidateRef: `candidate:sha256:${"1".repeat(64)}`,
      fullTestExecutionRef: `full-test-execution:sha256:${"2".repeat(64)}`,
      architectureFinalizationRef: `architecture-finalization:sha256:${"3".repeat(64)}`,
      architectureMaterializedCandidateRef: `candidate:sha256:${"4".repeat(64)}`,
      coordinationPrestateRef: {
        artifact: `openspec/delivery-groups/${deliveryId}.yaml`,
        contentSha256: "5".repeat(64),
        bytes: 101,
      },
      completedRequiredChangeIds: ["first-change", "second-change"],
    },
    guidanceRef,
  );
  assert.notEqual(operationPackage, null);
  const coordinationRef = {
    artifact: `openspec/delivery-groups/${deliveryId}.yaml`,
    contentSha256: "6".repeat(64),
    bytes: 202,
  };
  const finalizedCandidateRef = `candidate:sha256:${"7".repeat(64)}`;
  const exact = deriveDeliveryFinalizationRef(
    operationPackage,
    coordinationRef,
    finalizedCandidateRef,
  );
  assert.equal(
    exact,
    "delivery-finalization:sha256:decc6a5bc04208eeccf0fb080ad1feef95797d4abd044e43e8f8becbdf1b4e70",
  );
  assert.equal(
    deriveDeliveryFinalizationRef(
      {
        guidanceRef,
        operationFacts: operationPackage!.operationFacts,
        ownerAuthority: operationPackage!.ownerAuthority,
        operationId: "delivery-final",
        deliveryId,
      },
      {
        bytes: 202,
        contentSha256: "6".repeat(64),
        artifact: coordinationRef.artifact,
      },
      finalizedCandidateRef,
    ),
    exact,
  );
  const reversed = formDeliveryOperationPackage(
    deliveryId,
    "delivery-final",
    authority("finalize-delivery"),
    {
      ...operationPackage!.operationFacts,
      completedRequiredChangeIds: ["second-change", "first-change"],
    },
    guidanceRef,
  );
  assert.notEqual(
    deriveDeliveryFinalizationRef(
      reversed,
      coordinationRef,
      finalizedCandidateRef,
    ),
    exact,
  );
  assert.notEqual(
    deriveDeliveryFinalizationRef(
      operationPackage,
      { ...coordinationRef, bytes: 203 },
      finalizedCandidateRef,
    ),
    exact,
  );
  assert.equal(await resolveDeliveryGuidanceRef("", "delivery-final"), null);
});
