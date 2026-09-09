import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  invokeDeliveryFullTestOperation,
  type ReadDeliveryRequiredEvidence,
} from "../../../src/domain/index.js";
import type { RequiredChangeClosureMaterial } from "../../../src/internal/delivery-required-evidence-source.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
export async function acceptedEvidenceOutcomes(
  deliveryId: string,
  root: string,
) {
  await mkdir(path.join(root, "config/verification"), { recursive: true });
  await mkdir(path.join(root, "openspec/delivery-groups"), { recursive: true });
  await writeFile(
    path.join(root, "openspec/delivery-groups", deliveryId + ".yaml"),
    "id: " +
      deliveryId +
      "\ndelivery:\n  state: active\n  fullTestStatus: pending\n  finalizationStatus: pending\n",
  );
  await writeFile(
    path.join(root, "config/verification/full-test.json"),
    JSON.stringify({
      inputs: ["product.txt"],
      exclude: [".flowkit"],
      environment: [],
      checks: [
        {
          checkId: "fixture-check",
          program: process.execPath,
          args: ["-e", "process.exit(0)"],
          cwd: ".",
        },
      ],
    }),
  );
  const fullTest = await invokeDeliveryFullTestOperation(
    root,
    {
      deliveryId,
      ownerAuthority: {
        ref: "owner:" + "a".repeat(64),
        decision: "authorize-formal-full-test",
        deliveryId,
        sourceRef: "test:full-test-authority",
        scope: ["delivery-full-test"],
      },
    },
    loadManagerInstallation(),
  );
  assert.equal(fullTest.status, "terminal", JSON.stringify(fullTest));
  if (fullTest.status !== "terminal")
    throw Error("fixture Full Test incomplete");
  assert.equal(fullTest.verdict, "passed");
  return { fullTest };
}
export function evidenceSourceFor(
  repositoryRoot: string,
  deliveryId: string,
  closures: readonly RequiredChangeClosureMaterial[],
  _outcomes: Awaited<ReturnType<typeof acceptedEvidenceOutcomes>>,
): ReadDeliveryRequiredEvidence {
  return {
    readChangeClosure: async ({
      projectId,
      deliveryId: requested,
      changeId,
    }) => {
      if (projectId !== "flowkit-next" || requested !== deliveryId) {
        throw new Error("wrong evidence identity");
      }
      const closure = closures.find((entry) => entry.changeId === changeId);
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
  };
}
