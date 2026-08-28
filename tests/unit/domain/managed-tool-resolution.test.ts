import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ManagedToolResolutionError,
  resolveManagedTool,
  type ManagedToolResolutionDiagnosticKind,
} from "../../../src/domain/index.js";

type ToolId = "openspec" | "archify";

interface ToolFixture {
  packageName: string;
  version: string;
  entrypoint: string;
}

const TOOL_FIXTURES: Record<ToolId, ToolFixture> = {
  openspec: {
    packageName: "@fission-ai/openspec",
    version: "1.10.0",
    entrypoint: "bin/openspec.js",
  },
  archify: {
    packageName: "archify",
    version: "2.15.0",
    entrypoint: "bin/archify.mjs",
  },
};

async function tempRoot(prefix: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

function lockEntry(toolId: ToolId, overrides: Record<string, unknown> = {}) {
  const fixture = TOOL_FIXTURES[toolId];
  return {
    packageName: fixture.packageName,
    version: fixture.version,
    runtimeRoot: `\${FLOWKIT_HOME}/tools/${toolId}/${fixture.version}`,
    entrypoint: fixture.entrypoint,
    runtimeArtifact: `${toolId}-runtime.tgz`,
    runtimeArtifactSha256: "a".repeat(64),
    ...overrides,
  };
}

async function writeLock(
  repositoryRoot: string,
  overrides: {
    openspec?: Record<string, unknown>;
    archify?: Record<string, unknown>;
    root?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const target = path.join(
    repositoryRoot,
    "config",
    "tools",
    "toolchain.lock.json",
  );
  await mkdir(path.dirname(target), { recursive: true });
  const document = {
    schemaVersion: 1,
    generatedFor: "test",
    openspec: lockEntry("openspec", overrides.openspec),
    archify: lockEntry("archify", overrides.archify),
    ...overrides.root,
  };
  await writeFile(target, `${JSON.stringify(document, null, 2)}\n`);
}

async function createRuntime(
  flowkitHome: string,
  toolId: ToolId,
  overrides: Partial<ToolFixture> = {},
): Promise<{ runtimeRoot: string; entrypoint: string }> {
  const fixture = { ...TOOL_FIXTURES[toolId], ...overrides };
  const runtimeRoot = path.join(
    flowkitHome,
    "tools",
    toolId,
    TOOL_FIXTURES[toolId].version,
  );
  const entrypoint = path.join(runtimeRoot, ...fixture.entrypoint.split("/"));
  await mkdir(path.dirname(entrypoint), { recursive: true });
  await writeFile(
    path.join(runtimeRoot, "package.json"),
    `${JSON.stringify({ name: fixture.packageName, version: fixture.version }, null, 2)}\n`,
  );
  await writeFile(
    entrypoint,
    "// fixture; resolver must not execute this file\n",
  );
  return { runtimeRoot, entrypoint };
}

async function setup(): Promise<{
  repositoryRoot: string;
  flowkitHome: string;
}> {
  const repositoryRoot = await tempRoot("flowkit-managed-repo-");
  const flowkitHome = await tempRoot("flowkit-managed-home-");
  await writeLock(repositoryRoot);
  return { repositoryRoot, flowkitHome };
}

async function expectDiagnostic(
  promise: Promise<unknown>,
  kind: ManagedToolResolutionDiagnosticKind,
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof ManagedToolResolutionError);
    assert.equal(error.kind, kind);
    return true;
  });
}

test("resolves exact OpenSpec identity with the closed resolved shape", async () => {
  const { repositoryRoot, flowkitHome } = await setup();
  const fixture = await createRuntime(flowkitHome, "openspec");

  const resolved = await resolveManagedTool({
    repositoryRoot,
    flowkitHome,
    toolId: "openspec",
  });

  assert.deepEqual(resolved, {
    toolId: "openspec",
    version: "1.10.0",
    runtimeRoot: await import("node:fs/promises").then(({ realpath }) =>
      realpath(fixture.runtimeRoot),
    ),
    entrypoint: await import("node:fs/promises").then(({ realpath }) =>
      realpath(fixture.entrypoint),
    ),
  });
  assert.equal(Object.isFrozen(resolved), true);
});

test("rejects unsupported managed tool ids before any fallback", async () => {
  const { repositoryRoot, flowkitHome } = await setup();
  await expectDiagnostic(
    resolveManagedTool({ repositoryRoot, flowkitHome, toolId: "node" }),
    "unsupported-managed-tool",
  );
});

test("requires explicit FLOWKIT_HOME", async () => {
  const { repositoryRoot } = await setup();
  await expectDiagnostic(
    resolveManagedTool({ repositoryRoot, toolId: "openspec" }),
    "missing-flowkit-home",
  );
});

test("rejects invalid or expanded managed-tool lock authority", async () => {
  const { repositoryRoot, flowkitHome } = await setup();
  await writeLock(repositoryRoot, { root: { node: { version: "22.23.2" } } });
  await expectDiagnostic(
    resolveManagedTool({ repositoryRoot, flowkitHome, toolId: "openspec" }),
    "invalid-lock",
  );
});

test("rejects traversing runtime-root material", async () => {
  const { repositoryRoot, flowkitHome } = await setup();
  await writeLock(repositoryRoot, {
    openspec: { runtimeRoot: "${FLOWKIT_HOME}/tools/openspec/../1.10.0" },
  });
  await expectDiagnostic(
    resolveManagedTool({ repositoryRoot, flowkitHome, toolId: "openspec" }),
    "invalid-runtime-root",
  );
});

