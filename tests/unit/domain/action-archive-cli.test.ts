import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { archiveChange } from "../../../src/cli/support-change-archive.js";
import { inspectAction } from "../../../src/cli/action-inspect.js";
import { directoryHashes } from "../../../src/internal/archive-file-identities.js";
import { executeScopedCheckpoint } from "../../../src/internal/git-checkpoint-execution.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import { sha256 } from "../../../src/cli/run-effective-facts.js";
import { archiveFixture } from "./archive-contract-fixture.js";

test("safe failed Archive permits exact Owner revise and changed candidate, then requires a new role fixture Review", async () => {
  const f = await archiveFixture();
  try {
    await writeFile(path.join(f.repositoryRoot, "fail-native"), "fault\n");
    const started = await f.start();
    const failed = await archiveChange(
      { ...f.base, runId: started.runId },
      f.installation,
    );
    await f.finish(started.runId, failed);
    const original = await readFile(
      path.join(started.directory, "result.json"),
    );
    await writeFile(
      path.join(f.repositoryRoot, "candidate.txt"),
      "Owner corrected candidate\r\n",
    );
    await assert.rejects(f.start(), /Candidate artifact changed/);
    const revise = { ...f.base, actionId: "revise-apply", role: "author" };
    await assert.rejects(f.call("action start", revise));
    const revised = await f.call("action start", {
      ...revise,
      ownerAuthority: {
        ref: "owner:" + "d".repeat(64),
        decision: "revise-action",
        deliveryId: f.base.deliveryId,
        changeId: f.base.changeId,
        sourceRef: "synthetic:explicit-owner-revise",
        scope: ["revise-apply"],
      },
    });
    const facts = {
      artifactHashes: {
        ...f.candidate,
        "candidate.txt": sha256(
          await readFile(path.join(f.repositoryRoot, "candidate.txt")),
        ),
      },
      proofRefs: [],
    };
    const result = {
      runId: revised.runId,
      actionIdentity: {
        deliveryId: f.base.deliveryId,
        changeId: f.base.changeId,
        actionId: "revise-apply",
      },
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "review-apply",
      facts,
    };
    assert.equal(
      (
        await f.call("action finish", {
          ...f.base,
          runId: revised.runId,
          role: "author",
          terminal: true,
          result,
        })
      ).effect,
      "confirmed",
    );
    await assert.rejects(f.start());
    const review = await f.call("action start", {
      ...f.base,
      actionId: "review-apply",
      role: "reviewer",
    });
    await f.call("action finish", {
      ...f.base,
      runId: review.runId,
      role: "reviewer",
      terminal: true,
      result: {
        runId: review.runId,
        actionIdentity: {
          deliveryId: f.base.deliveryId,
          changeId: f.base.changeId,
          actionId: "review-apply",
        },
        authorConclusion: null,
        reviewerVerdict: "approved",
        verificationVerdict: null,
        nextBoundary: "archive",
        facts: { reviewedRunId: revised.runId, proofRefs: [] },
      },
    });
    await rm(path.join(f.repositoryRoot, "fail-native"));
    const retry = await f.start();
    const archived = await archiveChange(
      { ...f.base, runId: retry.runId },
      f.installation,
    );
    assert.equal(archived.status, "completed", JSON.stringify(archived));
    await f.finish(retry.runId, archived);
    assert.deepEqual(
      await readFile(path.join(started.directory, "result.json")),
      original,
    );
  } finally {
    await f.cleanup();
  }
});

