import { createHash } from "node:crypto";

export type CandidateGitMode = "100644" | "100755" | "120000";
export type CandidateMaterialKind = "regular" | "symlink";

export interface CandidateManifestRecord {
  readonly path: string;
  readonly kind: CandidateMaterialKind;
  readonly mode: CandidateGitMode;
  readonly materialRef: string;
}

export function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

export function sortCandidateRecords(
  records: readonly CandidateManifestRecord[],
): CandidateManifestRecord[] {
  return [...records].sort((left, right) => compareUtf8(left.path, right.path));
}

export function deriveCandidateRefFromRecords(
  records: readonly CandidateManifestRecord[],
): string {
  const digest = createHash("sha256")
    .update("flowkit-applicable-check-candidate-v2")
    .update("\0")
    .update(JSON.stringify(sortCandidateRecords(records)))
    .digest("hex");
  return `candidate:sha256:${digest}`;
}

export function materialRef(value: Buffer): string {
  return `sha256:${sha256(value)}`;
}
