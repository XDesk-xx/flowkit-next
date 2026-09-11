import {
  hasExactlyFields,
  isPlainRecord,
  isSafeText,
} from "./applicable-check-identity.js";

export interface EvidenceArtifactRef {
  readonly artifact: string;
  readonly contentSha256: string;
  readonly bytes: number;
}

export function isEvidenceArtifactRef(
  value: unknown,
): value is EvidenceArtifactRef {
  return (
    isPlainRecord(value) &&
    hasExactlyFields(value, ["artifact", "contentSha256", "bytes"]) &&
    isSafeText(value.artifact) &&
    !value.artifact.includes("..") &&
    typeof value.contentSha256 === "string" &&
    /^[0-9a-f]{64}$/.test(value.contentSha256) &&
    Number.isSafeInteger(value.bytes) &&
    (value.bytes as number) >= 0
  );
}
