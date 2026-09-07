# Action — Review Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: reviewer
action: review-propose
projectOrdinal: 031
changeStartSequence: 006
run: 20260906-053-review-propose
physicalRunGroup: 006
input: 20260905-052-propose
```

Verdict: **APPROVED**.

052 faithfully converts the 050/051-approved closure-corrective Explore into the smallest Proposal surface:

```text
two known unreadable-Guidance fixture tests
+
one narrow MODIFIED existing Formal Full Test requirement
+
fresh Linux/native-Windows proof on the corrected candidate
```

No production Guidance resolver change and no Core skip/evidence/platform subsystem is proposed.

## Proposal contract accepted

The corrected rule is now explicit:

```text
attempt intended unreadable fixture
↓
probe the actual read capability used by the behavior

real enforcement path available
→ execute semantic fail-closed assertion

fixture genuinely unavailable on this host/filesystem
→ explicit project-local capability-bound SKIP
```

The Proposal correctly rejects:

```text
process.platform-only skip
mode-bit assumption as proof
silent skip
fabricated semantic PASS
```

## Project-local SKIP boundary is preserved

052 implements the exact precision requested by 051:

```text
capability-bound SKIP
→ project-local fixture/test accounting only
```

It does NOT extend:

```text
ApplicableCheckStatus
DeliveryFullTestExecutionRecord
process adapter stdout/stderr persistence
Full Test terminal evidence schema
```

and explicitly states that current Formal Full Test terminal facts do not preserve per-subtest SKIP evidence.

Therefore no `skipped` Core status, skip registry, evidence database, or cross-platform result store is justified.

## Same-candidate semantic proof remains mandatory

A platform-local SKIP is not itself semantic proof.

The Proposal requires:

```text
same exact corrected candidate
+
at least one real enforcement-capable proof elsewhere in the cross-platform proof set
```

For the known fixture this means:

```text
Linux/root
→ retain low-privilege real permission-denial proof

Windows/direct-reader host
→ if chmod(000) still permits the read
→ explicit capability-bound SKIP only
```

If the same exact corrected candidate lacks a real enforcement-capable proof, Full Test still fails closed.

This cross-platform proof obligation is project-level validation for this corrective Change; it does not imply a new persistent Core subtest-evidence model.

## Native Windows provenance remains correct

The old Owner-provided:

```text
227/229 native Windows
```

remains defect-trigger evidence only.

It is not accepted as current-candidate proof.

Apply/Review MUST obtain fresh native-Windows Domain proof on the corrected exact candidate.

Any unrelated Windows failure remains outside this Change and must return to normal Owner-controlled correction rather than being absorbed or skipped.

## Linux/root proof must not be accidentally weakened

Apply must preserve the existing low-privilege child-process enforcement path when the parent runner can bypass permission bits.

A parent/root direct-read success alone MUST NOT cause capability-bound SKIP when the existing low-privilege enforcement path can still prove real denial.

This is an Apply guardrail, not a Proposal blocker; Design already freezes it.

## Canonical spec correction is narrow and coherent

The delta modifies only:

```text
formal-full-test-execution-and-correction
→ Platform fixture mechanics may differ while semantic proof obligations remain invariant
```

It changes the old absolute no-skip formulation into bounded capability accounting while preserving:

```text
silent skip → forbidden
OS-name-only skip → forbidden
fabricated PASS → forbidden
missing same-candidate enforcement proof → fail closed
tracked test/spec correction → new candidate
```

No new capability is introduced.

## Closure-corrective classification remains intact

ProjectOrdinal 031 remains a proof-triggered closure-corrective Change after the five planned D04 capability Changes.

It does NOT rewrite the frozen D04 reference into six planned Stable Core capability Changes and does not create D05.

`required: true` remains closure coordination for this active corrective Change only.

## Candidate continuity remains correct

Apply changes tracked test/spec bytes:

```text
prior candidate proof
→ stale

