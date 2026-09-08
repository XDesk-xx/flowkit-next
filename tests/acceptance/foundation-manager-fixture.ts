import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

export const DELIVERY = "acceptance-delivery";
export const CHANGE = "acceptance-change";
const START = 1;
export const ROOT = path.resolve(
  process.env.FLOWKIT_ACCEPTANCE_INSTALLATION ??
    path.resolve(import.meta.dirname, "../.."),
);
export const DIST = path.join(ROOT, "dist");
export const CLI = path.resolve(
  ROOT,
  JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8")).bin
    .flowkit,
);
export const DOMAIN = path.join(DIST, "domain", "index.js");
const TOOL_LOCK = path.join(ROOT, "config", "tools", "toolchain.lock.json");

export function requireDetachedPrerequisites(env = process.env) {
  const flowkitHome = env.FLOWKIT_HOME;
  assert.ok(flowkitHome, "FLOWKIT_HOME is required for detached acceptance");
  const [major, minor] = process.versions.node.split(".").map(Number);
  assert.ok(
    major > 22 || (major === 22 && minor >= 20),
    "Node >=22.20.0 is required",
  );
  return flowkitHome;
}

export async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function verifyManagedPrerequisites(
  flowkitHome: string,
): Promise<void> {
  const lock = JSON.parse(await readFile(TOOL_LOCK, "utf8"));
  for (const [tool, version] of [["openspec", "1.10.0"]] as const) {
    const runtime = path.join(flowkitHome, "tools", tool, version);
    const pkg = JSON.parse(
      await readFile(path.join(runtime, "package.json"), "utf8"),
    );
    assert.equal(pkg.name, lock[tool].packageName);
    assert.equal(pkg.version, version);
    await stat(path.join(runtime, ...lock[tool].entrypoint.split("/")));
  }
}

export async function runNode(
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

export async function rawCli(
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

export async function cli(
  command: "status" | "next" | "doctor",
  request: unknown,
  fixtureRoot: string,
  env = process.env,
) {
  const result = await rawCli(command, request, fixtureRoot, env);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout) as any;
}

export async function writeCoordinationManifest(
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

export async function makeFixture(flowkitHome: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit acceptance "));
  const repositoryRoot = path.join(root, "repo with spaces");
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

export async function persistTerminal(
  domain: any,
  repositoryRoot: string,
  _sequence: number,
  actionId: "apply" | "archive",
  installationRoot = ROOT,
) {
  // Synthetic kernel/installation regression, not independent host acceptance.
  const actions = [
    "explore",
    "review-explore",
    "propose",
    "review-propose",
    "apply",
    "review-apply",
    "archive",
  ];
  const existing = await domain.listChangeRunHistory({
    repositoryRoot,
    deliveryId: DELIVERY,
    changeId: CHANGE,
    changeStartSequence: START,
  });
  const installation = (
    await import(
      pathToFileURL(
        path.join(installationRoot, "dist/internal/manager-installation.js"),
      ).href
    )
  ).loadManagerInstallation();
  let prior = existing.at(-1) ?? null;
  for (
    let index = existing.length;
    index <= actions.indexOf(actionId);
    index++
  ) {
    const action = actions[index];
    const occurrence = {
      date: "20260828",
      sequence: index + 1,
      actionId: action,
    };
    const runId = domain.formatRunOccurrenceId(occurrence);
    const identity = {
      deliveryId: DELIVERY,
      changeId: CHANGE,
      actionId: action,
    };
    const reviewer = action.startsWith("review-");
    const context = {
      runId,
      occurrence,
      actionIdentity: identity,
      role: reviewer ? "reviewer" : "author",
      lifecycleState: "prepared",
      ownerAuthority: null,
      previousRunId: prior?.context.runId ?? null,
    };
    const outcome = await domain.invokeSingleAction(
      installation,
      prior
        ? {
            identity: prior.context.actionIdentity,
            state: prior.context.lifecycleState,
          }
        : null,
      identity,
      context,
      () => ({
        runId,
        actionIdentity: identity,
        authorConclusion: reviewer ? null : "PASS",
        reviewerVerdict: reviewer ? "approved" : null,
        verificationVerdict: null,
        nextBoundary: action === "archive" ? "checkpoint" : actions[index + 1],
        facts: { acceptance: "synthetic-kernel" },
      }),
    );
    assert.equal(outcome.status, "terminal");
    const address = {
      repositoryRoot,
      deliveryId: DELIVERY,
      changeId: CHANGE,
      changeStartSequence: START,
      occurrence,
    };
    await domain.writeDurableRun(address, {
      actionMarkdown: `# ${action}\n`,
      context: { ...context, lifecycleState: "terminal" },
      result: outcome.result,
    });
    prior = await domain.readDurableRun(address);
  }
  assert.equal(prior.context.actionIdentity.actionId, actionId);
  return prior;
}

export function common(fixture: {
  repositoryRoot: string;
  flowkitHome: string;
}) {
  return {
    repositoryRoot: fixture.repositoryRoot,
    deliveryId: DELIVERY,
    changeId: CHANGE,
    flowkitHome: fixture.flowkitHome,
  };
}
