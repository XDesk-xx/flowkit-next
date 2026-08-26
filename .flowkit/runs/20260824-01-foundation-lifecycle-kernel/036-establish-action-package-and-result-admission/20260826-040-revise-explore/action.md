# Action: revise-explore

- Run: `20260826-040-revise-explore`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/036-establish-action-package-and-result-admission/20260826-040-revise-explore`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-action-package-and-result-admission`
- Role: `author`
- Authority: explicit user instruction to execute `revise-explore` from supplied `039-review-explore.zip`; no new OwnerAuthorityFact is fabricated
- Execution mode: `detached-linux-direct-revise-explore-no-flowkit-lifecycle`
- Revision skill: `.agents/skills/revise-explore/SKILL.md`
- Proof auxiliary: `.agents/skills/explore-proof-based/SKILL.md`

## Input boundary

- Previous Run: `20260826-039-review-explore`
- Reviewer verdict: `changes-requested`
- Blocking finding: `RE-039-001`
- Finding: Result admission linked candidate Result to `ActionPackage.runId` but did not prove that the package itself belongs to the exact current Run occurrence. A stale prior `review-explore` package could match a later same-Action/same-state current Action after an intervening revision.

## Revision

Only the missing exact-current-occurrence correlation invariant was added.

The revised Explore now requires:

```text
package ActionIdentity == exact current Action identity
package lifecycle state == exact current Action lifecycle state
package.runId == exact current Run occurrence runId
candidate Result.runId == package.runId
```

The exact current Run occurrence is supplied as a narrow execution-boundary fact. It is not a new registry and does not require changing `CurrentAction` during Explore.

Focused proof reproduced:

```text
stale package = 20260826-037-review-explore
current run   = 20260826-039-review-explore

all prior 038 identity/state/role/result-linkage checks  → PASS
exact current occurrence check                          → FAIL
stale package                                            → REJECT
fresh package for 039                                    → PASS
```

## Scope discipline

Not introduced:

- PackageId / ResultId
- nonce or replay registry
- global Run registry
- locking / WAL / database
- scheduler / automatic next
- Policy interpretation
- resume / terminal / STOP orchestration
- production source/test mutation
- Proposal artifacts

`previousRunId` remains predecessor provenance and is not renamed.

## Stable output boundary

- Revised `openspec/changes/establish-action-package-and-result-admission/explore.md`
- New `20260826-040-revise-explore` Run
- Existing 036–039 Runs, activation manifest and OpenSpec scaffold preserved
- Next boundary reported: `review-explore`

## Non-claims

- This is not Reviewer approval.
- This is not Verification PASS.
- This does not authorize Propose, Apply, Archive, checkpoint, or promotion.
