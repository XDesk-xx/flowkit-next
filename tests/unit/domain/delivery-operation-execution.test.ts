import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DELIVERY_OPERATIONS,
  canonicalDeliveryGuidancePath,
  formDeliveryOperationPackage,
  hasDeliveryStartCommitAuthority,
  isDeliveryGuidanceRef,
  isDeliveryGuidanceRefForOperation,
  isDeliveryFinalAuthorityForDelivery,
  isDeliveryFinalOperationFacts,
  isDeliveryOperationId,
  isDeliveryOperationPackage,
  isDeliveryPlanningReference,
  isDeliveryStartAuthorityForDelivery,
  isDeliveryStartOperationFacts,
  readExactDeliveryGuidance,
  resolveDeliveryGuidanceRef,
  type DeliveryGuidanceRef,
  type DeliveryFinalOperationFacts,
  type DeliveryStartOperationFacts,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";

const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";
const acceptedBaseCommit = "a".repeat(40);
const planningReference = {
  artifact: "flowkit-next-d04-stable-core-closure-final-reference.md",
  contentSha256: "b".repeat(64),
};

function authority(
  scope: readonly string[] = ["delivery-start"],
): OwnerAuthorityFact {
  return {
    ref: `owner:${"c".repeat(64)}`,
    decision: "create-delivery",
    deliveryId,
    sourceRef: "conversation:owner-delivery-start",
    scope,
  };
}

function startFacts(): DeliveryStartOperationFacts {
  return { acceptedBaseCommit, planningReference };
}

function finalAuthority(
  scope: readonly string[] = ["delivery-final"],
): OwnerAuthorityFact {
  return {
    ref: `owner:${"e".repeat(64)}`,
    decision: "finalize-delivery",
    deliveryId,
    sourceRef: "conversation:owner-delivery-final",
    scope,
  };
}

function finalFacts(): DeliveryFinalOperationFacts {
  return {
    verifiedCandidateRef: `candidate:sha256:${"1".repeat(64)}`,
    fullTestExecutionRef: `full-test-execution:sha256:${"2".repeat(64)}`,
    architectureFinalizationRef: `architecture-finalization:sha256:${"3".repeat(64)}`,
    architectureMaterializedCandidateRef: `candidate:sha256:${"4".repeat(64)}`,
    coordinationPrestateRef: {
      artifact: `openspec/delivery-groups/${deliveryId}.yaml`,
      contentSha256: "5".repeat(64),
      bytes: 123,
    },
    completedRequiredChangeIds: ["change-one", "change-two"],
  };
}

function guidanceRef(
  operationId: (typeof DELIVERY_OPERATIONS)[number] = "delivery-start",
): DeliveryGuidanceRef {
  return {
    path: canonicalDeliveryGuidancePath(operationId)!,
    contentSha256: "d".repeat(64),
  };
}

async function makeRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "flowkit-delivery-guidance-"));
}

async function writeGuidance(
  root: string,
  operationId: (typeof DELIVERY_OPERATIONS)[number],
  body: string,
): Promise<string> {
  const relative = canonicalDeliveryGuidancePath(operationId)!;
  const entry = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(entry), { recursive: true });
  await writeFile(entry, body, "utf8");
  return entry;
}

test("DeliveryOperationId is a closed exact five-value catalog with deterministic Guidance mapping", () => {
  assert.deepEqual(DELIVERY_OPERATIONS, [
    "delivery-start",
    "delivery-full-test",
    "delivery-architecture-finalization",
    "delivery-final",
    "delivery-repository-integration",
  ]);

  const expected = new Map([
    ["delivery-start", "skills/delivery/start/SKILL.md"],
    ["delivery-full-test", "skills/delivery/full-test/SKILL.md"],
    [
      "delivery-architecture-finalization",
      "skills/delivery/architecture-finalization/SKILL.md",
    ],
    ["delivery-final", "skills/delivery/final/SKILL.md"],
    [
      "delivery-repository-integration",
      "skills/delivery/repository-integration/SKILL.md",
    ],
  ]);

  for (const operationId of DELIVERY_OPERATIONS) {
    assert.equal(isDeliveryOperationId(operationId), true);
    assert.equal(
      canonicalDeliveryGuidancePath(operationId),
      expected.get(operationId),
    );
  }

  assert.equal(isDeliveryOperationId("start"), false);
  assert.equal(isDeliveryOperationId("Delivery-Start"), false);
  assert.equal(canonicalDeliveryGuidancePath("delivery_start"), null);
  assert.equal(canonicalDeliveryGuidancePath("../delivery-start"), null);
});

