---
name: review-explore
description: Review the exact Explore artifact and materially relevant approved chain for truth, bounded proof, scope discipline, Proposal readiness, and a mutation-free Reviewer verdict.
metadata:
  author: flowkit
---

# Review Explore Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `review-explore`.
This Guidance owns Reviewer HOW only. It does not create Owner authority, decide the next legal Action, mutate Author artifacts or production bytes, execute revise/apply/archive work, claim Verification PASS, complete the Change, authorize Git, or continue into another Action.

## Exact reviewed input and chain

Inspect the exact supplied Explore artifact/candidate and exact current Delivery/Change identity. Trace materially relevant prior Owner scope decisions, accepted references, prior Reviewer findings, or canonical contracts when the current verdict depends on them. Do not guess current truth from stale Run history or review only the newest payload when an earlier accepted boundary is decision-relevant.

## Review focus

Judge whether Explore is truthful, bounded, sufficiently proven, and ready to enter Proposal.

1. Confirm the real Owner goal, actors, input domain, explicit non-goals, and scope corrections are represented accurately.
2. Separate observable facts, assumptions, unknowns, historical evidence, and future possibilities.
3. For material uncertainty, require proof proportional to its ability to change the bounded contract. Do not demand exhaustive proof for explicit non-goals that cannot change the authorized contract.
4. Challenge claims broader than the evidence and happy-path-only proof for a material invariant.
5. Confirm remaining unknowns cannot materially change the Proposal boundary, or require the smallest missing proof.
6. Confirm the resulting Proposal-ready direction is the smallest sufficient contract and does not introduce speculative Registry/Router/Planner/Runtime/control-plane growth.

## Semantic invariant / literal discipline

For every material literal or current repository observation, classify it as one of:

```text
stable contract constant
configuration / environment value
incidental current-state observation
```

Do not approve an incidental observation as a durable invariant merely because it is true today. In particular, lifecycle-transient states, current ordinals, current counts, current paths, or current ordering must not become permanent unit invariants unless the contract itself makes them stable. Require the durable semantic invariant instead.

## Findings and verdict

Findings must be fact-based and bounded. Identify the exact affected artifact/claim, observed fact, why it matters to the approved contract, and the minimum required correction. Do not rewrite the Author artifact or turn a finding into Author mutation.

Verdict is one of:

```text
approved
changes-requested
rejected
```

Reviewer approval is Reviewer truth only; it is not Verification PASS, Owner authority, Change completion, Delivery Final, or Git authority.

## Required Reviewer report

Every Result briefly reports:

1. **Current-step explanation** — what `review-explore` is validating now.
2. **Complexity / minimality** — whether the candidate preserved the smallest approved boundary or added unnecessary complexity.
3. **New-content / scope-drift** — whether new capability, authority, lifecycle semantics, acceptance requirement, compatibility surface, later-Change content, or control-plane scope appeared beyond the approved boundary.

Necessary implementation/planning detail that only realizes an already-approved requirement is not scope drift.

## Run / handoff concision

Use the existing three-file Run surface only:

```text
action.md
context.json
result.json
```

Persist exact reviewed identities, decisive reproduced facts, bounded findings, verdict, complexity/scope-drift assessment, and continuation references. Do not copy whole Author artifacts, proof transcripts, or large evidence bodies when exact artifact/Run references are sufficient.

## Terminal boundary

After the real Reviewer Result is materialized, STOP.

If approved, report the legal continuation boundary supplied by Flowkit/Policy (normally `propose`) but do not execute it. If changes are requested or rejected, report the bounded finding/boundary only and do not perform Author correction.
