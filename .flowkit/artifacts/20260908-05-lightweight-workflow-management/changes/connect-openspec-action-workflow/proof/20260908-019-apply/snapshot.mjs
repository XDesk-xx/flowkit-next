import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const base = import.meta.dirname;
const gitLines = args => execFileSync("git", args, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const names = [...new Set([
  ...gitLines(["diff", "--name-only"]),
  ...gitLines(["ls-files", "--others", "--exclude-standard", "src", "tests", "openspec/changes/connect-openspec-action-workflow"]),
])].sort();
const identity = name => {
  const bytes = fs.readFileSync(name);
  return { path: name.replaceAll("\\", "/"), bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    lines: bytes.toString("utf8").split("\n").length - (bytes.at(-1) === 10 ? 1 : 0) };
};
const files = names.map(identity);
const source = files.filter(file => /^(src|tests)\/.+\.(ts|mjs)$/.test(file.path));
const overLimit = source.filter(file => file.lines > 650);
const checks = fs.readdirSync(base, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(base, entry.name, "command.json")))
  .map(entry => {
    const name = path.relative(process.cwd(), path.join(base, entry.name, "command.json"));
    const record = JSON.parse(fs.readFileSync(name, "utf8"));
    for (const key of ["stdout", "stderr"]) {
      const actual = identity(record[key].path);
      if (actual.bytes !== record[key].bytes || actual.sha256 !== record[key].sha256) throw new Error("stream drift: " + name);
    }
    return { ...identity(name), exitCode: record.exitCode, error: record.error };
  });
const packages = [".tmp/connect-action-manager.tgz", ".tmp/connect-action-manager-02.tgz"].map(identity);
let installedFiles = 0;
const installedRoot = ".tmp/connect-action-live/manager-02";
function verifyInstalled(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) verifyInstalled(file);
    else {
      const relative = path.relative(installedRoot, file);
      if (!fs.readFileSync(file).equals(fs.readFileSync(relative))) throw new Error("Installed payload drift: " + relative);
      installedFiles++;
    }
  }
}
for (const directory of ["dist", "skills", "config"]) verifyInstalled(path.join(installedRoot, directory));
const result = {
  recordedAt: new Date().toISOString(),
  head: gitLines(["rev-parse", "HEAD"])[0],
  branch: gitLines(["branch", "--show-current"])[0],
  meaning: "Current uncommitted inventory, not Git permission or a Full Test snapshot. Initial manifest/planning/Run dirt preserved.",
  files, checks, packages, installedPayload: { installation: installedRoot, currentByteEqualFiles: installedFiles },
  fileGate: { limit: 650, includesBlankAndCommentLines: true, changedSourceFiles: source.length,
    maxLines: Math.max(...source.map(file => file.lines)), overLimit,
    untouchedBaseline: "tests/unit/domain/delivery-operation-execution.test.ts is pre-existing 678 lines; unchanged, not waived or expanded" },
};
fs.writeFileSync(path.join(base, "candidate-inventory.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ files: files.length, checks: checks.length, fileGate: result.fileGate }));
process.exitCode = overLimit.length ? 1 : 0;
