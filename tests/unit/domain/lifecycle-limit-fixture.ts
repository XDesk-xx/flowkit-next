import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { contextFixture } from "./action-context-fixture.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

const exec = promisify(execFile);
const sourceEntry = fileURLToPath(
  new URL("../../../src/cli/entrypoint.ts", import.meta.url),
);
export function limitCli(
  target: { repositoryRoot: string },
  timeout = 120_000,
) {
  let number = 0;
  return async (command: string, request: unknown, accepted = true) => {
    const input = path.join(
      target.repositoryRoot,
      `limit-request-${++number}.json`,
    );
    await writeFile(input, JSON.stringify(request));
    const entry = process.env.FLOWKIT_APPLY_TEST_ENTRY ?? sourceEntry;
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const args = [
      ...(entry.endsWith(".ts")
        ? ["--import", import.meta.resolve("tsx")]
        : []),
      entry,
      ...command.split(" "),
      "--input",
      input,
    ];
    try {
      const result = await exec(process.execPath, args, {
        cwd: target.repositoryRoot,
        env,
        timeout,
        maxBuffer: 8 * 1024 * 1024,
      });
      if (!accepted) throw Error("Rejected command unexpectedly accepted");
      return JSON.parse(result.stdout);
    } catch (error) {
      if (accepted) throw error;
      const stdout = (error as { stdout?: string }).stdout;
      if (!stdout) throw error;
      return JSON.parse(stdout);
    }
  };
}

export async function freshFixture() {
  const f = await contextFixture();
  await gitBytes(f.repositoryRoot, ["init"]);
  await writeFile(
    path.join(f.repositoryRoot, ".gitattributes"),
    "* -text\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
  );
  await mkdir(path.join(f.repositoryRoot, ".flowkit"));
  await writeFile(
    path.join(f.repositoryRoot, ".flowkit/project.json"),
    JSON.stringify({
      formatVersion: 1,
      projectId: "fresh-project",
      repository: "synthetic:limit-fixture",
      runtimeFamily: "new",
      state: "initialized",
    }),
  );
  await mkdir(path.join(f.repositoryRoot, "openspec/changes/change-one"), {
    recursive: true,
  });
  const base = {
    repositoryRoot: f.repositoryRoot,
    flowkitHome: f.flowkitHome,
    deliveryId: "delivery-one",
    changeId: "change-one",
  };
  const manifestPath = path.join(
    f.repositoryRoot,
    "openspec/delivery-groups/delivery-one.yaml",
  );
  const manifest = async () => JSON.parse(await readFile(manifestPath, "utf8"));
  const assign = async (value: number) => {
    const document = await manifest();
    document.changes[0].projectOrdinal = value;
    await writeFile(manifestPath, JSON.stringify(document));
  };
  return {
    ...f,
    base,
    manifestPath,
    getManifest: manifest,
    assign,
    call: limitCli(f),
  };
}
