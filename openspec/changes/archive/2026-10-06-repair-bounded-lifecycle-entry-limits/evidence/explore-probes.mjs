import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Read-only installed-manager probes plus disposable ordinal fixtures.
// Owner/Run objects below are synthetic function inputs, never execution records.
const repositoryRoot = path.resolve(process.argv[2] ?? process.cwd());
const managerRoot = path.resolve(
  process.argv[3] ?? "D:/tools/flowkit-manager/node_modules/flowkit-next",
);
const load = (name) =>
  import(pathToFileURL(path.join(managerRoot, "dist", name)).href);
const { parseFoundationCliRequestJson: parseJson } =
  await load("cli/request.js");
const { parseSupportRequest } = await load("cli/support-request.js");
const { snapshotGitHostRequest } = await load("domain/git-workflow-host.js");
const { evaluatePolicyAndNextBoundary: policy } = await load(
  "domain/policy-and-next-boundary.js",
);
const { transitionCurrentAction } = await load("domain/action-lifecycle.js");
const { isJsonObject } = await load("domain/run-result-persistence.js");
const { isCandidateGit } = await load("internal/candidate-git-facts.js");
const { readProjectOrdinal } = await load("cli/action-readiness.js");
const pkg = JSON.parse(
  await fs.readFile(path.join(managerRoot, "package.json"), "utf8"),
);
const git = (...args) =>
  execFileSync("git", args, { cwd: repositoryRoot }).toString("utf8").trim();
