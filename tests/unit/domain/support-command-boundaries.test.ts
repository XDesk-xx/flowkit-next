import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parse } from "yaml";
import {
  parseSupportArguments,
  parseSupportRequest,
  SUPPORT_COMMANDS,
} from "../../../src/cli/support-request.js";
import { writeChangeState } from "../../../src/internal/change-coordination-write.js";
import { executeMemoCommand } from "../../../src/cli/support-memo.js";
import { openSpecArchiveDate } from "../../../src/internal/openspec-archive-date.js";
import { startDelivery } from "../../../src/cli/support-delivery-start.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";

const root = path.join(tmpdir(), "flowkit-visible-target");
const deliveryId = "delivery-07";
const changeId = "change-b";
const owner = {
  ref: `owner:${"a".repeat(64)}`,
  decision: "activate-change",
  deliveryId,
  changeId,
  sourceRef: "codex:owner-message-1",
  scope: ["explore"],
};

test("archive date follows the host calendar across a UTC date boundary", () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = "Asia/Shanghai";
    assert.equal(
      openSpecArchiveDate(new Date("2026-09-30T17:00:00Z")),
      "2026-10-01",
    );
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("each fixed support command parses its exact visible prefix", () => {
  for (const command of SUPPORT_COMMANDS) {
    const words = command.split(" ");
    const args = [...words, "--input", "-", "--repository-root", root];
    if (
      command.startsWith("delivery ") ||
      command.startsWith("change ") ||
      command.startsWith("git ")
    )
      args.push("--delivery-id", deliveryId);
    if (command.startsWith("change ")) args.push("--change-id", changeId);
    assert.equal(parseSupportArguments(args).command, command);
  }
  assert.throws(() =>
    parseSupportArguments(["delivery", "unknown", "--input", "-"]),
  );
  assert.throws(() => parseSupportArguments(["memo", "list", "--input", "-"]));
});

test("support parser rejects target conflict, executable fields, and missing Owner fact", () => {
  const visible = { repositoryRoot: root, deliveryId, changeId };
  const request = {
    repositoryRoot: root,
    flowkitHome: root,
    deliveryId,
    changeId,
    ownerAuthority: owner,
  };
  assert.equal(
    parseSupportRequest("change activate", request, visible).changeId,
    changeId,
  );
  assert.throws(() =>
    parseSupportRequest(
      "change activate",
      { ...request, repositoryRoot: tmpdir() },
      visible,
    ),
  );
  assert.throws(() =>
    parseSupportRequest(
      "change activate",
      { ...request, callback: "run" },
      visible,
    ),
  );
  assert.throws(() =>
    parseSupportRequest(
      "change activate",
      { ...request, ownerAuthority: undefined },
      visible,
    ),
  );
});

test("activation patches one state and appends the exact Owner fact", async () => {
  const temp = await mkdtemp(path.join(tmpdir(), "flowkit-change-patch-"));
  const group = path.join(temp, "openspec", "delivery-groups");
  await mkdir(group, { recursive: true });
  const target = path.join(group, `${deliveryId}.yaml`);
  const before = `id: ${deliveryId}\nchanges:\n  - id: ${changeId}\n    state: planned\nownerDecisions:\n  - ref: owner:${"b".repeat(64)}\n    decision: create-delivery\n    deliveryId: ${deliveryId}\n    sourceRef: codex:owner-message-0\n    scope:\n      - delivery-start\n`;
  await writeFile(target, before);
  await writeChangeState(
    temp,
    deliveryId,
    changeId,
    "planned",
    "active",
    owner,
  );
  const after = await readFile(target, "utf8");
  const parsed = parse(after) as {
    changes: Array<{ state: string }>;
    ownerDecisions: Array<{ ref: string }>;
  };
  assert.equal(parsed.changes[0].state, "active");
  assert.equal(parsed.ownerDecisions.length, 2);
  assert.equal(parsed.ownerDecisions[1].ref, owner.ref);
  assert.equal(
    after
      .replace("state: active", "state: planned")
      .replace(/ {2}- ref: owner:aaaaaaaa[\s\S]*$/, ""),
    before,
  );
  await assert.rejects(
    writeChangeState(temp, deliveryId, changeId, "planned", "active", owner),
  );
});

test("Memo write checks Owner scope before changing project Memo state", async () => {
  const temp = await mkdtemp(path.join(tmpdir(), "flowkit-support-memo-"));
  const memo = {
    memoId: "future-item",
    title: "Future",
    note: "Consider later",
    source: { deliveryId },
  };
  const base = {
    repositoryRoot: temp,
    memo,
    ownerAuthority: {
      ref: owner.ref,
      deliveryId,
      sourceRef: owner.sourceRef,
      decision: "create-memo",
      scope: ["wrong-item"],
    },
  };
  const rejected = await executeMemoCommand("memo create", base);
  assert.equal(rejected.status, "incomplete");
  assert.equal(rejected.effect, "none");
  const accepted = await executeMemoCommand("memo create", {
    ...base,
    ownerAuthority: { ...base.ownerAuthority, scope: [memo.memoId] },
  });
  assert.equal(accepted.status, "completed");
  const listed = await executeMemoCommand("memo list", {
    repositoryRoot: temp,
  });
  assert.ok(Array.isArray(listed.memos));
  assert.equal(listed.memos.length, 1);
  const repeated = await executeMemoCommand("memo create", {
    ...base,
    ownerAuthority: { ...base.ownerAuthority, scope: [memo.memoId] },
  });
  assert.equal(repeated.status, "incomplete");
  assert.equal(repeated.effect, "none");
});

test("Delivery Start reuses identical bytes and rejects conflicting plan content", async () => {
  const temp = await mkdtemp(path.join(tmpdir(), "flowkit-start-conflict-"));
  for (const directory of [
    ".flowkit",
    "docs",
    "openspec/delivery-groups",
    "skills/delivery/start",
  ])
    await mkdir(path.join(temp, directory), { recursive: true });
  await writeFile(
    path.join(temp, ".flowkit/project.json"),
    '{"projectId":"start-project"}\n',
  );
  await writeFile(path.join(temp, "docs/plan.md"), "# Plan\n");
  await writeFile(
    path.join(temp, "skills/delivery/start/SKILL.md"),
    "# Start\n",
  );
  const authority = {
    ref: `owner:${"c".repeat(64)}`,
    decision: "create-delivery",
    deliveryId,
    sourceRef: "test:owner-start",
    scope: ["delivery-start"],
  };
  const request = {
    repositoryRoot: temp,
    deliveryId,
    ownerAuthority: authority,
    planningReference: { artifact: "docs/plan.md" },
    manifest: {
      createdAt: "2026-10-01",
      branch: "delivery/test-start",
      base: "main",
      goal: "first goal",
      changes: [
        { id: changeId, goal: "first change", required: true, dependsOn: [] },
      ],
    },
  };
  const installation = fixtureInstallation(temp);
  assert.equal(
    (await startDelivery(request, installation)).status,
    "completed",
  );
  const target = path.join(temp, `openspec/delivery-groups/${deliveryId}.yaml`);
  const first = await readFile(target);
  assert.equal(
    (await startDelivery(request, installation)).status,
    "completed",
  );
  for (const manifest of [
    { ...request.manifest, goal: "different goal" },
    {
      ...request.manifest,
      changes: [
        {
          id: "different-change",
          goal: "different change",
          required: true,
          dependsOn: [],
        },
      ],
    },
  ]) {
    const rejected = await startDelivery(
      { ...request, manifest },
      installation,
    );
    assert.equal(rejected.status, "incomplete");
    assert.equal(rejected.reason, "start-manifest-conflict");
    assert.deepEqual(await readFile(target), first);
  }
});
