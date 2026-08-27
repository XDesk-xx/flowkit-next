# Action — Delivery Plan Correction

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-mutation-and-git-checkpoint-boundary`
- Action: `delivery-plan-correction`
- Logical Run id: `20260827-079-delivery-plan-correction`
- Role: `author`
- Input Run: `20260827-078-review-explore`
- Checkpoint base: `8c0c150b4bd15e837c3f579a91e0303678fbbe4b`

## Owner authority

Owner explicitly authorized two bounded governance decisions:

1. cancel `establish-mutation-and-git-checkpoint-boundary`;
2. refine only the current Delivery plan facts affected by that cancellation, followed by independent review of this correction.

The authorization explicitly forbids modifying completed canonical Changes, introducing a `MutationDeclaration` subsystem, or creating a generic cancellation subsystem.

## Materialized correction candidate

The Delivery manifest now records:

- the current Change as `required: false` and `state: cancelled`;
- the four remaining implementation/acceptance Changes as still planned;
- removal of `establish-foundation-cli-surface`'s invalid dependency on the cancelled Change;
- minimal reassignment of the still-required terminal Git checkpoint authorization seam to the later CLI/host surface, without pre-designing its implementation;
- Delivery scope narrowed from a new mutation-authority subsystem to only an explicit Git checkpoint authorization boundary at the later terminal host/CLI seam;
- Full Test wording narrowed from mutation/checkpoint subsystem safety to Git checkpoint authorization/safety;
- acceptance wording preserving OpenSpec approved Change/contract as semantic mutation authority and keeping Git permission dependent on an explicit legal boundary plus explicit Owner authorization;
- derived `planned.architecture.json` / `current-to-planned.compare.json` synchronized from `Mutation / Git Boundary` to the thinner `Git Checkpoint Boundary`, while the retained `current.architecture.json` stays untouched.

The manifest also durably records the exact Owner `cancel-change` and `refine-delivery-plan` authority facts.

## Historical evidence and OpenSpec handling

Runs `077-explore` and `078-review-explore` are preserved unchanged as the negative architecture proof that led to cancellation.

The incomplete OpenSpec Change scaffold (`.openspec.yaml` + `explore.md`) is intentionally preserved in this review candidate so the independent reviewer can inspect the exact explored premise and evidence. It is NOT archived, completed, proposed, applied, or treated as canonical spec truth. Final removal of the active OpenSpec scaffold, if the correction review passes, belongs to the post-review cancellation closure before checkpoint; it must not be represented as OpenSpec archive.

## Memo decision

No cross-Delivery Memo is created. The issue is discovered, decided, corrected and expected to close inside the current Delivery; therefore it does not satisfy the cross-Delivery unresolved-truth boundary.

## Review target

The next boundary is `review-delivery-plan-correction`.

Reviewer should verify that:

- cancellation matches Owner authority;
- 077/078 historical evidence is preserved;
- only affected Delivery plan facts changed;
- no completed canonical spec/source/test or retained current architecture snapshot was changed;
- no second mutation authority or generic cancellation subsystem was introduced;
- remaining dependency graph is closed and `establish-managed-toolchain-resolution` remains independently eligible as the next planned Change;
- the OpenSpec scaffold is treated only as pending-review historical evidence, not as an implemented/archived Change.

## Non-claims

- No `revise-explore`, Proposal, spec delta, design, tasks, Apply, Archive or Git checkpoint was executed.
- No production source or tests were modified.
- No generic cancellation lifecycle was productized.
- No cross-Delivery Memo was created.
- This Run does not authorize checkpoint; checkpoint remains a separate Owner authority after independent review.
