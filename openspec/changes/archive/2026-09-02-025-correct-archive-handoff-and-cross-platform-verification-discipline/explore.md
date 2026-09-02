# Explore — Correct Archive Handoff and Cross-Platform Verification Discipline

## 1. Current bounded facts

This final D03 corrective Change is active on exact base:

```text
39ef634bc7680af0494d4d918adf58e338601a83
```

Its durable `projectOrdinal` is exactly `025`, assigned once from `max(existing durable projectOrdinal)+1`. The ordinal is not derived from Run sequence, physical Run group, manifest array position, archive count, or `changeStartSequence`.

The combined corrective scope remains one bounded convergence across:

```text
A. archive Action preparation/readiness and correction-safe ordering
B. exactly two Windows-only proof-mechanics gaps
C. materially complete uncommitted continuation handoff
D. canonical Author spec convergence away from stale phase literals
E. generic proof-Explore concept-ownership and mutation/failure-ordering HOW
```

Canonical terminology for the archive path is:

```text
review-apply after apply/revise-apply
completion-transition readiness
```

`completed` is not an archive prerequisite. Archive does not require a separate Owner execution authorization. This Explore uses the independent `.agents/skills/**` bootstrap plane and does not self-host on candidate product `skills/actions/**`.

## 2. Real Action preparation requires one bounded package-bound execution-order seam

`archive` is the Standard Action. `prepare` is not a StandardActionId; `prepared` remains the existing lifecycle state. The user-facing/host meaning of Action preparation must nevertheless be real: preparation must be able to execute a non-mutating readiness/self-check, detect blockers, and avoid committing a new prepared Action when that self-check fails.

The accepted Action Guidance execution contract adds one non-negotiable identity constraint:

```text
product Action Guidance HOW
→ must execute only after exact canonical Guidance identity is frozen
→ exact Guidance identity must be inside the ActionPackage
```

Therefore product archive Guidance HOW cannot be executed by a trusted host before `invokeSingleAction(...)` merely because the host can call `resolveActionGuidanceRef(...)`. Repository inspection finds no existing production host that owns pre-ActionPackage Guidance execution. A pre-invocation host-composition model that executes product Guidance before ActionPackage formation is therefore invalid: composable exported functions do not prove an already-owned execution seam.

The current single-Action invocation order is:

```text
establish/reuse structural prepared CurrentAction
↓
validate Run context
↓
resolve exact GuidanceRef
↓
form exact ActionPackage
↓
ActionExecutionCallback(ActionPackage)
↓
Result admission
↓
terminal
```

This order also explains the correction problem: package/execution/admission failure currently returns the prepared Action, while Policy rejects switching away from an exact prepared Action. A real archive self-check that is allowed to fail correction-safely therefore cannot simply be appended after the currently committed prepared boundary.

The smallest contract-consistent correction is to make preparation atomic inside the existing single-Action invocation boundary:

```text
Policy has already selected exact Action A
↓
invocation structurally validates and stages candidate A/prepared
(the staged object is not yet externally committed)
↓
validate exact Run context
↓
resolve exact canonical GuidanceRef
↓
form the exact ActionPackage from the staged prepared candidate
↓
ActionPreparationCallback(exact ActionPackage)
→ read-only readiness/self-check under exact package/Guidance identity

BLOCKED / failure before Action mutation
→ do not expose/commit staged A/prepared
→ return the pre-invocation currentAction unchanged
→ do not call ActionExecutionCallback

PASS
→ commit/use exact A/prepared
→ ActionExecutionCallback(the same exact ActionPackage)
→ existing admission / terminal flow
```

This is not a second Action, Run, lifecycle state, Agent runtime, or preparation control plane. It is one bounded pre-execution seam inside the existing single-Action invocation. The same exact ActionPackage identity reaches preparation and execution, so Guidance HOW never runs outside the accepted package identity boundary.

