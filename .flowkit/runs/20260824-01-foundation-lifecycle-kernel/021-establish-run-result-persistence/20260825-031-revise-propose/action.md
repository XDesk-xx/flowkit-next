# Action: revise-propose

- Run: `20260825-031-revise-propose`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/021-establish-run-result-persistence/20260825-031-revise-propose`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-run-result-persistence`
- Role: `author`
- Input: `20260825-030-review-propose`
- Execution mode: `detached-linux-revise-propose`
- Skill: `.agents/skills/revise-propose/SKILL.md` (`Revise Propose Skill v2`)

## Revision boundary

Revise only the blocking Proposal finding `RP-030-001`. Preserve the Owner-corrected sequential Author ↔ Reviewer scope and do not expand into locking, multi-writer concurrency, WAL/database, crash recovery, scheduler, global Run registry, or generic filesystem path handling.

## Stable revision

The OpenSpec planning artifacts now define:

- generated Run occurrences are create-once / non-overwritable durable history;
- a write targeting an already-existing generated occurrence fails closed before modifying prior durable bytes;
- controlled Action sequence is unique within the exact Change history, so a same-sequence occurrence is rejected even when its ActionId differs;
- focused tests must prove existing-occurrence collision byte preservation and duplicate-sequence rejection.

## Non-claims

- This Action does not implement persistence code.
- This Action does not perform Apply.
- This Action does not grant Reviewer approval or Verification PASS.
- This Action does not introduce locking or multi-writer race guarantees.
