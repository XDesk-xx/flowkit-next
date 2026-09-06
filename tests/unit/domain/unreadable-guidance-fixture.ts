import { spawnSync } from "node:child_process";
import { chmod, lstat, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

interface UnreadableGuidanceFixtureInput {
  readonly root: string;
  readonly entry: string;
  readonly onCleanupOwnershipTaken: () => void;
  readonly assertUnreadable: () => Promise<void>;
}

interface SafeFixturePaths {
  readonly root: string;
  readonly entry: string;
  readonly originalBytes: Buffer;
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function resolveSafeFixturePaths(
  root: string,
  entry: string,
): Promise<SafeFixturePaths> {
  const temporaryRoot = await realpath(tmpdir());
  const resolvedRoot = await realpath(root);
  if (!isInside(temporaryRoot, resolvedRoot)) {
    throw new Error(
      `unreadable fixture root must be inside the OS temporary directory: ${resolvedRoot}`,
    );
  }

  const entryStat = await lstat(entry);
  if (!entryStat.isFile() || entryStat.isSymbolicLink()) {
    throw new Error(
      `unreadable fixture entry must be a regular file: ${entry}`,
    );
  }

  const resolvedEntry = await realpath(entry);
  if (!isInside(resolvedRoot, resolvedEntry)) {
    throw new Error(
      `unreadable fixture entry must remain inside its temporary root: ${resolvedEntry}`,
    );
  }

  return {
    root: resolvedRoot,
    entry: resolvedEntry,
    originalBytes: await readFile(resolvedEntry),
  };
}

function runNative(
  command: string,
  args: readonly string[],
  operation: string,
) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  if (result.error !== undefined) {
    const code = (result.error as NodeJS.ErrnoException).code;
    throw new Error(
      `${operation} failed to start: ${code ?? "UNKNOWN"}: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `${operation} exited ${result.status ?? "null"}; signal=${result.signal ?? "none"}; stdout=${JSON.stringify(result.stdout)}; stderr=${JSON.stringify(result.stderr)}`,
    );
  }
  return result.stdout;
}

function readCurrentWindowsSid(): string {
  const output = runNative(
    "whoami.exe",
    ["/user", "/fo", "csv", "/nh"],
    "resolve current Windows user SID",
  );
  const sid = output.match(/S-\d-\d+(?:-\d+)+/i)?.[0];
  if (sid === undefined) {
    throw new Error(
      `resolve current Windows user SID returned no SID: ${JSON.stringify(output)}`,
    );
  }
  return sid;
}

async function assertReadIsDenied(entry: string): Promise<void> {
  try {
    await readFile(entry);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EACCES" || code === "EPERM") return;
    throw new Error(
      `unreadable fixture direct read failed with non-permission outcome ${code ?? "UNKNOWN"}: ${String(error)}`,
    );
  }
  throw new Error(
    `unreadable fixture direct read unexpectedly succeeded: ${entry}`,
  );
}

async function assertWindowsMetadataRemainsReadable(
  root: string,
  entry: string,
): Promise<void> {
  const entryStat = await lstat(entry);
  if (!entryStat.isFile() || entryStat.isSymbolicLink()) {
    throw new Error(
      `Windows ACL fixture no longer resolves to a regular file: ${entry}`,
    );
  }
  const resolvedEntry = await realpath(entry);
  if (!isInside(root, resolvedEntry)) {
    throw new Error(
      `Windows ACL fixture realpath escaped its temporary root: ${resolvedEntry}`,
    );
  }
}

export async function withUnreadableGuidanceFixture({
  root,
  entry,
  onCleanupOwnershipTaken,
  assertUnreadable,
}: UnreadableGuidanceFixtureInput): Promise<void> {
  const safe = await resolveSafeFixturePaths(root, entry);
  const windows = process.platform === "win32";
  let sid: string | null = null;
  let mutationAttempted = false;
  let primaryError: unknown = null;
  let restorationError: unknown = null;

  try {
    onCleanupOwnershipTaken();
    sid = windows ? readCurrentWindowsSid() : null;
    mutationAttempted = true;
    if (windows) {
      runNative(
        "icacls.exe",
        [safe.entry, "/deny", `*${sid!}:(RD)`],
        "apply Windows read-data deny ACE",
      );
      await assertWindowsMetadataRemainsReadable(safe.root, safe.entry);
    } else {
      await chmod(safe.entry, 0o000);
    }

    await assertReadIsDenied(safe.entry);
    await assertUnreadable();
  } catch (error) {
    primaryError = error;
  } finally {
    if (mutationAttempted) {
      try {
        if (windows) {
          runNative(
            "icacls.exe",
            [safe.entry, "/remove:d", `*${sid!}`],
            "remove Windows deny ACE",
          );
        } else {
          await chmod(safe.entry, 0o600);
        }

        const restoredBytes = await readFile(safe.entry);
        if (!restoredBytes.equals(safe.originalBytes)) {
          restorationError = new Error(
            `unreadable fixture bytes changed while restoring normal read access: ${safe.entry}`,
          );
        }
      } catch (error) {
        restorationError = error;
      }
    }
  }

  if (restorationError === null) {
    try {
      await rm(safe.root, { recursive: true, force: true });
    } catch (error) {
      throw new AggregateError(
        primaryError === null ? [error] : [primaryError, error],
        `unreadable fixture cleanup failed; retained temporary root: ${safe.root}`,
      );
    }
  }

  if (restorationError !== null) {
    throw new AggregateError(
      primaryError === null
        ? [restorationError]
        : [primaryError, restorationError],
      `unreadable fixture restoration failed; retained temporary root: ${safe.root}`,
    );
  }
  if (primaryError !== null) throw primaryError;
}
