import { spawnSync } from "node:child_process";
import path from "node:path";
const checks = [
  ["typecheck-02", "node", "node_modules/typescript/bin/tsc", "--noEmit"],
  ["build-02", "node", "scripts/build-production.mjs"],
  ["entropy-01", "node", "scripts/check-production-reachability.mjs"],
  ["entropy-tests-01", "node", "--test", "tests/unit/quality/production-reachability.test.mjs"],
  ["forbidden-01", "node", "scripts/check-forbidden-tracked-artifacts.mjs"],
  ["diff-01", "git", "diff", "--check", "HEAD"],
  ["strict-01", "node", "C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js", "validate", "connect-openspec-action-workflow", "--strict"],
];
let failed = false;
for (const args of checks) {
  const result = spawnSync(process.execPath, [path.join(import.meta.dirname, "capture.mjs"), ...args], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
