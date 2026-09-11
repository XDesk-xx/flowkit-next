import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";

export async function contextFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-context-"));
  const repositoryRoot = path.join(root, "target");
  const flowkitHome = path.join(root, "home");
  await mkdir(repositoryRoot);
  const runtime = path.join(flowkitHome, "tools", "openspec", "1.10.0");
  await mkdir(path.join(runtime, "bin"), { recursive: true });
  await writeFile(
    path.join(runtime, "package.json"),
    JSON.stringify({ name: "@fission-ai/openspec", version: "1.10.0" }),
  );
  await writeFile(
    path.join(runtime, "bin", "openspec.js"),
    `
const fs = require('node:fs');
const path = require('node:path');
const state = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'observation.json')));
const args = process.argv.slice(2);
console.log(JSON.stringify(args[0] === 'list' ? {
  root: { path: state.root }, changes: state.changes.map(name => ({ name }))
} : { root: { path: state.root }, changeName: args[2], schemaName: 'spec-driven',
  changeRoot: path.join(state.root, 'openspec/changes', args[2]), isPlanningComplete: true,
  isComplete: false, artifacts: [] }));
`,
  );
  async function observe(changes: string[], reportedRoot = repositoryRoot) {
    await writeFile(
      path.join(repositoryRoot, "observation.json"),
      JSON.stringify({ changes, root: reportedRoot }),
    );
  }
  async function manifest(
    deliveryId = "delivery-one",
    changeId = "change-one",
    state = "active",
    activation = true,
    dependsOn: string[] = [],
  ) {
    const dir = path.join(repositoryRoot, "openspec", "delivery-groups");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${deliveryId}.yaml`),
      JSON.stringify({
        id: deliveryId,
        changes: [{ id: changeId, state, dependsOn }],
        ownerDecisions: activation
          ? [
              {
                ref: `owner:${"a".repeat(64)}`,
                decision: "activate-change",
                deliveryId,
                changeId,
                sourceRef: "fixture-owner",
                scope: ["explore"],
              },
            ]
          : [],
      }),
    );
  }
  await observe(["change-one"]);
  await manifest();
  return {
    root,
    repositoryRoot,
    flowkitHome,
    installation: loadManagerInstallation(),
    observe,
    manifest,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
