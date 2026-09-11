import { createHash } from "node:crypto";

import {
  admitActionResult,
  formActionPackage,
} from "../../../src/domain/index.js";
export interface RequiredRunMaterial {
  readonly runId: string;
  readonly artifactRoot: string;
  readonly actionMarkdown: Uint8Array;
  readonly contextJson: Uint8Array;
  readonly resultJson: Uint8Array;
  readonly admission: {
    readonly sourceRef: string;
    readonly contextSha256: string;
    readonly resultSha256: string;
    readonly guidanceRef: {
      readonly path: string;
      readonly contentSha256: string;
    };
  };
}

type RawRunMaterial = Omit<RequiredRunMaterial, "admission">;

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function bindRunAdmission(
  material: RawRunMaterial,
): RequiredRunMaterial {
  const context = JSON.parse(
    Buffer.from(material.contextJson).toString("utf8"),
  ) as {
    runId: string;
    actionIdentity: { actionId: string };
  };
  return {
    ...material,
    admission: {
      sourceRef: `test:accepted-run:${context.runId}`,
      contextSha256: digest(material.contextJson),
      resultSha256: digest(material.resultJson),
      guidanceRef: {
        path: `skills/actions/${context.actionIdentity.actionId}/SKILL.md`,
        contentSha256: "a".repeat(64),
      },
    },
  };
}

export function admittedRunMaterial(
  material: RawRunMaterial,
): RequiredRunMaterial {
  const admitted = bindRunAdmission(material);
  const context = JSON.parse(
    Buffer.from(admitted.contextJson).toString("utf8"),
  );
  const result = JSON.parse(Buffer.from(admitted.resultJson).toString("utf8"));
  const currentAction = {
    identity: context.actionIdentity,
    state: "prepared" as const,
  };
  const operationPackage = formActionPackage(
    currentAction,
    context,
    admitted.admission.guidanceRef,
  );
  if (
    operationPackage === null ||
    admitActionResult(
      operationPackage,
      currentAction,
      context.occurrence,
      result,
    ) === null
  ) {
    throw new Error("fixture Run is not canonically admitted");
  }
  return admitted;
}
