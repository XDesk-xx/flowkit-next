# Action — Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `normalize-foundation-contract-terminology`
- Action: `propose`
- Logical Run id: `20260828-122-propose`
- Role: `author`
- Input Run: `20260828-121-review-explore`
- Base Git revision: `246a653` (Owner-supplied checkpoint short revision; detached snapshot excludes `.git`)

## Execution

The approved `120 explore → 121 review-explore approved` chain was converged using upstream `openspec-propose` plus the Flowkit `proposal-convergence` discipline.

The Proposal modifies exactly two existing canonical capabilities and introduces no new capability:

1. `openspec-thin-integration`
   - one name-only requirement rename removes the internal `V1` qualifier;
   - the delta uses the OpenSpec `1.10.0` parser-supported `RENAMED Requirements` `FROM/TO` form with full `### Requirement:` headings.

2. `policy-and-next-boundary`
   - one complete `MODIFIED Requirements` block changes only `Policy V1 SHALL` to `Policy SHALL`;
   - all existing Owner-correction predicates, blocked outcomes and scenarios are preserved.

No `skip_specs` marker is used because this Change intentionally updates canonical spec wording. No production behavior, API surface, test behavior, package/build configuration, Full Test semantics, memo semantics, repository guidance or historical evidence is proposed to change.

A disposable archive simulation with actual OpenSpec `1.10.0` proved the planned deltas archive as exactly `1 RENAMED + 1 MODIFIED`, leave ten canonical specs strict-valid, and remove all remaining Flowkit-internal `V1/V2/V3` canonical terminology without touching legitimate external/runtime/schema/package versions.

## Stable output

- `proposal.md`
- `specs/openspec-thin-integration/spec.md`
- `specs/policy-and-next-boundary/spec.md`
- `design.md`
- `tasks.md`
- this durable Propose Run

## Non-claims

- No production source/test/package/build mutation was performed.
- No canonical main spec was directly edited; only Change delta specs were planned.
- No Apply, Archive, checkpoint, formal Delivery Full Test, Verification verdict, Archify Final, Delivery Final or Owner promotion was executed.
- The separately recorded future Full Test correction/finalization memo remains unchanged and outside this Change.
