# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-policy-and-next-boundary-contract`
- Action: `review-explore`
- Logical Run id: `20260826-060-review-explore`
- Role: `reviewer`
- Review chain: `057 explore → 058 review-explore changes-requested → 059 revise-explore → 060 review-explore`
- Input Run: `20260826-059-revise-explore`

## Review depth

This Change remains a critical governance path. Reviewer independently rechecked the three 058 blockers and then composed the revised Policy model with the already-approved Action lifecycle and single-Action execution seams.

## Closed prior findings

### RE-058-001 — closed

The exact `completed + terminal archive + matching PASS Result` post-archive shape is now recognized before the generic non-active guard. `active + terminal archive + PASS` remains blocked until Change completion materialization.

### RE-058-002 — closed

Reported `nextBoundary` is checked against the deterministic normal boundary before any bounded Owner correction overlay. A valid correction can intentionally differ from the normal boundary without hiding a bad reported handoff.

### RE-058-003 — closed

Historical 42/42 transition evidence is now used only for ordering. Policy legal-boundary calculation is explicitly separated from actual external invocation and from durable OwnerAuthorityFact semantics.

## Blocking finding

### RE-060-001 — Owner correction can select the exact same terminal revise Action that Core cannot prepare

059 defines correction sets by reached stage:

- explore stage → `revise-explore`
- propose stage → `revise-propose | revise-explore`
- apply stage → `revise-apply | revise-propose | revise-explore`

The existing lifecycle contract rejects `terminal A → prepare A` for the exact same semantic Action identity.

Therefore these Policy decisions are not executable:

- terminal `revise-explore` + Owner correction `revise-explore`
- terminal `revise-propose` + Owner correction `revise-propose`
- terminal `revise-apply` + Owner correction `revise-apply`

Reviewer independently enumerated Policy-to-lifecycle compatibility:

- normal Policy transitions: `12/12` structurally preparable;
- bounded Owner correction combinations: `15/18` preparable;
- exact same terminal revise corrections: `3/18` rejected by the current lifecycle seam.

This can occur in the real bounded Owner workflow when Owner requests another correction immediately after a revise Action has already terminalized.

## Required revision

Keep the existing lifecycle contract unchanged. Revise Policy correction eligibility so the correction target MUST NOT equal the exact current terminal Action identity, or equivalently require that the requested correction target is structurally preparable from the exact current terminal slot.

If Owner still wants the same revise Action again, the current Foundation contract must first pass through another different lifecycle Action; this Change must not advertise an immediately executable READY boundary that the Core will reject.

Do not restore `resumed`, loosen terminal absorption, or add retry/scheduler/multi-Agent infrastructure.

## Verdict

`changes-requested`

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or production implementation was created.
- No scheduler, automatic execution, CLI, checkpoint permission, Full Test, promotion, or new authority fact was introduced.
