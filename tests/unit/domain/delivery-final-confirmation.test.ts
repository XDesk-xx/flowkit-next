import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs, { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test, { mock } from "node:test";
import { promisify } from "node:util";
import { invokeDeliveryFinalOperation } from "../../../src/domain/delivery-final-execution.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";
import {
  acceptedOutcomes,
  cleanup,
  createFixture,
  deliveryId,
  evidenceSource,
  finalInput,
  git,
} from "./delivery-final-fixture.js";

const exec = promisify(execFile);
async function freshProcess(root: string, base: string) {
  const moduleUrl = new URL("../../../src/domain/index.ts", import.meta.url)
    .href;
  const installUrl = new URL(
    "./manager-installation-fixture.ts",
    import.meta.url,
  ).href;
  const script = `
    import { readDeliveryFinalization, prepareDeliveryRepositoryIntegrationOperationPackage,
      invokeDeliveryRepositoryIntegrationOperation } from ${JSON.stringify(moduleUrl)};
    import { fixtureInstallation } from ${JSON.stringify(installUrl)};
    const root = ${JSON.stringify(root)}, deliveryId = ${JSON.stringify(deliveryId)}, base = ${JSON.stringify(base)};
    const ownerAuthority = { ref: "owner:" + "d".repeat(64), decision: "authorize-repository-integration",
      deliveryId, sourceRef: "test:independent-integration-owner", scope: ["delivery-repository-integration"] };
    const input = { deliveryId, ownerAuthority, deliveryBranch: "delivery/test", targetMainRef: "refs/heads/main",
      acceptedBaseCommit: base, checkpointOperation: { kind: "create-new", paths: ["product.txt"], commitMessage: "checkpoint", commitShape: null } };
    // Explicit test host source, not an independent real repository authorization.
    const source = { readAuthorization: () => ({ sourceRef: "test:accepted-owner", ownerAuthorityRef: ownerAuthority.ref,
      ownerAuthoritySourceRef: ownerAuthority.sourceRef, deliveryId, deliveryBranch: input.deliveryBranch,
      targetMainRef: input.targetMainRef, targetMainPreIntegrationCommit: base, preIntegrationHead: base,
      acceptedBaseCommit: base, checkpointOperation: input.checkpointOperation, reuseCheckpointSourceRef: null }),
      readAcceptance: () => { throw new Error("not requested"); } };
    const observed = await readDeliveryFinalization(root, deliveryId);
    const prepared = await prepareDeliveryRepositoryIntegrationOperationPackage(root, input, source, fixtureInstallation(root));
    let callbacks = 0;
    if (observed.status !== "completed") await invokeDeliveryRepositoryIntegrationOperation(root, input,
      () => { callbacks++; return { status: "committed" }; },
      () => { callbacks++; return { status: "repository-acceptance-complete" }; }, source, fixtureInstallation(root));
    console.log(JSON.stringify({ observed, prepared: prepared !== null, callbacks }));
  `;
  const result = await exec(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "--eval", script],
    { windowsHide: true, cwd: process.cwd() },
  );
  return JSON.parse(result.stdout) as {
    observed: { status: string; record: unknown };
    prepared: boolean;
    callbacks: number;
  };
}

