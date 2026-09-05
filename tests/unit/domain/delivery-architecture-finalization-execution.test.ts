import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import {
  deriveApplicableCheckCandidateRef,
  deriveDeliveryArchitectureFinalizationRef,
  formDeliveryOperationPackage,
  invokeDeliveryArchitectureFinalizationOperation,
  invokeDeliveryFullTestOperation,
  isDeliveryArchitectureFinalizationOperationFacts,
  isDeliveryOperationPackage,
  prepareDeliveryArchitectureFinalizationOperationPackage,
  resolveDeliveryGuidanceRef,
  type ApplicableCheckDeclaration,
  type DeliveryArchitectureFinalizationDerivationInput,
  type DeliveryArchitectureFinalizationDerivedOutputs,
  type DeliveryFullTestInvocationTerminal,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";

const execFileAsync = promisify(execFile);
const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";

async function git(root: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  return stdout.trim();
}

function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

function fullTestAuthority(): OwnerAuthorityFact {
  return {
    ref: `owner:${"a".repeat(64)}`,
    decision: "authorize-formal-full-test",
    deliveryId,
    sourceRef: "conversation:owner-formal-full-test",
    scope: ["delivery-full-test"],
  };
}

function noOpCheck(exitCode = 0): ApplicableCheckDeclaration {
  return {
    checkId: "fixture-check",
    program: process.execPath,
    args: ["-e", `process.exit(${exitCode})`],
    configRefs: ["config:fixture"],
    toolRefs: ["tool:node"],
    environmentRefs: ["environment:test"],
  };
}

function architectureJson(label: string): string {
  return `${JSON.stringify(
    {
      schema_version: 1,
      diagram_type: "architecture",
      meta: { title: label },
      boundaries: [],
      nodes: [],
      connections: [],
    },
    null,
    2,
  )}\n`;
}

function systemViewJson(
  type: "workflow" | "lifecycle" | "dataflow",
  label: string,
): string {
  return `${JSON.stringify(
    {
      schema_version: 1,
      diagram_type: type,
      meta: { title: label },
      ...(type === "workflow" ? { lanes: [], steps: [], transitions: [] } : {}),
      ...(type === "lifecycle" ? { states: [], transitions: [] } : {}),
      ...(type === "dataflow" ? { stages: [], nodes: [], flows: [] } : {}),
    },
    null,
    2,
  )}\n`;
}

interface Fixture {
  readonly root: string;
  readonly flowkitHome: string;
  readonly archifyLog: string;
  readonly current: string;
  readonly planned: string;
  readonly dataFlow: string;
}

async function createFakeArchifyRuntime(
  root: string,
  flowkitHome: string,
): Promise<string> {
  const runtimeRoot = path.join(flowkitHome, "tools", "archify", "2.15.0");
  const entrypoint = path.join(runtimeRoot, "bin", "archify.mjs");
  const log = path.join(runtimeRoot, "invocations.log");
  await mkdir(path.dirname(entrypoint), { recursive: true });
  await writeFile(
    path.join(runtimeRoot, "package.json"),
    `${JSON.stringify({ name: "archify", version: "2.15.0" }, null, 2)}\n`,
  );
  await writeFile(
    entrypoint,
    `import fs from "node:fs";\nimport path from "node:path";\nimport { fileURLToPath } from "node:url";\nconst runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");\nconst log = path.join(runtimeRoot, "invocations.log");\nconst args = process.argv.slice(2);\nfs.appendFileSync(log, JSON.stringify(args) + "\\n");\nconst jsonPaths = [];\nif (args[0] === "validate") jsonPaths.push(args[2]);\nif (args[0] === "compare") jsonPaths.push(args[2], args[3]);\nfor (const file of jsonPaths) {\n  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));\n  if (parsed.__invalid === true) process.exit(7);\n}\nconst receiptIndex = args.indexOf("--receipt");\nif (receiptIndex >= 0) fs.writeFileSync(args[receiptIndex + 1], "{}\\n");\nprocess.exit(0);\n`,
    "utf8",
  );

  const lock = path.join(root, "config", "tools", "toolchain.lock.json");
  await mkdir(path.dirname(lock), { recursive: true });
  await writeFile(
    lock,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        generatedFor: "architecture-finalization-test",
        archify: {
          packageName: "archify",
          version: "2.15.0",
          runtimeRoot: "${FLOWKIT_HOME}/tools/archify/2.15.0",
          entrypoint: "bin/archify.mjs",
        },
      },
      null,
      2,
    )}\n`,
  );
  return log;
}

async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(
    path.join(tmpdir(), "flowkit-architecture-finalization-"),
  );
  const flowkitHome = await mkdtemp(
    path.join(tmpdir(), "flowkit-architecture-home-"),
  );
  await git(root, "init", "-q");
  await git(root, "config", "user.email", "flowkit@example.invalid");
  await git(root, "config", "user.name", "Flowkit Test");
  await writeFile(path.join(root, "source.txt"), "base\n", "utf8");

  const fullTestSkill = path.join(
    root,
    "skills",
    "delivery",
    "full-test",
    "SKILL.md",
  );
  const architectureSkill = path.join(
    root,
    "skills",
    "delivery",
    "architecture-finalization",
    "SKILL.md",
  );
  await mkdir(path.dirname(fullTestSkill), { recursive: true });
  await mkdir(path.dirname(architectureSkill), { recursive: true });
  await writeFile(fullTestSkill, "# full test fixture\n", "utf8");
  await writeFile(
    architectureSkill,
    "# architecture finalization fixture\n",
    "utf8",
  );

  const deliveryRoot = path.join(root, "architecture", deliveryId, "json");
  await mkdir(deliveryRoot, { recursive: true });
  const current = architectureJson("Current");
  const planned = architectureJson("Planned");
  await writeFile(
    path.join(deliveryRoot, "current.architecture.json"),
    current,
  );
  await writeFile(
    path.join(deliveryRoot, "planned.architecture.json"),
    planned,
  );

  const systemRoot = path.join(root, "architecture", "system");
  await mkdir(systemRoot, { recursive: true });
  const dataFlow = systemViewJson("dataflow", "Existing Data Flow");
  await writeFile(path.join(systemRoot, "data-flow.json"), dataFlow);

  const archifyLog = await createFakeArchifyRuntime(root, flowkitHome);
  await git(root, "add", ".");
  await git(root, "commit", "-qm", "fixture");
  return { root, flowkitHome, archifyLog, current, planned, dataFlow };
}

async function passedFullTest(
  root: string,
): Promise<DeliveryFullTestInvocationTerminal> {
  const outcome = await invokeDeliveryFullTestOperation(root, {
    deliveryId,
    ownerAuthority: fullTestAuthority(),
    checks: [noOpCheck()],
  });
  assert.equal(outcome.status, "terminal");
  if (outcome.status !== "terminal")
    throw new Error("expected terminal Full Test");
  assert.equal(outcome.verdict, "passed");
  return outcome;
}

function compareJson(
  pair: "current-to-actual" | "planned-to-actual",
  leftRef: "./current.architecture.json" | "./planned.architecture.json",
  leftContent: string,
  actualContent: string,
): string {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      kind: "architecture-thin-compare",
      deliveryId,
      pair,
      left: {
        ref: leftRef,
        sha256: sha256(leftContent),
        bytes: Buffer.byteLength(leftContent),
      },
      right: {
        ref: "./actual.architecture.json",
        sha256: sha256(actualContent),
        bytes: Buffer.byteLength(actualContent),
      },
      classification: ["semantic", "presentation"],
      summary: {
        semantic: "fixture convergence",
        presentation: "fixture side-by-side view",
      },
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
    },
    null,
    2,
  )}\n`;
}

