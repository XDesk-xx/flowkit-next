import { spawnSync } from "node:child_process";

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

const git = spawnSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (git.status !== 0) {
  process.stderr.write(git.stderr || "git ls-files failed\n");
  process.exit(git.status ?? 1);
}

const violations = git.stdout
  .split("\0")
  .filter(Boolean)
  .filter(isForbiddenTrackedPath)
  .sort();

if (violations.length > 0) {
  process.stderr.write("Forbidden tracked artifacts detected:\n");
  for (const filePath of violations) process.stderr.write(`- ${filePath}\n`);
  process.exit(1);
}