test("DeliveryGuidanceRef is closed to canonical Delivery paths and lowercase SHA-256", () => {
  const valid = guidanceRef();
  assert.equal(isDeliveryGuidanceRef(valid), true);
  assert.equal(
    isDeliveryGuidanceRefForOperation(valid, "delivery-start"),
    true,
  );
  assert.equal(
    isDeliveryGuidanceRefForOperation(valid, "delivery-final"),
    false,
  );
  assert.equal(isDeliveryGuidanceRef({ ...valid, extra: true }), false);
  assert.equal(
    isDeliveryGuidanceRef({ ...valid, path: ".agents/skills/start/SKILL.md" }),
    false,
  );
  assert.equal(
    isDeliveryGuidanceRef({ ...valid, path: "skills/delivery/final/SKILL.md" }),
    true,
  );
  assert.equal(
    isDeliveryGuidanceRef({ ...valid, contentSha256: "D".repeat(64) }),
    false,
  );
});

test("resolver binds exact canonical bytes and byte drift changes identity", async () => {
  const root = await makeRoot();
  try {
    const entry = await writeGuidance(
      root,
      "delivery-start",
      "# start\nfirst\n",
    );
    const first = await resolveDeliveryGuidanceRef(root, "delivery-start");
    assert.notEqual(first, null);
    assert.equal(first!.path, "skills/delivery/start/SKILL.md");

    const bytes = await readExactDeliveryGuidance(root, first);
    assert.equal(bytes?.toString("utf8"), "# start\nfirst\n");

    await writeFile(entry, "# start\nsecond\n", "utf8");
    const second = await resolveDeliveryGuidanceRef(root, "delivery-start");
    assert.notEqual(second, null);
    assert.notEqual(first!.contentSha256, second!.contentSha256);
    assert.equal(await readExactDeliveryGuidance(root, first), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing product Guidance never falls back to .agents", async () => {
  const root = await makeRoot();
  try {
    const bootstrap = path.join(
      root,
      ".agents",
      "skills",
      "flowkit-delivery-start",
      "SKILL.md",
    );
    await mkdir(path.dirname(bootstrap), { recursive: true });
    await writeFile(bootstrap, "# bootstrap only\n", "utf8");
    assert.equal(
      await resolveDeliveryGuidanceRef(root, "delivery-start"),
      null,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("non-regular, symlink, and parent-path redirected Guidance fail closed", async (t) => {
  const root = await makeRoot();
  const outside = await makeRoot();
  try {
    const entry = path.join(root, "skills", "delivery", "start", "SKILL.md");
    await mkdir(entry, { recursive: true });
    assert.equal(
      await resolveDeliveryGuidanceRef(root, "delivery-start"),
      null,
    );

    await rm(path.join(root, "skills"), { recursive: true, force: true });
    const target = path.join(root, "target.md");
    await writeFile(target, "# target\n", "utf8");
    await mkdir(path.dirname(entry), { recursive: true });
    try {
      await symlink(target, entry, "file");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES" || code === "UNKNOWN") {
        t.skip("Host does not permit symlink fixtures");
        return;
      }
      throw error;
    }
    assert.equal(
      await resolveDeliveryGuidanceRef(root, "delivery-start"),
      null,
    );

    await rm(path.join(root, "skills"), { recursive: true, force: true });
    const outsideEntry = await writeGuidance(
      outside,
      "delivery-start",
      "# outside\n",
    );
    const parent = path.join(root, "skills", "delivery");
    await mkdir(parent, { recursive: true });
    await symlink(
      path.dirname(outsideEntry),
      path.join(parent, "start"),
      "dir",
    );
    assert.equal(
      await resolveDeliveryGuidanceRef(root, "delivery-start"),
      null,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("unreadable canonical Delivery Guidance fails closed when permissions are enforceable", async () => {
  const root = await makeRoot();
  try {
    const entry = await writeGuidance(root, "delivery-start", "# start\n");
    if (process.getuid?.() === 0) {
      await chmod(root, 0o755);
      await chmod(path.join(root, "skills"), 0o755);
      await chmod(path.join(root, "skills", "delivery"), 0o755);
      await chmod(path.join(root, "skills", "delivery", "start"), 0o755);
      await chmod(entry, 0o600);

      const moduleUrl = new URL(
        "../../../src/domain/delivery-operation-execution.ts",
        import.meta.url,
      ).href;
      const child = spawnSync(
        process.execPath,
        [
          "--import",
          "tsx",
          "--input-type=module",
          "--eval",
          `import { resolveDeliveryGuidanceRef } from ${JSON.stringify(moduleUrl)};\nconst result = await resolveDeliveryGuidanceRef(${JSON.stringify(root)}, "delivery-start");\nif (result !== null) process.exit(1);`,
        ],
        { cwd: process.cwd(), encoding: "utf8", uid: 65534, gid: 65534 },
      );
      assert.equal(child.status, 0, child.stderr);
      return;
    }

    await chmod(entry, 0o000);
    assert.equal(
      await resolveDeliveryGuidanceRef(root, "delivery-start"),
      null,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Delivery planning reference and Start facts are exact closed values", () => {
  assert.equal(isDeliveryPlanningReference(planningReference), true);
  assert.equal(
    isDeliveryPlanningReference({ ...planningReference, extra: true }),
    false,
  );
  assert.equal(
    isDeliveryPlanningReference({
      ...planningReference,
      artifact: "../reference.md",
    }),
    false,
  );
  assert.equal(isDeliveryStartOperationFacts(startFacts()), true);
  assert.equal(
    isDeliveryStartOperationFacts({ ...startFacts(), extra: true }),
    false,
  );
  assert.equal(
    isDeliveryStartOperationFacts({
      ...startFacts(),
      acceptedBaseCommit: "A".repeat(40),
    }),
    false,
  );
});

test("Delivery Start authority recognition is exact to create-delivery, Delivery, and bounded scopes", () => {
  const startOnly = authority();
  const withCommit = authority([
    "delivery-start",
    "single-delivery-start-fixed-point-commit",
  ]);

  assert.equal(
    isDeliveryStartAuthorityForDelivery(startOnly, deliveryId),
    true,
  );
  assert.equal(hasDeliveryStartCommitAuthority(startOnly, deliveryId), false);
  assert.equal(hasDeliveryStartCommitAuthority(withCommit, deliveryId), true);
  assert.equal(
    isDeliveryStartAuthorityForDelivery(
      { ...startOnly, deliveryId: "other-delivery" },
      deliveryId,
    ),
    false,
  );
  assert.equal(
    isDeliveryStartAuthorityForDelivery(
      { ...startOnly, decision: "activate-change" },
      deliveryId,
    ),
    false,
  );
  assert.equal(
    isDeliveryStartAuthorityForDelivery(
      { ...startOnly, changeId: "a-change" },
      deliveryId,
    ),
    false,
  );
});

test("DeliveryOperationPackage forms only the concrete Start variant and rejects mismatches", () => {
  const valid = formDeliveryOperationPackage(
    deliveryId,
    "delivery-start",
    authority(),
    startFacts(),
    guidanceRef(),
  );
  assert.notEqual(valid, null);
  assert.equal(isDeliveryOperationPackage(valid), true);
  assert.deepEqual(Object.keys(valid!).sort(), [
    "deliveryId",
    "guidanceRef",
    "operationFacts",
    "operationId",
    "ownerAuthority",
  ]);
  assert.equal("runId" in valid!, false);
  assert.equal("role" in valid!, false);
  assert.equal("lifecycleState" in valid!, false);
  assert.equal("currentAction" in valid!, false);

  assert.equal(
    formDeliveryOperationPackage(
      deliveryId,
      "delivery-start",
      authority(),
      startFacts(),
      guidanceRef("delivery-final"),
    ),
    null,
  );
  assert.equal(
    formDeliveryOperationPackage(
      deliveryId,
      "delivery-start",
      { ...authority(), deliveryId: "other-delivery" },
      startFacts(),
      guidanceRef(),
    ),
    null,
  );
  assert.equal(
    formDeliveryOperationPackage(
      deliveryId,
      "delivery-final",
      authority(),
      startFacts(),
      guidanceRef("delivery-final"),
    ),
    null,
  );

  assert.equal(isDeliveryOperationPackage({ ...valid!, extra: true }), false);
  assert.equal(
    isDeliveryOperationPackage({
      ...valid!,
      operationFacts: { ...startFacts(), extra: true },
    }),
    false,
  );
});

test("Delivery Final package is closed to exact facts, Guidance, and singleton authority", () => {
  const valid = formDeliveryOperationPackage(
    deliveryId,
    "delivery-final",
    finalAuthority(),
    finalFacts(),
    guidanceRef("delivery-final"),
  );
  assert.notEqual(valid, null);
  assert.equal(valid?.operationId, "delivery-final");
  assert.equal(isDeliveryOperationPackage(valid), true);
  assert.equal(isDeliveryFinalOperationFacts(valid?.operationFacts), true);
  assert.equal(
    isDeliveryFinalAuthorityForDelivery(valid?.ownerAuthority, deliveryId),
    true,
  );
  assert.notEqual(valid?.operationFacts, finalFacts());

  const invalidFacts = [
    { ...finalFacts(), extra: true },
    {
      ...finalFacts(),
      coordinationPrestateRef: {
        ...finalFacts().coordinationPrestateRef,
        artifact: "openspec/delivery-groups/other.yaml",
      },
    },
    {
      ...finalFacts(),
      completedRequiredChangeIds: ["change-one", "change-one"],
    },
    {
      ...finalFacts(),
      architectureFinalizationRef: "architecture-finalization:sha256:BAD",
    },
  ];
  for (const facts of invalidFacts) {
    assert.equal(
      formDeliveryOperationPackage(
        deliveryId,
        "delivery-final",
        finalAuthority(),
        facts,
        guidanceRef("delivery-final"),
      ),
      null,
    );
  }

  const invalidAuthorities = [
    { ...finalAuthority(), decision: "authorize-formal-full-test" },
    { ...finalAuthority(), deliveryId: "other-delivery" },
    { ...finalAuthority(), changeId: "change-one" },
    {
      ...finalAuthority(),
      scope: ["delivery-final", "repository-integration"],
    },
  ];
  for (const ownerAuthority of invalidAuthorities) {
    assert.equal(
      formDeliveryOperationPackage(
        deliveryId,
        "delivery-final",
        ownerAuthority,
        finalFacts(),
        guidanceRef("delivery-final"),
      ),
      null,
    );
  }

  assert.equal(
    formDeliveryOperationPackage(
      deliveryId,
      "delivery-final",
      finalAuthority(),
      finalFacts(),
      guidanceRef("delivery-full-test"),
    ),
    null,
  );
  assert.equal(
    formDeliveryOperationPackage(
      deliveryId,
      "delivery-repository-integration",
      finalAuthority(),
      finalFacts(),
      guidanceRef("delivery-repository-integration"),
    ),
    null,
  );

  const input = finalFacts();
  const cloned = formDeliveryOperationPackage(
    deliveryId,
    "delivery-final",
    finalAuthority(),
    input,
    guidanceRef("delivery-final"),
  );
  assert.notEqual(cloned, null);
  (input.completedRequiredChangeIds as string[])[0] = "mutated";
  assert.equal(cloned?.operationId, "delivery-final");
  if (cloned?.operationId !== "delivery-final") return;
  assert.equal(
    cloned.operationFacts.completedRequiredChangeIds[0],
    "change-one",
  );
});

test("canonical Delivery Final Guidance is generic, content-bound, and operation-bounded", async () => {
  const body = await readFile("skills/delivery/final/SKILL.md", "utf8");
  assert.equal(body.includes(deliveryId), false);
  assert.equal(body.includes("complete trusted Full Test"), true);
  assert.equal(body.includes("all six fixed Architecture output bytes"), true);
  assert.equal(
    body.includes("only the fixed canonical Delivery coordination"),
    true,
  );
  assert.equal(body.includes("STOP"), true);
  assert.equal(body.includes("Git authority"), true);
  assert.equal(body.includes("discover, rank, route, or choose"), true);
  assert.notEqual(
    await resolveDeliveryGuidanceRef(process.cwd(), "delivery-final"),
    null,
  );
});

test("repository integration package is the fifth exact variant and requires singleton Owner authority", () => {
  const repoAuthority: OwnerAuthorityFact = {
    ref: `owner:${"9".repeat(64)}`,
    decision: "authorize-repository-integration",
    deliveryId,
    sourceRef: "test:repo-integration",
    scope: ["delivery-repository-integration"],
  };
  const facts = {
    deliveryFinalizationRef: `delivery-finalization:sha256:${"1".repeat(64)}`,
    finalizedCandidateRef: `candidate:sha256:${"2".repeat(64)}`,
    preIntegrationHead: "3".repeat(40),
    deliveryBranch: "delivery/d04",
    targetMainRef: "refs/heads/main",
    targetMainPreIntegrationCommit: "4".repeat(40),
    acceptedBaseCommit: "5".repeat(40),
  };
  const formed = formDeliveryOperationPackage(
    deliveryId,
    "delivery-repository-integration",
    repoAuthority,
    facts,
    guidanceRef("delivery-repository-integration"),
  );
  assert.equal(formed?.operationId, "delivery-repository-integration");
  assert.equal(isDeliveryOperationPackage(formed), true);
  assert.equal(
    formDeliveryOperationPackage(
      deliveryId,
      "delivery-repository-integration",
      {
        ...repoAuthority,
        scope: ["delivery-repository-integration", "git-write"].sort(),
      },
      facts,
      guidanceRef("delivery-repository-integration"),
    ),
    null,
  );
});