function validOutputs(
  fixture: Fixture,
): DeliveryArchitectureFinalizationDerivedOutputs {
  const actual = architectureJson("Actual");
  return {
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
    workflow: {
      intent: "materialize",
      content: systemViewJson("workflow", "Workflow"),
    },
    lifecycle: {
      intent: "materialize",
      content: systemViewJson("lifecycle", "Lifecycle"),
    },
    dataFlow: { intent: "preserve-existing" },
  };
}

async function cleanup(fixture: Fixture): Promise<void> {
  await rm(fixture.root, { recursive: true, force: true });
  await rm(fixture.flowkitHome, { recursive: true, force: true });
}

test("Architecture Finalization package is a third closed variant with null Owner authority", async () => {
  const fixture = await createFixture();
  try {
    const fullTestOutcome = await passedFullTest(fixture.root);
    const prepared =
      await prepareDeliveryArchitectureFinalizationOperationPackage(
        fixture.root,
        { deliveryId, fullTestOutcome },
      );
    assert.notEqual(prepared, null);
    assert.equal(prepared!.operationId, "delivery-architecture-finalization");
    assert.equal(prepared!.ownerAuthority, null);
    assert.equal(isDeliveryOperationPackage(prepared), true);
    assert.equal(
      isDeliveryArchitectureFinalizationOperationFacts(
        prepared!.operationFacts,
      ),
      true,
    );
    assert.equal(
      prepared!.operationFacts.systemViewPrestate.workflowSha256,
      null,
    );
    assert.equal(
      prepared!.operationFacts.systemViewPrestate.lifecycleSha256,
      null,
    );
    assert.equal(
      prepared!.operationFacts.systemViewPrestate.dataFlowSha256,
      sha256(fixture.dataFlow),
    );

    assert.equal(
      formDeliveryOperationPackage(
        deliveryId,
        "delivery-architecture-finalization",
        fullTestAuthority(),
        prepared!.operationFacts,
        prepared!.guidanceRef,
      ),
      null,
    );
    assert.equal(
      formDeliveryOperationPackage(
        deliveryId,
        "delivery-final",
        null,
        prepared!.operationFacts,
        {
          path: "skills/delivery/final/SKILL.md",
          contentSha256: "b".repeat(64),
        },
      ),
      null,
    );
    assert.equal(
      formDeliveryOperationPackage(
        deliveryId,
        "delivery-repository-integration",
        null,
        prepared!.operationFacts,
        {
          path: "skills/delivery/repository-integration/SKILL.md",
          contentSha256: "b".repeat(64),
        },
      ),
      null,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("Architecture Finalization closure serialization matches its golden vector", () => {
  const operationPackage = formDeliveryOperationPackage(
    deliveryId,
    "delivery-architecture-finalization",
    null,
    {
      verifiedCandidateRef: "candidate:sha256:" + "a".repeat(64),
      fullTestExecutionRef: "full-test-execution:sha256:" + "b".repeat(64),
      currentArchitectureRef: {
        artifact:
          "architecture/" + deliveryId + "/json/current.architecture.json",
        contentSha256: "c".repeat(64),
      },
      plannedArchitectureRef: {
        artifact:
          "architecture/" + deliveryId + "/json/planned.architecture.json",
        contentSha256: "d".repeat(64),
      },
      systemViewPrestate: {
        workflowSha256: null,
        lifecycleSha256: "e".repeat(64),
        dataFlowSha256: "f".repeat(64),
      },
    },
    {
      path: "skills/delivery/architecture-finalization/SKILL.md",
      contentSha256: "1".repeat(64),
    },
  );
  assert.notEqual(operationPackage, null);
  const output = (artifact: string, digit: string, bytes: number) => ({
    artifact,
    contentSha256: digit.repeat(64),
    bytes,
  });
  const record = {
    architectureFinalizationRef:
      "architecture-finalization:sha256:" + "0".repeat(64),
    verifiedCandidateRef: "candidate:sha256:" + "a".repeat(64),
    fullTestExecutionRef: "full-test-execution:sha256:" + "b".repeat(64),
    outputs: {
      actualArchitectureRef: output(
        `architecture/${deliveryId}/json/actual.architecture.json`,
        "2",
        2,
      ),
      currentToActualCompareRef: output(
        `architecture/${deliveryId}/json/current-to-actual.compare.json`,
        "3",
        3,
      ),
      plannedToActualCompareRef: output(
        `architecture/${deliveryId}/json/planned-to-actual.compare.json`,
        "4",
        4,
      ),
      workflowRef: output("architecture/system/workflow.json", "5", 5),
      lifecycleRef: output("architecture/system/lifecycle.json", "6", 6),
      dataFlowRef: output("architecture/system/data-flow.json", "7", 7),
    },
    architectureMaterializedCandidateRef: "candidate:sha256:" + "8".repeat(64),
  };
  assert.equal(
    deriveDeliveryArchitectureFinalizationRef(operationPackage, record),
    "architecture-finalization:sha256:aede656095acba662dbfeec440cee13bbdda0a6385da45819f35a6672de3d3bc",
  );
});

test("preparation derives trusted candidate and architecture prestate and rejects stale or failed Full Test", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    assert.notEqual(
      await prepareDeliveryArchitectureFinalizationOperationPackage(
        fixture.root,
        {
          deliveryId,
          fullTestOutcome: passed,
        },
      ),
      null,
    );

    await writeFile(path.join(fixture.root, "source.txt"), "changed\n");
    assert.equal(
      await prepareDeliveryArchitectureFinalizationOperationPackage(
        fixture.root,
        {
          deliveryId,
          fullTestOutcome: passed,
        },
      ),
      null,
    );
    await git(fixture.root, "checkout", "--", "source.txt");

    const failed = await invokeDeliveryFullTestOperation(fixture.root, {
      deliveryId,
      ownerAuthority: fullTestAuthority(),
      checks: [noOpCheck(3)],
    });
    assert.equal(failed.status, "terminal");
    if (failed.status === "terminal") assert.equal(failed.verdict, "failed");
    assert.equal(
      await prepareDeliveryArchitectureFinalizationOperationPackage(
        fixture.root,
        {
          deliveryId,
          fullTestOutcome: failed,
        },
      ),
      null,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("trusted host materializes only six fixed slots and preserves unchanged Data Flow exact bytes", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    const dataFlowPath = path.join(
      fixture.root,
      "architecture",
      "system",
      "data-flow.json",
    );
    const beforeDataFlow = await readFile(dataFlowPath);
    const beforeStat = await stat(dataFlowPath);

    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      fixture.root,
      { deliveryId, fullTestOutcome: passed, flowkitHome: fixture.flowkitHome },
      async (input: DeliveryArchitectureFinalizationDerivationInput) => {
        assert.equal("repositoryRoot" in input, false);
        assert.equal("outputPaths" in input, false);
        return { status: "ready", outputs: validOutputs(fixture) };
      },
    );
    assert.equal(outcome.status, "terminal");
    if (outcome.status !== "terminal") return;

    const deliveryRoot = path.join(
      fixture.root,
      "architecture",
      deliveryId,
      "json",
    );
    await access(path.join(deliveryRoot, "actual.architecture.json"));
    await access(path.join(deliveryRoot, "current-to-actual.compare.json"));
    await access(path.join(deliveryRoot, "planned-to-actual.compare.json"));
    await access(
      path.join(fixture.root, "architecture", "system", "workflow.json"),
    );
    await access(
      path.join(fixture.root, "architecture", "system", "lifecycle.json"),
    );
    assert.deepEqual(await readFile(dataFlowPath), beforeDataFlow);
    assert.equal((await stat(dataFlowPath)).mtimeMs, beforeStat.mtimeMs);

    assert.deepEqual(Object.keys(outcome.record.outputs).sort(), [
      "actualArchitectureRef",
      "currentToActualCompareRef",
      "dataFlowRef",
      "lifecycleRef",
      "plannedToActualCompareRef",
      "workflowRef",
    ]);
    assert.equal(
      outcome.record.outputs.dataFlowRef.contentSha256,
      sha256(beforeDataFlow),
    );
    assert.match(
      outcome.record.architectureMaterializedCandidateRef,
      /^candidate:sha256:[0-9a-f]{64}$/,
    );
    assert.notEqual(
      outcome.record.architectureMaterializedCandidateRef,
      passed.record.candidateRef,
    );
    assert.equal(
      deriveDeliveryArchitectureFinalizationRef(
        outcome.operationPackage,
        outcome.record,
      ),
      outcome.record.architectureFinalizationRef,
    );

    const invocations = (await readFile(fixture.archifyLog, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    assert.equal(
      invocations.filter((args) => args[0] === "validate").length,
      4,
    );
    assert.equal(invocations.filter((args) => args[0] === "compare").length, 2);
  } finally {
    await cleanup(fixture);
  }
});

test("derived callback cannot rewrite retained correction or terminal lineage", async () => {
  const correctionFixture = await createFixture();
  try {
    const passed = await passedFullTest(correctionFixture.root);
    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      correctionFixture.root,
      {
        deliveryId,
        fullTestOutcome: passed,
        flowkitHome: correctionFixture.flowkitHome,
      },
      (input) => {
        const visible = input.operationPackage as any;
        visible.deliveryId = "forged-delivery";
        visible.operationFacts.verifiedCandidateRef =
          "candidate:sha256:" + "f".repeat(64);
        visible.operationFacts.fullTestExecutionRef =
          "full-test-execution:sha256:" + "e".repeat(64);
        visible.operationFacts.systemViewPrestate.dataFlowSha256 = null;
        return { status: "correction-required", reason: "fixture correction" };
      },
    );
    assert.equal(outcome.status, "correction-required");
    if (outcome.status !== "correction-required") return;
    assert.equal(outcome.operationPackage.deliveryId, deliveryId);
    assert.equal(
      outcome.operationPackage.operationFacts.verifiedCandidateRef,
      passed.record.candidateRef,
    );
    assert.equal(
      outcome.operationPackage.operationFacts.fullTestExecutionRef,
      passed.record.executionRef,
    );
    assert.equal(
      outcome.operationPackage.operationFacts.systemViewPrestate.dataFlowSha256,
      sha256(correctionFixture.dataFlow),
    );
  } finally {
    await cleanup(correctionFixture);
  }

  const terminalFixture = await createFixture();
  try {
    const passed = await passedFullTest(terminalFixture.root);
    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      terminalFixture.root,
      {
        deliveryId,
        fullTestOutcome: passed,
        flowkitHome: terminalFixture.flowkitHome,
      },
      (input) => {
        const visible = input.operationPackage as any;
        visible.deliveryId = "forged-delivery";
        visible.operationFacts.verifiedCandidateRef =
          "candidate:sha256:" + "f".repeat(64);
        visible.guidanceRef.contentSha256 = "e".repeat(64);
        return { status: "ready", outputs: validOutputs(terminalFixture) };
      },
    );
    assert.equal(outcome.status, "terminal");
    if (outcome.status !== "terminal") return;
    assert.equal(outcome.operationPackage.deliveryId, deliveryId);
    assert.equal(
      outcome.record.verifiedCandidateRef,
      passed.record.candidateRef,
    );
    assert.equal(
      outcome.record.fullTestExecutionRef,
      passed.record.executionRef,
    );
  } finally {
    await cleanup(terminalFixture);
  }
});

test("thin compare admission rejects every non-canonical field set or value", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    const cases: readonly [string, (compare: Record<string, any>) => void][] = [
      ["extra top-level payload", (value) => (value.actual = { nodes: [] })],
      ["wrong left ref", (value) => (value.left.ref = "./wrong.json")],
      ["wrong left hash", (value) => (value.left.sha256 = "a".repeat(64))],
      ["wrong left bytes", (value) => (value.left.bytes += 1)],
      ["unknown classification", (value) => (value.classification[1] = "x")],
      [
        "duplicate classification",
        (value) => (value.classification = ["semantic", "semantic"]),
      ],
      [
        "reordered classification",
        (value) => (value.classification = ["presentation", "semantic"]),
      ],
      ["nested summary", (value) => (value.summary.semantic = { text: "x" })],
      ["missing presentation", (value) => delete value.presentation.overlay],
      ["extra presentation", (value) => (value.presentation.theme = "dark")],
      ["changed presentation", (value) => (value.presentation.overlay = true)],
    ];
    for (const [name, mutate] of cases) {
      const outputs = validOutputs(fixture);
      const compare = JSON.parse(
        outputs.currentToActualCompare.content,
      ) as Record<string, any>;
      mutate(compare);
      const outcome = await invokeDeliveryArchitectureFinalizationOperation(
        fixture.root,
        {
          deliveryId,
          fullTestOutcome: passed,
          flowkitHome: fixture.flowkitHome,
        },
        () => ({
          status: "ready",
          outputs: {
            ...outputs,
            currentToActualCompare: {
              intent: "materialize",
              content: JSON.stringify(compare) + "\n",
            },
          },
        }),
      );
      assert.deepEqual(
        outcome,
        {
          status: "failed",
          reason: "derived-validation-rejected",
          record: null,
        },
        name,
      );
    }
  } finally {
    await cleanup(fixture);
  }
});

test("Architecture closure ref is stable under property reordering and binds every trusted value", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      fixture.root,
      { deliveryId, fullTestOutcome: passed, flowkitHome: fixture.flowkitHome },
      () => ({ status: "ready", outputs: validOutputs(fixture) }),
    );
    assert.equal(outcome.status, "terminal");
    if (outcome.status !== "terminal") return;

    const reorderedRecord = {
      architectureMaterializedCandidateRef:
        outcome.record.architectureMaterializedCandidateRef,
      outputs: { ...outcome.record.outputs },
      fullTestExecutionRef: outcome.record.fullTestExecutionRef,
      verifiedCandidateRef: outcome.record.verifiedCandidateRef,
      architectureFinalizationRef: outcome.record.architectureFinalizationRef,
    };
    assert.equal(
      deriveDeliveryArchitectureFinalizationRef(
        outcome.operationPackage,
        reorderedRecord,
      ),
      outcome.record.architectureFinalizationRef,
    );

    const changedRecord = structuredClone(outcome.record);
    (changedRecord.outputs.actualArchitectureRef as any).bytes += 1;
    assert.notEqual(
      deriveDeliveryArchitectureFinalizationRef(
        outcome.operationPackage,
        changedRecord,
      ),
      outcome.record.architectureFinalizationRef,
    );

    const wrongOutputPath = structuredClone(outcome.record);
    (wrongOutputPath.outputs.actualArchitectureRef as any).artifact =
      "architecture/other/json/actual.architecture.json";
    assert.equal(
      deriveDeliveryArchitectureFinalizationRef(
        outcome.operationPackage,
        wrongOutputPath,
      ),
      null,
    );

    const emptyOutput = structuredClone(outcome.record);
    (emptyOutput.outputs.workflowRef as any).bytes = 0;
    assert.equal(
      deriveDeliveryArchitectureFinalizationRef(
        outcome.operationPackage,
        emptyOutput,
      ),
      null,
    );

    const changedPackage = structuredClone(outcome.operationPackage);
    (changedPackage.guidanceRef as any).contentSha256 = "f".repeat(64);
    assert.notEqual(
      deriveDeliveryArchitectureFinalizationRef(changedPackage, outcome.record),
      outcome.record.architectureFinalizationRef,
    );

    const runCandidate = await deriveApplicableCheckCandidateRef(fixture.root);
    assert.equal(
      runCandidate,
      outcome.record.architectureMaterializedCandidateRef,
    );
    await mkdir(path.join(fixture.root, ".flowkit", "runs", "fixture"), {
      recursive: true,
    });
    await writeFile(
      path.join(fixture.root, ".flowkit", "runs", "fixture", "result.json"),
      "{}\n",
    );
    assert.equal(
      await deriveApplicableCheckCandidateRef(fixture.root),
      outcome.record.architectureMaterializedCandidateRef,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("caller-selected output paths are rejected before package invocation", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      fixture.root,
      {
        deliveryId,
        fullTestOutcome: passed,
        flowkitHome: fixture.flowkitHome,
        outputPaths: ["src/should-not-exist.ts"],
      },
      () => ({ status: "ready", outputs: validOutputs(fixture) }),
    );
    assert.deepEqual(outcome, {
      status: "failed",
      reason: "package-formation-rejected",
      record: null,
    });
  } finally {
    await cleanup(fixture);
  }
});

