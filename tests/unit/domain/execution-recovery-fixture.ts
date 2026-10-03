import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  writeDurableRun,
  type JsonObject,
} from "../../../src/domain/run-result-persistence.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";
import { sha256 } from "../../../src/cli/run-effective-facts.js";
import { contextFixture } from "./action-context-fixture.js";

const exec = promisify(execFile);
const entry = fileURLToPath(
  new URL("../../../src/cli/entrypoint.ts", import.meta.url),
);
const tsx = import.meta.resolve("tsx");
export const stages = [
  "explore",
  "review-explore",
  "propose",
  "review-propose",
  "apply",
  "review-apply",
] as const;
export async function executionFixture(last = 5) {
  const fixture = await contextFixture();
  const root = fixture.repositoryRoot;
  await gitBytes(root, ["init"]);
  await writeFile(
    path.join(root, ".gitattributes"),
    "* -text\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
  );
  const manifest = path.join(
    root,
    "openspec/delivery-groups/delivery-one.yaml",
  );
  const coordination = JSON.parse(await readFile(manifest, "utf8"));
  coordination.changes[0].projectOrdinal = 1;
  await writeFile(manifest, JSON.stringify(coordination));
  const source = "openspec/changes/change-one";
  await mkdir(path.join(root, source), { recursive: true });
  const planning: Record<string, string> = {};
  for (const name of ["proposal.md", "design.md", "tasks.md", "explore.md"]) {
    const relative = `${source}/${name}`;
    const bytes = Buffer.from(
      name === "tasks.md" ? "# Tasks\n- [x] synthetic task\n" : `# ${name}\n`,
    );
    await writeFile(path.join(root, relative), bytes);
    if (name !== "explore.md") planning[relative] = sha256(bytes);
  }
  await writeFile(path.join(root, "candidate.txt"), "candidate\n");
  const candidate = { "candidate.txt": sha256(Buffer.from("candidate\n")) };
  const base = {
    repositoryRoot: root,
    flowkitHome: fixture.flowkitHome,
    deliveryId: "delivery-one",
    changeId: "change-one",
  };
  let previous: string | null = null;
  for (let index = 0; index <= last; index++) {
    const actionId = stages[index];
    const occurrence = { date: "20260930", sequence: index + 1, actionId };
    const runId = `20260930-${String(index + 1).padStart(3, "0")}-${actionId}`;
    const actionIdentity = {
      deliveryId: base.deliveryId,
      changeId: base.changeId,
      actionId,
    };
    const reviewer = actionId.startsWith("review-");
    let facts: JsonObject = { proofRefs: [] };
    if (actionId === "explore")
      facts = {
        ...facts,
        exploreArtifact: `${source}/explore.md`,
        exploreSha256: sha256(
          await readFile(path.join(root, source, "explore.md")),
        ),
      };
    if (actionId === "propose") facts = { ...facts, artifactHashes: planning };
    if (actionId === "apply") facts = { ...facts, artifactHashes: candidate };
    if (reviewer) facts = { ...facts, reviewedRunId: previous };
    await writeDurableRun(
      { ...base, occurrence, changeStartSequence: 1 },
      {
        actionMarkdown:
          "# Synthetic predecessor fixture, no independent Review claim\n",
        context: {
          runId,
          occurrence,
          actionIdentity,
          previousRunId: previous,
          ownerAuthority: null,
          lifecycleState: "terminal",
          role: reviewer ? "reviewer" : "author",
        },
        result: {
          runId,
          actionIdentity,
          authorConclusion: reviewer ? null : "PASS",
          reviewerVerdict: reviewer ? "approved" : null,
          verificationVerdict: null,
          nextBoundary: null,
          facts,
        },
      },
    );
    previous = runId;
  }
  let callNumber = 0;
  async function call(command: string, value: unknown) {
    const childEnvironment = { ...process.env };
    delete childEnvironment.NODE_TEST_CONTEXT;
    const input = path.join(root, `request-${++callNumber}.json`);
    await writeFile(input, JSON.stringify(value));
    const visible =
      command === "change archive"
        ? [
            "--repository-root",
            root,
            "--delivery-id",
            base.deliveryId,
            "--change-id",
            base.changeId,
          ]
        : [];
    const result = await exec(
      process.execPath,
      [
        "--import",
        tsx,
        entry,
        ...command.split(" "),
        ...visible,
        "--input",
        input,
      ],
      {
        cwd: root,
        env: childEnvironment,
        timeout: 1_200_000,
        maxBuffer: 64 * 1024 * 1024,
      },
    ).catch((error: { message: string; stdout?: string }) => {
      error.message += "\n" + (error.stdout ?? "");
      throw error;
    });
    return JSON.parse(result.stdout);
  }
  return {
    ...fixture,
    base,
    source,
    planning,
    candidate,
    lastId: previous!,
    call,
  };
}
