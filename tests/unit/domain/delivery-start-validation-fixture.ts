import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const validationArtifact = "validation/start-outcome.json";

function artifactRef(artifact: string, bytes: Uint8Array) {
  return {
    artifact,
    contentSha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.byteLength,
  };
}

function artifactInput(ref: ReturnType<typeof artifactRef>): string {
  return `${ref.artifact}@sha256:${ref.contentSha256}:${ref.bytes}`;
}

export async function createStartValidationFixture(
  root: string,
  input: {
    readonly deliveryId: string;
    readonly acceptedBaseCommit: string;
    readonly planningReference: {
      readonly artifact: string;
      readonly contentSha256: string;
    };
  },
  requestedExitCode = 0,
  transformOutcome: (value: Record<string, unknown>) => unknown = (value) =>
    value,
) {
  const { deliveryId, acceptedBaseCommit, planningReference } = input;
  const artifacts = [
    `openspec/delivery-groups/${deliveryId}.yaml`,
    `architecture/${deliveryId}/json/current.architecture.json`,
    `architecture/${deliveryId}/json/planned.architecture.json`,
    `architecture/${deliveryId}/json/current-to-planned.compare.json`,
  ];
  const outputs = await Promise.all(
    artifacts.map(async (artifact) =>
      artifactRef(
        artifact,
        await readFile(path.join(root, ...artifact.split("/"))),
      ),
    ),
  );
  let exitCode = 0;
  try {
    await execFileAsync(
      process.execPath,
      ["-e", `process.exit(${requestedExitCode})`],
      { windowsHide: true },
    );
  } catch (error) {
    exitCode = (error as { code?: number }).code ?? -1;
  }
  const outputArtifacts = [validationArtifact];
  const checks = [
    {
      checkId: "git-start-prestate",
      tool: "git",
      exitCode,
      inputs: [`commit:${acceptedBaseCommit}`, "working-tree:clean"],
      outputArtifacts,
    },
    {
      checkId: "openspec-delivery-manifest",
      tool: "openspec",
      exitCode,
      inputs: [artifactInput(outputs[0])],
      outputArtifacts,
    },
    {
      checkId: "archify-current",
      tool: "archify",
      exitCode,
      inputs: [artifactInput(outputs[1])],
      outputArtifacts,
    },
    {
      checkId: "archify-planned",
      tool: "archify",
      exitCode,
      inputs: [artifactInput(outputs[2])],
      outputArtifacts,
    },
    {
      checkId: "archify-current-to-planned",
      tool: "archify",
      exitCode,
      inputs: [
        artifactInput(outputs[1]),
        artifactInput(outputs[2]),
        artifactInput(outputs[3]),
      ],
      outputArtifacts,
    },
    {
      checkId: "content-receipt",
      tool: "flowkit",
      exitCode,
      inputs: [
        `planning:${planningReference.artifact}@sha256:${planningReference.contentSha256}`,
        ...outputs.map(artifactInput),
      ],
      outputArtifacts,
    },
  ];
  const outcome = transformOutcome({
    status: exitCode === 0 ? "passed" : "failed",
    checks,
  });
  const outcomeBytes = Buffer.from(`${JSON.stringify(outcome)}\n`);
  const surface = {
    status: "validated" as const,
    validation: {
      sourceRef: "test:start-validation",
      artifacts: [artifactRef(validationArtifact, outcomeBytes)],
    },
  };
  const read = () => ({
    projectId: "flowkit-next",
    deliveryId,
    acceptedBaseCommit,
    planningReference,
    outputs,
    sourceRef: "test:start-validation",
    outcomeJson: outcomeBytes,
    artifacts: [{ artifact: validationArtifact, bytes: outcomeBytes }],
  });
  return { surface: () => surface, read };
}
