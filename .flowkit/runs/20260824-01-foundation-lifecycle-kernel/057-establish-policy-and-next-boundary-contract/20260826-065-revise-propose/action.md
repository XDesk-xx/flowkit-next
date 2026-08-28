# Action — Revise Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-policy-and-next-boundary-contract`
- Action: `revise-propose`
- Logical Run id: `20260826-065-revise-propose`
- Role: `author`
- Input Run: `20260826-064-review-propose`
- Base Git revision: `120731bbf0521508ef108db18b33ce728185adb2`

## Revision

Reviewer finding `RP-064-001` is accepted and closed with the smallest contract correction.

The 063 Proposal previously required only semantic `ActionIdentity` equality for a terminal Result. That is insufficient when the same Standard Action has multiple distinct Run occurrences. The revised Proposal now requires the exact current terminal `RunContextRecord` together with the terminal `RunResultRecord` before Policy reads any outcome or reported `nextBoundary`.

Policy reuses the existing Run persistence linkage seam:

- `terminalRunContext.actionIdentity == currentAction.identity`;
- `hasMatchingRunLinkage(terminalRunContext, terminalResult)`;
- therefore the terminal Result must carry the exact current `runId`, not a stale prior occurrence of the same semantic Action.

A focused proof using two valid `review-explore` occurrences confirmed `R2 context + R2 Result` matches while `R2 context + stale R1 Result` is rejected. No PackageId/ResultId, latest-result registry, WAL, replay tracking, retry framework or new lifecycle state is introduced.

## Stable output

- revised `proposal.md`
- revised `policy-and-next-boundary` delta spec
- revised `design.md`
- revised `tasks.md`
- this durable Revise Propose Run

## Non-claims

- No production source/test mutation was performed.
- No Apply is executed by this Run.
- Existing Run persistence and ActionPackage/admission contracts are reused unchanged.
- No scheduler, automatic next execution, retry/resume/reset, new identity, registry, WAL, locking, Git/checkpoint authority, CLI or multi-Agent/provider subsystem is introduced.
