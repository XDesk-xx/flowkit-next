import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { contextFixture } from "./action-context-fixture.js";
import { resolveActionContext } from "../../../src/cli/action-context.js";

test(`native ${process.platform} process: EOF, kill, write failure and unconsumed completion`, async (t) => {
  for (const mode of [
    "preparation-eof",
    "missing-ready-reason",
    "execution-eof",
    "kill",
    "write-failure",
    "unconsumed-completion",
  ] as const) {
    await t.test(mode, async () => {
      const f = await contextFixture();
      try {
        const request = path.join(f.root, "request.json");
        await writeFile(
          request,
          JSON.stringify({
            repositoryRoot: f.repositoryRoot,
            flowkitHome: f.flowkitHome,
            actionId: "explore",
            role: "author",
          }),
        );
        const child = spawn(
          process.execPath,
          [
            "--import",
            "tsx",
            "src/cli/entrypoint.ts",
            "action",
            "--input",
            request,
          ],
          { stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
        );
        let buffer = "";
        let final: any;
        let handlerError: unknown;
        const stderr: Buffer[] = [];
        child.stderr.on("data", (chunk) => stderr.push(chunk));
        async function frame(value: any) {
          if (value.kind === "prepare") {
            if (mode === "preparation-eof") {
              child.stdin.end();
              return;
            }
            if (mode === "missing-ready-reason") {
              child.stdin.write(
                JSON.stringify({
                  kind: "prepared",
                  runId: value.actionPackage.runId,
                  outcome: "ready",
                }) + "\n",
              );
              return;
            }
            child.stdin.write(
              JSON.stringify({
                kind: "prepared",
                runId: value.actionPackage.runId,
                outcome: "ready",
                reason: null,
              }) + "\n",
            );
          } else if (value.kind === "execute") {
            if (mode === "execution-eof") {
              child.stdin.end();
              return;
            }
            if (mode === "kill") {
              child.kill("SIGKILL");
              return;
            }
            const pkg = value.actionPackage;
            if (mode === "write-failure")
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
            child.stdin.end(
              JSON.stringify({
                kind: "result",
                runId: pkg.runId,
                result: {
                  runId: pkg.runId,
                  actionIdentity: pkg.actionIdentity,
                  authorConclusion: "PASS",
                  reviewerVerdict: null,
                  verificationVerdict: null,
                  nextBoundary: "review-explore",
                  facts: {
                    proofRefs: [],
                    handoff: {
                      summary:
                        "Native protocol fixture, not independent Review",
                      ownerDecisions: [],
                      evidenceRefs: [],
                    },
                  },
                },
              }) + "\n",
            );
          } else if (mode !== "unconsumed-completion") final = value;
        }
        child.stdout.setEncoding("utf8").on("data", (chunk) => {
          buffer += chunk;
          while (buffer.includes("\n")) {
            const index = buffer.indexOf("\n");
            const line = buffer.slice(0, index);
            buffer = buffer.slice(index + 1);
            void frame(JSON.parse(line)).catch((error) => {
              handlerError = error;
              child.kill();
            });
          }
        });
        const code = await new Promise<number | null>((resolve, reject) => {
          child.once("error", reject);
          child.once("close", resolve);
        });
        assert.equal(handlerError, undefined);
        if (mode === "kill" || mode === "write-failure") {
          await assert.rejects(
            resolveActionContext(f, f.installation),
            /Incomplete Run/,
          );
          if (mode === "write-failure") {
            assert.equal(code, 2, Buffer.concat(stderr).toString());
            assert.equal(final.error.persistence, "incomplete");
          }
        } else {
          const history = (await resolveActionContext(f, f.installation))
            .selected!.history;
          if (mode === "preparation-eof" || mode === "missing-ready-reason") {
            assert.equal(code, 2);
            assert.equal(history.current, null);
            if (mode === "missing-ready-reason") {
              assert.equal(final.error.kind, "invalid-host-frame");
              assert.equal(final.error.stage, "preparation");
              assert.equal(final.error.persistence, "none");
            }
          }
          if (mode === "execution-eof") {
            assert.equal(code, 2);
            assert.equal(history.current?.context.lifecycleState, "prepared");
          }
          if (mode === "unconsumed-completion") {
            assert.equal(code, 0);
            assert.equal(final, undefined);
            assert.equal(history.current?.context.lifecycleState, "terminal");
            assert.equal(history.records.length, 1);
          }
        }
      } finally {
        await f.cleanup();
      }
    });
  }
});
