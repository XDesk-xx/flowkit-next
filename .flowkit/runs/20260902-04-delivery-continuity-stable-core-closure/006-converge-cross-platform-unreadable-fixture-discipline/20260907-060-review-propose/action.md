# Action — Review Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: reviewer
action: review-propose
projectOrdinal: 031
changeStartSequence: 006
run: 20260907-060-review-propose
input: 20260907-059-revise-propose
approvedExploreReview: 20260907-058-review-explore
base: 875b7827867fd8489f9c3d05837fa3879ec15e2b
```

Verdict: **changes-requested**.

## Current step

This Action independently checks the revised Proposal/Design/Tasks against the
Owner-corrected Explore approved by `058`. Reviewer changes only this Run and
does not revise planning artifacts, execute Apply/Archive, claim Verification
PASS, or create Owner/Git authority.

No external `flowkit` command is available. No candidate CLI was substituted;
this is a real D04 bootstrap Reviewer record, not a claimed candidate-runtime
Run.

## Accepted Proposal boundaries

- `.openspec.yaml#skip_specs=true` is correct because the canonical platform-
  fixture requirement already owns the no-skip semantic invariant; the obsolete
  weakening delta spec is absent.
- The implementation is limited to one shared test-only fixture helper and the
  two existing resolver tests. Production/Core/canonical spec/runtime bytes are
  outside mutation authority.
- Native Windows uses current-SID `RD` denial on exact temporary files, executes
  both real resolver `null` assertions, restores the ACE in `finally`, and may
  not convert setup/assertion/restoration/cleanup failure into PASS or SKIP.
- POSIX/root real permission-denial proof remains required.
- All tasks are unchecked and pre-archive; archive/checkpoint/Full Test restart
  are continuation facts rather than Change tasks.

## Blocking finding

### D04-RP006-001 — Current suite counts leaked into normative acceptance

**Affected artifacts / claims:** `design.md` Validation Plan and `tasks.md`
items `3.1`–`3.3`.

**Observed fact:** these normative sections require exact totals `19/19`,
`241/241`, and `5/5`, and describe whole Domain runs as zero SKIP. Those totals
are current repository observations, not stable contract constants. The
approved Explore requires the named suites to succeed and the two unreadable-
Guidance assertions to execute with zero unreadable-fixture SKIP; it does not
freeze all future suite cardinalities or make unrelated subtest accounting part
of this corrective Change.

**Contract impact:** a harmless addition/removal of an unrelated test could make
a correct Apply fail this Proposal, while matching a stale total would not prove
that both target assertions executed. Whole-suite zero-SKIP wording also
silently broadens this Change beyond its two fixture obligations.

**Minimum correction:** keep concrete counts only as historical proof/evidence.
In normative Design/Tasks, require fresh execution of the exact named focused,
Domain, and Acceptance suites; successful suite/process outcomes with no
unexplained failures; explicit execution (not skip) of both unreadable resolver
assertions; ACL restoration/read recovery; and preservation of the POSIX/root
proof. Record actual observed totals in Apply evidence instead of requiring
today's counts. Do not redesign the ACL helper or add a verification subsystem.

## Required assessments

- Complexity/minimality: implementation shape is otherwise minimal and
  proportional—three test-only files at most, no production/control-plane
  growth.
- New content/scope drift: ACL mechanics, cleanup, and pre-archive proof are
  necessary within approved scope. Only the fixed whole-suite counts/zero-SKIP
  wording overreaches that boundary.

Managed OpenSpec `1.10.0` current/all strict validation passed `23/23`, and
`git diff --check` passed; these structural checks do not cure the semantic
literal defect.

Next boundary: `revise-propose`.

STOP.
