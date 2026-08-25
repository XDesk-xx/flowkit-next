# Action: revise-explore

- Run: `20260824-014-revise-explore`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-action-lifecycle-domain-contract`
- Role: `author`
- Authority: explicit user instruction to invoke `revise-explore` on the accepted 013 reviewer payload; no Owner authority claimed
- Execution mode: `detached-linux-direct-revise-explore-no-flowkit-lifecycle`

## Prepared boundary

- Input Action: `20260824-013-review-explore`
- Input reviewer verdict: `changes-requested`
- Blocking finding: `RE-013-001`
- Revision skill: `Revise Explore Skill v2`
- Revision rule: minimum correction only; facts/risks/proof/limitations may be revised, production implementation remains forbidden

## Required correction

- `terminal A -> prepare A` MUST reject.
- Terminal replacement is structurally allowed only when the new canonical semantic ActionIdentity differs from the terminal current identity.
- Add a controlled negative proof case for same-identity re-prepare.
- Do not introduce RunId / attempt identity or Policy eligibility into this Change.

## Stable output boundary

- Revised `openspec/changes/establish-action-lifecycle-domain-contract/explore.md`
- Author revision context/result under `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/012-establish-action-lifecycle-domain-contract/014-revise-explore/`
- Prior 012 Author and 013 Reviewer runs are preserved unchanged.
- Execution-local proof files are excluded from stable transfer.

## Non-claims

- This revision does not create OpenSpec proposal/design/specs/tasks.
- This revision does not implement production lifecycle code.
- This revision does not claim Reviewer approval or Verification PASS.
- This Run is an external stable-transfer bridge record and is not claimed to have been emitted by the candidate Flowkit runtime.
