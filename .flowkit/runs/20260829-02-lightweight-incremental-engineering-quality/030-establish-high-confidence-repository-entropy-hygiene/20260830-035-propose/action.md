# 035 Propose — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `propose`
- Run: `20260830-035-propose`
- Role: `author`
- Input: `20260830-034-review-explore` (`approved → propose`)
- Git checkpoint claim: `45bf8355448ef8a279cc68405cf1d9b89ab2c5c7`

## Objective

Converge the Reviewer-approved narrowed Explore into the smallest formal OpenSpec contract for high-confidence Repository Entropy Hygiene.

## Proposal convergence

Created the complete spec-driven planning set:

- `proposal.md`
- `design.md`
- `specs/repository-entropy-hygiene/spec.md`
- `tasks.md`

The Proposal freezes exactly one entropy blocker:

```text
production source unreachable from exact production roots
```

Exact roots:

```text
src/cli/entrypoint.ts
src/domain/index.ts
```

Selected implementation shape remains deliberately small:

```text
existing dependency-cruiser 18.2.0
→ TypeScript-aware src graph extraction only

small bounded repository-local reachability checker
→ traverse local src edges from both exact roots
→ all src modules - reachable closure
→ non-empty finding set = FAIL
```

Critical accepted semantics preserved:

```text
dependency-cruiser orphan=true
≠ production-root unreachability

test-only reference
≠ production liveness

connected dead subgraph
→ still FAIL
```

Knip is explicitly retained only as rejected Explore evidence:

```text
Knip 6.32.2
→ evaluated
→ rejected for current Stable Core scope
→ MUST NOT enter package.json / pnpm-lock.yaml
```

The Proposal does not replace Knip with a home-grown unused-package scanner. Unused dependencies/exports/types remain deferred/excluded.

`quality:entropy` remains independent from:

```text
quality:gate
quality:dependency-health
Formal Full Test
```

No baseline, waiver, cache, changed-file planner, automatic cleanup, Registry/Platform, or new lifecycle/authority state is introduced.

## Validation

```text
OpenSpec planning set → 4/4 DONE
OpenSpec current Change strict → PASS
OpenSpec --all --strict → 13/13 PASS
git diff --check HEAD → PASS
package.json / pnpm-lock.yaml Knip truth → ABSENT
package mutation → NONE
production mutation → NONE
Apply → NOT STARTED
```

Proposal-stage graph sanity using the existing dependency-cruiser runtime plus the already-proven reachability semantics returned:

```json
{"productionModules":18,"reachable":18,"roots":["src/cli/entrypoint.ts","src/domain/index.ts"],"unreachable":[]}
```

## Conclusion

```text
PASS
→ review-propose
```

No Apply, production/package mutation, archive, next-Change activation, Git checkpoint, commit, push or merge was performed.