test("invalid staged derived output fails before any fixed output materialization", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    const outputs = validOutputs(fixture);
    const invalidActual = '{"__invalid":true}\n';
    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      fixture.root,
      { deliveryId, fullTestOutcome: passed, flowkitHome: fixture.flowkitHome },
      () => ({
        status: "ready",
        outputs: {
          ...outputs,
          actualArchitecture: { intent: "materialize", content: invalidActual },
          currentToActualCompare: {
            intent: "materialize",
            content: compareJson(
              "current-to-actual",
              "./current.architecture.json",
              fixture.current,
              invalidActual,
            ),
          },
          plannedToActualCompare: {
            intent: "materialize",
            content: compareJson(
              "planned-to-actual",
              "./planned.architecture.json",
              fixture.planned,
              invalidActual,
            ),
          },
        },
      }),
    );
    assert.equal(outcome.status, "failed");
    assert.equal(
      await access(
        path.join(
          fixture.root,
          "architecture",
          deliveryId,
          "json",
          "actual.architecture.json",
        ),
      ).then(
        () => true,
        () => false,
      ),
      false,
    );
    assert.equal(
      await access(
        path.join(fixture.root, "architecture", "system", "workflow.json"),
      ).then(
        () => true,
        () => false,
      ),
      false,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("correction-required exits without writing derived or product-truth bytes", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    const beforeSource = await readFile(
      path.join(fixture.root, "source.txt"),
      "utf8",
    );
    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      fixture.root,
      { deliveryId, fullTestOutcome: passed, flowkitHome: fixture.flowkitHome },
      () => ({
        status: "correction-required",
        reason: "source contract mismatch",
      }),
    );
    assert.equal(outcome.status, "correction-required");
    assert.equal(
      await readFile(path.join(fixture.root, "source.txt"), "utf8"),
      beforeSource,
    );
    assert.equal(
      await access(
        path.join(
          fixture.root,
          "architecture",
          deliveryId,
          "json",
          "actual.architecture.json",
        ),
      ).then(
        () => true,
        () => false,
      ),
      false,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("repository mutation hidden inside derived callback is detected before fixed-slot materialization", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      fixture.root,
      { deliveryId, fullTestOutcome: passed, flowkitHome: fixture.flowkitHome },
      async () => {
        await writeFile(path.join(fixture.root, "source.txt"), "mutated\n");
        return { status: "ready", outputs: validOutputs(fixture) };
      },
    );
    assert.equal(outcome.status, "correction-required");
    assert.equal(
      await access(
        path.join(
          fixture.root,
          "architecture",
          deliveryId,
          "json",
          "actual.architecture.json",
        ),
      ).then(
        () => true,
        () => false,
      ),
      false,
    );
  } finally {
    await cleanup(fixture);
  }
});

