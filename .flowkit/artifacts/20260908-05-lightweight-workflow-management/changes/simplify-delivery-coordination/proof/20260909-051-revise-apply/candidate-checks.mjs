import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const prefix = process.argv[2];
if (!/^[a-z0-9-]+$/.test(prefix ?? "")) throw new Error("attempt label required");
// Ordinary candidate regression commands only: no Full Test coordinator, selection mutation or D05 result.
const config = JSON.parse(readFileSync("config/verification/full-test.json", "utf8"));
let failed = false;
for (const check of config.checks) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("./verify.mjs", import.meta.url)),
    prefix + "-" + check.checkId, process.execPath, ...check.args], {
    stdio: "inherit", windowsHide: true,
  });
  failed ||= result.status !== 0;
}
process.exitCode = failed ? 1 : 0;
