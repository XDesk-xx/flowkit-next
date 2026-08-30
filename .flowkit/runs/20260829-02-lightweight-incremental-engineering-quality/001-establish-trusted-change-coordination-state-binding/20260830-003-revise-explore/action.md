# 003 Revise Explore — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `revise-explore`
- Run: `20260830-003-revise-explore`
- Role: `author`
- Input Run: `20260830-002-review-explore`
- Reviewer finding: `RE-002-001`

## Revision boundary

Applied `.agents/skills/revise-explore` and changed only the smallest missing proof in Proof C.

Reviewer finding:

```text
structural OwnerAuthorityFact validity
≠ activation lifecycle eligibility
```

## Focused proof

The accepted structural validator returns true for all of:

```text
activate-change + scope=["explore"]
activate-change + scope=["checkpoint"]
activate-change + scope=["propose"]
```

Therefore scope eligibility must be recognized separately.

Current activation evidence converges on:

```text
decision = activate-change
exact Delivery ID
exact Change ID
exact scope = ["explore"]
```

Evidence:

```text
current D02 corrective activation
→ scope=["explore"]

D01 post-initial-bootstrap activation history
→ 11 distinct normal Changes
→ all exact scope=["explore"]
```

The initial first-Change D01 bootstrap used older broader bootstrap representation and is preserved as historical evidence, not promoted into the current Stable Core eligibility rule.

## Frozen correction

For durable `active`, activation provenance is eligible only when:

```text
isOwnerAuthorityFact = true
+ decision = activate-change
+ exact deliveryId
+ exact changeId
+ exact scope = ["explore"]
```

A structural-valid wrong scope such as `["checkpoint"]` must fail closed and must not yield lifecycle-enterable `active`.

No authority registry, checkpoint-authority redesign, Policy IO, or broader lifecycle change is introduced.

## Result

```text
PASS
```

`RE-002-001` is addressed without reopening any previously approved proof branch.

## STOP

Return to independent `review-explore`. Do not create Proposal artifacts.