For the archive path the readiness/self-check remains bounded to facts such as:

```text
exact accepted review-apply result for the current candidate
exact candidate continuity / no post-review byte drift
active exact Change coordination entry
persisted projectOrdinal validity / uniqueness
OpenSpec artifact/task and delta-sync readiness
archive target collision / identity readiness
completion-transition readiness
handoff/removal-manifest readiness when applicable
known blocker requiring repository/canonical correction
```

If archive preparation is blocked because accepted bytes must change, the invocation leaves the prior terminal `review-apply` currentAction intact. Existing Owner-controlled correction can therefore select `revise-apply`; after mutation, a fresh `review-apply` acceptance is required before archive preparation is attempted again. If failure is environment-only and accepted bytes are unchanged, the same candidate may be prepared again after the environment issue is corrected.

A controlled non-production prototype against the exact candidate proves the seam is technically sufficient using existing domain primitives plus only the bounded preparation callback concept:

```text
terminal review-apply
↓
transitionCurrentAction(...) produces a staged archive/prepared candidate locally
↓
resolveActionGuidanceRef(repoRoot, "archive")
↓
formActionPackage(stagedPrepared, exactRunContext, exactGuidanceRef)
→ exact package contains skills/actions/archive/SKILL.md identity
↓
readiness = BLOCKED
→ staged prepared candidate discarded
→ externally committed currentAction remains terminal review-apply
→ evaluatePolicyAndNextBoundary(... Owner revise-apply ...)
→ ready-action: revise-apply

PASS branch
→ existing invokeSingleAction(...) can continue from the exact staged prepared identity
→ terminal archive path remains compatible
```

The prototype does not claim the current production API already implements this atomic preparation outcome; it proves that no new Action/state/package identity is needed and bounds the actual implementation correction to single-Action execution ordering/seam semantics.

Decision:

> Revise the existing single-Action execution contract so a staged prepared candidate can form the exact ActionPackage, a read-only preparation callback can execute under that exact package identity, and preparation failure can return the pre-invocation currentAction without exposing the staged prepared candidate. PASS then continues the existing execution/admission/terminal path. This is a bounded Core execution-order correction, not a new lifecycle or control plane.

## 3. Exactly two Windows-only skips remain and both are test-mechanics gaps

Exact repository inspection finds exactly two tests with explicit `process.platform === "win32"` skip branches:

```text
tests/unit/domain/action-guidance-execution.test.ts
→ unreadable canonical Guidance fails closed

tests/unit/domain/applicable-check-execution.test.ts
→ same bytes + Git-visible executable mode changes candidateRef
```

The separate symlink-fixture skips on `EPERM/EACCES/UNKNOWN` are host-capability guards and are not Windows-only scope.

The production contracts are already correct:

```text
action-guidance-execution
→ canonical Guidance must be readable regular file
→ unreadable fails closed

applicable-check-execution
→ candidate material includes Git-visible 100644 / 100755 mode
→ same bytes + mode change changes candidate identity
```

Therefore this Change should change proof mechanics/tests, not production semantics.

### 3A. Windows unreadable Guidance semantics are simulated on Linux

The production resolver has no Windows/POSIX behavior branch. Its contract-relevant observation is only whether the exact canonical regular file can be read:

```text
lstat / realpath / readFile succeeds
→ trusted GuidanceRef

any filesystem/read failure
→ null / fail closed
```

Therefore D03 does not need to prove a specific Windows ACL command implementation. It needs to prove the semantic condition that a host-level access denial makes canonical Guidance resolution fail closed.

The existing detached Linux environment can simulate that Windows ACL-denial semantic with a real OS permission failure: make the canonical Guidance unreadable to a low-privilege process and execute the real `resolveActionGuidanceRef(...)`. Controlled proof on the exact codebase returns `null` with no skip.

```text
Linux low-privilege real EACCES
→ same product-visible condition as Windows ACL access denial
→ canonical Guidance resolution fails closed
```

