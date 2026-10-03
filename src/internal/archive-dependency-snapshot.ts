import {
  cp,
  lstat,
  readFile,
  readdir,
  readlink,
  realpath,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const bindings = [
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "pnpm-workspace.yaml",
  ".npmrc",
  "node_modules/.modules.yaml",
  "node_modules/.pnpm/lock.yaml",
  "node_modules/.pnpm-workspace-state-v1.json",
];
export async function dependencyInputHashes(root: string) {
  const hashes: Record<string, string | null> = {};
  for (const relative of bindings) {
    const file = path.join(root, relative);
    const stat = await lstat(file).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (stat === null) {
      hashes[relative] = null;
      continue;
    }
    if (!stat.isFile() || stat.isSymbolicLink())
      throw Error(`Unsupported dependency metadata: ${relative}`);
    hashes[relative] = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
  }
  return hashes;
}
function inside(root: string, file: string) {
  const relative = path.relative(root, file);
  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function generatedWslRoot(root: string) {
  const drive = /^([A-Za-z]):[\\/](.*)$/.exec(root);
  return drive
    ? `/mnt/${drive[1].toLowerCase()}/${drive[2].replaceAll("\\", "/")}`
    : null;
}

function nodePathEntries(line: string) {
  const assignment = /NODE_PATH\s*=\s*["']?([^"'\r\n]*)/.exec(line);
  if (!assignment) return [];
  const value = assignment[1];
  const entries: string[] = [];
  let start = 0;
  for (let index = 0; index < value.length; index++) {
    const driveColon =
      index === start + 1 &&
      /[A-Za-z]/.test(value[start]) &&
      /[\\/]/.test(value[index + 1] ?? "");
    if (value[index] === ";" || (value[index] === ":" && !driveColon)) {
      entries.push(value.slice(start, index));
      start = index + 1;
    }
  }
  entries.push(value.slice(start));
  return entries;
}

export function archiveChildEnvironment(scratch: boolean): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (
      key.toLowerCase() === "pnpm_config_verify_deps_before_run" ||
      (scratch && key.toUpperCase() === "NODE_PATH")
    )
      delete env[key];
  if (scratch) env.pnpm_config_verify_deps_before_run = "false";
  return env;
}

export async function copyArchiveDependencies(
  sourceRoot: string,
  scratch: string,
  workspaceModules: readonly string[] = [],
) {
  const roots: string[] = [];
  const mappings: { source: string; target: string; kind: string }[] = [];
  for (const relative of new Set(["node_modules", ...workspaceModules])) {
    const modules = path.join(sourceRoot, relative);
    if (
      !inside(sourceRoot, modules) ||
      path.basename(modules) !== "node_modules"
    )
      throw Error("Invalid dependency root");
    const stat = await lstat(modules).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (stat === null) continue;
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw Error("Unsupported source node_modules alias");
    // cp materializes hardlinked regular files as independent copies. Links are relocated separately.
    await cp(modules, path.join(scratch, relative), {
      recursive: true,
      force: false,
      verbatimSymlinks: true,
    });
    roots.push(path.join(scratch, relative));
  }
  async function relocate(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      const relative = path.relative(scratch, target);
      const source = path.join(sourceRoot, relative);
      if (entry.isSymbolicLink()) {
        const resolved = await realpath(source);
        if (!inside(sourceRoot, resolved))
          throw Error(`Dependency link escapes target: ${relative}`);
        const mapped = path.join(scratch, path.relative(sourceRoot, resolved));
        if (!inside(scratch, mapped))
          throw Error(`Dependency mapping escapes scratch: ${relative}`);
        const { unlink } = await import("node:fs/promises");
        const sourceLink = await readlink(source);
        await unlink(target);
        const directoryLink = (await lstat(resolved)).isDirectory();
        await symlink(
          path.isAbsolute(sourceLink) || process.platform === "win32"
            ? mapped
            : path.relative(path.dirname(target), mapped),
          target,
          directoryLink && process.platform === "win32"
            ? "junction"
            : directoryLink
              ? "dir"
              : "file",
        );
        mappings.push({
          source: relative,
          target: path.relative(scratch, mapped).replaceAll("\\", "/"),
          kind: "link",
        });
      } else if (entry.isDirectory()) await relocate(target);
      else if (entry.isFile() && relative.split(path.sep).includes(".bin")) {
        const bytes = await readFile(target);
        const text = bytes.toString("utf8");
        if (!Buffer.from(text).equals(bytes))
          throw Error(`Unsupported binary dependency shim: ${relative}`);
        let mapped = text;
        const roots = [
          [sourceRoot, scratch],
          [sourceRoot.replaceAll("\\", "/"), scratch.replaceAll("\\", "/")],
        ];
        const sourceWsl = generatedWslRoot(sourceRoot);
        const scratchWsl = generatedWslRoot(scratch);
        if (sourceWsl && scratchWsl) roots.push([sourceWsl, scratchWsl]);
        for (const [from, to] of roots) mapped = mapped.split(from).join(to);
        if (mapped !== text) {
          if (
            !text.includes("NODE_PATH") ||
            (!text.includes("basedir") && !text.includes("%~dp0"))
          )
            throw Error(`Unrecognized generated dependency shim: ${relative}`);
          await writeFile(target, mapped);
          mappings.push({
            source: relative,
            target: relative.replaceAll("\\", "/"),
            kind: "shim",
          });
        }
        for (const line of mapped
          .split(/\r?\n/)
          .filter((line) => line.includes("NODE_PATH"))) {
          if (
            nodePathEntries(line)
              .filter(
                (value) =>
                  value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value),
              )
              .some((value) => {
                const normalized = value.replaceAll("\\", "/");
                return (
                  !normalized.startsWith(scratch.replaceAll("\\", "/") + "/") &&
                  !(scratchWsl && normalized.startsWith(scratchWsl + "/"))
                );
              })
          )
            throw Error(
              `External absolute dependency shim reference: ${relative}`,
            );
        }
      } else if (!entry.isFile())
        throw Error(`Unsupported dependency entry: ${relative}`);
    }
  }
  for (const root of roots) await relocate(root);
  async function verify(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (!inside(scratch, await realpath(file)))
        throw Error(`Dependency snapshot escapes scratch: ${file}`);
      if (entry.isDirectory() && !entry.isSymbolicLink()) await verify(file);
    }
  }
  for (const root of roots) await verify(root);
  return mappings;
}

/** Source aliases are not executable input for convergence; workspace dependency links are mapped separately. */
export async function assertArchiveSourceFiles(
  directory: string,
): Promise<string[]> {
  const stat = await lstat(directory);
  if (stat.isSymbolicLink())
    throw Error(`Unsupported Archive source alias: ${directory}`);
  if (stat.isDirectory()) {
    if (path.basename(directory) === "node_modules") return [directory];
    const modules: string[] = [];
    for (const name of await readdir(directory))
      modules.push(
        ...(await assertArchiveSourceFiles(path.join(directory, name))),
      );
    return modules;
  } else if (!stat.isFile())
    throw Error(`Unsupported Archive source entry: ${directory}`);
  return [];
}
