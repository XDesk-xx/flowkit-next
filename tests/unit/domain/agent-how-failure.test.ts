import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as domain from "../../../src/domain/index.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
import { inputs, loadHow } from "./agent-how-fixture.js";

for (const failedFile of ["action.md", "context.json", "result.json"]) {
  test(`HOW injected ${failedFile} save failure retains actual partial and does not repeat work`, async (t) => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "flowkit-how-failure-"),
    );
    const originalWrite = fs.writeFile;
    let businessWrites = 0;
    try {
      const how = await loadHow();
      const f = inputs(root);
      const guidance = (await domain.resolveActionGuidanceRef(
        loadManagerInstallation(),
        "explore",
      ))!;
      const directory = domain.buildRunAddress(f.input)!.runDirectory;
      t.mock.method(
        fs,
        "writeFile",
        async (...args: Parameters<typeof fs.writeFile>) => {
          if (String(args[0]) === path.join(directory, failedFile))
            throw new Error("injected save failure");
          return originalWrite(...args);
        },
      );
      syncBuiltinESMExports();
      await assert.rejects(async () => {
        const held = await how.startRecord(
          domain,
          f.input,
          f.current,
          f.context,
          guidance,
          true,
        );
        businessWrites += 1; // synthetic work counter, not a real Action claim
        await how.finishRecord(domain, held, f.result, true);
      }, /injected save failure/);
      assert.equal(businessWrites, failedFile === "action.md" ? 0 : 1);
      assert.deepEqual(
        (await fs.readdir(directory)).sort(),
        failedFile === "action.md"
          ? []
          : failedFile === "context.json"
            ? ["action.md"]
            : ["action.md", "context.json"],
      );
      await assert.rejects(domain.readDurableRun(f.input), /Incomplete Run/);
    } finally {
      t.mock.restoreAll();
      syncBuiltinESMExports();
      await fs.rm(root, { recursive: true, force: true });
    }
  });
}
