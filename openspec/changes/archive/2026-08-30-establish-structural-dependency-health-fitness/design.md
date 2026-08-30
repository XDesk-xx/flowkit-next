## Context

See `proposal.md` and `specs/structural-dependency-health/spec.md`. The approved Explore/Reviewer boundary selects five generic bad-edge checks and confirms that the prepared detached D02 environment contains `dependency-cruiser 18.2.0`, but repository `package.json` / `pnpm-lock.yaml` do not yet adopt it. The Reviewer also froze the runtime/type-only distinction and required exact rule/options semantics rather than leaving them to Apply.

The approved Explore/Reviewer proof reports a zero selected baseline and interactive whole-graph execution (~1.2s). A proposal-stage configuration-shape sanity probe against `src` + `tests` also preserved zero selected violations. These facts justify keeping whole-graph execution simple; they do not create lifecycle authority or repository adoption.

## Goals / Non-Goals

**Goals:**

- Adopt one repository-local dependency graph checker with explicit selected rules only.
- Preserve the approved five-rule semantic boundary, including type-only exclusions.
- Keep a stable whole-graph command separate from `quality:gate`.
- Freeze enough config detail that Apply does not need to reinterpret rule semantics.
- Preserve package truth as `package.json` + `pnpm-lock.yaml`.

**Non-Goals:**

- No dependency-cruiser recommended bundle.
- No orphan, unused file/export/dependency detection; that belongs to Entropy Hygiene.
- No Clean Architecture/layer matrix, project-specific dependency law, path-mutation policy or graph platform.
- No changed-file/`--affected` planner, known-violation baseline, cache state, waiver registry or exception file.
- No Knip adoption.
- No typecheck/build/tests/OpenSpec/Archify/Formal Full Test inside the Structural Dependency Health command.
- No Registry, Planner, Verification surface or Flowkit lifecycle/authority state.

## Decisions

### Decision 1: Adopt `dependency-cruiser 18.2.0` as a repository devDependency

Apply will add the proofed tool through the repository package manager so both:

```text
package.json
pnpm-lock.yaml
```

represent the accepted dependency identity. The detached environment artifact is execution preparation only and MUST NOT be treated as package truth.

Expected package intent:

```text
devDependency:
dependency-cruiser@18.2.0
```

The exact package.json range syntax is allowed to follow the repository package-manager convention; the lockfile must resolve the adopted identity normally.

Alternative rejected: use the prebuilt detached `node_modules` without package mutation. That would make an environment snapshot, rather than repository package truth, the hidden dependency source.

### Decision 2: Use one explicit `dependency-cruiser.config.mjs`

The config will declare exactly five `severity: "error"` forbidden rules. It will NOT extend or copy dependency-cruiser's broader recommended rule set.

The required semantics are:

```js
{
  name: "no-unresolved-imports",
  severity: "error",
  from: {},
  to: { couldNotResolve: true }
}
```

```js
{
  name: "no-runtime-circular-dependencies",
  severity: "error",
  from: {},
  to: {
    circular: true,
    viaOnly: { dependencyTypesNot: ["type-only"] }
  }
}
```

The `viaOnly.dependencyTypesNot` restriction is essential: the circular rule matches only when no edge in the detected cycle is type-only. Apply MUST NOT replace it with blanket `circular: true`.

Production → test/spec remains one-way generic directionality:

```js
{
  name: "no-production-to-test-spec",
  severity: "error",
  from: { path: "^src/" },
  to: {
    path: "(^|/)(?:tests?|specs?)(?:/|$)|[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$"
  }
}
```

Production runtime → devDependency is runtime-only:

```js
{
  name: "no-production-runtime-to-dev-dependency",
  severity: "error",
  from: { path: "^src/" },
  to: {
    dependencyTypes: ["npm-dev"],
    dependencyTypesNot: ["type-only"]
  }
}
```

This intentionally allows test/dev-tool use and production type-only use.

Undeclared external package health is limited to package declaration absence:

```js
{
  name: "no-undeclared-external-package",
  severity: "error",
  from: {},
  to: {
    dependencyTypes: ["npm-no-pkg", "npm-unknown"]
  }
}
```

It does not detect unused package declarations.

Alternative rejected: the generated/recommended dependency-cruiser config, because it would also introduce orphan, deprecated, optional/peer and other policies not approved by Explore.

### Decision 3: Freeze the TypeScript/resolution options needed by the selected semantics

The config will use:

```js
options: {
  doNotFollow: { path: "node_modules" },
  tsConfig: { fileName: "tsconfig.json" },
  tsPreCompilationDeps: "specify",
  skipAnalysisNotInRules: true
}
```

Rationale:

- repository TypeScript resolution follows the repository tsconfig;
- type-only dependency identity remains available for the selected runtime/type-only rules;
- external packages are resolved/typed without recursively cruising their internals;
- analysis is limited to what the explicit rules need.

No baseline/cache option is configured.

### Decision 4: Expose a separate stable `quality:dependency-health` command

`package.json` will expose:

```text
pnpm quality:dependency-health
```

with command semantics equivalent to:

```text
depcruise --config dependency-cruiser.config.mjs --output-type err src tests
```

The command evaluates the whole bounded graph because the approved proof shows the current selected surface is cheap (~1.2s). It does not use `--affected`, merge-base logic, a changed-file selector or a baseline file.

`quality:gate` remains byte-for-byte semantically independent of this new command in this Change.

Alternative rejected: append dependency health to `quality:gate`. Reviewer explicitly froze these as separate D02 capabilities and commands.

### Decision 5: Keep acceptance proof fixture-based and bounded

Apply verification will use disposable fixtures/counterexamples to prove each selected failure mode and the critical allowed cases:

```text
unresolved import → FAIL
runtime-only cycle → FAIL
type-only-broken cycle → PASS for cycle rule
prod → test/spec → FAIL
test/spec → prod → allowed
prod runtime → devDependency → FAIL
prod type-only → devDependency → allowed
test → devDependency → allowed
undeclared external package → FAIL
```

Fixtures are proof inputs only; no fixture registry or persistent baseline is introduced.

## Risks / Trade-offs

- **[Risk] Dependency-cruiser upstream semantics drift in a future package upgrade** → Pin the adopted lock identity now; any later dependency upgrade is normal repository evolution and must preserve the OpenSpec behavior contract.
- **[Risk] Generic test/spec path matching misses a future project convention** → Current contract covers the repository's generic `tests?/specs?` locations and conventional `*.test.*` / `*.spec.*` files; expanding conventions later requires fresh proof, not a broad architecture layer system now.
- **[Risk] Whole-graph cost grows with repository size** → Keep whole-graph execution while it remains interactive; future performance proof may justify a separate bounded correction, but no planner/cache is prebuilt now.
- **[Trade-off] The rule set intentionally does not detect orphan/unused dependencies** → That separation prevents overlap with `establish-high-confidence-repository-entropy-hygiene`.

## Migration Plan

1. Add `dependency-cruiser 18.2.0` through normal repository package mutation and update the lockfile.
2. Add the explicit five-rule config and stable command.
3. Prove current whole-graph zero baseline and selected counterexamples.
4. Verify existing `quality:gate` semantics did not change.
5. Because the dependency graph changed, treat any regenerated Linux `node_modules` archive as separate execution-environment preparation after repository dependency truth is accepted; do not store it as an OpenSpec/Flowkit Change artifact.

Rollback is deletion of the new config/script entry and normal package-manager removal of the devDependency, restoring package/lock truth together.
