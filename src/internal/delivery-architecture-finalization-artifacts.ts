import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { deriveApplicableCheckCandidateRef } from "../domain/applicable-check-execution.js";
import type { DeliveryArchitectureClosureOutputRef } from "../domain/delivery-architecture-finalization-identity.js";
import type { DeliveryArchitectureSystemViewPrestate } from "../domain/delivery-architecture-finalization-operation.js";
import type { DeliveryArchitectureFinalizationDerivedOutputs } from "../domain/delivery-architecture-finalization-execution.js";
import type { DeliveryArchitectureFinalizationOperationPackage } from "../domain/delivery-operation-execution.js";
import type { DeliveryId } from "../domain/identity.js";
import { validateArchitectureFinalizationWithManagedArchify } from "./delivery-architecture-finalization-archify.js";
export const ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS = {
  workflow: "architecture/system/workflow.json",
  lifecycle: "architecture/system/lifecycle.json",
  dataFlow: "architecture/system/data-flow.json",
} as const;

export interface FixedDeliveryArchitecturePaths {
  readonly current: string;
  readonly planned: string;
  readonly actual: string;
  readonly currentToActual: string;
  readonly plannedToActual: string;
}

export function fixedDeliveryArchitecturePaths(
  deliveryId: DeliveryId,
): FixedDeliveryArchitecturePaths {
  const prefix = `architecture/${deliveryId}/json`;
  return {
    current: `${prefix}/current.architecture.json`,
    planned: `${prefix}/planned.architecture.json`,
    actual: `${prefix}/actual.architecture.json`,
    currentToActual: `${prefix}/current-to-actual.compare.json`,
    plannedToActual: `${prefix}/planned-to-actual.compare.json`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function hasExactlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === fields.length &&
    fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
  );
}

export function architectureContentSha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function canonicalRepositoryRoot(
  repositoryRoot: string,
): Promise<string | null> {
  try {
    return await realpath(repositoryRoot);
  } catch {
    return null;
  }
}

function absoluteFixedPath(root: string, relativePath: string): string | null {
  const candidate = path.resolve(root, ...relativePath.split("/"));
  const relative = path.relative(root, candidate);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    return null;
  }
  return candidate;
}

export async function readFixedRegularFile(
  root: string,
  relativePath: string,
): Promise<Buffer | null> {
  const target = absoluteFixedPath(root, relativePath);
  if (target === null) return null;
  try {
    const entry = await lstat(target);
    if (!entry.isFile() || entry.isSymbolicLink()) return null;
    const resolved = await realpath(target);
    if (resolved !== target) return null;
    return await readFile(target);
  } catch {
    return null;
  }
}

type OptionalFixedFileState =
  | { readonly kind: "missing" }
  | { readonly kind: "present"; readonly bytes: Buffer }
  | { readonly kind: "invalid" };

async function readOptionalFixedRegularFile(
  root: string,
  relativePath: string,
): Promise<OptionalFixedFileState> {
  const target = absoluteFixedPath(root, relativePath);
  if (target === null) return { kind: "invalid" };
  try {
    const entry = await lstat(target);
    if (!entry.isFile() || entry.isSymbolicLink()) return { kind: "invalid" };
    const resolved = await realpath(target);
    if (resolved !== target) return { kind: "invalid" };
    return { kind: "present", bytes: await readFile(target) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { kind: "missing" };
    }
    return { kind: "invalid" };
  }
}

export interface ArchitectureInputContext {
  readonly currentArchitecture: Buffer;
  readonly plannedArchitecture: Buffer;
  readonly workflow: Buffer | null;
  readonly lifecycle: Buffer | null;
  readonly dataFlow: Buffer | null;
}

export async function readArchitectureInputContext(
  repositoryRoot: string,
  deliveryId: DeliveryId,
): Promise<ArchitectureInputContext | null> {
  const root = await canonicalRepositoryRoot(repositoryRoot);
  if (root === null) return null;
  const paths = fixedDeliveryArchitecturePaths(deliveryId);
  const [
    currentArchitecture,
    plannedArchitecture,
    workflowState,
    lifecycleState,
    dataFlowState,
  ] = await Promise.all([
    readFixedRegularFile(root, paths.current),
    readFixedRegularFile(root, paths.planned),
    readOptionalFixedRegularFile(
      root,
      ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.workflow,
    ),
    readOptionalFixedRegularFile(
      root,
      ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.lifecycle,
    ),
    readOptionalFixedRegularFile(
      root,
      ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.dataFlow,
    ),
  ]);
  if (
    currentArchitecture === null ||
    plannedArchitecture === null ||
    workflowState.kind === "invalid" ||
    lifecycleState.kind === "invalid" ||
    dataFlowState.kind === "invalid"
  ) {
    return null;
  }
  return {
    currentArchitecture,
    plannedArchitecture,
    workflow: workflowState.kind === "present" ? workflowState.bytes : null,
    lifecycle: lifecycleState.kind === "present" ? lifecycleState.bytes : null,
    dataFlow: dataFlowState.kind === "present" ? dataFlowState.bytes : null,
  };
}