test("ignores conflicting PATH executable and returns only managed runtime facts", async () => {
  const { repositoryRoot, flowkitHome } = await setup();
  const fixture = await createRuntime(flowkitHome, "openspec");
  const fakePath = await tempRoot("flowkit-fake-path-");
  const fakeExecutable = path.join(
    fakePath,
    process.platform === "win32" ? "openspec.cmd" : "openspec",
  );
  await writeFile(fakeExecutable, "9.9.9\n");
  const previousPath = process.env.PATH;
  process.env.PATH = `${fakePath}${path.delimiter}${previousPath ?? ""}`;
  try {
    const resolved = await resolveManagedTool({
      repositoryRoot,
      flowkitHome,
      toolId: "openspec",
    });
    assert.equal(resolved.version, "1.10.0");
    assert.equal(
      resolved.runtimeRoot,
      await import("node:fs/promises").then(({ realpath }) =>
        realpath(fixture.runtimeRoot),
      ),
    );
    assert.notEqual(resolved.entrypoint, fakeExecutable);
  } finally {
    process.env.PATH = previousPath;
  }
});

test("ignores absent or malformed peer lock entries during on-demand resolution", async () => {
  const openspecWithMalformedPeer = await setup();
  await createRuntime(openspecWithMalformedPeer.flowkitHome, "openspec");
  await writeLock(openspecWithMalformedPeer.repositoryRoot, {
    archify: { entrypoint: undefined },
  });
  assert.equal(
    (
      await resolveManagedTool({
        ...openspecWithMalformedPeer,
        toolId: "openspec",
      })
    ).toolId,
    "openspec",
  );

  const archifyWithMalformedPeer = await setup();
  await createRuntime(archifyWithMalformedPeer.flowkitHome, "archify");
  await writeLock(archifyWithMalformedPeer.repositoryRoot, {
    openspec: { entrypoint: undefined },
  });
  assert.equal(
    (
      await resolveManagedTool({
        ...archifyWithMalformedPeer,
        toolId: "archify",
      })
    ).toolId,
    "archify",
  );

  const openspecWithoutPeer = await setup();
  await createRuntime(openspecWithoutPeer.flowkitHome, "openspec");
  await writeLock(openspecWithoutPeer.repositoryRoot, {
    root: { archify: undefined },
  });
  assert.equal(
    (await resolveManagedTool({ ...openspecWithoutPeer, toolId: "openspec" }))
      .toolId,
    "openspec",
  );

  const archifyWithoutPeer = await setup();
  await createRuntime(archifyWithoutPeer.flowkitHome, "archify");
  await writeLock(archifyWithoutPeer.repositoryRoot, {
    root: { openspec: undefined },
  });
  assert.equal(
    (await resolveManagedTool({ ...archifyWithoutPeer, toolId: "archify" }))
      .toolId,
    "archify",
  );
});

test("fails closed when requested managed runtime is absent", async () => {
  const { repositoryRoot, flowkitHome } = await setup();
  await expectDiagnostic(
    resolveManagedTool({ repositoryRoot, flowkitHome, toolId: "archify" }),
    "missing-runtime",
  );
});

test("rejects exact package name or version mismatch", async () => {
  const first = await setup();
  await createRuntime(first.flowkitHome, "openspec", {
    packageName: "openspec-fake",
  });
  await expectDiagnostic(
    resolveManagedTool({ ...first, toolId: "openspec" }),
    "package-identity-mismatch",
  );

  const second = await setup();
  await createRuntime(second.flowkitHome, "archify", { version: "2.15.1" });
  await expectDiagnostic(
    resolveManagedTool({ ...second, toolId: "archify" }),
    "package-identity-mismatch",
  );
});

test("rejects missing and escaping entrypoints", async () => {
  const missing = await setup();
  const runtime = await createRuntime(missing.flowkitHome, "openspec");
  await import("node:fs/promises").then(({ unlink }) =>
    unlink(runtime.entrypoint),
  );
  await expectDiagnostic(
    resolveManagedTool({ ...missing, toolId: "openspec" }),
    "missing-entrypoint",
  );

  const escaping = await setup();
  await createRuntime(escaping.flowkitHome, "openspec");
  await writeLock(escaping.repositoryRoot, {
    openspec: { entrypoint: "../outside.js" },
  });
  await expectDiagnostic(
    resolveManagedTool({ ...escaping, toolId: "openspec" }),
    "invalid-runtime-root",
  );
});

test("resolves requested tool on demand without requiring its peer", async () => {
  const openspecOnly = await setup();
  await createRuntime(openspecOnly.flowkitHome, "openspec");
  assert.equal(
    (await resolveManagedTool({ ...openspecOnly, toolId: "openspec" })).toolId,
    "openspec",
  );
  await assert.rejects(
    stat(path.join(openspecOnly.flowkitHome, "tools", "archify")),
    { code: "ENOENT" },
  );

  const archifyOnly = await setup();
  await createRuntime(archifyOnly.flowkitHome, "archify");
  assert.equal(
    (await resolveManagedTool({ ...archifyOnly, toolId: "archify" })).toolId,
    "archify",
  );
  await assert.rejects(
    stat(path.join(archifyOnly.flowkitHome, "tools", "openspec")),
    { code: "ENOENT" },
  );
});

test("resolution never invokes the managed entrypoint or requires archive provenance", async () => {
  const { repositoryRoot, flowkitHome } = await setup();
  const fixture = await createRuntime(flowkitHome, "openspec");
  const marker = path.join(flowkitHome, "invoked.txt");
  await writeFile(
    fixture.entrypoint,
    `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "invoked");\n`,
  );

  const lockPath = path.join(
    repositoryRoot,
    "config",
    "tools",
    "toolchain.lock.json",
  );
  assert.match(await readFile(lockPath, "utf8"), /runtimeArtifactSha256/);
  await resolveManagedTool({ repositoryRoot, flowkitHome, toolId: "openspec" });
  await assert.rejects(stat(marker), { code: "ENOENT" });
});
