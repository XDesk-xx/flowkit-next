import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, unlink, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { executionFixture } from "./execution-recovery-fixture.js";
import {
  readEffectiveRun,
  runMaterialLocation,
  sha256,
} from "../../../src/cli/run-effective-facts.js";
import { directoryHashes } from "../../../src/internal/archive-file-identities.js";
import { checkpointCandidateTree } from "../../../src/internal/checkpoint-candidate-tree.js";
import { reviewedCheckpointCandidate } from "../../../src/internal/reviewed-checkpoint-candidate.js";

for (const verdict of ["approved", "changes-requested", "rejected"] as const)
  test(`corrected Author consumes ${verdict} Review without an optional map and preserves continuation guards`, async () => {
    const f = await executionFixture(4);
    try {
      const loc = await runMaterialLocation(f.base, f.lastId);
      const manifest = `.flowkit/artifacts/delivery-one/changes/001-change-one/proof/${f.lastId}/candidate.json`;
      const bytes = Buffer.from(
        JSON.stringify({ artifactHashes: f.candidate }) + "\n",
      );
      await mkdir(path.dirname(path.join(f.repositoryRoot, manifest)), {
        recursive: true,
      });
      await writeFile(path.join(f.repositoryRoot, manifest), bytes);
      const facts = {
        proofRefs: [
          {
            path: manifest,
            bytes: bytes.length,
            sha256: sha256(bytes),
            deliveryId: f.base.deliveryId,
            changeId: f.base.changeId,
            runId: f.lastId,
            purpose: "synthetic original candidate",
          },
        ],
      };
      await writeFile(
        path.join(f.repositoryRoot, loc.runRoot, "result.json"),
        JSON.stringify({ ...loc.record.result, facts }) + "\n",
      );
      const before = await runMaterialLocation(f.base, f.lastId);
      assert.equal(
        (
          await f.call("action correct", {
            ...f.base,
            runId: f.lastId,
            role: "author",
            ownerAuthority: {
              ref: "owner:" + "c".repeat(64),
              decision: "correct-run-metadata",
              deliveryId: f.base.deliveryId,
              changeId: f.base.changeId,
              scope: ["correct-run-metadata"],
              sourceRef: "synthetic:correction-continuation",
            },
            expectedRunHashes: before.originalHashes,
            additions: { artifactHashes: f.candidate },
            candidateEvidenceRef: manifest,
          })
        ).effect,
        "confirmed",
      );
      const started = await f.call("action start", {
        ...f.base,
        actionId: "review-apply",
        role: "reviewer",
      });
      assert.equal(started.effect, "started");
      assert.deepEqual(
        (await readEffectiveRun(f.base, f.lastId)).effectiveFacts
          .artifactHashes,
        f.candidate,
      );

      const partial = path.join(started.directory, "context.json");
      await writeFile(partial, "{}\n");
      await assert.rejects(readEffectiveRun(f.base, f.lastId));
      await unlink(partial);
      const action = path.join(started.directory, "action.md");
      const markdown = await readFile(action, "utf8");
      const descriptor = JSON.parse(
        markdown.slice("# Action started\n\n".length),
      );
      await writeFile(
        action,
        "# Action started\n\n" +
          JSON.stringify({ ...descriptor, repositoryRoot: f.root }),
      );
      await assert.rejects(
        readEffectiveRun(f.base, f.lastId),
        /descriptor identity drift/,
      );
      await writeFile(action, markdown);
      const forkId = started.runId.replace("-006-", "-007-");
      const fork = path.join(path.dirname(started.directory), forkId);
      await mkdir(fork);
      await writeFile(
        path.join(fork, "action.md"),
        "# Action started\n\n" +
          JSON.stringify({
            ...descriptor,
            preparedContext: {
              ...descriptor.preparedContext,
              runId: forkId,
              occurrence: {
                ...descriptor.preparedContext.occurrence,
                sequence: 7,
              },
            },
          }),
      );
      await assert.rejects(readEffectiveRun(f.base, f.lastId), /consumer fork/);
      await rm(fork, { recursive: true });

      const finished = await f.call("action finish", {
        ...f.base,
        runId: started.runId,
        role: "reviewer",
        terminal: true,
        result: {
          runId: started.runId,
          actionIdentity: {
            deliveryId: f.base.deliveryId,
            changeId: f.base.changeId,
            actionId: "review-apply",
          },
          authorConclusion: null,
          reviewerVerdict: verdict,
          verificationVerdict: null,
          nextBoundary:
            verdict === "approved"
              ? "archive"
              : verdict === "rejected"
                ? null
                : "revise-apply",
          facts: {
            reviewedRunId: f.lastId,
            proofRefs: [],
          },
        },
      });
      assert.equal(finished.effect, "confirmed");
      assert.deepEqual(
        (await readEffectiveRun(f.base, f.lastId)).effectiveFacts
          .artifactHashes,
        f.candidate,
      );
      assert.deepEqual(
        (await runMaterialLocation(f.base, f.lastId)).originalHashes,
        before.originalHashes,
      );
      assert.equal(
        Object.hasOwn(
          (await runMaterialLocation(f.base, started.runId)).record.result
            .facts,
          "artifactHashes",
        ),
        false,
      );
      const correctionView = await readEffectiveRun(f.base, f.lastId);
      assert.equal(
        (
          await f.call("action correct", {
            ...f.base,
            runId: f.lastId,
            role: "author",
            ownerAuthority: {
              ref: "owner:" + "c".repeat(64),
              decision: "correct-run-metadata",
              deliveryId: f.base.deliveryId,
              changeId: f.base.changeId,
              scope: ["correct-run-metadata"],
              sourceRef: "synthetic:correction-continuation",
            },
            expectedRunHashes: before.originalHashes,
            additions: { artifactHashes: f.candidate },
            candidateEvidenceRef: manifest,
          })
        ).duplicate,
        true,
      );
      if (verdict === "approved") {
        const prefix = ".flowkit/runs/delivery-one/001-change-one";
        const paths = [
          ".gitattributes",
          ...Object.keys(
            (await directoryHashes(f.repositoryRoot, prefix))!,
          ).map((suffix) => `${prefix}/${suffix}`),
          correctionView.correctionRef!,
          manifest,
          "candidate.txt",
        ];
        await reviewedCheckpointCandidate(
          f.repositoryRoot,
          await checkpointCandidateTree(f.repositoryRoot, paths),
          f.base,
          paths,
        );
        const runtime = path.join(
          f.flowkitHome,
          "tools/openspec/1.10.0/bin/openspec.js",
        );
        await writeFile(
          runtime,
          `const archiveArgs=process.argv.slice(2);if(archiveArgs[0]==='archive'){const fs=require('node:fs');const path=require('node:path');const n=new Date();const date=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');const target=path.join(process.cwd(),'openspec/changes/archive',date+'-'+archiveArgs[1]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(path.join(process.cwd(),'openspec/changes',archiveArgs[1]),target);console.log('{}');process.exit(0);}\n` +
            (await readFile(runtime, "utf8")),
        );
        await mkdir(path.join(f.repositoryRoot, "config/verification"), {
          recursive: true,
        });
        await writeFile(
          path.join(f.repositoryRoot, "config/verification/full-test.json"),
          JSON.stringify({
            inputs: ["openspec"],
            exclude: [],
            environment: [],
            checks: [
              {
                checkId: "candidate-check",
                program: "git",
                args: ["hash-object", "candidate.txt"],
                cwd: ".",
              },
            ],
          }),
        );
        assert.equal(
          (
            await f.call("action start", {
              ...f.base,
              actionId: "archive",
              role: "author",
            })
          ).effect,
          "started",
        );
      } else {
        const revise = { ...f.base, actionId: "revise-apply", role: "author" };
        if (verdict === "rejected")
          await assert.rejects(f.call("action start", revise));
        assert.equal(
          (
            await f.call("action start", {
              ...revise,
              ...(verdict === "rejected"
                ? {
                    ownerAuthority: {
                      ref: "owner:" + "d".repeat(64),
                      decision: "revise-action",
                      deliveryId: f.base.deliveryId,
                      changeId: f.base.changeId,
                      scope: ["revise-apply"],
                      sourceRef: "synthetic:correction-continuation-owner",
                    },
                  }
                : {}),
            })
          ).effect,
          "started",
        );
      }
      assert.deepEqual(
        (await runMaterialLocation(f.base, f.lastId)).originalHashes,
        before.originalHashes,
      );
    } finally {
      await f.cleanup();
    }
  });