test("Final confirmation commit point survives fresh sessions without promoting pre-confirmation failures", async (t) => {
  for (const mode of [
    "success",
    "first-readback",
    "input-drift",
    "related-run-drift",
    "before-confirmation",
    "pre-publication-input-drift",
    "publish-failure",
    "published-response-loss",
    "before-active",
    "after-active",
    "staged-active",
    "after-unavailable",
    "staged-unavailable",
    "published-active",
  ] as const) {
    await t.test(mode, async () => {
      const f = await createFixture();
      try {
        await git(f.root, "branch", "-M", "delivery/test");
        await git(f.root, "branch", "main");
        const base = await git(f.root, "rev-parse", "HEAD");
        await mkdir(
          path.join(f.root, "skills/delivery/repository-integration"),
          { recursive: true },
        );
        await writeFile(
          path.join(f.root, "skills/delivery/repository-integration/SKILL.md"),
          "# Integration\n",
        );
        const changeRoot = path.join(f.root, "openspec/changes");
        await mkdir(changeRoot, { recursive: true });
        // Synthetic managed-tool process observes actual fixture directories.
        await writeFile(
          f.openspecEntrypoint,
          `const fs=require("node:fs"); console.log(JSON.stringify({changes:fs.readdirSync(${JSON.stringify(changeRoot)},{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name!=="archive").map(x=>({name:x.name})),root:{path:${JSON.stringify(f.root)},source:"nearest"}}));\n`,
        );
        const addActive = async () => {
          await mkdir(path.join(changeRoot, "late-change"));
          await writeFile(
            path.join(changeRoot, "late-change/proposal.md"),
            "## Why\nFixture active work\n",
          );
        };
        const unavailable = () =>
          writeFile(f.openspecEntrypoint, "process.exit(9);\n");
        const outcomes = await acceptedOutcomes(f);
        if (mode === "before-active") await addActive();
        const source = evidenceSource(outcomes, f.root);
        const originalRename = fs.rename.bind(fs);
        const originalRead = fs.readFile.bind(fs);
        const originalOpen = fs.open.bind(fs);
        let renames = 0;
        let stages = 0;
        mock.method(fs, "open", async (...args: Parameters<typeof fs.open>) => {
          if (
            String(args[0]).includes(path.basename(f.manifestPath)) &&
            String(args[0]).endsWith(".tmp")
          ) {
            stages++;
            if (stages === 2 && mode === "staged-active") await addActive();
            if (stages === 2 && mode === "staged-unavailable")
              await unavailable();
            if (stages === 2 && mode === "before-confirmation")
              throw new Error("interrupted before confirmation");
            if (stages === 2 && mode === "pre-publication-input-drift") {
              await writeFile(
                path.join(f.root, "source.txt"),
                "drift during confirmation staging\n",
              );
            }
          }
          return originalOpen(...args);
        });
        mock.method(
          fs,
          "rename",
          async (...args: Parameters<typeof fs.rename>) => {
            if (String(args[1]) !== f.manifestPath)
              return originalRename(...args);
            renames++;
            if (renames === 2 && mode === "publish-failure")
              throw new Error("replace outcome unknown");
            await originalRename(...args);
            if (renames === 1 && mode === "after-active") await addActive();
            if (renames === 1 && mode === "after-unavailable")
              await unavailable();
            if (renames === 2 && mode === "published-active") await addActive();
            if (renames === 1 && mode === "input-drift")
              await writeFile(
                path.join(f.root, "source.txt"),
                "after write drift\n",
              );
            if (renames === 1 && mode === "related-run-drift") {
              const selected = await source.readChangeClosure({
                projectId: "flowkit-next",
                deliveryId,
                changeId: "first-change",
              });
              await writeFile(
                path.join(f.root, selected.archive.artifacts[2].artifact),
                "{}\n",
              );
            }
          },
        );
        mock.method(
          fs,
          "readFile",
          async (...args: Parameters<typeof fs.readFile>) => {
            if (
              String(args[0]) === f.manifestPath &&
              ((renames === 1 && mode === "first-readback") ||
                (renames === 2 && mode === "published-response-loss"))
            ) {
              throw new Error("readback unavailable");
            }
            return originalRead(...args);
          },
        );
        const result = await invokeDeliveryFinalOperation(
          f.root,
          finalInput(f, outcomes),
          () => ({ status: "ready" }),
          source,
          fixtureInstallation(f.root),
        );
        mock.restoreAll();
        const bytes = await readFile(f.manifestPath, "utf8");
        const fresh = await freshProcess(f.root, base);
        if (mode === "before-active") {
          assert.equal(result.status, "failed");
          assert.equal(renames, 0);
          assert.equal(fresh.observed.status, "not-completed");
          assert.equal(fresh.prepared, false);
          assert.equal(fresh.callbacks, 0);
          return;
        }
        const committed =
          mode === "success" ||
          mode === "published-response-loss" ||
          mode === "published-active";
        assert.equal(
          fresh.observed.status,
          committed ? "completed" : "unconfirmed",
        );
        assert.equal(fresh.prepared, committed);
        assert.equal(fresh.callbacks, 0);
        assert.equal(await readFile(f.manifestPath, "utf8"), bytes);
        assert.doesNotMatch(
          bytes,
          /requiredEvidence|changeCompletions|finalizedCandidateRef|gitCheckpoint|formalVerificationCandidate/,
        );
        if (mode === "success" || mode === "published-active") {
          assert.equal(result.status, "terminal");
          if (result.status === "terminal")
            assert.deepEqual(fresh.observed.record, result.record);
          await writeFile(
            path.join(f.root, "unrelated.md"),
            "append without product change\n",
          );
          assert.deepEqual(
            (await freshProcess(f.root, base)).observed,
            fresh.observed,
          );
        } else {
          assert.equal(result.status, "failed");
          if (result.status === "failed") {
            if (
              [
                "after-active",
                "after-unavailable",
                "staged-active",
                "staged-unavailable",
              ].includes(mode)
            ) {
              assert.equal(renames, 1);
              assert.equal(
                result.reason,
                mode.startsWith("after-")
                  ? "content-validation-failed"
                  : "confirmation-publication-failed",
              );
            }
            assert.equal(result.record, null);
            assert.equal(
              result.mutationStatus,
              mode === "publish-failure" ? "unknown" : "written-unconfirmed",
            );
            if (mode === "published-response-loss")
              assert.equal(result.reason, "confirmation-readback-failed");
          }
          assert.match(
            bytes,
            committed
              ? /confirmationRef: "delivery-finalization:/
              : /confirmationRef: null/,
          );
        }
      } finally {
        mock.restoreAll();
        await cleanup(f);
      }
    });
  }
});
