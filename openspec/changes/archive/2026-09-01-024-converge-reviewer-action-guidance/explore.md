# Explore — Converge Reviewer Action Guidance

## 1. Current boundary

Owner activated `converge-reviewer-action-guidance` on exact base:

```text
10ae02c75ef72c7f410f0933ce952351b0486ea6
```

Stable manager `4b45552b90ee327488bde3141c51c556e65a2e95` independently returns:

```text
ready-action: explore
```

All dependencies are completed. Stable Core self-development still runs from independent `.agents/skills/**`; candidate `skills/actions/**` is not execution authority for this Explore.

Durable D03 ordinals before this Explore were unique `021,022,023`. The active Change had none, so bootstrap Explore persisted exactly once:

```text
projectOrdinal: 024
```

`024` came only from `max(durable assigned projectOrdinal)+1`, not Run `052`, physical group `005`, array position, archive count, or `changeStartSequence`.

## 2. The product gap is exact and Core-complete

Current product Guidance contains seven Author entries but no Reviewer entries:

```text
skills/actions/review-explore/SKILL.md   missing
skills/actions/review-propose/SKILL.md   missing
skills/actions/review-apply/SKILL.md     missing
```

Production Core already owns everything needed to consume them:

```text
review-* are existing StandardActionIds
review-* map to execution role reviewer
canonical path = skills/actions/<actionId>/SKILL.md
```

On the exact repository, `resolveActionGuidanceRef` returns `null` for the three Reviewer Actions only because those files are absent. An execution-local scratch proof adding regular files at exactly those paths makes the existing resolver return valid Action-aligned refs without any `src/**` change.

Relevant existing Core/Guidance tests are green:

```text
31 / 31 PASS
```

Decision:

> Change 3 needs Reviewer Guidance content, not resolver, ActionPackage, Policy, lifecycle, execution-role, or Result-admission changes.

## 3. Bootstrap Reviewer HOW is the migration input, not product truth

Independent bootstrap Reviewer Skills already cover substantial action-specific review discipline:

```text
review-explore
→ scope/fact/proof quality + Proposal readiness

review-propose
→ Explore traceability + minimal/testable contract

review-apply
→ Proposal fidelity + implementation correctness + real evidence
```

All three already require bounded findings and mutation-free review, and they contain the chronology/concision corrections from Change 022.

Exact inspection still finds accepted D03 Reviewer disciplines that are absent or not uniform across all three:

```text
current-step explanation
explicit complexity/minimality assessment
explicit new-content/scope-drift assessment
approved review-chain tracing when material
semantic-invariant/literal classification challenge
explicit no-consumption of candidate product Reviewer Skill
one consistent concise Reviewer Run/handoff boundary
```

Decision:

> Reuse the bootstrap content as evidence/migration input, but converge the final product contract rather than copying it mechanically.

## 4. Required Reviewer contract

Canonical product entries remain exactly:

```text
review-explore
review-propose
review-apply
```

Common invariants:

```text
inspect exact Author artifact/candidate
trace exact approved chain when the decision depends on it
independently reproduce decisive facts when materially needed
produce fact-based bounded findings
produce clear Reviewer verdict

no Author artifact mutation
no revise/apply/archive execution
no Owner authority
no Verification PASS claim
no next-Action authority
STOP after Reviewer Result
```

Every review must also briefly report:

```text
1. what this lifecycle step is doing
2. whether complexity increased / minimality held
3. whether new content or scope drift appeared
```

These are Reviewer HOW outputs only, not lifecycle state or Policy/Verification facts.

### Review-chain discipline

When later acceptance depends on earlier boundaries, Reviewer must trace the relevant chain rather than review only the latest payload. A revise review verifies both:

```text
finding convergence
+
preservation of already-approved unaffected content
```

Existing exact artifact/Run references are enough. No Review Registry, Evidence DAG, payload DB, or automatic chain planner is required.

### Literal / invariant discipline

The recent transient-state test defect is a real counterexample. Reviewer HOW should ask of a material literal:

```text
contract constant?
configuration/environment variable?
or merely current repository observation?
```

Incidental observations should be replaced by semantic invariants. This does not justify an AST scanner, magic-number Gate, or waiver system.

## 5. Keep exact Guidance identity simple

Current `ActionGuidanceRef` binds only:

```text
canonical entry path
+
exact canonical entry SHA-256
```

Moving execution-critical Reviewer semantics into a new shared file would reopen the transitive-content identity question from Change 1.

Therefore current minimum is:

```text
3 self-contained product Reviewer entries
+
3 independent bootstrap Reviewer entries updated in place for parity
```

Do not add a shared execution-critical Skill dependency graph, Registry, Router, Planner, or transitive Guidance identity subsystem.

