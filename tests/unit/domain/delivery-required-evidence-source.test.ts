import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import fs, { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test, { mock } from "node:test";
import {
  readDeliveryChangeCompletions,
  type ReadDeliveryRequiredEvidence,
} from "../../../src/internal/delivery-required-evidence-source.js";
import { invokeDeliveryFinalOperation } from "../../../src/domain/delivery-final-execution.js";
import {
  acceptedOutcomes,
  cleanup,
  createFixture,
  deliveryId,
  evidenceSource,
  finalInput,
} from "./delivery-final-fixture.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";

test("bounded accepted endpoints cover both required Changes, not ancestors or Full Test logs", async () => {
  const f = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(f);
    const source = evidenceSource(outcomes, f.root);
    const first = await source.readChangeClosure({
      projectId: "flowkit-next",
      deliveryId,
      changeId: "first-change",
    });
    // A host-accepted Review may refer to an earlier Run outside this bounded consumer.
    const contextRef = first.reviewApply.artifacts[1];
    const contextPath = path.join(f.root, contextRef.artifact);
    const context = JSON.parse(await readFile(contextPath, "utf8"));
    context.previousRunId = "20260831-003-explore";
    const contextBytes = Buffer.from(JSON.stringify(context) + "\n");
    await writeFile(contextPath, contextBytes);
    const linked: ReadDeliveryRequiredEvidence = {
      readChangeClosure: async (request) => {
        const selected = await source.readChangeClosure(request);
        if (request.changeId !== "first-change") return selected;
        return {
          ...selected,
          reviewApply: {
            ...selected.reviewApply,
            artifacts: selected.reviewApply.artifacts.map((ref, index) =>
              index === 1
                ? {
                    ...ref,
                    bytes: contextBytes.length,
                    contentSha256: createHash("sha256")
                      .update(contextBytes)
                      .digest("hex"),
                  }
                : ref,
            ),
          },
        };
      },
    };
    const accessed: string[] = [];
    const original = fs.readFile.bind(fs);
    const spy = mock.method(
      fs,
      "readFile",
      async (...args: Parameters<typeof fs.readFile>) => {
        accessed.push(String(args[0]));
        return original(...args);
      },
    );
    syncBuiltinESMExports();
    const completions = await readDeliveryChangeCompletions(linked, {
      repositoryRoot: f.root,
      projectId: "flowkit-next",
      deliveryId,
      changeIds: ["first-change", "second-change"],
    });
    spy.mock.restore();
    syncBuiltinESMExports();
    assert.deepEqual(
      completions?.map((c) => c.changeId),
      ["first-change", "second-change"],
    );
    assert.equal(completions?.length, 2);
    assert.equal(accessed.length, 24);
    assert.ok(
      accessed.every((p) =>
        /(?:001-review-apply|002-archive)[\\/](?:action.md|context.json|result.json)$/.test(
          p,
        ),
      ),
    );
    assert.equal(
      accessed.some((p) => /003-explore|full-test|proof/.test(p)),
      false,
    );
    assert.deepEqual(Object.keys(completions![0]), [
      "changeId",
      "archiveRunId",
      "reviewApplyRunId",
      "archiveResultRef",
      "reviewResultRef",
    ]);
  } finally {
    mock.restoreAll();
    syncBuiltinESMExports();
    await cleanup(f);
  }
});

