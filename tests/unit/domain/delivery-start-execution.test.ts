import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
  rename,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { stringify } from "yaml";
import {
  invokeDeliveryStartOperation,
  prepareDeliveryStartOperationPackage,
  type DeliveryStartPreparationInput,
} from "../../../src/domain/index.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";
import { git } from "./delivery-final-fixture.js";

export async function startFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-start-unborn-"));
  await git(root, "init", "-q");
  await mkdir(path.join(root, ".flowkit"));
  await mkdir(path.join(root, "openspec/delivery-groups"), { recursive: true });
  await mkdir(path.join(root, "skills/delivery/start"), { recursive: true });
  await writeFile(
    path.join(root, "skills/delivery/start/SKILL.md"),
    "# Start\n",
  );
  await writeFile(
    path.join(root, ".flowkit/project.json"),
    '{"projectId":"start-project"}\n',
  );
  await writeFile(path.join(root, "plan.md"), "# Owner plan\n");
  await writeFile(path.join(root, "unrelated.txt"), "preserve dirty bytes\n");
  const input: DeliveryStartPreparationInput = {
    deliveryId: "new-delivery",
    ownerAuthority: {
      ref: "owner:" + "a".repeat(64),
      decision: "create-delivery",
      deliveryId: "new-delivery",
      sourceRef: "owner-input:start",
      scope: ["delivery-start", "single-delivery-start-fixed-point-commit"],
    },
    planningReference: {
      artifact: "plan.md",
      contentSha256: createHash("sha256")
        .update("# Owner plan\n")
        .digest("hex"),
    },
  };
  const content = Buffer.from(
    stringify({
      id: input.deliveryId,
      projectId: "start-project",
      planningReference: input.planningReference,
      delivery: {
        state: "active",
        fullTestStatus: "pending",
        finalizationStatus: "pending",
      },
      changes: [{ id: "first-change", required: true, state: "planned" }],
    }),
  );
  return {
    root,
    input,
    content,
    target: path.join(root, "openspec/delivery-groups/new-delivery.yaml"),
    installation: fixtureInstallation(root),
  };
}
test("unborn repository and unrelated dirty bytes complete Start without Git or receipt callbacks", async () => {
  const f = await startFixture();
  try {
    await assert.rejects(git(f.root, "rev-parse", "--verify", "HEAD"));
    const before = await git(f.root, "status", "--porcelain");
    const prepared = await prepareDeliveryStartOperationPackage(
      f.root,
      f.input,
      f.installation,
    );
    assert.equal(
      prepared?.operationFacts.coordinationPrestate.contentRef,
      null,
    );
    const result = await invokeDeliveryStartOperation(
      f.root,
      f.input,
      async ({ writeManifest, guidance, operationPackage }) => {
        assert.match(guidance.toString(), /Start/);
        assert.equal(
          Object.hasOwn(operationPackage.operationFacts, "acceptedBaseCommit"),
          false,
        );
        await writeManifest(f.content);
        return { status: "ready" };
      },
      f.installation,
    );
    assert.equal(result.status, "terminal");
    if (result.status !== "terminal") throw new Error("Start failed");
    assert.deepEqual(Object.keys(result), [
      "status",
      "operationPackage",
      "contentCompletion",
    ]);
    assert.deepEqual(Object.keys(result.contentCompletion), [
      "projectId",
      "deliveryId",
      "planningReference",
      "coordinationRef",
    ]);
    assert.deepEqual(await readFile(f.target), f.content);
    assert.equal(
      await readFile(path.join(f.root, "unrelated.txt"), "utf8"),
      "preserve dirty bytes\n",
    );
    await assert.rejects(git(f.root, "rev-parse", "--verify", "HEAD"));
    assert.match(await git(f.root, "status", "--porcelain"), /unrelated.txt/);
    assert.ok(before.includes("unrelated.txt"));
    const reused = await invokeDeliveryStartOperation(
      f.root,
      f.input,
      () => {
        throw new Error("must not rerun");
      },
      f.installation,
    );
    assert.equal(reused.status, "terminal");
    if (reused.status === "terminal")
      assert.deepEqual(reused.contentCompletion, result.contentCompletion);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
test("Start rejects obsolete inputs, wrong scope, missing or changed plan, conflicting and ambiguous target", async () => {
  const f = await startFixture();
  try {
    const prepare = (input: unknown) =>
      prepareDeliveryStartOperationPackage(f.root, input, f.installation);
    for (const input of [
      { ...f.input, operationFacts: { acceptedBaseCommit: "a".repeat(40) } },
      {
        ...f.input,
        ownerAuthority: { ...f.input.ownerAuthority, changeId: "wrong" },
      },
      {
        ...f.input,
        ownerAuthority: { ...f.input.ownerAuthority, deliveryId: "wrong" },
      },
      {
        ...f.input,
        ownerAuthority: { ...f.input.ownerAuthority, scope: ["git"] },
      },
      {
        ...f.input,
        planningReference: {
          ...f.input.planningReference,
          artifact: "../outside.md",
        },
      },
      {
        ...f.input,
        planningReference: {
          ...f.input.planningReference,
          artifact: "missing.md",
        },
      },
    ])
      assert.equal(await prepare(input), null);
    await writeFile(path.join(f.root, "plan.md"), "changed\n");
    assert.equal(await prepare(f.input), null);
    await writeFile(path.join(f.root, "plan.md"), "# Owner plan\n");
    await writeFile(f.target, "id: conflicting\n");
    assert.equal(await prepare(f.input), null);
    await rm(f.target);
    await writeFile(
      path.join(f.root, "openspec/delivery-groups/other.yaml"),
      "id: other\ndelivery:\n  state: active\n",
    );
    assert.equal(await prepare(f.input), null);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
test("Start rejects wrong project, redirected parent and concurrent target without overwriting", async () => {
  const f = await startFixture();
  try {
    await writeFile(
      f.target,
      f.content
        .toString()
        .replace("projectId: start-project", "projectId: other-project"),
    );
    const wrong = await readFile(f.target);
    assert.equal(
      await prepareDeliveryStartOperationPackage(
        f.root,
        f.input,
        f.installation,
      ),
      null,
    );
    assert.deepEqual(await readFile(f.target), wrong);
    await rm(f.target);
    const parent = path.dirname(f.target);
    const redirected = path.join(f.root, "redirected");
    await rename(parent, redirected);
    await symlink(
      redirected,
      parent,
      process.platform === "win32" ? "junction" : "dir",
    );
    assert.equal(
      await prepareDeliveryStartOperationPackage(
        f.root,
        f.input,
        f.installation,
      ),
      null,
    );
    await rm(parent);
    await rename(redirected, parent);
    const competing = Buffer.from("id: someone-else\n");
    const outcome = await invokeDeliveryStartOperation(
      f.root,
      f.input,
      async ({ writeManifest }) => {
        await writeFile(f.target, competing);
        await writeManifest(f.content);
        return { status: "ready" };
      },
      f.installation,
    );
    assert.equal(outcome.status, "failed");
    assert.deepEqual(await readFile(f.target), competing);
    assert.equal(
      await readFile(path.join(f.root, "unrelated.txt"), "utf8"),
      "preserve dirty bytes\n",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("Start refuses a different valid manifest after its own write without repairing concurrent bytes", async () => {
  const f = await startFixture();
  try {
    const other = Buffer.from(
      f.content.toString().replace("first-change", "other-change"),
    );
    const outcome = await invokeDeliveryStartOperation(
      f.root,
      f.input,
      async ({ writeManifest }) => {
        await writeManifest(f.content);
        await writeFile(f.target, other);
        return { status: "ready" };
      },
      f.installation,
    );
    assert.equal(outcome.status, "failed");
    if (outcome.status === "failed")
      assert.equal(outcome.mutationStatus, "written-unconfirmed");
    assert.deepEqual(await readFile(f.target), other);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("Start rechecks plan before create, refuses validated-only and reports write-then-throw truth", async () => {
  const f = await startFixture();
  try {
    let outcome = await invokeDeliveryStartOperation(
      f.root,
      f.input,
      () => ({ status: "validated" }),
      f.installation,
    );
    assert.equal(outcome.status, "failed");
    if (outcome.status === "failed")
      assert.equal(outcome.mutationStatus, "not-written");
    outcome = await invokeDeliveryStartOperation(
      f.root,
      f.input,
      async ({ writeManifest }) => {
        await writeFile(path.join(f.root, "plan.md"), "drift\n");
        await writeManifest(f.content);
        return { status: "ready" };
      },
      f.installation,
    );
    assert.equal(outcome.status, "failed");
    await assert.rejects(readFile(f.target), { code: "ENOENT" });
    await writeFile(path.join(f.root, "plan.md"), "# Owner plan\n");
    outcome = await invokeDeliveryStartOperation(
      f.root,
      f.input,
      async ({ writeManifest }) => {
        await writeManifest(f.content);
        throw new Error("lost response");
      },
      f.installation,
    );
    assert.equal(outcome.status, "failed");
    if (outcome.status === "failed")
      assert.equal(outcome.mutationStatus, "written-unconfirmed");
    assert.deepEqual(await readFile(f.target), f.content);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
