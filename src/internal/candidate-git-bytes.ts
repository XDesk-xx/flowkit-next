import path from "node:path";
import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { gitBytes, gitText } from "./git-checkpoint-scope.js";
import {
  isCandidateGit,
  type CandidateGit,
  type CandidateGitFile,
  type IndexBasis,
} from "./candidate-git-facts.js";
import { isExactGitPath } from "../domain/delivery-repository-integration-operation.js";

export async function verifyCachedCandidateRules(
  root: string,
  binding: CandidateGit,
) {
  if (!isDeepStrictEqual(binding.settings, await settings(root)))
    throw Error("Candidate Git settings changed");
  const rules = await attributesFor(root, Object.keys(binding.files), true);
  for (const [relative, identity] of Object.entries(binding.files)) {
    const attrs = rules[relative];
    if (
      attrs.text !== identity.text ||
      attrs.eol !== identity.eol ||
      ["filter", "working-tree-encoding", "ident"].some(
        (name) => !["unset", "unspecified"].includes(attrs[name]),
      )
    )
      unsupported(
        relative,
        "candidate tree attributes differ from bound rules",
      );
  }
}

/** Read-only comparison; never normalizes a candidate or writes a Git object. */
export async function assertCandidateGitBytes(root: string, relative: string) {
  const attributes = (
    await gitBytes(root, [
      "--literal-pathspecs",
      "check-attr",
      "-z",
      "filter",
      "working-tree-encoding",
      "ident",
      "--",
      relative,
    ])
  )
    .toString("utf8")
    .split("\0");
  for (let i = 0; i + 2 < attributes.length; i += 3)
    if (
      attributes[i] !== relative ||
      !["unspecified", "unset"].includes(attributes[i + 2])
    )
      throw Error(
        `Candidate Git projection unsupported: ${relative}: ${attributes[i + 1]}`,
      );
  const file = path.join(root, ...relative.split("/"));
  const raw = await gitText(root, ["hash-object", "--no-filters", "--", file]);
  const filtered = await gitText(root, [
    "hash-object",
    `--path=${relative}`,
    "--",
    file,
  ]);
  if (!/^[0-9a-f]{40,64}$/.test(raw) || raw !== filtered)
    throw Error(`Candidate raw/Git-filtered bytes differ: ${relative}`);
}

function unsupported(relative: string, reason: string): never {
  throw Error(`Candidate Git projection unsupported: ${relative}: ${reason}`);
}

function blobOid(format: "sha1" | "sha256", bytes: Buffer): string {
  return createHash(format)
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex");
}

/** Ordinary add mode; the immutable indexBasis remains the input, not the output. */
export async function ordinaryGitFileModes(
  root: string,
  bases: Readonly<Record<string, IndexBasis>>,
): Promise<Record<string, string>> {
  const setting = () =>
    gitText(root, [
      "config",
      "--bool",
      "--default",
      "true",
      "--get",
      "core.filemode",
    ]);
  const filemode = await setting();
  const modes: Record<string, string> = {};
  for (const [relative, basis] of Object.entries(bases)) {
    if (!isExactGitPath(relative)) unsupported(relative, "invalid path");
    const stat = await lstat(path.join(root, ...relative.split("/")));
    if (!stat.isFile() || stat.isSymbolicLink())
      unsupported(relative, "non-ordinary worktree file");
    modes[relative] =
      filemode === "true"
        ? stat.mode & 0o100
          ? "100755"
          : "100644"
        : basis.kind === "entry"
          ? basis.mode
          : "100644";
  }
  if ((await setting()) !== filemode)
    throw Error("Git filemode changed during projection");
  return modes;
}

async function settings(root: string): Promise<CandidateGit["settings"]> {
  const get = (key: string, fallback: string) =>
    gitText(root, ["config", "--default", fallback, "--get", key]);
  return {
    autocrlf: await get("core.autocrlf", "false"),
    eol: await get("core.eol", "native"),
    safecrlf: await get("core.safecrlf", "false"),
  };
}