This is an equivalence proof at the product boundary, not a claim that Linux reproduces Windows ACL implementation details. Do not add `icacls` fixtures, a Windows runner requirement, filesystem adapter, production mock seam, permission subsystem, or platform identity layer merely to prove a platform-agnostic resolver contract.

Decision:

> Replace the Windows-only skip with a Linux-hosted semantic simulation that produces a real unreadable-file failure against the real resolver. The acceptance fact is fail-closed behavior under host read denial, not native Windows ACL command execution.

### 3B. Windows Git executable-mode semantics are simulated on Linux

The current test uses worktree `chmod`, which is the wrong portable mechanism because Windows worktrees do not reliably expose POSIX execute-mode mutations.

Git itself already owns the contract-relevant identity. `git update-index --chmod=(+|-)x` is the exact Git mechanism for changing the executable bit in the index.

Controlled proof on this exact codebase used a temporary Git repository with `core.filemode=false`:

```text
initial index mode: 100644
candidateRef: candidate:sha256:5c2b...

same bytes
git update-index --chmod=+x check.sh
index mode: 100755
candidateRef: candidate:sha256:6a7a...
```

The candidate identity changed while file bytes remained identical, and no worktree chmod was required.

Decision:

> Replace the platform-skipped worktree-`chmod` proof with Git-index-oriented executable-mode mutation and verify it in the detached Linux environment with `core.filemode=false`. This simulates the Windows-relevant worktree limitation while exercising the real Git-visible candidate identity contract; native Windows execution is not required.

## 4. Continuation completeness is a Guidance/packaging invariant, not a new persistence subsystem

Current Author Guidance consistently asks for concise handoff identities and check facts, but most Action entries do not state the stronger invariant proven necessary by D02/D03 continuation history:

```text
latest delta payload alone
may be insufficient
when the next session needs exact uncommitted ancestor bytes
```

Recent D03 cumulative handoffs prove a bounded solution is already sufficient in practice:

```text
056 Apply package
058 Revise Apply package
060 Archive package
```

Each carried materially required prior uncommitted Action/Run state, and packages with deletions also carried a removal manifest. Independent reconstruction from the committed base plus cumulative handoff/removal information reproduced the exact candidate and passed focused verification.

Minimum invariant:

```text
continuation handoff
→ latest delta
+ all materially required uncommitted ancestor state
```

Allowed forms:

```text
cumulative handoff package
or
exact retrievable ancestor payload references
```

The invariant does not require every historical Run or full proof transcript to be copied. It requires exact continuation sufficiency for material uncommitted bytes.

Decision:

> Converge this requirement into Author product/bootstrap handoff HOW and focused tests. Do not create a payload registry, continuation DB, background sync, Evidence Platform, or second lifecycle.

## 5. Canonical Author spec contains superseded D03 phase literals

`openspec/specs/author-action-guidance/spec.md` is current canonical specification truth, but it still contains Change-2-era phase observations that are no longer current:

```text
`converge-reviewer-action-guidance` remains planned
→ no projectOrdinal / example next `022`

Change 2 retains TEMPORARY-RUN-SURFACE-GUIDANCE.md
while Reviewer convergence is incomplete

Change 2 does not mass-rename old unnumbered archives
```

Current repository facts are now:

```text
Reviewer Guidance completed / archived as projectOrdinal 024
TEMPORARY-RUN-SURFACE-GUIDANCE.md removed after formal Reviewer takeover
historical date-only archives normalized by completed projectOrdinal 023 Change
```

The durable semantics underneath those old examples remain valid, but current canonical spec should express the invariant rather than obsolete execution chronology.

Minimum convergence:

```text
planned-only Change reserves no projectOrdinal
→ synthetic/stable scenario, not named current planned Change

bootstrap/product temporary bridge rule
→ current accepted ownership after takeover, with history left to Git/OpenSpec archive

historical archive normalization
→ no longer encoded as a prohibition scoped to old Change 2
```

