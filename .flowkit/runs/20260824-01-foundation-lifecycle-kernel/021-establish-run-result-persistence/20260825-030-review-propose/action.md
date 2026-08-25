# Action: review-propose

- Run: `20260825-030-review-propose`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/021-establish-run-result-persistence/20260825-030-review-propose`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-run-result-persistence`
- Role: `reviewer`
- Input: `20260825-029-propose`
- Execution mode: `detached-linux-review-propose`
- Skill: `.agents/skills/review-propose/SKILL.md` (`Review Propose Skill v2`)

## Review boundary

Review the OpenSpec Proposal against the approved Owner-corrected Explore boundary, contract completeness, design quality, and verification closure. Do not implement Apply changes and do not broaden the Change into generic filesystem, concurrency, WAL, scheduler, or multi-Agent scope.

## Reviewer conclusion

`changes-requested`

One blocking Proposal-contract gap remains: creation/collision semantics for an already-existing Run occurrence and reused Action sequence are undefined. A persistence implementation could overwrite an existing durable Run, or history could contain two occurrences with the same sequence and no defined ordering, while still satisfying the currently written requirements.

## Required revision

- Define a durable Run occurrence as create-once / non-overwritable, or specify an equally strict immutable equivalent.
- Reusing an already-existing generated occurrence MUST fail closed without changing prior bytes.
- Define how duplicate controlled sequence values inside one Change history are prevented or rejected so sequence ordering is unambiguous.
- Add focused acceptance/tests for collision rejection and preservation of existing durable bytes.

This does not require locking, multi-writer concurrency, atomic transactions, WAL, crash recovery, or global Run allocation.
