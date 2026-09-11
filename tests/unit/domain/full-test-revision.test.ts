import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  invokeDeliveryFullTestOperation,
  readCurrentDeliveryFullTest,
} from "../../../src/domain/index.js";
import { readFullTestInput } from "../../../src/internal/full-test-input.js";
import { fixtureInstallation } from "./manager-installation-fixture.js";

const deliveryId = "revision-fixture";
const input = {
  deliveryId,
  ownerAuthority: {
    ref: "owner:" + "a".repeat(64),
    decision: "authorize-formal-full-test",
    deliveryId,
    sourceRef: "test:revision-fixture",
    scope: ["delivery-full-test"],
  },
};
const configPath = "config/verification/full-test.json";
const config = {
  inputs: ["src", "package.json", "pnpm-lock.yaml"],
  exclude: ["node_modules", ".flowkit"],
  environment: [],
  checks: [
    {
      checkId: "tool",
      program: process.execPath,
      args: ["node_modules/revision-tool/cli.cjs"],
      cwd: ".",
    },
  ],
};
const installation = fixtureInstallation(process.cwd());
for (const existing of [false, true]) {
  for (const mode of ["script", "separator", "eval"] as const) {
    test(`excluded output argv remains output (${mode}, existing=${existing})`, async () => {
      const { root, write } = await fixture();
      try {
        await fs.mkdir(path.join(root, ".tmp"));
        if (existing) await write(".tmp/report.json", "old report");
        const body =
          "require('node:fs').writeFileSync(process.argv.at(-1), 'new report');";
        await write("src/check.cjs", body);
        const launch =
          mode === "eval"
            ? ["-e", body]
            : mode === "separator"
              ? ["--", "src/check.cjs"]
              : ["src/check.cjs"];
        await write(
          configPath,
          JSON.stringify({
            ...config,
            exclude: [...config.exclude, ".tmp"],
            checks: [
              { ...config.checks[0], args: [...launch, ".tmp/report.json"] },
            ],
          }),
        );
        const before = await readFullTestInput(root);
        const outcome = await invokeDeliveryFullTestOperation(
          root,
          input,
          installation,
        );
        assert.equal(outcome.status, "terminal");
        if (outcome.status === "terminal")
          assert.equal(outcome.verdict, "passed");
        assert.equal(
          await fs.readFile(path.join(root, ".tmp/report.json"), "utf8"),
          "new report",
        );
        const after = await readFullTestInput(root);
        assert.equal(after.inputRef, before.inputRef);
        assert.equal(
          after.orderedChecks[0].toolRef,
          before.orderedChecks[0].toolRef,
        );
        assert.equal(
          (await readCurrentDeliveryFullTest(root, deliveryId)).status,
          "passed",
        );
        await write(".tmp/report.json", "later report");
        assert.equal(
          (await readCurrentDeliveryFullTest(root, deliveryId)).status,
          "passed",
        );
      } finally {
        await fs.rm(root, { recursive: true, force: true });
      }
    });
  }
}
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flowkit-revision-"));
  for (const dir of [
    "config/verification",
    "src",
    ".flowkit",
    "openspec/delivery-groups",
    "node_modules/revision-tool",
  ])
    await fs.mkdir(path.join(root, dir), { recursive: true });
  const write = (file: string, body: string) =>
    fs.writeFile(path.join(root, file), body);
  await write("src/value.js", "export const value = 1;\n");
  await write("package.json", '{"devDependencies":{"revision-tool":"1.0.0"}}');
  await write("pnpm-lock.yaml", "lockfileVersion: '9.0'\n");
  await write(".flowkit/project.json", '{"projectId":"revision-fixture"}');
  await write(
    "openspec/delivery-groups/" + deliveryId + ".yaml",
    `id: ${deliveryId}\ndelivery:\n  state: active\n  fullTestStatus: pending\n  finalizationStatus: pending\n`,
  );
  await write(configPath, JSON.stringify(config));
  await write(
    "node_modules/revision-tool/cli.cjs",
    "require('./implementation.cjs');\n",
  );
  await write(
    "node_modules/revision-tool/implementation.cjs",
    "process.stdout.write('pass');\n",
  );
  return { root, write };
}
for (const options of [
  [],
  ["--conditions", "development"],
  ["--conditions=development"],
  ["-C", "development"],
]) {
  test(`Node-launched tool bytes invalidate current PASS without lock drift (${options.join(" ")})`, async () => {
    const { root, write } = await fixture();
    try {
      await write(
        configPath,
        JSON.stringify({
          ...config,
          checks: [
            {
              ...config.checks[0],
              args: [...options, ...config.checks[0].args],
            },
          ],
        }),
      );
      const before = await readFullTestInput(root);
      await fs.mkdir(path.join(root, "node_modules/unrelated"));
      await write(
        "node_modules/unrelated/unused.cjs",
        "throw Error('not selected');\n",
      );
      assert.equal((await readFullTestInput(root)).inputRef, before.inputRef);
      const first = await invokeDeliveryFullTestOperation(
        root,
        input,
        installation,
      );
      assert.equal(first.status, "terminal");
      assert.equal(
        (await readCurrentDeliveryFullTest(root, deliveryId)).status,
        "passed",
      );
      await write(
        "node_modules/revision-tool/implementation.cjs",
        "process.exitCode=7;\n",
      );
      const after = await readFullTestInput(root);
      assert.equal(after.configRef, before.configRef);
      assert.notEqual(after.inputRef, before.inputRef);
      assert.notEqual(
        after.orderedChecks[0].checkRef,
        before.orderedChecks[0].checkRef,
      );
      assert.equal(
        (await readCurrentDeliveryFullTest(root, deliveryId)).status,
        "stale",
      );
      const failed = await invokeDeliveryFullTestOperation(
        root,
        input,
        installation,
      );
      assert.equal(failed.status, "terminal");
      if (failed.status === "terminal") assert.equal(failed.verdict, "failed");
      assert.equal(
        (await readCurrentDeliveryFullTest(root, deliveryId)).status,
        "failed",
      );
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
}

test("ambiguous Node options and unresolved entries reject preparation without an attempt", async () => {
  const { root, write } = await fixture();
  try {
    for (const args of [
      ["--unknown-option", "secret-do-not-echo", ...config.checks[0].args],
      ["--env-file", "private.env", ...config.checks[0].args],
      ["--conditions"],
      ["--conditions="],
      ["--conditions", "--import", "revision-tool"],
      ["--require"],
      ["--eval"],
      ["missing-entry.cjs"],
    ]) {
      await write(
        configPath,
        JSON.stringify({ ...config, checks: [{ ...config.checks[0], args }] }),
      );
      const result = await invokeDeliveryFullTestOperation(
        root,
        input,
        installation,
      );
      assert.equal(result.status, "failed");
      if (result.status === "failed") {
        assert.match(
          result.reason,
          /checks\[0\].resources: (FULL_TEST_NODE_ARGUMENTS_UNSUPPORTED|missing preload resource)/,
        );
        assert.equal(result.reason.includes("secret-do-not-echo"), false);
      }
      await assert.rejects(fs.stat(path.join(root, ".flowkit/artifacts")), {
        code: "ENOENT",
      });
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Node option values are not resources and do not hide later preloads or bind program argv", async () => {
  const { root, write } = await fixture();
  try {
    await write("development", "condition name, not an input");
    await write(
      "node_modules/revision-tool/package.json",
      '{"name":"revision-tool","exports":"./cli.cjs"}',
    );
    await fs.mkdir(path.join(root, ".tmp"));
    await write(".tmp/report.json", "old report");
    await write(
      configPath,
      JSON.stringify({
        ...config,
        exclude: [...config.exclude, ".tmp"],
        checks: [
          {
            ...config.checks[0],
            args: [
              "--conditions",
              "development",
              "--require",
              "revision-tool",
              "-e",
              "require('node:fs').writeFileSync(process.argv.at(-1), 'new report')",
              ".tmp/report.json",
            ],
          },
        ],
      }),
    );
    const before = await readFullTestInput(root);
    const result = await invokeDeliveryFullTestOperation(
      root,
      input,
      installation,
    );
    assert.equal(result.status, "terminal");
    if (result.status === "terminal") assert.equal(result.verdict, "passed");
    await write("development", "changed unrelated condition-named file");
    assert.equal((await readFullTestInput(root)).inputRef, before.inputRef);
    assert.equal(
      (await readCurrentDeliveryFullTest(root, deliveryId)).status,
      "passed",
    );
    await write(
      "node_modules/revision-tool/implementation.cjs",
      "process.exitCode=7;",
    );
    assert.equal(
      (await readCurrentDeliveryFullTest(root, deliveryId)).status,
      "stale",
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
test("invocation diagnoses configuration, input and executable preparation errors without publishing an attempt", async () => {
  const { root, write } = await fixture();
  try {
    const cases: [string, unknown, RegExp][] = [
      ["missing", null, /config.*ENOENT/],
      [
        "unknown",
        { ...config, typo: true },
        /config.*unknown-or-missing-fields/,
      ],
      ["input", { ...config, inputs: ["missing"] }, /inputs\[0\].*ENOENT/],
      [
        "tool",
        {
          ...config,
          checks: [{ ...config.checks[0], program: "revision-missing-tool" }],
        },
        /executable.*missing/,
      ],
    ];
    for (const [name, value, reason] of cases) {
      if (value === null) await fs.rm(path.join(root, configPath));
      else await write(configPath, JSON.stringify(value));
      const result = await invokeDeliveryFullTestOperation(
        root,
        input,
        installation,
      );
      assert.equal(result.status, "failed");
      if (result.status === "failed") assert.match(result.reason, reason, name);
      await assert.rejects(fs.stat(path.join(root, ".flowkit/artifacts")), {
        code: "ENOENT",
      });
    }
    await write(configPath, '{"environment":["secret-do-not-echo"]');
    const malformed = await invokeDeliveryFullTestOperation(
      root,
      input,
      installation,
    );
    assert.equal(malformed.status, "failed");
    if (malformed.status === "failed") {
      assert.match(malformed.reason, /config.parse.*invalid-json/);
      assert.equal(malformed.reason.includes("secret-do-not-echo"), false);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Node preload package implementation bytes are bound without reading unrelated packages", async () => {
  const { root, write } = await fixture();
  try {
    await write(
      "node_modules/revision-tool/package.json",
      '{"name":"revision-tool","exports":"./cli.cjs"}',
    );
    await write(
      configPath,
      JSON.stringify({
        ...config,
        checks: [
          {
            ...config.checks[0],
            args: ["--require", "revision-tool", "-e", "process.exitCode=0"],
          },
        ],
      }),
    );
    const first = await readFullTestInput(root);
    await write(
      "node_modules/revision-tool/implementation.cjs",
      "process.exitCode=7;\n",
    );
    const second = await readFullTestInput(root);
    assert.notEqual(
      first.orderedChecks[0].toolRef,
      second.orderedChecks[0].toolRef,
    );
    await write(
      configPath,
      JSON.stringify({
        ...config,
        checks: [
          {
            ...config.checks[0],
            args: ["--import=revision-tool", "-e", "process.exitCode=0"],
          },
        ],
      }),
    );
    const third = await readFullTestInput(root);
    await write(
      "node_modules/revision-tool/implementation.cjs",
      "process.exitCode=2;\n",
    );
    assert.notEqual((await readFullTestInput(root)).inputRef, third.inputRef);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
