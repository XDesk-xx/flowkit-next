import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import {
  deriveApplicableCheckRef,
  formDeliveryOperationPackage,
  invokeDeliveryFullTestOperation,
  isDeliveryFullTestOperationFacts,
  isDeliveryOperationPackage,
  isFormalFullTestAuthorityForDelivery,
  prepareDeliveryFullTestOperationPackage,
  priorFactsFromDeliveryFullTestRecord,
  resolveApplicableChecksInDeclaredOrder,
  resolveDeliveryGuidanceRef,
  type ApplicableCheckDeclaration,
  type OwnerAuthorityFact,
} from "../../../src/domain/index.js";

const execFileAsync = promisify(execFile);
const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";

async function git(root: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  return stdout.trim();
}

function authority(
  overrides: Partial<OwnerAuthorityFact> = {},
): OwnerAuthorityFact {
  return {
    ref: `owner:${"a".repeat(64)}`,
    decision: "authorize-formal-full-test",
    deliveryId,
    sourceRef: "conversation:owner-formal-full-test",
    scope: ["delivery-full-test"],
    ...overrides,
  };
}

function declaration(
  checkId: string,
  args: readonly string[],
  overrides: Partial<ApplicableCheckDeclaration> = {},
): ApplicableCheckDeclaration {
  return {
    checkId,
    program: process.execPath,
    args,
    configRefs: ["config:project-full-test"],
    toolRefs: ["tool:node-22.23.2"],
    environmentRefs: ["environment:linux-x64"],
    ...overrides,
  };
}

async function createFixture(): Promise<string> {
  const root = await mkdtemp(
    path.join(tmpdir(), "flowkit-delivery-full-test-"),
  );
  await git(root, "init", "-q");
  await git(root, "config", "user.email", "flowkit@example.invalid");
  await git(root, "config", "user.name", "Flowkit Test");
  await writeFile(path.join(root, "source.txt"), "base\n", "utf8");
  const skill = path.join(root, "skills", "delivery", "full-test", "SKILL.md");
  await mkdir(path.dirname(skill), { recursive: true });
  await writeFile(
    skill,
    "# generic full test\nexecute exact package checks\n",
    "utf8",
  );
  await git(root, "add", ".");
  await git(root, "commit", "-qm", "fixture");
  return root;
}

test("Full Test check resolution preserves declared order while retaining exact check identity", () => {
  const plan = {
    checks: [
      declaration("z-last-lexically", ["-e", "process.exit(0)"]),
      declaration("a-first-lexically", ["-e", "process.exit(0)"]),
    ],
  };
  const resolved = resolveApplicableChecksInDeclaredOrder(plan);
  assert.notEqual(resolved, null);
  assert.deepEqual(
    resolved!.map((check) => check.checkId),
    ["z-last-lexically", "a-first-lexically"],
  );
  assert.equal(resolved![0].checkRef, deriveApplicableCheckRef(plan.checks[0]));
  assert.equal(resolved![1].checkRef, deriveApplicableCheckRef(plan.checks[1]));
});

test("Full Test authority is exact singleton-scoped and cannot carry Change or broader authority", () => {
  assert.equal(
    isFormalFullTestAuthorityForDelivery(authority(), deliveryId),
    true,
  );
  assert.equal(
    isFormalFullTestAuthorityForDelivery(
      authority({ scope: ["delivery-full-test", "git-mutation"] }),
      deliveryId,
    ),
    false,
  );
  assert.equal(
    isFormalFullTestAuthorityForDelivery(
      authority({ changeId: "some-change" }),
      deliveryId,
    ),
    false,
  );
  assert.equal(
    isFormalFullTestAuthorityForDelivery(
      authority({ decision: "create-delivery" }),
      deliveryId,
    ),
    false,
  );
  assert.equal(
    isFormalFullTestAuthorityForDelivery(
      authority({ deliveryId: "other-delivery" }),
      deliveryId,
    ),
    false,
  );
});

