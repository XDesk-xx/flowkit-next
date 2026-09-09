import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function digest(file: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest("hex");
}

// Bind only explicitly named launch resources; do not enumerate node_modules
// or infer a command/dependency graph. A selected package includes its own
// implementation files, not merely its usually tiny bin/loader wrapper.
async function resourceDigest(file: string): Promise<string> {
  const resolved = await fs.realpath(file);
  const parts = resolved.split(path.sep);
  const at = parts.lastIndexOf("node_modules");
  if (at < 0) return digest(resolved);
  const count = parts[at + 1]?.startsWith("@") ? 3 : 2;
  const root = parts.slice(0, at + count).join(path.sep);
  const hash = createHash("sha256");
  async function visit(relative: string): Promise<void> {
    const target = path.join(root, relative);
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink())
      throw new Error("unsupported tool resource link");
    if (stat.isDirectory()) {
      const names = (await fs.readdir(target)).sort((a, b) =>
        Buffer.compare(Buffer.from(a), Buffer.from(b)),
      );
      for (const name of names)
        if (name !== "node_modules")
          await visit(relative ? relative + "/" + name : name);
    } else if (stat.isFile())
      hash.update(JSON.stringify([relative, await digest(target)]));
    else throw new Error("unsupported tool resource type");
  }
  await visit("");
  return hash.digest("hex");
}

export async function readFullTestToolMaterial(
  executable: string,
  cwd: string,
  args: readonly string[],
): Promise<unknown> {
  const resources: Array<{ argument: number; sha256: string }> = [];
  const node = /^node(?:\.exe)?$/i.test(path.basename(executable));
  const require = createRequire(path.join(cwd, "package.json"));
  let inline = false;
  let separator = false;
  let testRunner = false;
  // This is a bounded Node launch reader, not a generic CLI parser. Unknown
  // options must not let an option value masquerade as the entry point.
  const unsupported = () =>
    Object.assign(new Error("unsupported Node launch arguments"), {
      code: "FULL_TEST_NODE_ARGUMENTS_UNSUPPORTED",
    });
  for (let index = 0; node && index < args.length; index++) {
    const arg = args[index];
    if (!separator && ["-e", "--eval", "-p", "--print"].includes(arg)) {
      if (args[index + 1] === undefined) throw unsupported();
      inline = true;
      index++;
      continue;
    }
    if (!separator && /^(?:--eval|--print)=/.test(arg)) {
      inline = true;
      continue;
    }
    if (!separator && arg === "--") {
      separator = true;
      continue;
    }
    if (
      !separator &&
      ["--conditions", "-C", "--input-type"].includes(arg.split("=", 1)[0])
    ) {
      const value = arg.includes("=")
        ? arg.slice(arg.indexOf("=") + 1)
        : args[++index];
      if (!value || value.startsWith("-")) throw unsupported();
      continue;
    }
    if (
      !separator &&
      [
        "--test",
        "--version",
        "-v",
        "--check",
        "-c",
        "--no-warnings",
        "--trace-warnings",
        "--trace-uncaught",
      ].includes(arg)
    ) {
      if (arg === "--test") testRunner = true;
      continue;
    }
    const preload =
      !separator &&
      (["--import", "--require", "-r"].includes(arg) ||
        /^(?:--import|--require)=/.test(arg));
    let candidate: string;
    if (preload) {
      const specifier = arg.includes("=")
        ? arg.slice(arg.indexOf("=") + 1)
        : args[++index];
      if (!specifier) throw new Error("missing preload resource");
      if (specifier.startsWith("node:")) continue;
      candidate = specifier.startsWith("file:")
        ? fileURLToPath(specifier)
        : require.resolve(specifier);
    } else {
      if (!separator && arg.startsWith("-")) throw unsupported();
      // Node's first positional argument is the entry point (or argv for
      // inline code). Everything after it belongs to the program, not this
      // tool-identity reader. Never infer input/output roles from existence.
      if (inline) break;
      // Glob expansion in test mode belongs to Node and the project's input
      // contract. Explicit file operands still retain their resource binding.
      if (testRunner && /[*?]/.test(arg)) break;
      if (!arg || /[*?]/.test(arg) || arg.includes("\0")) throw unsupported();
      candidate = path.resolve(cwd, arg);
      try {
        if (!(await fs.stat(candidate)).isFile()) throw unsupported();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT")
          throw unsupported();
        throw error;
      }
    }
    resources.push({
      argument: index,
      sha256: await resourceDigest(candidate),
    });
    if (!preload) break;
  }
  return { executableSha256: await digest(executable), resources };
}