Do not rewrite historical archived OpenSpec artifacts or old Runs merely to remove old text. Those remain provenance/history.

Decision:

> Modify the existing `author-action-guidance` canonical capability; do not create a new product capability merely for cleanup.

## 6. Proof-based Explore needs one generic method enhancement

Current repository inspection identifies a reusable Explore-method gap rather than a Flowkit-specific product gap. Both existing Explore HOW surfaces already require proof-first risk reduction and reuse-before-abstraction, but neither explicitly requires (a) classifying a proposed concept against existing owned mechanisms before naming a new one, or (b) locating validation/failure relative to the mutation/commit point when recovery legality depends on ordering. The gap is therefore real and bounded.

The generic correction is conditional and applies broadly to software engineering work:

```text
when proposing a new concept/mechanism
→ first classify ownership
   existing capability / domain entity?
   existing operation?
   existing state?
   configuration?
   validation/proof mechanic?
   Guidance/HOW phase?
   or genuinely new capability?

when mutation/state is material
→ identify validation point
→ identify mutation/commit point
→ prove failure-before-commit behavior
→ prove failure-after-commit consequences
→ check retry / rollback / correction legality
```

This is not specific to `StandardActionId`. The same reasoning applies to common project work such as:

```text
database/schema migration
→ validate compatibility before durable migration commit

deployment/configuration
→ validate candidate before deployment mutation

file generation / repository rewrite
→ validate inputs/targets before destructive write

API / transactional workflow
→ distinguish validation from state commit and failure recovery

stateful test/fixture design
→ distinguish the semantic contract from the mechanism used to trigger it
```

The method MUST remain proportional. If a Change does not introduce a new concept/mechanism and has no material state/mutation ordering risk, Explore does not invent one merely to satisfy a checklist.

Decision:

> Converge a small generic `concept ownership / existing mechanism` check and `mutation/failure ordering` check into both the independent proof-based Explore bootstrap HOW and canonical product Explore HOW. Keep the wording technology-neutral; Flowkit-specific Action/state names may appear only as examples, not as the reusable rule. This is an Author Guidance HOW improvement inside the existing `author-action-guidance` capability, not a new product capability or lifecycle contract.

## 7. Product/spec impact

The smallest Proposal direction remains one corrective convergence, but the archive preparation proof now requires an explicit bounded execution-order/seam correction rather than a Guidance-only implementation:

```text
MODIFY single-action-execution-terminal-boundary
→ stage structurally valid prepared candidate inside invocation
→ form exact ActionPackage before preparation HOW executes
→ add one read-only package-bound preparation outcome seam
→ preparation failure returns pre-invocation currentAction and skips execution callback
→ preparation PASS continues existing execution/admission/terminal flow

MODIFY action-guidance-execution
→ exact Guidance identity remains frozen into ActionPackage before any Agent preparation/execution HOW
→ preparation and execution consume the same exact package Guidance identity

MODIFY author-action-guidance
→ archive preparation/readiness HOW and correction boundary
→ completion-transition readiness wording
→ continuation completeness invariant
→ current-truth replacement of stale phase literals
→ generic proof-Explore concept-ownership / existing-mechanism check
→ generic mutation/failure-ordering check when state or mutation is material

TEST-MECHANICS ONLY
→ Windows unreadable-Guidance proof
→ Git-index executable-mode proof
```

No new product capability is required. `ActionPackage` remains the single execution identity package; no PreparationPackage/Result/Run identity is introduced. The existing action lifecycle still has only `prepared` and `terminal`.

Expected implementation surface is bounded around:

