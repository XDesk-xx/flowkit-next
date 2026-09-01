# Action — Revise Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-reviewer-action-guidance
role: author
action: revise-apply
base: 10ae02c75ef72c7f410f0933ce952351b0486ea6
projectOrdinal: 024
input: 20260901-057-review-apply
owner-authority: post-review pre-archive semantic-parity correction
run: 20260901-058-revise-apply
physicalRunGroup: 005
```

057 was APPROVED, but Owner authorized a bounded revise-apply after the explicit pre-archive inspection found two semantic-parity omissions caused by Guidance compression.

Exact correction only:

- restore `actors` to bootstrap `review-explore` Owner/input-boundary review;
- restore `persistence / migration impact when materially relevant` to product and bootstrap `review-propose` design review;
- add focused regression assertions for those two preserved semantics.

No Proposal/spec/task, Core, dependency, Memo, architecture, temporary-bridge, lifecycle, or self-hosting scope is changed.

Verification:

```text
Reviewer Guidance focused    5/5 PASS
full domain                173/173 PASS
typecheck                    PASS
build                        PASS
ESLint                       PASS
Prettier                     PASS
forbidden artifacts          PASS
Dependency Health            59 modules / 219 deps / 0 violations
Repository Entropy           25/25 reachable
OpenSpec Change strict       PASS
OpenSpec all strict          17/17 PASS
git diff --check             PASS
tasks                         8/8 complete
```

Next boundary: `review-apply`.

STOP.
