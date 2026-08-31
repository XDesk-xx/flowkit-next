# 005 Revise Explore — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `revise-explore`
- Run: `20260830-005-revise-explore`
- Role: `author`
- Input Run: `20260830-004-review-explore`
- Reviewer finding: `RE-004-001`

## Revision boundary

Applied the smallest canonical-ownership correction requested by Reviewer.

Proof C was **not reopened**. Its accepted result remains:

```text
structural OwnerAuthorityFact validity
≠ activate-change provenance eligibility
```

The new proof reconciles ownership across existing canonical specs.

## Canonical ownership proof

Existing `lifecycle-authority-and-identity` wording broadly assigns decision/scope lifecycle recognition / eligibility to later Policy.

The revised Explore now freezes the narrower Stable Core ownership split:

```text
structural validator
→ wire validity only

trusted coordination resolver
→ exact activate-change provenance recognition needed to derive canonical ChangeState

pure Policy
→ legal next-boundary calculation from canonical resolved facts
→ retains existing Policy-specific revise-action Owner correction eligibility
```

`status` / `next` remain consumers of one trusted coordination-resolution seam. Policy remains repository-IO free.

## Expected OpenSpec delta

Proposal must refine the broad authority-spec wording to boundary-specific recognition ownership and must not leave contradictory specs where both Policy and the pre-Policy resolver claim the same activation-eligibility responsibility.

No generic authority resolver/registry is introduced.

## Result

```text
PASS
```

`RE-004-001` is addressed without changing Proof C, D02 dependency composition, request de-authoritization direction, parser/tooling proof, or any normal D02 quality Change.

## STOP

Return to independent `review-explore`. Do not create Proposal artifacts.
