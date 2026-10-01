import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  checkDeclaredProofs,
  checkOwnRunProofClosure,
  inspectActionProof,
} from "../../../src/cli/action-proof.js";
import { gitBytes } from "../../../src/internal/git-checkpoint-scope.js";

test("new Run proof closure rejects every undeclared or unsafe entry", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "flowkit-proof-closure-"));
  const runId = "20261001-001-explore";
  const target = {
    repositoryRoot: root,
    flowkitHome: root,
    deliveryId: "delivery-one",
    changeId: "change-one",
  };
  const relative = `.flowkit/artifacts/delivery-one/changes/change-one/proof/${runId}`;
  const directory = path.join(root, ...relative.split("/"));
  try {
    await gitBytes(root, ["init"]);
    await writeFile(
      path.join(root, ".gitattributes"),
      ".flowkit/artifacts/** -text\n",
    );
    await mkdir(
      path.join(root, ".flowkit/runs/delivery-one/001-change-one", runId),
      { recursive: true },
    );
    await checkOwnRunProofClosure(target, runId, []);
    await assert.rejects(
      checkOwnRunProofClosure(target, runId, undefined),
      /explicit array/,
    );
    await mkdir(directory, { recursive: true });
    await assert.rejects(
      checkOwnRunProofClosure(target, runId, []),
      /Empty proof/,
    );
    const files = ["a.txt", "b.txt", "c.txt"];
    for (const file of files) await writeFile(path.join(directory, file), file);
    const refs = await Promise.all(
      files.map(async (file) => {
        const relativeFile = `${relative}/${file}`;
        const bytes = await readFile(path.join(directory, file));
        const observed = await inspectActionProof(target, runId, relativeFile);
        assert.equal(
          observed.sha256,
          createHash("sha256").update(bytes).digest("hex"),
        );
        return { ...observed, purpose: "bounded test" };
      }),
    );
    await assert.rejects(checkOwnRunProofClosure(target, runId, []), /differ/);
    await assert.rejects(
      checkOwnRunProofClosure(target, runId, refs.slice(0, 1)),
      /differ/,
    );
    await assert.rejects(
      checkOwnRunProofClosure(target, runId, [refs[0], refs[0], refs[2]]),
      /ownership or shape/,
    );
    await assert.rejects(
      checkOwnRunProofClosure(target, runId, [
        { ...refs[0], sha256: "0".repeat(64) },
        refs[1],
        refs[2],
      ]),
      /bytes changed/,
    );
    await assert.rejects(
      checkOwnRunProofClosure(target, runId, [
        { ...refs[0], path: `${relative}/../escape.txt` },
        refs[1],
        refs[2],
      ]),
      /ownership|outside/,
    );
    await checkOwnRunProofClosure(target, runId, refs);
    await checkDeclaredProofs(target, runId, refs.slice(0, 1));
    await mkdir(path.join(directory, "nested"));
    await assert.rejects(
      checkOwnRunProofClosure(target, runId, refs),
      /Unsupported proof entry/,
    );
    await rm(path.join(directory, "nested"), { recursive: true });
    try {
      await symlink(
        path.join(directory, "a.txt"),
        path.join(directory, "linked.txt"),
      );
      await assert.rejects(
        checkOwnRunProofClosure(target, runId, refs),
        /Unsupported proof entry/,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EPERM") throw error;
      t.diagnostic(
        "symlink creation denied by host; directory rejection remains covered",
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
