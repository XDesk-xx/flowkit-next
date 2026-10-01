import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const excludedRoots = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".tmp",
  ".flowkit",
  "openspec",
  "architecture",
]);
const executableSuffix =
  /\.(?:ts|mts|cts|tsx|js|mjs|cjs|jsx|py|ps1|sh|cmd|bat)$/i;
const checkedTs = /^(?:src|tests)\/(?:.+\/)?.+\.ts$/;
const legacy = new Map([
  [
    "dependency-cruiser.config.mjs",
    "b2faff94dd1bb58d59f645ebdde50788c976da9ff638ba3c5ce16500e256b833",
  ],
  [
    "eslint.config.mjs",
    "03d491ab3aa03396a4780763cfb99bfdfb0edac71e22239964423f30047ccadd",
  ],
  [
    "scripts/build-production.mjs",
    "6984d2ea55d874885731d2b6217bf9d10b8c77788648eebcc744862f1ca5df2b",
  ],
  [
    "scripts/check-forbidden-tracked-artifacts.mjs",
    "e374240c147051b9abef1e8f16ca9bf9ea28976929f5a8cf866ffc5c935d1e16",
  ],
  [
    "scripts/check-production-reachability.mjs",
    "3fda79c8084234030a03184e9f490641124e26cb90e8c4d7ac085e7571107294",
  ],
  [
    "skills/delivery/repository-integration/references/git-host.mjs",
    "cd57ff06916b35d8b68ea92734b4e6c3c46ba9cf492ece101f1574713434313b",
  ],
  [
    "tests/unit/quality/production-reachability.test.mjs",
    "1ea696ce7575ba5ec9097635683390e34aa38837e54d9b817d67cde16e504ec2",
  ],
]);

async function violations(root: string): Promise<string[]> {
  const failures: string[] = [];
  async function visit(relative: string): Promise<void> {
    const directory = path.join(root, ...relative.split("/").filter(Boolean));
    for (const entry of (
      await readdir(directory, { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (!relative && excludedRoots.has(entry.name)) continue;
      if (
        name === "skills/vendors/openspec" ||
        name.startsWith("skills/vendors/openspec/")
      )
        continue;
      if (entry.isSymbolicLink()) {
        failures.push(`linked source entry: ${name}`);
        continue;
      }
      if (entry.isDirectory()) {
        await visit(name);
        continue;
      }
      if (!entry.isFile()) {
        failures.push(`unsupported source entry: ${name}`);
        continue;
      }
      const bytes = await readFile(path.join(root, ...name.split("/")));
      const executable =
        executableSuffix.test(name) || bytes.subarray(0, 2).toString() === "#!";
      if (!executable || checkedTs.test(name)) continue;
      const expected = legacy.get(name);
      const actual = createHash("sha256").update(bytes).digest("hex");
      if (expected !== actual)
        failures.push(`uncovered executable source: ${name}`);
    }
  }
  await visit("");
  return failures;
}

test("current owned executable sources are checked TS or exact legacy bytes", async () => {
  assert.deepEqual(await violations(repositoryRoot), []);
});

test("untracked helpers in old blind spots and changed legacy JS are rejected", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-owned-source-"));
  try {
    await mkdir(path.join(root, "src"));
    await writeFile(
      path.join(root, "src", "valid.ts"),
      "export const valid = true;\n",
    );
    await mkdir(path.join(root, "dist"));
    await writeFile(
      path.join(root, "dist", "valid.js"),
      "export const valid = true;\n",
    );
    assert.deepEqual(await violations(root), []);
    for (const name of [
      "scripts/new.mjs",
      "skills/new.js",
      "new.py",
      "extra/new.ts",
    ]) {
      const file = path.join(root, ...name.split("/"));
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, "export const unchecked = true;\n");
    }
    const changed = path.join(root, "scripts", "build-production.mjs");
    await writeFile(changed, "// changed legacy entry\n");
    assert.deepEqual(await violations(root), [
      "uncovered executable source: extra/new.ts",
      "uncovered executable source: new.py",
      "uncovered executable source: scripts/build-production.mjs",
      "uncovered executable source: scripts/new.mjs",
      "uncovered executable source: skills/new.js",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
