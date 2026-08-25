# Action: apply

- Run: `20260825-033-apply`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/021-establish-run-result-persistence/20260825-033-apply`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-run-result-persistence`
- Role: `author`
- Authority: `owner:77debb2537d2faad156f802dd615f326f1728e4900a268af60c9b36357c95b5b`
- Input: `20260825-032-review-propose`
- Execution mode: `detached-linux-direct-openspec-apply-no-flowkit-lifecycle`
- Skill: `.agents/skills/openspec-apply-change/SKILL.md` (OpenSpec 1.10.0)

## Apply boundary

Implement only the approved OpenSpec tasks for the minimal sequential Author ↔ Reviewer Run / Result persistence seam. Preserve the Owner-corrected scope: no Result admission, Policy, scheduler, locking/WAL/database, multi-Agent coordination, generic filesystem path API, CLI/OpenSpec adapter, or Git checkpoint behavior.

## Stable output boundary

- `src/domain/run-result-persistence.ts`
- `src/domain/index.ts`
- `tests/unit/domain/run-result-persistence.test.ts`
- `openspec/changes/establish-run-result-persistence/tasks.md` with 10/10 tasks complete
- this durable Apply Run record
- Delivery-group Owner `authorize-apply` authority fact

## Non-claims

- This is Apply completion, not Review Apply approval.
- `verificationVerdict = null` remains valid; the test gates recorded here are Author Apply checks, not formal Delivery Verification authority.
- This external-orchestrator Run is not claimed to have been emitted by the candidate Flowkit runtime.
- No archive or Git checkpoint authority is inferred from Apply completion.
