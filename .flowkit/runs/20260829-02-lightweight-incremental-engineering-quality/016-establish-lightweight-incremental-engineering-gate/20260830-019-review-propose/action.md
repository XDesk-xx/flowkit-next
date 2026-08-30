# 019 Review Propose — establish-lightweight-incremental-engineering-gate

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-lightweight-incremental-engineering-gate`
- Action: `review-propose`
- Run: `20260830-019-review-propose`
- Role: `reviewer`
- Input Run: `20260830-018-propose`
- Review chain start: `20260830-016-explore`

## Review result

Reviewer independently reviewed the Proposal against the approved 016 Explore and 017 Review Explore.

### Proposal convergence

The Proposal correctly freezes the proven Lightweight Engineering Gate surface:

```text
git diff --check HEAD
bounded Prettier
selected ESLint
src/**/*.ts max-lines=650
narrow forbidden tracked-artifact matcher
one stable repository-local quality:gate entrypoint
```

It preserves:

```text
~600 lines
→ guidance only

650 lines
→ hard production TypeScript Gate boundary
```

The six historical cleanup items remain bounded to the exact Explore-proven unused artifacts.

### ESLint boundary

The Proposal stays within the approved rule surface:

```text
@eslint/js recommended
+ typescript-eslint recommended

production src/**/*.ts
→ retain no-explicit-any
→ retain ban-ts-comment
→ max-lines=650

exact run-result-persistence.ts
→ no-control-regex off

tests/**/*.ts
→ no-explicit-any off
→ no-unused-vars remains error
→ ^_ intentional discard allowed
```

No type-aware lint platform, type-coverage KPI, waiver registry, or semantic architecture rule set is introduced.

### Forbidden tracked-artifact boundary

The matcher remains exactly bounded to:

```text
any segment:
node_modules / dist / coverage / .tmp

repository-root only:
tools / runtime

archive suffix anywhere:
*.node-modules.tar.gz
*.pnpm-store.tar.gz
```

Legal nested:

```text
config/tools/**
skills/tools/**
```

remain explicitly protected from false positives.

No generic path-policy or mutation-surface gate is introduced.

### Gate ownership

The Proposal correctly excludes from `quality:gate`:

```text
typecheck
build
domain tests
acceptance tests
OpenSpec validation
Archify
dependency-cruiser
Knip
Formal Full Test
```

Those may be used only as Apply verification where declared in tasks.

No Verification verdict, Owner authority, Reviewer verdict, Run/Result control plane, Gate Registry, baseline database, changed-file planner, evidence platform, or quality dashboard is added.

## Independent validation

Reviewer independently verified:

```text
all four Proposal artifact hashes
→ match Author context

OpenSpec current Change --strict
→ PASS

reconstructed current canonical OpenSpec set --all --strict
→ 11 / 11 PASS
```

No production/package mutation is present in the Propose payload.

## Apply constraints

Apply must preserve the Proposal exactly.

In particular:

1. `format` / `format:check` must implement the normative bounded formatting ownership declared by the spec. Do not interpret “retain existing inputs” in a way that leaves governed source/test code outside the intended bounded `src` / `tests` surface, and do not expand to `prettier --check .`.
2. The `lint` entrypoint must remain the proven source/test lint surface. Do not use implementation convenience to turn it into an unproven repository-wide JS/config lint ownership expansion.
3. Remove only the six proven unused artifacts; no neighboring cleanup/refactor.
4. Keep `max-lines=650` with the proven physical-line semantics; do not add a second ~600 mechanical threshold.
5. Keep the exact control-regex and test overrides narrow.
6. Keep the forbidden-artifact matcher exact and read-only over Git-tracked paths.
7. `quality:gate` must remain mechanical-only and interactive.
8. Typecheck/build/tests/OpenSpec validation may verify Apply but must not become Gate members.
9. Do not add dependency-cruiser, Knip, changed-file planning, baseline/waiver state, Registry, evidence persistence, new lifecycle/authority surface, or internal V1/V2 families.

## Verdict

```text
approved
```

The Proposal is Apply-ready.

## Next boundary

```text
apply
```

Reviewer did not Apply, mutate production/package truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