export function architectureSystemViewPrestate(
  context: ArchitectureInputContext,
): DeliveryArchitectureSystemViewPrestate {
  return {
    workflowSha256:
      context.workflow === null
        ? null
        : architectureContentSha256(context.workflow),
    lifecycleSha256:
      context.lifecycle === null
        ? null
        : architectureContentSha256(context.lifecycle),
    dataFlowSha256:
      context.dataFlow === null
        ? null
        : architectureContentSha256(context.dataFlow),
  };
}

function sameSystemViewPrestate(
  left: DeliveryArchitectureSystemViewPrestate,
  right: DeliveryArchitectureSystemViewPrestate,
): boolean {
  return (
    left.workflowSha256 === right.workflowSha256 &&
    left.lifecycleSha256 === right.lifecycleSha256 &&
    left.dataFlowSha256 === right.dataFlowSha256
  );
}

export async function revalidateArchitectureFinalizationPrestate(
  repositoryRoot: string,
  operationPackage: DeliveryArchitectureFinalizationOperationPackage,
): Promise<ArchitectureInputContext | null> {
  const currentCandidateRef =
    await deriveApplicableCheckCandidateRef(repositoryRoot);
  if (
    currentCandidateRef !== operationPackage.operationFacts.verifiedCandidateRef
  ) {
    return null;
  }
  const context = await readArchitectureInputContext(
    repositoryRoot,
    operationPackage.deliveryId,
  );
  if (context === null) return null;
  if (
    architectureContentSha256(context.currentArchitecture) !==
      operationPackage.operationFacts.currentArchitectureRef.contentSha256 ||
    architectureContentSha256(context.plannedArchitecture) !==
      operationPackage.operationFacts.plannedArchitectureRef.contentSha256 ||
    !sameSystemViewPrestate(
      architectureSystemViewPrestate(context),
      operationPackage.operationFacts.systemViewPrestate,
    )
  ) {
    return null;
  }
  return context;
}

export function parseJsonObject(
  content: string,
): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

interface CompareSideExpectation {
  readonly ref: string;
  readonly sha256: string;
  readonly bytes: number;
}

function isCompareSide(
  value: unknown,
  expected: CompareSideExpectation,
): boolean {
  return (
    isRecord(value) &&
    hasExactlyFields(value, ["ref", "sha256", "bytes"]) &&
    value.ref === expected.ref &&
    value.sha256 === expected.sha256 &&
    value.bytes === expected.bytes
  );
}

const THIN_COMPARE_FIELDS = [
  "schemaVersion",
  "kind",
  "deliveryId",
  "pair",
  "left",
  "right",
  "classification",
  "summary",
  "presentation",
] as const;

function isCompareSummary(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactlyFields(value, ["semantic", "presentation"]) &&
    typeof value.semantic === "string" &&
    value.semantic.length > 0 &&
    typeof value.presentation === "string" &&
    value.presentation.length > 0
  );
}

function isComparePresentation(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactlyFields(value, [
      "mode",
      "renderer",
      "leftPosition",
      "rightPosition",
      "equalFrame",
      "interactive",
      "overlay",
      "deltaColumn",
      "artifactPolicy",
      "resolution",
    ]) &&
    value.mode === "side-by-side" &&
    value.renderer === "flowkit-reference-side-by-side" &&
    value.leftPosition === "before" &&
    value.rightPosition === "after" &&
    value.equalFrame === true &&
    value.interactive === true &&
    value.overlay === false &&
    value.deltaColumn === false &&
    value.artifactPolicy === "disposable-html-not-retained-in-git" &&
    value.resolution === "resolve-left-right-ref-to-architecture-render"
  );
}

export function validateThinArchitectureCompare(
  content: string,
  deliveryId: DeliveryId,
  pair: "current-to-actual" | "planned-to-actual",
  left: CompareSideExpectation,
  right: CompareSideExpectation,
): boolean {
  const parsed = parseJsonObject(content);
  if (parsed === null) return false;
  return (
    hasExactlyFields(parsed, THIN_COMPARE_FIELDS) &&
    parsed.schemaVersion === 1 &&
    parsed.kind === "architecture-thin-compare" &&
    parsed.deliveryId === deliveryId &&
    parsed.pair === pair &&
    isCompareSide(parsed.left, left) &&
    isCompareSide(parsed.right, right) &&
    Array.isArray(parsed.classification) &&
    parsed.classification.length === 2 &&
    parsed.classification[0] === "semantic" &&
    parsed.classification[1] === "presentation" &&
    isCompareSummary(parsed.summary) &&
    isComparePresentation(parsed.presentation)
  );
}