Bootstrap Reviewer entries must not read, execute, delegate to, or become thin pointers to candidate `skills/actions/review-*`. D03/D04 self-hosting boundary remains unchanged.

## 6. Temporary Run bridge can now be retired

`TEMPORARY-RUN-SURFACE-GUIDANCE.md` was intentionally retained until Reviewer formal/bootstrap convergence.

Its stable responsibilities now have permanent owners:

```text
run-result-persistence spec
→ three-file durable Run contract

Author product Guidance
→ Author Run/handoff concision

this Change
→ Reviewer product Run/handoff concision
  + independent bootstrap Reviewer parity
```

After Apply proves that coverage, the temporary parallel HOW should be removed:

```text
delete TEMPORARY-RUN-SURFACE-GUIDANCE.md
remove its active AGENTS.md bridge reference
update live focused tests that currently require it
```

Do not rewrite historical `.flowkit/runs/**` or archived OpenSpec artifacts that mention the temporary document; those are immutable provenance, not active dependencies.

The open Memo may still mention the bridge as historical concern text. Memo state transition is separately Owner-gated (`dismiss-memo` / `promote-memo`) and is not authorized by this Change activation.

Cleanup therefore means:

```text
no live operational dependency / no parallel temporary HOW
```

not zero historical textual matches.

## 7. Specification and architecture direction

This Change adds real product HOW, so `skip_specs` is not appropriate.

Minimum Proposal direction:

```text
ADD reviewer-action-guidance capability
→ three canonical Reviewer entries
→ mutation-free Reviewer semantics
→ step / complexity / scope-drift reporting
→ review-chain discipline
→ literal/invariant challenge
→ concise Run/handoff discipline
→ independent bootstrap parity
→ temporary bridge takeover/cleanup
```

No change is needed to `action-guidance-execution`: it already resolves every Standard Action canonically and fails closed when an entry is absent.

No change is needed to `run-result-persistence`: it already owns the stable three-file Run surface and keeps Reviewer verdict separate from Verification.

D03 Planned Architecture already contains canonical Author/Reviewer HOW and independent Reviewer semantics. This Change realizes that plan; no per-Change Archify mutation is needed. Actual/canonical diagram refresh remains Delivery-finalization work.

## 8. Expected later mutation surface

Expected:

```text
skills/actions/review-explore/SKILL.md
skills/actions/review-propose/SKILL.md
skills/actions/review-apply/SKILL.md

.agents/skills/review-explore/SKILL.md
.agents/skills/review-propose/SKILL.md
.agents/skills/review-apply/SKILL.md

Reviewer Guidance OpenSpec delta/planning artifacts
focused Guidance tests
TEMPORARY-RUN-SURFACE-GUIDANCE.md deletion
AGENTS.md temporary-bridge reference removal
```

Not expected:

```text
src/**
package/lock/workspace dependency inputs
ActionPackage / Policy / Run schema
new Standard Action or lifecycle state
architecture/**
Skill Registry / Router / Planner / Runtime
self-hosting migration
Git history rewrite
.flowkit/memos.json mutation without separate Owner authority
```

If Proposal/Apply proves any excluded surface is actually necessary, STOP and return to scope review.

## 9. Baseline proof

After activation, ordinal persistence and OpenSpec scaffolding, no product implementation has occurred.

```text
full domain tests                 168 / 168 PASS
focused Guidance/Core tests        31 / 31 PASS
canonical OpenSpec specs strict    16 / 16 PASS
archived OpenSpec validation       22 / 22 PASS
git diff --check                           PASS
```

The active Change itself is intentionally planning-incomplete during Explore; failure of `validate --all` for that empty planning state is not a product defect.

## 10. Explicit non-goals

```text
Core/resolver/ActionPackage/Policy mutation
new Reviewer lifecycle state
Reviewer production mutation or automatic next Action
automatic Author/Reviewer loop
Verification Planner / Evidence Platform
Skill Registry / Router / Planner
shared execution-critical Guidance dependency graph
transitive Guidance identity subsystem
self-hosting takeover
new Run persistence surface
full proof-transcript persistence
fixed size correctness Gate
magic-number scanner
architecture finalization
Memo state mutation without exact Owner authority
Git checkpoint / commit / merge
```

## 11. Conclusion

Durable facts:

```text
3 Reviewer product entries are genuinely missing.
Existing Core already supports their canonical identity and reviewer role.
Bootstrap Reviewer HOW is useful but incomplete against accepted final D03 discipline.
No Core/identity/lifecycle subsystem is required.
Self-contained entries preserve current content-bound identity semantics.
Bootstrap Reviewer HOW remains independently executable through D04.
Temporary Run bridge can be removed after formal/bootstrap Reviewer coverage lands.
Historical references remain immutable; Memo mutation remains separately Owner-gated.
```

Result:

```text
PASS → review-explore
```
