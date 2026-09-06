# Action — Revise Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: author
action: revise-propose
projectOrdinal: 031
changeStartSequence: 006
run: 20260907-061-revise-propose
input: 20260907-060-review-propose
finding: D04-RP006-001
base: 875b7827867fd8489f9c3d05837fa3879ec15e2b
```

Reviewer finding `D04-RP006-001` identified one bounded Proposal defect:
current suite totals and whole-suite zero-SKIP accounting had leaked into
normative acceptance.

This revision changes only `design.md` Validation Plan and `tasks.md` items
`3.1`–`3.3`:

```text
exact named focused / Domain / Acceptance suites
→ execute successfully on the corrected exact candidate
→ no unexplained failure

two unreadable-Guidance targets
→ both real resolver assertions execute
→ zero unreadable-fixture SKIP
→ Windows ACL restoration and read recovery succeed
→ POSIX/root low-privilege proof remains

actual suite cardinalities
→ recorded in Apply evidence
→ not frozen as Proposal constants
```

The accepted ACL helper design, Proposal scope, `skip_specs: true`, absent
delta spec, production/canonical non-mutation boundary, and pre-archive-only
task boundary remain unchanged. The `5/5 PASS` literal retained in Design
Context is historical ACL-prototype evidence, not normative suite acceptance.

No implementation, test, production, canonical spec, archive, Git, external
Flowkit manager, or candidate CLI action was executed. `.flowkit/runs/**`
records this real Author execution while OpenSpec remains planning authority.

Next boundary:

```text
review-propose
```

STOP.
