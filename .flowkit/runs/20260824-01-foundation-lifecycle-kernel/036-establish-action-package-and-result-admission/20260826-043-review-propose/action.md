# Action: review-propose

- Run: `20260826-043-review-propose`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/036-establish-action-package-and-result-admission/20260826-043-review-propose`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-action-package-and-result-admission`
- Role: `reviewer`
- Authority: explicit user instruction to review supplied `042-propose.zip`; Reviewer creates no Owner authority
- Execution mode: `detached-linux-review-propose-from-scratch-chain-trace`
- Review skill: `.agents/skills/review-propose/SKILL.md`

## Reviewed boundary

- Input Action: `20260826-042-propose`
- Input payload SHA-256: `ce0cb822ce2b39f684c9b40b1ec37fc1769211ebedeb151e7f8d730f5147ad98`
- Base Git revision: `f03fb6756ffa4f7ad759113568a10dee48bfe28f`
- Chain traced: `036 explore → 037 review-explore → 038 revise-explore → 039 review-explore → 040 revise-explore → 041 review-explore approved → 042 propose`

## Review outcome

- Runs 036–041 carried by 042 are byte-identical to the authentic 041 reviewer payload.
- Approved Explore blockers `RE-037-001` and `RE-039-001` are correctly preserved in Proposal/Spec/Design/Tasks: exact lifecycle-state freshness and exact current Run-occurrence freshness remain normative.
- Scope remains bounded: no PackageId/ResultId, replay registry, locking/WAL, Policy, transport, scheduler, automatic-next, CLI, or resume/terminal orchestration was introduced.
- OpenSpec planning is 4/4 complete and strict-valid; detached typecheck, 35/35 domain tests, and format check pass.
- Blocking finding `RP-043-001`: the Spec requires Core to form/prepare a closed ActionPackage from canonical facts, but Design/Tasks only explicitly plan an ActionPackage type/validator plus Result admission. Apply could satisfy the current task list without implementing any Core package-formation seam.
- Reviewer verdict: `changes-requested`.
- Next boundary: `revise-propose`.

## Required bounded correction

- Add an explicit pure Core package-preparation/formation seam (name is not prescribed) that constructs the exact closed ActionPackage from already-canonical current facts.
- Reuse existing facts/types; `RunContextRecord + exact CurrentAction` or an equivalent minimal input is acceptable.
- Ensure formation binds the same exact run/action/state facts and deterministic execution role that admission later checks.
- Add focused tests proving prepared/resumed formation succeeds and malformed/terminal/mismatched exact-current facts fail closed.
- Do not add persistence I/O, Policy, provider transport, Agent invocation, PackageId/ResultId, replay infrastructure, or terminal orchestration.

## Stable output boundary

- Author Runs 036–042 and all OpenSpec planning artifacts are unchanged by Reviewer.
- This 043 Review Propose Run is added.
- No production source/test/package/lock/architecture mutation.

## Non-claims

- This is not Verification PASS.
- This does not create Owner authority or authorize Apply/archive/checkpoint/promotion.
