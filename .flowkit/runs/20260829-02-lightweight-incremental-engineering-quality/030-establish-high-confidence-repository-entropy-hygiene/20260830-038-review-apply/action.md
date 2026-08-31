# 038 Review Apply — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `review-apply`
- Run: `20260830-038-review-apply`
- Role: `reviewer`
- Input Run: `20260830-037-apply`
- Review chain start: `20260830-030-explore`

## Full review-chain reconstruction

Reviewer re-reviewed the complete chain rather than reviewing 037 in isolation:

```text
030 Explore
→ original orphan=true + Knip candidate

031 Review Explore
→ CHANGES REQUESTED
→ RE-031-001:
   orphan=true != unreachable-from-production-roots

033 Revise Explore
→ replaced orphan rule with explicit-root reachability
→ rejected Knip for current Stable Core scope

034 Review Explore
→ APPROVED
→ RE-031-001 resolved

035 Propose
→ froze only the 033/034 approved capability

036 Review Propose
→ APPROVED
→ apply

037 Apply
→ implemented the final approved root-reachability capability
```

Reviewer verified the 037 input review hash exactly matches the 036 Reviewer archive.

No rejected 030 semantics were reintroduced.

## Apply delta

The bounded repository implementation is:

```text
scripts/check-production-reachability.mjs
tests/unit/quality/production-reachability.test.mjs
package.json scripts:
- test:entropy
- quality:entropy
```

No production `src` module is mutated.

No dependency graph/package dependency is added.

`pnpm-lock.yaml` and `dependency-cruiser.config.mjs` remain unchanged.

The implementation uses dependency-cruiser 18.2.0 only to obtain the `src` graph, then performs its own small local reachability walk from exactly:

```text
src/cli/entrypoint.ts
src/domain/index.ts
```

It does not use `orphan=true`.

It follows resolved local `src` edges regardless of type-only dependency classification, so type-only local source relationships remain production-liveness edges.

It fails closed on:
- missing exact roots;
- malformed graph structure;
- duplicate local source modules;
- dangling resolved local `src` targets;
- dependency-cruiser graph-extraction process failure;
- malformed dependency-cruiser JSON.

Unreachable paths are emitted deterministically in sorted order.

## Independent behavioral reproduction

Reviewer used the real dependency-cruiser JSON path, not only synthetic graph unit tests.

### Accepted baseline

```text
quality:entropy
→ PASS
→ 18 / 18 production modules reachable
```

### Focused tests

```text
test:entropy
→ 7 / 7 PASS
```

Covered:
- healthy graph;
- type-only liveness;
- isolated unreachable source;
- internally connected unreachable subgraph;
- test-only reference does not create production liveness;
- missing exact root fail-closed;
- malformed/dangling graph fail-closed.

### Real disposable repository fixtures

Reviewer independently created actual temporary source files in the candidate repository.

Isolated source:

```text
src/entropy-review-isolated.ts
→ quality:entropy exit 1
→ exact path reported
```

Connected dead subgraph:

```text
src/entropy-review-dead-a.ts
→ imports
src/entropy-review-dead-b.ts

neither reachable from either production root
→ quality:entropy exit 1
→ both paths reported in deterministic sorted order
```

After fixture removal:

```text
baseline
→ 18 / 18 reachable
```

Reviewer also verified a dependency-health-only unresolved import in a live source does not become an entropy finding; the entropy command remains scoped to reachability rather than duplicating Structural Dependency Health failure ownership.

## Independent integration checks

Execution identity:

```text
Node 22.23.2
pnpm 11.22.0
dependency-cruiser 18.2.0
OpenSpec 1.10.0
```

The supplied prepared `node_modules` snapshot predates current package-state metadata. Reviewer treated it only as execution preparation, restored the already-canonical direct `yaml` link, and used the same execution-only:

```text
verify-deps-before-run=warn
```

mode recorded by Author.

Reviewer independently reproduced:

```text
pnpm quality:entropy
→ PASS, 18/18 reachable

pnpm quality:gate
→ PASS

pnpm quality:dependency-health
→ PASS, 0 violations
→ 46 modules / 160 dependencies

pnpm typecheck
→ PASS

pnpm build
→ PASS

domain tests
→ 124 / 124 PASS

git diff --check HEAD
→ PASS

Prettier check including the new entropy script
→ PASS

OpenSpec current Change --strict
→ PASS
```

The reusable prepared node_modules snapshot remains non-canonical execution-environment material. Its stale metadata/extra Explore-only Knip bytes do not constitute repository package truth.

## Package / scope audit

Confirmed:

```text
Knip in package.json
→ NO

Knip in pnpm-lock.yaml
→ NO

new package dependency
→ NO

pnpm-lock mutation
→ NO

dependency-cruiser config mutation
→ NO

quality:gate semantic mutation
→ NO

quality:dependency-health semantic mutation
→ NO

production source mutation
→ NO
```

No unused-package scanner, baseline, waiver, cache, changed-file planner, automatic cleanup, quality Registry/Platform, or new lifecycle/authority state was added.

## OpenSpec validation note

Reviewer independently validates the current entropy Change with managed OpenSpec 1.10.0:

```text
current Change --strict
→ PASS
```

The Author records exact-current-repository:

```text
--all --strict
→ 13 / 13 PASS
```

Reviewer’s locally reconstructed base contains stale pre-archive D02 Change directories, so it is not used as an exact full-repository replay source for that count. No current-Change OpenSpec inconsistency was found.

## Verdict

```text
approved
```

No blocking implementation, proof, package-truth, or scope defect was found.

## Next boundary

```text
archive
```

Per canonical Foundation Policy:

```text
review-apply approved
→ archive
```

No pseudo `owner-authorized-archive` boundary is introduced.

Reviewer did not archive, activate another Change, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
