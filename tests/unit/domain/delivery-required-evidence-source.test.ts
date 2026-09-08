import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { deriveDeliveryRequiredEvidenceFromSource } from "../../../src/internal/delivery-required-evidence-source.js";
import {
  acceptedOutcomes,
  cleanup,
  createFixture,
  deliveryId,
  evidenceSource,
} from "./delivery-final-fixture.js";
import {
  admittedRunMaterial,
  bindRunAdmission,
} from "./delivery-run-evidence-fixture.js";

async function persistRun(
  root: string,
  run: ReturnType<typeof bindRunAdmission>,
): Promise<void> {
  const target = path.join(root, ...run.artifactRoot.split("/"));
  await mkdir(target, { recursive: true });
  await Promise.all([
    writeFile(path.join(target, "action.md"), run.actionMarkdown),
    writeFile(path.join(target, "context.json"), run.contextJson),
    writeFile(path.join(target, "result.json"), run.resultJson),
  ]);
}

function expected(outcomes: Awaited<ReturnType<typeof acceptedOutcomes>>) {
  return {
    projectId: "flowkit-next",
    deliveryId,
    changeIds: ["first-change", "second-change"],
    fullTestExecutionRef: outcomes.fullTest.record.executionRef,
    fullTestOutcome: outcomes.fullTest,
  };
}

test("Final rejects a source-bound Run that canonical admission rejects", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const source = evidenceSource(outcomes, fixture.root);
    const first = await source.readChangeClosure({
      projectId: "flowkit-next",
      deliveryId,
      changeId: "first-change",
    });
    const archive = first.runs.find((run) => run.runId === first.archiveRunId)!;
    const result = JSON.parse(Buffer.from(archive.resultJson).toString("utf8"));
    result.verificationVerdict = "passed";
    const invalid = bindRunAdmission({
      ...archive,
      resultJson: Buffer.from(`${JSON.stringify(result)}\n`),
    });
    await persistRun(fixture.root, invalid);
    const rejected = await deriveDeliveryRequiredEvidenceFromSource(
      {
        ...source,
        readChangeClosure: async (
          request: Parameters<typeof source.readChangeClosure>[0],
        ) => {
          const closure = await source.readChangeClosure(request);
          return request.changeId === "first-change"
            ? {
                ...closure,
                runs: closure.runs.map((run) =>
                  run.runId === invalid.runId
                    ? { ...run, admission: invalid.admission }
                    : run,
                ),
              }
            : closure;
        },
      },
      expected(outcomes),
    );
    assert.equal(rejected, null);
  } finally {
    await cleanup(fixture);
  }
});

test("Final follows an admitted persisted required link across Change roots", async () => {
  const fixture = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(fixture);
    const source = evidenceSource(outcomes, fixture.root);
    const first = await source.readChangeClosure({
      projectId: "flowkit-next",
      deliveryId,
      changeId: "first-change",
    });
    const dependencyRunId = "20260831-003-explore";
    const review = first.runs.find(
      (run) => run.runId === first.reviewApplyRunId,
    )!;
    const reviewContext = JSON.parse(
      Buffer.from(review.contextJson).toString("utf8"),
    );
    reviewContext.previousRunId = dependencyRunId;
    const linkedReview = admittedRunMaterial({
      ...review,
      contextJson: Buffer.from(`${JSON.stringify(reviewContext)}\n`),
    });
    const dependencyIdentity = {
      deliveryId,
      changeId: "dependency-change",
      actionId: "explore" as const,
    };
    const dependency = admittedRunMaterial({
      runId: dependencyRunId,
      artifactRoot: `.flowkit/runs/${deliveryId}/003-dependency-change/${dependencyRunId}`,
      actionMarkdown: Buffer.from("# admitted dependency Explore\n"),
      contextJson: Buffer.from(
        `${JSON.stringify({
          runId: dependencyRunId,
          occurrence: {
            date: "20260831",
            sequence: 3,
            actionId: "explore",
          },
          actionIdentity: dependencyIdentity,
          role: "author",
          lifecycleState: "prepared",
          ownerAuthority: null,
          previousRunId: null,
        })}\n`,
      ),
      resultJson: Buffer.from(
        `${JSON.stringify({
          runId: dependencyRunId,
          actionIdentity: dependencyIdentity,
          authorConclusion: "PASS",
          reviewerVerdict: null,
          verificationVerdict: null,
          nextBoundary: "review-explore",
          facts: {},
        })}\n`,
      ),
    });
    await Promise.all([
      persistRun(fixture.root, linkedReview),
      persistRun(fixture.root, dependency),
    ]);
    const evidence = await deriveDeliveryRequiredEvidenceFromSource(
      {
        ...source,
        readChangeClosure: async (
          request: Parameters<typeof source.readChangeClosure>[0],
        ) => {
          const closure = await source.readChangeClosure(request);
          if (request.changeId !== "first-change") return closure;
          return {
            ...closure,
            runs: [
              ...closure.runs.map((run) =>
                run.runId === linkedReview.runId
                  ? { ...run, admission: linkedReview.admission }
                  : run,
              ),
              {
                ...dependency,
                actionMarkdown: await readFile(
                  path.join(
                    fixture.root,
                    ...dependency.artifactRoot.split("/"),
                    "action.md",
                  ),
                ),
              },
            ],
          };
        },
      },
      expected(outcomes),
    );
    assert.notEqual(evidence, null);
    assert.equal(evidence!.changeClosures[0].runs.length, 3);
    assert.match(
      evidence!.changeClosures[0].runs[0].artifacts[0].artifact,
      /003-dependency-change/,
    );
  } finally {
    await cleanup(fixture);
  }
});
