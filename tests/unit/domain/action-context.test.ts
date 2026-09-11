import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { resolveActionContext } from "../../../src/cli/action-context.js";
import { ActionContextError } from "../../../src/cli/current-run-chain.js";
import { contextFixture } from "./action-context-fixture.js";

test("context selects unique active and distinguishes idle/planned/cancelled", async () => {
  const fixture = await contextFixture();
  try {
    const active = await resolveActionContext(fixture, fixture.installation);
    assert.equal(active.status, "current");
    assert.equal(active.selected?.changeId, "change-one");
    assert.equal(active.selected?.history.current, null);
    for (const [state, expected] of [
      ["planned", "waiting-owner"],
      ["cancelled", "cancelled"],
    ]) {
      await fixture.manifest("delivery-one", "change-one", state);
      assert.equal(
        (await resolveActionContext(fixture, fixture.installation)).status,
        "idle",
      );
      assert.equal(
        (
          await resolveActionContext(
            { ...fixture, changeId: "change-one" },
            fixture.installation,
          )
        ).status,
        expected,
      );
    }
    await fixture.observe([]);
    await fixture.manifest();
    assert.equal(
      (await resolveActionContext(fixture, fixture.installation)).status,
      "current",
      "first activated Explore needs no scaffold",
    );
  } finally {
    await fixture.cleanup();
  }
});

test("context reports candidates and explicit selection never fills missing facts", async () => {
  const fixture = await contextFixture();
  try {
    await fixture.manifest("delivery-two", "change-two");
    await fixture.observe(["change-one", "change-two"]);
    await assert.rejects(
      resolveActionContext(fixture, fixture.installation),
      (error: unknown) =>
        error instanceof ActionContextError &&
        error.kind === "context-ambiguous" &&
        error.candidates.length === 2,
    );
    assert.equal(
      (
        await resolveActionContext(
          { ...fixture, changeId: "change-two" },
          fixture.installation,
        )
      ).selected?.deliveryId,
      "delivery-two",
    );
    await assert.rejects(
      resolveActionContext(
        { ...fixture, deliveryId: "missing" },
        fixture.installation,
      ),
      /cannot be read/,
    );
    await assert.rejects(
      resolveActionContext(
        { ...fixture, changeId: "missing" },
        fixture.installation,
      ),
      /Selected Change not found/,
    );
  } finally {
    await fixture.cleanup();
  }
});

test("context rejects root mismatch, orphan, activation/dependency and partial history", async () => {
  const fixture = await contextFixture();
  try {
    await fixture.observe(["change-one"], fixture.root);
    await assert.rejects(
      resolveActionContext(fixture, fixture.installation),
      /different from the requested root/,
    );
    await fixture.observe(["orphan"]);
    await assert.rejects(
      resolveActionContext(fixture, fixture.installation),
      /no coordination/,
    );
    await fixture.observe(["change-one"]);
    await fixture.manifest("delivery-one", "change-one", "active", false);
    await assert.rejects(
      resolveActionContext(fixture, fixture.installation),
      /activation provenance/,
    );
    await fixture.manifest("delivery-one", "change-one", "active", true, [
      "missing",
    ]);
    await assert.rejects(
      resolveActionContext(fixture, fixture.installation),
      /dependency/,
    );
    await fixture.manifest();
    await mkdir(
      path.join(
        fixture.repositoryRoot,
        ".flowkit",
        "runs",
        "delivery-one",
        "001-change-one",
        "20260908-001-explore",
      ),
      { recursive: true },
    );
    await assert.rejects(
      resolveActionContext(fixture, fixture.installation),
      /Incomplete Run/,
    );
    await rm(
      path.join(
        fixture.repositoryRoot,
        "openspec",
        "delivery-groups",
        "delivery-one.yaml",
      ),
    );
    await assert.rejects(
      resolveActionContext(fixture, fixture.installation),
      /no coordination/,
    );
  } finally {
    await fixture.cleanup();
  }
});
