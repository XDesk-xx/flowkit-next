import {
  isOwnerAuthorityFact,
  type OwnerAuthorityFact,
} from "../domain/authority.js";
import type { CurrentAction } from "../domain/action-lifecycle.js";
import {
  ManagedToolResolutionError,
  resolveManagedTool,
} from "../domain/managed-tool-resolution.js";
import {
  OpenSpecObservationError,
  observeOpenSpecActiveChanges,
  observeOpenSpecChangeStatus,
} from "../domain/openspec-observation.js";
import {
  evaluatePolicyAndNextBoundary,
  type PolicyDecision,
} from "../domain/policy-and-next-boundary.js";
import {
  parseRunOccurrenceId,
  readDurableRun,
  type DurableRunRecord,
} from "../domain/run-result-persistence.js";
import {
  evaluateCheckpointAuthorization,
  type CheckpointAuthorization,
} from "./checkpoint-authorization.js";
import {
  resolveTrustedChangeCoordination,
  TrustedChangeCoordinationError,
} from "./trusted-change-coordination.js";
import type {
  DoctorRequest,
  FoundationCliRequest,
  NextRequest,
  StatusRequest,
} from "./request.js";

export type FoundationCliFailureKind =
  | "invalid-current-run"
  | "run-read-failed"
  | "run-identity-mismatch"
  | "managed-tool-integration-failed"
  | "openspec-integration-failed"
  | "coordination-resolution-failed"
  | "invalid-checkpoint-authority";

export class FoundationCliCommandError extends Error {
  readonly kind: FoundationCliFailureKind;

  constructor(
    kind: FoundationCliFailureKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "FoundationCliCommandError";
    this.kind = kind;
  }
}

interface SelectedRun {
  readonly record: DurableRunRecord;
  readonly currentAction: CurrentAction;
}

function fail(
  kind: FoundationCliFailureKind,
  message: string,
  cause?: unknown,
): never {
  throw new FoundationCliCommandError(
    kind,
    message,
    cause === undefined ? undefined : { cause },
  );
}

async function readSelectedRun(
  request: StatusRequest | NextRequest,
  runId: string,
): Promise<SelectedRun> {
  const occurrence = parseRunOccurrenceId(runId);
  if (occurrence === null) {
    fail(
      "invalid-current-run",
      "currentRunId must be a canonical run occurrence",
    );
  }
  let record: DurableRunRecord;
  try {
    record = await readDurableRun({
      repositoryRoot: request.repositoryRoot,
      deliveryId: request.deliveryId,
      changeId: request.changeId,
      changeStartSequence: request.changeStartSequence,
      occurrence,
    });
  } catch (error) {
    fail("run-read-failed", "selected durable Run cannot be read", error);
  }
  if (
    record.context.actionIdentity.deliveryId !== request.deliveryId ||
    record.context.actionIdentity.changeId !== request.changeId ||
    record.context.runId !== runId ||
    record.result.runId !== runId
  ) {
    fail(
      "run-identity-mismatch",
      "selected Run identity does not match request",
    );
  }
  if (record.context.lifecycleState === null) {
    fail("invalid-current-run", "selected Run has no lifecycle state");
  }
  return {
    record,
    currentAction: Object.freeze({
      identity: record.context.actionIdentity,
      state: record.context.lifecycleState,
    }),
  };
}

function exactRunProjection(selected: SelectedRun) {
  return Object.freeze({
    runId: selected.record.context.runId,
    actionId: selected.record.context.actionIdentity.actionId,
    state: selected.record.context.lifecycleState,
    role: selected.record.context.role,
  });
}

async function resolveCanonicalChangeState(
  request: StatusRequest | NextRequest,
) {
  try {
    return await resolveTrustedChangeCoordination({
      repositoryRoot: request.repositoryRoot,
      deliveryId: request.deliveryId,
      changeId: request.changeId,
    });
  } catch (error) {
    if (error instanceof TrustedChangeCoordinationError) {
      fail(
        "coordination-resolution-failed",
        "trusted Delivery-Change coordination resolution failed",
        error,
      );
    }
    throw error;
  }
}

async function statusCommand(request: StatusRequest) {
  const changeState = await resolveCanonicalChangeState(request);
  const selected = await readSelectedRun(request, request.currentRunId);
  let activeChanges;
  try {
    activeChanges = await observeOpenSpecActiveChanges(request);
  } catch (error) {
    if (
      error instanceof OpenSpecObservationError ||
      error instanceof ManagedToolResolutionError
    ) {
      fail(
        "openspec-integration-failed",
        "OpenSpec active observation failed",
        error,
      );
    }
    throw error;
  }

  let exactChange = null;
  if (activeChanges.changeIds.includes(request.changeId)) {
    try {
      exactChange = await observeOpenSpecChangeStatus({
        repositoryRoot: request.repositoryRoot,
        flowkitHome: request.flowkitHome,
        changeId: request.changeId,
      });
    } catch (error) {
      if (
        error instanceof OpenSpecObservationError ||
        error instanceof ManagedToolResolutionError
      ) {
        fail(
          "openspec-integration-failed",
          "OpenSpec Change observation failed",
          error,
        );
      }
      throw error;
    }
  }

  return Object.freeze({
    kind: "status" as const,
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeState,
    currentRun: exactRunProjection(selected),
    openSpec: Object.freeze({
      activeChangeIds: activeChanges.changeIds,
      exactChange,
    }),
  });
}

