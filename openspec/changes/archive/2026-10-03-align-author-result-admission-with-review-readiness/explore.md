# Explore: align Author Result admission with Review readiness

## Real use and authority boundary

Owner authorized an independent manager Change after identifying that an Author can finish a successful Propose or Apply Run whose next Review rejects its candidate inputs. This Change has no Delivery identity or canonical Flowkit Action. The investigation is source proof for a later Proposal, not a Run, Reviewer verdict, or permission to implement or checkpoint. The existing uncommitted Delivery Run sequence work in `src/cli/action-commands.ts`, `src/cli/current-run-chain.ts`, and `tests/unit/domain/delivery-run-sequence.test.ts` remains separate.

## Decisive source proof at `95696d4`

| Boundary | Current check | Consequence |
| --- | --- | --- |
| Successful `propose` / `revise-propose` finish | `checkResultArtifactsOnFinish` calls `checkPlanningArtifactHashes`; it accepts any nonempty subset of the allowed planning paths and verifies only declared bytes (`src/cli/action-artifact-hashes.ts:59-85,163-178`). | A hash map containing only `tasks.md` can pass this check even if `proposal.md` and `design.md` are absent or unbound. |
| `review-propose` start | Requires readable `proposal.md`, `design.md`, and `tasks.md`, OpenSpec `isPlanningComplete`, then calls the same planning-hash checker (`src/cli/action-readiness.ts:185-209`). | The shared hash checker prevents a different path/hash interpretation, but finish can still confirm a Result before these additional readiness conditions hold. Review does not currently require all three paths in the hash map either. |
| Successful `apply` / `revise-apply` finish | The finish artifact checker has no Apply branch (`src/cli/action-artifact-hashes.ts:163-178`); generic Result admission and own proof closure in `src/cli/action-commands.ts` do not supply the missing candidate-file hash check. | A terminal Author PASS with missing, malformed, or drifted `artifactHashes` can be written. |
| `review-apply` start | Calls `checkArtifactHashes` on the Author Result and rechecks declared proof (`src/cli/action-readiness.ts:211-220`). | The accepted Apply Run can be rejected before independent Review begins. Archive also requires nonempty candidate hashes (`src/cli/support-change-archive.ts:148-177`). |

Explore's dedicated-field rule was closed by the preceding Change and is not being reopened. A later file mutation can still make any Review reject a previously valid Result; that is intentional read-time drift detection, not a finish-admission defect.

## Bounded Proposal direction

1. For **new terminal Author PASS** `propose` / `revise-propose`, check current managed OpenSpec planning completion before the first terminal machine-file write. Require the exact current Change's `proposal.md`, `design.md`, and `tasks.md` keys in `artifactHashes` and verify those files and every other declared allowlisted planning file using the existing project-root-relative checker. The three required hashes also establish regular, readable, non-linked files. Keep `review-propose`'s current reread and planning-completion check. This makes new accepted Results complete while leaving historical confirmed Results under their existing read contract.
2. For **new terminal Author PASS** `apply` / `revise-apply`, run the same `checkArtifactHashes` candidate-file validation already used by `review-apply` before the first terminal machine-file write. Require a nonempty map; do not invent a new Apply path allowlist or artifact registry.
3. Preserve the existing Author `FAIL`, nonterminal, immutable historical Result, proof, Role, Policy, and create-once rules. Reviewer start remains an independent current-byte check and may still reject post-finish drift. Do not silently repair old Runs or infer Reviewer approval.
4. The finish-side OpenSpec check should consume the managed observation directly. `resolveActionContext` also reads the Run chain, while a newly started Run has only `action.md`; reusing that broader query during finish risks treating the legitimate prepared Run as an invalid canonical chain. Proposal and tests should pin this ordering before implementation.

The proposed mandatory trio hash coverage is a deliberate strengthening of **new** Propose Results. Existing `review-propose` currently verifies only declared entries; tightening its legacy read rule is unnecessary for this Change and could reject already confirmed Runs. Enumerating every delta spec file for mandatory hashing is also outside the minimum Review-readiness gap; any declared spec hash remains verified, and OpenSpec still owns planning completeness.

## Verification boundary and conclusion

The source trace is sufficient to establish the two prewrite gaps and the shared-checker reuse path. Apply should add focused finish-before-write counterexamples for missing or invalid Propose/Apply artifacts, successful complete Results, real `FAIL` and nonterminal boundaries, and unchanged Reviewer rereads. Tests against the current candidate remain necessary; this Explore does not claim implementation PASS or cross-project acceptance.

**Explore conclusion: PASS for Proposal readiness.** The smallest current issue is successful-result admission at Propose and Apply, with exact legacy and drift limits stated above.
