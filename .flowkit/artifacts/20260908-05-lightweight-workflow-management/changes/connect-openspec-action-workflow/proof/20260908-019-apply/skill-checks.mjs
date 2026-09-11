import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const product = ["explore", "propose", "apply", "revise-explore", "revise-propose", "revise-apply", "archive", "review-explore", "review-propose", "review-apply"];
const bootstrap = ["explore-proof-based", "proposal-convergence", "implementation-convergence", "revise-explore", "revise-propose", "revise-apply", "archive", "review-explore", "review-propose", "review-apply"];
const roots = [...product.map(name => "skills/actions/" + name), ...bootstrap.map(name => ".agents/skills/" + name), "skills/tools/openspec"];
const result = [];
for (const root of roots) {
  const bytes = fs.readFileSync(root + "/SKILL.md");
  const run = spawnSync("python", ["-X", "utf8", "C:/Users/xuser/.codex/skills/.system/skill-creator/scripts/quick_validate.py", root]);
  const name = root.replaceAll("/", "-").replaceAll(".", "");
  for (const stream of ["stdout", "stderr"]) fs.writeFileSync(path.join(import.meta.dirname, name + "." + stream + ".txt"), run[stream] ?? Buffer.alloc(0), { flag: "wx" });
  result.push({ root, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), exitCode: run.status, error: run.error?.message ?? null });
}
fs.writeFileSync(path.join(import.meta.dirname, "skill-validation.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(result));
process.exitCode = result.every(item => item.exitCode === 0) ? 0 : 1;
