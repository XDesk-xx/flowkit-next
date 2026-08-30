import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { stringify } from "yaml";

import {
  resolveTrustedChangeCoordination,
  TrustedChangeCoordinationError,
} from "../../../src/cli/trusted-change-coordination.js";

const DELIVERY = "delivery-one";
const CHANGE = "change-one";
const DEPENDENCY = "foundation-correction";

function ownerDecision(overrides: Record<string, unknown> = {}) {
  return {
    ref: `owner:${"a".repeat(64)}`,
    decision: "activate-change",
    deliveryId: DELIVERY,
    changeId: CHANGE,
    sourceRef: "owner-test",
    scope: ["explore"],
    ...overrides,
  };
}

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    id: DELIVERY,
    changes: [{ id: CHANGE, state: "active", dependsOn: [] }],
    ownerDecisions: [ownerDecision()],
    ...overrides,
  };
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "flowkit-coordination-"));
  const dir = path.join(root, "openspec", "delivery-groups");
  await mkdir(dir, { recursive: true });
  return { root, file: path.join(dir, `${DELIVERY}.yaml`) };
}

async function writeManifest(file: string, value: unknown): Promise<void> {
  await writeFile(file, stringify(value));
}

async function rejectKind(
  promise: Promise<unknown>,
  kind: TrustedChangeCoordinationError["kind"],
): Promise<void> {
  await assert.rejects(
    promise,
    (error: unknown) =>
      error instanceof TrustedChangeCoordinationError && error.kind === kind,
  );
}

test("planned state is reportable without activation provenance or completed dependencies", async () => {
  const f = await fixture();
  try {
    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: CHANGE, state: "planned", dependsOn: [DEPENDENCY] },
          { id: DEPENDENCY, state: "active", dependsOn: [] },
        ],
        ownerDecisions: [],
      }),
    );
    assert.equal(
      await resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "planned",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("active state requires exact explore activation provenance", async () => {
  const f = await fixture();
  try {
    for (const decisions of [
      [],
      [ownerDecision({ scope: ["checkpoint"] })],
      [ownerDecision({ changeId: "other-change" })],
      [ownerDecision({ deliveryId: "other-delivery" })],
      [ownerDecision({ decision: "revise-action", scope: ["revise-explore"] })],
      [
        ownerDecision({
          decision: "authorize-checkpoint",
          scope: ["checkpoint"],
        }),
      ],
    ]) {
      await writeManifest(f.file, manifest({ ownerDecisions: decisions }));
      await rejectKind(
        resolveTrustedChangeCoordination({
          repositoryRoot: f.root,
          deliveryId: DELIVERY,
          changeId: CHANGE,
        }),
        "activation-provenance-missing",
      );
    }

    await writeManifest(f.file, manifest());
    assert.equal(
      await resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "active",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("active state requires every direct dependency to resolve exactly once and be completed", async () => {
  const f = await fixture();
  try {
    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: CHANGE, state: "active", dependsOn: [DEPENDENCY] },
          { id: DEPENDENCY, state: "planned", dependsOn: [] },
        ],
      }),
    );
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "dependency-unsatisfied",
    );

    await writeManifest(
      f.file,
      manifest({
        changes: [{ id: CHANGE, state: "active", dependsOn: [DEPENDENCY] }],
      }),
    );
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "dependency-invalid",
    );

    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: CHANGE, state: "active", dependsOn: [DEPENDENCY] },
          { id: DEPENDENCY, state: "completed", dependsOn: [] },
          { id: DEPENDENCY, state: "completed", dependsOn: [] },
        ],
      }),
    );
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "dependency-invalid",
    );

    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: CHANGE, state: "active", dependsOn: [DEPENDENCY] },
          { id: DEPENDENCY, state: "completed", dependsOn: [] },
        ],
      }),
    );
    assert.equal(
      await resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "active",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("manifest identity and exact Change shape fail closed", async () => {
  const f = await fixture();
  try {
    await writeManifest(f.file, manifest({ id: "other-delivery" }));
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "delivery-identity-mismatch",
    );

    await writeManifest(f.file, manifest({ changes: [] }));
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "change-not-found",
    );

    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: CHANGE, state: "active", dependsOn: [] },
          { id: CHANGE, state: "active", dependsOn: [] },
        ],
      }),
    );
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "change-duplicate",
    );

    await writeManifest(
      f.file,
      manifest({ changes: [{ id: CHANGE, state: "unknown", dependsOn: [] }] }),
    );
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "manifest-invalid",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("duplicate dependency declarations and malformed coordination fields fail closed", async () => {
  const f = await fixture();
  try {
    await writeManifest(
      f.file,
      manifest({
        changes: [
          {
            id: CHANGE,
            state: "active",
            dependsOn: [DEPENDENCY, DEPENDENCY],
          },
        ],
      }),
    );
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "dependency-invalid",
    );

    await writeManifest(f.file, { ...manifest(), ownerDecisions: {} });
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "manifest-invalid",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("D02-style dependent Change becomes lifecycle-enterable only after correction completion and its own activation", async () => {
  const f = await fixture();
  try {
    const qualityChange = "quality-change";
    const qualityDecision = {
      ref: `owner:${"b".repeat(64)}`,
      decision: "activate-change",
      deliveryId: DELIVERY,
      changeId: qualityChange,
      sourceRef: "owner-quality",
      scope: ["explore"],
    };

    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: DEPENDENCY, state: "active", dependsOn: [] },
          { id: qualityChange, state: "planned", dependsOn: [DEPENDENCY] },
        ],
        ownerDecisions: [],
      }),
    );
    assert.equal(
      await resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: qualityChange,
      }),
      "planned",
    );

    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: DEPENDENCY, state: "active", dependsOn: [] },
          { id: qualityChange, state: "active", dependsOn: [DEPENDENCY] },
        ],
        ownerDecisions: [qualityDecision],
      }),
    );
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: qualityChange,
      }),
      "dependency-unsatisfied",
    );

    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: DEPENDENCY, state: "completed", dependsOn: [] },
          { id: qualityChange, state: "active", dependsOn: [DEPENDENCY] },
        ],
        ownerDecisions: [],
      }),
    );
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: qualityChange,
      }),
      "activation-provenance-missing",
    );

    await writeManifest(
      f.file,
      manifest({
        changes: [
          { id: DEPENDENCY, state: "completed", dependsOn: [] },
          { id: qualityChange, state: "active", dependsOn: [DEPENDENCY] },
        ],
        ownerDecisions: [qualityDecision],
      }),
    );
    assert.equal(
      await resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: qualityChange,
      }),
      "active",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("historical activation provenance never upgrades completed or cancelled durable state", async () => {
  const f = await fixture();
  try {
    for (const state of ["completed", "cancelled"] as const) {
      await writeManifest(
        f.file,
        manifest({ changes: [{ id: CHANGE, state, dependsOn: [] }] }),
      );
      assert.equal(
        await resolveTrustedChangeCoordination({
          repositoryRoot: f.root,
          deliveryId: DELIVERY,
          changeId: CHANGE,
        }),
        state,
      );
    }
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("missing and invalid YAML manifests fail closed", async () => {
  const f = await fixture();
  try {
    await rm(f.file, { force: true });
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "manifest-read-failed",
    );

    await writeFile(f.file, "id: [");
    await rejectKind(
      resolveTrustedChangeCoordination({
        repositoryRoot: f.root,
        deliveryId: DELIVERY,
        changeId: CHANGE,
      }),
      "manifest-invalid",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
