import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertManagedEvidenceGitBytes } from "./managed-evidence-git.js";

async function diagnosticDirectory(root: string, relative: string) {
  let component = root;
  for (const segment of relative.split("/")) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      segment.includes("\\")
    )
      throw Error("Invalid Archive diagnostic directory");
    component = path.join(component, segment);
    const stat = await lstat(component).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      },
    );
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
      throw Error(`Unsupported Archive diagnostic directory: ${relative}`);
  }
}

export async function archiveDiagnosticAttempt(
  root: string,
  deliveryId: string,
  group: string,
  identity: object,
) {
  const relative = `.flowkit/artifacts/${deliveryId}/changes/${group}/archive-diagnostics/${randomUUID()}`;
  await assertManagedEvidenceGitBytes(root, `${relative}/attempt.json`);
  await diagnosticDirectory(root, relative);
  await mkdir(path.join(root, relative), { recursive: true });
  await writeFile(
    path.join(root, relative, "attempt.json"),
    JSON.stringify(identity, null, 2) + "\n",
    { flag: "wx" },
  );
  return relative;
}

/** Archive-only subprocess capture, bounded raw streams and create-once diagnostics. */
export async function runArchiveProcess(
  root: string,
  attempt: string,
  id: string,
  program: string,
  args: readonly string[],
  cwd: string,
  options: {
    timeout: number;
    shell?: boolean;
    env?: NodeJS.ProcessEnv;
    limit?: number;
  },
) {
  if (!/^[a-z0-9:-]+$/.test(id))
    throw Error("Invalid Archive diagnostic command id");
  const relative = `${attempt}/commands/${encodeURIComponent(id)}`;
  const directory = path.join(root, relative);
  await diagnosticDirectory(root, relative);
  for (const file of ["stdout.txt", "stderr.txt", "command.json"])
    await assertManagedEvidenceGitBytes(root, `${relative}/${file}`);
  const stdout = await (async () => {
    try {
      await mkdir(directory, { recursive: true });
      return await open(path.join(directory, "stdout.txt"), "wx");
    } catch (error) {
      throw Error(
        `Archive diagnostic storage failed: ${relative}: ${String(error)}`,
      );
    }
  })();
  let stderr;
  try {
    stderr = await open(path.join(directory, "stderr.txt"), "wx");
  } catch (error) {
    await stdout.close();
    throw Error(
      `Archive diagnostic storage failed: ${relative}: ${String(error)}`,
    );
  }
  const startedAt = new Date().toISOString();
  let exitCode: number | null = null;
  let signal: string | null = null;
  let spawnError: string | null = null;
  let saveError: string | null = null;
  let timeout = false;
  const truncated = { stdout: false, stderr: false };
  const limit = options.limit ?? 16 * 1024 * 1024;
  try {
    const child = spawn(program, [...args], {
      cwd,
      env: options.env,
      shell: options.shell ?? false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stopping = false;
    const stop = () => {
      if (stopping) return;
      stopping = true;
      if (process.platform === "win32" && child.pid !== undefined) {
        const killer = spawn(
          "taskkill",
          ["/pid", String(child.pid), "/T", "/F"],
          { windowsHide: true, stdio: "ignore" },
        );
        killer.on("error", () => child.kill());
        killer.on("close", (code) => {
          if (code !== 0) child.kill();
        });
      } else child.kill();
    };
    const timer = setTimeout(() => {
      timeout = true;
      stop();
    }, options.timeout);
    const closed = new Promise<void>((resolve) => {
      child.on("error", (error) => {
        spawnError = error.message;
      });
      child.on("close", (code, terminated) => {
        exitCode = code;
        signal = terminated;
        clearTimeout(timer);
        resolve();
      });
    });
    async function collect(
      stream: AsyncIterable<Buffer>,
      handle: typeof stdout,
      name: "stdout" | "stderr",
    ) {
      let size = 0;
      try {
        for await (const bytes of stream) {
          const remaining = Math.max(0, limit - size);
          if (remaining) await handle.writeFile(bytes.subarray(0, remaining));
          size += bytes.length;
          if (size > limit) {
            truncated[name] = true;
            stop();
          }
        }
        await handle.sync();
      } catch (error) {
        saveError = String(error);
        stop();
      }
    }
    await Promise.all([
      closed,
      collect(child.stdout, stdout, "stdout"),
      collect(child.stderr, stderr, "stderr"),
    ]);
  } catch (error) {
    spawnError = String(error);
  } finally {
    await stdout.close();
    await stderr.close();
  }
  const status =
    spawnError !== null ||
    saveError !== null ||
    timeout ||
    truncated.stdout ||
    truncated.stderr ||
    signal !== null ||
    exitCode === null
      ? "process-failed"
      : exitCode === 0
        ? "passed"
        : "failed";
  const command = {
    id,
    program,
    args,
    cwd,
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode,
    signal,
    spawnError,
    saveError,
    timeout,
    truncated,
    status,
    stdout: `${relative}/stdout.txt`,
    stderr: `${relative}/stderr.txt`,
  };
  try {
    await writeFile(
      path.join(directory, "command.json"),
      JSON.stringify(command, null, 2) + "\n",
      { flag: "wx" },
    );
  } catch (error) {
    throw Error(
      `Archive diagnostic storage unconfirmed: ${relative}: ${String(error)}`,
    );
  }
  if (status !== "passed")
    throw Error(`Archive ${status}: ${relative}/command.json`);
  return { path: `${relative}/command.json`, command };
}