const sources = [
  "src/cli/request.ts",
  "src/cli/entrypoint.ts",
  "src/domain/policy-and-next-boundary.ts",
  "src/domain/action-lifecycle.ts",
  "src/cli/action-readiness.ts",
  "src/domain/run-result-persistence.ts",
  "src/cli/action-finish.ts",
];
const sourceSha256 = {};
for (const file of sources) {
  sourceSha256[file] = createHash("sha256")
    .update(await fs.readFile(path.join(repositoryRoot, file)))
    .digest("hex");
}
const observed = {
  kind: "explore-observations",
  recordedAt: new Date().toISOString(),
  repositoryRoot,
  repositoryHead: git("rev-parse", "HEAD"),
  managerRoot,
  managerPackage: { name: pkg.name, version: pkg.version },
  node: process.version,
  platform: process.platform,
  sourceSha256,
  boundary:
    "Synthetic inputs are not Owner authority, Runs, Review or Verification verdicts; no lifecycle/Git writes executed.",
  observations: [],
};
function record(id, value) {
  observed.observations.push({ id, ...value });
}
function attempt(fn) {
  try {
    return { accepted: true, value: fn() };
  } catch (error) {
    return {
      accepted: false,
      message: error.message,
      kind: error.kind ?? null,
    };
  }
}
const owner = {
  ref: "owner:" + "a".repeat(64),
  decision: "authorize-checkpoint",
  deliveryId: "audit-delivery",
  sourceRef: "audit-fixture:not-owner-authorization",
  scope: ["checkpoint"],
};
const paths = execFileSync(
  "git",
  ["diff-tree", "--no-commit-id", "--name-only", "-r", "-z", "HEAD"],
  {
    cwd: repositoryRoot,
  },
)
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .sort();
const request = {
  repositoryRoot,
  flowkitHome: "C:/Users/xuser/.flowkit",
  deliveryId: owner.deliveryId,
  ownerAuthority: owner,
  gitRequest: {
    targetRoot: repositoryRoot,
    node: "delivery-start",
    deliveryId: owner.deliveryId,
    changeId: null,
    ownerSourceRef: owner.sourceRef,
    expectedBranch: "main",
    operation: {
      kind: "create-new",
      paths,
      commitMessage: "delivery(audit-delivery): audit fixture",
      commitShape: null,
    },
  },
};
parseSupportRequest("git checkpoint", request, {
  repositoryRoot,
  deliveryId: owner.deliveryId,
});
snapshotGitHostRequest(request.gitRequest);
const input = JSON.stringify(request);
const large = attempt(() => parseJson(input));
assert.equal(large.accepted, false);
record("E01-real-path-set", {
  paths: paths.length,
  bytes: Buffer.byteLength(input),
  closedRequestShape: "accepted",
  transport: large,
});
for (const bytes of [65_536, 65_537]) {
  const text = '{"x":"' + "a".repeat(bytes - 8) + '"}';
  const result = attempt(() => parseJson(text));
  assert.equal(result.accepted, bytes === 65_536);
  record("E01-current-byte-boundary", {
    bytes,
    result: { accepted: result.accepted, message: result.message ?? null },
  });
}
const cli = (args, stdin) => {
  const result = spawnSync(
    process.execPath,
    [path.join(managerRoot, "dist/cli/entrypoint.js"), ...args],
    {
      input: stdin,
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2);
  return {
    exitCode: result.status,
    stdout: JSON.parse(result.stdout),
    stderr: result.stderr,
  };
};
const authorActions = [
  "explore",
  "revise-explore",
  "propose",
  "revise-propose",
  "apply",
  "revise-apply",
];
function failed(actionId) {
  const identity = {
    deliveryId: "audit-delivery",
    changeId: "audit-change",
    actionId,
  };
  const runId = "20261005-001-" + actionId;
  const requestedAction = "revise-" + actionId.replace("revise-", "");
  return {
    deliveryId: identity.deliveryId,
    changeId: identity.changeId,
    changeState: "active",
    currentAction: { identity, state: "terminal" },
    terminalRunContext: {
      runId,
      occurrence: { date: "20261005", sequence: 1, actionId },
      actionIdentity: identity,
      role: "author",
      lifecycleState: "terminal",
      ownerAuthority: null,
      previousRunId: null,
    },
    terminalResult: {
      runId,
      actionIdentity: identity,
      authorConclusion: "FAIL",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: null,
      facts: {},
    },
    ownerCorrection: {
      requestedAction,
      authority: {
        ...owner,
        decision: "revise-action",
        changeId: identity.changeId,
        scope: [requestedAction],
      },
    },
  };
}
for (const actionId of authorActions) {
  const facts = failed(actionId);
  const result = policy(facts);
  assert.deepEqual(result, {
    kind: "blocked",
    reason: "unrecognized-or-unsuccessful-author-outcome",
  });
  const noOwner = policy({ ...facts, ownerCorrection: null });
  const structural = transitionCurrentAction(facts.currentAction, {
    type: "prepare",
    identity: {
      ...facts.currentAction.identity,
      actionId: facts.ownerCorrection.requestedAction,
    },
  });
  record("E02-terminal-author-failure", {
    actionId,
    correction: facts.ownerCorrection.requestedAction,
    policy: result,
    withoutOwner: noOwner,
    ordinaryPrepareCanEnter: structural !== null,
  });
}
function candidateFacts(count, indexed = false) {
  const files = {},
    artifactHashes = {};
  for (let i = 0; i < count; i++) {
    const file = "src/f" + i + ".ts";
    artifactHashes[file] = "a".repeat(64);
    files[file] = {
      rawSha256: artifactHashes[file],
      blobOid: "b".repeat(40),
      conversion: "identity",
      text: "unset",
      eol: "unspecified",
      indexBasis: indexed
        ? {
            kind: "entry",
            mode: "100644",
            blobOid: "b".repeat(40),
            eol: "-text",
          }
        : { kind: "absent" },
    };
  }
  return {
    artifactHashes,
    candidateGit: {
      version: 1,
      objectFormat: "sha1",
      settings: { autocrlf: "false", eol: "lf", safecrlf: "false" },
      files,
    },
    proofRefs: [],
  };
}
function measurements(value, depth = 0) {
  let nodes = 1,
    maxDepth = depth;
  if (value && typeof value === "object")
    for (const child of Object.values(value)) {
      const next = measurements(child, depth + 1);
      nodes += next.nodes;
      maxDepth = Math.max(maxDepth, next.maxDepth);
    }
  return { nodes, maxDepth };
}
for (const indexed of [false, true]) {
  let firstRejected = null,
    lastWithinBytes = null;
  for (let count = 1; count <= 256; count++) {
    const facts = candidateFacts(count, indexed);
    assert.equal(isCandidateGit(facts.candidateGit), true);
    const bytes = Buffer.byteLength(JSON.stringify(facts));
    if (bytes > 65_536) break;
    const value = {
      files: count,
      bytes,
      ...measurements(facts),
      accepted: isJsonObject(facts),
    };
    if (!value.accepted && !firstRejected) firstRejected = value;
    lastWithinBytes = value;
  }
  record("E04-candidate-budget", {
    indexBasis: indexed ? "entry" : "absent",
    firstRejected,
    lastWithinBytes,
    note: "Measurements only; no larger budget has been implemented or admitted.",
  });
}
const temp = await fs.mkdtemp(
  path.join(os.tmpdir(), "flowkit-explore-limits-"),
);
const deliveryRoot = path.join(temp, "openspec/delivery-groups");
await fs.mkdir(deliveryRoot, { recursive: true });
const manifest = path.join(deliveryRoot, "audit-delivery.yaml");
const requestFile = path.join(temp, "request.json");
try {
  await fs.writeFile(requestFile, input);
  for (const mode of ["file", "stdin"])
    record("E01-installed-cli", {
      mode,
      result: cli(
        [
          "git",
          "checkpoint",
          "--repository-root",
          repositoryRoot,
          "--delivery-id",
          owner.deliveryId,
          "--input",
          mode === "stdin" ? "-" : requestFile,
        ],
        mode === "stdin" ? input : undefined,
      ),
    });
  const target = {
    repositoryRoot: temp,
    deliveryId: "audit-delivery",
    changeId: "audit-change",
  };
  const variants = [
    [
      "no-baseline",
      "changes:\n  - id: audit-change\n    state: active\n",
      false,
    ],
    [
      "valid-baseline",
      "changes:\n  - id: prior-change\n    projectOrdinal: 8\n  - id: audit-change\n    state: active\n",
      true,
    ],
    [
      "duplicate-baseline",
      "changes:\n  - id: prior-change\n    projectOrdinal: 8\n  - id: other-change\n    projectOrdinal: 8\n  - id: audit-change\n    state: active\n",
      false,
    ],
    [
      "malformed-baseline",
      "changes:\n  - id: prior-change\n    projectOrdinal: zero\n  - id: audit-change\n    state: active\n",
      false,
    ],
  ];
  for (const [variant, text, expected] of variants) {
    await fs.writeFile(manifest, text);
    let result;
    try {
      result = {
        accepted: true,
        value: await readProjectOrdinal(target, true),
      };
    } catch (error) {
      result = { accepted: false, message: error.message };
    }
    assert.equal(result.accepted, expected);
    if (expected) assert.equal(result.value, 9);
    record("E03-ordinal", { variant, result });
  }
} finally {
  // Exact disposable files only; no recursive deletion or repository writes.
  await fs.unlink(requestFile);
  await fs.unlink(manifest);
  await fs.rmdir(deliveryRoot);
  await fs.rmdir(path.dirname(deliveryRoot));
  await fs.rmdir(temp);
}
console.log(JSON.stringify(observed, null, 2));