function pathBatches(paths: readonly string[]) {
  const batches: string[][] = [];
  let current: string[] = [],
    size = 0;
  for (const file of paths) {
    if (size + file.length + 3 > 7000 && current.length) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(file);
    size += file.length + 3;
  }
  if (current.length) batches.push(current);
  return batches;
}
async function attributesFor(
  root: string,
  paths: readonly string[],
  cached = false,
) {
  const result: Record<string, Record<string, string>> = Object.fromEntries(
    paths.map((file) => [file, {}]),
  );
  for (const batch of pathBatches(paths)) {
    const fields = (
      await gitBytes(root, [
        "--literal-pathspecs",
        "check-attr",
        ...(cached ? ["--cached"] : []),
        "-z",
        "text",
        "eol",
        "filter",
        "working-tree-encoding",
        "ident",
        "--",
        ...batch,
      ])
    )
      .toString("utf8")
      .split("\0");
    if (fields.pop() !== "" || fields.length !== batch.length * 15)
      throw Error("Candidate attribute response invalid");
    for (let i = 0; i < fields.length; i += 3) {
      if (!Object.hasOwn(result, fields[i]))
        throw Error("Candidate attribute path conflict");
      result[fields[i]][fields[i + 1]] = fields[i + 2];
    }
  }
  return result;
}
async function indexBases(
  root: string,
  relatives: readonly string[],
): Promise<Record<string, IndexBasis>> {
  const args = ["--literal-pathspecs", "ls-files"];
  const outputs: string[][] = [];
  for (const batch of pathBatches(relatives))
    outputs.push(
      await Promise.all([
        gitText(root, [...args, "--stage", "-z", "--", ...batch]),
        gitText(root, [...args, "-v", "-z", "--", ...batch]),
        gitText(root, [...args, "--eol", "-z", "--", ...batch]),
      ]),
    );
  const [stage, flags, eols] = [0, 1, 2].map((i) =>
    outputs.map((output) => output[i]).join(""),
  );
  const result: Record<string, IndexBasis> = Object.fromEntries(
    relatives.map((file) => [file, { kind: "absent" }]),
  );
  const flagMap = new Map(
    flags
      .split("\0")
      .filter(Boolean)
      .map((value) => [value.slice(2), value.slice(0, 1)]),
  );
  const eolMap = new Map(
    eols
      .split("\0")
      .filter(Boolean)
      .map((value) => [
        value.slice(value.indexOf("\t") + 1),
        /^i\/(-text|lf|crlf|mixed|none)\s/.exec(value)?.[1],
      ]),
  );
  for (const value of stage.split("\0").filter(Boolean)) {
    const match = /^(100644|100755) ([0-9a-f]{40,64}) 0\t(.+)$/.exec(value);
    const relative = match?.[3] ?? value.slice(value.indexOf("\t") + 1);
    if (
      !match ||
      !Object.hasOwn(result, relative) ||
      result[relative].kind !== "absent"
    )
      unsupported(relative, "non-ordinary index entry");
    if (flagMap.get(relative) !== "H")
      unsupported(relative, "index flags suppress ordinary staging");
    const eol = eolMap.get(relative);
    if (!eol) unsupported(relative, "unknown index EOL");
    result[relative] = {
      kind: "entry",
      mode: match[1],
      blobOid: match[2],
      eol,
    };
  }
  return result;
}

