import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { executionFixture } from "./execution-recovery-fixture.js";
import { limitCli } from "./lifecycle-limit-fixture.js";
import { sha256 } from "../../../src/cli/run-effective-facts.js";
import type { JsonObject } from "../../../src/domain/run-result-persistence.js";
import { writeDurableRun } from "../../../src/domain/run-result-persistence.js";

const scenarios = [
  ["explore", -1],
  ["propose", 1],
  ["apply", 3],
] as const;
type Fixture = Awaited<ReturnType<typeof executionFixture>>;
type Stage = (typeof scenarios)[number][0];
function owner(f: Fixture, actionId: string) {
  return {
    ref: "owner:" + "b".repeat(64),
    decision: "revise-action",
    deliveryId: f.base.deliveryId,
    changeId: f.base.changeId,
    scope: [actionId],
    sourceRef: "synthetic:explicit-owner-prepared-continuation",
  };
}
async function bytes(directory: string) {
  return Promise.all(
    ["action.md", "context.json", "result.json"].map((name) =>
      readFile(path.join(directory, name)),
    ),
  );
}
async function descriptor(directory: string) {
  return JSON.parse(
    (await readFile(path.join(directory, "action.md"), "utf8")).slice(
      "# Action started\n\n".length,
    ),
  );
}
function finishRequest(
  f: Fixture,
  runId: string,
  actionId: string,
  terminal: boolean,
  facts: JsonObject,
) {
  return {
    ...f.base,
    runId,
    role: "author",
    terminal,
    result: {
      runId,
      actionIdentity: {
        deliveryId: f.base.deliveryId,
        changeId: f.base.changeId,
        actionId,
      },
      authorConclusion: terminal ? "PASS" : null,
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: terminal ? actionId.replace(/^revise-/, "review-") : null,
      facts,
    },
  };
}
async function proof(f: Fixture, runId: string) {
  const relative =
    ".flowkit/artifacts/delivery-one/changes/001-change-one/proof/" +
    runId +
    "/work.txt";
  const content = Buffer.from("Isolated actual round work\r\n");
  await mkdir(path.dirname(path.join(f.repositoryRoot, relative)), {
    recursive: true,
  });
  await writeFile(path.join(f.repositoryRoot, relative), content);
  return {
    ref: {
      path: relative,
      bytes: content.length,
      sha256: sha256(content),
      deliveryId: f.base.deliveryId,
      changeId: f.base.changeId,
      runId,
      purpose: "isolated round evidence",
    },
    content,
  };
}
async function prepared(f: Fixture, stage: Stage) {
  const call = limitCli(f);
  const started = await call("action start", {
    ...f.base,
    actionId: stage,
    role: "author",
  });
  const p = await proof(f, started.runId);
  const request = finishRequest(f, started.runId, stage, false, {
    proofRefs: [p.ref],
  });
  assert.equal((await call("action finish", request)).effect, "confirmed");
  return { call, started, p, request };
}
for (const [stage, index] of scenarios)
  test(
    stage +
      " prepared continuation preserves bytes through two same-revise rounds and latest Review start",
    async () => {
      const f = await executionFixture(index);
      try {
        const original = await prepared(f, stage);
        const { call } = original;
        const revise = "revise-" + stage;
        const snapshots = [
          {
            directory: original.started.directory,
            bytes: await bytes(original.started.directory),
            proof: original.p,
          },
        ];
        const first = await call("action start", {
          ...f.base,
          actionId: revise,
          role: "author",
          ownerAuthority: owner(f, revise),
        });
        const firstProof = await proof(f, first.runId);
        assert.equal(
          (
            await call(
              "action finish",
              finishRequest(f, first.runId, revise, false, {
                proofRefs: [firstProof.ref],
              }),
            )
          ).effect,
          "confirmed",
        );
        snapshots.push({
          directory: first.directory,
          bytes: await bytes(first.directory),
          proof: firstProof,
        });
        let parent = first;
        for (let round = 0; round < 2; round++) {
          const next = await call("action start", {
            ...f.base,
            actionId: revise,
            role: "author",
            ownerAuthority: owner(f, revise),
          });
          const d = await descriptor(next.directory);
          assert.equal(d.preparedContext.previousRunId, parent.runId);
          assert.deepEqual(d.preparedContext.ownerAuthority, owner(f, revise));
          assert.equal(
            d.preparedContext.occurrence.sequence,
            (await descriptor(parent.directory)).preparedContext.occurrence
              .sequence + 1,
          );
          assert.equal(
            (await call("action inspect", { ...f.base, runId: next.runId }))
              .completeness,
            "descriptor-only",
          );
          assert.equal(
            (await call("status", f.base, false)).error.kind,
            "run-chain-invalid",
          );
          assert.ok(
            (
              await call(
                "action start",
                {
                  ...f.base,
                  actionId: revise,
                  role: "author",
                  ownerAuthority: owner(f, revise),
                },
                false,
              )
            ).error,
          );
          assert.deepEqual(await readdir(next.directory), ["action.md"]);
          if (round === 0) {
            const actionPath = path.join(next.directory, "action.md");
            const originalAction = await readFile(actionPath);
            for (const invalid of [
              {
                ...d,
                preparedContext: {
                  ...d.preparedContext,
                  previousRunId: original.started.runId,
                },
              },
              {
                ...d,
                preparedContext: {
                  ...d.preparedContext,
                  ownerAuthority: { ...owner(f, revise), scope: ["apply"] },
                },
              },
            ]) {
              await writeFile(
                actionPath,
                "# Action started\n\n" + JSON.stringify(invalid) + "\n",
              );
              assert.equal(
                (await call("action inspect", { ...f.base, runId: next.runId }))
                  .effect,
                "blocked",
              );
              assert.ok(
                (
                  await call(
                    "action finish",
                    finishRequest(f, next.runId, revise, false, {
                      proofRefs: [],
                    }),
                    false,
                  )
                ).error,
              );
              assert.deepEqual(await readdir(next.directory), ["action.md"]);
            }
            await writeFile(actionPath, originalAction);
            const partial = path.join(next.directory, "context.json");
            await writeFile(partial, "{}\n");
            assert.equal(
              (await call("action inspect", { ...f.base, runId: next.runId }))
                .effect,
              "blocked",
            );
            await unlink(partial);
          }
          const p = await proof(f, next.runId);
          const changedPath =
            stage === "explore"
              ? f.source + "/explore.md"
              : stage === "propose"
                ? f.source + "/design.md"
                : "candidate.txt";
          const work = Buffer.from(
            "# Actual " + revise + " round " + (round + 1) + "\n",
          );
          await writeFile(path.join(f.repositoryRoot, changedPath), work);
          const facts: JsonObject =
            round === 0
              ? { proofRefs: [p.ref] }
              : stage === "explore"
                ? {
                    projectOrdinal: 1,
                    exploreArtifact: changedPath,
                    exploreSha256: sha256(work),
                    proofRefs: [p.ref],
                  }
                : {
                    artifactHashes: {
                      ...(stage === "propose" ? f.planning : f.candidate),
                      [changedPath]: sha256(work),
                    },
                    proofRefs: [p.ref],
                  };
          const request = finishRequest(
            f,
            next.runId,
            revise,
            round === 1,
            facts,
          );
          assert.equal(
            (await call("action finish", request)).effect,
            "confirmed",
          );
          const status = await call("status", f.base);
          assert.equal(status.currentRun.runId, next.runId);
          assert.equal(
            status.currentRun.state,
            round === 0 ? "prepared" : "terminal",
          );
          assert.equal(
            (await call("action inspect", { ...f.base, runId: next.runId }))
              .actualEffect,
            round === 0 ? "prepared" : "terminal",
          );
          assert.deepEqual((await call("next", f.base)).decision, {
            kind: "ready-action",
            actionId: round === 0 ? revise : "review-" + stage,
          });
          assert.equal(
            (await call("action finish", request)).effect,
            "confirmed",
          );
          for (const bad of [
            { ...request, terminal: !request.terminal },
            {
              ...request,
              result: { ...request.result, facts: { ...facts, changed: true } },
            },
          ])
            assert.equal(
              (await call("action finish", bad, false)).error.kind,
              "duplicate-finish-conflict",
            );
          for (const snapshot of snapshots) {
            assert.deepEqual(await bytes(snapshot.directory), snapshot.bytes);
            assert.deepEqual(
              await readFile(
                path.join(f.repositoryRoot, snapshot.proof.ref.path),
              ),
              snapshot.proof.content,
            );
          }
          snapshots.push({
            directory: next.directory,
            bytes: await bytes(next.directory),
            proof: p,
          });
          parent = next;
        }
        const review = await call("action start", {
          ...f.base,
          actionId: "review-" + stage,
          role: "reviewer",
        });
        assert.equal(
          (await descriptor(review.directory)).preparedContext.previousRunId,
          parent.runId,
        );
      } finally {
        await f.cleanup();
      }
    },
  );