test("accepted bytes still require matching Role, verdict, terminal result and direct linkage", async () => {
  const f = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(f);
    const source = evidenceSource(outcomes, f.root);
    const expected = {
      repositoryRoot: f.root,
      projectId: "flowkit-next",
      deliveryId,
      changeIds: ["first-change"],
    };
    const selected = await source.readChangeClosure({
      projectId: expected.projectId,
      deliveryId,
      changeId: "first-change",
    });
    for (const [endpoint, index, field, value] of [
      ["archive", 1, "role", "reviewer"],
      ["reviewApply", 1, "role", "author"],
      ["archive", 1, "previousRunId", "20260901-009-review-apply"],
      ["archive", 2, "authorConclusion", "FAIL"],
      ["reviewApply", 2, "reviewerVerdict", "changes-requested"],
      ["archive", 2, "runId", "20260901-009-archive"],
    ] as const) {
      const ref = selected[endpoint].artifacts[index];
      const file = path.join(f.root, ref.artifact);
      const original = await readFile(file);
      const content = Buffer.from(
        JSON.stringify({ ...JSON.parse(original.toString()), [field]: value }) +
          "\n",
      );
      await writeFile(file, content);
      // Deliberately hostile synthetic host selection: hash equality alone is insufficient.
      const altered = {
        readChangeClosure: () => ({
          ...selected,
          [endpoint]: {
            ...selected[endpoint],
            artifacts: selected[endpoint].artifacts.map((r, i) =>
              i === index
                ? {
                    ...r,
                    bytes: content.length,
                    contentSha256: createHash("sha256")
                      .update(content)
                      .digest("hex"),
                  }
                : r,
            ),
          },
        }),
      };
      const rejected: string[] = [];
      assert.equal(
        await readDeliveryChangeCompletions(altered, expected, (id) =>
          rejected.push(id),
        ),
        null,
        `${endpoint}/${field}`,
      );
      assert.deepEqual(rejected, ["first-change"]);
      await writeFile(file, original);
    }
    const absentB = {
      readChangeClosure: async (
        request: Parameters<typeof source.readChangeClosure>[0],
      ) => {
        if (request.changeId === "second-change")
          throw new Error("missing terminal");
        return source.readChangeClosure(request);
      },
    };
    const failed = await invokeDeliveryFinalOperation(
      f.root,
      finalInput(f, outcomes),
      () => ({ status: "ready" }),
      absentB,
      fixtureInstallation(f.root),
    );
    assert.equal(failed.status, "failed");
    if (failed.status === "failed")
      assert.equal(failed.completionChangeId, "second-change");
  } finally {
    await cleanup(f);
  }
});

test("missing source, wrong ownership, ambiguous host selection and missing material do not become completion", async () => {
  const f = await createFixture();
  try {
    const outcomes = await acceptedOutcomes(f);
    const source = evidenceSource(outcomes, f.root);
    const expected = {
      repositoryRoot: f.root,
      projectId: "flowkit-next",
      deliveryId,
      changeIds: ["first-change", "second-change"],
    };
    const missing = await invokeDeliveryFinalOperation(
      f.root,
      finalInput(f, outcomes),
      () => ({ status: "ready" }),
      null as never,
      fixtureInstallation(f.root),
    );
    assert.equal(missing.status, "failed");
    if (missing.status === "failed")
      assert.equal(missing.reason, "completion-source-unavailable");
    for (const invalid of [
      { approved: true },
      { readChangeClosure: { approved: true } },
      {
        readChangeClosure: async () => {
          throw new Error("ambiguous accepted archives");
        },
      },
      {
        readChangeClosure: async (
          request: Parameters<typeof source.readChangeClosure>[0],
        ) => ({
          ...(await source.readChangeClosure(request)),
          projectId: "wrong",
        }),
      },
      {
        readChangeClosure: async (
          request: Parameters<typeof source.readChangeClosure>[0],
        ) => {
          const selected = await source.readChangeClosure(request);
          return {
            ...selected,
            archive: { ...selected.archive, sourceRef: "" },
          };
        },
      },
      {
        readChangeClosure: async (
          request: Parameters<typeof source.readChangeClosure>[0],
        ) => {
          if (request.changeId === "second-change")
            throw new Error("missing required B");
          return source.readChangeClosure(request);
        },
      },
    ])
      assert.equal(
        await readDeliveryChangeCompletions(invalid, expected),
        null,
      );
    const first = await source.readChangeClosure({
      projectId: "flowkit-next",
      deliveryId,
      changeId: "first-change",
    });
    for (const ref of first.archive.artifacts) {
      const file = path.join(f.root, ref.artifact);
      const original = await readFile(file);
      await writeFile(file, "{}\n");
      assert.equal(await readDeliveryChangeCompletions(source, expected), null);
      await writeFile(file, original);
    }
  } finally {
    await cleanup(f);
  }
});
