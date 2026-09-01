# Action — Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: author
action: apply
input: 20260901-019-review-propose
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
skills:
  .agents/skills/openspec-apply-change
  .agents/skills/implementation-convergence
```

## Approved boundary

019 approved the revised Proposal with no blocking findings and `applyAllowed: true`.

Change 2 remains Guidance-only:

```text
7 canonical Author product Guidance entries
+ 1 independent bootstrap archive wrapper
+ focused Guidance tests
```

No Flowkit Core/lifecycle/Policy/ActionPackage/Run-Result contract mutation is allowed by this Apply.

## Implemented

Created exactly seven Author canonical product entries:

```text
skills/actions/explore/SKILL.md
skills/actions/revise-explore/SKILL.md
skills/actions/propose/SKILL.md
skills/actions/revise-propose/SKILL.md
skills/actions/apply/SKILL.md
skills/actions/revise-apply/SKILL.md
skills/actions/archive/SKILL.md
```

Each file carries its own Flowkit-specific normative HOW under the existing single-file Guidance hash contract.

Added one independent D03/D04 bootstrap wrapper:

```text
.agents/skills/archive/SKILL.md
```

It derives the Delivery manifest ordinal and reuses the existing independent OpenSpec archive mechanics without consuming candidate product Guidance.

Added focused tests:

```text
tests/unit/domain/author-action-guidance.test.ts
```

## Archive invariant

Canonical and bootstrap archive HOW now use:

```text
YYYY-MM-DD-<1-based-manifest-position:03d>-<semantic ChangeId>
```

Cancelled earlier manifest entries preserve their positions.

Archive Guidance executes only after Flowkit/Policy already supplied exact legal Action `archive`, while the Change is still active. `completed` is post-archive materialization, not an archive precondition.

## Preserved boundaries

```text
src/**                                     unchanged
package.json / pnpm-lock / workspace       unchanged
.agents/skills/openspec-archive-change     unchanged
TEMPORARY-RUN-SURFACE-GUIDANCE.md          retained
historical D02/D03 archive paths           retained
Reviewer product Guidance                  not pulled forward
self-hosting convergence                   not introduced
```

## Verification

Exact Node:

```text
22.23.2
```

Final candidate checks:

```text
Guidance-focused tests        13 / 13 PASS, 0 skip
domain tests                  161 / 161 PASS, 0 skip
detached acceptance           4 / 4 PASS
git diff --check              PASS
Prettier                      PASS
ESLint                        PASS
forbidden tracked artifacts   PASS
TypeScript typecheck          PASS
dependency health             PASS (58 modules / 213 deps / 0 violations)
repository entropy            PASS (25 / 25 production modules reachable)
build                         PASS
OpenSpec Change strict        PASS
OpenSpec all strict           16 / 16 PASS
tasks                         15 / 15 complete
```

## Complexity / scope drift

```text
new Core subsystem        NONE
new lifecycle             NONE
new Standard Action       NONE
Registry/Router/Runtime   NONE
self-hosting takeover     NONE
historical migration      NONE
scope drift               NONE
```

## Result

```text
PASS
next boundary: review-apply
archive: NOT PERFORMED
next Change: NOT ACTIVATED
Delivery finalization: NOT PERFORMED
Git authority action: NONE
```

## STOP

STOP at `review-apply`.
