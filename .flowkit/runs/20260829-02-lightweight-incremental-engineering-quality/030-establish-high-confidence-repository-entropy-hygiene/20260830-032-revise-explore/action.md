# 032 Revise Explore — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `revise-explore`
- Run: `20260830-032-revise-explore`
- Role: `author`
- Input Run: `20260830-031-review-explore`
- Review chain start: `20260830-030-explore`
- Reviewer finding: `RE-031-001`
- Base: `45bf8355448ef8a279cc68405cf1d9b89ab2c5c7`

## Revision boundary

Applied `.agents/skills/revise-explore` and changed only the production dead-node proof rejected by Reviewer.

Reviewer correctly established:

```text
dependency-cruiser orphan=true
≠
unreachable from explicit production roots
```

The accepted Knip dependency-only branch was not reopened.

## Focused correction

The production dead-node blocker is now:

```text
dependency-cruiser 18.2.0
→ produce the resolved src graph under an entropy-only invocation/config

bounded root-reachability walk
→ exact roots:
   src/cli/entrypoint.ts
   src/domain/index.ts

any src module outside the reachable closure
→ FAIL
```

The reachability walk uses resolved local `src` dependencies, including type-only source edges. It does not change Structural Dependency Health runtime-cycle semantics.

## Decisive proof

Accepted repository baseline:

```json
{"productionModules":18,"reachable":18,"roots":["src/cli/entrypoint.ts","src/domain/index.ts"],"unreachable":[]}
```

Result:

```text
PASS / exit 0
~1.03s / ~165 MB max RSS
```

Reviewer-required internally connected dead subgraph:

```text
src/entropy-proof-dead-a.ts
  → src/entropy-proof-dead-b.ts

neither reachable from either production root
```

Corrected proof:

```json
{"productionModules":20,"reachable":18,"roots":["src/cli/entrypoint.ts","src/domain/index.ts"],"unreachable":["src/entropy-proof-dead-a.ts","src/entropy-proof-dead-b.ts"]}
```

Result:

```text
FAIL as required / exit 1
```

Disposable fixtures and proof config were removed after execution; baseline returned to 18/18 reachable.

## Preserved boundaries

Unchanged:

```text
Knip 6.32.2
→ unused direct dependency declarations only

broad unused exports/types
→ not blockers

unlisted/unresolved package use
→ Structural Dependency Health

quality:gate
→ unchanged

baseline / waiver / cache / changed-file planner / registry / platform
→ not introduced
```

## Result

```text
PASS — RE-031-001 resolved at Explore proof boundary
```

The revised full proof and Proposal constraints are in:

```text
openspec/changes/establish-high-confidence-repository-entropy-hygiene/explore.md
```

## STOP

Return to independent `review-explore`.

Do not Propose or Apply.
