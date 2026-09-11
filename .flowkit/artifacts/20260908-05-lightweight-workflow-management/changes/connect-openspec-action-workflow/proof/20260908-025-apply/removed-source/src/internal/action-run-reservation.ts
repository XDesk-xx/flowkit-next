import { mkdir, readdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import {
  buildRunAddress,
  hasMatchingRunLinkage,
  isRunContextRecord,
  parseRunOccurrenceId,
  readDurableRun,
  type RunAddressInput,
  type RunContextRecord,
  type RunResultRecord,
} from "../domain/run-result-persistence.js";
import { actionTargetPath } from "./action-target-files.js";

export class ActionRunPersistenceError extends Error {
  readonly kind = "action-run-persistence-failed";
  constructor(
    readonly persistence: "none" | "incomplete" | "unconfirmed",
    readonly runId: string,
    cause: unknown,
  ) {
    super(`Run ${runId}: ${persistence}`, { cause });
    this.name = "ActionRunPersistenceError";
  }
}

/** The returned closure is held only by its live invocation, never reconstructed from a path. */
export async function reserveActionRun(
  input: RunAddressInput,
  prepared: RunContextRecord,
  actionMarkdown: string,
) {
  const address = buildRunAddress(input);
  if (
    address === null ||
    !isRunContextRecord(prepared) ||
    prepared.lifecycleState !== "prepared" ||
    prepared.runId !== address.runId ||
    prepared.actionIdentity.deliveryId !== input.deliveryId ||
    prepared.actionIdentity.changeId !== input.changeId ||
    typeof actionMarkdown !== "string" ||
    actionMarkdown.length === 0 ||
    Buffer.byteLength(actionMarkdown) > 65_536
  )
    throw new Error("Invalid Run reservation");
  let created = false;
  try {
    const relative = path
      .relative(address.repositoryRoot, address.runDirectory)
      .split(path.sep)
      .join("/");
    await actionTargetPath(address.repositoryRoot, relative, true);
    const entries = await readdir(address.changeRoot, { withFileTypes: true });
    const sequences = new Set<number>();
    for (const entry of entries) {
      const occurrence = parseRunOccurrenceId(entry.name);
      if (
        !entry.isDirectory() ||
        occurrence === null ||
        sequences.has(occurrence.sequence) ||
        occurrence.sequence === input.occurrence.sequence
      )
        throw new Error(`Run history conflict: ${entry.name}`);
      sequences.add(occurrence.sequence);
    }
    await mkdir(address.runDirectory);
    created = true;
    await writeFile(
      path.join(address.runDirectory, "action.md"),
      actionMarkdown,
      { flag: "wx" },
    );
  } catch (error) {
    throw new ActionRunPersistenceError(
      created ? "incomplete" : "none",
      address.runId,
      error,
    );
  }
  let consumed = false;
  return {
    address,
    async finish(context: RunContextRecord, result: RunResultRecord) {
      if (consumed)
        throw new ActionRunPersistenceError(
          "incomplete",
          address.runId,
          new Error("Reservation already consumed"),
        );
      consumed = true;
      let complete = false;
      try {
        if (
          !hasMatchingRunLinkage(context, result) ||
          !isDeepStrictEqual(
            { ...context, lifecycleState: "prepared" },
            prepared,
          )
        )
          throw new Error("Reservation context mismatch");
        for (const [name, value] of [
          ["context.json", context],
          ["result.json", result],
        ] as const) {
          const relative = path
            .relative(
              address.repositoryRoot,
              path.join(address.runDirectory, name),
            )
            .split(path.sep)
            .join("/");
          const target = await actionTargetPath(
            address.repositoryRoot,
            relative,
          );
          await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, {
            flag: "wx",
          });
        }
        complete = true;
        const record = await readDurableRun(input);
        if (!isDeepStrictEqual(record, { actionMarkdown, context, result }))
          throw new Error("Run readback mismatch");
        return record;
      } catch (error) {
        throw new ActionRunPersistenceError(
          complete ? "unconfirmed" : "incomplete",
          address.runId,
          error,
        );
      }
    },
  };
}
