import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const startedAt = new Date().toISOString();
const proofRoot = path.dirname(fileURLToPath(import.meta.url));
const managerRoot = "D:\\tools\\flowkit-manager\\node_modules\\flowkit-next";
const manager = await import(
  pathToFileURL(path.join(managerRoot, "dist/domain/index.js")).href,
);
const installationModule = await import(
  pathToFileURL(path.join(managerRoot, "dist/internal/manager-installation.js"))
    .href,
);
const installation = installationModule.loadManagerInstallation(managerRoot);
const deliveryId = "20260924-06-action-boundary-corrections";
const changeId = "harden-action-guidance-provenance";
const actionId = "review-apply";
const identity = { deliveryId, changeId, actionId };
const occurrence = { date: "20260924", sequence: 1, actionId };
const context = {
  runId: manager.formatRunOccurrenceId(occurrence),
  occurrence,
  actionIdentity: identity,
  role: "reviewer",
  lifecycleState: "prepared",
  ownerAuthority: null,
  previousRunId: null,
};
const current = { identity, state: "prepared" };
const real = await manager.resolveActionGuidanceRef(installation, actionId);
const other = await manager.resolveActionGuidanceRef(
  installation,
  "review-propose",
);
assert.ok(real && other);
const actualBytes = await readFile(
  path.join(managerRoot, ...real.path.split("/")),
);
assert.equal(
  real.contentSha256,
  createHash("sha256").update(actualBytes).digest("hex"),
);
assert.notEqual(real.contentSha256, other.contentSha256);

const forged = { path: real.path, contentSha256: "a".repeat(64) };
const wrongActionContent = {
  path: real.path,
  contentSha256: other.contentSha256,
};
const realPackage = manager.formActionPackage(current, context, real);
const forgedPackage = manager.formActionPackage(current, context, forged);
const wrongActionPackage = manager.formActionPackage(
  current,
  context,
  wrongActionContent,
);
assert.ok(realPackage);
assert.ok(forgedPackage);
assert.ok(wrongActionPackage);
assert.equal(manager.isActionPackage(forgedPackage), true);
const output = {
  fixture: "read-only in-memory ActionPackage formation; no target Run written",
  managerVersion: installation.version,
  actionId,
  actualGuidanceSha256: real.contentSha256,
  forgedSha256: forged.contentSha256,
  otherActionGuidanceSha256: other.contentSha256,
  realAccepted: realPackage !== null,
  forgedAccepted: forgedPackage !== null,
  wrongActionContentAccepted: wrongActionPackage !== null,
  forgedPackagePassesShapeValidator: manager.isActionPackage(forgedPackage),
};
const stdout = Buffer.from(`${JSON.stringify(output)}\n`, "utf8");
const stderr = Buffer.alloc(0);
await writeFile(path.join(proofRoot, "stdout.txt"), stdout, { flag: "wx" });
await writeFile(path.join(proofRoot, "stderr.txt"), stderr, { flag: "wx" });
await writeFile(
  path.join(proofRoot, "command.json"),
  `${JSON.stringify(
    {
      command: [process.execPath, fileURLToPath(import.meta.url)],
      startedAt,
      endedAt: new Date().toISOString(),
      exitCode: 0,
      managerRoot,
      purpose: "prove the current package-formation provenance gap",
    },
    null,
    2,
  )}\n`,
  { flag: "wx" },
);
process.stdout.write(stdout);
