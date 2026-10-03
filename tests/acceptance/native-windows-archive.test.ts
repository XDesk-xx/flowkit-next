import assert from "node:assert/strict";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { format } from "prettier";
import path from "node:path";
import test from "node:test";
import { archiveReadiness } from "../../src/cli/action-readiness.js";
import {
  copyArchiveDependencies,
  dependencyInputHashes,
} from "../../src/internal/archive-dependency-snapshot.js";
import { directoryHashes } from "../../src/internal/archive-file-identities.js";
import {
  runMaterialLocation,
  sha256,
} from "../../src/cli/run-effective-facts.js";
import { executionFixture } from "../unit/domain/execution-recovery-fixture.js";
import { assertDomainFiles } from "./domain-file-reporter.js";

test(
  "native Windows pnpm11 Archive runs real domain/full checks in independent scratch and preserves source",
  {
    skip:
      process.platform !== "win32" ||
      process.env.FLOWKIT_NATIVE_ARCHIVE_ACCEPTANCE !== "1",
  },
  async () => {
    const f = await executionFixture();
    const source = path.resolve(import.meta.dirname, "../..");
    const evidence = process.env.FLOWKIT_NATIVE_ARCHIVE_EVIDENCE;
    assert.ok(evidence, "Explicit evidence destination required");
    assert.ok(
      process.env.FLOWKIT_HOME,
      "Exact external OpenSpec runtime required",
    );
    try {
      for (const name of await readdir(source)) {
        if (
          [
            ".git",
            ".flowkit",
            ".tmp",
            "dist",
            "node_modules",
            "architecture",
            ".agents",
            ".codebuddy",
          ].includes(name) ||
          name.startsWith(".tmp-")
        )
          continue;
        await cp(path.join(source, name), path.join(f.repositoryRoot, name), {
          recursive: true,
        });
      }
      await copyArchiveDependencies(source, f.repositoryRoot);
      const pkg = JSON.parse(
        await readFile(path.join(f.repositoryRoot, "package.json"), "utf8"),
      );
      // Bound native process contention while executing every domain test within the existing 300s check budget.
      assert.equal(
        pkg.scripts["test:domain"],
        "node --import tsx --test tests/unit/domain/*.test.ts",
      );
      for (let shard = 1; shard <= 4; shard++)
        pkg.scripts[`test:domain:${shard}`] =
          `node --import tsx --test --test-reporter=./tests/acceptance/domain-file-reporter.ts --test-concurrency=4 --test-shard=${shard}/4 tests/unit/domain/*.test.ts`;
      pkg.scripts["full-checks"] =
        "node --import tsx tests/native-full-checks.ts";
      await writeFile(
        path.join(f.repositoryRoot, "package.json"),
        JSON.stringify(pkg, null, 2) + "\n",
      );
      await writeFile(
        path.join(f.repositoryRoot, "tests/native-full-checks.ts"),
        await format(
          `import assert from "node:assert/strict"; import { existsSync } from "node:fs"; import { spawnSync } from "node:child_process"; if (existsSync("native-failure.json")) assert.equal(1,2,"actual check failure"); for(const check of ["typecheck","quality:gate","build","quality:dependency-health","quality:entropy","quality:owned-source"]){const result=spawnSync("pnpm",["run",check],{shell:true,stdio:"inherit",windowsHide:true}); if(result.status !== 0) process.exit(result.status ?? 1);}`,
          { parser: "typescript" },
        ),
      );
      const fixtureModules = path.resolve(f.repositoryRoot, "node_modules");
      if (
        path.dirname(fixtureModules) !== f.repositoryRoot ||
        !path.basename(f.root).startsWith("flowkit-context-")
      )
        throw Error("Unsafe native fixture dependency path");
      await rm(fixtureModules, { recursive: true });
      const setup = await promisify(execFile)(
        "pnpm",
        ["install", "--offline", "--frozen-lockfile", "--ignore-scripts"],
        {
          cwd: f.repositoryRoot,
          shell: true,
          windowsHide: true,
          encoding: "buffer",
          timeout: 120_000,
        },
      ).catch(async (error: { stdout: Buffer; stderr: Buffer }) => {
        await mkdir(evidence, { recursive: true });
        await writeFile(path.join(evidence, "setup.stdout.txt"), error.stdout);
        await writeFile(path.join(evidence, "setup.stderr.txt"), error.stderr);
        throw Error(
          `Native fixture offline setup failed; ${evidence}/setup.stdout.txt`,
        );
      });
      await mkdir(evidence, { recursive: true });
      await writeFile(path.join(evidence, "setup.stdout.txt"), setup.stdout);
      await writeFile(path.join(evidence, "setup.stderr.txt"), setup.stderr);
      await writeFile(
        path.join(f.repositoryRoot, "openspec/config.yaml"),
        "schema: spec-driven\n",
      );
      await writeFile(
        path.join(f.repositoryRoot, f.source, ".openspec.yaml"),
        "schema: spec-driven\n",
      );
      await writeFile(
        path.join(f.repositoryRoot, f.source, "proposal.md"),
        "## Why\nNative isolation regression.\n\n## What Changes\n- Add native probe.\n\n## Capabilities\n\n### New Capabilities\n- native-probe: Probe acceptance.\n\n## Impact\n- Disposable fixture only.\n",
      );
      await mkdir(path.join(f.repositoryRoot, f.source, "specs/native-probe"), {
        recursive: true,
      });
      await writeFile(
        path.join(f.repositoryRoot, f.source, "specs/native-probe/spec.md"),
        "## ADDED Requirements\n\n### Requirement: Native probe executes\nThe fixture SHALL execute a native probe.\n\n#### Scenario: Native execution\n- **WHEN** a probe runs\n- **THEN** it SHALL execute\n",
      );
      // The copied repository coordination files are unrelated; this disposable target uses its own exact fixture manifest.
      await writeFile(
        path.join(
          f.repositoryRoot,
          "openspec/delivery-groups/delivery-one.yaml",
        ),
        JSON.stringify({
          id: "delivery-one",
          changes: [
            {
              id: "change-one",
              state: "active",
              dependsOn: [],
              projectOrdinal: 9999,
            },
          ],
          ownerDecisions: [
            {
              ref: `owner:${"a".repeat(64)}`,
              decision: "activate-change",
              deliveryId: "delivery-one",
              changeId: "change-one",
              sourceRef: "synthetic-native-fixture-activation",
              scope: ["explore"],
            },
          ],
        }) + "\n",
      );
      const target = { ...f.base, flowkitHome: process.env.FLOWKIT_HOME! };
      const review = (await runMaterialLocation(target, f.lastId)).record;
      const before = {
        inputs: await dependencyInputHashes(f.repositoryRoot),
        candidate: await directoryHashes(f.repositoryRoot, "src"),
        dependencies: await dependencyRegularHashes(f.repositoryRoot),
      };
      const request = {
        ...target,
        actionId: "archive" as const,
        role: "author" as const,
        applicableChecks: [
          ...[1, 2, 3, 4].map((shard) => ({
            id: `test:domain:${shard}`,
            reason: `Complete domain suite partition ${shard}/4 within each check's existing timeout`,
          })),
          {
            id: "full-checks",
            reason:
              "Actual type/format/lint/build/dependency/entropy/ownership checks",
          },
        ],
      };
      await writeFile(
        path.join(f.repositoryRoot, "native-failure.json"),
        "{}\n",
      );
      await assert.rejects(
        archiveReadiness(
          { ...request, applicableChecks: [request.applicableChecks.at(-1)!] },
          review,
          f.installation,
        ),
        /Post-convergence check failed/,
      );
      await rm(path.join(f.repositoryRoot, "native-failure.json"));
      const started = await f.call("action start", request);
      assert.equal(started.effect, "started");
      const archived = await f.call("change archive", {
        ...target,
        runId: started.runId,
      });
      assert.equal(archived.status, "completed");
      assert.deepEqual(
        await dependencyInputHashes(f.repositoryRoot),
        before.inputs,
      );
      assert.deepEqual(
        await directoryHashes(f.repositoryRoot, "src"),
        before.candidate,
      );
      assert.deepEqual(
        await dependencyRegularHashes(f.repositoryRoot),
        before.dependencies,
      );
      const finished = await f.call("action finish", {
        ...target,
        runId: started.runId,
        role: "author",
        terminal: true,
        result: {
          runId: started.runId,
          actionIdentity: {
            deliveryId: target.deliveryId,
            changeId: target.changeId,
            actionId: "archive",
          },
          authorConclusion: "PASS",
          reviewerVerdict: null,
          verificationVerdict: null,
          nextBoundary: "checkpoint",
          facts: {
            archivePath: archived.archivePath,
            projectOrdinal: archived.projectOrdinal,
            archiveMaterialRefs: archived.archiveMaterialRefs,
            proofRefs: [],
          },
        },
      });
      assert.equal(finished.effect, "confirmed");
      assert.equal((await f.call("status", target)).status, "archived");
      const diagnostics =
        ".flowkit/artifacts/delivery-one/changes/001-change-one/archive-diagnostics";
      const mappings: unknown[] = [];
      let actualDomainChecks = 0;
      const actualDomainCounts: number[] = [];
      const expectedDomainFiles = (
        await readdir(path.join(f.repositoryRoot, "tests/unit/domain"))
      ).filter((name) => name.endsWith(".test.ts"));
      for (const attempt of await readdir(
        path.join(f.repositoryRoot, diagnostics),
      )) {
        let attemptDomainCount = 0;
        let attemptDomainChecks = 0;
        const domainOutputs: string[] = [];
        for (let shard = 1; shard <= 4; shard++) {
          const commandDirectory = path.join(
            f.repositoryRoot,
            diagnostics,
            attempt,
            `commands/check-test%3Adomain%3A${shard}`,
          );
          const domainCommand = await readFile(
            path.join(commandDirectory, "command.json"),
          ).catch((error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") return null;
            throw error;
          });
          if (domainCommand) {
            assert.equal(JSON.parse(domainCommand.toString()).exitCode, 0);
            const stdout = await readFile(
              path.join(commandDirectory, "stdout.txt"),
              "utf8",
            );
            const stderr = await readFile(
              path.join(commandDirectory, "stderr.txt"),
              "utf8",
            );
            const count = /# tests (\d+)/.exec(stdout);
            assert.ok(
              count && Number(count[1]) > 0,
              "Domain partition must actually execute",
            );
            assert.match(stdout, /# fail 0/);
            assert.doesNotMatch(
              stderr,
              /called recursively|skipping running files/,
            );
            domainOutputs.push(stdout);
            actualDomainChecks++;
            attemptDomainChecks++;
            attemptDomainCount += Number(count![1]);
          }
        }
        if (attemptDomainChecks) {
          assert.equal(attemptDomainChecks, 4);
          assertDomainFiles(domainOutputs, expectedDomainFiles);
          actualDomainCounts.push(attemptDomainCount);
        }
        const snapshot = await readFile(
          path.join(
            f.repositoryRoot,
            diagnostics,
            attempt,
            "dependency-snapshot.json",
          ),
        ).catch((error: NodeJS.ErrnoException) => {
          if (error.code === "ENOENT") return null;
          throw error;
        });
        if (snapshot)
          mappings.push(...JSON.parse(snapshot.toString("utf8")).mappings);
      }
      assert.ok(
        mappings.some((value) => (value as { kind: string }).kind === "shim"),
      );
      assert.equal(actualDomainChecks, 8);
      assert.equal(actualDomainCounts.length, 2);
      assert.equal(actualDomainCounts[0], actualDomainCounts[1]);
      await mkdir(evidence, { recursive: true });
      await cp(
        path.join(f.repositoryRoot, diagnostics),
        path.join(evidence, "all-attempts"),
        { recursive: true },
      );
      await cp(
        path.join(
          f.repositoryRoot,
          ".flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects",
        ),
        path.join(evidence, "archive-effects"),
        { recursive: true },
      );
      await writeFile(
        path.join(evidence, "source-identities.json"),
        JSON.stringify(
          {
            node: process.version,
            pnpm: pkg.packageManager,
            before,
            mappings,
            sourceUnchanged: true,
            fixtureOnly: true,
            actualArchive: archived,
            finish: finished,
            realCheckFailureCovered: true,
            actualDomainChecks,
            domainConcurrency: 4,
            domainShards: 4,
            actualDomainCounts,
          },
          null,
          2,
        ) + "\n",
      );
    } finally {
      await mkdir(evidence, { recursive: true });
      await cp(
        path.join(f.repositoryRoot, ".flowkit/artifacts/delivery-one"),
        path.join(evidence, "fixture-artifacts"),
        { recursive: true },
      ).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
      await f.cleanup();
    }
  },
);

async function dependencyRegularHashes(root: string) {
  const result: Record<string, string> = {};
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile())
        result[path.relative(root, file).replaceAll("\\", "/")] = sha256(
          await readFile(file),
        );
    }
  }
  await visit(path.join(root, "node_modules"));
  return result;
}
