import { isExactGitPath } from "../domain/delivery-repository-integration-operation.js";

export type IndexBasis =
  | { readonly kind: "absent" }
  | {
      readonly kind: "entry";
      readonly mode: string;
      readonly blobOid: string;
      readonly eol: string;
    };
export interface CandidateGitFile {
  readonly rawSha256: string;
  readonly blobOid: string;
  readonly conversion: "identity" | "crlf-to-lf";
  readonly text: string;
  readonly eol: string;
  readonly indexBasis: IndexBasis;
}
export interface CandidateGit {
  readonly version: 1;
  readonly objectFormat: "sha1" | "sha256";
  readonly settings: Readonly<{
    autocrlf: string;
    eol: string;
    safecrlf: string;
  }>;
  readonly files: Readonly<Record<string, CandidateGitFile>>;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function exact(item: Record<string, unknown>, fields: string): boolean {
  return Object.keys(item).sort().join() === fields;
}
export function isCandidateGit(value: unknown): value is CandidateGit {
  if (
    !record(value) ||
    !exact(value, "files,objectFormat,settings,version") ||
    value.version !== 1 ||
    !["sha1", "sha256"].includes(String(value.objectFormat)) ||
    !record(value.settings) ||
    !exact(value.settings, "autocrlf,eol,safecrlf") ||
    !["false", "true", "input"].includes(value.settings.autocrlf as string) ||
    !["lf", "crlf", "native"].includes(value.settings.eol as string) ||
    !["false", "true", "warn"].includes(value.settings.safecrlf as string) ||
    !record(value.files) ||
    Object.keys(value.files).length === 0
  )
    return false;
  const oid = new RegExp(
    `^[0-9a-f]{${value.objectFormat === "sha1" ? 40 : 64}}$`,
  );
  return Object.entries(value.files).every(([file, item]) => {
    if (
      !isExactGitPath(file) ||
      !record(item) ||
      !exact(item, "blobOid,conversion,eol,indexBasis,rawSha256,text") ||
      typeof item.rawSha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(item.rawSha256) ||
      typeof item.blobOid !== "string" ||
      !oid.test(item.blobOid) ||
      !["identity", "crlf-to-lf"].includes(item.conversion as string) ||
      !["set", "unset", "auto", "unspecified"].includes(item.text as string) ||
      !["lf", "crlf", "unspecified"].includes(item.eol as string) ||
      !record(item.indexBasis)
    )
      return false;
    const basis = item.indexBasis;
    if (basis.kind === "absent") return exact(basis, "kind");
    return (
      basis.kind === "entry" &&
      exact(basis, "blobOid,eol,kind,mode") &&
      ["100644", "100755"].includes(basis.mode as string) &&
      typeof basis.blobOid === "string" &&
      oid.test(basis.blobOid) &&
      ["lf", "crlf", "mixed", "none", "-text"].includes(basis.eol as string)
    );
  });
}

export function candidateGitMatchesResult(value: {
  actionIdentity: { actionId: string };
  authorConclusion: unknown;
  facts: Record<string, unknown>;
}): boolean {
  const candidate = value.facts.candidateGit;
  if (!isCandidateGit(candidate)) return false;
  const hashes = value.facts.artifactHashes;
  const raw: Record<string, unknown> = record(hashes) ? { ...hashes } : {};
  if (
    ["explore", "revise-explore"].includes(value.actionIdentity.actionId) &&
    typeof value.facts.exploreArtifact === "string"
  )
    raw[value.facts.exploreArtifact] = value.facts.exploreSha256;
  if (
    value.authorConclusion !== null &&
    (value.authorConclusion !== "PASS" ||
      ![
        "explore",
        "revise-explore",
        "propose",
        "revise-propose",
        "apply",
        "revise-apply",
      ].includes(value.actionIdentity.actionId))
  )
    return false;
  if (Object.keys(raw).length || value.authorConclusion !== null) {
    if (
      Object.keys(raw).sort().join() !==
        Object.keys(candidate.files).sort().join() ||
      Object.entries(candidate.files).some(
        ([file, identity]) => raw[file] !== identity.rawSha256,
      )
    )
      return false;
  }
  return true;
}
