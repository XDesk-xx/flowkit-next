import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as domain from "../../../src/domain/index.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";
import { readSelectedRunChain } from "../../../src/cli/current-run-chain.js";
import { inputs, loadHow } from "./agent-how-fixture.js";

test("published ten HOW assets have executable identical record examples, no transport", async () => {
  for (const action of [
    "explore",
    "propose",
    "apply",
    "archive",
    "revise-explore",
    "revise-propose",
    "revise-apply",
    "review-explore",
    "review-propose",
    "review-apply",
  ]) {
    const how = await loadHow(action);
    assert.equal(typeof how.startRecord, "function");
    assert.equal(typeof how.finishRecord, "function");
    const markdown = await readFile(
      `skills/actions/${action}/SKILL.md`,
      "utf8",
    );
    assert.doesNotMatch(
      markdown,
      /flowkit action --input|kind:"prepare"|stdin\/stdout JSONL/,
    );
    assert.match(markdown, /Reviewer 必须独立/);
    assert.match(markdown, /STOP/);
  }
});

test("synthetic HOW sequence preserves start, partial and create-once completion", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-how-"));
  try {
    const how = await loadHow();
    const f = inputs(root);
    const guidance = (await domain.resolveActionGuidanceRef(
      loadManagerInstallation(),
      "explore",
    ))!;
    assert.ok(guidance);
    await assert.rejects(
      how.startRecord(domain, f.input, f.current, f.context, guidance, false),
      /preparation blocked/,
    );
    assert.deepEqual(await readdir(root), []); // no business work and no empty proof
    await assert.rejects(
      how.startRecord(
        domain,
        f.input,
        f.current,
        { ...f.context, role: "reviewer" },
        guidance,
        true,
      ),
      /invalid package/,
    );
    const held = await how.startRecord(
      domain,
      f.input,
      f.current,
      f.context,
      guidance,
      true,
    );
    assert.deepEqual(await readdir(held.directory), ["action.md"]);
    await assert.rejects(domain.readDurableRun(f.input), /Incomplete Run/);
    await assert.rejects(
      how.startRecord(domain, f.input, f.current, f.context, guidance, true),
      /sequence already/,
    );
    await assert.rejects(
      how.finishRecord(
        domain,
        held,
        { ...f.result, reviewerVerdict: "approved" },
        true,
      ),
      /admission rejected/,
    );
    await assert.rejects(
      how.finishRecord(domain, held, f.result, false),
      /unchecked/,
    );
    assert.equal(
      await readFile(path.join(held.directory, "action.md"), "utf8"),
      held.actionMarkdown,
    );
    const saved = await how.finishRecord(domain, held, f.result, true);
    assert.equal(saved.context.lifecycleState, "terminal");
    await assert.rejects(
      how.finishRecord(domain, held, f.result, true),
      /already completed/,
    );
    assert.deepEqual(await domain.readDurableRun(f.input), saved);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("synthetic HOW distinguishes prepared failure, business FAIL and failed partial save", async () => {
  for (const mode of ["prepared", "fail", "partial"]) {
    const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-how-"));
    try {
      const how = await loadHow();
      const f = inputs(root);
      const guidance = (await domain.resolveActionGuidanceRef(
        loadManagerInstallation(),
        "explore",
      ))!;
      const held = await how.startRecord(
        domain,
        f.input,
        f.current,
        f.context,
        guidance,
        true,
      );
      if (mode === "partial") {
        await writeFile(path.join(held.directory, "context.json"), "{", {
          flag: "wx",
        });
        await assert.rejects(
          how.finishRecord(domain, held, f.result, true),
          /partial save/,
        );
        assert.equal(
          await readFile(path.join(held.directory, "context.json"), "utf8"),
          "{",
        );
        await assert.rejects(domain.readDurableRun(f.input), /Incomplete Run/);
      } else {
        const result = {
          ...f.result,
          authorConclusion: mode === "fail" ? "FAIL" : null,
          nextBoundary: null,
          facts: { synthetic: true, reason: "injected failure" },
        };
        const saved = await how.finishRecord(
          domain,
          held,
          result,
          true,
          mode === "fail",
        );
        assert.equal(
          saved.context.lifecycleState,
          mode === "fail" ? "terminal" : "prepared",
        );
        const chain = await readSelectedRunChain({
          repositoryRoot: root,
          deliveryId: "delivery-one",
          changeId: "change-one",
        });
        assert.ok(chain);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});