interface EffectiveOutputBytes {
  readonly actualArchitecture: Buffer;
  readonly currentToActualCompare: Buffer;
  readonly plannedToActualCompare: Buffer;
  readonly workflow: Buffer;
  readonly lifecycle: Buffer;
  readonly dataFlow: Buffer;
  readonly workflowWrite: boolean;
  readonly lifecycleWrite: boolean;
  readonly dataFlowWrite: boolean;
}

function systemViewBytes(
  output: DeliveryArchitectureFinalizationDerivedOutputs["workflow"],
  existing: Buffer | null,
): { readonly bytes: Buffer; readonly write: boolean } | null {
  if (output.intent === "preserve-existing") {
    return existing === null ? null : { bytes: existing, write: false };
  }
  const bytes = Buffer.from(output.content, "utf8");
  return {
    bytes,
    write: existing === null || !bytes.equals(existing),
  };
}

function effectiveOutputBytes(
  outputs: DeliveryArchitectureFinalizationDerivedOutputs,
  context: ArchitectureInputContext,
): EffectiveOutputBytes | null {
  const workflow = systemViewBytes(outputs.workflow, context.workflow);
  const lifecycle = systemViewBytes(outputs.lifecycle, context.lifecycle);
  const dataFlow = systemViewBytes(outputs.dataFlow, context.dataFlow);
  if (workflow === null || lifecycle === null || dataFlow === null) return null;
  return {
    actualArchitecture: Buffer.from(outputs.actualArchitecture.content, "utf8"),
    currentToActualCompare: Buffer.from(
      outputs.currentToActualCompare.content,
      "utf8",
    ),
    plannedToActualCompare: Buffer.from(
      outputs.plannedToActualCompare.content,
      "utf8",
    ),
    workflow: workflow.bytes,
    lifecycle: lifecycle.bytes,
    dataFlow: dataFlow.bytes,
    workflowWrite: workflow.write,
    lifecycleWrite: lifecycle.write,
    dataFlowWrite: dataFlow.write,
  };
}

export function architectureClosureRef(
  artifact: string,
  bytes: Buffer,
): DeliveryArchitectureClosureOutputRef {
  return {
    artifact,
    contentSha256: architectureContentSha256(bytes),
    bytes: bytes.length,
  };
}

async function writeFixedOutput(
  repositoryRoot: string,
  relativePath: string,
  bytes: Buffer,
): Promise<boolean> {
  const root = await canonicalRepositoryRoot(repositoryRoot);
  if (root === null) return false;
  const target = absoluteFixedPath(root, relativePath);
  if (target === null) return false;
  try {
    const parent = path.dirname(target);
    await mkdir(parent, { recursive: true });
    if ((await realpath(parent)) !== parent) return false;
    try {
      const existing = await lstat(target);
      if (!existing.isFile() || existing.isSymbolicLink()) return false;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") return false;
    }
    await writeFile(target, bytes);
    return true;
  } catch {
    return false;
  }
}

export interface ArchitectureFinalizationMaterializedOutputs {
  readonly actualArchitectureRef: DeliveryArchitectureClosureOutputRef;
  readonly currentToActualCompareRef: DeliveryArchitectureClosureOutputRef;
  readonly plannedToActualCompareRef: DeliveryArchitectureClosureOutputRef;
  readonly workflowRef: DeliveryArchitectureClosureOutputRef;
  readonly lifecycleRef: DeliveryArchitectureClosureOutputRef;
  readonly dataFlowRef: DeliveryArchitectureClosureOutputRef;
}

export type ArchitectureFinalizationMaterializationResult =
  | {
      readonly status: "ok";
      readonly outputs: ArchitectureFinalizationMaterializedOutputs;
    }
  | {
      readonly status:
        | "derived-result-rejected"
        | "derived-validation-rejected"
        | "managed-archify-rejected"
        | "prestate-drift";
    };