test("safe native FAILs remain immutable, retry parents are exact, PASS checkpoints actual nested after/raw bytes", async () => {
  const f = await archiveFixture();
  try {
    const root = f.repositoryRoot;
    await gitBytes(root, ["config", "user.name", "Test"]);
    await gitBytes(root, ["config", "user.email", "fixture@example.invalid"]);
    await gitBytes(root, ["checkout", "-b", "main"]);
    await gitBytes(root, [
      "add",
      "--",
      ".gitattributes",
      "candidate.txt",
      "openspec",
    ]);
    await gitBytes(root, ["commit", "-m", "fixture baseline"]);
    await writeFile(path.join(root, "fail-native"), "fault\n");
    const failures: { runId: string; bytes: Buffer }[] = [];
    for (let i = 0; i < 2; i++) {
      const started = await f.start();
      const target = { ...f.base, runId: started.runId };
      const failed = await archiveChange(target, f.installation);
      assert.deepEqual(failed.archiveOutcome, {
        kind: "failed",
        effect: "no-mutation",
        retryable: true,
      });
      assert.equal(
        (await inspectAction(target, f.installation)).canContinue,
        false,
      );
      assert.equal((await f.finish(started.runId, failed)).effect, "confirmed");
      const status = await f.call("status", f.base);
      assert.equal(status.status, "current");
      assert.equal((await f.call("next", f.base)).decision.actionId, "archive");
      failures.push({
        runId: started.runId,
        bytes: await readFile(path.join(started.directory, "result.json")),
      });
    }
    await rm(path.join(root, "fail-native"));
    const started = await f.start();
    const descriptor = JSON.parse(
      (await readFile(path.join(started.directory, "action.md"), "utf8")).slice(
        "# Action started\n\n".length,
      ),
    );
    assert.equal(
      descriptor.preparedContext.previousRunId,
      failures.at(-1)!.runId,
    );
    const target = { ...f.base, runId: started.runId };
    const completed = await archiveChange(target, f.installation);
    assert.equal(completed.status, "completed", JSON.stringify(completed));
    assert.equal(
      (await archiveChange(target, f.installation)).status,
      "completed",
    );
    assert.equal(
      await readFile(path.join(root, "archive-count.txt"), "utf8"),
      "3",
    );
    assert.equal(
      (await f.finish(started.runId, completed)).effect,
      "confirmed",
    );
    assert.equal((await f.call("status", f.base)).status, "archived");
    for (const failure of failures)
      assert.deepEqual(
        await readFile(
          path.join(
            root,
            ".flowkit/runs/delivery-one/001-change-one",
            failure.runId,
            "result.json",
          ),
        ),
        failure.bytes,
      );
    const archivePath = String(completed.archivePath);
    const paths = [
      ...Object.keys(f.candidate),
      ...Object.keys((await directoryHashes(root, archivePath))!).map(
        (s) => `${archivePath}/${s}`,
      ),
      "openspec/specs/fixture/nested/spec.md",
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
    const outcome = await executeScopedCheckpoint(
      root,
      "main",
      {
        kind: "create-new",
        paths: [...new Set(paths)].sort(),
        commitMessage: "change(change-one): archive fixture",
        commitShape: null,
      },
      async () => true,
      f.base,
    );
    assert.equal(outcome.status, "completed", JSON.stringify(outcome));
    assert.deepEqual(
      await gitBytes(root, ["show", `HEAD:${archivePath}/helper.cmd`]),
      Buffer.from("@echo fixture\n"),
    );
    assert.deepEqual(
      await gitBytes(root, ["show", `HEAD:${archivePath}/retained.txt`]),
      Buffer.from("retained source\n"),
    );
    assert.deepEqual(
      await readFile(path.join(root, archivePath, "retained.txt")),
      Buffer.from("retained source\r\n"),
    );
    assert.deepEqual(
      await gitBytes(root, [
        "show",
        "HEAD:openspec/specs/fixture/nested/spec.md",
      ]),
      Buffer.from("# Actual native after\n"),
    );
    for (const ref of completed.archiveMaterialRefs as { path: string }[])
      if (ref.path.endsWith("stdout.txt"))
        assert.deepEqual(
          await gitBytes(root, ["show", `HEAD:${ref.path}`]),
          Buffer.from([255, 13, 10]),
        );
  } finally {
    await f.cleanup();
  }
});

test("restored native failure is safe but equality cannot invent positive rollback evidence", async () => {
  const f = await archiveFixture();
  try {
    await writeFile(path.join(f.repositoryRoot, "restore-native"), "fault\n");
    const started = await f.start();
    const failed = await archiveChange(
      { ...f.base, runId: started.runId },
      f.installation,
    );
    assert.deepEqual(failed.archiveOutcome, {
      kind: "failed",
      effect: "no-mutation",
      retryable: true,
    });
    await assert.rejects(
      f.finish(started.runId, {
        ...failed,
        archiveOutcome: {
          kind: "failed",
          effect: "rolled-back",
          retryable: true,
        },
      }),
      /archive-effects-unbound.*Safe Archive failure is not proven/,
    );
    assert.equal((await f.finish(started.runId, failed)).effect, "confirmed");
  } finally {
    await f.cleanup();
  }
});

test("candidate drift or late ordinal collision preserves effects and blocks retry without cleanup", async () => {
  for (const fault of ["drift", "collision"]) {
    const f = await archiveFixture();
    try {
      let marker: string | undefined;
      if (fault === "drift")
        await writeFile(path.join(f.repositoryRoot, "drift-native"), "fault\n");
      else {
        const date = new Date(),
          stamp = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
          ].join("-");
        marker = path.join(
          f.repositoryRoot,
          `openspec/changes/archive/${stamp}-001-change-one/owner.txt`,
        );
        await mkdir(path.dirname(marker), { recursive: true });
        await writeFile(marker, "pre-existing Owner bytes\r\n");
      }
      const started = await f.start();
      const partial = await archiveChange(
        { ...f.base, runId: started.runId },
        f.installation,
      );
      assert.deepEqual(partial.archiveOutcome, {
        kind: "partial",
        effect: "recovery-required",
        retryable: false,
      });
      assert.equal(
        (await f.finish(started.runId, partial)).effect,
        "confirmed",
      );
      assert.deepEqual((await f.call("next", f.base)).decision, {
        kind: "blocked",
        reason: "archive-recovery-required",
      });
      if (marker)
        assert.deepEqual(
          await readFile(marker),
          Buffer.from("pre-existing Owner bytes\r\n"),
        );
      else
        assert.equal(
          await readFile(path.join(f.repositoryRoot, "candidate.txt"), "utf8"),
          "concurrent candidate drift",
        );
      await assert.rejects(f.start());
    } finally {
      await f.cleanup();
    }
  }
});

