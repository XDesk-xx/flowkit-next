import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  writeDurableRun,
  type JsonObject,
  type RunOccurrence,
} from "../../../src/domain/run-result-persistence.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import { contextFixture } from "./action-context-fixture.js";
import { openSpecArchiveDate } from "../../../src/internal/openspec-archive-date.js";
import { executeScopedCheckpoint } from "../../../src/internal/git-checkpoint-execution.js";
import { directoryHashes } from "../../../src/internal/archive-file-identities.js";
import { runMaterialLocation } from "../../../src/cli/run-effective-facts.js";

const run = promisify(execFile);
const entry = fileURLToPath(
  new URL("../../../src/cli/entrypoint.ts", import.meta.url),
);
const tsxImport = import.meta.resolve("tsx");

test("archive finish reads trusted completed coordination after isolated preparation", async () => {
  const fixture = await contextFixture();
  try {
    const root = fixture.repositoryRoot;
    await gitBytes(root, ["init"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    await mkdir(path.join(root, "node_modules"));
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({
        scripts: { "test:domain": 'node -e "process.exit(0)"' },
      }),
    );
    const manifest = path.join(
      root,
      "openspec/delivery-groups/delivery-one.yaml",
    );
    const manifestData = JSON.parse(await readFile(manifest, "utf8")) as {
      changes: Record<string, unknown>[];
    };
    manifestData.changes[0].projectOrdinal = 1;
    await writeFile(manifest, JSON.stringify(manifestData));
    const changeRoot = path.join(root, "openspec/changes/change-one");
    await mkdir(changeRoot, { recursive: true });
    for (const name of ["proposal.md", "design.md", "tasks.md"])
      await writeFile(
        path.join(changeRoot, name),
        name === "tasks.md" ? "# Tasks\n- [x] synthetic task\n" : `# ${name}\n`,
      );
    await writeFile(path.join(root, "candidate.txt"), "reviewed candidate\n");
    const sha = createHash("sha256")
      .update(await readFile(path.join(root, "candidate.txt")))
      .digest("hex");
    await mkdir(path.join(changeRoot, "specs/fixture"), { recursive: true });
    await writeFile(
      path.join(changeRoot, "specs/fixture/spec.md"),
      "# synthetic delta\n",
    );
    await mkdir(path.join(root, "openspec/specs/fixture"), { recursive: true });
    await writeFile(
      path.join(root, "openspec/specs/fixture/spec.md"),
      "# canonical before\n",
    );
    const candidateHashes: Record<string, string> = { "candidate.txt": sha };
    for (const relative of [
      ...Object.keys(
        (await directoryHashes(root, "openspec/changes/change-one"))!,
      ).map((suffix) => `openspec/changes/change-one/${suffix}`),
      "openspec/specs/fixture/spec.md",
      "openspec/delivery-groups/delivery-one.yaml",
    ])
      candidateHashes[relative] = createHash("sha256")
        .update(await readFile(path.join(root, relative)))
        .digest("hex");
    await gitBytes(root, ["config", "user.name", "Test"]);
    await gitBytes(root, ["config", "user.email", "test@example.invalid"]);
    await gitBytes(root, ["checkout", "-b", "main"]);
    await gitBytes(root, [
      "add",
      "--",
      ".gitattributes",
      "candidate.txt",
      "openspec",
    ]);
    await gitBytes(root, ["commit", "-m", "synthetic fixture base"]);
    const actions = [
      "explore",
      "review-explore",
      "propose",
      "review-propose",
      "apply",
      "review-apply",
    ] as const;
    let previousRunId: string | null = null;
    for (const [index, actionId] of actions.entries()) {
      const occurrence: RunOccurrence = {
        date: "20260930",
        sequence: index + 1,
        actionId,
      };
      const runId = `20260930-${String(index + 1).padStart(3, "0")}-${actionId}`;
      const identity = {
        deliveryId: "delivery-one",
        changeId: "change-one",
        actionId,
      };
      const reviewer = actionId.startsWith("review-");
      let facts: JsonObject = {};
      if (actionId === "apply") facts = { artifactHashes: candidateHashes };
      if (actionId === "review-apply")
        facts = { artifactHashes: candidateHashes };
      await writeDurableRun(
        {
          repositoryRoot: root,
          deliveryId: "delivery-one",
          changeId: "change-one",
          changeStartSequence: 1,
          occurrence,
        },
        {
          actionMarkdown: "# synthetic fixture chain\n",
          context: {
            runId,
            occurrence,
            actionIdentity: identity,
            role: reviewer ? "reviewer" : "author",
            lifecycleState: "terminal",
            ownerAuthority: null,
            previousRunId,
          },
          result: {
            runId,
            actionIdentity: identity,
            authorConclusion: reviewer ? null : "PASS",
            reviewerVerdict: reviewer ? "approved" : null,
            verificationVerdict: null,
            nextBoundary: null,
            facts,
          },
        },
      );
      previousRunId = runId;
    }
    const runtime = path.join(
      fixture.flowkitHome,
      "tools/openspec/1.10.0/bin/openspec.js",
    );
    const originalTool = await readFile(runtime, "utf8");
    await writeFile(
      runtime,
      `if(process.argv[2]==='archive'){const fs=require('node:fs'); const path=require('node:path');const root=process.cwd();const n=new Date();const date=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');const target=path.join(root,'openspec','changes','archive',date+'-'+process.argv[3]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(path.join(root,'openspec','changes',process.argv[3]),target);fs.writeFileSync(path.join(root,'openspec/specs/fixture/spec.md'),'# canonical after\\n');const file=path.join(root,'observation.json');const state=JSON.parse(fs.readFileSync(file));state.changes=[];fs.writeFileSync(file,JSON.stringify(state));if(!root.includes('flowkit-archive-')){fs.writeFileSync(path.join(root,'actual-archive-count.txt'),'1');process.exit(9)}process.exit(0)}\n${originalTool}`,
    );
    const base = {
      repositoryRoot: root,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const call = async (args: string[], name: string, value: unknown) => {
      if (args.length === 2 && args[0] === "change" && args[1] === "archive")
        args = [
          ...args,
          "--repository-root",
          root,
          "--delivery-id",
          base.deliveryId,
          "--change-id",
          base.changeId,
        ];
      const request = path.join(root, name);
      await writeFile(request, JSON.stringify(value));
      const output = await run(
        process.execPath,
        ["--import", tsxImport, entry, ...args, "--input", request],
        { cwd: root, timeout: 60_000 },
      ).catch((error: { stdout?: string; message: string }) => {
        if (args[0] === "change" && args[1] === "archive" && error.stdout)
          return { stdout: error.stdout, stderr: "" };
        error.message += "\n" + (error.stdout ?? "");
        throw error;
      });
      return JSON.parse(output.stdout) as Record<string, unknown>;
    };
    await assert.rejects(
      call(["action", "start"], "missing-binding.json", {
        ...base,
        actionId: "archive",
        role: "author",
        applicableChecks: [{ id: "test:domain", reason: "synthetic probe" }],
      }),
      (error: unknown) =>
        JSON.parse((error as { stdout: string }).stdout).error.kind ===
        "review-candidate-unbound",
    );
    const originalReview = await runMaterialLocation(base, previousRunId!);
    const corrected = await call(
      ["action", "correct"],
      "binding-correction.json",
      {
        ...base,
        runId: previousRunId,
        role: "reviewer",
        expectedRunHashes: originalReview.originalHashes,
        additions: { reviewedRunId: "20260930-005-apply" },
        candidateEvidenceRef: null,
        ownerAuthority: {
          ref: `owner:${"c".repeat(64)}`,
          decision: "correct-run-metadata",
          deliveryId: base.deliveryId,
          changeId: base.changeId,
          sourceRef: "synthetic:explicit-reviewer-correction",
          scope: ["correct-run-metadata"],
        },
      },
    );
    assert.equal(corrected.effect, "confirmed");
    assert.deepEqual(
      (await runMaterialLocation(base, previousRunId!)).originalHashes,
      originalReview.originalHashes,
    );
    await assert.rejects(
      call(["action", "start"], "unconfigured-start.json", {
        ...base,
        actionId: "archive",
        role: "author",
        applicableChecks: [{ id: "not-configured", reason: "negative probe" }],
      }),
      (error: unknown) =>
        JSON.parse((error as { stdout?: string }).stdout ?? "{}").error
          ?.kind === "archive-check-unconfigured",
    );
    assert.equal(
      (
        await readdir(
          path.join(root, ".flowkit/runs/delivery-one/001-change-one"),
        )
      ).length,
      6,
    );
    const started = await call(["action", "start"], "archive-start.json", {
      ...base,
      actionId: "archive",
      role: "author",
      applicableChecks: [
        { id: "test:domain", reason: "affected domain check" },
      ],
    });
    assert.equal(started.effect, "started");
    const archivePath = `openspec/changes/archive/${openSpecArchiveDate()}-001-change-one`;
    const beforeInspect = await readFile(
      path.join(started.directory as string, "action.md"),
    );
    assert.equal(
      (
        await call(["action", "inspect"], "inspect-before.json", {
          ...base,
          runId: started.runId,
        })
      ).canContinue,
      true,
    );
    assert.deepEqual(
      await readFile(path.join(started.directory as string, "action.md")),
      beforeInspect,
    );
    await assert.rejects(
      call(["next"], "incomplete-next.json", base),
      (error: unknown) => {
        const value = JSON.parse((error as { stdout: string }).stdout);
        assert.equal(value.error.inspect?.runId, started.runId);
        return true;
      },
    );
    const descriptorFile = path.join(started.directory as string, "action.md");
    const descriptor = JSON.parse(
      beforeInspect.toString().slice("# Action started\n\n".length),
    );
    for (const invalid of [
      Buffer.from("# unknown format\n"),
      Buffer.from(
        "# Action started\n\n" +
          JSON.stringify({ ...descriptor, repositoryRoot: root + "-wrong" }) +
          "\n",
      ),
      Buffer.from(
        "# Action started\n\n" +
          JSON.stringify({
            ...descriptor,
            actionPackage: {
              ...descriptor.actionPackage,
              guidanceRef: {
                ...descriptor.actionPackage.guidanceRef,
                sha256: "0".repeat(64),
              },
            },
          }) +
          "\n",
      ),
    ]) {
      await writeFile(descriptorFile, invalid);
      const inspected = await call(
        ["action", "inspect"],
        "invalid-inspect.json",
        { ...base, runId: started.runId },
      );
      assert.equal(inspected.effect, "blocked");
      assert.equal(inspected.canContinue, false);
      assert.deepEqual(await readFile(descriptorFile), invalid);
    }
    await writeFile(descriptorFile, beforeInspect);
    const machine = path.join(started.directory as string, "context.json");
    await writeFile(machine, "{}\n");
    assert.equal(
      (
        await call(["action", "inspect"], "partial-inspect.json", {
          ...base,
          runId: started.runId,
        })
      ).canContinue,
      false,
    );
    assert.deepEqual(await readFile(machine), Buffer.from("{}\n"));
    await rm(machine); // Dispose synthetic partial injection; product inspect never repairs it.
    const lost = await call(
      [
        "change",
        "archive",
        "--repository-root",
        root,
        "--delivery-id",
        "delivery-one",
        "--change-id",
        "change-one",
      ],
      "archive-request.json",
      { ...base, runId: started.runId },
    );
    assert.equal(lost.status, "incomplete");
    const effectsDirectory = path.join(
      root,
      `.flowkit/artifacts/delivery-one/changes/001-change-one/archive-effects/${started.runId}`,
    );
    const extraObservation = path.join(effectsDirectory, "unexpected.json");
    await writeFile(extraObservation, "{}\n"); // Synthetic conflicting evidence.
    const conflict = await call(
      ["action", "inspect"],
      "inspect-conflict.json",
      {
        ...base,
        runId: started.runId,
      },
    );
    assert.equal(conflict.canContinue, false);
    assert.deepEqual(await readFile(extraObservation), Buffer.from("{}\n"));
    await rm(extraObservation); // Dispose fixture fault; inspect does not repair evidence.
    assert.equal(
      (
        await call(["action", "inspect"], "inspect-loss.json", {
          ...base,
          runId: started.runId,
        })
      ).actualEffect,
      "openspec",
    );
    // Synthetic fault injection: the rename happened, but the host lost its response before recording it.
    await rename(
      path.join(
        root,
        `openspec/changes/archive/${openSpecArchiveDate()}-change-one`,
      ),
      path.join(root, archivePath),
    );
    assert.equal(
      (
        await call(["action", "inspect"], "inspect-rename.json", {
          ...base,
          runId: started.runId,
        })
      ).actualEffect,
      "archived",
    );
    const archived = await call(["change", "archive"], "resume.json", {
      ...base,
      runId: started.runId,
    });
    assert.equal(archived.status, "completed", JSON.stringify(archived));
    assert.equal(archived.archivePath, archivePath);
    assert.equal(
      await readFile(path.join(root, "actual-archive-count.txt"), "utf8"),
      "1",
    );
    const refs = archived.archiveMaterialRefs as {
      path: string;
      sha256: string;
    }[];
    const savedMaterials = await Promise.all(
      refs.map((ref) => readFile(path.join(root, ref.path))),
    );
    const repeat = await call(["change", "archive"], "repeat.json", {
      ...base,
      runId: started.runId,
    });
    assert.equal(repeat.status, "completed");
    assert.deepEqual(
      await Promise.all(refs.map((ref) => readFile(path.join(root, ref.path)))),
      savedMaterials,
    );
    const marker = refs.find((ref) =>
      ref.path.endsWith("coordination-observed.json"),
    )!;
    await rm(path.join(root, marker.path)); // Synthetic crash after coordination write, before its observation save.
    assert.equal(
      (
        await call(["action", "inspect"], "inspect-coordination.json", {
          ...base,
          runId: started.runId,
        })
      ).actualEffect,
      "completed",
    );
    assert.equal(
      (
        await call(["change", "archive"], "resume-coordination.json", {
          ...base,
          runId: started.runId,
        })
      ).status,
      "completed",
    );
    const runId = started.runId as string;
    const result = {
      runId,
      actionIdentity: {
        deliveryId: "delivery-one",
        changeId: "change-one",
        actionId: "archive",
      },
      authorConclusion: "PASS",
      reviewerVerdict: null,
      verificationVerdict: null,
      nextBoundary: "checkpoint",
      facts: {
        archivePath,
        projectOrdinal: 1,
        archiveMaterialRefs: archived.archiveMaterialRefs,
        proofRefs: [],
      },
    };
    const finished = await call(["action", "finish"], "archive-finish.json", {
      ...base,
      runId,
      role: "author",
      terminal: true,
      result,
    });
    assert.equal(finished.effect, "confirmed");
    const status = await call(["status"], "query.json", base);
    assert.equal(status.status, "archived");
    const migrated = (await directoryHashes(root, archivePath))!;
    const runFiles = await directoryHashes(
      root,
      ".flowkit/runs/delivery-one/001-change-one",
    );
    const authorized = [
      ...Object.keys(candidateHashes),
      ...Object.keys(migrated).map((suffix) => `${archivePath}/${suffix}`),
      ...Object.keys(runFiles!).map(
        (suffix) => `.flowkit/runs/delivery-one/001-change-one/${suffix}`,
      ),
      ...refs.map((ref) => ref.path),
      corrected.correctionRef as string,
    ]
      .filter((value, index, all) => all.indexOf(value) === index)
      .sort();
    const before = await gitBytes(root, ["rev-parse", "HEAD"]);
    await writeFile(
      path.join(root, archivePath, "design.md"),
      "unauthorized archive drift\n",
    );
    const drift = await executeScopedCheckpoint(
      root,
      "main",
      {
        kind: "create-new",
        paths: authorized,
        commitMessage: "change(change-one): synthetic recovery checkpoint",
        commitShape: null,
      },
      async () => true,
      base,
    );
    assert.equal(drift.status, "incomplete");
    assert.equal(drift.effect, "none");
    assert.deepEqual(await gitBytes(root, ["rev-parse", "HEAD"]), before);
    await writeFile(path.join(root, archivePath, "design.md"), "# design.md\n");
    const checkpoint = await executeScopedCheckpoint(
      root,
      "main",
      {
        kind: "create-new",
        paths: authorized,
        commitMessage: "change(change-one): synthetic recovery checkpoint",
        commitShape: null,
      },
      async () => true,
      base,
    );
    assert.equal(checkpoint.status, "completed", JSON.stringify(checkpoint));
    assert.deepEqual(
      await gitBytes(root, ["show", `HEAD:${archivePath}/design.md`]),
      Buffer.from("# design.md\n"),
    );
    assert.deepEqual(
      await gitBytes(root, ["show", "HEAD:openspec/specs/fixture/spec.md"]),
      Buffer.from("# canonical after\n"),
    );
    assert.deepEqual(
      await Promise.all(refs.map((ref) => readFile(path.join(root, ref.path)))),
      savedMaterials,
    );
    await assert.rejects(
      gitBytes(root, ["show", "HEAD:openspec/changes/change-one/design.md"]),
    );
  } finally {
    await fixture.cleanup();
  }
});
