# Action: revise-propose

- Run: `20260826-044-revise-propose`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/036-establish-action-package-and-result-admission/20260826-044-revise-propose`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-action-package-and-result-admission`
- Role: `author`
- Authority: explicit user instruction to revise the supplied `20260826-043-review-propose`; no new Owner authority fact is fabricated by this Run
- Execution mode: `detached-linux-revise-propose-minimum-contract-correction`
- Skills: `.agents/skills/revise-propose/SKILL.md` + `.agents/skills/proposal-convergence/SKILL.md`

## Input boundary

- Input Action: `20260826-043-review-propose`
- Reviewer verdict: `changes-requested`
- Blocking finding: `RP-043-001`

## Bounded correction

`RP-043-001` is closed by making package formation an explicit Core domain seam rather than leaving Apply able to implement only a type validator plus Result admission.

The revised planning contract now requires a smallest pure package-formation operation over already-validated exact `CurrentAction` plus current `RunContextRecord` (or equivalent canonical facts). Formation:

- requires exact ActionIdentity equality;
- requires exact lifecycle-state equality;
- permits only `prepared | resumed`;
- requires the Run context role to equal the closed deterministic role for that Standard Action;
- copies the existing exact run/expected-role/authority/previousRun facts into the closed ActionPackage;
- fails closed for terminal/null lifecycle state or mismatched identity/state.

No persistence I/O, Policy, executor transport, PackageId/ResultId, replay registry, scheduler, locking, terminal orchestration or new identity was introduced.

## Stable output boundary

- Proposal/spec/design/tasks are aligned on the explicit pure package-formation seam.
- Runs 036–043 and approved Explore history are preserved.
- No production source/test/package/lock mutation was made by this Action.

## Non-claims

- This is not Reviewer approval.
- This does not authorize Apply, Archive, checkpoint, Verification or promotion.
- The reported next boundary `review-propose` is handoff data only.
