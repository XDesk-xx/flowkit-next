# 037 Apply — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `apply`
- Run: `20260830-037-apply`
- Role: `author`
- Input: `20260830-036-review-propose` (`approved → apply`)
- Git checkpoint claim: `45bf8355448ef8a279cc68405cf1d9b89ab2c5c7`

## Bounded implementation

Implemented exactly the approved Repository Entropy Hygiene slice:

- added `scripts/check-production-reachability.mjs`;
- reused the already-adopted `dependency-cruiser 18.2.0` only to emit the `src` dependency graph;
- fixed the production roots to exactly:
  - `src/cli/entrypoint.ts`;
  - `src/domain/index.ts`;
- implemented a bounded local-`src` reachability walk over resolved edges, including type-only local source edges;
- fail-closed on missing exact roots, malformed graph structure, or dangling resolved local `src` graph targets;
- report unreachable production source paths deterministically in sorted order;
- added focused tests for healthy baseline, isolated dead source, connected dead subgraph, test-only reference, type-only liveness, and invalid input;
- added independent `quality:entropy` and focused `test:entropy` package scripts;
- completed all 10 approved OpenSpec Apply tasks.

The implementation does **not** use dependency-cruiser `orphan=true` as the dead-source rule.

No Knip dependency or replacement unused-package scanner was added. `pnpm-lock.yaml`, `dependency-cruiser.config.mjs`, `quality:gate`, and `quality:dependency-health` semantics remain unchanged. No production `src` module, Foundation lifecycle/authority, Policy, Run/Result, baseline/waiver/cache, changed-file planner, automatic cleanup, Registry/Platform, or new lifecycle state was added.

## Behavioral proof

The real repository and disposable counterexamples proved the approved semantics:

```text
healthy repository baseline
→ 18/18 production src modules reachable
→ PASS

isolated unreachable src module
→ exact module reported
→ exit 1

internally connected unreachable src subgraph
→ every module in the subgraph reported in sorted order
→ exit 1

test-only referenced production src module
→ remains unreachable from production roots
→ exact module reported
→ exit 1

type-only local src edge
→ traversed as production liveness
→ PASS
```

Focused entropy tests:

```text
7 / 7 PASS
```

## Integration verification

```text
pnpm quality:entropy
→ PASS, 18/18 reachable

pnpm quality:gate
→ PASS

pnpm quality:dependency-health
→ PASS, 0 violations, 46 modules / 160 dependencies

pnpm typecheck
→ PASS

pnpm build
→ PASS

OpenSpec current Change --strict
→ PASS

OpenSpec --all --strict
→ 13/13 PASS

git diff --check HEAD
→ PASS
```

The supplied detached `node_modules` snapshot is not exact current repository dependency-environment truth: it retains prior Explore-only Knip material/metadata and initially lacked the root `node_modules/yaml` link even though canonical `package.json` / `pnpm-lock.yaml` already declare `yaml@2.9.0`. Verification therefore used that snapshot only as execution preparation, restored the missing `yaml` link inside ignored `node_modules`, and invoked pnpm with execution-only `verify-deps-before-run=warn` so pnpm did not rewrite repository package truth. This environment preparation is not part of the Change payload and does not authorize or require a detached environment archive refresh.

Knip absence is proven from repository package/lock truth, not from the supplied detached execution snapshot.

## Conclusion

```text
PASS
→ review-apply
→ STOP
```

No archive, next-Change activation, Delivery Formal Full Test, Git checkpoint, commit, push or merge was performed.