async function projectFile(
  root: string,
  relative: string,
  format: CandidateGit["objectFormat"],
  config: CandidateGit["settings"],
  before: IndexBasis,
  attrs: Record<string, string>,
  outputMode: string,
  prior?: CandidateGitFile,
): Promise<CandidateGitFile> {
  if (!isExactGitPath(relative)) unsupported(relative, "invalid path");
  const raw = await readFile(path.join(root, ...relative.split("/")));
  for (const name of ["filter", "working-tree-encoding", "ident"])
    if (!["unspecified", "unset"].includes(attrs[name]))
      unsupported(relative, name);
  const basis = prior?.indexBasis ?? before;
  if (
    prior &&
    !isDeepStrictEqual(before, basis) &&
    !(
      before.kind === "entry" &&
      before.blobOid === prior.blobOid &&
      before.mode === outputMode
    )
  )
    unsupported(relative, "index is neither bound input nor verified output");
  const text = attrs.text,
    eol = attrs.eol;
  if (
    !["set", "unset", "auto", "unspecified"].includes(text) ||
    !["lf", "crlf", "unspecified"].includes(eol)
  )
    unsupported(relative, "unknown text/eol action");
  const explicit =
    text === "set" || (text === "unspecified" && eol !== "unspecified");
  const auto =
    text === "auto" ||
    (text === "unspecified" && !explicit && config.autocrlf !== "false");
  const retained =
    auto && basis.kind === "entry" && ["crlf", "mixed"].includes(basis.eol);
  let output = raw;
  if (text !== "unset" && !retained && (explicit || auto)) {
    const native = await gitText(root, [
      "hash-object",
      `--path=${relative}`,
      "--",
      relative,
    ]);
    const lf = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"));
    if (native !== blobOid(format, raw)) {
      if (
        raw.includes(0) ||
        !Buffer.from(raw.toString("utf8")).equals(raw) ||
        native !== blobOid(format, lf)
      )
        unsupported(relative, "not a safe UTF-8 EOL-only conversion");
      output = lf;
    }
  }
  const expected = blobOid(format, output);
  if (before.kind === "entry" && before.blobOid !== expected) {
    const old = await gitBytes(root, ["cat-file", "blob", before.blobOid]);
    if (old.equals(raw) && !output.equals(raw))
      unsupported(
        relative,
        "raw equals old index but clean differs; stat-cache output ambiguous",
      );
    // Confirm ordinary Git notices a change without refreshing/writing the index.
    if (
      !(
        await gitBytes(root, [
          "--literal-pathspecs",
          "diff-files",
          "--raw",
          "-z",
          "--no-ext-diff",
          "--no-textconv",
          "--",
          relative,
        ])
      ).length
    )
      unsupported(
        relative,
        "ordinary staging change cannot be established read-only",
      );
  }
  const sensitive = relative.startsWith(".flowkit/") || text === "unset";
  if (sensitive && !output.equals(raw))
    unsupported(relative, "managed evidence must remain byte exact");
  return {
    rawSha256: createHash("sha256").update(raw).digest("hex"),
    blobOid: expected,
    conversion: output.equals(raw) ? "identity" : "crlf-to-lf",
    text,
    eol,
    indexBasis: basis,
  };
}

export async function candidateGitProjection(
  root: string,
  hashes: Readonly<Record<string, unknown>>,
  binding?: unknown,
): Promise<CandidateGit> {
  if (binding !== undefined && !isCandidateGit(binding))
    throw Error("Invalid candidateGit binding");
  const prior = binding as CandidateGit | undefined;
  const format = await gitText(root, ["rev-parse", "--show-object-format"]);
  if (format !== "sha1" && format !== "sha256")
    throw Error("Unsupported Git object format");
  const config = await settings(root);
  if (
    prior &&
    (prior.objectFormat !== format ||
      !isDeepStrictEqual(prior.settings, config))
  )
    throw Error("Candidate Git settings changed");
  const files: Record<string, CandidateGitFile> = {};
  const relatives = Object.keys(hashes).sort();
  const before = await indexBases(root, relatives);
  const modes = await ordinaryGitFileModes(
    root,
    Object.fromEntries(
      relatives.map((relative) => [
        relative,
        prior?.files[relative]?.indexBasis ?? before[relative],
      ]),
    ),
  );
  const rules = await attributesFor(root, relatives);
  for (let offset = 0; offset < relatives.length; offset += 8) {
    const batch = relatives.slice(offset, offset + 8);
    const identities = await Promise.all(
      batch.map((relative) =>
        projectFile(
          root,
          relative,
          format,
          config,
          before[relative],
          rules[relative],
          modes[relative],
          prior?.files[relative],
        ),
      ),
    );
    for (const [i, relative] of batch.entries()) {
      files[relative] = identities[i];
      if (files[relative].rawSha256 !== hashes[relative])
        throw Error(`Candidate raw changed: ${relative}`);
    }
  }
  if (!isDeepStrictEqual(before, await indexBases(root, relatives)))
    throw Error("Index changed during candidate projection");
  const result: CandidateGit = {
    version: 1,
    objectFormat: format,
    settings: config,
    files,
  };
  if (!isCandidateGit(result) || (prior && !isDeepStrictEqual(result, prior)))
    throw Error("Candidate Git binding conflicts with observed projection");
  if (!isDeepStrictEqual(config, await settings(root)))
    throw Error("Git settings changed during projection");
  return result;
}