async function nextCommand(request: NextRequest) {
  const changeState = await resolveCanonicalChangeState(request);
  let currentAction: CurrentAction | null = null;
  let terminalRunContext = null;
  let terminalResult = null;

  if (request.currentRunId !== null) {
    const selected = await readSelectedRun(request, request.currentRunId);
    currentAction = selected.currentAction;
    if (selected.currentAction.state === "terminal") {
      terminalRunContext = selected.record.context;
      terminalResult = selected.record.result;
    }
  }

  const policyDecision = evaluatePolicyAndNextBoundary({
    deliveryId: request.deliveryId,
    changeId: request.changeId,
    changeState,
    currentAction,
    terminalRunContext,
    terminalResult,
    ...(Object.hasOwn(request, "ownerCorrection")
      ? { ownerCorrection: request.ownerCorrection }
      : {}),
  });

  let ownerAuthority: OwnerAuthorityFact | null = null;
  if (Object.hasOwn(request, "checkpointAuthority")) {
    if (
      request.checkpointAuthority !== null &&
      request.checkpointAuthority !== undefined
    ) {
      if (!isOwnerAuthorityFact(request.checkpointAuthority)) {
        fail(
          "invalid-checkpoint-authority",
          "checkpointAuthority must be a structural OwnerAuthorityFact or null",
        );
      }
      ownerAuthority = request.checkpointAuthority;
    }
  }
  const checkpoint = evaluateCheckpointAuthorization({
    policyDecision,
    ownerAuthority,
    deliveryId: request.deliveryId,
    changeId: request.changeId,
  });

  return Object.freeze({
    kind: "next" as const,
    decision: policyDecision,
    checkpoint,
  });
}

type DoctorDiagnostic =
  | {
      readonly id: "openspec-runtime" | "archify-runtime";
      readonly status: "pass";
      readonly version: string;
    }
  | {
      readonly id: "openspec-root";
      readonly status: "pass";
      readonly activeChangeCount: number;
    }
  | {
      readonly id: "openspec-runtime" | "archify-runtime" | "openspec-root";
      readonly status: "fail";
      readonly diagnosticKind: string;
    };

async function runtimeDiagnostic(
  request: DoctorRequest,
  toolId: "openspec" | "archify",
): Promise<DoctorDiagnostic> {
  try {
    const tool = await resolveManagedTool({ ...request, toolId });
    return Object.freeze({
      id: `${toolId}-runtime`,
      status: "pass",
      version: tool.version,
    });
  } catch (error) {
    if (error instanceof ManagedToolResolutionError) {
      return Object.freeze({
        id: `${toolId}-runtime`,
        status: "fail",
        diagnosticKind: error.kind,
      });
    }
    throw error;
  }
}

async function openspecRootDiagnostic(
  request: DoctorRequest,
): Promise<DoctorDiagnostic> {
  try {
    const observation = await observeOpenSpecActiveChanges(request);
    return Object.freeze({
      id: "openspec-root",
      status: "pass",
      activeChangeCount: observation.changeIds.length,
    });
  } catch (error) {
    if (
      error instanceof OpenSpecObservationError ||
      error instanceof ManagedToolResolutionError
    ) {
      return Object.freeze({
        id: "openspec-root",
        status: "fail",
        diagnosticKind: error.kind,
      });
    }
    throw error;
  }
}

async function doctorCommand(request: DoctorRequest) {
  const diagnostics = await Promise.all([
    runtimeDiagnostic(request, "openspec"),
    runtimeDiagnostic(request, "archify"),
    openspecRootDiagnostic(request),
  ]);
  return Object.freeze({
    kind: "doctor" as const,
    status: diagnostics.every((entry) => entry.status === "pass")
      ? ("pass" as const)
      : ("fail" as const),
    diagnostics: Object.freeze(diagnostics),
  });
}

export type FoundationCliResult =
  | Awaited<ReturnType<typeof statusCommand>>
  | Awaited<ReturnType<typeof nextCommand>>
  | Awaited<ReturnType<typeof doctorCommand>>;

export async function executeFoundationCliRequest(
  input: FoundationCliRequest,
): Promise<FoundationCliResult> {
  switch (input.command) {
    case "status":
      return statusCommand(input.request);
    case "next":
      return nextCommand(input.request);
    case "doctor":
      return doctorCommand(input.request);
  }
}

export type { PolicyDecision, CheckpointAuthorization };
