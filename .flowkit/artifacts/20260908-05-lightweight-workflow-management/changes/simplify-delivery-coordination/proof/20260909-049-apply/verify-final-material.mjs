import assert from "node:assert/strict";
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const load = (p) => import(pathToFileURL(path.resolve(p)).href);
const { createFixture, acceptedOutcomes, evidenceSource, finalInput, cleanup } =
  await load("tests/unit/domain/delivery-final-fixture.ts");
const { fixtureInstallation } = await load("tests/unit/domain/manager-installation-fixture.ts");
const { prepareDeliveryFinalOperationPackage } = await load("src/domain/delivery-final-execution.ts");
const f = await createFixture();
try {
  const outcomes = await acceptedOutcomes(f);
  const prepare = () => prepareDeliveryFinalOperationPackage(f.root, finalInput(f, outcomes),
    evidenceSource(outcomes, f.root), fixtureInstallation(f.root));
  assert.notEqual(await prepare(), null);
  const command = outcomes.fullTest.record.checks[0].command.artifact;
  const commandRecord = JSON.parse(await readFile(path.join(f.root, command), "utf8"));
  const stdout = path.join(f.root, commandRecord.stdout.artifact);
  const original = await readFile(stdout);
  await writeFile(stdout, Buffer.concat([original, Buffer.from("corruption")]));
  assert.equal(await prepare(), null);
  await writeFile(stdout, original);
  assert.notEqual(await prepare(), null);
  const result = path.join(f.root, path.dirname(path.dirname(path.dirname(command))), "result.json");
  await rename(result, result + ".unavailable");
  assert.equal(await prepare(), null);
  await rename(result + ".unavailable", result);
  const manifest = await readFile(f.manifestPath, "utf8");
  await writeFile(f.manifestPath, manifest.replace(/fullTestStatus: "?passed"?/, "fullTestStatus: pending"));
  assert.equal(await prepare(), null);
  await writeFile(f.manifestPath, manifest);
  assert.notEqual(await prepare(), null);
  console.log(JSON.stringify({status:"PASS", cases:["corrupt-current-stdout","missing-current-result","pending-current-attempt"],
    realFixtureChecks:true, syntheticAcceptedChangeSource:true, formalD05FullTest:false}));
} finally { await cleanup(f); }