test("fixed prepared start rejects invalid authority, ordinary targets and incomplete parent without new writes", async () => {
  const f = await executionFixture(3);
  try {
    const { call, started, p, request } = await prepared(f, "apply");
    const before = await bytes(started.directory);
    const group = path.dirname(started.directory);
    const names = await readdir(group);
    const auth = owner(f, "revise-apply");
    for (const authority of [
      undefined,
      { ...auth, decision: "activate-change" },
      { ...auth, scope: ["revise-propose"] },
      { ...auth, deliveryId: "other" },
      { ...auth, changeId: "other" },
      { ...auth, scope: ["revise-apply", "revise-propose"] },
    ]) {
      assert.ok(
        (
          await call(
            "action start",
            {
              ...f.base,
              actionId: "revise-apply",
              role: "author",
              ...(authority === undefined ? {} : { ownerAuthority: authority }),
            },
            false,
          )
        ).error,
      );
      assert.deepEqual(await readdir(group), names);
    }
    for (const value of [
      { actionId: "apply", role: "author" },
      { actionId: "apply", role: "author", ownerAuthority: owner(f, "apply") },
      { actionId: "review-apply", role: "reviewer", ownerAuthority: auth },
      { actionId: "archive", role: "author", ownerAuthority: auth },
    ]) {
      assert.ok(
        (await call("action start", { ...f.base, ...value }, false)).error,
      );
      assert.deepEqual(await readdir(group), names);
    }
    assert.ok(
      (
        await call(
          "action finish",
          { ...request, ownerAuthority: { ...auth, sourceRef: "replacement" } },
          false,
        )
      ).error,
    );
    await unlink(path.join(started.directory, "context.json"));
    assert.ok(
      (
        await call(
          "action start",
          {
            ...f.base,
            actionId: "revise-apply",
            role: "author",
            ownerAuthority: auth,
          },
          false,
        )
      ).error,
    );
    await writeFile(path.join(started.directory, "context.json"), before[1]!);
    assert.deepEqual(await bytes(started.directory), before);
    assert.deepEqual(
      await readFile(path.join(f.repositoryRoot, p.ref.path)),
      p.content,
    );
    assert.deepEqual(await readdir(group), names);
  } finally {
    await f.cleanup();
  }
});
test("prepared Reviewer and Archive cannot borrow Author continuation authority", async () => {
  for (const [index, actionId, role] of [
    [4, "review-apply", "reviewer"],
    [5, "archive", "author"],
  ] as const) {
    const f = await executionFixture(index);
    try {
      const occurrence = { date: "20261009", sequence: index + 2, actionId };
      const runId =
        "20261009-" +
        String(occurrence.sequence).padStart(3, "0") +
        "-" +
        actionId;
      const actionIdentity = {
        deliveryId: f.base.deliveryId,
        changeId: f.base.changeId,
        actionId,
      };
      const record = {
        actionMarkdown:
          "# Synthetic prepared-role guard, not Review evidence\n",
        context: {
          runId,
          occurrence,
          actionIdentity,
          lifecycleState: "prepared" as const,
          role,
          ownerAuthority: null,
          previousRunId: f.lastId,
        },
        result: {
          runId,
          actionIdentity,
          authorConclusion: null,
          reviewerVerdict: null,
          verificationVerdict: null,
          nextBoundary: null,
          facts: { proofRefs: [] },
        },
      };
      const address = await writeDurableRun(
        { ...f.base, changeStartSequence: 1, occurrence },
        record,
      );
      const before = await bytes(address.runDirectory);
      const names = await readdir(path.dirname(address.runDirectory));
      const call = limitCli(f);
      assert.ok(
        (
          await call(
            "action start",
            {
              ...f.base,
              actionId: "revise-apply",
              role: "author",
              ownerAuthority: owner(f, "revise-apply"),
            },
            false,
          )
        ).error,
      );
      assert.deepEqual(await bytes(address.runDirectory), before);
      assert.deepEqual(
        await readdir(path.dirname(address.runDirectory)),
        names,
      );
    } finally {
      await f.cleanup();
    }
  }
});

test("prepared Explore forward skip remains rejected by fixed start", async () => {
  const f = await executionFixture(-1);
  try {
    const { call, started } = await prepared(f, "explore");
    const before = await bytes(started.directory);
    const names = await readdir(path.dirname(started.directory));
    assert.ok(
      (
        await call(
          "action start",
          {
            ...f.base,
            actionId: "revise-apply",
            role: "author",
            ownerAuthority: owner(f, "revise-apply"),
          },
          false,
        )
      ).error,
    );
    assert.deepEqual(await readdir(path.dirname(started.directory)), names);
    assert.deepEqual(await bytes(started.directory), before);
  } finally {
    await f.cleanup();
  }
});
