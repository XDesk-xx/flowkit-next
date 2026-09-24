import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  PRODUCTION_ROOTS,
  analyzeProductionReachability,
  readDependencyGraph,
} from "../scripts/check-production-reachability.mjs";

const root = "D:\\Projects\\flowkit-next";
const deliveryId = "20260924-06-action-boundary-corrections";
const changeId = "recognize-prepared-correction-production-entrypoint";
const runId = "20260925-032-explore";
const modulePath = "src/cli/prepared-owner-correction-start.ts";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ref = async (relative) => {
  const bytes = await readFile(path.join(root, relative));
  return { path: relative, bytes: bytes.length, sha256: digest(bytes) };
};
const manifest = await readFile(path.join(root, "openspec", "delivery-groups", `${deliveryId}.yaml`), "utf8");
assert.match(manifest, /fullTestStatus: "failed"/);
assert.match(manifest, /fullTestAttempt: "c5b6c820-5d84-4bfc-a77d-d7493e246adc"/);
assert.match(manifest, /id: "recognize-prepared-correction-production-entrypoint"[\s\S]*?state: active\n    projectOrdinal: 43/);
const spec = await readFile(path.join(root, "openspec/specs/repository-entropy-hygiene/spec.md"), "utf8");
assert.match(spec, /The exact current production roots SHALL be:[\s\S]*?src\/cli\/entrypoint\.ts[\s\S]*?src\/domain\/index\.ts/);
assert.deepEqual(PRODUCTION_ROOTS, ["src/cli/entrypoint.ts", "src/domain/index.ts"]);
for (const skill of ["revise-explore", "revise-propose", "revise-apply"]) {
  const body = await readFile(path.join(root, "skills/actions", skill, "SKILL.md"), "utf8");
  assert.ok(body.includes("dist/cli/prepared-owner-correction-start.js"), skill);
}
assert.equal((await stat(path.join(root, "dist/cli/prepared-owner-correction-start.js"))).isFile(), true);
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
assert.ok(packageJson.files.includes("dist/"));
const graph = readDependencyGraph(root);
const baseline = analyzeProductionReachability(graph);
assert.deepEqual(baseline.unreachable, [modulePath]);
const corrected = analyzeProductionReachability(graph, [...PRODUCTION_ROOTS, modulePath]);
assert.equal(corrected.total, baseline.total);
assert.equal(corrected.reachable.length, corrected.total);
assert.deepEqual(corrected.unreachable, []);
const proofRoot = path.join(root, ".flowkit", "artifacts", deliveryId,
  "changes", changeId, "proof", runId);
await mkdir(proofRoot, { recursive: true });
const proofScript = path.join(proofRoot, "probe-production-entrypoint.mjs");
await copyFile(new URL(import.meta.url), proofScript, constants.COPYFILE_EXCL);
const observed = {
  kind: "bounded-explore-production-entrypoint-proof",
  deliveryId, changeId, runId,
  currentRoots: PRODUCTION_ROOTS,
  candidateDirectEntry: modulePath,
  baseline: { total: baseline.total, reachable: baseline.reachable.length,
    unreachable: baseline.unreachable },
  withExactDirectEntry: { total: corrected.total,
    reachable: corrected.reachable.length, unreachable: corrected.unreachable },
  directConsumers: ["skills/actions/revise-explore/SKILL.md",
    "skills/actions/revise-propose/SKILL.md", "skills/actions/revise-apply/SKILL.md"],
  sourceRefs: await Promise.all([
    "openspec/specs/repository-entropy-hygiene/spec.md",
    "scripts/check-production-reachability.mjs",
    modulePath,
    "skills/actions/revise-explore/SKILL.md",
    "skills/actions/revise-propose/SKILL.md",
    "skills/actions/revise-apply/SKILL.md",
    `.flowkit/artifacts/${deliveryId}/full-test/c5b6c820-5d84-4bfc-a77d-d7493e246adc/checks/entropy/stderr.txt`,
  ].map(ref)),
  limits: ["The third-root graph is an Explore counterfactual, not a changed product contract or Full Test PASS.",
    "No production or canonical spec bytes were mutated by this proof."],
};
const file = path.join(proofRoot, "production-entrypoint-observation.json");
await writeFile(file, `${JSON.stringify(observed, null, 2)}\n`, { flag: "wx" });
assert.deepEqual(JSON.parse(await readFile(file, "utf8")), observed);
process.stdout.write(JSON.stringify({ proofRoot, baseline: observed.baseline,
  withExactDirectEntry: observed.withExactDirectEntry }) + "\n");
