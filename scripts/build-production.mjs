import { lstat, realpath, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const output = path.join(root, "dist");
const info = await lstat(output).catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return null;
});
if (info !== null) {
  if (
    !info.isDirectory() ||
    info.isSymbolicLink() ||
    (await realpath(output)) !== output
  ) {
    throw new Error("Refusing to clean a non-canonical dist directory");
  }
  await rm(output, { recursive: true });
}
const result = spawnSync(
  process.execPath,
  [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "-p",
    "tsconfig.build.json",
  ],
  { cwd: root, stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
