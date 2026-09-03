# Action — Revise Apply

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: complete-formal-full-test-correction-and-platform-fixture-discipline
role: author
action: revise-apply
base: d4858d461bd5a08413b8581490e75497f4027efe
projectOrdinal: 027
changeStartSequence: 002
run: 20260903-016-revise-apply
physicalRunGroup: 002
input: 20260903-015-review-apply
```

Reviewer `015-review-apply` verdict is `REVISE` with one blocking finding: `D04-R002-003`.

The correction is intentionally local: after each actually executed Full Test check, re-derive the trusted current candidate before continuing. If candidate identity differs from the package-bound candidate, return `stopped-candidate-drift` immediately and execute no later checks.

A focused two-check counterexample now proves that when check A mutates tracked repository state, check B's external side effect never occurs. No watcher, monitor service, Registry, Planner, new lifecycle, mutation authority, or candidate subsystem is introduced.

All boundaries previously accepted by Reviewer remain unchanged.

Fresh exact verification records `207/207` Domain PASS, replacing the inexact historical `205/205` count in Run 014 without rewriting that historical Run.

STOP at `review-apply`.