test("preserve-existing requires an existing baseline while missing Workflow/Lifecycle may materialize once", async () => {
  const fixture = await createFixture();
  try {
    const passed = await passedFullTest(fixture.root);
    const outputs = validOutputs(fixture);
    const outcome = await invokeDeliveryArchitectureFinalizationOperation(
      fixture.root,
      { deliveryId, fullTestOutcome: passed, flowkitHome: fixture.flowkitHome },
      () => ({
        status: "ready",
        outputs: { ...outputs, workflow: { intent: "preserve-existing" } },
      }),
    );
    assert.deepEqual(outcome, {
      status: "failed",
      reason: "derived-result-rejected",
      record: null,
    });
  } finally {
    await cleanup(fixture);
  }
});

test("canonical Architecture Finalization Guidance stays generic and operation-bounded", async () => {
  const body = await readFile(
    "skills/delivery/architecture-finalization/SKILL.md",
    "utf8",
  );
  assert.equal(body.includes(deliveryId), false);
  assert.equal(body.includes("ArchitectureCandidateId"), false);
  assert.equal(body.includes("changed-path scanner"), true);
  assert.equal(body.includes("caller-selected output paths"), true);
  assert.equal(body.includes("Delivery Final or repository integration"), true);
  assert.notEqual(
    await resolveDeliveryGuidanceRef(
      process.cwd(),
      "delivery-architecture-finalization",
    ),
    null,
  );
});
