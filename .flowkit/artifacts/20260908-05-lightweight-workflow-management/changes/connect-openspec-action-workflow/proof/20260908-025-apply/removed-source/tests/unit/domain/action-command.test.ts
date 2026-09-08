import assert from "node:assert/strict";
import { readdir, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { executeActionCommand } from "../../../src/cli/action-command.js";
import { resolveActionContext } from "../../../src/cli/action-context.js";
import {
  ActionProtocolError,
  type ActionTransport,
} from "../../../src/cli/action-protocol.js";
import { contextFixture } from "./action-context-fixture.js";
import type { ActionPackage } from "../../../src/domain/action-package-result-admission.js";
import type { RunResultRecord } from "../../../src/domain/run-result-persistence.js";

function host(
  options: {
    blocked?: boolean;
    eof?: boolean;
    result?: (value: RunResultRecord) => RunResultRecord;
    execute?: (value: ActionPackage) => Promise<void>;
  } = {},
) {
  const frames: Record<string, unknown>[] = [];
  let preparedPackage: unknown;
  const transport: ActionTransport = {
    async exchange(value, expected, runId) {
      const frame = value as Record<string, unknown>;
      frames.push(frame);
      if (expected === "prepared") {
        preparedPackage = frame.actionPackage;
        return {
          kind: "prepared",
          runId,
          outcome: options.blocked ? "blocked" : "ready",
          reason: options.blocked ? "fixture readiness fails" : null,
        };
      }
      assert.deepEqual(frame.actionPackage, preparedPackage);
      const actionPackage = frame.actionPackage as ActionPackage;
      await options.execute?.(actionPackage);
      if (options.eof) throw new ActionProtocolError("host-eof");
      const result: RunResultRecord = {
        runId,
        actionIdentity: actionPackage.actionIdentity,
        authorConclusion: actionPackage.role === "author" ? "PASS" : null,
        reviewerVerdict: actionPackage.role === "reviewer" ? "approved" : null,
        verificationVerdict: null,
        nextBoundary: null,
        facts: {
          proofRefs: [],
          handoff: {
            summary:
              "Synthetic protocol fixture, NOT independent Reviewer acceptance",
            ownerDecisions: [],
            evidenceRefs: [],
          },
        },
      };
      return {
        kind: "result",
        runId,
        result: options.result?.(result) ?? result,
      };
    },
    assertClean() {},
    send(frame) {
      frames.push(frame as Record<string, unknown>);
    },
    close() {},
  };
  return { transport, frames };
}

test("one explicit invocation reserves before execute and reads terminal across sessions", async () => {
  const f = await contextFixture();
  try {
    const h = host({
      execute: async (pkg) => {
        const dir = path.join(
          f.repositoryRoot,
          ".flowkit",
          "runs",
          "delivery-one",
          "001-change-one",
          pkg.runId,
        );
        assert.deepEqual(await readdir(dir), ["action.md"]);
      },
    });
    const code = await executeActionCommand(
      { ...f, actionId: "explore", role: "author" },
      f.installation,
      h.transport,
    );
    assert.equal(code, 0);
    assert.deepEqual(
      h.frames.map((frame) => frame.kind),
      ["prepare", "execute", "action"],
    );
    const resolved = await resolveActionContext(f, f.installation);
    assert.equal(
      resolved.selected?.history.current?.context.lifecycleState,
      "terminal",
    );
    assert.equal(resolved.selected?.history.records.length, 1);
    await assert.rejects(
      readdir(path.join(f.repositoryRoot, ".flowkit", "artifacts")),
      /ENOENT/,
    );
  } finally {
    await f.cleanup();
  }
});

test("blocked preparation and wrong Role/Action produce no Run", async () => {
  const f = await contextFixture();
  try {
    for (const [actionId, role, blocked] of [
      ["explore", "author", true],
      ["explore", "reviewer", false],
      ["apply", "author", false],
    ] as const) {
      const h = host({ blocked });
      assert.equal(
        await executeActionCommand(
          { ...f, actionId, role },
          f.installation,
          h.transport,
        ),
        2,
      );
      assert.equal(
        h.frames.some((frame) => frame.kind === "execute"),
        false,
      );
      assert.equal(
        (h.frames.at(-1)!.error as { persistence: string }).persistence,
        "none",
      );
    }
    await assert.rejects(
      readdir(path.join(f.repositoryRoot, ".flowkit", "runs")),
      /ENOENT/,
    );
  } finally {
    await f.cleanup();
  }
});

test("execution EOF preserves prepared failure; next invocation explicitly retries same Action", async () => {
  const f = await contextFixture();
  try {
    const failed = host({ eof: true });
    assert.equal(
      await executeActionCommand(
        { ...f, actionId: "explore", role: "author" },
        f.installation,
        failed.transport,
      ),
      2,
    );
    const current = (await resolveActionContext(f, f.installation)).selected!
      .history.current!;
    assert.equal(current.context.lifecycleState, "prepared");
    assert.equal(current.result.authorConclusion, null);
    assert.deepEqual(current.result.facts.invocationFailure, {
      kind: "host-eof",
      stage: "execution",
    });
    const retry = host();
    assert.equal(
      await executeActionCommand(
        { ...f, actionId: "explore", role: "author" },
        f.installation,
        retry.transport,
      ),
      0,
    );
    const next = (await resolveActionContext(f, f.installation)).selected!
      .history.current!;
    assert.equal(next.context.previousRunId, current.context.runId);
    assert.equal(next.context.occurrence.sequence, 2);
  } finally {
    await f.cleanup();
  }
});

for (const failure of [
  "wrong-next",
  "wrong-role",
  "reserved-facts",
  "missing-proof",
]) {
  test(`reject ${failure} without admitting host result`, async () => {
    const f = await contextFixture();
    try {
      const h = host({
        result: (result) => ({
          ...result,
          ...(failure === "wrong-next" ? { nextBoundary: "apply" } : {}),
          ...(failure === "wrong-role" ? { reviewerVerdict: "approved" } : {}),
          ...(failure === "reserved-facts"
            ? {
                facts: {
                  ...result.facts,
                  invocationFailure: { kind: "fake", stage: "execution" },
                },
              }
            : {}),
          ...(failure === "missing-proof" ? { facts: {} } : {}),
        }),
      });
      assert.equal(
        await executeActionCommand(
          { ...f, actionId: "explore", role: "author" },
          f.installation,
          h.transport,
        ),
        2,
      );
      assert.equal(h.frames.at(-1)?.kind, "error");
      const record = (await resolveActionContext(f, f.installation)).selected!
        .history.current!;
      assert.equal(record.context.lifecycleState, "prepared");
      assert.equal(record.result.reviewerVerdict, null);
    } finally {
      await f.cleanup();
    }
  });
}

test("real domain FAIL is terminal exit zero and not a transport PASS", async () => {
  const f = await contextFixture();
  try {
    const h = host({
      result: (result) => ({ ...result, authorConclusion: "FAIL" }),
    });
    assert.equal(
      await executeActionCommand(
        { ...f, actionId: "explore", role: "author" },
        f.installation,
        h.transport,
      ),
      0,
    );
    assert.equal(
      (h.frames.at(-1)?.result as RunResultRecord).authorConclusion,
      "FAIL",
    );
  } finally {
    await f.cleanup();
  }
});

test("post-execution write failure preserves partial and emits no terminal", async () => {
  const f = await contextFixture();
  try {
    const h = host({
      execute: async (pkg) => {
        await mkdir(
          path.join(
            f.repositoryRoot,
            ".flowkit",
            "runs",
            "delivery-one",
            "001-change-one",
            pkg.runId,
            "result.json",
          ),
        );
      },
    });
    assert.equal(
      await executeActionCommand(
        { ...f, actionId: "explore", role: "author" },
        f.installation,
        h.transport,
      ),
      2,
    );
    assert.equal(h.frames.at(-1)?.kind, "error");
    assert.equal(
      (h.frames.at(-1)?.error as { persistence: string }).persistence,
      "incomplete",
    );
    await assert.rejects(
      resolveActionContext(f, f.installation),
      /Incomplete Run/,
    );
    const runId = (h.frames[0].actionPackage as ActionPackage).runId;
    assert.equal(
      JSON.parse(
        await readFile(
          path.join(
            f.repositoryRoot,
            ".flowkit",
            "runs",
            "delivery-one",
            "001-change-one",
            runId,
            "context.json",
          ),
          "utf8",
        ),
      ).lifecycleState,
      "terminal",
    );
  } finally {
    await f.cleanup();
  }
});