export async function validateAndMaterializeArchitectureFinalizationOutputs(
  repositoryRoot: string,
  flowkitHome: string,
  operationPackage: DeliveryArchitectureFinalizationOperationPackage,
  context: ArchitectureInputContext,
  outputs: DeliveryArchitectureFinalizationDerivedOutputs,
): Promise<ArchitectureFinalizationMaterializationResult> {
  const effective = effectiveOutputBytes(outputs, context);
  if (effective === null) return { status: "derived-result-rejected" };

  const paths = fixedDeliveryArchitecturePaths(operationPackage.deliveryId);
  const actualRef = architectureClosureRef(
    paths.actual,
    effective.actualArchitecture,
  );
  const currentLeft = {
    ref: "./current.architecture.json",
    sha256: architectureContentSha256(context.currentArchitecture),
    bytes: context.currentArchitecture.length,
  };
  const plannedLeft = {
    ref: "./planned.architecture.json",
    sha256: architectureContentSha256(context.plannedArchitecture),
    bytes: context.plannedArchitecture.length,
  };
  const actualRight = {
    ref: "./actual.architecture.json",
    sha256: actualRef.contentSha256,
    bytes: actualRef.bytes,
  };
  if (
    parseJsonObject(effective.actualArchitecture.toString("utf8")) === null ||
    !validateThinArchitectureCompare(
      effective.currentToActualCompare.toString("utf8"),
      operationPackage.deliveryId,
      "current-to-actual",
      currentLeft,
      actualRight,
    ) ||
    !validateThinArchitectureCompare(
      effective.plannedToActualCompare.toString("utf8"),
      operationPackage.deliveryId,
      "planned-to-actual",
      plannedLeft,
      actualRight,
    ) ||
    parseJsonObject(effective.workflow.toString("utf8")) === null ||
    parseJsonObject(effective.lifecycle.toString("utf8")) === null ||
    parseJsonObject(effective.dataFlow.toString("utf8")) === null
  ) {
    return { status: "derived-validation-rejected" };
  }

  const stagingRoot = await mkdtemp(
    path.join(tmpdir(), "flowkit-architecture-finalization-"),
  );
  try {
    const staged = {
      current: path.join(stagingRoot, "current.architecture.json"),
      planned: path.join(stagingRoot, "planned.architecture.json"),
      actual: path.join(stagingRoot, "actual.architecture.json"),
      workflow: path.join(stagingRoot, "workflow.json"),
      lifecycle: path.join(stagingRoot, "lifecycle.json"),
      dataFlow: path.join(stagingRoot, "data-flow.json"),
    };
    await Promise.all([
      writeFile(staged.current, context.currentArchitecture),
      writeFile(staged.planned, context.plannedArchitecture),
      writeFile(staged.actual, effective.actualArchitecture),
      writeFile(staged.workflow, effective.workflow),
      writeFile(staged.lifecycle, effective.lifecycle),
      writeFile(staged.dataFlow, effective.dataFlow),
    ]);
    if (
      !(await validateArchitectureFinalizationWithManagedArchify(
        repositoryRoot,
        flowkitHome,
        stagingRoot,
        staged.current,
        staged.planned,
        staged.actual,
        staged.workflow,
        staged.lifecycle,
        staged.dataFlow,
      ))
    ) {
      return { status: "managed-archify-rejected" };
    }

    if (
      (await revalidateArchitectureFinalizationPrestate(
        repositoryRoot,
        operationPackage,
      )) === null
    ) {
      return { status: "prestate-drift" };
    }

    const writes: readonly [string, Buffer, boolean][] = [
      [paths.actual, effective.actualArchitecture, true],
      [paths.currentToActual, effective.currentToActualCompare, true],
      [paths.plannedToActual, effective.plannedToActualCompare, true],
      [
        ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.workflow,
        effective.workflow,
        effective.workflowWrite,
      ],
      [
        ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.lifecycle,
        effective.lifecycle,
        effective.lifecycleWrite,
      ],
      [
        ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.dataFlow,
        effective.dataFlow,
        effective.dataFlowWrite,
      ],
    ];
    for (const [artifact, bytes, shouldWrite] of writes) {
      if (
        shouldWrite &&
        !(await writeFixedOutput(repositoryRoot, artifact, bytes))
      ) {
        return { status: "derived-validation-rejected" };
      }
    }

    const reread = await Promise.all(
      writes.map(([artifact]) =>
        readFixedRegularFile(repositoryRoot, artifact),
      ),
    );
    if (
      reread.some(
        (bytes, index) => bytes === null || !bytes.equals(writes[index][1]),
      )
    ) {
      return { status: "derived-validation-rejected" };
    }
    const [
      actualArchitecture,
      currentToActualCompare,
      plannedToActualCompare,
      workflow,
      lifecycle,
      dataFlow,
    ] = reread as readonly Buffer[];

    return {
      status: "ok",
      outputs: {
        actualArchitectureRef: architectureClosureRef(
          paths.actual,
          actualArchitecture,
        ),
        currentToActualCompareRef: architectureClosureRef(
          paths.currentToActual,
          currentToActualCompare,
        ),
        plannedToActualCompareRef: architectureClosureRef(
          paths.plannedToActual,
          plannedToActualCompare,
        ),
        workflowRef: architectureClosureRef(
          ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.workflow,
          workflow,
        ),
        lifecycleRef: architectureClosureRef(
          ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.lifecycle,
          lifecycle,
        ),
        dataFlowRef: architectureClosureRef(
          ARCHITECTURE_FINALIZATION_SYSTEM_VIEW_PATHS.dataFlow,
          dataFlow,
        ),
      },
    };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}
