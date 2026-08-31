# 025 Propose — establish-structural-dependency-health-fitness

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-structural-dependency-health-fitness`
- Action: `propose`
- Run: `20260830-025-propose`
- Role: `author`
- Input: `20260830-024-review-explore` (`approved → propose`)
- Git checkpoint claim: `cd043cec52b5712d171a6bac72e246466a7c27b9`

## Objective

Converge the Reviewer-approved proof-based Explore into the smallest formal OpenSpec contract for repository-local Structural Dependency Health.

## Proposal convergence

Created the complete spec-driven planning set:

- `proposal.md`
- `design.md`
- `specs/structural-dependency-health/spec.md`
- `tasks.md`

The Proposal freezes exactly five selected structural dependency rules:

```text
unresolved imports
runtime circular dependencies
production → test/spec
production runtime → devDependency
undeclared external package use
```

Critical approved semantics preserved:

```text
runtime cycle
→ MUST exclude any circular path broken by a type-only edge
→ dependency-cruiser viaOnly.dependencyTypesNot = ["type-only"]

production → devDependency
→ runtime-only
→ type-only production use allowed
→ test/dev-tool use allowed

production → test/spec
→ one-way only
→ tests → production allowed

undeclared package
→ package declaration health only
→ unused dependency remains Entropy Hygiene
```

Implementation is frozen to explicit selected `dependency-cruiser 18.2.0` rules/options, not the broader recommended bundle. The stable command is planned as:

```text
pnpm quality:dependency-health
```

and remains separate from:

```text
pnpm quality:gate
```

Whole-graph `src + tests` execution is retained while cheap/interactive; no changed-file planner, `--affected`, baseline/cache state, waiver machinery, Registry or Planner is introduced.

Repository package adoption is deferred correctly to Apply:

```text
prepared detached dependency environment contains dependency-cruiser
≠ accepted package.json / pnpm-lock.yaml truth
```

## Validation

```text
OpenSpec change strict → PASS
OpenSpec --all --strict → 12/12 PASS
git diff --check HEAD → PASS
production mutation → NONE
package.json / pnpm-lock.yaml mutation → NONE
Apply → NOT STARTED
```

A proposal-stage configuration-shape sanity probe for the frozen five-rule surface reported zero selected violations on the current `src + tests` graph, consistent with the approved Explore/Reviewer proof.

## Explicit non-goals preserved

```text
Knip
orphan / unused file / unused export / unused dependency detection
Clean Architecture / layer law
path mutation policy
changed-file / merge-base planning
known-violation baseline / cache / waiver
quality:gate mutation
typecheck / build / tests inside dependency-health command
Formal Full Test
Verification Planner / Evidence Platform
Gate / Check Registry
new lifecycle / authority state
```

## Conclusion

```text
PASS
→ review-propose
```

No Apply, package mutation, production mutation, archive, next-Change activation, Git checkpoint, commit, push or merge was performed.
