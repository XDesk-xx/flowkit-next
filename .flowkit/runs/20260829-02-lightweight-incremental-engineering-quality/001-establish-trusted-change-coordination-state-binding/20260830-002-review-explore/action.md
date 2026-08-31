# 002 Review Explore — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `review-explore`
- Run: `20260830-002-review-explore`
- Role: `reviewer`
- Input Run: `20260830-001-explore`

## Review boundary

Reviewer independently checked the Author Explore against:

- the accepted D01 Foundation authority/CLI contracts;
- the approved D02 correction boundary;
- the current D02 composition carried by the input payload;
- repository `review-explore` discipline.

## What is approved

The Explore correctly proves and bounds:

- the bootstrap-to-Stable-Core gap is real and reproducible;
- current caller `changeState` controls `status` / `next` independently of durable coordination truth;
- the correction belongs before pure Policy, not inside Policy;
- the existing Delivery manifest is the correct current coordination-state source to reuse rather than creating a second store;
- all four normal D02 quality Changes hard-depend on this correction and remain mutually independent afterward;
- `status` and `next` must share one trusted coordination-resolution seam;
- authoritative caller `changeState` should be removed if possible, otherwise retained only as a fail-closed consistency assertion;
- no Registry / reconciliation engine / second state store / new lifecycle / internal V1/V2 family is justified.

## Blocking finding

### RE-002-001 — Proof C confuses structural OwnerAuthorityFact validity with activation eligibility

The current Explore says that an `active` state may be trusted when there is at least one:

```text
structural-valid OwnerAuthorityFact
+
decision = activate-change
+
exact deliveryId
+
exact changeId
```

but it does not define or prove the required `scope` eligibility.

The accepted canonical authority contract explicitly says:

```text
structural validity does not create lifecycle eligibility
```

and says concrete decision/scope eligibility belongs to the consuming lifecycle boundary.

Reviewer independently reproduced this distinction against the accepted D01 code:

```text
isOwnerAuthorityFact(... scope:["checkpoint"]) → true
isOwnerAuthorityFact(... scope:["explore"])    → true
```

Therefore `isOwnerAuthorityFact(...)` alone cannot prove that an `activate-change` fact authorizes Change activation.

Under the Explore's current proposed rule, a structurally valid but semantically wrong-scope fact could satisfy active provenance.

## Required smallest revision

Revise Explore only enough to prove and freeze the activation-provenance recognition rule.

At minimum answer:

```text
What decision/scope shape is eligible evidence for planned → active?

How is that eligibility tied to exact Delivery + Change identity?

What wrong-scope structurally-valid OwnerAuthorityFact must fail closed?
```

Use the existing D01/D02 authority facts and lifecycle semantics. Do not create a generic Owner-authority registry or redesign checkpoint authority.

Add a negative proof such as:

```text
durable Change state = active
+
structural-valid activate-change fact
+
wrong/non-eligible scope
↓
trusted resolver must NOT yield lifecycle-enterable active
```

The exact accepted activation scope should be derived from proof, not guessed by Reviewer.

## Verdict

```text
changes-requested
```

The Explore is otherwise well bounded. After RE-002-001 is resolved, it should be ready for Proposal without reopening the other proof branches.

## Non-claims

Reviewer did not modify Author Explore, Delivery composition, architecture, source, tests, packages, canonical specs, or Owner authority.

No Proposal, Apply, Archive, Full Test, checkpoint, commit, push, merge, or normal D02 Change activation was performed.
