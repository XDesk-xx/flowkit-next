import assert from "node:assert/strict";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  rmdir,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { freshFixture } from "./lifecycle-limit-fixture.js";
import { readProjectOrdinal } from "../../../src/cli/project-ordinal.js";
import { sha256 } from "../../../src/cli/run-effective-facts.js";

test("fresh product Explore admits 1 without writing, resumes its proof, and finishes only against persisted ordinal", async () => {
  const f = await freshFixture();
  try {
    const before = await readFile(f.manifestPath);
    assert.equal(await readProjectOrdinal(f.base, true, f.installation), 1);
    await f.call("next", f.base);
    assert.deepEqual(await readFile(f.manifestPath), before);
    const started = await f.call("action start", {
      ...f.base,
      actionId: "explore",
      role: "author",
    });
    assert.deepEqual(await readFile(f.manifestPath), before);
    const inspect = () =>
      f.call("action inspect", { ...f.base, runId: started.runId });
    assert.equal((await inspect()).effect, "observed");
    assert.equal(
      await readProjectOrdinal(f.base, true, f.installation, started.runId),
      1,
    );
    const proof = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${started.runId}/stdout.txt`;
    await mkdir(path.dirname(path.join(f.repositoryRoot, proof)), {
      recursive: true,
    });
    const raw = Buffer.from("raw\r\n");
    await writeFile(path.join(f.repositoryRoot, proof), raw);
    assert.equal((await inspect()).effect, "observed");
    const ref = await f.call("proof inspect", {
      ...f.base,
      runId: started.runId,
      path: proof,
    });
    const note = "openspec/changes/change-one/explore.md";
    await writeFile(
      path.join(f.repositoryRoot, note),
      "# First product Explore\n",
    );
    const finish = {
      ...f.base,
      runId: started.runId,
      terminal: true,
      role: "author",
      result: {
        runId: started.runId,
        actionIdentity: {
          deliveryId: f.base.deliveryId,
          changeId: f.base.changeId,
          actionId: "explore",
        },
        authorConclusion: "PASS",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: "review-explore",
        facts: {
          projectOrdinal: 1,
          exploreArtifact: note,
          exploreSha256: sha256(
            await readFile(path.join(f.repositoryRoot, note)),
          ),
          proofRefs: [
            {
              path: proof,
              bytes: ref.bytes,
              sha256: ref.sha256,
              deliveryId: f.base.deliveryId,
              changeId: f.base.changeId,
              runId: started.runId,
              purpose: "real isolated first Explore proof",
            },
          ],
        },
      },
    };
    assert.equal(
      (await f.call("action finish", finish, false)).error.kind,
      "project-ordinal-invalid",
    );
    assert.deepEqual(await readdir(started.directory), ["action.md"]);
    await f.assign(2);
    assert.equal(
      (await f.call("action finish", finish, false)).error.kind,
      "project-ordinal-drift",
    );
    await f.assign(1);
    assert.equal((await f.call("action finish", finish)).effect, "confirmed");
    assert.deepEqual((await f.call("next", f.base)).decision, {
      kind: "ready-action",
      actionId: "review-explore",
    });
    assert.deepEqual(await readFile(path.join(f.repositoryRoot, proof)), raw);
    assert.equal(await readProjectOrdinal(f.base, true, f.installation), 1);
  } finally {
    await f.cleanup();
  }
});

test("before ordinal allocation a real FAIL remains durable and Owner correction does not waive readiness", async () => {
  const f = await freshFixture();
  try {
    const started = await f.call("action start", {
      ...f.base,
      actionId: "explore",
      role: "author",
    });
    await f.call("action finish", {
      ...f.base,
      runId: started.runId,
      role: "author",
      terminal: true,
      result: {
        runId: started.runId,
        actionIdentity: {
          deliveryId: f.base.deliveryId,
          changeId: f.base.changeId,
          actionId: "explore",
        },
        authorConclusion: "FAIL",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: null,
        facts: { proofRefs: [] },
      },
    });
    assert.equal(
      (await f.call("next", f.base)).decision.reason,
      "unrecognized-or-unsuccessful-author-outcome",
    );
    const failed = await f.call(
      "action start",
      {
        ...f.base,
        actionId: "revise-explore",
        role: "author",
        ownerAuthority: {
          ref: `owner:${"a".repeat(64)}`,
          decision: "revise-action",
          ...{ deliveryId: f.base.deliveryId, changeId: f.base.changeId },
          sourceRef: "synthetic:failed-before-ordinal",
          scope: ["revise-explore"],
        },
      },
      false,
    );
    assert.equal(failed.error.kind, "project-ordinal-invalid");
    assert.equal((await f.getManifest()).changes[0].projectOrdinal, undefined);
    assert.equal((await readdir(path.dirname(started.directory))).length, 1);
    await assert.rejects(readProjectOrdinal(f.base, true, f.installation));
  } finally {
    await f.cleanup();
  }
});

test("assigned ordinals reuse or increment including cancelled consumption; duplicate and overflow reject", async () => {
  const f = await freshFixture();
  try {
    await f.assign(8);
    await mkdir(path.join(f.repositoryRoot, "openspec/changes/archive"));
    await writeFile(
      path.join(f.repositoryRoot, "openspec/changes/archive/history"),
      "old\n",
    );
    assert.equal(await readProjectOrdinal(f.base, true, f.installation), 8);
    const document = await f.getManifest();
    delete document.changes[0].projectOrdinal;
    document.changes.push({
      id: "cancelled-change",
      state: "cancelled",
      dependsOn: [],
      projectOrdinal: 8,
    });
    await writeFile(f.manifestPath, JSON.stringify(document));
    assert.equal(await readProjectOrdinal(f.base, true, f.installation), 9);
    for (const value of [
      0,
      -1,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
      Number.MAX_SAFE_INTEGER,
    ]) {
      document.changes[1].projectOrdinal = value;
      await writeFile(f.manifestPath, JSON.stringify(document));
      await assert.rejects(readProjectOrdinal(f.base, true, f.installation));
    }
    document.changes[1].projectOrdinal = 8;
    document.changes[0].projectOrdinal = 8;
    await writeFile(f.manifestPath, JSON.stringify(document));
    await assert.rejects(readProjectOrdinal(f.base, true, f.installation));
  } finally {
    await f.cleanup();
  }
});

const mutations = {
  "missing project": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    rm(path.join(f.repositoryRoot, ".flowkit/project.json")),
  "old runtime": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    writeFile(
      path.join(f.repositoryRoot, ".flowkit/project.json"),
      JSON.stringify({
        formatVersion: 1,
        projectId: "valid",
        repository: "repo",
        runtimeFamily: "bootstrap",
        state: "initialized",
      }),
    ),
  "untrusted activation": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    f.manifest("delivery-one", "change-one", "active", false),
  "completed entry": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    f.manifest("other-delivery", "old-change", "completed"),
  "cancelled entry": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    f.manifest("other-delivery", "old-change", "cancelled"),
  "other active": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    f.manifest("other-delivery", "other-change", "active"),
  "unknown manifest": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    writeFile(
      path.join(f.repositoryRoot, "openspec/delivery-groups/unknown.txt"),
      "unknown",
    ),
  "malformed manifest": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    writeFile(f.manifestPath, "invalid: ["),
  "competing OpenSpec": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    f.observe(["change-one", "other-change"]),
  "archive entry": async (f: Awaited<ReturnType<typeof freshFixture>>) => {
    await mkdir(path.join(f.repositoryRoot, "openspec/changes/archive"));
    await writeFile(
      path.join(f.repositoryRoot, "openspec/changes/archive/unknown"),
      "history",
    );
  },
  "malformed runs root": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    writeFile(path.join(f.repositoryRoot, ".flowkit/runs"), "unknown"),
  "unknown Run": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    mkdir(
      path.join(
        f.repositoryRoot,
        ".flowkit/runs/delivery-one/001-change-one/unknown",
      ),
      { recursive: true },
    ),
  "orphan proof": async (f: Awaited<ReturnType<typeof freshFixture>>) =>
    mkdir(
      path.join(
        f.repositoryRoot,
        ".flowkit/artifacts/delivery-one/changes/change-one/proof/20261005-001-explore",
      ),
      { recursive: true },
    ),
  "linked archive": async (f: Awaited<ReturnType<typeof freshFixture>>) => {
    const outside = path.join(f.root, "archive");
    await mkdir(outside);
    await symlink(
      outside,
      path.join(f.repositoryRoot, "openspec/changes/archive"),
      "junction",
    );
  },
};
for (const [name, mutate] of Object.entries(mutations))
  test(`fresh ordinal rejects ${name}`, async () => {
    const f = await freshFixture();
    try {
      await mutate(f);
      await assert.rejects(readProjectOrdinal(f.base, true, f.installation));
    } finally {
      await f.cleanup();
    }
  });

test("planned-only entries, empty intermediates, Memo and Delivery Full Test are not consumed ordinals", async () => {
  const f = await freshFixture();
  try {
    await f.manifest("other-delivery", "planned-change", "planned", false);
    await mkdir(
      path.join(
        f.repositoryRoot,
        ".flowkit/runs/other-delivery/002-planned-change",
      ),
      { recursive: true },
    );
    await mkdir(
      path.join(f.repositoryRoot, ".flowkit/artifacts/delivery-one/full-test"),
      { recursive: true },
    );
    await writeFile(
      path.join(
        f.repositoryRoot,
        ".flowkit/artifacts/delivery-one/full-test/result.json",
      ),
      "synthetic unrelated Delivery check",
    );
    await writeFile(path.join(f.repositoryRoot, ".flowkit/memos.json"), "[]");
    assert.equal(await readProjectOrdinal(f.base, true, f.installation), 1);
    assert.equal((await f.getManifest()).changes[0].projectOrdinal, undefined);
  } finally {
    await f.cleanup();
  }
});

test("fresh descriptor continuation rejects drift, partial/bootstrap/competing history and orphan proof without rewriting it", async () => {
  const f = await freshFixture();
  try {
    const started = await f.call("action start", {
      ...f.base,
      actionId: "explore",
      role: "author",
    });
    const actionFile = path.join(started.directory, "action.md");
    const bytes = await readFile(actionFile);
    const descriptor = JSON.parse(
      bytes.toString().slice("# Action started\n\n".length),
    );
    const inspect = () =>
      readProjectOrdinal(f.base, true, f.installation, started.runId);
    for (const override of [
      { repositoryRoot: f.root },
      {
        preparedContext: {
          ...descriptor.preparedContext,
          previousRunId: "20261005-001-apply",
        },
      },
      {
        actionPackage: {
          ...descriptor.actionPackage,
          guidanceRef: {
            ...descriptor.actionPackage.guidanceRef,
            contentSha256: "a".repeat(64),
          },
        },
      },
    ]) {
      await writeFile(
        actionFile,
        "# Action started\n\n" + JSON.stringify({ ...descriptor, ...override }),
      );
      await assert.rejects(inspect());
      await writeFile(actionFile, bytes);
    }
    for (const name of ["context.json", "result.json", "bootstrap.json"]) {
      await writeFile(
        path.join(started.directory, name),
        "unknown historical bytes",
      );
      await assert.rejects(inspect());
      await rm(path.join(started.directory, name));
    }
    const other = path.join(
      f.repositoryRoot,
      ".flowkit/runs/other-delivery/002-other-change/20261005-002-explore",
    );
    await mkdir(other, { recursive: true });
    await writeFile(
      path.join(other, "action.md"),
      "# bootstrap history, no fake canonical occurrence\n",
    );
    await assert.rejects(inspect());
    await rm(path.join(f.repositoryRoot, ".flowkit/runs/other-delivery"), {
      recursive: true,
    });
    const orphan = path.join(
      f.repositoryRoot,
      `.flowkit/artifacts/delivery-one/changes/change-one/proof/20261005-999-explore`,
    );
    await mkdir(orphan, { recursive: true });
    await assert.rejects(inspect());
    await rmdir(orphan);
    const document = await f.getManifest();
    document.changes.push({
      id: "other-change",
      state: "active",
      dependsOn: [],
    });
    await writeFile(f.manifestPath, JSON.stringify(document));
    await assert.rejects(inspect());
    assert.deepEqual(await readFile(actionFile), bytes);
    assert.equal(document.changes[0].projectOrdinal, undefined);
  } finally {
    await f.cleanup();
  }
});
