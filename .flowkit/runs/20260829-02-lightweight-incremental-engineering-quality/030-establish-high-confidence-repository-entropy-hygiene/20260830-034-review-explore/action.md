# 034 Review Explore — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `review-explore`
- Run: `20260830-034-review-explore`
- Role: `reviewer`
- Input Run: `20260830-033-revise-explore`
- Review chain start: `20260830-030-explore`

## Review result

Reviewer independently re-reviewed the revised Explore against `RE-031-001` and the narrowed Owner scope recorded by Author.

### RE-031-001 — RESOLVED

The revised Explore no longer equates:

```text
dependency-cruiser orphan=true
```

with:

```text
unreachable from production roots
```

The selected semantics are now:

```text
dependency-cruiser
→ extract TypeScript-aware src dependency graph

explicit production roots:
- src/cli/entrypoint.ts
- src/domain/index.ts

bounded graph traversal
→ reachable src modules

all src modules - reachable
→ production entropy findings
```

Reviewer independently reproduced the current repository baseline:

```text
production modules = 18
reachable          = 18
unreachable        = []
```

Reviewer then independently added the decisive connected dead-subgraph fixture:

```text
src/entropy-proof-dead-a.ts
→ imports src/entropy-proof-dead-b.ts

neither module is reachable from either explicit production root
```

Result:

```text
production modules = 20
reachable          = 18
unreachable        =
- src/entropy-proof-dead-a.ts
- src/entropy-proof-dead-b.ts
```

This proves the selected mechanism catches the exact case that invalidated the original `orphan=true` proof.

Reviewer also added a test-only import of the dead subgraph and confirmed it remains unreachable from production roots. Test references therefore do not define production liveness.

### Knip scope correction

The revised Explore explicitly rejects Knip 6.32.2 for the current Stable Core scope.

Reviewer confirms current repository package truth contains:

```text
dependency-cruiser 18.2.0
→ present

Knip
→ absent from package.json
→ absent from pnpm-lock.yaml
```

The Explore preserves the useful historical Knip evidence but does not force adoption merely because one dependency-only signal worked.

This is a valid bounded cost/value correction:

```text
unused direct dependency detection
→ deferred

unused exports/types
→ excluded

home-grown unused dependency scanner
→ prohibited
```

No additional repository dependency, lockfile mutation, detached environment refresh, baseline/waiver state, or new subsystem is required by the selected capability.

### Scope discipline

The Proposal-ready capability is now intentionally one blocker:

```text
production source unreachable from exact production roots
```

It does not absorb:

```text
bad dependency-edge ownership
unused dependency ownership
unused exports/types
test dead-code ownership
changed-file planning
baseline/cache/waiver
automatic deletion/fix
quality registry/platform
new Flowkit lifecycle or authority state
```

The independent `quality:entropy` command remains separate from:

```text
quality:gate
quality:dependency-health
Formal Full Test
```

## Proposal constraints

Proposal should freeze only the proven narrowed capability:

1. Exact current production roots:
   - `src/cli/entrypoint.ts`
   - `src/domain/index.ts`
2. Existing dependency-cruiser 18.2.0 is graph extraction infrastructure only.
3. Do not use `orphan=true` as the production dead-node rule.
4. Freeze the exact graph-output interpretation and local `src` edge traversal semantics needed by the bounded reachability checker.
5. Any resolved `src` module outside the closure of both roots is a mechanical failure.
6. Include:
   - healthy zero baseline;
   - isolated unreachable source;
   - internally connected unreachable subgraph;
   - production source referenced only by tests.
7. Keep the checker read-only, deterministic, and small.
8. Keep one independent `quality:entropy` command.
9. Do not add Knip to package/lock truth.
10. Do not create a replacement unused-package scanner.
11. Unused dependencies/exports/types remain deferred/excluded.
12. Do not add baseline/waiver/cache/changed-file planning, registry/platform, automatic cleanup, or lifecycle state.

A future legitimate new production root may be added by a normal repository Change; no dynamic root registry is justified now.

## Verdict

```text
approved
```

The Explore is Proposal-ready.

## Next boundary

```text
propose
```

Reviewer did not mutate Author Explore, create Proposal artifacts, Apply, mutate package truth, activate another Change, archive, run Formal Full Test, checkpoint, commit, push, or merge.
