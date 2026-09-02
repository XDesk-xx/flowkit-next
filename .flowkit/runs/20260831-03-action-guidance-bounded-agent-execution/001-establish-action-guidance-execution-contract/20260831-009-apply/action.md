# Action — Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: establish-action-guidance-execution-contract
role: author
action: apply
input: 20260831-008-review-propose
approved-proposal: 20260831-008-review-propose
base: 9b32b98db8c989f85ac0e1e5894a91b7e04f05df
stable-manager-base: 4b45552b90ee327488bde3141c51c556e65a2e95
primary-skill: .agents/skills/openspec-apply-change
auxiliary-skill: .agents/skills/implementation-convergence
```

## Approved Apply boundary

Reviewer verdict:

```text
APPROVED
applyAllowed: true
blockingFindings: []
```

Implementation remains limited to:

```text
ActionGuidanceRef + deterministic resolver
ActionPackage exact Guidance-bound envelope
single-Action pre-callback Guidance resolution
existing ActionPackageRef propagation
bounded unit / acceptance fixtures
```

Explicitly not introduced:

```text
Guidance Registry
Skill Registry
Router / Planner / Runtime
transitive Guidance dependency graph
Guidance cache
second execution identity
new Standard Action
new lifecycle state
new Run artifact
self-hosting takeover
```

## Implementation result

Implemented:

```text
StandardActionId
↓
skills/actions/<actionId>/SKILL.md
↓
exact path + content SHA-256 GuidanceRef
↓
ActionPackage
↓
existing ActionPackageRef
↓
existing ApplicableCheck executionInputRef
```

`RunContextRecord` / durable `context.json` remains unchanged.

Production resolver never falls back to `.agents/skills/**`.

During D03/D04 flowkit-next development, `.agents/skills/**` remains the independent external Author/Reviewer bootstrap plane.

## Verification

Exact Node:

```text
22.23.2
```

Focused / full domain:

```text
155 tests
154 PASS
0 FAIL
1 SKIP
```

The single SKIP is the unreadable-file permission fixture because the detached host runs with privileges that cannot reliably enforce an unreadable regular file. Missing, non-regular, final symlink, parent-path redirection and `.agents` non-fallback cases all execute and PASS.

Detached acceptance:

```text
4 / 4 PASS
```

Engineering checks:

```text
git diff --check                    PASS
Prettier                            PASS
ESLint                              PASS
forbidden tracked artifacts         PASS
dependency health                   PASS
repository entropy                  PASS
TypeScript typecheck                PASS
build                               PASS
```

Dependency Health:

```text
57 modules
204 dependencies cruised
0 violations
```

Repository Entropy:

```text
25 / 25 production modules reachable
```

OpenSpec:

```text
change strict validation            PASS
all strict validation               15 / 15 PASS
apply tasks                         14 / 14 complete
```

## Durable Run boundary

Verified unchanged:

```text
src/domain/run-result-persistence.ts
→ no diff

context.json / result.json schema
→ no Guidance field added
```

## Stable Core self-hosting boundary

Preserved:

```text
flowkit-next D03/D04 self-development
→ .agents/skills/** independent bootstrap plane

product-side managed Guidance
→ skills/actions/**

production fallback from skills/actions to .agents
→ forbidden

self-hosting convergence before Stable Core closure
→ forbidden
```

## Result

```text
PASS
```

Implementation is ready for independent `review-apply`.

## STOP

Do not archive.

Do not advance to the next Change.

Flowkit next boundary:

```text
review-apply
```
