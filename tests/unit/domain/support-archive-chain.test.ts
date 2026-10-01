import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import {
  writeDurableRun,
  type JsonObject,
  type RunOccurrence,
} from "../../../src/domain/run-result-persistence.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import { contextFixture } from "./action-context-fixture.js";
import { openSpecArchiveDate } from "../../../src/internal/openspec-archive-date.js";

const run = promisify(execFile);
const entry = path.resolve("src/cli/entrypoint.ts");
const tsxImport = import.meta.resolve("tsx");

test("archive refuses an incomplete competing Run before changing OpenSpec", async () => {
  const fixture = await contextFixture();
  try {
    const root = fixture.repositoryRoot;
    await gitBytes(root, ["init"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/runs/** -text\n",
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
      if (actionId === "apply")
        facts = { artifactHashes: { "candidate.txt": sha } };
      if (actionId === "review-apply") facts = { reviewedRunId: previousRunId };
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
      `if(process.argv[2]==='archive'){const fs=require('node:fs'); const path=require('node:path');const root=process.cwd();const n=new Date();const date=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');const target=path.join(root,'openspec','changes','archive',date+'-'+process.argv[3]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(path.join(root,'openspec','changes',process.argv[3]),target);const file=path.join(root,'observation.json');const state=JSON.parse(fs.readFileSync(file));state.changes=[];fs.writeFileSync(file,JSON.stringify(state));process.exit(0)}\n${originalTool}`,
    );
    const base = {
      repositoryRoot: root,
      flowkitHome: fixture.flowkitHome,
      deliveryId: "delivery-one",
      changeId: "change-one",
    };
    const call = async (args: string[], name: string, value: unknown) => {
      const request = path.join(root, name);
      await writeFile(request, JSON.stringify(value));
      const output = await run(
        process.execPath,
        ["--import", tsxImport, entry, ...args, "--input", request],
        { cwd: root, timeout: 60_000 },
      );
      return JSON.parse(output.stdout) as Record<string, unknown>;
    };
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
    await mkdir(
      path.join(
        root,
        ".flowkit/runs/delivery-one/001-change-one/20261001-999-explore",
      ),
    );
    await assert.rejects(call(["status"], "invalid-chain-query.json", base));
    const archivePath = `openspec/changes/archive/${openSpecArchiveDate()}-001-change-one`;
    await assert.rejects(
      call(
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
      ),
      (error: unknown) => {
        const archived = JSON.parse(
          (error as { stdout?: string }).stdout ?? "{}",
        );
        return (
          archived.status === "incomplete" &&
          archived.effect === "none" &&
          archived.archivePath === null
        );
      },
    );
    assert.equal(
      (await readdir(path.join(root, "openspec/changes"))).includes(
        "change-one",
      ),
      true,
    );
    assert.equal(
      await lstat(path.join(root, archivePath)).catch(() => null),
      null,
    );
    await rm(
      path.join(
        root,
        ".flowkit/runs/delivery-one/001-change-one/20261001-999-explore",
      ),
      { recursive: true },
    );
    const accepted = await call(
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
      "archive-retry.json",
      { ...base, runId: started.runId },
    );
    assert.equal(accepted.status, "completed", JSON.stringify(accepted));
    assert.equal(accepted.archivePath, archivePath);
  } finally {
    await fixture.cleanup();
  }
});
