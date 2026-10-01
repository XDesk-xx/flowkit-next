import { readFile } from "node:fs/promises";
import * as domain from "../../../src/domain/index.js";

export interface HeldRecord {
  input: domain.RunAddressInput;
  directory: string;
  actionMarkdown: string;
  currentAction: domain.CurrentAction;
  preparedContext: domain.RunContextRecord;
  actionPackage: domain.ActionPackage;
}

export interface ProofRef {
  path: string;
  bytes: number;
  sha256: string;
  deliveryId: string;
  changeId: string;
  runId: string;
  purpose: string;
}

export interface HowExamples {
  currentForExecution(
    kernel: typeof domain,
    previousAction: domain.CurrentAction | null,
    identity: domain.ActionIdentity,
  ): domain.CurrentAction | null;
  startRecord(
    kernel: typeof domain,
    installation: unknown,
    input: domain.RunAddressInput,
    current: domain.CurrentAction,
    context: domain.RunContextRecord,
    guidance: domain.ActionGuidanceRef,
    prepare: domain.CanonicalStartReadiness,
  ): Promise<HeldRecord>;
  finishRecord(
    kernel: typeof domain,
    held: HeldRecord,
    result: domain.RunResultRecord,
    checked: boolean,
    terminal?: boolean,
  ): Promise<domain.DurableRunRecord>;
  checkProof(
    root: string,
    ref: ProofRef,
    identity: {
      deliveryId: string;
      changeId: string;
      runId: string;
    },
    checkGitBytes: typeof domain.assertManagedEvidenceGitBytes,
  ): Promise<Buffer>;
}

// Exercise the former low-level seam as a test fixture; product HOW uses fixed commands.
export async function loadHow(actionId = "explore"): Promise<HowExamples> {
  await readFile(`skills/actions/${actionId}/SKILL.md`, "utf8");
  const markdown = await readFile("tests/fixtures/legacy-agent-how.md", "utf8");
  const examples = [
    ...markdown.matchAll(/```js\r?\n(\/\/ agent-[\s\S]*?)```/g),
  ].map((match) => match[1]);
  if (examples.length !== 3) throw new Error("Missing tested HOW examples");
  const source =
    examples.join("\n") +
    "\nexport {startRecord, finishRecord, checkProof, currentForExecution};";
  return (await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  )) as HowExamples;
}

export function inputs(repositoryRoot: string) {
  const actionIdentity = {
    deliveryId: "delivery-one",
    changeId: "change-one",
    actionId: "explore",
  } as const;
  const occurrence = {
    date: "20260908",
    sequence: 1,
    actionId: "explore",
  } as const;
  const context: domain.RunContextRecord = {
    runId: domain.formatRunOccurrenceId(occurrence)!,
    occurrence,
    actionIdentity,
    role: "author",
    lifecycleState: "prepared",
    ownerAuthority: null,
    previousRunId: null,
  };
  return {
    input: {
      repositoryRoot,
      deliveryId: actionIdentity.deliveryId,
      changeId: actionIdentity.changeId,
      changeStartSequence: 1,
      occurrence,
    },
    context,
    current: domain.transitionCurrentAction(null, {
      type: "prepare",
      identity: actionIdentity,
    })!,
    result: {
      runId: context.runId,
      actionIdentity,
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-explore",
      facts: { synthetic: true },
    } as domain.RunResultRecord,
  };
}