test("Delivery Full Test package is a closed concrete variant and rejects mismatched facts", async () => {
  const root = await createFixture();
  try {
    const checks = resolveApplicableChecksInDeclaredOrder({
      checks: [declaration("check-one", ["-e", "process.exit(0)"])],
    });
    const guidanceRef = await resolveDeliveryGuidanceRef(
      root,
      "delivery-full-test",
    );
    assert.notEqual(checks, null);
    assert.notEqual(guidanceRef, null);
    const facts = {
      candidateRef: `candidate:sha256:${"b".repeat(64)}`,
      orderedChecks: checks!,
    };
    assert.equal(isDeliveryFullTestOperationFacts(facts), true);

    const pkg = formDeliveryOperationPackage(
      deliveryId,
      "delivery-full-test",
      authority(),
      facts,
      guidanceRef,
    );
    assert.notEqual(pkg, null);
    assert.equal(pkg!.operationId, "delivery-full-test");
    assert.equal(isDeliveryOperationPackage(pkg), true);

    assert.equal(
      formDeliveryOperationPackage(
        deliveryId,
        "delivery-full-test",
        authority(),
        { ...facts, orderedChecks: [checks![0], checks![0]] },
        guidanceRef,
      ),
      null,
    );
    assert.equal(
      formDeliveryOperationPackage(
        deliveryId,
        "delivery-full-test",
        authority({ scope: ["delivery-full-test", "git-mutation"] }),
        facts,
        guidanceRef,
      ),
      null,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("trusted Full Test preparation derives current candidate and exact canonical Guidance", async () => {
  const root = await createFixture();
  try {
    const prepared = await prepareDeliveryFullTestOperationPackage(root, {
      deliveryId,
      ownerAuthority: authority(),
      checks: [declaration("typecheck", ["-e", "process.exit(0)"])],
    });
    assert.notEqual(prepared, null);
    assert.equal(prepared!.operationId, "delivery-full-test");
    assert.match(
      prepared!.operationFacts.candidateRef,
      /^candidate:sha256:[0-9a-f]{64}$/,
    );
    assert.deepEqual(
      prepared!.operationFacts.orderedChecks.map((check) => check.checkId),
      ["typecheck"],
    );
    assert.equal(
      prepared!.guidanceRef.path,
      "skills/delivery/full-test/SKILL.md",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Full Test executes only package-bound checks in exact declared order", async () => {
  const root = await createFixture();
  const outside = await mkdtemp(
    path.join(tmpdir(), "flowkit-full-test-order-"),
  );
  const marker = path.join(outside, "order.txt");
  try {
    const append = (label: string) => [
      "-e",
      `require('node:fs').appendFileSync(${JSON.stringify(marker)}, ${JSON.stringify(`${label}\n`)})`,
    ];
    const outcome = await invokeDeliveryFullTestOperation(root, {
      deliveryId,
      ownerAuthority: authority(),
      checks: [
        declaration("z-check", append("Z")),
        declaration("a-check", append("A")),
      ],
    });
    assert.equal(outcome.status, "terminal");
    if (outcome.status === "terminal") {
      assert.equal(outcome.verdict, "passed");
      assert.deepEqual(
        outcome.record.checks.map((fact) => fact.checkId),
        ["z-check", "a-check"],
      );
    }
    assert.equal(await readFile(marker, "utf8"), "Z\nA\n");
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("same candidate reuses unchanged PASS and reruns only material check identity drift", async () => {
  const root = await createFixture();
  const outside = await mkdtemp(
    path.join(tmpdir(), "flowkit-full-test-reuse-"),
  );
  const marker = path.join(outside, "runs.txt");
  try {
    const append = (label: string) => [
      "-e",
      `require('node:fs').appendFileSync(${JSON.stringify(marker)}, ${JSON.stringify(`${label}\n`)})`,
    ];
    const first = await invokeDeliveryFullTestOperation(root, {
      deliveryId,
      ownerAuthority: authority(),
      checks: [
        declaration("stable", append("stable-1")),
        declaration("fixture", append("fixture-1")),
      ],
    });
    assert.equal(first.status, "terminal");
    if (first.status !== "terminal") return;
    const prior = priorFactsFromDeliveryFullTestRecord(first.record);
    assert.notEqual(prior, null);

    await writeFile(marker, "", "utf8");
    const second = await invokeDeliveryFullTestOperation(
      root,
      {
        deliveryId,
        ownerAuthority: authority(),
        checks: [
          declaration("stable", append("stable-1")),
          declaration("fixture", append("fixture-2"), {
            environmentRefs: ["environment:linux-x64-fixture-v2"],
          }),
        ],
      },
      prior!,
    );
    assert.equal(second.status, "terminal");
    if (second.status === "terminal") {
      assert.equal(second.record.checks[0].status, "reused-passed");
      assert.equal(second.record.checks[1].status, "passed");
    }
    assert.equal(await readFile(marker, "utf8"), "fixture-2\n");
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("repository mutation during Full Test stops terminal admission on candidate drift", async () => {
  const root = await createFixture();
  try {
    const outcome = await invokeDeliveryFullTestOperation(root, {
      deliveryId,
      ownerAuthority: authority(),
      checks: [
        declaration("mutates-repository", [
          "-e",
          "require('node:fs').appendFileSync('source.txt', 'mutated\\n')",
        ]),
      ],
    });
    assert.equal(outcome.status, "stopped-candidate-drift");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("candidate drift after an executed check stops before any later check runs", async () => {
  const root = await createFixture();
  const outside = await mkdtemp(
    path.join(tmpdir(), "flowkit-full-test-immediate-stop-"),
  );
  const marker = path.join(outside, "later-check-ran.txt");
  try {
    const outcome = await invokeDeliveryFullTestOperation(root, {
      deliveryId,
      ownerAuthority: authority(),
      checks: [
        declaration("mutates-repository", [
          "-e",
          "require('node:fs').appendFileSync('source.txt', 'mutated\\n')",
        ]),
        declaration("must-not-run-after-drift", [
          "-e",
          `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'ran\\n')`,
        ]),
      ],
    });

    assert.equal(outcome.status, "stopped-candidate-drift");
    await assert.rejects(readFile(marker, "utf8"), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("platform fixture identity may differ but the same semantic check cannot be silently reused", async () => {
  const linux = declaration("permission-proof", ["-e", "process.exit(0)"], {
    environmentRefs: ["environment:linux-permission-fixture"],
  });
  const windows = declaration("permission-proof", ["-e", "process.exit(0)"], {
    environmentRefs: ["environment:windows-permission-fixture"],
  });
  assert.notEqual(
    deriveApplicableCheckRef(linux),
    deriveApplicableCheckRef(windows),
  );
  assert.equal(linux.checkId, windows.checkId);
});

test("flowkit-next six gates can be supplied as one repository-local ordered plan without entering product Guidance", async () => {
  const root = await createFixture();
  try {
    const checks: ApplicableCheckDeclaration[] = [
      declaration("typecheck", ["typecheck"], { program: "pnpm" }),
      declaration("format-check", ["format:check"], { program: "pnpm" }),
      declaration("build", ["build"], { program: "pnpm" }),
      declaration("domain", ["test:domain"], { program: "pnpm" }),
      declaration("openspec", ["validate", "--all", "--strict"], {
        program: "openspec",
      }),
      declaration("acceptance", ["test:acceptance"], { program: "pnpm" }),
    ];
    const prepared = await prepareDeliveryFullTestOperationPackage(root, {
      deliveryId,
      ownerAuthority: authority(),
      checks,
    });
    assert.notEqual(prepared, null);
    assert.deepEqual(
      prepared!.operationFacts.orderedChecks.map((check) => check.checkId),
      [
        "typecheck",
        "format-check",
        "build",
        "domain",
        "openspec",
        "acceptance",
      ],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("canonical Full Test Guidance remains generic and does not embed flowkit-next's six commands", async () => {
  const body = await readFile("skills/delivery/full-test/SKILL.md", "utf8");
  for (const forbidden of [
    "pnpm typecheck",
    "pnpm format:check",
    "pnpm build",
    "pnpm test:domain",
    "openspec validate --all --strict",
    "pnpm test:acceptance",
  ]) {
    assert.equal(body.includes(forbidden), false, forbidden);
  }
});
