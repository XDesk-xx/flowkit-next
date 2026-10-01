import { spawn } from "node:child_process";

const FORBIDDEN_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".tmp",
]);
const FORBIDDEN_ROOTS = new Set(["tools", "runtime"]);
const FORBIDDEN_ARCHIVE_SUFFIXES = [
  ".node-modules.tar.gz",
  ".pnpm-store.tar.gz",
];

function isForbiddenTrackedPath(filePath) {
  const segments = filePath.split("/");
  if (segments.some((segment) => FORBIDDEN_SEGMENTS.has(segment))) return true;
  if (segments.length > 0 && FORBIDDEN_ROOTS.has(segments[0])) return true;

  const fileName = segments.at(-1) ?? "";
  return FORBIDDEN_ARCHIVE_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

const git = spawn("git", ["ls-files", "-z"], {
  stdio: ["ignore", "pipe", "pipe"],
});
const stdout = [];
const stderr = [];
git.stdout.on("data", (chunk) => stdout.push(chunk));
git.stderr.on("data", (chunk) => stderr.push(chunk));
const status = await new Promise((resolve, reject) => {
  git.on("error", reject);
  git.on("close", resolve);
});
if (status !== 0) {
  process.stderr.write(
    Buffer.concat(stderr).toString("utf8") || "git ls-files failed\n",
  );
  process.exit(status ?? 1);
}

const violations = Buffer.concat(stdout)
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .filter(isForbiddenTrackedPath)
  .sort();

if (violations.length > 0) {
  process.stderr.write("Forbidden tracked artifacts detected:\n");
  for (const filePath of violations) process.stderr.write(`- ${filePath}\n`);
  process.exit(1);
}
