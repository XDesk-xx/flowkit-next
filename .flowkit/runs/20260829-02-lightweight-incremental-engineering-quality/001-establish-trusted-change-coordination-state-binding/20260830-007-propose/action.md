# 007 Propose — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `propose`
- Run: `20260830-007-propose`
- Role: `author`
- Input Run: `20260830-006-review-explore`
- Review chain start: `20260830-001-explore`

## Proposal boundary

Reviewer approved Explore and froze Proposal constraints. This Propose creates planning artifacts only and does not mutate production source/tests/package truth.

The proposal closes the bootstrap-to-Stable-Core authority binding gap with one bounded seam:

```text
exact repository / Delivery / Change identity
↓
trusted durable coordination resolver
↓
canonical ChangeState
↓
status projection / pure Policy
```

## Canonical ownership

```text
OwnerAuthorityFact structural validator
→ wire / identity / shape only

trusted coordination resolver
→ exact activate-change provenance for canonical ChangeState
→ direct hard-dependency completion

pure Policy
→ legal next-boundary over canonical facts
→ retains existing revise-action correction eligibility
```

## Planned implementation

- remove caller authority-bearing `changeState` from `status` / `next`;
- reuse the existing Delivery manifest as the single current coordination truth;
- add a small read-only trusted resolver shared by `status` and `next`;
- require exact `activate-change` + exact Delivery/Change + `scope=["explore"]` for durable active eligibility;
- require all direct hard dependencies completed;
- add one directly declared production YAML parser dependency;
- keep Policy repository-IO free;
- do not create registry/reconciliation/new lifecycle/second state store.

## OpenSpec artifacts

Created:

```text
proposal.md
design.md
tasks.md
specs/lifecycle-authority-and-identity/spec.md
specs/foundation-cli-surface/spec.md
specs/policy-and-next-boundary/spec.md
```

OpenSpec strict validation:

```text
change strict: PASS
all strict: 11 / 11 PASS
```

## Result

```text
PASS
```

Next boundary:

```text
review-propose
```

## STOP

Do not Apply in this action.