```text
src/domain/single-action-execution.ts
focused single-action / Policy / ActionPackage tests

skills/actions/archive/SKILL.md
.agents/skills/archive/SKILL.md
skills/actions/explore/SKILL.md
.agents/skills/explore-proof-based/SKILL.md
relevant Author handoff Guidance/bootstrap entries
openspec/specs/author-action-guidance via delta/archive sync
focused Author Guidance tests

tests/unit/domain/action-guidance-execution.test.ts
tests/unit/domain/applicable-check-execution.test.ts
```

Proposal should not mechanically copy continuation text into every Skill and should not expand the execution seam beyond the minimum preparation outcome needed to keep package identity and correction-safe ordering coherent.

## 8. Existing proof baseline

Focused exact tests before implementation:

```text
Action lifecycle
single-Action execution
Policy Owner correction
Action Guidance execution
Applicable Check execution
Author Guidance

62 / 62 PASS on Linux
```

The decisive execution-ownership proof now has two parts:

```text
repository inspection
→ no existing production host owns product Guidance HOW before ActionPackage formation
→ Guidance-only / no-Core-seam claim rejected

controlled package-bound preparation prototype
→ staged structurally valid archive/prepared candidate
→ exact GuidanceRef resolved
→ exact ActionPackage formed
→ blocked preparation discards staged candidate
→ prior terminal review-apply remains externally current
→ Owner revise-apply remains Policy-legal
→ PASS branch can continue existing invocation path
```

The prototype ran with exact Node 22.23.2 and the supplied detached dependency environment and reported `PREPARATION_PACKAGE_IDENTITY_PROOF_PASS`. It is execution-local proof only; no production file was mutated.

Full domain baseline remains:

```text
173 / 173 PASS
```

OpenSpec current canonical baseline remains:

```text
canonical specs strict  17 / 17 PASS
archived task strict    23 / 23 PASS
```

The active corrective Change is still Explore-only and has no Proposal/spec delta yet, so `openspec validate --all --strict` is not used as a planning-complete assertion at this boundary.

The Linux proof environment is the intended execution surface for these two former Windows-only gaps. Success is established by explicit Linux-hosted semantic simulations, not by interpreting a Linux `skipped = 0` count as Windows execution.

No production implementation was mutated during Explore; dependency-resolution inputs remain byte-identical to base.

## 9. Explicit non-goals

```text
new Archive Preflight / pre-archive StandardActionId
new lifecycle state
new Policy transition table
new Owner archive authorization
requiring Change completed before archive
PreparationPackage / preparation Run / preparation Result identity
Agent Runtime / Registry / Planner / background preparation service
new verification platform / Windows abstraction
filesystem permission abstraction
production mock seam for permission proof
new applicable-check candidate semantics
third symlink host-capability skip cleanup
payload registry / continuation DB / background sync
new Run persistence surface
mandatory lifecycle/state analysis for every Explore when no material concept/mutation risk exists
new Explore lifecycle phase / proof registry / concept registry
Reference Architecture / diagram work
Memo state mutation
D03 finalization / Formal Full Test
Git checkpoint / commit / merge
```

## 10. Remaining limitation and verdict

Native Windows runtime is not required for this corrective Change. The resolver has no platform-specific production branch, so a real Linux host read denial is a sufficient semantic simulation of Windows access-denial behavior at the product boundary. Git-index mode proof is likewise executed on Linux with `core.filemode=false`, reproducing the Windows-relevant worktree limitation while exercising the real candidate derivation path.

The archive preparation ownership contradiction is now resolved at contract level: product Guidance HOW does not run before ActionPackage identity. The smallest required correction is explicitly acknowledged as a bounded single-Action execution-order/seam change that keeps staged preparation atomic until readiness passes. No new Action/state/control plane is required.

Explore verdict:

```text
PASS
```

Proposal can now specify the bounded preparation callback/outcome semantics plus the already-converged Windows, continuation, canonical-spec and proof-Explore HOW corrections without inventing a second execution identity. Apply/review acceptance must execute both Linux-hosted simulations against the exact candidate bytes; no native Windows runtime fact remains outstanding.