test("Archive checkpoint rejects any resurrected old source prefix before staging", async () => {
  const f = await archiveFixture();
  try {
    const root = f.repositoryRoot;
    await gitBytes(root, ["config", "user.name", "Fixture"]);
    await gitBytes(root, ["config", "user.email", "fixture@example.invalid"]);
    await gitBytes(root, ["checkout", "-b", "main"]);
    await gitBytes(root, [
      "add",
      "--",
      ".gitattributes",
      "candidate.txt",
      "openspec",
    ]);
    await gitBytes(root, ["commit", "-m", "fixture baseline"]);
    const started = await f.start();
    const completed = await archiveChange(
      { ...f.base, runId: started.runId },
      f.installation,
    );
    assert.equal(completed.status, "completed", JSON.stringify(completed));
    await f.finish(started.runId, completed);
    const paths = [
      ...Object.keys(f.candidate),
      "openspec/specs/fixture/nested/spec.md",
    ];
    for (const prefix of [
      String(completed.archivePath),
      ".flowkit/runs/delivery-one/001-change-one",
      ".flowkit/artifacts/delivery-one/changes/001-change-one",
    ])
      paths.push(
        ...Object.keys((await directoryHashes(root, prefix))!).map(
          (suffix) => `${prefix}/${suffix}`,
        ),
      );
    const index = await readFile(path.join(root, ".git/index"));
    const head = await gitBytes(root, ["rev-parse", "HEAD"]);
    for (const suffix of ["unreviewed.md", "nested/unreviewed.md"]) {
      const extra = `openspec/changes/change-one/${suffix}`;
      await mkdir(path.dirname(path.join(root, extra)), { recursive: true });
      await writeFile(path.join(root, extra), "not in reviewed migration\n");
      const rejected = await executeScopedCheckpoint(
        root,
        "main",
        {
          kind: "create-new",
          paths: [...new Set([...paths, extra])].sort(),
          commitMessage: "fixture must reject",
          commitShape: null,
        },
        async () => true,
        f.base,
      );
      assert.equal(rejected.status, "incomplete");
      assert.equal(rejected.phase, "preflight");
      assert.equal(rejected.effect, "none");
      assert.match(rejected.reason!, /Archive v2 migration set invalid/);
      assert.deepEqual(await readFile(path.join(root, ".git/index")), index);
      assert.deepEqual(await gitBytes(root, ["rev-parse", "HEAD"]), head);
      await rm(path.join(root, extra));
    }
  } finally {
    await f.cleanup();
  }
});

