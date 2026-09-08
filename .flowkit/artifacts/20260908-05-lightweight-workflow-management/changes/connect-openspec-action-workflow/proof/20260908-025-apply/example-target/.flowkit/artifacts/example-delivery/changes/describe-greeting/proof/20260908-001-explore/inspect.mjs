import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
const source = path.resolve(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-025-apply/example-target/src/greeting.mjs");
const sourceBytes = await readFile(source);
const { greeting } = await import(pathToFileURL(source));
const cases = ["Ada", " Ada ", ""].map(input => ({ input, actual: greeting(input) }));
assert.deepEqual(cases.map(row => row.actual), ["Hello, Ada!", "Hello, Ada!", "Hello, !"]);
let errorName = null;
try { greeting(null); } catch (error) { errorName = error.name; }
assert.equal(errorName, "TypeError");
const observation = { executedAt: new Date().toISOString(), platform: process.platform,
  sourceSha256: createHash("sha256").update(sourceBytes).digest("hex"), cases, nullInput: errorName,
  exitCode: 0, scope: "actual bounded source observation; no implementation or independent Review" };
await writeFile(new URL("./observation.json", import.meta.url), JSON.stringify(observation, null, 2) + "\n", { flag: "wx" });
const raw = Buffer.from(JSON.stringify(observation) + "\n");
await writeFile(new URL("./stdout.txt", import.meta.url), raw, { flag: "wx" });
await writeFile(new URL("./stderr.txt", import.meta.url), Buffer.alloc(0), { flag: "wx" });
process.stdout.write(raw);
