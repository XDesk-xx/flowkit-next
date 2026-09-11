import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { ROOT } from "./foundation-manager-fixture.js";
import {
  gitBytes,
  readGitPosition,
} from "../../src/internal/git-checkpoint-scope.js";

test("shipped host relocates independently of target assets and import has no Git side effects", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-host-install-"));
  try {
    const manager = path.join(root, "manager relocated");
    const target = path.join(root, "target 项目");
    await mkdir(target);
    for (const entry of ["package.json", "dist", "skills", "config/tools"])
      await cp(path.join(ROOT, entry), path.join(manager, entry), {
        recursive: true,
      });
    await cp(
      path.dirname(
        createRequire(path.join(ROOT, "package.json")).resolve(
          "yaml/package.json",
        ),
      ),
      path.join(manager, "node_modules/yaml"),
      { recursive: true, dereference: true },
    );
    await gitBytes(target, ["init", "-b", "main"]);
    await gitBytes(target, ["config", "user.name", "Test"]);
    await gitBytes(target, ["config", "user.email", "test@example.invalid"]);
    await writeFile(path.join(target, "a.txt"), "target");
    const reference =
      "skills/delivery/repository-integration/references/git-host.mjs";
    await mkdir(path.dirname(path.join(target, reference)), {
      recursive: true,
    });
    await writeFile(
      path.join(target, reference),
      'throw Error("target takeover");\n',
    );
    const before = await readGitPosition(target);
    const host = await import(
      pathToFileURL(path.join(manager, reference)).href
    );
    assert.deepEqual(Object.keys(host).sort(), [
      "runCheckpoint",
      "runIntegration",
      "runPush",
    ]);
    assert.deepEqual(await readGitPosition(target), before);
    const request = {
      targetRoot: target,
      node: "delivery-start",
      deliveryId: "test-delivery",
      changeId: null,
      ownerSourceRef: "test:synthetic-acceptance-owner",
      expectedBranch: "main",
      operation: {
        kind: "create-new",
        paths: ["a.txt"],
        commitMessage: "scoped",
        commitShape: null,
      },
    };
    const result = await host.runCheckpoint(request, async () => ({ request }));
    assert.equal(result.status, "completed", JSON.stringify(result));
    assert.equal(
      result.observed.checkpointCommit,
      (await readGitPosition(target)).head,
    );
    assert.equal(
      await readFile(path.join(target, reference), "utf8"),
      'throw Error("target takeover");\n',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
