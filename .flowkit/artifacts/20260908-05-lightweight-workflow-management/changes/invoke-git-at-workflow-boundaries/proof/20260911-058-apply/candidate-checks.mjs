import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const prefix = process.argv[2];
if (!/^[a-z0-9-]+$/.test(prefix ?? "")) throw Error("attempt label required");
// Ordinary current-code regressions, not the D05 Full Test coordinator or a Full Test Run.
const config = JSON.parse(readFileSync("config/verification/full-test.json", "utf8"));
let failed = false;
for (const check of config.checks) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("./capture.mjs", import.meta.url)), prefix + "-" + check.checkId,
    process.execPath, ...check.args], { stdio: "inherit", windowsHide: true });
  failed ||= result.status !== 0;
}
process.exitCode = failed ? 1 : 0;
