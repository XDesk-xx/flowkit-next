import { resolveRunChain } from "../cli/current-run-chain.js";
import {
  isRunSequence,
  parseDurableRunTexts,
  parseRunOccurrenceId,
  type DurableRunRecord,
} from "../domain/run-result-persistence.js";
import { gitBytes } from "./git-checkpoint-scope.js";
import type { CheckpointCandidateTree } from "./checkpoint-candidate-tree.js";

function utf8(bytes: Buffer): string {
  const value = bytes.toString("utf8");
  if (!Buffer.from(value).equals(bytes)) throw Error("Invalid Run index UTF-8");
  return value;
}

export async function readCandidateRunChain(
  root: string,
  deliveryId: string,
  changeId: string,
  tree?: CheckpointCandidateTree,
): Promise<{
  records: DurableRunRecord[];
  tip: DurableRunRecord;
  runRoot: string;
  bytesByPath: Map<string, Buffer>;
}> {
  const deliveryRoot = `.flowkit/runs/${deliveryId}`;
  const listing = utf8(
    tree === undefined
      ? await gitBytes(root, [
          "ls-files",
          "--stage",
          "-z",
          "--",
          `:(glob)${deliveryRoot}/*-${changeId}/**`,
          `:(literal)${deliveryRoot}/${changeId}`,
        ])
      : Buffer.from(
          [...tree.entries]
            .filter(
              ([name]) =>
                name.startsWith(deliveryRoot + "/") &&
                (name.split("/")[3] === changeId ||
                  name.split("/")[3].endsWith(`-${changeId}`)),
            )
            .map(
              ([name, entry]) =>
                `${entry.mode} ${entry.objectId === "projected-raw" ? "0".repeat(40) : entry.objectId} 0\t${name}\0`,
            )
            .join(""),
        ),
  );
  if (listing && !listing.endsWith("\0"))
    throw Error("Invalid Run index listing");
  const selected = new Map<string, string>();
  const groups = new Set<string>();
  for (const line of listing ? listing.slice(0, -1).split("\0") : []) {
    const entry = /^(\d{6}) ([a-f0-9]{40,64}) ([0-3])\t(.+)$/u.exec(line);
    if (!entry) throw Error("Invalid Run index entry");
    const [, mode, , stage, name] = entry;
    const parts = name.split("/");
    if (parts.length < 4 || parts.slice(0, 3).join("/") !== deliveryRoot)
      throw Error(`Invalid Run index path: ${name}`);
    const group = parts[3]!;
    if (group !== changeId && !/^\d{3,}-.+$/u.test(group)) continue;
    if (group !== changeId && !group.endsWith(`-${changeId}`)) continue;
    groups.add(group);
    if (
      parts.length !== 6 ||
      !["action.md", "context.json", "result.json"].includes(parts[5]!) ||
      !["100644", "100755"].includes(mode!) ||
      stage !== "0" ||
      selected.has(name)
    )
      throw Error(`Invalid Run index entry: ${name}`);
    selected.set(name, parts[4]!);
  }
  if (groups.size !== 1)
    throw Error(`Candidate Run group unavailable or ambiguous: ${changeId}`);
  const group = [...groups][0]!;
  const match = /^(\d{3,})-(.+)$/u.exec(group);
  const sequence = Number(match?.[1]);
  if (
    !match ||
    match[2] !== changeId ||
    !isRunSequence(sequence) ||
    String(sequence).padStart(3, "0") !== match[1]
  )
    throw Error(`Invalid canonical Run group: ${group}`);
  const runRoot = `${deliveryRoot}/${group}`;
  const runIds = new Set(selected.values());
  if (runIds.size === 0) throw Error(`Empty candidate Run group: ${group}`);
  const bytesByPath = new Map<string, Buffer>();
  const records: DurableRunRecord[] = [];
  for (const runId of runIds) {
    const occurrence = parseRunOccurrenceId(runId);
    if (occurrence === null) throw Error(`Invalid candidate Run id: ${runId}`);
    const input = {
      repositoryRoot: root,
      deliveryId,
      changeId,
      changeStartSequence: sequence,
      occurrence,
    };
    const texts: string[] = [];
    for (const file of ["action.md", "context.json", "result.json"]) {
      const name = `${runRoot}/${runId}/${file}`;
      if (!selected.has(name)) throw Error(`Incomplete candidate Run: ${name}`);
      const bytes =
        tree === undefined
          ? await gitBytes(root, ["show", `:${name}`])
          : await tree.read(name);
      if (bytes === null) throw Error(`Incomplete candidate Run: ${name}`);
      bytesByPath.set(name, bytes);
      texts.push(utf8(bytes));
    }
    records.push(parseDurableRunTexts(input, texts[0]!, texts[1]!, texts[2]!));
  }
  const tip = resolveRunChain(records);
  if (tip === null) throw Error(`Empty canonical Run chain: ${changeId}`);
  if (
    Math.min(...records.map((record) => record.context.occurrence.sequence)) !==
    sequence
  )
    throw Error(`Candidate group/start sequence mismatch: ${group}`);
  return { records, tip, runRoot, bytesByPath };
}
