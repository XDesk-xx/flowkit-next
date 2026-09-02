# Action — Revise Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: correct-archive-handoff-and-cross-platform-verification-discipline
role: author
action: revise-apply
base: 39ef634bc7680af0494d4d918adf58e338601a83
projectOrdinal: 025
changeStartSequence: 061
run: 20260902-077-revise-apply
physicalRunGroup: 006
input: 20260902-076-review-apply APPROVED + Owner-authorized correction after archive preparation exposed a post-convergence blocker
owner-authority: stale Reviewer Guidance test correction + archive post-convergence verification
```

076 approved the exact 075 candidate for archive. The subsequent non-mutating archive preparation exercised canonical convergence and exposed one correction-requiring blocker before a valid archive could be retained: `tests/unit/domain/reviewer-action-guidance.test.ts` still pinned historical `TEMPORARY-RUN-SURFACE-GUIDANCE.md` text to the current canonical Author spec, so the converged canonical candidate failed one domain test even though OpenSpec structural convergence itself passed.

Owner authorized exactly two bounded revise-apply corrections:

1. move the historical-provenance assertion to the actual archived `021-converge-author-action-guidance` spec instead of requiring stale phase text in the current canonical spec;
2. strengthen product/bootstrap archive preparation HOW so an isolated canonical-convergence dry-run must be followed by affected domain verification and any materially applicable engineering gates against the converged candidate bytes before real archive mutation.

No Proposal/spec/design/task semantics, Core source, dependency, Policy, lifecycle, Memo, architecture, Action identity or control-plane surface is changed by this revision.

Proof of the strengthened preparation on an isolated copy:

```text
OpenSpec convergence dry-run       4 added / 4 modified / 1 removed
post-convergence domain            178/178 PASS, 0 skipped
post-convergence typecheck         PASS
post-convergence build             PASS
post-convergence Prettier          PASS
post-convergence ESLint            PASS
post-convergence forbidden check   PASS
post-convergence dependency health 59 modules / 219 deps / 0 violations
post-convergence entropy           25/25 reachable
post-convergence OpenSpec          17/17 strict PASS
post-convergence git diff --check  PASS
```

The unarchived revised candidate independently passes full domain 178/178, all engineering gates, OpenSpec 18/18 strict and `git diff --check`.

The 076 archive approval no longer applies to the mutated bytes. Next boundary: `review-apply`.

STOP.