corrected tracked bytes
→ new exact candidate

archive/checkpoint
→ restart real cross-platform Formal Full Test
```

The Proposal does not execute real D04 Formal Full Test, Architecture Finalization, Delivery Final, or Repository Integration during this Change.

## Independent Reviewer proof

Payload / chain integrity:

```text
052 payload manifest
→ 19/19 file hashes / byte counts MATCH

052 package SHA-256
→ 7d8cb3080658c1771a23b0cec5bf413b621f72aa9f704a1ca0d7fa8d83cea586

input 051 Reviewer package SHA-256
→ fa123315fc7213e643257bab3b7e9ef6568dbd89c0fe15bff46681e37c7d42f5
→ MATCH

embedded 051 Reviewer action/context/result
→ exact-byte MATCH
```

Exact repository continuity:

```text
base
→ 875b7827867fd8489f9c3d05837fa3879ec15e2b

parent
→ 88e376d2ca870b248952477f90adf38409fa679e

embedded bundle SHA-256
→ 34f3b4371e71a2de4713db487292ef2a61ccc3dcb3e7e7bca0f25b5f28c579a9

base checkout before overlay
→ CLEAN

production mutation
→ NONE

git diff --check
→ PASS
```

Fresh exact Node 22.23.2 regression:

```text
domain
→ 241/241 PASS
→ 0 skipped
```

Exact managed OpenSpec 1.10.0:

```text
current Change --strict
→ PASS

--all --strict
→ 23/23 PASS
```

Planning hashes:

```text
Explore
→ 81965f9ef96aad45f672df001b48ab792ab0dd5831f973a9e216b3efbc176835

Proposal
→ a6dad291a1de271f5f44e5143ae05d113317cbc9c4c33d44bdf1a093beb3d7de

Design
→ 4b7aca4a8de9c13c3f554d927c25bcb212b9104e56ddc26834367aac153affd1

Tasks
→ b787d3fb491927da926ee91c05cdedf3539e74403e8b02fc667c306f2e9076ad

Formal Full Test delta spec
→ bce9705135bbc5f2c78e8e8c06b3973e72857c580df3402b9cbc6ebe1810d29f
```

## Current-step explanation

`review-propose` asks whether the Explore finding has been frozen into an implementable contract without growing the Stable Core.

It has.

The key distinction is:

```text
host cannot express this fixture
→ explicit project-local SKIP

semantic behavior is therefore proven
→ NO
```

Semantic proof still comes from the same exact candidate's real enforcement-capable execution elsewhere in the required cross-platform proof set.

## Complexity / minimality

```text
two test fixtures
+
one existing requirement correction
+
fresh two-platform proof
```

No new production subsystem or lifecycle is required.

## Apply attention

1. Modify only the two known fixture tests plus the approved canonical requirement/task completion surface.
2. Capability must be determined from actual read behavior; do not hardcode `win32`.
3. Preserve Linux/root low-privilege enforcement proof; root-readable does not automatically mean SKIP.
4. Unavailable fixture must use explicit project-local SKIP with stable reason, never PASS.
5. Do not change production Guidance resolver bytes absent fresh independent defect proof.
6. Do not add Core skipped status, output persistence, registry/store, ACL layer, or filesystem abstraction.
7. Include fresh native-Windows Domain and Acceptance proof for the corrected exact candidate.
8. Include fresh Linux enforcement proof for that same exact candidate.
9. Do not absorb unrelated Windows failures into this corrective Change.
10. After archive/new checkpoint, prior Formal Full Test terminal proof remains stale and real D04 cross-platform Full Test must restart.

## New-content / scope-drift

```text
production resolver mutation
→ NONE proposed

Core skip/evidence model
→ NONE

ACL/filesystem subsystem
→ NONE

sixth planned capability
→ NO

D05
→ NO

real D04 closure operations
→ NOT executed

scope drift
→ NONE
```

Next legal boundary:

```text
apply
```

STOP.
