# 008 Review Propose — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `review-propose`
- Run: `20260830-008-review-propose`
- Role: `reviewer`
- Input Run: `20260830-007-propose`
- Review chain start: `20260830-001-explore`

## Independent verification

Reviewer independently verified:

```text
OpenSpec change strict
→ PASS

OpenSpec --all --strict
→ 11 / 11 PASS

proposal/spec artifact SHA-256 values
→ match Author context exactly
```

The Proposal correctly carries forward most approved Explore conclusions:

```text
trusted resolver before pure Policy
exact activate-change + exact Delivery/Change + scope=["explore"]
caller changeState de-authoritized / removed
status + next share trusted resolution
Policy remains repository-IO free
Policy-specific revise-action eligibility remains Policy-owned
one canonical Delivery coordination truth
no registry / reconciliation engine / new lifecycle / V1-V2 family
all four normal D02 Changes depend on this correction
```

## Blocking findings

### RP-008-001 — dependency completion was broadened beyond the approved active-only proof

Approved Explore froze dependency completion as a condition for an allegedly/currently `active` Change to become lifecycle-enterable.

The Proposal design also states:

```text
Direct hard dependencies are validated only for lifecycle-enterable active
```

but the `foundation-cli-surface` delta currently says, without an `active` condition:

```text
missing/invalid direct dependency target
→ resolver fail closed
```

and its scenario says:

```text
WHEN exact Change declares dependsOn and target state is not completed
THEN resolver SHALL fail closed
```

This can make a normal `planned` downstream Change fail `status` merely because its upstream dependency is still active/planned, even though that is a valid planned coordination state.

Required smallest correction:

```text
dependency completion eligibility
→ enforce only when durable current Change state = active
  and resolver is deciding lifecycle-enterable active
```

Do not turn ordinary `planned + dependency not completed` into an integration failure.

If Proposal wants general dependency referential-integrity validation for non-active states, that is not proven by the approved Explore and must not be added here.

### RP-008-002 — detached node_modules packaging was incorrectly made an OpenSpec Change task

`tasks.md` 4.4 and `design.md` Migration Plan step 7 currently make:

```text
regenerate / identify Linux D02 node_modules environment artifact
```

part of this corrective Change work.

The approved D02 architecture explicitly separates:

```text
detached node_modules packaging
→ execution-environment preparation

NOT
→ Delivery Change
→ OpenSpec Change
→ Flowkit Action
```

The package/lock mutation caused by adding direct `yaml` is correctly inside this Change.

But rebuilding the detached environment archive must remain outside the OpenSpec Change lifecycle.

Required smallest correction:

- remove environment archive generation/identification from `tasks.md`;
- do not make it a Change completion or Apply acceptance condition;
- if useful, keep only a non-blocking handoff note that the external execution environment must later be regenerated for the accepted package/lock identity before a future detached run relies on it.

## Verdict

```text
changes-requested
```

## Next boundary

```text
revise-propose
```

Do not reopen approved Explore findings or redesign the trusted resolver.
