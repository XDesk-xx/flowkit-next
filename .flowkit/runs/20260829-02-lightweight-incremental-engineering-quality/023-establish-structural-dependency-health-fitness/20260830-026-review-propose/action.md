# 026 Review Propose — establish-structural-dependency-health-fitness

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-structural-dependency-health-fitness`
- Action: `review-propose`
- Run: `20260830-026-review-propose`
- Role: `reviewer`
- Input Run: `20260830-025-propose`
- Review chain start: `20260830-023-explore`

## Review result

Reviewer independently reviewed the Proposal against the approved 023 Explore and 024 Review Explore.

### Proposal convergence

The Proposal correctly freezes exactly the five approved generic structural dependency rules:

```text
unresolved imports
runtime circular dependencies
production → test/spec
production runtime → devDependency
undeclared external package use
```

It keeps Entropy Hygiene ownership separate and does not introduce architecture-layer law, changed-file planning, baseline/waiver state, Registry, Planner, Verification, or new lifecycle state.

### Exact dependency-cruiser semantics

The Proposal does not leave Apply to infer critical rule behavior.

It freezes:

```text
runtime cycles
→ circular:true
→ viaOnly.dependencyTypesNot=["type-only"]

production runtime → devDependency
→ dependencyTypes=["npm-dev"]
→ dependencyTypesNot=["type-only"]

production → test/spec
→ from.path="^src/"
→ generic tests/specs directory and *.test.* / *.spec.* target matching

undeclared external package
→ dependencyTypes=["npm-no-pkg","npm-unknown"]
```

and the required options:

```text
doNotFollow.path="node_modules"
tsConfig.fileName="tsconfig.json"
tsPreCompilationDeps="specify"
skipAnalysisNotInRules=true
```

Reviewer independently inspected dependency-cruiser 18.2.0's rule schema and ran bounded fixtures with the frozen config shape.

Reproduced:

```text
production runtime → devDependency
→ FAIL

production type-only → devDependency
→ allowed

runtime cycle containing a type-only edge
→ not reported as runtime-cycle violation

production → tests
→ FAIL

installed external package absent from package.json
→ no-undeclared-external-package FAIL
```

This materially supports the proposed config rather than relying only on prose.

### Command / ownership boundary

The proposed stable command:

```text
pnpm quality:dependency-health
```

remains separate from:

```text
pnpm quality:gate
```

and uses whole bounded `src + tests` graph execution.

The Proposal does not add:

```text
--affected
merge-base selection
changed-file planner
baseline/cache
waiver file
broader dependency-cruiser recommended bundle
Knip/orphan/unused dependency ownership
```

### Package truth / environment boundary

The Proposal correctly requires normal repository adoption of:

```text
dependency-cruiser 18.2.0
```

through:

```text
package.json
pnpm-lock.yaml
```

The prebuilt detached dependency environment remains execution preparation only.

Any later regenerated Linux node_modules archive remains outside this OpenSpec Change lifecycle.

### Validation

Reviewer independently verified:

```text
all five Proposal artifact SHA-256 values
→ match Author context

OpenSpec current Change --strict
→ PASS

OpenSpec --all --strict on the supplied delta-only OpenSpec surface
→ PASS (1 / 1 available item)
```

The Author's full-repository `12 / 12` strict claim cannot be independently replayed from this delta-only archive alone because the other canonical items are not present in the supplied payload. No inconsistency was found in the current Change, so this is not a Proposal blocker.

No production/package mutation is present in the Propose payload.

## Apply constraints

1. Implement the exact five selected rules/options frozen in `design.md`; do not substitute dependency-cruiser's recommended bundle.
2. Preserve `viaOnly.dependencyTypesNot=["type-only"]`; do not simplify runtime-cycle detection to blanket `circular:true`.
3. Keep production→devDependency runtime-only; type-only production use and test/dev-tool use must remain allowed.
4. Keep production→test/spec one-way only; tests→production remains allowed.
5. Keep undeclared-package health separate from unused-dependency Entropy ownership.
6. Add dependency-cruiser through normal package.json/pnpm-lock mutation; do not treat the prepared detached environment as repository truth.
7. Keep `quality:dependency-health` separate from `quality:gate`.
8. Keep whole-graph execution while cheap; do not add changed-file planning, baseline/cache, or waivers.
9. Run the exact bounded negative/positive fixtures declared in tasks.
10. Detached node_modules archive regeneration remains external execution-environment preparation, not an Apply task/completion condition.
11. Do not absorb Knip, orphan/unused detection, typecheck/build/tests into the dependency-health command, Formal Full Test, architecture layering, Registry, Planner, or lifecycle state.

## Verdict

```text
approved
```

The Proposal is Apply-ready.

## Next boundary

```text
apply
```

Reviewer did not Apply, mutate package/production truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
