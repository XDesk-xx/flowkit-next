# 031 Review Explore — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `review-explore`
- Run: `20260830-031-review-explore`
- Role: `reviewer`
- Input Run: `20260830-030-explore`
- Review chain start: `20260830-030-explore`

## Independent review result

Reviewer independently reviewed the Author Explore against the approved D02 Repository Entropy Hygiene boundary.

Most of the Explore is well-bounded:

```text
selected entropy ownership
→ dead/stale production material only

unused direct package declarations
→ Knip dependency-only

bad dependency edges
→ remain Structural Dependency Health

broad unused exports/types
→ explicitly excluded

quality:gate
→ unchanged

no baseline / waiver / changed-file planner / registry / platform
```

The Knip dependency-only proof was independently reproduced:

```text
KNIP_DISABLE_RAW_TRANSFER=1
knip --include dependencies --reporter json

current candidate
→ {"issues":[]}
→ exit 0

temporary unused direct devDependency "kleur"
→ reported in package.json
→ exit 1
```

This branch is Proposal-ready.

## Blocking finding

### RE-031-001 — `orphan=true` does not prove production-root unreachability

The Explore defines the intended blocker as:

```text
unused production source files / dead production nodes
```

and later states:

```text
scan production source graph only: src/**

legitimate explicit graph roots:
- src/cli/entrypoint.ts
- src/domain/index.ts

any other production source module with orphan=true
→ mechanical failure
```

However dependency-cruiser 18.2.0 defines `from.orphan=true` as a module with:

```text
no incoming dependencies
AND
no outgoing dependencies
```

That is not equivalent to:

```text
not reachable from the explicit production roots
```

Reviewer independently reproduced the exact distinction.

Baseline:

```text
current src graph
→ 0 orphan violations
```

Single isolated fixture:

```text
src/entropy-proof-orphan.ts
(no incoming, no outgoing)
→ FAIL as expected
```

But a dead two-module subgraph:

```text
src/entropy-proof-dead-a.ts
  → imports src/entropy-proof-dead-b.ts

neither module is reachable from:
- src/cli/entrypoint.ts
- src/domain/index.ts
```

produced:

```text
dependency-cruiser orphan rule
→ 0 violations
→ exit 0
```

So the current proof catches only isolated nodes, not all production modules unreachable from the explicit roots.

The separate statement:

```text
current 18 production modules
→ all reachable from roots
```

does not fix this, because the proposed mechanical blocker is still `orphan=true`; it would fail to detect a future unreachable dead cluster.

### Required smallest revise-explore

Do not broaden the Change or add a dead-code platform.

Revise only the production dead-node proof so the selected contract and the mechanical proof mean the same thing.

The revised Explore must include a decisive counterexample:

```text
two or more production modules
→ internally connected
→ entire subgraph unreachable from the explicit production roots
→ selected entropy check MUST fail
```

Acceptable outcomes:

```text
A. prove a small bounded production-root reachability check
   over the dependency graph;

or

B. explicitly narrow the capability to isolated orphan modules only,
   and prove that this narrower contract is sufficient for the D02
   authorized goal.
```

Reviewer recommends A because the Explore already names exact production roots and claims dead production-node ownership. The implementation shape is not prescribed here.

Do not:
- merge entropy rules into `quality:dependency-health`;
- introduce a graph registry, baseline database, cache, waiver system, or changed-file planner;
- reopen the already-valid Knip dependency-only branch;
- hard-fail unused exports/types.

## Verdict

```text
changes-requested
```

## Next boundary

```text
revise-explore
```

Reviewer did not mutate Author Explore, create Proposal artifacts, Apply, mutate package truth, activate another Change, archive, run Formal Full Test, checkpoint, commit, push, or merge.
