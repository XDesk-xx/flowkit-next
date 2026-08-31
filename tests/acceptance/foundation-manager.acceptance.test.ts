import assert from "node:assert/strict";
import {
  access,
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import test from "node:test";

const DELIVERY = "acceptance-delivery";
const CHANGE = "acceptance-change";
const START = 1;
const ROOT = path.resolve(import.meta.dirname, "../..");
const DIST = path.join(ROOT, "dist");
const CLI = path.join(DIST, "cli", "entrypoint.js");
const DOMAIN = path.join(DIST, "domain", "index.js");
const TOOL_LOCK = path.join(ROOT, "config", "tools", "toolchain.lock.json");

function requireDetachedPrerequisites(env = process.env) {
  const flowkitHome = env.FLOWKIT_HOME;
  assert.ok(flowkitHome, "FLOWKIT_HOME is required for detached acceptance");
  const [major, minor] = process.versions.node.split(".").map(Number);
  assert.ok(
    major > 22 || (major === 22 && minor >= 20),
    "Node >=22.20.0 is required",
  );
  return flowkitHome;
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function verifyManagedPrerequisites(flowkitHome: string): Promise<void> {
  const lock = JSON.parse(await readFile(TOOL_LOCK, "utf8"));
  for (const [tool, version] of [
    ["openspec", "1.10.0"],
    ["archify", "2.15.0"],
  ] as const) {
    const runtime = path.join(flowkitHome, "tools", tool, version);
    const pkg = JSON.parse(
      await readFile(path.join(runtime, "package.json"), "utf8"),
    );
    assert.equal(pkg.name, lock[tool].packageName);
    assert.equal(pkg.version, version);
    await stat(path.join(runtime, ...lock[tool].entrypoint.split("/")));
  }
}

async function runNode(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(process.execPath, args, {
        cwd: options.cwd ?? ROOT,
        env: options.env ?? process.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "",
        stderr = "";
      child.stdout.setEncoding("utf8").on("data", (v) => {
        stdout += v;
      });
      child.stderr.setEncoding("utf8").on("data", (v) => {
        stderr += v;
      });
      child.once("error", reject);
      child.once("close", (code) => resolve({ code, stdout, stderr }));
    },
  );
}

async function rawCli(
  command: "status" | "next" | "doctor",
  request: unknown,
  fixtureRoot: string,
  env = process.env,
) {
  const requestDir = path.join(fixtureRoot, "request files with spaces");
  await mkdir(requestDir, { recursive: true });
  const requestPath = path.join(requestDir, `${command} request.json`);
  await writeFile(
    requestPath,
    `${JSON.stringify(request, null, 2).replace(/\n/g, "\r\n")}\r\n`,
  );
  return runNode([CLI, command, "--input", requestPath], { env });
}

async function cli(
  command: "status" | "next" | "doctor",
  request: unknown,
  fixtureRoot: string,
  env = process.env,
) {
  const result = await rawCli(command, request, fixtureRoot, env);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout) as any;
}

async function writeCoordinationManifest(
  repositoryRoot: string,
  state: "planned" | "active" | "completed" | "cancelled" = "active",
): Promise<void> {
  const dir = path.join(repositoryRoot, "openspec", "delivery-groups");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${DELIVERY}.yaml`),
    `id: ${DELIVERY}
changes:
  - id: ${CHANGE}
    state: ${state}
    dependsOn: []
ownerDecisions:
  - ref: owner:${"a".repeat(64)}
    decision: activate-change
    deliveryId: ${DELIVERY}
    changeId: ${CHANGE}
    sourceRef: acceptance
    scope:
      - explore
`,
  );
}

async function makeFixture(flowkitHome: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit acceptance "));
  const repositoryRoot = path.join(root, "repo with spaces");
  await mkdir(path.join(repositoryRoot, "config", "tools"), {
    recursive: true,
  });
  await copyFile(
    TOOL_LOCK,
    path.join(repositoryRoot, "config", "tools", "toolchain.lock.json"),
  );
  await mkdir(path.join(repositoryRoot, "openspec", "changes", CHANGE), {
    recursive: true,
  });
  await writeFile(
    path.join(repositoryRoot, "openspec", "config.yaml"),
    "schema: spec-driven\n",
  );
  await writeFile(
    path.join(repositoryRoot, "openspec", "changes", CHANGE, ".openspec.yaml"),
    "schema: spec-driven\n",
  );
  await writeFile(
    path.join(repositoryRoot, "openspec", "changes", CHANGE, "proposal.md"),
    "## Why\nacceptance\n\n## What Changes\n- fixture\n\n## Capabilities\n\n### New Capabilities\n- fixture\n\n## Impact\n- disposable\n",
  );
  await writeCoordinationManifest(repositoryRoot);
  return { root, repositoryRoot, flowkitHome };
}

function occurrence(sequence: number, actionId: "apply" | "archive") {
  return { date: "20260828", sequence, actionId } as const;
}

function preparedContext(sequence: number, actionId: "apply" | "archive") {
  const runId = `20260828-${String(sequence).padStart(3, "0")}-${actionId}`;
  return {
    runId,
    occurrence: occurrence(sequence, actionId),
    actionIdentity: { deliveryId: DELIVERY, changeId: CHANGE, actionId },
    role: "author" as const,
    lifecycleState: "prepared" as const,
    ownerAuthority: null,
    previousRunId: null,
  };
}

function candidateResult(runId: string, actionId: "apply" | "archive") {
  return {
    runId,
    actionIdentity: { deliveryId: DELIVERY, changeId: CHANGE, actionId },
    authorConclusion: "PASS",
    reviewerVerdict: null,
    verificationVerdict: null,
    nextBoundary: actionId === "apply" ? "review-apply" : "checkpoint",
    facts: { acceptance: true },
  };
}

async function persistTerminal(
  domain: any,
  repositoryRoot: string,
  sequence: number,
  actionId: "apply" | "archive",
) {
  const context = preparedContext(sequence, actionId);
  const outcome = await domain.invokeSingleAction(
    null,
    context.actionIdentity,
    context,
    (pkg: any) => candidateResult(pkg.runId, actionId),
  );
  assert.equal(outcome.status, "terminal");
  const terminalContext = { ...context, lifecycleState: "terminal" as const };
  await domain.writeDurableRun(
    {
      repositoryRoot,
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeStartSequence: START,
      occurrence: context.occurrence,
    },
    {
      actionMarkdown: `# ${actionId}\n`,
      context: terminalContext,
      result: outcome.result,
    },
  );
  const reread = await domain.readDurableRun({
    repositoryRoot,
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeStartSequence: START,
    occurrence: context.occurrence,
  });
  assert.equal(reread.context.runId, context.runId);
  return reread;
}

