# 004 Review Explore — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `review-explore`
- Run: `20260830-004-review-explore`
- Role: `reviewer`
- Input Run: `20260830-003-revise-explore`
- Review chain start: `20260830-001-explore`

## Review result

The previous blocker `RE-002-001` is resolved.

Reviewer independently verified:

- `isOwnerAuthorityFact(...)` structural validity is now separated from activation eligibility;
- the accepted D01 history contains 11 distinct normal post-initial-bootstrap activation records with exact Change identity and exact `scope=["explore"]`;
- the current D02 corrective activation also uses exact `scope=["explore"]`;
- the wrong-scope fail-closed case is now explicit;
- the revision changed only Proof C and its dependent references;
- Policy purity, status/next shared resolver, D02 hard dependencies, request-state de-authoritization, and no-new-control-plane conclusions remain intact.

## New blocking finding

### RE-004-001 — Canonical authority-eligibility ownership is not yet reconciled

Accepted canonical spec:

```text
openspec/specs/lifecycle-authority-and-identity/spec.md
```

currently states:

```text
decision/scope structural validity only means canonical wire fact;
whether a decision/scope satisfies lifecycle-boundary recognition /
eligibility SHALL be decided by the later Policy contract.
```

The revised Explore now freezes:

```text
activate-change eligibility
→ recognized in the trusted coordination resolver
→ before Policy
```

while also saying:

```text
policy-and-next-boundary
→ likely no semantic change
```

Those statements can both be correct only if the canonical authority contract is explicitly refined so that activation-provenance eligibility belongs to the trusted coordination-resolution boundary, while Policy continues to own legality over already-canonical resolved facts.

Without that reconciliation, Proposal risks producing contradictory canonical specs:

```text
authority spec says Policy owns eligibility
but
CLI/resolver spec says resolver owns activation eligibility
```

## Required smallest revise-explore

Do not reopen Proof C.

Revise only the canonical ownership proof:

1. Identify the exact existing normative statements in `lifecycle-authority-and-identity` that currently assign decision/scope eligibility to Policy.
2. Prove the minimal Stable Core refinement:
   - structural validator still owns wire validity only;
   - trusted coordination resolver owns `activate-change` provenance recognition for deriving canonical ChangeState;
   - Policy remains pure and owns legal next-boundary calculation from canonical resolved facts;
   - Policy still owns any existing Policy-specific Owner correction eligibility where already specified.
3. Freeze the expected OpenSpec delta so Proposal cannot leave contradictory ownership wording.
4. Do not move filesystem IO or manifest parsing into Policy.
5. Do not create a generic authority-recognition subsystem.

## Verdict

```text
changes-requested
```

Next boundary:

```text
revise-explore
```

No Proposal artifacts should be created yet.
