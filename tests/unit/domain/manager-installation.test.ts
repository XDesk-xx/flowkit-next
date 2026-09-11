import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  loadManagerInstallation,
  ManagerInstallationError,
} from "../../../src/internal/manager-installation.js";

test("installation metadata belongs to the loaded package, not cwd", async () => {
  const installation = loadManagerInstallation();
  assert.equal(installation.name, "flowkit-next");
  assert.equal(
    installation.version,
    JSON.parse(
      await readFile(path.join(installation.root, "package.json"), "utf8"),
    ).version,
  );
  assert(path.isAbsolute(installation.root));
  assert(Object.isFrozen(installation));
});

test("trusted installations relocate without depending on target metadata", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-installation-"));
  try {
    for (const name of ["manager-a", "manager-b", "target"]) {
      await mkdir(path.join(root, name));
      await writeFile(
        path.join(root, name, "package.json"),
        JSON.stringify({
          name: name === "target" ? "unrelated-target" : "flowkit-fixture",
          version: "2.0.0",
        }),
      );
    }
    const a = loadManagerInstallation(path.join(root, "manager-a"));
    const b = loadManagerInstallation(path.join(root, "manager-b"));
    assert.equal(a.name, b.name);
    assert.equal(a.version, b.version);
    assert.notEqual(a.root, b.root);
    assert.throws(
      () => loadManagerInstallation(path.join(root, "missing")),
      ManagerInstallationError,
    );
    await writeFile(path.join(root, "manager-a", "package.json"), "{}");
    assert.throws(
      () => loadManagerInstallation(a.root),
      ManagerInstallationError,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
