import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  invokeDeliveryArchitectureFinalizationOperation,
  invokeDeliveryFullTestOperation,
  type ApplicableCheckDeclaration,
  type DeliveryArchitectureFinalizationDerivedOutputs,
  type DeliveryArchitectureFinalizationTerminal,
  type DeliveryFullTestInvocationTerminal,
  type ReadDeliveryRequiredEvidence,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";
import { admittedRunMaterial } from "./delivery-run-evidence-fixture.js";
const execFileAsync = promisify(execFile);
export const deliveryId = "test-delivery-finalization";

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function git(root: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  return stdout.trim();
}

export function authority(
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

export function manifest(id = deliveryId, secondState = "completed"): string {
  return `id: ${id}\ndelivery:\n  state: active\n  fullTestStatus: pending\n  finalizationStatus: pending\nchanges:\n  - id: first-change\n    required: true\n    state: completed\n  - id: second-change\n    required: true\n    state: ${secondState}\n`;
}

export interface Fixture {
  readonly root: string;
  readonly flowkitHome: string;
  readonly manifestPath: string;
  readonly openspecEntrypoint: string;
  readonly current: string;
  readonly planned: string;
}

export async function createFixture(
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
  await mkdir(path.join(root, ".flowkit"), { recursive: true });
  await writeFile(
    path.join(root, ".flowkit", "project.json"),
    '{"projectId":"flowkit-next"}\n',
  );
  for (const closure of buildChangeClosures()) {
    for (const run of closure.runs) {
      const target = path.join(root, ...run.artifactRoot.split("/"));
      await mkdir(target, { recursive: true });
      await writeFile(path.join(target, "action.md"), run.actionMarkdown);
      await writeFile(path.join(target, "context.json"), run.contextJson);
      await writeFile(path.join(target, "result.json"), run.resultJson);
    }
  }

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

export function presentationSensitiveManifest(): string {
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

export async function cleanup(fixture: Fixture): Promise<void> {
  await Promise.all([
    rm(fixture.root, { recursive: true, force: true }),
    rm(fixture.flowkitHome, { recursive: true, force: true }),
  ]);
}

export async function acceptedOutcomes(fixture: Fixture): Promise<{
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

export function finalInput(
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

function buildChangeClosures() {
  return ["first-change", "second-change"].map((changeId, index) => {
    const date = `2026090${index + 1}`;
    const reviewApplyRunId = `${date}-001-review-apply`;
    const archiveRunId = `${date}-002-archive`;
    const actionIdentity = (actionId: "review-apply" | "archive") => ({
      deliveryId,
      changeId,
      actionId,
    });
    const run = (
      runId: string,
      sequence: number,
      actionId: "review-apply" | "archive",
      previousRunId: string | null,
    ) => {
      const identity = actionIdentity(actionId);
      const context = {
        runId,
        occurrence: { date, sequence, actionId },
        actionIdentity: identity,
        role:
          actionId === "review-apply"
            ? ("reviewer" as const)
            : ("author" as const),
        lifecycleState: "prepared" as const,
        ownerAuthority: null,
        previousRunId,
      };
      const result = {
        runId,
        actionIdentity: identity,
        authorConclusion: actionId === "archive" ? "PASS" : null,
        reviewerVerdict: actionId === "review-apply" ? "approved" : null,
        verificationVerdict: null,
        nextBoundary: actionId === "review-apply" ? "archive" : "checkpoint",
        facts: {},
      };
      return admittedRunMaterial({
        runId,
        artifactRoot: `.flowkit/runs/${deliveryId}/00${index + 1}-${changeId}/${runId}`,
        actionMarkdown: Buffer.from(`# ${actionId}\n`),
        contextJson: Buffer.from(`${JSON.stringify(context)}\n`),
        resultJson: Buffer.from(`${JSON.stringify(result)}\n`),
      });
    };
    return {
      changeId,
      archiveRunId,
      reviewApplyRunId,
      runs: [
        run(reviewApplyRunId, 1, "review-apply", null),
        run(archiveRunId, 2, "archive", reviewApplyRunId),
      ],
    };
  });
}

export function evidenceSource(
  outcomes: Awaited<ReturnType<typeof acceptedOutcomes>>,
  repositoryRoot: string,
): ReadDeliveryRequiredEvidence {
  const changeClosures = buildChangeClosures();
  const fullTestOutcome = Buffer.from(`${JSON.stringify(outcomes.fullTest)}\n`);
  const architectureOutcome = Buffer.from(
    `${JSON.stringify(outcomes.architecture)}\n`,
  );
  return {
    readChangeClosure: async ({
      projectId,
      deliveryId: requested,
      changeId,
    }) => {
      if (projectId !== "flowkit-next" || requested !== deliveryId) {
        throw new Error("wrong evidence identity");
      }
      const closure = changeClosures.find(
        (entry) => entry.changeId === changeId,
      );
      if (closure === undefined) throw new Error("unknown Change");
      return {
        ...closure,
        runs: await Promise.all(
          closure.runs.map(async (run) => {
            const target = path.join(
              repositoryRoot,
              ...run.artifactRoot.split("/"),
            );
            return {
              runId: run.runId,
              artifactRoot: run.artifactRoot,
              actionMarkdown: await readFile(path.join(target, "action.md")),
              contextJson: await readFile(path.join(target, "context.json")),
              resultJson: await readFile(path.join(target, "result.json")),
              admission: run.admission,
            };
          }),
        ),
      };
    },
    readFullTest: ({ projectId, deliveryId: requested, executionRef }) => {
      if (
        projectId !== "flowkit-next" ||
        requested !== deliveryId ||
        executionRef !== outcomes.fullTest.record.executionRef
      )
        throw new Error("wrong Full Test request");
      return {
        sourceRef: "test:full-test-source",
        outcomeJson: Buffer.from(fullTestOutcome),
        artifacts: [
          {
            artifact: "full-test/outcome.json",
            bytes: Buffer.from(fullTestOutcome),
          },
        ],
      };
    },
    readArchitecture: ({
      projectId,
      deliveryId: requested,
      architectureFinalizationRef,
    }) => {
      if (
        projectId !== "flowkit-next" ||
        requested !== deliveryId ||
        architectureFinalizationRef !==
          outcomes.architecture.record.architectureFinalizationRef
      )
        throw new Error("wrong Architecture request");
      return {
        sourceRef: "test:architecture-source",
        outcomeJson: Buffer.from(architectureOutcome),
        artifacts: [
          {
            artifact: "architecture/outcome.json",
            bytes: Buffer.from(architectureOutcome),
          },
        ],
      };
    },
  };
}
