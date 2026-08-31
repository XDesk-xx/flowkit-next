## Context

See `proposal.md` for motivation and `specs/repository-entropy-hygiene/spec.md` for the behavior contract.

The repository already owns `dependency-cruiser 18.2.0` for Structural Dependency Health through `dependency-cruiser.config.mjs` and `quality:dependency-health`. Explore/Reviewer proof established a separate entropy use case: determine whether every local `src` module belongs to the dependency closure of the two real production roots. The current repository baseline is 18/18 reachable.

Knip 6.32.2 was evaluated during Explore and rejected for this Stable Core scope. It is not package/lock truth and MUST NOT be adopted by this Change.

## Goals / Non-Goals

**Goals:**

- Reuse dependency-cruiser only as a TypeScript-aware graph extractor.
- Add a small deterministic production-root reachability check with exact roots `src/cli/entrypoint.ts` and `src/domain/index.ts`.
- Report exact unreachable `src` module paths and return a real non-zero process status.
- Prove healthy, isolated-dead, connected-dead-subgraph, and test-only-reference semantics with focused tests/fixtures.
- Expose one independent `quality:entropy` command.

**Non-Goals:**

- Knip integration or any replacement unused-package scanner.
- Unused dependency/export/type/test-file detection.
- Reimplementing Structural Dependency Health rules.
- Dynamic production-root registry/discovery.
- Baseline, waiver, cache, changed-file planning, automatic cleanup, quality registry/platform, or new Flowkit lifecycle state.
- Merging this check into `quality:gate`, `quality:dependency-health`, or Formal Full Test.

## Decisions

### 1. Reuse dependency-cruiser JSON rather than build a parser

`dependency-cruiser 18.2.0` remains the only graph extraction dependency. The entropy command invokes dependency-cruiser for `src` with JSON output and consumes resolved graph data; the reachability checker does not parse TypeScript/import syntax itself.

This avoids a second dependency-analysis implementation and keeps resolution semantics aligned with an already-adopted repository tool.

Alternative rejected: Knip file analysis. Explore proved file-entry behavior produced false-positive/false-negative semantics for this repository and its only selected high-confidence signal was unused package declarations, which is outside the narrowed capability.

Alternative rejected: custom TypeScript import parser. It would duplicate resolver behavior and create unnecessary maintenance.

### 2. Reachability is an explicit-root graph walk, not dependency-cruiser `orphan=true`

The checker constructs a map of graph modules whose `source` is under `src/`. It starts traversal from exactly:

```text
src/cli/entrypoint.ts
src/domain/index.ts
```

For each reachable module it follows dependencies whose resolved target is another local `src` module. Type-only local source edges remain part of liveness traversal; this does not alter Structural Dependency Health's separate runtime-cycle semantics.

The finding set is:

```text
all resolved local src modules - reachable local src modules
```

Any non-empty finding set exits non-zero and prints deterministic sorted paths.

`orphan=true` is explicitly not used: an internally connected dead subgraph can have edges and still be unreachable from every production root.

### 3. Production liveness ignores test-originating edges

The graph input for liveness is scoped to `src`, and traversal begins only from production roots. A `src` file imported exclusively by `tests/**` therefore remains unreachable and fails.

This keeps “used by a test” distinct from “live in production”.

### 4. Keep implementation as a thin repository script

Preferred implementation surface:

```text
scripts/check-production-reachability.mjs
package.json#scripts.quality:entropy
focused test file(s)
```

The script should consume dependency-cruiser JSON through a pipe or bounded child-process composition, validate that both exact roots exist, perform the local graph walk, emit a small machine-readable or stable human-readable result, and exit `0` only when unreachable is empty.

No reusable registry/planner abstraction is justified. If a future legitimate production root is introduced, a normal repository Change may update the explicit root list.

### 5. Keep quality commands independent

`quality:entropy` is a separate stable command. This Change does not edit the meaning of `quality:gate` or `quality:dependency-health` and does not make either command call the other.

## Risks / Trade-offs

- **[Risk] Explicit roots can become stale when a genuine new production entry surface is added.** → Keep the two roots visible in the checker/tests/spec; a future repository Change updates them explicitly rather than adding dynamic root discovery now.
- **[Risk] dependency-cruiser JSON shape/paths could change on a future tool upgrade.** → Keep parsing narrow, add focused tests for graph interpretation, and treat a missing expected root/invalid graph as fail-closed rather than silently passing.
- **[Risk] Generated or intentionally dormant source under `src` could be reported.** → Current proof shows zero baseline and no such accepted exception; do not prebuild waiver/baseline state. A real future case gets its own proof/change.
- **[Trade-off] Unused dependency declarations remain undetected by this Change.** → Accepted intentionally; Knip adoption cost exceeded the single selected signal's current value.

## Migration Plan

1. Add the thin reachability checker and focused tests against the existing zero baseline.
2. Add independent `quality:entropy` script using existing dependency-cruiser package truth.
3. Run healthy and disposable counterexample checks plus existing quality/dependency/type/build checks.
4. No dependency graph migration, lockfile adoption, detached environment refresh, or data migration is required.

Rollback is removal of the checker/tests/script entry; no persisted state or schema migration is involved.
