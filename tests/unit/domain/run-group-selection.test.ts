import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readSelectedRunChain } from "../../../src/cli/current-run-chain.js";
import { writeDurableRun } from "../../../src/domain/index.js";
import { inputs } from "./agent-how-fixture.js";

test("exact Change group selection ignores overlapping canonical and bootstrap suffixes", async () => {
  const repositoryRoot = await mkdtemp(
    path.join(os.tmpdir(), "flowkit-groups-"),
  );
  const input = {
    repositoryRoot,
    deliveryId: "delivery-one",
    changeId: "feature",
  };
  try {
    const put = async (changeId: string) => {
      const f = inputs(repositoryRoot);
      const actionIdentity = { ...f.context.actionIdentity, changeId };
      await writeDurableRun(
        { ...f.input, changeId },
        {
          actionMarkdown: "# Synthetic group fixture\n",
          context: { ...f.context, actionIdentity, lifecycleState: "terminal" },
          result: { ...f.result, actionIdentity },
        },
      );
    };
    await put("improve-feature");
    assert.equal((await readSelectedRunChain(input)).current, null);
    await mkdir(
      path.join(
        repositoryRoot,
        ".flowkit",
        "runs",
        "delivery-one",
        "another-feature",
      ),
    );
    assert.equal((await readSelectedRunChain(input)).current, null);
    await put("feature");
    const selected = await readSelectedRunChain(input);
    assert.equal(selected.current?.context.actionIdentity.changeId, "feature");
    assert.equal(
      (await readSelectedRunChain({ ...input, changeId: "improve-feature" }))
        .current?.context.actionIdentity.changeId,
      "improve-feature",
    );
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("exact selected malformed, duplicate and mixed groups are still diagnosed", async () => {
  for (const names of [
    ["000-feature"],
    ["01-feature"],
    ["1000000-feature"],
    ["001-feature", "002-feature"],
    ["feature", "001-feature"],
  ]) {
    const repositoryRoot = await mkdtemp(
      path.join(os.tmpdir(), "flowkit-groups-"),
    );
    try {
      for (const name of names)
        await mkdir(
          path.join(repositoryRoot, ".flowkit", "runs", "delivery-one", name),
          { recursive: true },
        );
      await assert.rejects(
        readSelectedRunChain({
          repositoryRoot,
          deliveryId: "delivery-one",
          changeId: "feature",
        }),
        names.length === 1 ? /Invalid Run group prefix/ : /Multiple Run groups/,
      );
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  }
});
