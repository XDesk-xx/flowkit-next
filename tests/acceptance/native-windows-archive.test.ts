import assert from "node:assert/strict";
import { cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  archiveFixture,
  lpEolPaths,
} from "../unit/domain/archive-contract-fixture.js";
import { archiveChange } from "../../src/cli/support-change-archive.js";
import { completionSource } from "../../src/cli/support-delivery-final.js";
import { readDeliveryChangeCompletions } from "../../src/internal/delivery-required-evidence-source.js";
import { executeScopedCheckpoint } from "../../src/internal/git-checkpoint-execution.js";
import { directoryHashes } from "../../src/internal/archive-file-identities.js";
import { openSpecArchiveDate } from "../../src/internal/openspec-archive-date.js";
import { gitBytes } from "../../src/internal/git-checkpoint-scope.js";

test(
  "native Windows exact OpenSpec safe collision FAIL, new Run PASS, scoped checkpoint and bounded completion consumer",
  {
    skip:
      process.platform !== "win32" ||
      process.env.FLOWKIT_NATIVE_ARCHIVE_ACCEPTANCE !== "1",
  },
  async () => {
    const home = process.env.FLOWKIT_HOME,
      evidence = process.env.FLOWKIT_NATIVE_ARCHIVE_EVIDENCE;
    assert.ok(home, "Exact external managed OpenSpec home required");
    assert.ok(evidence, "Explicit proof destination required");
    const f = await archiveFixture(home, true);
    try {
      const root = f.repositoryRoot;
      await gitBytes(root, ["config", "user.name", "Fixture"]);
      await gitBytes(root, ["config", "user.email", "fixture@example.invalid"]);
      await gitBytes(root, ["checkout", "-b", "main"]);
      await gitBytes(root, [
        "add",
        "--",
        ".gitattributes",
        "openspec",
        "candidate.txt",
      ]);
      await gitBytes(root, ["commit", "-m", "synthetic baseline"]);
      await writeFile(
        path.join(root, ".flowkit/project.json"),
        JSON.stringify({ projectId: "fixture-project" }) + "\n",
      );
      await mkdir(path.join(root, "node_modules/.bin"), { recursive: true });
      await writeFile(
        path.join(root, "node_modules/.bin/tool.cmd"),
        '@"%~dp0\\..\\tool\\bin.cjs" %*\r\n',
      );
      await symlink(home, path.join(root, "ignored-data"), "junction");
      const collision = `openspec/changes/archive/${openSpecArchiveDate()}-change-one`;
      await mkdir(path.join(root, collision), { recursive: true });
      await writeFile(path.join(root, collision, "existing.md"), "preserve\n");
      const started = await f.start();
      const failed = await archiveChange(
        { ...f.base, runId: started.runId },
        f.installation,
      );
      assert.equal(failed.status, "failed", JSON.stringify(failed));
      assert.deepEqual(failed.archiveOutcome, {
        kind: "failed",
        effect: "no-mutation",
        retryable: true,
      });
      await f.finish(started.runId, failed);
      assert.equal(
        await readFile(path.join(root, collision, "existing.md"), "utf8"),
        "preserve\n",
      );
      await rm(path.join(root, collision), { recursive: true }); // Fixture owner removes only its verified collision after the terminal FAIL.
      const retry = await f.start();
      const archived = await archiveChange(
        { ...f.base, runId: retry.runId },
        f.installation,
      );
      assert.equal(archived.status, "completed", JSON.stringify(archived));
      await f.finish(retry.runId, archived);
      const completions = await readDeliveryChangeCompletions(
        completionSource(root),
        {
          repositoryRoot: root,
          projectId: "fixture-project",
          deliveryId: "delivery-one",
          changeIds: ["change-one"],
        },
      );
      assert.equal(completions?.[0].archiveRunId, retry.runId);
      assert.equal(completions?.[0].reviewApplyRunId, f.lastId);
      assert.deepEqual(Object.keys(completions![0]), [
        "changeId",
        "archiveRunId",
        "reviewApplyRunId",
        "archiveResultRef",
        "reviewResultRef",
      ]);
      const archivePath = String(archived.archivePath);
      const authorized = [
        ...Object.keys(f.candidate),
        ...Object.keys((await directoryHashes(root, archivePath))!).map(
          (s) => `${archivePath}/${s}`,
        ),
        ...Object.keys(
          (await directoryHashes(
            root,
            ".flowkit/runs/delivery-one/001-change-one",
          ))!,
        ).map((s) => `.flowkit/runs/delivery-one/001-change-one/${s}`),
        ...Object.keys(
          (await directoryHashes(
            root,
            ".flowkit/artifacts/delivery-one/changes/001-change-one",
          ))!,
        ).map(
          (s) => `.flowkit/artifacts/delivery-one/changes/001-change-one/${s}`,
        ),
      ];
      for (const [suffix] of Object.entries(
        (await directoryHashes(root, "openspec/specs")) ?? {},
      ))
        authorized.push(`openspec/specs/${suffix}`);
      const checkpoint = await executeScopedCheckpoint(
        root,
        "main",
        {
          kind: "create-new",
          paths: [...new Set(authorized)].sort(),
          commitMessage: "change(change-one): native archive fixture",
          commitShape: null,
        },
        async () => true,
        f.base,
      );
      assert.equal(checkpoint.status, "completed", JSON.stringify(checkpoint));
      assert.deepEqual(
        await gitBytes(root, ["show", `HEAD:${archivePath}/helper.cmd`]),
        Buffer.from("@echo fixture\n"),
      );
      for (const relative of lpEolPaths) {
        assert.deepEqual(
          await readFile(path.join(root, relative)),
          Buffer.from("LP EOL fixture\r\n"),
        );
        assert.deepEqual(
          await gitBytes(root, ["show", `HEAD:${relative}`]),
          Buffer.from("LP EOL fixture\n"),
        );
      }
      assert.deepEqual(
        await readFile(path.join(root, archivePath, "retained.txt")),
        Buffer.from("retained source\r\n"),
      );
      assert.deepEqual(
        await gitBytes(root, ["show", `HEAD:${archivePath}/retained.txt`]),
        Buffer.from("retained source\n"),
      );
      await mkdir(evidence, { recursive: true });
      await cp(
        path.join(root, ".flowkit/artifacts"),
        path.join(evidence, "artifacts"),
        { recursive: true },
      );
      await cp(
        path.join(root, ".flowkit/runs"),
        path.join(evidence, "synthetic-runs"),
        { recursive: true },
      );
      await writeFile(
        path.join(evidence, "outcome.json"),
        JSON.stringify(
          {
            platform: process.platform,
            node: process.version,
            failed,
            archived,
            checkpoint,
            completions,
            review: "synthetic role fixture, no independent Review",
            delivery: "completion consumer only, no Delivery Full Test/Final",
          },
          null,
          2,
        ) + "\n",
      );
    } finally {
      await f.cleanup();
    }
  },
);
