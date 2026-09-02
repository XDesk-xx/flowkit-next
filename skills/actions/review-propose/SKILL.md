---
name: review-propose
description: Review the exact Proposal against approved Explore boundaries for traceability, minimal testable contract completeness, Apply readiness, and a mutation-free Reviewer verdict.
metadata:
  author: flowkit
---

# Review Propose Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `review-propose`.
This Guidance owns Reviewer HOW only. It does not create Owner authority, mutate Proposal/Design/spec/tasks or production bytes, execute revise/apply/archive work, claim Verification PASS, decide the next legal Action, complete the Change, authorize Git, or continue into another Action.

## Exact reviewed input and approved chain

Inspect the exact supplied Proposal artifacts and exact current Delivery/Change identity. Trace the materially relevant approved Explore, Owner scope decisions, accepted Reviewer findings, and preserved canonical requirements. Review the chain needed to establish why each material Proposal requirement exists; do not review the latest Proposal in isolation when its legitimacy depends on prior accepted boundaries.

## Review focus

Judge whether the Proposal faithfully converges approved Explore into the smallest complete, testable contract ready for Apply.

1. For every material requirement ask why it is required. Accept only traceable Owner decisions, approved Explore decisions/proof, accepted Reviewer findings, or existing canonical contract basis.
2. Reject untraceable "while here" requirements, returned non-goals, silent input-domain generalization, or later-Change scope pulled forward.
3. Prefer the smallest invariant that satisfies the approved use case; reject speculative subsystem growth.
4. Check requirements are normative/testable, material failure behavior is defined, acceptance is measurable, and tasks/design do not introduce new semantics beyond the approved model.
5. Confirm ownership does not create a second authority/state machine, persistence / migration impact is considered when materially relevant, and implementation mechanism is proportional to the approved contract.
6. Confirm a plausible matching verification path exists without importing Delivery-level verification into an ordinary Change unless the contract requires it.

## Semantic invariant / literal discipline

Classify material literals and repository observations as stable contract constants, configuration / environment values, or incidental current-state observations. Do not approve transient lifecycle states, current numbering, counts, paths, or repository snapshots as permanent invariants unless the approved contract makes them stable. Require requirements/tests to express the durable semantic invariant instead of today's literal.

## Findings and verdict

A blocking finding identifies the exact planning artifact/claim, observed contract defect, impact on the approved model, and minimum required correction. Reviewer remains mutation-free: request Author convergence in place; do not edit Proposal artifacts or restart open-ended Explore without a material contract reason.

Verdict is one of:

```text
approved
changes-requested
rejected
```

Reviewer approval is Reviewer truth only; it is not Verification PASS, Owner authority, Change completion, Delivery Final, or Git authority.

## Required Reviewer report

Every Result briefly reports:

1. **Current-step explanation** — what `review-propose` is validating now.
2. **Complexity / minimality** — whether the Proposal keeps the smallest approved contract and avoids unnecessary subsystems.
3. **New-content / scope-drift** — whether new capability/content or semantic scope appears beyond approved Explore/Owner boundaries.

Necessary design/task detail that only realizes an already-approved requirement is not scope drift.

## Run / handoff concision

Use only the existing `action.md + context.json + result.json` Run surface. Persist exact reviewed identities, decisive facts, bounded findings, verdict, complexity/scope-drift assessment, and continuation references. Do not copy full Explore/Proposal/Design transcripts or large evidence bodies when exact artifact/Run references are sufficient.

## Terminal boundary

After the real Reviewer Result is materialized, STOP.

If approved, report the legal continuation boundary supplied by Flowkit/Policy (normally `apply`) but do not execute it. If changes are requested or rejected, report the bounded finding/boundary only and do not perform Author correction.