test("nonzero exit after native mutation is terminal partial, corrupt coordination is never guessed active", async () => {
  const f = await archiveFixture();
  try {
    await writeFile(path.join(f.repositoryRoot, "partial-native"), "fault\n");
    const started = await f.start();
    const target = { ...f.base, runId: started.runId };
    const partial = await archiveChange(target, f.installation);
    assert.equal(partial.status, "incomplete");
    assert.equal((partial.archiveOutcome as { kind: string }).kind, "partial");
    await writeFile(
      path.join(f.repositoryRoot, "openspec/delivery-groups/delivery-one.yaml"),
      "corrupt\n",
    );
    assert.equal((await f.finish(started.runId, partial)).effect, "confirmed");
    const status = await f.call("status", f.base);
    assert.equal(status.status, "recovery-required");
    assert.equal(status.changeState, null);
    assert.deepEqual((await f.call("next", f.base)).decision, {
      kind: "blocked",
      reason: "archive-recovery-required",
    });
    await assert.rejects(f.start());
    assert.equal(
      await readFile(path.join(f.repositoryRoot, "archive-count.txt"), "utf8"),
      "1",
    );
  } finally {
    await f.cleanup();
  }
});

test("lost successful observation continues only rename/coordination; unknown intent never repeats OpenSpec", async () => {
  const f = await archiveFixture();
  try {
    const started = await f.start();
    const target = { ...f.base, runId: started.runId };
    const effects = path.join(
      f.repositoryRoot,
      ".flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects",
      started.runId,
    );
    await mkdir(path.join(effects, "openspec-observed.json"), {
      recursive: true,
    });
    const partial = await archiveChange(target, f.installation);
    assert.equal(partial.status, "incomplete");
    await rm(path.join(effects, "openspec-observed.json"), { recursive: true });
    const recovered = await archiveChange(target, f.installation);
    assert.equal(recovered.status, "completed", JSON.stringify(recovered));
    assert.equal(
      await readFile(path.join(f.repositoryRoot, "archive-count.txt"), "utf8"),
      "1",
    );
    assert.equal(
      (await f.finish(started.runId, recovered)).effect,
      "confirmed",
    );
  } finally {
    await f.cleanup();
  }
  const g = await archiveFixture();
  try {
    const started = await g.start();
    const target = { ...g.base, runId: started.runId };
    await writeFile(path.join(g.repositoryRoot, "fail-native"), "fault\n");
    await archiveChange(target, g.installation);
    const effects = path.join(
      g.repositoryRoot,
      ".flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects",
      started.runId,
    );
    await rm(path.join(effects, "openspec-result.json"));
    await rm(path.join(g.repositoryRoot, "fail-native"));
    assert.equal(
      (await inspectAction(target, g.installation)).canContinue,
      false,
    );
    assert.equal(
      (await archiveChange(target, g.installation)).status,
      "incomplete",
    );
    assert.equal(
      await readFile(path.join(g.repositoryRoot, "archive-count.txt"), "utf8"),
      "1",
    );
  } finally {
    await g.cleanup();
  }
});
