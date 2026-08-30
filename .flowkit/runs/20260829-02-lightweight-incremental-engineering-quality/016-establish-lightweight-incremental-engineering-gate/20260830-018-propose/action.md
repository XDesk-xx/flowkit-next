# 018 Propose — establish-lightweight-incremental-engineering-gate

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-lightweight-incremental-engineering-gate`
- Action: `propose`
- Role: `author`
- Input: `20260830-017-review-explore` (`approved → propose`)

## Objective

Converge the approved proof-based Explore into the smallest formal OpenSpec contract for a cheap, high-signal, repository-local mechanical engineering Gate.

## Bounded proposal

Created the complete spec-driven planning set:

- `proposal.md`
- `design.md`
- `specs/lightweight-engineering-gate/spec.md`
- `tasks.md`

The Proposal freezes only the approved mechanical surface:

```text
git diff --check HEAD
bounded Prettier
selected ESLint
src/**/*.ts max-lines=650
narrow forbidden tracked-artifact check
```

It keeps the six historical cleanup items exact and does not add changed-file planning, baseline/waiver state, dependency-cruiser, Knip, typecheck/tests/build/OpenSpec/Archify/Full Test, new lifecycle, Verification surface, Registry or quality platform.

## Validation

```text
OpenSpec change strict → PASS
OpenSpec --all --strict → 11/11 PASS
production/package mutation → NONE
git diff --check HEAD → PASS
```

## Conclusion

```text
PASS
→ review-propose
```

No Apply or production implementation was started.
