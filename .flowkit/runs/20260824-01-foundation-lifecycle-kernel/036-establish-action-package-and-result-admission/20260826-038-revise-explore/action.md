# Action: revise-explore

- Run: `20260826-038-revise-explore`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/036-establish-action-package-and-result-admission/20260826-038-revise-explore`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-action-package-and-result-admission`
- Role: `author`
- Authority: explicit user instruction to execute `revise-explore` from supplied `037-review-explore.zip`; no new OwnerAuthorityFact is fabricated
- Execution mode: `detached-linux-direct-revise-explore-no-flowkit-lifecycle`
- Revision skill: `.agents/skills/revise-explore/SKILL.md`
- Proof auxiliary: `.agents/skills/explore-proof-based/SKILL.md`

## Input boundary

- Previous Run: `20260826-037-review-explore`
- Reviewer verdict: `changes-requested`
- Blocking finding: `RE-037-001`
- Finding: exact Result admission lacked a fail-closed freshness invariant when an ActionPackage captured `prepared A` but the exact current Action later became `resumed A`.

## Revision

Only the stale-package lifecycle-state hole was repaired.

The revised Explore now requires:

```text
package lifecycle state in prepared|resumed
current Action lifecycle state in prepared|resumed
package ActionIdentity == current Action identity
package lifecycle state == current Action lifecycle state at admission
```

Focused proof rejects:

```text
prepared package / resumed current
resumed package / prepared current
terminal current/package
```

and still accepts matching `prepared/prepared` and `resumed/resumed` boundaries.

## Scope discipline

Not introduced:

- PackageId / ResultId
- nonce or replay registry
- locking / WAL / database
- scheduler / automatic next
- Policy interpretation
- resume / terminal / STOP orchestration
- production source/test mutation
- Proposal artifacts

## Stable output boundary

- Revised `openspec/changes/establish-action-package-and-result-admission/explore.md`
- New `20260826-038-revise-explore` Run
- Existing 036/037 Runs, activation manifest and OpenSpec scaffold preserved
- Next boundary reported: `review-explore`

## Non-claims

- This is not Reviewer approval.
- This is not Verification PASS.
- This does not authorize Propose, Apply, Archive, checkpoint, or promotion.
