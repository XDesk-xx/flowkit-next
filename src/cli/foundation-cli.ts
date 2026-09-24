import {
  isOwnerAuthorityFact,
  type OwnerAuthorityFact,
} from "../domain/authority.js";
import { resolveActionContext } from "./action-context.js";
import { policyForRecord } from "./current-run-chain.js";
import {
  ManagedToolResolutionError,
  resolveManagedTool,
} from "../domain/managed-tool-resolution.js";
import {
  OpenSpecObservationError,
  observeOpenSpecActiveChanges,
} from "../domain/openspec-observation.js";
import type { PolicyDecision } from "../domain/policy-and-next-boundary.js";
import {
  evaluateCheckpointAuthorization,
  type CheckpointAuthorization,
} from "./checkpoint-authorization.js";
import type {
  DoctorRequest,
  FoundationCliRequest,
  NextRequest,
  StatusRequest,
} from "./request.js";
import {
  loadManagerInstallation,
  type ManagerInstallation,
} from "../internal/manager-installation.js";

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

function fail(kind: FoundationCliFailureKind, message: string): never {
  throw new FoundationCliCommandError(kind, message);
}

async function statusCommand(
  request: StatusRequest,
  installation: ManagerInstallation,
) {
  const context = await resolveActionContext(request, installation);
  const selected = context.selected;
  const current = selected?.history.current;
  const predecessor = selected?.history.records.find(
    (record) => record.context.runId === current?.context.previousRunId,
  );
  return {
    kind: "status" as const,
    status: context.status,
    repositoryRoot: context.repositoryRoot,
    deliveryId: selected?.deliveryId ?? null,
    changeId: selected?.changeId ?? null,
    changeState: selected?.changeState ?? null,
    currentRun: current
      ? {
          runId: current.context.runId,
          actionId: current.context.actionIdentity.actionId,
          state: current.context.lifecycleState,
          role: current.context.role,
          ...(predecessor?.context.lifecycleState === "prepared" &&
          current.context.ownerAuthority?.decision === "revise-action"
            ? {
                supersededPreparedRunId: predecessor.context.runId,
                ownerAuthorityRef: current.context.ownerAuthority.ref,
              }
            : {}),
        }
      : null,
    openSpec: context.openSpec,
  };
}

async function nextCommand(
  request: NextRequest,
  installation: ManagerInstallation,
) {
  const context = await resolveActionContext(request, installation);
  const selected = context.selected;
  if (selected === null || selected.history.kind === "bootstrap-history") {
    return {
      kind: "next" as const,
      status: context.status,
      decision: null,
      checkpoint: null,
    };
  }
  const policyDecision = policyForRecord(selected.history.current, {
    deliveryId: selected.deliveryId,
    changeId: selected.changeId,
    changeState: selected.changeState,
    ...(Object.hasOwn(request, "ownerCorrection")
      ? { ownerCorrection: request.ownerCorrection }
      : {}),
  });
  let ownerAuthority: OwnerAuthorityFact | null = null;
  if (
    request.checkpointAuthority !== undefined &&
    request.checkpointAuthority !== null
  ) {
    if (!isOwnerAuthorityFact(request.checkpointAuthority))
      fail("invalid-checkpoint-authority", "Invalid checkpointAuthority");
    ownerAuthority = request.checkpointAuthority;
  }
  return {
    kind: "next" as const,
    decision: policyDecision,
    checkpoint: evaluateCheckpointAuthorization({
      policyDecision,
      ownerAuthority,
      deliveryId: selected.deliveryId,
      changeId: selected.changeId,
    }),
  };
}

type DoctorDiagnostic =
  | {
      readonly id: "openspec-runtime";
      readonly status: "pass";
      readonly version: string;
    }
  | {
      readonly id: "openspec-root";
      readonly status: "pass";
      readonly activeChangeCount: number;
    }
  | {
      readonly id: "openspec-runtime" | "openspec-root";
      readonly status: "fail";
      readonly diagnosticKind: string;
    };

async function runtimeDiagnostic(
  request: DoctorRequest,
  toolId: "openspec",
  installation: ManagerInstallation,
): Promise<DoctorDiagnostic> {
  try {
    const tool = await resolveManagedTool({
      flowkitHome: request.flowkitHome,
      installation,
      toolId,
    });
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
  installation: ManagerInstallation,
): Promise<DoctorDiagnostic> {
  try {
    const observation = await observeOpenSpecActiveChanges({
      ...request,
      installation,
    });
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

async function doctorCommand(
  request: DoctorRequest,
  installation: ManagerInstallation,
) {
  const diagnostics = await Promise.all([
    runtimeDiagnostic(request, "openspec", installation),
    openspecRootDiagnostic(request, installation),
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
  installation: ManagerInstallation = loadManagerInstallation(),
): Promise<FoundationCliResult> {
  switch (input.command) {
    case "status":
      return statusCommand(input.request, installation);
    case "next":
      return nextCommand(input.request, installation);
    case "doctor":
      return doctorCommand(input.request, installation);
  }
}

export type { PolicyDecision, CheckpointAuthorization };
