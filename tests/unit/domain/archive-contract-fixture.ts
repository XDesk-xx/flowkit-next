import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { directoryHashes } from "../../../src/internal/archive-file-identities.js";
import { sha256 } from "../../../src/cli/run-effective-facts.js";
import { executionFixture } from "./execution-recovery-fixture.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

/** Real subprocess/Git fixture; all predecessor roles are synthetic, never an independent Review. */
export const lpEolPaths = [
  "config/verification/structure-policy.json",
  "scripts/verification/structure-inventory.test.ts",
  "scripts/verification/structure-sources.ts",
];
export async function archiveFixture(nativeHome?: string, lpPaths = false) {
  const f = await executionFixture(5, async (root) => {
    await writeFile(
      path.join(root, ".gitattributes"),
      "* text=auto\n*.cmd text eol=crlf\n.flowkit/runs/** -text\n.flowkit/artifacts/** -text\n",
    );
    const source = "openspec/changes/change-one";
    await mkdir(path.join(root, source, "specs/fixture/nested"), {
      recursive: true,
    });
    await writeFile(
      path.join(root, source, "specs/fixture/nested/spec.md"),
      "## ADDED Requirements\n\n### Requirement: Synthetic archive contract\nThe fixture SHALL preserve its scoped identity.\n\n#### Scenario: Scoped fixture\n- **WHEN** archive is requested\n- **THEN** the fixture preserves its identity\n",
    );
    await writeFile(path.join(root, source, "helper.cmd"), "@echo fixture\r\n");
    // Give the source auto path a CRLF index basis; the archive destination is absent.
    const attributes = await readFile(path.join(root, ".gitattributes"));
    await writeFile(
      path.join(root, ".gitattributes"),
      Buffer.concat([
        attributes,
        Buffer.from(`${source}/retained.txt -text\n`),
      ]),
    );
    await writeFile(
      path.join(root, source, "retained.txt"),
      "retained source\r\n",
    );
    await gitBytes(root, ["add", "--", `${source}/retained.txt`]);
    await writeFile(path.join(root, ".gitattributes"), attributes);
    const hashes: Record<string, string> = {};
    if (lpPaths) {
      for (const relative of lpEolPaths) {
        await mkdir(path.dirname(path.join(root, relative)), {
          recursive: true,
        });
        await writeFile(path.join(root, relative), "LP EOL fixture\n");
        await gitBytes(root, ["add", "--", relative]);
        await writeFile(path.join(root, relative), "LP EOL fixture\r\n");
        hashes[relative] = sha256(await readFile(path.join(root, relative)));
      }
    }
    for (const [suffix, hash] of Object.entries(
      (await directoryHashes(root, source))!,
    ))
      hashes[`${source}/${suffix}`] = hash;
    const coordination = "openspec/delivery-groups/delivery-one.yaml";
    hashes[coordination] = sha256(
      await readFile(path.join(root, coordination)),
    );
    return hashes;
  });
  if (nativeHome) f.base.flowkitHome = nativeHome;
  else {
    const runtime = path.join(
      f.flowkitHome,
      "tools/openspec/1.10.0/bin/openspec.js",
    );
    const original = await readFile(runtime, "utf8");
    await writeFile(
      runtime,
      `if(process.argv[2]==='archive'){
      const fs=require('node:fs'),path=require('node:path');
      const count=fs.existsSync('archive-count.txt')?Number(fs.readFileSync('archive-count.txt')):0;fs.writeFileSync('archive-count.txt',String(count+1));
      process.stdout.write(Buffer.from([255,13,10]));
      if(fs.existsSync('restore-native')){
        const p=path.join('openspec/changes',process.argv[3],'proposal.md'),before=fs.readFileSync(p);
        fs.writeFileSync(p,'transient native edit');fs.writeFileSync(p,before);process.exit(7);
      }
      if(fs.existsSync('drift-native')){fs.writeFileSync('candidate.txt','concurrent candidate drift');process.exit(7);}
      if(fs.existsSync('fail-native'))process.exit(7);
      const n=new Date(),date=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
      const target=path.join('openspec/changes/archive',date+'-'+process.argv[3]);fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.renameSync(path.join('openspec/changes',process.argv[3]),target);
      fs.mkdirSync('openspec/specs/fixture/nested',{recursive:true});fs.writeFileSync('openspec/specs/fixture/nested/spec.md','# Actual native after\\n');
      const state=JSON.parse(fs.readFileSync('observation.json'));state.changes=[];fs.writeFileSync('observation.json',JSON.stringify(state));
      process.exit(fs.existsSync('partial-native')?9:0);
    }\n` + original,
    );
  }
  const start = () =>
    f.call("action start", { ...f.base, actionId: "archive", role: "author" });
  const finish = (runId: string, archived: Record<string, unknown>) =>
    f.call("action finish", {
      ...f.base,
      runId,
      role: "author",
      terminal: true,
      result: {
        runId,
        actionIdentity: {
          deliveryId: f.base.deliveryId,
          changeId: f.base.changeId,
          actionId: "archive",
        },
        authorConclusion: archived.status === "completed" ? "PASS" : "FAIL",
        reviewerVerdict: null,
        verificationVerdict: null,
        nextBoundary: archived.status === "completed" ? "checkpoint" : null,
        facts: {
          archiveOutcome: archived.archiveOutcome,
          archiveMaterialRefs: archived.archiveMaterialRefs,
          archivePath: archived.archivePath,
          projectOrdinal: 1,
          proofRefs: [],
        },
      },
    });
  return { ...f, start, finish };
}
