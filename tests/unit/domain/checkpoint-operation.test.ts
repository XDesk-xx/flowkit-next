import assert from "node:assert/strict";
import test from "node:test";
import {
  cloneCheckpointOperation,
  isDeliveryCheckpointOperation,
  sameCheckpointOperation,
} from "../../../src/domain/delivery-repository-integration-operation.js";

test("checkpoint closed operation binds paths, message and nullable ordered shape", () => {
  const operation = {
    kind: "create-new" as const,
    paths: ["a.txt", "中文 文件.txt"],
    commitMessage: "scoped",
    commitShape: null,
  };
  assert.equal(isDeliveryCheckpointOperation(operation), true);
  for (const malformed of [
    { kind: "create-new" },
    { ...operation, extra: true },
    { ...operation, paths: [] },
    { ...operation, paths: ["a", "a"] },
    { ...operation, paths: ["b", "a"] },
    { ...operation, commitMessage: "a\nb" },
    ...["../a", "/a", "C:/a", ".git/config", "x/../a", "a/*", "a/", "a\\b"].map(
      (p) => ({ ...operation, paths: [p] }),
    ),
    { ...operation, commitShape: undefined },
    { ...operation, commitShape: { parents: [], count: 0 } },
  ])
    assert.equal(
      isDeliveryCheckpointOperation(malformed),
      false,
      JSON.stringify(malformed),
    );
  const shaped = {
    ...operation,
    commitShape: { parents: ["b".repeat(40), "a".repeat(40)], count: 2 },
  };
  assert.equal(isDeliveryCheckpointOperation(shaped), true);
  assert.deepEqual(cloneCheckpointOperation(shaped), shaped);
  assert.equal(
    sameCheckpointOperation(shaped, {
      commitShape: shaped.commitShape,
      commitMessage: "scoped",
      paths: operation.paths,
      kind: "create-new",
    }),
    true,
  );
  for (const changed of [
    { ...shaped, paths: ["other"] },
    { ...shaped, commitMessage: "other" },
    { ...shaped, commitShape: null },
    {
      ...shaped,
      commitShape: {
        ...shaped.commitShape,
        parents: [...shaped.commitShape.parents].reverse(),
      },
    },
  ])
    assert.equal(sameCheckpointOperation(shaped, changed), false);
  assert.equal(
    isDeliveryCheckpointOperation({
      kind: "reuse-existing",
      checkpointCommit: "a".repeat(40),
    }),
    true,
  );
});
