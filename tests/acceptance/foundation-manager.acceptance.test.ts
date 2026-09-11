import assert from "node:assert/strict";
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import test from "node:test";

import {
  DELIVERY,
  CHANGE,
  ROOT,
  DIST,
  CLI,
  DOMAIN,
  requireDetachedPrerequisites,
  exists,
  verifyManagedPrerequisites,
  runNode,
  rawCli,
  cli,
  writeCoordinationManifest,
  makeFixture,
  persistTerminal,
  common,
} from "./foundation-manager-fixture.js";

test("installed manager relocates without target assets, dev dependencies or project writes", async () => {
  const fixture = await makeFixture(requireDetachedPrerequisites());
  const relocated = path.join(fixture.root, "manager B with spaces");
  try {
    const retained = [
      "project-test.config.json",
      ".flowkit/artifacts/previous-proof.txt",
    ];
    for (const relative of retained) {
      const file = path.join(fixture.repositoryRoot, relative);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, "target-owned bytes\n");
    }
    await mkdir(relocated);
    // Only runtime installation assets, never the source repository history.
    for (const entry of ["package.json", "dist", "skills", "config/tools"]) {
      await cp(path.join(ROOT, entry), path.join(relocated, entry), {
        recursive: true,
      });
    }
    await cp(
      path.dirname(
        createRequire(path.join(ROOT, "package.json")).resolve(
          "yaml/package.json",
        ),
      ),
      path.join(relocated, "node_modules/yaml"),
      { recursive: true, dereference: true },
    );
    const bDomain = await import(
      pathToFileURL(path.join(relocated, "dist/domain/index.js")).href
    );
    const bInstallation = (
      await import(
        pathToFileURL(
          path.join(relocated, "dist/internal/manager-installation.js"),
        ).href
      )
    ).loadManagerInstallation();
    const aInstallation = (
      await import(
        pathToFileURL(path.join(DIST, "internal/manager-installation.js")).href
      )
    ).loadManagerInstallation();
    const aDomain = await import(pathToFileURL(DOMAIN).href);
    assert.equal(bInstallation.name, aInstallation.name);
    assert.equal(bInstallation.version, aInstallation.version);
    assert.notEqual(bInstallation.root, aInstallation.root);
    assert.deepEqual(
      await aDomain.resolveActionGuidanceRef(aInstallation, "apply"),
      await bDomain.resolveActionGuidanceRef(bInstallation, "apply"),
    );
    const run = await persistTerminal(
      bDomain,
      fixture.repositoryRoot,
      1,
      "apply",
      relocated,
    );
    const request = common(fixture);
    assert.equal(run.context.actionIdentity.actionId, "apply");
    const expected = await cli("status", request, fixture.root);
    const bin = JSON.parse(
      await readFile(path.join(relocated, "package.json"), "utf8"),
    ).bin.flowkit;
    const requestPath = path.join(fixture.root, "relocated-request.json");
    async function bCli(command: string, value: unknown) {
      await writeFile(requestPath, JSON.stringify(value));
      return runNode(
        [path.join(relocated, bin), command, "--input", requestPath],
        { cwd: fixture.repositoryRoot },
      );
    }
    assert.deepEqual(
      JSON.parse((await bCli("status", request)).stdout),
      expected,
    );
    for (const relative of [
      "skills/actions/apply/SKILL.md",
      "config/tools/toolchain.lock.json",
      "package.json",
    ]) {
      const destination = path.join(fixture.repositoryRoot, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, "invalid target collision");
    }
    assert.deepEqual(
      JSON.parse((await bCli("status", request)).stdout),
      expected,
    );
    const doctorRequest = {
      repositoryRoot: fixture.repositoryRoot,
      flowkitHome: fixture.flowkitHome,
    };
    const doctor = await bCli("doctor", doctorRequest);
    assert.equal(doctor.code, 0, doctor.stdout);
    assert.equal(
      (await bCli("status", { ...request, managerRoot: relocated })).code,
      2,
    );
    const missing = {
      ...request,
      flowkitHome: path.join(fixture.root, "missing-runtime"),
    };
    const next = await bCli("next", missing);
    assert.equal(next.code, 2);
    assert.match(next.stdout, /missing-runtime/);
    const missingDoctor = await bCli("doctor", {
      ...doctorRequest,
      flowkitHome: missing.flowkitHome,
    });
    assert.match(missingDoctor.stdout, /missing-runtime/);
    const missingStatus = await bCli("status", missing);
    assert.equal(missingStatus.code, 2);
    assert.match(missingStatus.stdout, /missing-runtime/);
    for (const relative of retained) {
      assert.equal(
        await readFile(path.join(fixture.repositoryRoot, relative), "utf8"),
        "target-owned bytes\n",
      );
      assert.equal(await exists(path.join(relocated, relative)), false);
    }
    for (const relative of [
      ".flowkit",
      "openspec",
      ".agents",
      "node_modules/tsx",
    ]) {
      assert.equal(
        await exists(path.join(relocated, relative)),
        false,
        relative,
      );
    }
    assert.equal(
      await exists(path.join(fixture.repositoryRoot, ".flowkit/runs")),
      true,
    );
    assert.equal(
      await exists(path.join(fixture.repositoryRoot, "node_modules")),
      false,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

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
      error: {
        kind: "invalid-request",
        message:
          "Remove currentRunId/changeStartSequence; context is resolved from target and optional deliveryId/changeId",
      },
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
      error: {
        kind: "invalid-request",
        message:
          "Remove currentRunId/changeStartSequence; context is resolved from target and optional deliveryId/changeId",
      },
    });

    const status = await cli("status", common(fixture), fixture.root);
    assert.equal(status.changeState, "active");
    assert.equal(status.currentRun.runId, applyRun.context.runId);
    assert.deepEqual(status.openSpec.activeChangeIds, [CHANGE]);
    const next = await cli("next", common(fixture), fixture.root);
    assert.deepEqual(next.decision, {
      kind: "ready-action",
      actionId: "review-apply",
    });
    const obsolete = await rawCli(
      "next",
      { ...common(fixture), currentRunId: null },
      fixture.root,
    );
    assert.equal(obsolete.code, 2);
    assert.equal(JSON.parse(obsolete.stdout).error.kind, "invalid-request");

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
    assert.equal(archiveRun.context.actionIdentity.actionId, "archive");
    await mkdir(
      path.join(fixture.repositoryRoot, "openspec", "changes", "archive"),
      { recursive: true },
    );
    await rename(
      path.join(fixture.repositoryRoot, "openspec", "changes", CHANGE),
      path.join(
        fixture.repositoryRoot,
        "openspec",
        "changes",
        "archive",
        "2026-09-08-001-" + CHANGE,
      ),
    );
    await writeCoordinationManifest(fixture.repositoryRoot, "completed");
    const checkpoint = await cli(
      "next",
      {
        ...common(fixture),
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
  const entry = await readFile(path.join(DIST, "cli", "entrypoint.js"), "utf8");
  const observation = await readFile(
    path.join(DIST, "domain", "openspec-observation.js"),
    "utf8",
  );
  const production = `${entry}\n${observation}`;
  assert.equal(production.includes("shell: true"), false);
  assert.equal(production.includes("path.posix"), false);
});

test("Delivery Final public contract is exact and has no Git or next-operation capability", async () => {
  const domain: any = await import(pathToFileURL(DOMAIN).href);
  assert.equal(typeof domain.prepareDeliveryFinalOperationPackage, "function");
  assert.equal(typeof domain.invokeDeliveryFinalOperation, "function");
  assert.equal(typeof domain.deriveDeliveryFinalizationRef, "function");
  assert.equal(
    domain.canonicalDeliveryGuidancePath("delivery-final"),
    "skills/delivery/final/SKILL.md",
  );

  const implementation = await Promise.all(
    [
      "dist/domain/delivery-final-execution.js",
      "dist/internal/delivery-final-coordination.js",
      "skills/delivery/final/SKILL.md",
    ].map((relative) => readFile(path.join(ROOT, relative), "utf8")),
  );
  const boundedSurface = implementation.join("\n");
  for (const forbidden of [
    "git add",
    "git commit",
    "git push",
    "git merge",
    "git tag",
    "pull request",
    "auto-run next",
  ]) {
    assert.equal(boundedSurface.toLowerCase().includes(forbidden), false);
  }
  assert.equal(boundedSurface.includes("child_process"), false);
});
