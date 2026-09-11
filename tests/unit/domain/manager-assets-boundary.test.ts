import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  DELIVERY_OPERATIONS,
  canonicalDeliveryGuidancePath,
  readExactDeliveryGuidance,
  resolveActionGuidanceRef,
  resolveDeliveryGuidanceRef,
  resolveManagedTool,
} from "../../../src/domain/index.js";
import { loadManagerInstallation } from "../../../src/internal/manager-installation.js";

test("system assets relocate together; target collisions and absent runtime cannot select Guidance", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-split-assets-"));
  try {
    const source = loadManagerInstallation();
    const aRoot = path.join(root, "manager-a");
    await mkdir(aRoot);
    for (const entry of ["package.json", "skills", "config/tools"]) {
      await cp(path.join(source.root, entry), path.join(aRoot, entry), {
        recursive: true,
      });
    }
    const bRoot = path.join(root, "manager-b");
    await cp(aRoot, bRoot, { recursive: true });
    const a = loadManagerInstallation(aRoot),
      b = loadManagerInstallation(bRoot);
    const target = path.join(root, "target");
    await mkdir(path.join(target, "config/tools"), { recursive: true });
    await writeFile(
      path.join(target, "package.json"),
      '{"name":"target","version":"99"}',
    );
    await writeFile(
      path.join(target, "config/tools/toolchain.lock.json"),
      "invalid target lock",
    );
    assert.deepEqual(
      await resolveActionGuidanceRef(a, "apply"),
      await resolveActionGuidanceRef(b, "apply"),
    );
    for (const operation of DELIVERY_OPERATIONS) {
      const relative = canonicalDeliveryGuidancePath(operation)!;
      await mkdir(path.dirname(path.join(target, relative)), {
        recursive: true,
      });
      await writeFile(path.join(target, relative), "target conflict");
      const ref = await resolveDeliveryGuidanceRef(a, operation);
      assert.ok(ref);
      assert.deepEqual(ref, await resolveDeliveryGuidanceRef(b, operation));
      assert.deepEqual(
        await readExactDeliveryGuidance(a, ref),
        await readFile(path.join(aRoot, relative)),
      );
      await writeFile(path.join(aRoot, relative), "manager drift");
      assert.equal(await readExactDeliveryGuidance(a, ref), null);
      await rm(path.join(aRoot, relative));
      assert.equal(await resolveDeliveryGuidanceRef(a, operation), null);
    }
    await assert.rejects(
      resolveManagedTool({
        installation: b,
        flowkitHome: path.join(root, "missing-runtime"),
        toolId: "openspec",
      }),
      (error: any) => error.kind !== "invalid-lock",
    );
    await rm(path.join(bRoot, "config/tools/toolchain.lock.json"));
    await assert.rejects(
      resolveManagedTool({
        installation: b,
        flowkitHome: root,
        toolId: "openspec",
      }),
      (error: any) => error.kind === "invalid-lock",
    );
    await rm(path.join(aRoot, "skills/actions/apply/SKILL.md"));
    assert.equal(await resolveActionGuidanceRef(a, "apply"), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