function common(fixture: { repositoryRoot: string; flowkitHome: string }) {
  return {
    repositoryRoot: fixture.repositoryRoot,
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeStartSequence: START,
    flowkitHome: fixture.flowkitHome,
  };
}

test("detached prerequisites are explicit and fail closed", async () => {
  const flowkitHome = requireDetachedPrerequisites();
  await stat(CLI);
  await stat(DOMAIN);
  await verifyManagedPrerequisites(flowkitHome);
  assert.throws(() =>
    requireDetachedPrerequisites({ ...process.env, FLOWKIT_HOME: "" }),
  );
  const badHome = await mkdtemp(path.join(os.tmpdir(), "flowkit bad home "));
  try {
    const runtime = path.join(badHome, "tools", "openspec", "1.10.0");
    await mkdir(path.join(runtime, "bin"), { recursive: true });
    await writeFile(
      path.join(runtime, "package.json"),
      JSON.stringify({ name: "@fission-ai/openspec", version: "9.9.9" }),
    );
    await writeFile(path.join(runtime, "bin", "openspec.js"), "");
    await assert.rejects(verifyManagedPrerequisites(badHome));
  } finally {
    await rm(badHome, { recursive: true, force: true });
  }
});

test("detached whole-manager acceptance uses candidate-generated durable Runs and emitted CLI", async () => {
  const flowkitHome = requireDetachedPrerequisites();
  const fixture = await makeFixture(flowkitHome);
  try {
    const domain: any = await import(pathToFileURL(DOMAIN).href);
    const applyRun = await persistTerminal(
      domain,
      fixture.repositoryRoot,
      1,
      "apply",
    );
    await writeCoordinationManifest(fixture.repositoryRoot, "planned");
    const legacyUpgrade = await rawCli(
      "status",
      {
        ...common(fixture),
        changeState: "active",
        currentRunId: applyRun.context.runId,
      },
      fixture.root,
    );
    assert.equal(legacyUpgrade.code, 2);
    assert.deepEqual(JSON.parse(legacyUpgrade.stdout), {
      kind: "error",
      error: { kind: "invalid-request" },
    });

    await writeCoordinationManifest(fixture.repositoryRoot, "active");
    const legacyDowngrade = await rawCli(
      "status",
      {
        ...common(fixture),
        changeState: "planned",
        currentRunId: applyRun.context.runId,
      },
      fixture.root,
    );
    assert.equal(legacyDowngrade.code, 2);
    assert.deepEqual(JSON.parse(legacyDowngrade.stdout), {
      kind: "error",
      error: { kind: "invalid-request" },
    });

    const status = await cli(
      "status",
      { ...common(fixture), currentRunId: applyRun.context.runId },
      fixture.root,
    );
    assert.equal(status.changeState, "active");
    assert.equal(status.currentRun.runId, applyRun.context.runId);
    assert.deepEqual(status.openSpec.activeChangeIds, [CHANGE]);
    const next = await cli(
      "next",
      { ...common(fixture), currentRunId: applyRun.context.runId },
      fixture.root,
    );
    assert.deepEqual(next.decision, {
      kind: "ready-action",
      actionId: "review-apply",
    });
    const empty = await cli(
      "next",
      { ...common(fixture), currentRunId: null },
      fixture.root,
    );
    assert.deepEqual(empty.decision, {
      kind: "ready-action",
      actionId: "explore",
    });

    const archiveRun = await persistTerminal(
      domain,
      fixture.repositoryRoot,
      2,
      "archive",
    );
    const owner = {
      ref: `owner:${"a".repeat(64)}`,
      decision: "authorize-checkpoint",
      deliveryId: DELIVERY,
      changeId: CHANGE,
      sourceRef: "acceptance",
      scope: ["checkpoint"],
    };
    await writeCoordinationManifest(fixture.repositoryRoot, "completed");
    const checkpoint = await cli(
      "next",
      {
        ...common(fixture),
        currentRunId: archiveRun.context.runId,
        checkpointAuthority: owner,
      },
      fixture.root,
    );
    assert.deepEqual(checkpoint.decision, {
      kind: "ready-checkpoint-evaluation",
    });
    assert.deepEqual(checkpoint.checkpoint, {
      authorized: true,
      reason: "authorized",
    });
    assert.equal(
      await exists(path.join(fixture.repositoryRoot, ".git")),
      false,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("doctor uses exact managed runtimes and ignores fake PATH executables", async () => {
  const flowkitHome = requireDetachedPrerequisites();
  const fixture = await makeFixture(flowkitHome);
  const fakeBin = path.join(fixture.root, "fake path");
  const openMarker = path.join(fixture.root, "openspec-used");
  const archMarker = path.join(fixture.root, "archify-used");
  try {
    await mkdir(fakeBin, { recursive: true });
    for (const [name, marker] of [
      ["openspec", openMarker],
      ["archify", archMarker],
    ] as const) {
      const file = path.join(fakeBin, name);
      await writeFile(
        file,
        `#!/bin/sh\nprintf used > ${JSON.stringify(marker)}\nexit 99\n`,
      );
      await chmod(file, 0o755);
    }
    const result = await cli(
      "doctor",
      { repositoryRoot: fixture.repositoryRoot, flowkitHome },
      fixture.root,
      { ...process.env, PATH: fakeBin },
    );
    assert.equal(result.status, "pass");
    assert.deepEqual(
      result.diagnostics.map((d: any) => [d.id, d.status, d.version ?? null]),
      [
        ["openspec-runtime", "pass", "1.10.0"],
        ["archify-runtime", "pass", "2.15.0"],
        ["openspec-root", "pass", null],
      ],
    );
    assert.equal(await exists(openMarker), false);
    assert.equal(await exists(archMarker), false);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("windows-compatibility-simulation covers current path and process portability surface", async () => {
  const w = path.win32;
  const repo = "C:\\Work Space\\flowkit-next";
  const home = "C:\\Flowkit Home";
  const runDir = w.join(
    repo,
    ".flowkit",
    "runs",
    "delivery",
    "113-change",
    "20260828-117-apply",
  );
  assert.equal(
    w.dirname(runDir),
    w.join(repo, ".flowkit", "runs", "delivery", "113-change"),
  );
  assert.equal(w.basename(runDir), "20260828-117-apply");
  assert.equal(
    w.join(repo, ".flowkit", "memos.json"),
    "C:\\Work Space\\flowkit-next\\.flowkit\\memos.json",
  );
  const parent = w.join(home, "tools", "openspec");
  const runtime = w.join(home.toLowerCase(), "TOOLS", "OPENSPEC", "1.10.0");
  const rel = w.relative(parent.toLowerCase(), runtime.toLowerCase());
  assert.equal(rel.startsWith("..") || w.isAbsolute(rel), false);
  assert.equal(
    w.resolve(runtime, "bin", "openspec.js").toLowerCase(),
    "c:\\flowkit home\\tools\\openspec\\1.10.0\\bin\\openspec.js",
  );
  const crossDrive = w.relative(parent, "D:\\escape\\openspec");
  assert.equal(w.isAbsolute(crossDrive), true);
  const packageJson = JSON.parse(
    await readFile(path.join(ROOT, "package.json"), "utf8"),
  );
  assert.equal(packageJson.bin.flowkit, "dist/cli/entrypoint.js");
  const entry = await readFile(
    path.join(ROOT, "src", "cli", "entrypoint.ts"),
    "utf8",
  );
  const observation = await readFile(
    path.join(ROOT, "src", "domain", "openspec-observation.ts"),
    "utf8",
  );
  const production = `${entry}\n${observation}`;
  assert.equal(production.includes("shell: true"), false);
  assert.equal(production.includes("path.posix"), false);
});
