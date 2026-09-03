# Action — Review Apply

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: complete-formal-full-test-correction-and-platform-fixture-discipline
role: reviewer
action: review-apply
projectOrdinal: 027
changeStartSequence: 002
run: 20260903-015-review-apply
physicalRunGroup: 002
input: 20260903-014-apply
```

Verdict: **REVISE**.

014 implements almost all of the approved Formal Full Test contract correctly:

```text
exact singleton Owner Full Test authority
exact current candidate
exact ordered project-local checks
content-bound generic Delivery Full Test Guidance
same-candidate PASS reuse
material checkRef drift rerun
terminal candidate admission
no Registry / Planner / command catalog / fake ActionPackage
no correction or Git authority
```

However, one material Apply defect remains.

## Finding D04-R002-003 — candidate drift is detected only after all remaining checks execute

Blocking.

The approved design states:

```text
once candidate changes
→ current Full Test attempt immediately STOP
```

Current implementation executes the full ordered check loop first and re-derives `candidateRef` only after the loop.

Independent Reviewer probe:

```text
check A
→ mutates tracked repository source

check B
→ writes an external marker

expected:
A causes candidate drift
→ STOP
→ B must not execute

actual:
A mutates candidate
→ B still executes
→ only after B does host return stopped-candidate-drift
```

Reviewer observed the external marker written by check B.

This means the implementation correctly rejects final admission for a drifted candidate, but it does **not** yet enforce the approved immediate-STOP execution boundary.

Required revise-apply correction:

```text
after each actually executed check
(and before continuing to the next check)
↓
re-derive trusted current candidate
↓
if candidate != package candidate
→ STOP immediately
→ do not execute any later checks
→ no result admission
```

Keep the correction minimal.

Do not add:

```text
candidate monitor service
watcher
Registry
Planner
new lifecycle
mutation authority
```

A bounded re-check at the execution boundary is sufficient.

Add a focused counterexample test:

```text
first check mutates tracked repository state
second check has an externally observable side effect
→ second check must never run
→ outcome = stopped-candidate-drift
```

## Independent Reviewer proof of unaffected surfaces

Payload integrity:

```text
014 payload manifest
→ 38/38 file hashes / byte counts MATCH
```

Exact repository continuity:

```text
base
→ d4858d461bd5a08413b8581490e75497f4027efe

parent
→ eaa1c8f1cf9a52e05b75c3d1133f7aff8449c215

clean exact checkout before overlay
→ PASS

git diff --check
→ PASS
```

Reviewer restored only the provided unchanged dependency/tool/runtime environment.

Same exact candidate verification:

```text
domain
→ 206/206 PASS
→ 0 skipped

detached acceptance
→ 4/4 PASS

typecheck
→ PASS

build
→ PASS

format
→ PASS

lint
→ PASS

forbidden tracked artifacts
→ PASS

dependency health
→ 65 modules / 259 dependencies
→ 0 violations

repository entropy
→ 28/28 production modules reachable

entropy focused
→ 7/7 PASS

OpenSpec --all --strict
→ 19/19 PASS

git diff --check
→ PASS
```

The first acceptance attempt without `FLOWKIT_HOME` failed only because the Reviewer environment lacked the managed-tool root. Restoring the provided exact managed Archify/OpenSpec runtimes and rerunning the same candidate produced 4/4 PASS. No candidate bytes changed.

## Verification provenance note

014 records:

```text
domainProof = 205/205 PASS
```

but the exact reconstructed 014 candidate executes:

```text
206/206 PASS
```

This does not change the semantic finding above, but the 014 verification count is not exact. Do not treat `205/205` as authoritative evidence.

The revise-apply Run should rerun the affected/full required verification and record the fresh exact count. Historical 014 Run bytes do not need rewriting.

## What remains accepted

The following implementation boundaries are accepted and should not be reopened:

```text
generic product Guidance does not hard-code flowkit-next six gates
project-local Full Test order is preserved
Owner authority is exact singleton scope
DeliveryOperationPackage remains closed
candidate/check identity reuse is bounded
same-candidate external correction does not grant mutation authority
repository/canonical correction remains outside Full Test
Changes 3–5 are not pulled forward
D05 / self-hosting takeover remain absent
```

## Current-step explanation

`review-apply` asks whether the exact implementation bytes satisfy the approved Proposal and are safe to archive.

Most of the candidate is correct, but the approved fail-closed rule requires candidate drift to stop the current attempt immediately, not merely reject terminal admission after later checks have already executed.

Therefore archive is not yet allowed.

## Complexity / minimality

The defect has a small local correction:

```text
per-executed-check candidate revalidation
+
one counterexample test
+
fresh verification
```

No new subsystem is justified.

Next legal boundary:

```text
revise-apply
```

STOP.
