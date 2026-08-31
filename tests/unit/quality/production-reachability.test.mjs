import assert from "node:assert/strict";
import test from "node:test";

import {
  PRODUCTION_ROOTS,
  analyzeProductionReachability,
  runEntropyCheck,
} from "../../../scripts/check-production-reachability.mjs";

function dependency(resolved, dependencyTypes = ["local", "import"]) {
  return { resolved, dependencyTypes };
}

function module(source, dependencies = []) {
  return { source, dependencies };
}

function graph(extraModules = []) {
  return {
    modules: [
      module("src/cli/entrypoint.ts", [dependency("src/cli/live.ts")]),
      module("src/cli/live.ts"),
      module("src/domain/index.ts", [
        dependency("src/domain/type-live.ts", ["local", "type-only", "import"]),
      ]),
      module("src/domain/type-live.ts"),
      ...extraModules,
    ],
  };
}

test("accepted repository baseline has every production source reachable", () => {
  const result = runEntropyCheck();

  assert.equal(result.reachable.length, result.total);
  assert.deepEqual(result.unreachable, []);
});

test("healthy graph passes and type-only local source edges remain liveness edges", () => {
  const result = analyzeProductionReachability(graph());

  assert.equal(result.total, 4);
  assert.deepEqual(result.unreachable, []);
  assert.ok(result.reachable.includes("src/domain/type-live.ts"));
});

test("isolated unreachable production source is reported", () => {
  const result = analyzeProductionReachability(graph([module("src/dead.ts")]));

  assert.deepEqual(result.unreachable, ["src/dead.ts"]);
});

test("internally connected unreachable subgraph reports every module deterministically", () => {
  const result = analyzeProductionReachability(
    graph([
      module("src/dead-b.ts", [dependency("src/dead-a.ts")]),
      module("src/dead-a.ts", [dependency("src/dead-b.ts")]),
    ]),
  );

  assert.deepEqual(result.unreachable, ["src/dead-a.ts", "src/dead-b.ts"]);
});

test("test-only reference does not create production liveness", () => {
  const result = analyzeProductionReachability({
    modules: [
      ...graph([module("src/test-only.ts")]).modules,
      module("tests/unit/test-only.test.ts", [dependency("src/test-only.ts")]),
    ],
  });

  assert.deepEqual(result.unreachable, ["src/test-only.ts"]);
});

test("missing exact production root fails closed", () => {
  const missingRootGraph = graph();
  missingRootGraph.modules = missingRootGraph.modules.filter(
    ({ source }) => source !== PRODUCTION_ROOTS[1],
  );

  assert.throws(
    () => analyzeProductionReachability(missingRootGraph),
    /production root missing from dependency graph/,
  );
});

test("malformed graph and dangling local src dependencies fail closed", () => {
  assert.throws(
    () => analyzeProductionReachability({ modules: "not-an-array" }),
    /graph\.modules must be an array/,
  );

  assert.throws(
    () =>
      analyzeProductionReachability({
        modules: [
          module("src/cli/entrypoint.ts", [dependency("src/missing.ts")]),
          module("src/domain/index.ts"),
        ],
      }),
    /resolved local src dependency missing from graph: src\/missing\.ts/,
  );
});
